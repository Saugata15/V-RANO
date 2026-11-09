import ImageKit, { toFile } from '@imagekit/nodejs';
import config from '../config/config.js';
import { AppError } from '../utils/AppError.js';

let client;

const getClient = () => {
    if (!config.IMAGEKIT_PRIVATE_KEY || !config.IMAGEKIT_PUBLIC_KEY || !config.IMAGEKIT_URL_ENDPOINT) {
        throw new AppError(503, "Image uploads are not configured");
    }

    if (!client) {
        client = new ImageKit({
            privateKey: config.IMAGEKIT_PRIVATE_KEY,
            publicKey: config.IMAGEKIT_PUBLIC_KEY,
            urlEndpoint: config.IMAGEKIT_URL_ENDPOINT,
        });
    }

    return client;
};

export async function uploadAvatarImage({ buffer, fileName }) {
    return getClient().files.upload({
        file: await toFile(buffer),
        fileName: fileName,
        folder: "/avatar",
    });
}

export async function uploadCategoryImage({ buffer, fileName }) {
    return getClient().files.upload({
        file: await toFile(buffer),
        fileName: fileName,
        folder: "/category",
    });
}

export async function uploadProductImage({ buffer, fileName }) {
    return getClient().files.upload({
        file: await toFile(buffer),
        fileName,
        folder: "/products",
    });
}

export async function uploadProductImages(files = []) {
    const uploadedImages = [];

    try {
        for (const [index, file] of files.entries()) {
            const result = await uploadProductImage({
                buffer: file.buffer,
                fileName: `${Date.now()}-${index}-${file.originalname}`,
            });

            uploadedImages.push({
                url: result.url,
                fileId: result.fileId,
            });
        }

        return uploadedImages;
    } catch (error) {
        await Promise.allSettled(
            uploadedImages.map((image) => deleteFile(image.fileId))
        );

        throw error;
    }
}

export async function deleteFile(fileId) {
    if (!fileId) return;
    await getClient().files.delete(fileId);
}
