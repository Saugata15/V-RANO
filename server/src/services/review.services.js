import {
  getRatingStatsDAO,
  updateProductRatingsDAO,
} from "../DAO/review.dao.js";

export const recalculateProductRating = async (productId) => {
  const { average, count } = await getRatingStatsDAO(productId);

  await updateProductRatingsDAO({ productId, average, count });

  return { average, count };
};
