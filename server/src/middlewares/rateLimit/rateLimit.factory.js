import { rateLimit } from "express-rate-limit";

export const createRateLimiter = ({
  windowMs,
  limit,
  skipSuccessfulRequests = false,
  message,
}) => {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    skipSuccessfulRequests,
    message: {
      message,
    },
    statusCode: 429,
  });
};
