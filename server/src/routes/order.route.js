import { Router } from "express";
import asyncHandler from "../utils/asyncHandler.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { placeOrderController } from "../controllers/order.controller.js";
import { placeOrderValidator } from "../validators/order.validator.js";
import { validate } from "../middlewares/validate.middleware.js";

const router = Router();

// Place order from cart (COD or Razorpay)
router.post(
  "/",
  asyncHandler(requireAuth),
  placeOrderValidator,
  validate,
  asyncHandler(placeOrderController),
);

export default router;
