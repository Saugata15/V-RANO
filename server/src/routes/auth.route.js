import { Router } from "express";
import { loginValidator, registerValidator } from "../validators/auth.validator.js";
import { validate } from "../middlewares/validate.middleware.js";
import asyncHandler from "../utils/asyncHandler.js";
import { loginController, registerController } from "../controllers/auth.controller.js";

const router = Router();

// register via email and password
router.post("/register", registerValidator, validate, asyncHandler(registerController));

// login via email and password
router.post("/login", loginValidator, validate, asyncHandler(loginController));

export default router;