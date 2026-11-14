import { findCategoryById } from "../DAO/category.dao.js";
import {
  createProductDAO,
  findActiveProductByIdDAO,
  findByIdAndDeleteDAO,
  findProductByIdDAO,
  findProductBySlugDAO,
  getActiveProductsDAO,
  getAllProductsForAdminDAO,
  getProductDetailsDAO,
  getProductDetailsForAdminDAO,
  getRelatedProductsDAO,
  updateProductDAO,
} from "../DAO/product.dao.js";
import {
  deleteFile,
  uploadProductImages,
} from "../services/storage.services.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { AppError } from "../utils/AppError.js";
import { createSlug } from "../utils/slug.utils.js";

// create product
export const createProductController = async (req, res) => {
  const {
    title,
    description,
    categoryId,
    brand,
    price,
    compareAtPrice,
    tags = [],
    variants = [],
    ratings = { average: 0, count: 0 },
    isFeatured = false,
  } = req.body;

  const normalizedTitle = title.trim().toLowerCase();
  const slug = createSlug(normalizedTitle);

  const category = await findCategoryById(categoryId);

  if (!category || !category.isActive) {
    throw new AppError(404, "Active category not found");
  }

  const existingProduct = await findProductBySlugDAO(slug);

  if (existingProduct) {
    throw new AppError(409, "Product already exists");
  }

  if (!req.files?.length) {
    throw new AppError(400, "At least one product image is required");
  }

  if (!variants.length) {
    throw new AppError(400, "At least one product variant is required");
  }

  let uploadedImages = [];
  let product;

  try {
    uploadedImages = await uploadProductImages(req.files);

    const images = uploadedImages.map((image, index) => ({
      ...image,
      alt: `${normalizedTitle} image ${index + 1}`,
      isPrimary: index === 0,
    }));

    product = await createProductDAO({
      title: normalizedTitle,
      slug,
      description: description.trim(),
      categoryId,
      brand: brand.trim(),
      price,
      compareAtPrice: compareAtPrice ?? null,
      tags,
      variants,
      images,
      ratings,
      isFeatured,
    });
  } catch (error) {
    await Promise.allSettled(
      uploadedImages.map((image) => deleteFile(image.fileId)),
    );

    throw error;
  }

  sendSuccess(res, 201, "Product created successfully", {
    product,
  });
};

// Get all active products
export const getActiveProductsController = async (req, res) => {
  const {
    page = 1,
    limit = 20,
    search,
    category,
    minPrice,
    maxPrice,
    size,
    color,
    sort = "newest",
  } = req.query;

  const pageNumber = Number(page);
  const limitNumber = Number(limit);
  const skip = (pageNumber - 1) * limitNumber;

  const { products, totalProducts } = await getActiveProductsDAO({
    skip,
    limit: limitNumber,
    search,
    category,
    minPrice,
    maxPrice,
    size,
    color,
    sort,
  });

  sendSuccess(res, 200, "Products fetched successfully", {
    products,
    pagination: {
      currentPage: pageNumber,
      totalPages: Math.ceil(totalProducts / limitNumber),
      totalProducts,
      limit: limitNumber,
    },
  });
};

// get all products by admin
export const getAllProductsForAdminController = async (req, res) => {
  const {
    page = 1,
    limit = 20,
    search,
    status,
    category,
    sort = "newest",
  } = req.query;

  const pageNumber = Number(page);
  const limitNumber = Number(limit);

  const skip = (pageNumber - 1) * limitNumber;

  const { products, totalProducts } = await getAllProductsForAdminDAO({
    skip,
    limit: limitNumber,
    search,
    status,
    category,
    sort,
  });

  sendSuccess(res, 200, "Products fetched successfully", {
    products,
    pagination: {
      currentPage: pageNumber,
      totalPages: Math.ceil(totalProducts / limitNumber),
      totalProducts,
      limit: limitNumber,
    },
  });
};

// Get related products
export const getRelatedProductsController = async (req, res) => {
  const { id } = req.params;
  const limit = req.query.limit ?? 8;

  const product = await findActiveProductByIdDAO(id);

  if (!product) {
    throw new AppError(404, "Product not found");
  }

  const category = await findCategoryById(product.categoryId);

  if (!category || !category.isActive) {
    throw new AppError(404, "Product not found");
  }

  const products = await getRelatedProductsDAO({
    productId: product._id,
    categoryId: product.categoryId,
    brand: product.brand,
    tags: product.tags,
    limit,
  });

  sendSuccess(res, 200, "Related products fetched successfully", {
    products,
  });
};

// Get product details for user by slug
export const getProductDetailsController = async (req, res) => {
  const { slug } = req.params;

  if (!slug?.trim()) {
    throw new AppError(400, "Slug is required");
  }

  const product = await getProductDetailsDAO(slug);

  if (!product) {
    throw new AppError(404, "Product not found");
  }

  sendSuccess(res, 200, "Product found successfully", {
    product,
  });
};

// Get product details for admin by id(for both active and archived products)
export const getProductDetailsForAdminController = async (req, res) => {
  const { id } = req.params;

  const product = await getProductDetailsForAdminDAO(id);

  if (!product) {
    throw new AppError(404, "Product not found");
  }

  sendSuccess(res, 200, "Product fetched successfully", {
    product,
  });
};

// Update product by admin
export const updateProductController = async (req, res) => {
  const {
    title,
    description,
    categoryId,
    brand,
    price,
    compareAtPrice,
    tags,
    variants,
    ratings,
    isFeatured,
  } = req.body;

  const { id } = req.params;

  const product = await findActiveProductByIdDAO(id);

  if (!product) {
    throw new AppError(404, "Product not found");
  }

  let updateData = {};

  if (title !== undefined) {
    const normalizedTitle = title.trim().toLowerCase();
    const slug = createSlug(normalizedTitle);

    const existingProduct = await findProductBySlugDAO(slug);

    if (
      existingProduct &&
      existingProduct._id.toString() !== product._id.toString()
    ) {
      throw new AppError(409, "Product with this title already exists");
    }

    updateData.title = normalizedTitle;
    updateData.slug = slug;
  }

  if (description !== undefined) {
    updateData.description = description.trim();
  }

  if (categoryId !== undefined) {
    const category = await findCategoryById(categoryId);

    if (!category || !category.isActive) {
      throw new AppError(404, "Active category not found");
    }

    updateData.categoryId = categoryId;
  }

  if (brand !== undefined) {
    updateData.brand = brand.trim();
  }

  if (price !== undefined) {
    updateData.price = price;
  }

  if (compareAtPrice !== undefined) {
    updateData.compareAtPrice = compareAtPrice;
  }

  const effectivePrice = price ?? product.price;

  if (
    compareAtPrice !== undefined &&
    compareAtPrice !== null &&
    compareAtPrice <= effectivePrice
  ) {
    throw new AppError(
      400,
      "Compare-at price must be greater than selling price",
    );
  }

  const effectiveCompareAtPrice =
    compareAtPrice !== undefined ? compareAtPrice : product.compareAtPrice;

  if (
    effectiveCompareAtPrice != null &&
    effectiveCompareAtPrice <= effectivePrice
  ) {
    throw new AppError(
      400,
      "Compare-at price must be greater than selling price",
    );
  }

  if (tags !== undefined) {
    updateData.tags = tags;
  }

  if (variants !== undefined) {
    updateData.variants = variants;
  }

  if (ratings !== undefined) {
    updateData.ratings = ratings;
  }

  if (isFeatured !== undefined) {
    updateData.isFeatured = isFeatured;
  }

  let uploadedImages = [];
  const oldImages = product.images;

  if (req.files?.length > 0) {
    uploadedImages = await uploadProductImages(req.files);

    updateData.images = uploadedImages.map((image, index) => ({
      ...image,
      alt: `${normalizedTitle} image ${index + 1}`,
      isPrimary: index === 0,
    }));
  }

  if (Object.keys(updateData).length === 0) {
    throw new AppError(400, "No fields provided for update");
  }

  let updatedProduct;

  try {
    updatedProduct = await updateProductDAO({
      id,
      updateData,
    });

    if (!updatedProduct) {
      throw new AppError(404, "Product not found");
    }
  } catch (error) {
    await Promise.allSettled(
      uploadedImages.map((image) => deleteFile(image.fileId)),
    );

    throw error;
  }

  if (uploadedImages.length > 0) {
    await Promise.allSettled(
      oldImages.map((image) => deleteFile(image.fileId)),
    );
  }

  sendSuccess(res, 200, "Product updated successfully", {
    product: updatedProduct,
  });
};

// Update product status by admin
export const updateProductStatusController = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const product = await findProductByIdDAO(id);

  if (!product) {
    throw new AppError(404, "Product not found");
  }

  if (product.status === status) {
    throw new AppError(400, `Product is already ${status}`);
  }

  if (status === "active") {
    const category = await findCategoryById(product.categoryId);

    if (!category || !category.isActive) {
      throw new AppError(
        400,
        "Cannot activate product because its category is inactive",
      );
    }
  }

  const updatedProduct = await updateProductDAO({
    id,
    updateData: { status },
  });

  sendSuccess(res, 200, "Product status updated successfully", {
    product: updatedProduct,
  });
};

// Delete product by admin
export const deleteProductController = async (req, res) => {
  const { id } = req.params;

  const product = await findProductByIdDAO(id);

  if (!product) {
    throw new AppError(404, "Product not found");
  }

  const deletedProduct = await findByIdAndDeleteDAO(id);

  if (!deletedProduct) {
    throw new AppError(404, "Product not found");
  }

  const deletionResults = await Promise.allSettled(
    deletedProduct.images.map((image) => deleteFile(image.fileId)),
  );

  deletionResults.forEach((result, index) => {
    if (result.status === "rejected") {
      console.error(
        `Failed to delete product image: ${deletedProduct.images[index].fileId}`,
        result.reason,
      );
    }
  });

  sendSuccess(res, 200, "Product deleted successfully");
};

// Get featured products
export const getFeaturedProductsController = async (req, res) => {
  const limit = req.query.limit ?? 8;

  const products = await getFeaturedProductsDAO(limit);

  sendSuccess(res, 200, "Featured products fetched successfully", {
    products,
  });
};
