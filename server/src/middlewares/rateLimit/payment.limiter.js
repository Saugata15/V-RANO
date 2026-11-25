import { createRateLimiter } from "./rateLimit.factory.js";

export const checkoutLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  limit: 10,
  message: "Too many checkout attempts. Please try again later.",
});

export const paymentVerificationLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  message: "Too many payment verification requests. Please try again later.",
});

export const cancelOrderLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  message: "Too many cancellation requests. Please try again later.",
});