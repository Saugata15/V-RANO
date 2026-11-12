import { findCategoryById } from "../DAO/category.dao.js";
import { createProductDAO, findProductBySlugDAO, getActiveProductsDAO } from "../DAO/product.dao.js";
import { uploadProductImages } from "../services/storage.services.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { AppError } from "../utils/AppError.js";
import { createSlug } from "../utils/slug.utils.js";

// create product
export const createProductController = async (req, res) => {
    const { title,
        description,
        categoryId,
        brand,
        price,
        compareAtPrice,
        tags = [],
        variants = [],
        ratings = { average: 0, count: 0 },
        isFeatured = false, } = req.body;

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
            uploadedImages.map((image) => deleteFile(image.fileId))
        );

        throw error;
    }

    sendSuccess(res, 201, "Product created successfully", {
        product,
    });
}

// Get all active products
export const getActiveProductsController = async (req, res) => {
    const { page = 1,
        limit = 20,
        search,
        category,
        minPrice,
        maxPrice,
        size,
        color,
        sort = "newest" } = req.query;

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
}