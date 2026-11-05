import { Router } from "express";
import { loginValidator, registerValidator } from "../validators/auth.validator.js";
import { validate } from "../middlewares/validate.middleware.js";
import asyncHandler from "../utils/asyncHandler.js";
import { loginController, logoutController, meController, refreshController, registerController } from "../controllers/auth.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const router = Router();

// register via email and password
router.post("/register", registerValidator, validate, asyncHandler(registerController));

// login via email and password
router.post("/login", loginValidator, validate, asyncHandler(loginController));

// refresh token
router.post("/refresh", asyncHandler(refreshController));

// logout route
router.post("/logout", asyncHandler(logoutController));

// profile route
router.get("/me", asyncHandler(requireAuth), asyncHandler(meController));

export default router;