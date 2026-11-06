import { Router } from "express";
import multer from "multer";
import {
  changePasswordValidator,
  loginValidator,
  registerValidator,
} from "../validators/auth.validator.js";
import { validate } from "../middlewares/validate.middleware.js";
import asyncHandler from "../utils/asyncHandler.js";
import {
  changePasswordController,
  googleAuthCallbackController,
  googleLinkCallbackController,
  loginController,
  logoutController,
  meController,
  refreshController,
  registerController,
  startGoogleLinkController,
  updateAvatarController,
} from "../controllers/auth.controller.js";
import {
  requireAuth,
  validateGoogleLinkState,
} from "../middlewares/auth.middleware.js";
import { AppError } from "../utils/AppError.js";
import passport from "../config/passport.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 1 * 1024 * 1024,
    files: 1,
  },
  fileFilter: (_req, file, callback) => {
    const supportedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!supportedTypes.includes(file.mimetype)) {
      return callback(
        new AppError(400, "Avatar must be a JPEG, PNG, or WebP image"),
      );
    }
    callback(null, true);
  },
});

const parseAvatarUpload = (req, res, next) => {
  upload.single("avatar")(req, res, (error) => {
    if (error instanceof multer.MulterError) {
      const statusCode = error.code === "LIMIT_FILE_SIZE" ? 413 : 400;
      return next(
        new AppError(statusCode, "Invalid avatar upload", [
          { field: "avatar", message: error.message },
        ]),
      );
    }
    next(error);
  });
};

const router = Router();

// register via email and password
router.post(
  "/register",
  registerValidator,
  validate,
  asyncHandler(registerController),
);

// login via email and password
router.post("/login", loginValidator, validate, asyncHandler(loginController));

// refresh token
router.post("/refresh", asyncHandler(refreshController));

// logout route
router.post("/logout", asyncHandler(logoutController));

// profile route
router.get("/me", asyncHandler(requireAuth), asyncHandler(meController));

// Change password
router.post(
  "/change-password",
  asyncHandler(requireAuth),
  changePasswordValidator,
  validate,
  asyncHandler(changePasswordController),
);

// Update avatar
router.patch(
  "/avatar",
  asyncHandler(requireAuth),
  parseAvatarUpload,
  asyncHandler(updateAvatarController),
);

// Google Authentication
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    prompt: "select_account",
    session: false,
  }),
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "/",
  }),
  asyncHandler(googleAuthCallbackController),
);

// Google account linking
router.get(
  "/google/link",
  asyncHandler(requireAuth),
  asyncHandler(startGoogleLinkController),
);

// Google linking callback
router.get(
  "/google/link/callback",
  asyncHandler(validateGoogleLinkState),
  passport.authenticate("google", {
    session: false,
    failureRedirect: "http://localhost:5173/account/security?googleLink=failed",
  }),
  asyncHandler(googleLinkCallbackController),
);

export default router;
