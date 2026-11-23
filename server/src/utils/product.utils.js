import { SIZES_BY_TYPE } from "../constants/product.constants.js";
import { AppError } from "./AppError.js";

export const assertVariantSizes = ({ category, variants }) => {
  const allowed = SIZES_BY_TYPE[category.sizeType ?? "apparel"];
  const invalid = variants.filter((variant) => !allowed.includes(variant.size));

  if (invalid.length > 0) {
    throw new AppError(
      400,
      `Sizes for ${category.name} must be one of: ${allowed.join(", ")}`,
    );
  }
};