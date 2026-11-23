import crypto from 'node:crypto';
import Razorpay from "razorpay";
import config from "../config/config.js";
import { AppError } from "../utils/AppError.js";
import { findOrderByIdDAO, findOrderByRazorpayOrderIdDAO, markOrderPaidDAO, setPaymentStatusDAO } from '../DAO/order.dao.js';

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

export const verifyPaymentSignature = ({ orderId, paymentId, signature }) => {
  const secret = config.RAZORPAY_KEY_SECRET;
  if (!secret) return false;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  return safeEqual(expected, signature);
};

const refundOrderPayment = async (order, paymentId) => {
  const razorpayPaymentId = paymentId ?? order.payment?.razorpayPaymentId;

  if (!razorpayPaymentId) return order;

  await setPaymentStatusDAO({
    orderId: order._id,
    paymentStatus: "refund_pending",
    extraSet: { "payment.razorpayPaymentId": razorpayPaymentId },
  });

  try {
    const refund = await getClient().payments.refund(razorpayPaymentId, {
      amount: toPaise(order.totalAmount),
      notes: { orderNumber: order.orderNumber },
    });

    return await setPaymentStatusDAO({
      orderId: order._id,
      paymentStatus: "refunded",
      extraSet: { "payment.refundId": refund.id },
    });
  } catch (error) {
    // Stays "refund_pending" so an admin can see it and retry
    console.error(`Refund failed for order ${order.orderNumber}`, error);
    return await findOrderByIdDAO(order._id);
  }
};

export const settleRazorpayPayment = async ({
  razorpayOrderId,
  razorpayPaymentId,
}) => {
  const order = await findOrderByRazorpayOrderIdDAO(razorpayOrderId);

  if (!order) return { status: "order_not_found" };

  if (order.paymentStatus === "paid") {
    return { status: "already_paid", order };
  }

  if (["refund_pending", "refunded"].includes(order.paymentStatus)) {
    return { status: "already_refunded", order };
  }

  const paidOrder = await markOrderPaidDAO({
    orderId: order._id,
    razorpayPaymentId,
  });

  if (paidOrder) return { status: "paid", order: paidOrder };

  const refundedOrder = await refundOrderPayment(order, razorpayPaymentId);

  return { status: "refunded", order: refundedOrder };
};
