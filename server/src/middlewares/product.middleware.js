import { AppError } from "../utils/AppError.js";

export const parseProductJsonFields = (req, res, next) => {
    try {
        const fields = ["tags", "variants", "ratings"];

        for (const field of fields) {
            if (typeof req.body[field] === "string") {
                req.body[field] = JSON.parse(req.body[field]);
            }
        }

        next();
    } catch {
        next(new AppError(400, "Invalid product JSON fields"));
    }
};
