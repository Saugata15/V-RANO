import mongoose from "mongoose";
import Category from "../models/category.model.js";

export const findCategory = async ({ name, slug }) => {
    const category = await Category.findOne({
        $or: [{ name }, { slug }]
    })
    return category;
}

export const createCategoryDAO = async ({ name, slug, description, image = "", isActive = false }) => {
    const category = await Category.create({
        name,
        slug,
        description,
        image,
        isActive
    });
    return category;
}