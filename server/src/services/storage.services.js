import ImageKit, { toFile } from '@imagekit/nodejs';
import config from '../config/config.js';
import { AppError } from '../utils/AppError.js';

let client;

const getClient = () => {
    if (!config.IMAGEKIT_PRIVATE_KEY || !config.IMAGEKIT_PUBLIC_KEY || !config.IMAGEKIT_URL_ENDPOINT) {
        throw new AppError(503, "Avatar uploads are not configured");
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

export async function uploadFile({ buffer, fileName }) {
    return getClient().files.upload({
        file: await toFile(buffer),
        fileName: fileName,
        folder: "/avatar",
    });
}

export async function deleteFile(fileId) {
    if (!fileId) return;
    await getClient().files.delete(fileId);
}
