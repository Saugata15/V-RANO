import { consumeOAuthState } from "../DAO/oauthState.dao.js";
import { findActiveSession } from "../DAO/session.dao.js";
import { findUserById } from "../DAO/user.dao.js";
import { AppError } from "../utils/AppError.js";
import { verifyAccessToken } from "../utils/jwt.js";

export const requireAuth = async (req, res, next) => {
    const authHeader = req.headers?.authorization;

    if (!authHeader) {
        throw new AppError(401, "Authentication required");
    }

    const [scheme, accessToken, ...extraParts] =
        authHeader.trim().split(/\s+/);

    if (
        scheme !== "Bearer" ||
        !accessToken ||
        extraParts.length > 0
    ) {
        throw new AppError(401, "Invalid authorization header");
    }

    const { userId, sessionId } = verifyAccessToken(accessToken);

    const session = await findActiveSession({ userId, sessionId });

    if (!session) {
        throw new AppError(401, "Session expired or revoked");
    }

    const user = await findUserById(userId);

    if (!user) {
        throw new AppError(401, "Authentication required");
    }

    req.user = user;
    req.session = session;

    next();
}

export const requireAdmin = (req, res, next) => {
    if (!req.user) {
        throw new AppError(401, "Authentication required");
    }

    if (req.user.role !== "admin") {
        throw new AppError(403, "Admin access required");
    }

    next();
};

export const validateGoogleLinkState = async (req, res, next) => {
    const record = await consumeOAuthState(req.query.state);

    if (!record) {
        throw new AppError(401, "Invalid or expired OAuth state");
    }

    const session = await findActiveSession({
        userId: record.user,
        sessionId: record.session,
    });

    if (!session) {
        throw new AppError(401, "Your session has expired. Please log in again.");
    }

    req.googleLinkUserId = record.user;

    next();
};