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

export const PAYMENT_WINDOW_MINUTES = 15;

export const SHIPPING_FEE = 99;

export const FREE_SHIPPING_THRESHOLD = 999;
