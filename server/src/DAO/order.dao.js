import Address from "../models/address.model.js";
import Order from "../models/order.model.js";
import Product from "../models/product.model.js";

export const findUserAddressDAO = async ({ addressId, userId }) => {
  return await Address.findOne({ _id: addressId, user: userId }).lean();
};

export const createOrderDAO = async (orderData) => {
  return await Order.create(orderData);
};

export const decrementVariantStockDAO = async ({
  productId,
  size,
  color,
  quantity,
}) => {
  const result = await Product.updateOne(
    {
      _id: productId,
      status: "active",
      variants: { $elemMatch: { size, color, stock: { $gte: quantity } } },
    },
    { $inc: { "variants.$.stock": -quantity } },
  );
  return result.modifiedCount === 1;
};

export const restoreVariantStockDAO = async ({
  productId,
  size,
  color,
  quantity,
}) => {
  const result = await Product.updateOne(
    { _id: productId, variants: { $elemMatch: { size, color } } },
    { $inc: { "variants.$.stock": quantity } },
  );

  return result.modifiedCount === 1;
};

export const restoreItemsStockDAO = async (items) => {
  const results = await Promise.allSettled(
    items.map((item) => restoreVariantStockDAO(item)),
  );

  results.forEach((result, index) => {
    if (result.status === "rejected" || result.value === false) {
      console.error(
        `Failed to restore stock for product ${items[index].productId}`,
        result.reason ?? "",
      );
    }
  });
};

export const findOrderByIdForUserDAO = async ({ orderId, userId }) => {
  return await Order.findOne({ _id: orderId, user: userId }).lean();
};

export const findOrderByIdDAO = async (orderId) => {
  return await Order.findById(orderId);
};

export const getOrdersByUserDAO = async ({ userId, status, skip, limit }) => {
  const filter = { user: userId };
  if (status) filter.orderStatus = status;

  const [orders, totalOrders] = await Promise.all([
    Order.find(filter)
      .select("-statusHistory")
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Order.countDocuments(filter),
  ]);

  return { orders, totalOrders };
};

export const findOrderByRazorpayOrderIdDAO = async (razorpayOrderId) => {
  return await Order.findOne({ "payment.razorpayOrderId": razorpayOrderId });
};

export const markOrderPaidDAO = async ({ orderId, razorpayPaymentId }) => {
  return await Order.findOneAndUpdate(
    { _id: orderId, orderStatus: "pending_payment" },
    {
      $set: {
        orderStatus: "placed",
        paymentStatus: "paid",
        paymentExpiresAt: null,
        "payment.razorpayPaymentId": razorpayPaymentId,
        "payment.paidAt": new Date(),
      },
      $push: {
        statusHistory: {
          status: "placed",
          note: "Payment received",
          changedAt: new Date(),
        },
      },
    },
    { new: true },
  );
};

export const setPaymentStatusDAO = async ({
  orderId,
  paymentStatus,
  extraSet = {},
}) => {
  return await Order.findByIdAndUpdate(
    orderId,
    { $set: { paymentStatus, ...extraSet } },
    { new: true },
  );
};

export const getAllOrdersForAdminDAO = async ({
  skip,
  limit,
  status,
  search,
}) => {
  const filter = {};

  if (status) filter.orderStatus = status;

  if (search) {
    const escapedSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.orderNumber = { $regex: `^${escapedSearch}`, $options: "i" };
  }

  const [orders, totalOrders] = await Promise.all([
    Order.find(filter)
      .select("-statusHistory")
      .populate("user", "name email")
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Order.countDocuments(filter),
  ]);

  return { orders, totalOrders };
};

export const getOrderDetailsForAdminDAO = async (orderId) => {
  return await Order.findById(orderId).populate("user", "name email").lean();
};

export const transitionOrderStatusDAO = async ({
  orderId,
  userId,
  fromStatuses,
  toStatus,
  note = "",
  extraSet = {},
}) => {
  const filter = { _id: orderId, orderStatus: { $in: fromStatuses } };
  if (userId) filter.user = userId;

  return await Order.findOneAndUpdate(
    filter,
    {
      $set: { orderStatus: toStatus, ...extraSet },
      $push: {
        statusHistory: { status: toStatus, note, changedAt: new Date() },
      },
    },
    { new: true, runValidators: true },
  );
};

export const findExpiredPendingOrdersDAO = async (now = new Date()) => {
  return await Order.find({
    orderStatus: "pending_payment",
    paymentExpiresAt: { $lte: now },
  })
    .select("_id")
    .limit(50)
    .lean();
};

export const existsOrderWithProductDAO = async (productId) => {
  const order = await Order.exists({ "items.productId": productId });
  return Boolean(order);
};