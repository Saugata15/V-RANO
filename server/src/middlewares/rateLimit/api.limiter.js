import { createRateLimiter } from "./rateLimit.factory.js";

export const globalApiLimiter = createRateLimiter({
  windowMs: 1 * 60 * 1000,
  limit: 120,
  message: "Too many requests. Please slow down.",
});

export const productSearchLimiter = createRateLimiter({
  windowMs: 1 * 60 * 1000,
  limit: 60,
  message: "Too many product search requests. Please try again later.",
});

export const reviewLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  message: "You have submitted too many reviews. Please try again later.",
});

export const avatarUploadLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  limit: 10,
  message: "Too many avatar upload requests. Please try again later.",
});

export const productUploadLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  limit: 10,
  message: "Too many product upload requests. Please try again later.",
});

export const categoryUploadLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  limit: 10,
  message: "Too many category upload requests. Please try again later.",
});