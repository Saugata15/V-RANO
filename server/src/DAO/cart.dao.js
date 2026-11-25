import Cart from "../models/cart.model.js";

// Increment an existing line, only if the result stays within the limit
export const incrementCartItemDAO = async ({
  userId,
  productId,
  size,
  color,
  quantity,
  maxAllowed,
}) => {
  return await Cart.updateOne(
    {
      user: userId,
      items: {
        $elemMatch: {
          productId,
          size,
          color,
          quantity: { $lte: maxAllowed - quantity },
        },
      },
    },
    { $inc: { "items.$.quantity": quantity } },
  );
};

// Add a new line, only if that product + size + color isn't there yet
export const pushCartItemDAO = async ({
  userId,
  productId,
  size,
  color,
  quantity,
}) => {
  return await Cart.updateOne(
    {
      user: userId,
      items: { $not: { $elemMatch: { productId, size, color } } },
    },
    { $push: { items: { productId, size, color, quantity } } },
  );
};

export const getCartDAO = async (userId) => {
  return await Cart.findOne({ user: userId })
    .populate({
      path: "items.productId",
      select:
        "title slug price compareAtPrice images variants status categoryId",
      populate: { path: "categoryId", select: "isActive" },
    })
    .lean();
};

export const getOrCreateCartDAO = async (userId) => {
  try {
    return await Cart.findOneAndUpdate(
      { user: userId },
      {
        $setOnInsert: {
          user: userId,
          items: [],
        },
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      },
    );
  } catch (error) {
    if (error.code === 11000) {
      return Cart.findOne({ user: userId });
    }

    throw error;
  }
};

export const removeCartItemDAO = async ({ userId, itemId }) => {
  return await Cart.findOneAndUpdate(
    { user: userId, "items._id": itemId },
    { $pull: { items: { _id: itemId } } },
    { new: true },
  )
    .populate({
      path: "items.productId",
      select:
        "title slug price compareAtPrice images variants status categoryId",
      populate: { path: "categoryId", select: "isActive" },
    })
    .lean();
};

export const clearCartDAO = async (userId) => {
  return await Cart.findOneAndUpdate(
    { user: userId },
    { $set: { items: [] } },
    { new: true },
  );
};

export const findCartItemDAO = async ({ userId, itemId }) => {
  const cart = await Cart.findOne(
    { user: userId, "items._id": itemId },
    { items: { $elemMatch: { _id: itemId } } },
  ).lean();

  return cart?.items?.[0] || null;
};

export const updateCartItemQuantityDAO = async ({
  userId,
  itemId,
  quantity,
}) => {
  return await Cart.findOneAndUpdate(
    { user: userId, "items._id": itemId },
    { $set: { "items.$.quantity": quantity } },
    { new: true, runValidators: true },
  )
    .populate({
      path: "items.productId",
      select:
        "title slug price compareAtPrice images variants status categoryId",
      populate: { path: "categoryId", select: "isActive" },
    })
    .lean();
};

export const removeProductFromAllCartsDAO = async (productId) => {
  return await Cart.updateMany(
    { "items.productId": productId },
    { $pull: { items: { productId } } },
  );
};