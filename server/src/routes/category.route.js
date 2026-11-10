import { Router } from "express";
import multer from "multer";
import { requireAdmin, requireAuth } from "../middlewares/auth.middleware.js";
import asyncHandler from "../utils/asyncHandler.js";
import {
  createCategory,
  deleteCategory,
  findCategoryBySlug,
  getAllActiveCategories,
  getAllCategories,
  updateCategory,
  updateCategoryStatus,
} from "../controllers/category.controller.js";
import { AppError } from "../utils/AppError.js";
import { createCategoryValidator, mongoIdValidator, updateCategoryStatusValidator, updateCategoryValidator } from "../validators/category.validator.js";
import { validate } from "../middlewares/validate.middleware.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 2 * 1024 * 1024,
    files: 1,
  },
  fileFilter: (_req, file, callback) => {
    const supportedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/jpg",
    ];
    if (!supportedTypes.includes(file.mimetype)) {
      return callback(
        new AppError(400, "Avatar must be a JPEG, PNG or WebP image"),
      );
    }
    callback(null, true);
  },
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

// Create a category by admin
router.post(
  "/",
  asyncHandler(requireAuth),
  requireAdmin,
  parseCategoryImageUpload,
  createCategoryValidator,
  validate,
  asyncHandler(createCategory),
);

// Get all categories by admin
router.get(
  "/admin",
  asyncHandler(requireAuth),
  requireAdmin,
  asyncHandler(getAllCategories),
);

// Get all active categories by users
router.get(
  "/",
  asyncHandler(requireAuth),
  asyncHandler(getAllActiveCategories),
);

// Find categories by slug
router.get(
  "/:slug",
  asyncHandler(requireAuth),
  asyncHandler(findCategoryBySlug),
);

// update category by Admin
router.patch(
    "/:id",
    asyncHandler(requireAuth),
    requireAdmin,
    parseCategoryImageUpload,
    updateCategoryValidator,
    validate,
    asyncHandler(updateCategory),
);

// delete category by Admin
router.delete(
    "/:id",
    asyncHandler(requireAuth),
    requireAdmin,
    mongoIdValidator,
    validate,
    asyncHandler(deleteCategory),
)

// update category status
router.patch(
    "/:id/status",
    asyncHandler(requireAuth),
    requireAdmin,
    updateCategoryStatusValidator,
    validate,
    asyncHandler(updateCategoryStatus),
);

export default router;
