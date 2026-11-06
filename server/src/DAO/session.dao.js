import { createHash } from "node:crypto";
import Session from "../models/session.model.js";

export const createSession = async ({ userId, ip, userAgent, rememberMe = false }) => {
    const sessionDuration = rememberMe
        ? 30 * 24 * 60 * 60 * 1000
        : 7 * 24 * 60 * 60 * 1000;

    const newSession = await Session.create({
        user: userId,
        ip,
        userAgent,
        rememberMe,
        expiresAt: new Date(Date.now() + sessionDuration),
    });
    return newSession;
};

export const hashRefreshToken = (token) =>
    createHash("sha256").update(token).digest("hex");

export const UpdateRefreshToken = async ({ sessionId, refreshToken }) => {
    await Session.findOneAndUpdate(
        { _id: sessionId },
        { $set: { refreshTokenHash: hashRefreshToken(refreshToken) } },
    );
};

export const findActiveSession = async ({ userId, sessionId }) => {
    const session = await Session.findOne({
        _id: sessionId,
        user: userId,
        revoked: false,
        expiresAt: { $gt: new Date() },
    }).select("+refreshTokenHash");
    return session;
};

export const isRefreshTokenValid = ({ session, token }) => {
    if (!session?.refreshTokenHash || !token) return false;

    const tokenHash = hashRefreshToken(token);
    return session.refreshTokenHash === tokenHash;
}

export const revokeSession = async (sessionId) => {
    await Session.findOneAndUpdate(
        { _id: sessionId, revoked: false },
        { $set: { revoked: true, refreshTokenHash: null } },
        { new: true },
    );
};

export const revokeOtherSessions = async ({ userId, currentSessionId }) => {
    await Session.updateMany(
        { user: userId, _id: { $ne: currentSessionId }, revoked: false },
        { $set: { revoked: true, refreshTokenHash: null } },
    );
};
