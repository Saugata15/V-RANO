import Address from "../models/address.model.js";
import Product from "../models/product.model.js";

export const findUserAddressDAO = async ({ addressId, userId }) => {
  return await Address.findOne({ _id: addressId, user: userId }).lean();
};

export const createOrderDAO = async (orderData) => {
  return await Order.create(orderData);
};

export const decrementVariantStockDAO = async ({
  productId,
  size,
  color,
  quantity,
}) => {
  const result = await Product.updateOne(
    {
      _id: productId,
      status: "active",
      variants: { $elemMatch: { size, color, stock: { $gte: quantity } } },
    },
    { $inc: { "variants.$.stock": -quantity } },
  );
  return result.modifiedCount === 1;
};

export const restoreVariantStockDAO = async ({
  productId,
  size,
  color,
  quantity,
}) => {
  const result = await Product.updateOne(
    { _id: productId, variants: { $elemMatch: { size, color } } },
    { $inc: { "variants.$.stock": quantity } },
  );

  return result.modifiedCount === 1;
};

export const restoreItemsStockDAO = async (items) => {
  const results = await Promise.allSettled(
    items.map((item) => restoreVariantStockDAO(item)),
  );

  results.forEach((result, index) => {
    if (result.status === "rejected" || result.value === false) {
      console.error(
        `Failed to restore stock for product ${items[index].productId}`,
        result.reason ?? "",
      );
    }
  });
};
