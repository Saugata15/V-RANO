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

// What an ADMIN can do. "pending_payment" is managed by the system only
// (payment verification, webhook, expiry job, or the customer cancelling).
export const ORDER_STATUS_TRANSITIONS = {
  pending_payment: [],
  placed: ["confirmed", "cancelled"],
  confirmed: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
};

// A customer can cancel until the order ships
export const USER_CANCELLABLE_STATUSES = [
  "pending_payment",
  "placed",
  "confirmed",
];