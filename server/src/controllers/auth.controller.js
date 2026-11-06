import config from "../config/config.js";
import { createSession, findActiveSession, isRefreshTokenValid, revokeSession, UpdateRefreshToken } from "../DAO/session.dao.js";
import { comparePassword, createUser, findUserByEmail } from "../DAO/user.dao.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { AppError } from "../utils/AppError.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/jwt.js";
import { deleteFile, uploadFile } from "../services/storage.services.js";

export const refreshCookieOptions = (rememberMe = false) => ({
    httpOnly: true,
    secure: config.NODE_ENV === "production",
    sameSite: config.NODE_ENV === "production" ? "none" : "strict",
    maxAge: (rememberMe ? 30 : 7) * 24 * 60 * 60 * 1000,
});

export const issueTokens = ({ userId, sessionId, rememberMe = false }) => {
    const accessToken = signAccessToken({ userId, sessionId });
    const refreshToken = signRefreshToken({ userId, sessionId }, rememberMe ? "30d" : "7d");
    return { accessToken, refreshToken };
};

const setRefreshCookie = (res, refreshToken, rememberMe = false) => {
    res.cookie(
        "refreshToken",
        refreshToken,
        refreshCookieOptions(rememberMe)
    );
};

const toPublicUser = (user) => {
    return {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
    };
};

// register via email and password
export const registerController = async (req, res) => {
    const { name, email, password } = req.body;

    const existingUser = await findUserByEmail(email);

    if (existingUser) {
        throw new AppError(409, "Email already exists", [
            { field: "email", message: "Email already registered" },
        ]);
    }

    const newUser = await createUser({ name, email, password });

    const newSession = await createSession({
        userId: newUser._id,
        ip: req.ip,
        userAgent: req.headers["user-agent"],
        rememberMe: false,
    });

    const { accessToken, refreshToken } = issueTokens({
        userId: newUser._id,
        sessionId: newSession._id,
        rememberMe: false,
    });

    await UpdateRefreshToken({ sessionId: newSession._id, refreshToken });

    setRefreshCookie(res, refreshToken, false);

    sendSuccess(res, 201, "User registered successfully", {
        user: toPublicUser(newUser),
        accessToken,
    });
};

// login via email and password
export const loginController = async (req, res) => {
    const { email, password, rememberMe = false } = req.body;

    const user = await findUserByEmail(email);

    if (!user || !user.passwordHash) {
        throw new AppError(401, "Invalid email or password", [
            { field: "email", message: "Invalid email or password" },
            { field: "password", message: "Invalid email or password" },
        ]);
    }

    const isPasswordMatched = await comparePassword({
        givenPassword: password,
        passwordHash: user.passwordHash
    })

    if (!isPasswordMatched) {
        throw new AppError(401, "Invalid email or password", [
            { field: "email", message: "Invalid email or password" },
            { field: "password", message: "Invalid email or password" },
        ]);
    }

    const newSession = await createSession({
        userId: user._id,
        ip: req.ip,
        userAgent: req.headers["user-agent"],
        rememberMe,
    });

    const { accessToken, refreshToken } = issueTokens({
        userId: user._id,
        sessionId: newSession._id,
        rememberMe,
    });

    await UpdateRefreshToken({ sessionId: newSession._id, refreshToken });

    setRefreshCookie(res, refreshToken, rememberMe);

    sendSuccess(res, 200, "User logged in successfully", {
        user: toPublicUser(user),
        accessToken,
    });
};

// refresh controller
export const refreshController = async (req, res) => {
    const token = req.cookies?.refreshToken;

    if (!token) {
        throw new AppError(401, "Refresh token missing");
    };

    let payload;

    try {
        payload = verifyRefreshToken(token);
    } catch (error) {
        res.clearCookie("refreshToken", refreshCookieOptions());
        console.log(error);
        if (
            error.name === "TokenExpiredError" ||
            error.name === "JsonWebTokenError" ||
            error.name === "NotBeforeError"
        ) {
            throw new AppError(401, "Invalid or expired refresh token");
        }

        throw error;
    }

    const { userId, sessionId, rememberMe = false } = payload;

    const session = await findActiveSession({ userId, sessionId });

    if (!session) {
        res.clearCookie("refreshToken", refreshCookieOptions());

        throw new AppError(401, "Session expired or revoked");
    }

    const isValidRefreshToken = isRefreshTokenValid({ session, token });

    if (!isValidRefreshToken) {
        await revokeSession(session._id);

        res.clearCookie("refreshToken", refreshCookieOptions());

        throw new AppError(401, "Invalid refresh token");
    }

    const { accessToken, refreshToken } = issueTokens({
        userId,
        sessionId: session._id,
        rememberMe
    });

    await UpdateRefreshToken({ sessionId: session._id, refreshToken });

    setRefreshCookie(res, refreshToken, rememberMe);

    sendSuccess(res, 200, "Token refreshed", {
        accessToken,
    });
}

//logout controller
export const logoutController = async (req, res) => {
    const token = req.cookies?.refreshToken;

    if (!token) {
        throw new AppError(401, "Refresh token missing");
    }

    let payload;

    try {
        payload = verifyRefreshToken(token);
    } catch (error) {
        res.clearCookie("refreshToken", refreshCookieOptions());

        if (
            error.name === "TokenExpiredError" ||
            error.name === "JsonWebTokenError" ||
            error.name === "NotBeforeError"
        ) {
            throw new AppError(401, "Invalid or expired refresh token");
        }

        throw error;
    }

    const { userId, sessionId } = payload;

    const session = await findActiveSession({ userId, sessionId });

    if (!session) {
        res.clearCookie("refreshToken", refreshCookieOptions());

        throw new AppError(401, "Session expired or revoked");
    }

    const isValidRefreshToken = isRefreshTokenValid({ session, token });

    if (!isValidRefreshToken) {
        res.clearCookie("refreshToken", refreshCookieOptions());

        throw new AppError(401, "Invalid refresh token");
    }

    await revokeSession(session._id);

    res.clearCookie("refreshToken", refreshCookieOptions());

    sendSuccess(res, 200, "User logged out successfully");
};

// me controller
export const meController = async (req, res) => {
    const user = req.user;

    if (!user) throw new AppError(401, "Authentication required");

    return sendSuccess(res, 200, "Current user", { user: toPublicUser(user) });
};

const getAvatarImageType = (file) => {
    const { buffer, mimetype } = file;
    const isJpeg = mimetype === "image/jpeg" && buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]));
    const isPng = mimetype === "image/png" && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    const isWebp = mimetype === "image/webp" && buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP";

    if (isJpeg) return "jpg";
    if (isPng) return "png";
    if (isWebp) return "webp";

    throw new AppError(400, "Avatar must be a valid JPEG, PNG, or WebP image", [
        { field: "avatar", message: "Unsupported or invalid image file" },
    ]);
};

export const updateAvatarController = async (req, res) => {
    if (!req.file) {
        throw new AppError(400, "Avatar image is required", [
            { field: "avatar", message: "Attach an image using the avatar field" },
        ]);
    }

    const extension = getAvatarImageType(req.file);
    const uploadedFile = await uploadFile({
        buffer: req.file.buffer,
        fileName: `avatar-${req.user._id}-${Date.now()}.${extension}`,
    });

    if (!uploadedFile?.url || !uploadedFile?.fileId) {
        throw new AppError(502, "Image service returned an invalid upload response");
    }

    const previousFileId = req.user.avatarFileId;
    req.user.avatar = uploadedFile.url;
    req.user.avatarFileId = uploadedFile.fileId;

    try {
        await req.user.save();
    } catch (error) {
        try {
            await deleteFile(uploadedFile.fileId);
        } catch (cleanupError) {
            console.error("Failed to clean up an uncommitted avatar upload:", cleanupError);
        }
        throw error;
    }

    if (previousFileId) {
        try {
            await deleteFile(previousFileId);
        } catch (error) {
            console.error("Failed to delete the previous avatar from ImageKit:", error);
        }
    }

    return sendSuccess(res, 200, "Avatar updated successfully", {
        user: toPublicUser(req.user),
    });
};
