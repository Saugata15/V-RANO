import mongoose from "mongoose";
import { GENDERS } from "../constants/category.constants.js";

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      minlength: 3,
      maxlength: 30,
    },
    gender: {
      type: String,
      required: true,
      enum: GENDERS,
      lowercase: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
      maxlength: 500,
    },
    image: {
      type: String,
      default: "",
    },
    imageId: {
      type: String,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

categorySchema.index({ gender: 1, name: 1 }, { unique: true });
categorySchema.index({ isActive: 1, gender: 1 });

const Category = mongoose.model("Category", categorySchema);

export default Category;
