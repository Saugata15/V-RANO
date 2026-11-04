import { createHash } from "node:crypto";
import Session from "../models/session.model.js";

export const createSession = async ({ userId, ip, userAgent }) => {
    const newSession = await Session.create({
        user: userId,
        ip,
        userAgent,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
    return newSession;
};

export const hashRefreshToken = (token) =>
    createHash("sha256").update(token).digest("hex");

export const UpdateRefreshToken = async ({ sessionId, refreshToken }) => {
    await Session.findOneAndUpdate(
        { _id: sessionId },
        { $set: { refreshToken: hashRefreshToken(refreshToken) } },
    );
};