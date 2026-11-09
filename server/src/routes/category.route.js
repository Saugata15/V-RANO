import { Router } from "express";
import multer from "multer";
import { requireAdmin, requireAuth } from "../middlewares/auth.middleware.js";
import asyncHandler from "../utils/asyncHandler.js";
import { createCategory } from "../controllers/category.controller.js";
import { AppError } from "../utils/AppError.js";

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 2 * 1024 * 1024,
        files: 1,
    },
    fileFilter: (_req, file, callback) => {
        const supportedTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
        if (!supportedTypes.includes(file.mimetype)) {
            return callback(
                new AppError(400, "Avatar must be a JPEG, PNG or WebP image"),
            );
        }
        callback(null, true);
    }

});

const parseCategoryImageUpload = (req, res, next) => {
  upload.single("image")(req, res, (error) => {
    if (error instanceof multer.MulterError) {
      const statusCode = error.code === "LIMIT_FILE_SIZE" ? 413 : 400;
      return next(
        new AppError(statusCode, "Invalid category image upload", [
          { field: "image", message: error.message },
        ]),
      );
    }
    next(error);
  });
};

const router = Router();

router.post(
    "/",
    asyncHandler(requireAuth),
    requireAdmin,
    parseCategoryImageUpload,
    asyncHandler(createCategory),
);

export default router;
