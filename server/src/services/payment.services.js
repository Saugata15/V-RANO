import Razorpay from "razorpay";
import config from "../config/config.js";
import { AppError } from "../utils/AppError.js";

let client;

const getClient = () => {
  if (!client) {
    const RAZORPAY_KEY_ID = config.RAZORPAY_KEY_ID;
    const RAZORPAY_KEY_SECRET = config.RAZORPAY_KEY_SECRET;

    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      throw new AppError(500, "Payment gateway is not configured");
    }

    client = new Razorpay({
      key_id: RAZORPAY_KEY_ID,
      key_secret: RAZORPAY_KEY_SECRET,
    });
  }
  return client;
};

const toPaise = (rupees) => Math.round(rupees * 100);

const safeEqual = (a, b) => {
  const first = Buffer.from(String(a));
  const second = Buffer.from(String(b));
  return (
    first.length === second.length && crypto.timingSafeEqual(first, second)
  );
};

export const createRazorpayOrder = async ({ amount, receipt, notes = {} }) => {
  try {
    return await getClient().orders.create({
      amount: toPaise(amount),
      currency: "INR",
      receipt, // max 40 chars; our order number fits
      notes,
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error("Razorpay order creation failed", error);
    throw new AppError(502, "Could not start the payment. Please try again.");
  }
};

export const buildCheckoutPayload = (order) => ({
  keyId: config.RAZORPAY_KEY_ID,
  razorpayOrderId: order.payment.razorpayOrderId,
  amount: toPaise(order.totalAmount),
  currency: "INR",
  orderId: order._id,
  orderNumber: order.orderNumber,
  expiresAt: order.paymentExpiresAt,
  prefill: {
    name: order.shippingAddress.fullName,
    contact: order.shippingAddress.phone,
  },
});
