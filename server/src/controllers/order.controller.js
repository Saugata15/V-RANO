import crypto from "node:crypto";
import {
  createOrderDAO,
  decrementVariantStockDAO,
  findOrderByIdDAO,
  findOrderByIdForUserDAO,
  findUserAddressDAO,
  getAllOrdersForAdminDAO,
  getOrderDetailsForAdminDAO,
  getOrdersByUserDAO,
  restoreItemsStockDAO,
  transitionOrderStatusDAO,
} from "../DAO/order.dao.js";
import { AppError } from "../utils/AppError.js";
import { clearCartDAO, getCartDAO } from "../DAO/cart.dao.js";
import { MAX_QUANTITY_PER_ITEM } from "../constants/product.constants.js";
import {
  FREE_SHIPPING_THRESHOLD,
  ORDER_STATUS_TRANSITIONS,
  PAYMENT_WINDOW_MINUTES,
  SHIPPING_FEE,
  USER_CANCELLABLE_STATUSES,
} from "../constants/order.constants.js";
import {
  buildCheckoutPayload,
  createRazorpayOrder,
  refundIfPaid,
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

// Admin views Orders list
export const getAllOrdersForAdminController = async (req, res) => {
  const { page = 1, limit = 20, status, search } = req.query;

  const pageNumber = Number(page);
  const limitNumber = Number(limit);
  const skip = (pageNumber - 1) * limitNumber;

  const { orders, totalOrders } = await getAllOrdersForAdminDAO({
    skip,
    limit: limitNumber,
    status,
    search,
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

// Admin views single Order Details
export const getOrderDetailsForAdminController = async (req, res) => {
  const order = await getOrderDetailsForAdminDAO(req.params.id);

  if (!order) {
    throw new AppError(404, "Order not found");
  }

  sendSuccess(res, 200, "Order fetched successfully", { order });
};

// Admin updates order status
export const updateOrderStatusController = async (req, res) => {
  const { id } = req.params;
  const { status, note = "" } = req.body;

  const order = await findOrderByIdDAO(id);

  if (!order) {
    throw new AppError(404, "Order not found");
  }

  const allowed = ORDER_STATUS_TRANSITIONS[order.orderStatus] ?? [];

  if (!allowed.includes(status)) {
    throw new AppError(
      400,
      `Cannot change order from ${order.orderStatus} to ${status}`,
    );
  }

  const extraSet = {};

  if (status === "delivered") {
    extraSet.deliveredAt = new Date();
    // Cash on delivery: payment is collected at the door
    if (order.paymentMethod === "cod") extraSet.paymentStatus = "paid";
  }

  if (status === "cancelled") {
    extraSet.cancelledAt = new Date();
    extraSet.cancelReason = note;
  }

  // Only succeeds if the status hasn't changed since we read it
  const updatedOrder = await transitionOrderStatusDAO({
    orderId: id,
    fromStatuses: [order.orderStatus],
    toStatus: status,
    note,
    extraSet,
  });

  if (!updatedOrder) {
    throw new AppError(409, "Order status changed. Please refresh and retry.");
  }

  let finalOrder = updatedOrder;

  if (status === "cancelled") {
    await restoreItemsStockDAO(updatedOrder.items);
    finalOrder = await refundIfPaid(updatedOrder);
  }

  sendSuccess(res, 200, "Order status updated successfully", {
    order: finalOrder,
  });
};

// Cancel my order (until it ships). Paid online orders are refunded.
export const cancelMyOrderController = async (req, res) => {
  const { id } = req.params;
  const reason = req.body?.reason ?? "";

  const cancelledOrder = await transitionOrderStatusDAO({
    orderId: id,
    userId: req.user._id,
    fromStatuses: USER_CANCELLABLE_STATUSES,
    toStatus: "cancelled",
    note: reason || "Cancelled by customer",
    extraSet: {
      cancelledAt: new Date(),
      cancelReason: reason,
      paymentExpiresAt: null,
    },
  });

  if (!cancelledOrder) {
    const existing = await findOrderByIdForUserDAO({
      orderId: id,
      userId: req.user._id,
    });

    if (!existing) {
      throw new AppError(404, "Order not found");
    }

    throw new AppError(
      409,
      `Order cannot be cancelled once it is ${existing.orderStatus}`,
    );
  }

  await restoreItemsStockDAO(cancelledOrder.items);
  const order = await refundIfPaid(cancelledOrder);

  sendSuccess(res, 200, "Order cancelled successfully", { order });
};
