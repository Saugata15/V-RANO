import { deleteFile, uploadCategoryImage } from "../services/storage.services.js";
import { AppError } from "../utils/AppError.js";
import { generateFileName } from "../utils/file.utils.js";
import { createSlug } from "../utils/slug.utils.js";
import { createCategoryDAO, findCategory } from "../DAO/category.dao.js";
import { sendSuccess } from "../utils/apiResponse.js";

const categoryResponse = (category) => {
    return {
        id: category._id,
        name: category.name,
        description: category.description,
        image: category.image,
        isActive: category.isActive,
    }
}

export const createCategory = async (req, res) => {
    const { name, description, isActive } = req.body;
    const slug = createSlug(name);

    const existingCategory = await findCategory({ name, slug });

    if (existingCategory) {
        throw new AppError(409, "Category already exists");
    }

    let uploadedFile;

    try {
        if (req.file) {
            uploadedFile = await uploadCategoryImage({
                buffer: req.file.buffer,
                fileName: `category-${generateFileName(req.file.mimetype)}`
            });
        }

        const category = await createCategoryDAO({
            name,
            slug,
            description,
            image: uploadedFile?.url || "",
            isActive: isActive === undefined ? Boolean(isActive) : true
        });

        sendSuccess(res, 201, "Category created successfully", {
            category: categoryResponse(category),
        });

    } catch (error) {
        if (uploadedFile?.fileId) {
            await deleteFile(uploadedFile.fileId).catch(() => { })
        }
        throw error;
    }
}