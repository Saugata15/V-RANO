export const ORDER_STATUSES = [
  "pending_payment", // online order created, waiting for the Razorpay payment
  "placed",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
];

export const PAYMENT_METHODS = ["cod", "razorpay"];

export const PAYMENT_STATUSES = [
  "pending",
  "paid",
  "failed",
  "refund_pending",
  "refunded",
];