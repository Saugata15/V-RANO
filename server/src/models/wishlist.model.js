import mongoose from "mongoose";

const wishlistSchema = new mongoose.Schema(
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
  },
  { timestamps: true },
);

// One row per user + product; also makes add race-safe
wishlistSchema.index({ user: 1, productId: 1 }, { unique: true });
wishlistSchema.index({ user: 1, createdAt: -1 });
wishlistSchema.index({ productId: 1 });

const Wishlist = mongoose.model("Wishlist", wishlistSchema);

export default Wishlist;