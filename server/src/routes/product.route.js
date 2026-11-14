import { Router } from "express";
import multer from "multer";
import { requireAdmin, requireAuth } from "../middlewares/auth.middleware.js";
import asyncHandler from "../utils/asyncHandler.js";
import {
  createProductController,
  deleteProductController,
  getActiveProductsController,
  getAllProductsForAdminController,
  getFeaturedProductsController,
  getProductDetailsController,
  getProductDetailsForAdminController,
  getRelatedProductsController,
  updateProductController,
  updateProductStatusController,
} from "../controllers/product.controller.js";
import { AppError } from "../utils/AppError.js";
import { parseProductJsonFields } from "../middlewares/product.middleware.js";
import {
  createProductValidator,
  deleteProductValidator,
  getActiveProductsValidator,
  getAllProductsForAdminValidator,
  getFeaturedProductsValidator,
  getProductDetailsForAdminValidator,
  getRelatedProductsValidator,
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
        new AppError(statusCode, "Invalid product image upload", [
          { field: "images", message: error.message },
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

// Get product details
router.get(
  "/:slug",
  asyncHandler(requireAuth),
  asyncHandler(getProductDetailsController),
);

// Get featured products
router.get(
  "/featured",
  asyncHandler(requireAuth),
  getFeaturedProductsValidator,
  validate,
  asyncHandler(getFeaturedProductsController),
);

// Get product details for admin
router.get(
  "/admin/:id",
  asyncHandler(requireAuth),
  requireAdmin,
  getProductDetailsForAdminValidator,
  validate,
  asyncHandler(getProductDetailsForAdminController),
);

// Get related products for users
router.get(
  "/:id/related",
  asyncHandler(requireAuth),
  getRelatedProductsValidator,
  validate,
  asyncHandler(getRelatedProductsController),
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
);

// Update product Status
router.patch(
  "/:id/status",
  asyncHandler(requireAuth),
  requireAdmin,
  updateProductStatusValidator,
  validate,
  asyncHandler(updateProductStatusController),
);

router.delete(
  "/:id",
  asyncHandler(requireAuth),
  requireAdmin,
  deleteProductValidator,
  validate,
  asyncHandler(deleteProductController),
);

export default router;
