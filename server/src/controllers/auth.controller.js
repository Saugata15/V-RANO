import config from "../config/config.js";
import { createSession, findActiveSession, isRefreshTokenValid, revokeSession, UpdateRefreshToken } from "../DAO/session.dao.js";
import { comparePassword, createUser, findUserByEmail } from "../DAO/user.dao.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { AppError } from "../utils/AppError.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/jwt.js";

export const refreshCookieOptions = {
    httpOnly: true,
    secure: config.NODE_ENV === "production",
    sameSite: config.NODE_ENV === "production" ? "none" : "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
};

export const issueTokens = ({ userId, sessionId }) => {
    const accessToken = signAccessToken({ userId, sessionId });
    const refreshToken = signRefreshToken({ userId, sessionId });
    return { accessToken, refreshToken };
};

const setRefreshCookie = (res, refreshToken) => {
    res.cookie("refreshToken", refreshToken, refreshCookieOptions);
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
    });

    const { accessToken, refreshToken } = issueTokens({
        userId: newUser._id,
        sessionId: newSession._id,
    });

    await UpdateRefreshToken({ sessionId: newSession._id, refreshToken });

    setRefreshCookie(res, refreshToken);

    sendSuccess(res, 201, "User registered successfully", {
        user: toPublicUser(newUser),
        accessToken,
    });
};

// login via email and password
export const loginController = async (req, res) => {
    const { email, password } = req.body;

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
    });

    const { accessToken, refreshToken } = issueTokens({
        userId: user._id,
        sessionId: newSession._id,
    });

    await UpdateRefreshToken({ sessionId: newSession._id, refreshToken });

    setRefreshCookie(res, refreshToken);

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
        res.clearCookie("refreshToken", refreshCookieOptions);
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

    const { userId, sessionId } = payload;

    const session = await findActiveSession({ userId, sessionId });

    if (!session) {
        res.clearCookie("refreshToken", refreshCookieOptions);

        throw new AppError(401, "Session expired or revoked");
    }

    const isValidRefreshToken = isRefreshTokenValid({ session, token });

    if (!isValidRefreshToken) {
        await revokeSession(session._id);

        res.clearCookie("refreshToken", refreshCookieOptions);

        throw new AppError(401, "Invalid refresh token");
    }

    const { accessToken, refreshToken } = issueTokens({
        userId,
        sessionId: session._id,
    });

    await UpdateRefreshToken({ sessionId: session._id, refreshToken });

    setRefreshCookie(res, refreshToken);

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
        res.clearCookie("refreshToken", refreshCookieOptions);

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
        res.clearCookie("refreshToken", refreshCookieOptions);

        throw new AppError(401, "Session expired or revoked");
    }

    const isValidRefreshToken = isRefreshTokenValid({ session, token });

    if (!isValidRefreshToken) {
        res.clearCookie("refreshToken", refreshCookieOptions);

        throw new AppError(401, "Invalid refresh token");
    }

    await revokeSession(session._id);

    res.clearCookie("refreshToken", refreshCookieOptions);

    sendSuccess(res, 200, "User logged out successfully");
};

// me controller
export const meController = async (req, res) => {
    const user = req.user;

    if (!user) throw new AppError(401, "Authentication required");

    return sendSuccess(res, 200, "Current user", { user: toPublicUser(user) });
};