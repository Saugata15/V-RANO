import {
  settleRazorpayPayment,
  verifyWebhookSignature,
} from "../services/payment.services.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { AppError } from "../utils/AppError.js";

export const razorpayWebhookController = async (req, res) => {
  const signature = req.get("x-razorpay-signature");
  const rawBody = req.body;

  if (
    !signature ||
    !Buffer.isBuffer(rawBody) ||
    !verifyWebhookSignature(rawBody, signature)
  ) {
    throw new AppError(400, "Invalid webhook signature");
  }

  const event = JSON.parse(rawBody.toString("utf8"));

  if (event.event === "payment.captured" || event.event === "order.paid") {
    const payment = event.payload?.payment?.entity;

    if (payment?.order_id && payment?.id && payment.status === "captured") {
      // Idempotent: Razorpay may send both events, and may retry
      await settleRazorpayPayment({
        razorpayOrderId: payment.order_id,
        razorpayPaymentId: payment.id,
      });
    }
  }

  sendSuccess(res,200,"Verification completed via webhook");
};
