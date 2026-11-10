import {
  deleteFile,
  uploadCategoryImage,
} from "../services/storage.services.js";
import { AppError } from "../utils/AppError.js";
import { generateFileName } from "../utils/file.utils.js";
import { createSlug } from "../utils/slug.utils.js";
import {
  createCategoryDAO,
  deleteCategoryDAO,
  findCategory,
  findCategoryById,
  findCategoryBySlugDAO,
  getAllActiveCategoriesDAO,
  getCategoriesForAdmin,
  updateCategoryDAO,
} from "../DAO/category.dao.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { countProductsByCategoryDAO } from "../DAO/product.dao.js";

// Create category by Admin
export const createCategory = async (req, res) => {
  const { name, description, isActive } = req.body;
  const normalizedName = name.trim().toLowerCase();
  const slug = createSlug(normalizedName);

  const existingCategory = await findCategory({ name: normalizedName, slug });

  if (existingCategory) {
    throw new AppError(409, "Category already exists");
  }

  let uploadedFile;

  try {
    if (req.file) {
      uploadedFile = await uploadCategoryImage({
        buffer: req.file.buffer,
        fileName: `category-${generateFileName(req.file.mimetype)}`,
      });
    }

    const category = await createCategoryDAO({
      name: normalizedName,
      slug,
      description,
      image: uploadedFile?.url || "",
      imageId: uploadedFile?.fileId || null,
      isActive: isActive ?? true,
    });

    sendSuccess(res, 201, "Category created successfully", {
      category,
    });
  } catch (error) {
    if (uploadedFile?.fileId) {
      await deleteFile(uploadedFile.fileId).catch(() => { });
    }
    throw error;
  }
};

// Get all categories
export const getAllCategories = async (req, res) => {
  const categories = await getCategoriesForAdmin();

  sendSuccess(res, 200, "Categories found", {
    categories,
  });
};

// Get all active categories
export const getAllActiveCategories = async (req, res) => {
  const categories = await getAllActiveCategoriesDAO();

  sendSuccess(res, 200, "Categories found", {
    categories: categories,
  });
};

// Find category Details for user
export const findCategoryBySlug = async (req, res) => {
  const { slug } = req.params;

  if (!slug || typeof slug !== "string") {
    throw new AppError(400, "Invalid category slug");
  }

  const category = await findCategoryBySlugDAO(slug.trim().toLowerCase());

  if (!category) {
    throw new AppError(404, "Category not found");
  }

  sendSuccess(res, 200, "Category Details fetched", {
    category: category,
  });
};

// Update category by Admin
export const updateCategory = async (req, res) => {
  const { name, description } = req.body;
  const { id } = req.params;

  const category = await findCategoryById(id);

  if (!category) {
    throw new AppError(404, "Category not found");
  }

  const updateData = {};
  let uploadedFile;

  try {
    if (name !== undefined) {
      const normalizedName = name.trim().toLowerCase();
      const slug = createSlug(normalizedName);

      const existingCategory = await findCategory({
        name: normalizedName,
        slug,
      });

      if (existingCategory && existingCategory._id.toString() !== id) {
        throw new AppError(409, "Category already exists");
      }

      updateData.name = normalizedName;
      updateData.slug = slug;
    }

    if (description !== undefined) {
      updateData.description = description.trim();
    }

    if (req.file) {
      uploadedFile = await uploadCategoryImage({
        buffer: req.file.buffer,
        fileName: `category-${generateFileName(req.file.mimetype)}`,
      });

      updateData.image = uploadedFile.url;
      updateData.imageId = uploadedFile.fileId;
    }

    if (Object.keys(updateData).length === 0) {
      throw new AppError(400, "No fields provided for update");
    }

    const updatedCategory = await updateCategoryDAO({ id, updateData });

    if (!updatedCategory) {
      throw new AppError(404, "Category not found");
    }

    if (uploadedFile && category.imageId) {
      await deleteFile(category.imageId).catch(() => { });
    }

    sendSuccess(res, 200, "Category updated successfully", {
      category: updatedCategory,
    });
  } catch (error) {
    if (uploadedFile?.fileId) {
      await deleteFile(uploadedFile.fileId).catch(() => { });
    }

    throw error;
  }
};

// Delete category
export const deleteCategory = async (req, res) => {
  const { id } = req.params;

  const category = await findCategoryById(id);

  if (!category) {
    throw new AppError(404, "Category not found");
  }

  const productCount = await countProductsByCategoryDAO(id);

  if (productCount > 0) {
    throw new AppError(
      409,
      `Cannot delete category. ${productCount} products are associated with it.`,
    );
  }

  const deletedCategory = await deleteCategoryDAO(id);

  if (!deletedCategory) {
    throw new AppError(404, "Category not found");
  }

  if (category.imageId) {
    await deleteFile(category.imageId).catch(() => { });
  }

  sendSuccess(res, 200, "Category deleted successfully");
};

// update category status
export const updateCategoryStatus = async (req, res) => {
  const { id } = req.params;
  const { isActive } = req.body;

  const category = await findCategoryById(id);

  if (!category) {
    throw new AppError(404, "Category not found");
  }

  const updatedCategory = await updateCategoryDAO({
    id,
    updateData: { isActive },
  });

  if (!updatedCategory) {
    throw new AppError(404, "Category not found");
  }

  sendSuccess(res, 200, "Category status updated successfully", {
    category: updatedCategory,
  });
};
