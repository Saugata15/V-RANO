import mongoose from "mongoose";
import { AppError } from "../utils/AppError.js";

const normalizeErrors = (errors = []) => {
  if (!Array.isArray(errors)) return [];

  return errors.map((error) => ({
    field: String(
      error.field ?? error.path ?? error.param ?? "unknown",
    ),
    message: error.message ?? error.msg ?? "Invalid value",
  }));
};

export const errorHandler = (err, _req, res, _next) => {
  let statusCode = 500;
  let message = "Internal server error";
  let errors = [];

  // 1. Our custom application errors
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    errors = normalizeErrors(err.errors);
  }

  // 2. MongoDB duplicate key errors
  else if (err?.code === 11000) {
    const field = Object.keys(
      err.keyValue ?? err.keyPattern ?? {},
    )[0] ?? "unknown";

    statusCode = 409;
    message = "Duplicate value";
    errors = [
      {
        field,
        message: `${field} already exists`,
      },
    ];
  }

  // 3. Mongoose schema validation errors
  else if (err instanceof mongoose.Error.ValidationError) {
    statusCode = 400;
    message = "Validation failed";

    errors = Object.values(err.errors).map((error) => ({
      field: error.path,
      message: error.message,
    }));
  }

  // 4. Invalid MongoDB ObjectId or casting errors
  else if (err instanceof mongoose.Error.CastError) {
    statusCode = 400;
    message = "Invalid value";

    errors = [
      {
        field: err.path,
        message: `Invalid ${err.path}`,
      },
    ];
  }

  // 5. Expired JWT
  else if (err?.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Token expired";
  }

  // 6. Invalid JWT
  else if (err?.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid token";
  }

  // 7. Malformed JSON request body
  else if (err?.type === "entity.parse.failed") {
    statusCode = 400;
    message = "Malformed JSON body";
  }

  // 8. Request body exceeds the configured size limit
  else if (err?.type === "entity.too.large") {
    statusCode = 413;
    message = "Request body too large";
  }

  // 9. Unexpected errors
  else {
    console.error("Unexpected error:", err);
  }

  // Never expose unexpected internal errors to the client
  if (
    !Number.isInteger(statusCode) ||
    statusCode < 400 ||
    statusCode > 599
  ) {
    statusCode = 500;
    message = "Internal server error";
    errors = [];
  }

  const body = {
    success: false,
    message,
    errors,
  };

  return res.status(statusCode).json(body);
};
