import { findCategoryByIdDAO } from "../DAO/category.dao.js";
import { findActiveProductByIdDAO } from "../DAO/product.dao.js";
import {
  addWishlistItemDAO,
  countWishlistItemsDAO,
  findWishlistItemDAO,
  getWishlistDAO,
  getWishlistProductIdsDAO,
  removeWishlistItemDAO,
} from "../DAO/wishlist.dao.js";
import { MAX_WISHLIST_ITEMS } from "../constants/wishlist.constants.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { AppError } from "../utils/AppError.js";

const getVisibleProductOrThrow = async (productId) => {
  const product = await findActiveProductByIdDAO(productId);

  if (!product) {
    throw new AppError(404, "Product not found");
  }

  const category = await findCategoryByIdDAO(product.categoryId);

  if (!category || !category.isActive) {
    throw new AppError(404, "Product not found");
  }

  return product;
};

// Add to wishlist (idempotent: adding twice is fine)
export const addToWishlistController = async (req, res) => {
  const userId = req.user._id;
  const { productId } = req.params;

  await getVisibleProductOrThrow(productId);

  const existing = await findWishlistItemDAO({ userId, productId });

  if (existing) {
    return sendSuccess(res, 200, "Product is already in your wishlist", {
      isWishlisted: true,
    });
  }

  const count = await countWishlistItemsDAO(userId);

  if (count >= MAX_WISHLIST_ITEMS) {
    throw new AppError(
      400,
      `Your wishlist is full (max ${MAX_WISHLIST_ITEMS} items)`,
    );
  }

  await addWishlistItemDAO({ userId, productId });

  sendSuccess(res, 201, "Added to wishlist", { isWishlisted: true });
};

// Remove from wishlist (idempotent). No product check, so users can
// always clean up items whose product was archived.
export const removeFromWishlistController = async (req, res) => {
  const userId = req.user._id;
  const { productId } = req.params;

  await removeWishlistItemDAO({ userId, productId });

  sendSuccess(res, 200, "Removed from wishlist", { isWishlisted: false });
};

// Wishlist page
export const getWishlistController = async (req, res) => {
  const { page = 1, limit = 20 } = req.query;

  const pageNumber = Number(page);
  const limitNumber = Number(limit);
  const skip = (pageNumber - 1) * limitNumber;

  const { products, totalProducts } = await getWishlistDAO({
    userId: req.user._id,
    skip,
    limit: limitNumber,
  });

  sendSuccess(res, 200, "Wishlist fetched successfully", {
    products,
    pagination: {
      currentPage: pageNumber,
      totalPages: Math.ceil(totalProducts / limitNumber),
      totalProducts,
      limit: limitNumber,
    },
  });
};

// Product IDs only, so product cards can show a filled heart
export const getWishlistIdsController = async (req, res) => {
  const productIds = await getWishlistProductIdsDAO(req.user._id);

  sendSuccess(res, 200, "Wishlist IDs fetched successfully", { productIds });
};