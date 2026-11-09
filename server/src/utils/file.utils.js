import { nanoid } from "nanoid";

export const getFileExtension = (mimetype) => {
    const extensions = {
        "image/jpeg": ".jpg",
        "image/jpg": ".jpg",
        "image/png": ".png",
        "image/webp": ".webp",
        "image/avif": ".avif",
    };

    return extensions[mimetype];
};

export const generateFileName = (mimetype) => {
    return `${nanoid()}${getFileExtension(mimetype)}`;
};