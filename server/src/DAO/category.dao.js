import mongoose from "mongoose";
import Category from "../models/category.model.js";

export const findCategory = async ({ name, slug }) => {
  const category = await Category.findOne({
    $or: [{ name }, { slug }],
  });
  return category;
};

export const createCategoryDAO = async ({
  name,
  slug,
  description,
  image = "",
  imageId = null,
  isActive = false,
}) => {
  const category = await Category.create({
    name,
    slug,
    description,
    image,
    imageId,
    isActive,
  });
  return category;
};

export const getCategoriesForAdmin = async () => {
  return await Category.find({}).sort({ createdAt: -1 });
};

export const getAllActiveCategoriesDAO = async () => {
  return await Category.find({ isActive: true }).sort({ name: 1 });
};

export const findCategoryBySlugDAO = async (slug) => {
  return await Category.findOne({ isActive: true, slug });
};

export const findCategoryById = async (id) => {
  if (!mongoose.isValidObjectId(id)) return null;
  return await Category.findById(id);
};

export const updateCategoryDAO = async ({ id, updateData }) => {
  return await Category.findByIdAndUpdate(
    id,
    { $set: updateData },
    {
      new: true,
      runValidators: true,
    },
  );
};

export const deleteCategoryDAO = async (id) => {
  return await Category.findByIdAndDelete(id);
};
