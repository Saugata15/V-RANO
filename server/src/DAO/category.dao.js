import mongoose from "mongoose";
import Category from "../models/category.model.js";

export const findCategoryDAO = async ({ gender, name, slug }) => {
  const category = await Category.findOne({
    $or: [{ gender, name }, { slug }],
  });
  return category;
};

export const createCategoryDAO = async ({
  name,
  slug,
  gender,
  description,
  image = "",
  imageId = null,
  isActive = false,
}) => {
  return await Category.create({
    name,
    slug,
    gender,
    description,
    image,
    imageId,
    isActive,
  });
};

export const getCategoriesForAdminDAO = async (gender) => {
  const filter = gender ? { gender } : {};
  return await Category.find(filter).sort({ createdAt: -1 });
};

export const getAllActiveCategoriesDAO = async (gender) => {
  const filter = { isActive: true };
  if (gender) filter.gender = { $in: [gender, "unisex"] };
  return await Category.find(filter).sort({ name: 1 });
};

export const findCategoryBySlugDAO = async (slug) => {
  return await Category.findOne({ isActive: true, slug });
};

export const findCategoryByIdDAO = async (id) => {
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
