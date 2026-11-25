import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

import config from "../config/config.js";
import authRoutes from "../routes/auth.route.js";
import categoryRoutes from "../routes/category.route.js";
import productRoutes from "../routes/product.route.js";
import cartRoutes from "../routes/cart.route.js";
import addressRoutes from "../routes/address.route.js";
import orderRoutes from "../routes/order.route.js";
import wishlistRouter from "./routes/wishlist.route.js";
import { productReviewRouter, reviewRouter } from "../routes/review.route.js";
import { errorHandler } from "../middlewares/error.middleware.js";
import passport from "../config/passport.js";
import asyncHandler from "../utils/asyncHandler.js";
import { razorpayWebhookController } from "../controllers/payment.controller.js";
import { globalApiLimiter } from "../middlewares/rateLimit/api.limiter.js";

const app = express();

app.use(
    cors({
        origin: config.CLIENT_URL,
        credentials: true,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
        allowedHeaders: ["Content-Type", "Authorization", "X-CSRF-Token"],
    }),
);
app.use("/api", globalApiLimiter);

app.post(
    "/api/payments/razorpay/webhook",
    express.raw({ type: "application/json" }),
    asyncHandler(razorpayWebhookController),
);

app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());

app.use("/api/auth", authRoutes);
app.use("/api/category", categoryRoutes);
app.use("/api/products/:productId/reviews", productReviewRouter);
app.use("/api/reviews", reviewRouter);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/addresses", addressRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/wishlist", wishlistRouter);

// error middleware
app.use(errorHandler);

export default app;
