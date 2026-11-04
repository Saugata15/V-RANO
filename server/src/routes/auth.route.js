import { Router } from "express";
import { loginValidator, registerValidator } from "../validators/auth.validator.js";
import { validate } from "../middlewares/validate.middleware.js";
import asyncHandler from "../utils/asyncHandler.js";
import { loginController, registerController } from "../controllers/auth.controller.js";

const router = Router();

router.post("/register", registerValidator, validate, asyncHandler(registerController));

router.post("/login", loginValidator, validate, asyncHandler(loginController));

export default router;