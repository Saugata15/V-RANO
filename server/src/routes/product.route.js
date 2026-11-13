import { Router } from "express";
import multer from "multer";
import { requireAdmin, requireAuth } from "../middlewares/auth.middleware.js";
import asyncHandler from "../utils/asyncHandler.js";
import {
  createProductController,
  getActiveProductsController,
  getAllProductsForAdminController,
  getProductDetailsController,
  updateProductController,
  updateProductStatusController,
} from "../controllers/product.controller.js";
import { AppError } from "../utils/AppError.js";
import { parseProductJsonFields } from "../middlewares/product.middleware.js";
import {
  createProductValidator,
  getActiveProductsValidator,
  getAllProductsForAdminValidator,
  updateProductStatusValidator,
  updateProductValidator,
} from "../validators/product.validator.js";
import { validate } from "../middlewares/validate.middleware.js";
import { SUPPORTED_IMAGE_TYPES } from "../constants/product.constants.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 5,
  },
  fileFilter: (_req, file, callback) => {
    if (!SUPPORTED_IMAGE_TYPES.includes(file.mimetype)) {
      return callback(
        new AppError(
          400,
          "Images must be a JPEG, PNG, JPG, AVIF or WebP image",
        ),
      );
    }
    callback(null, true);
  },
});

export const handleImageUpload = (req, res, next) => {
  upload.array("images", 5)(req, res, (error) => {
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

// create product
router.post(
  "/",
  asyncHandler(requireAuth),
  requireAdmin,
  handleImageUpload,
  parseProductJsonFields,
  createProductValidator,
  validate,
  asyncHandler(createProductController),
);

// Get all active products
router.get(
  "/",
  asyncHandler(requireAuth),
  getActiveProductsValidator,
  validate,
  asyncHandler(getActiveProductsController),
);

// Get all products for admin
router.get(
  "/admin",
  asyncHandler(requireAuth),
  requireAdmin,
  getAllProductsForAdminValidator,
  validate,
  asyncHandler(getAllProductsForAdminController),
);

// Get product detail
router.get(
  "/:slug",
  asyncHandler(requireAuth),
  asyncHandler(getProductDetailsController),
);

// Update product details
router.patch(
  "/:id",
  asyncHandler(requireAuth),
  requireAdmin,
  handleImageUpload,
  parseProductJsonFields,
  updateProductValidator,
  validate,
  asyncHandler(updateProductController),
)

// Update product Status
router.patch(
    "/:id/status",
    asyncHandler(requireAuth),
    requireAdmin,
    updateProductStatusValidator,
    validate,
    asyncHandler(updateProductStatusController),
);

export default router;
