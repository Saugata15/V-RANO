import { Router } from "express";
import asyncHandler from "../utils/asyncHandler.js";
import { requireAdmin, requireAuth } from "../middlewares/auth.middleware.js";
import {
  cancelMyOrderController,
  getAllOrdersForAdminController,
  getMyOrderDetailsController,
  getMyOrdersController,
  getOrderDetailsForAdminController,
  getOrderPaymentController,
  placeOrderController,
  updateOrderStatusController,
  verifyOrderPaymentController,
} from "../controllers/order.controller.js";
import {
  cancelOrderValidator,
  getAllOrdersForAdminValidator,
  getMyOrdersValidator,
  orderIdValidator,
  placeOrderValidator,
  updateOrderStatusValidator,
  verifyOrderPaymentValidator,
} from "../validators/order.validator.js";
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

// My orders
router.get(
  "/",
  asyncHandler(requireAuth),
  getMyOrdersValidator,
  validate,
  asyncHandler(getMyOrdersController),
);

// Admin route to get all orders
router.get(
  "/admin",
  asyncHandler(requireAuth),
  requireAdmin,
  getAllOrdersForAdminValidator,
  validate,
  asyncHandler(getAllOrdersForAdminController),
);

// Admin route to get single order details
router.get(
  "/admin/:id",
  asyncHandler(requireAuth),
  requireAdmin,
  orderIdValidator,
  validate,
  asyncHandler(getOrderDetailsForAdminController),
);

// Admin route to get update single order status
router.patch(
  "/admin/:id/status",
  asyncHandler(requireAuth),
  requireAdmin,
  updateOrderStatusValidator,
  validate,
  asyncHandler(updateOrderStatusController),
);

// "Pay now" for an order still waiting for payment
router.post(
  "/:id/pay",
  asyncHandler(requireAuth),
  orderIdValidator,
  validate,
  asyncHandler(getOrderPaymentController),
);

// Customer route for GET order Details
router.get(
  "/:id",
  asyncHandler(requireAuth),
  orderIdValidator,
  validate,
  asyncHandler(getMyOrderDetailsController),
);

// Verify the payment after the Razorpay popup succeeds
router.post(
  "/:id/verify-payment",
  asyncHandler(requireAuth),
  verifyOrderPaymentValidator,
  validate,
  asyncHandler(verifyOrderPaymentController),
);

// Cancel order
router.patch(
  "/:id/cancel",
  asyncHandler(requireAuth),
  cancelOrderValidator,
  validate,
  asyncHandler(cancelMyOrderController),
);

export default router;
