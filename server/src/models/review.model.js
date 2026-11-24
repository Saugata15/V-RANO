import mongoose from "mongoose";
import { MAX_RATING, MIN_RATING } from "../constants/review.constants.js";

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: MIN_RATING,
      max: MAX_RATING,
      validate: {
        validator: Number.isInteger,
        message: "Rating must be a whole number",
      },
    },
    title: {
      type: String,
      trim: true,
      maxlength: 80,
      default: "",
    },
    comment: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 1000,
    },
  },
  { timestamps: true },
);

reviewSchema.index({ user: 1, productId: 1 }, { unique: true });
reviewSchema.index({ productId: 1, createdAt: -1 });
reviewSchema.index({ productId: 1, rating: 1 });

const Review = mongoose.model("Review", reviewSchema);

export default Review;
