import { createRateLimiter } from "./rateLimit.factory.js";

export const registerLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  message: "Too many registration attempts. Try again later.",
});

export const loginLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  message: "Too many login attempts. Try again in 15 minutes.",
});

// export const forgotPasswordLimiter = createRateLimiter({
//   windowMs: 60 * 60 * 1000,
//   limit: 5,
//   message: "Too many password reset requests. Try again later.",
// });

// export const resetPasswordLimiter = createRateLimiter({
//   windowMs: 15 * 60 * 1000,
//   limit: 5,
//   message: "Too many password reset attempts. Try again later.",
// });

export const refreshLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  message: "Too many refresh requests. Try again later.",
});

export const googleAuthLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  message: "Too many Google authentication requests. Try again later.",
});

export const linkGoogleLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  message: "Too many account linking attempts. Try again later.",
});

export const googleCallbackLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  message: "Too many Google authentication callback requests. Try again later.",
});

export const googleLinkCallbackLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  message: "Too many Google linking callback requests. Try again later.",
});

export const changePasswordLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  message: "Too many password change attempts. Try again later.",
});