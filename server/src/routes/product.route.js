import { Router } from "express";
import multer from "multer";
import { requireAdmin, requireAuth } from "../middlewares/auth.middleware.js";
import asyncHandler from "../utils/asyncHandler.js";
import { createProductController } from "../controllers/product.controller.js";
import { AppError } from "../utils/AppError.js";

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 3 * 1024 * 1024,
        files: 5,
    },
    fileFilter: (_req, file, callback) => {
        const supportedTypes = ["image/jpeg", "image/png", "image/webp"];
        if (!supportedTypes.includes(file.mimetype)) {
            return callback(
                new AppError(400, "Images must be a JPEG, PNG, or WebP image"),
            );
        }
        callback(null, true);
    },
});

const router = Router();

router.post(
    "/",
    asyncHandler(requireAuth),
    requireAdmin,
    upload.array("images", 5),
    asyncHandler(createProductController),
);

export default router;
