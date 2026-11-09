import slugify from "slugify";

export const createSlug = (name) => {
    return slugify(name, {
        lower: true,
        strict: true,
        trim: true,
    });
}