import { MAX_QUANTITY_PER_ITEM } from "../constants/product.constants.js";
import {
  clearCartDAO,
  findCartItemDAO,
  getCartDAO,
  getOrCreateCartDAO,
  removeCartItemDAO,
  updateCartItemQuantityDAO,
} from "../DAO/cart.dao.js";
import { findCategoryByIdDAO } from "../DAO/category.dao.js";
import { findActiveProductByIdDAO } from "../DAO/product.dao.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { AppError } from "../utils/AppError.js";

const round = (value) => Math.round(value * 100) / 100;

const emptyCart = () => ({
  items: [],
  totals: { itemCount: 0, subtotal: 0, unavailableCount: 0 },
});

export const buildCartResponse = (cart) => {
  if (!cart || cart.items.length === 0) return emptyCart();

  let itemCount = 0;
  let subtotal = 0;
  let unavailableCount = 0;

  const items = cart.items.map((item) => {
    const product = item.productId; // populated; null if the product was deleted

    let stock = 0;
    let unavailableReason = null;

    if (
      !product ||
      product.status !== "active" ||
      !product.categoryId?.isActive
    ) {
      unavailableReason = "PRODUCT_UNAVAILABLE";
    } else {
      const variant = product.variants.find(
        (v) => v.size === item.size && v.color === item.color,
      );

      if (!variant) {
        unavailableReason = "VARIANT_UNAVAILABLE";
      } else {
        stock = variant.stock;

        if (stock === 0) unavailableReason = "OUT_OF_STOCK";
        else if (item.quantity > stock)
          unavailableReason = "INSUFFICIENT_STOCK";
      }
    }

    const isAvailable = unavailableReason === null;

    if (isAvailable) {
      itemCount += item.quantity;
      subtotal += product.price * item.quantity;
    } else {
      unavailableCount += 1;
    }

    const primaryImage =
      product?.images?.find((image) => image.isPrimary) ?? product?.images?.[0];

    return {
      _id: item._id,
      productId: product?._id ?? null,
      size: item.size,
      color: item.color,
      quantity: item.quantity,
      title: product?.title ?? null,
      slug: product?.slug ?? null,
      image: primaryImage?.url ?? null,
      price: product?.price ?? null,
      compareAtPrice: product?.compareAtPrice ?? null,
      stock,
      lineTotal: isAvailable ? round(product.price * item.quantity) : 0,
      isAvailable,
      unavailableReason,
    };
  });

  return {
    items,
    totals: { itemCount, subtotal: round(subtotal), unavailableCount },
  };
};

// GET Cart
export const getCartController = async (req, res) => {
  const userId = req.user._id;
  const cart = await getCartDAO(userId);

  sendSuccess(res, 200, "Cart fetched successfully", {
    cart: buildCartResponse(cart),
  });
};

// Add to Cart
export const addToCartController = async (req, res) => {
  const userId = req.user._id;
  const { productId, size, color, quantity = 1 } = req.body;

  const product = await findActiveProductByIdDAO(productId);

  if (!product) {
    throw new AppError(404, "Product not found or inactive");
  }

  const category = await findCategoryByIdDAO(product.categoryId);

  if (!category || !category.isActive) {
    throw new AppError(404, "Product not found");
  }

  const variant = product.variants.find(
    (item) => item.color === color && item.size === size,
  );

  if (!variant) {
    throw new AppError(400, "Selected size and color are not available");
  }

  if (variant.stock === 0) {
    throw new AppError(400, "Selected variant is out of stock");
  }

  let cart = await getOrCreateCartDAO(userId);

  const existingItem = cart.items.find(
    (item) =>
      item.productId.toString() === productId.toString() &&
      item.color === color &&
      item.size === size,
  );

  const newQuantity = existingItem
    ? existingItem.quantity + quantity
    : quantity;

  if (newQuantity > MAX_QUANTITY_PER_ITEM) {
    throw new AppError(400, `Maximum ${MAX_QUANTITY_PER_ITEM} items allowed per product`);
  }

  if (newQuantity > variant.stock) {
    throw new AppError(400, `Only ${variant.stock} items available in stock`);
  }

  if (existingItem) {
    existingItem.quantity = newQuantity;
  } else {
    cart.items.push({
      productId,
      size,
      color,
      quantity,
    });
  }

  await cart.save();

  const updatedCart = await getCartDAO(userId);

  sendSuccess(res, 200, "Product added to cart successfully", {
    cart: buildCartResponse(updatedCart),
  });
};

// Clear Cart
export const clearCartController = async (req, res) => {
  const userId = req.user._id;
  await clearCartDAO(userId);

  sendSuccess(res, 200, "Cart cleared successfully", {
    cart: emptyCart(),
  });
};

// Remove Cart item
export const removeCartItemController = async (req, res) => {
  const { itemId } = req.params;
  const userId = req.user._id;

  const updatedCart = await removeCartItemDAO({ userId, itemId });

  if (!updatedCart) {
    throw new AppError(404, "Cart item not found");
  }

  const cart = buildCartResponse(updatedCart);

  sendSuccess(res, 200, "Item removed from cart successfully", {
    cart,
  });
};

export const updateCartItemController = async (req, res) => {
  const userId = req.user._id;
  const { itemId } = req.params;
  const { quantity } = req.body;

  const item = await findCartItemDAO({ userId, itemId });

  if (!item) {
    throw new AppError(404, "Cart item not found");
  }

  const product = await findActiveProductByIdDAO(item.productId);

  if (!product) {
    throw new AppError(
      400,
      "This product is no longer available. Please remove it from your cart.",
    );
  }

  const category = await findCategoryByIdDAO(product.categoryId);

  if (!category || !category.isActive) {
    throw new AppError(
      400,
      "This product is no longer available. Please remove it from your cart.",
    );
  }

  const variant = product.variants.find(
    (v) => v.size === item.size && v.color === item.color,
  );

  if (!variant) {
    throw new AppError(
      400,
      "Selected size and color are no longer available. Please remove it from your cart.",
    );
  }

  if (variant.stock === 0) {
    throw new AppError(
      400,
      "Selected variant is out of stock. Please remove it from your cart.",
    );
  }

  const maxAllowed = Math.min(variant.stock, MAX_QUANTITY_PER_ITEM);

  if (quantity > maxAllowed) {
    throw new AppError(
      400,
      `You can only have ${maxAllowed} of this item in your cart`,
    );
  }

  const updatedCart = await updateCartItemQuantityDAO({
    userId,
    itemId,
    quantity,
  });

  if (!updatedCart) {
    throw new AppError(404, "Cart item not found");
  }

  sendSuccess(res, 200, "Cart item updated successfully", {
    cart: buildCartResponse(updatedCart),
  });
};
