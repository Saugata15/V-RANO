import crypto from "node:crypto";
import {
  createOrderDAO,
  decrementVariantStockDAO,
  findOrderByIdForUserDAO,
  findUserAddressDAO,
  getOrdersByUserDAO,
  restoreItemsStockDAO,
} from "../DAO/order.dao.js";
import { AppError } from "../utils/AppError.js";
import { clearCartDAO, getCartDAO } from "../DAO/cart.dao.js";
import { MAX_QUANTITY_PER_ITEM } from "../constants/product.constants.js";
import {
  FREE_SHIPPING_THRESHOLD,
  PAYMENT_WINDOW_MINUTES,
  SHIPPING_FEE,
} from "../constants/order.constants.js";
import {
  buildCheckoutPayload,
  createRazorpayOrder,
  settleRazorpayPayment,
  verifyPaymentSignature,
} from "../services/payment.services.js";
import { sendSuccess } from "../utils/apiResponse.js";

const round = (value) => Math.round(value * 100) / 100;

const generateOrderNumber = () => {
  const date = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  const random = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `VRN-${date}-${random}`;
};

// Place order from the logged-in user's cart
export const placeOrderController = async (req, res) => {
  const userId = req.user._id;
  const { addressId, paymentMethod } = req.body;

  const address = await findUserAddressDAO({ addressId, userId });

  if (!address) {
    throw new AppError(404, "Delivery address not found");
  }

  const cart = await getCartDAO(userId);

  if (!cart || cart.items.length === 0) {
    throw new AppError(400, "Your cart is empty");
  }

  const issues = [];
  const orderItems = [];

  for (const item of cart.items) {
    const product = item.productId;

    if (
      !product ||
      product.status !== "active" ||
      !product.categoryId?.isActive
    ) {
      issues.push({
        field: "items",
        message: `${product?.title ?? "An item"} is no longer available`,
      });
      continue;
    }

    const label = `${product.title} (${item.size}, ${item.color})`;
    const variant = product.variants.find(
      (v) => v.size === item.size && v.color === item.color,
    );

    if (!variant) {
      issues.push({
        field: "items",
        message: `${label} is no longer offered`,
      });
      continue;
    }

    if (item.quantity > MAX_QUANTITY_PER_ITEM) {
      issues.push({
        field: "items",
        message: `${label}: maximum ${MAX_QUANTITY_PER_ITEM} per item`,
      });
      continue;
    }

    if (variant.stock < item.quantity) {
      issues.push({
        field: "items",
        message:
          variant.stock === 0
            ? `${label} is out of stock`
            : `${label}: only ${variant.stock} left`,
      });
      continue;
    }

    const primaryImage =
      product.images?.find((image) => image.isPrimary) ?? product.images?.[0];

    orderItems.push({
      productId: product._id,
      title: product.title,
      slug: product.slug,
      image: primaryImage?.url ?? "",
      size: item.size,
      color: item.color,
      quantity: item.quantity,
      price: product.price,
      compareAtPrice: product.compareAtPrice ?? null,
      lineTotal: round(product.price * item.quantity),
    });
  }

  if (issues.length > 0) {
    throw new AppError(
      409,
      "Some items in your cart need your attention",
      issues,
    );
  }

  const subtotal = round(
    orderItems.reduce((acc, curr) => acc + curr.lineTotal, 0),
  );
  const shippingFee = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const totalAmount = round(subtotal + shippingFee);

  const shippingAddress = {
    fullName: address.fullName,
    phone: address.phone,
    line1: address.line1,
    line2: address.line2 ?? "",
    landmark: address.landmark ?? "",
    city: address.city,
    state: address.state,
    postalCode: address.postalCode,
    country: address.country ?? "India",
  };

  const isOnline = paymentMethod === "razorpay";
  const orderNumber = generateOrderNumber();

  const reservedItems = [];
  let order;

  try {
    for (const item of orderItems) {
      const reserved = await decrementVariantStockDAO(item);

      if (!reserved) {
        throw new AppError(
          409,
          `Not enough stock for ${item.title} (${item.size}, ${item.color})`,
        );
      }

      reservedItems.push(item);
    }

    const razorpayOrder = isOnline
      ? await createRazorpayOrder({
          amount: totalAmount,
          receipt: orderNumber,
          notes: { userId: userId.toString() },
        })
      : null;

    order = await createOrderDAO({
      user: userId,
      orderNumber,
      items: orderItems,
      shippingAddress,
      paymentMethod,
      paymentStatus: "pending",
      subtotal,
      shippingFee,
      totalAmount,
      orderStatus: isOnline ? "pending_payment" : "placed",
      paymentExpiresAt: isOnline
        ? new Date(Date.now() + PAYMENT_WINDOW_MINUTES * 60 * 1000)
        : null,
      payment: razorpayOrder
        ? { razorpayOrderId: razorpayOrder.id }
        : undefined,
      statusHistory: [
        {
          status: isOnline ? "pending_payment" : "placed",
          note: isOnline ? "Waiting for payment" : "Order placed",
        },
      ],
    });
  } catch (error) {
    await restoreItemsStockDAO(reservedItems);
    throw error;
  }

  await clearCartDAO(userId).catch((error) =>
    console.error("Failed to clear cart after order", error),
  );

  if (isOnline) {
    return sendSuccess(res, 201, "Order created. Complete the payment.", {
      order,
      payment: buildCheckoutPayload(order),
    });
  }

  sendSuccess(res, 201, "Order placed successfully", { order });
};

// "Pay now" for an order that is still waiting for payment
export const getOrderPaymentController = async (req, res) => {
  const order = await findOrderByIdForUserDAO({
    orderId: req.params.id,
    userId: req.user._id,
  });

  if (!order) {
    throw new AppError(404, "Order not found");
  }

  if (
    order.paymentMethod !== "razorpay" ||
    order.orderStatus !== "pending_payment"
  ) {
    throw new AppError(409, "This order is not waiting for payment");
  }

  if (order.paymentExpiresAt && order.paymentExpiresAt <= new Date()) {
    throw new AppError(
      409,
      "The payment window has expired. Please place the order again.",
    );
  }

  sendSuccess(res, 200, "Payment details fetched", {
    payment: buildCheckoutPayload(order),
  });
};

// My orders (list)
export const getMyOrdersController = async (req, res) => {
  const userId = req.user._id;
  const { page = 1, limit = 10, status } = req.query;

  const pageNumber = Number(page);
  const limitNumber = Number(limit);
  const skip = (pageNumber - 1) * limitNumber;

  const { orders, totalOrders } = await getOrdersByUserDAO({
    userId,
    status,
    skip,
    limit: limitNumber,
  });

  sendSuccess(res, 200, "Orders fetched successfully", {
    orders,
    pagination: {
      currentPage: pageNumber,
      totalPages: Math.ceil(totalOrders / limitNumber),
      totalOrders,
      limit: limitNumber,
    },
  });
};

// My order details
export const getMyOrderDetailsController = async (req, res) => {
  const order = await findOrderByIdForUserDAO({
    orderId: req.params.id,
    userId: req.user._id,
  });

  if (!order) {
    throw new AppError(404, "Order not found");
  }

  sendSuccess(res, 200, "Order fetched successfully", { order });
};

// Called by the frontend after the Razorpay popup succeeds
export const verifyOrderPaymentController = async (req, res) => {
  const { id } = req.params;
  const {
    razorpay_order_id: razorpayOrderId,
    razorpay_payment_id: razorpayPaymentId,
    razorpay_signature: razorpaySignature,
  } = req.body;

  const order = await findOrderByIdForUserDAO({
    orderId: id,
    userId: req.user._id,
  });

  if (!order) {
    throw new AppError(404, "Order not found");
  }

  if (
    order.paymentMethod !== "razorpay" ||
    order.payment?.razorpayOrderId !== razorpayOrderId
  ) {
    throw new AppError(400, "Payment does not match this order");
  }

  const isValid = verifyPaymentSignature({
    orderId: razorpayOrderId,
    paymentId: razorpayPaymentId,
    signature: razorpaySignature,
  });

  if (!isValid) {
    throw new AppError(400, "Payment verification failed");
  }

  const result = await settleRazorpayPayment({
    razorpayOrderId,
    razorpayPaymentId,
  });

  if (result.status === "refunded" || result.status === "already_refunded") {
    throw new AppError(
      409,
      "This order expired before the payment completed. Your payment will be refunded.",
    );
  }

  if (result.status === "order_not_found") {
    throw new AppError(404, "Order not found");
  }

  sendSuccess(res, 200, "Payment verified successfully", {
    order: result.order,
  });
};