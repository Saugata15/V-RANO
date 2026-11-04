import jwt from "jsonwebtoken";
import config from "../config/config.js";

export const ACCESS_TOKEN_EXPIRY = "15m";
export const REFRESH_TOKEN_EXPIRY = "7d";

export const signAccessToken = ({ userId, sessionId }) => {
    const accessToken = jwt.sign({ userId, sessionId }, config.ACCESS_TOKEN_SECRET, {
        expiresIn: ACCESS_TOKEN_EXPIRY,
    });
    return accessToken;
};

export const signRefreshToken = ({ userId, sessionId }) => {
    const refreshToken = jwt.sign({ userId, sessionId }, config.REFRESH_TOKEN_SECRET, {
        expiresIn: REFRESH_TOKEN_EXPIRY,
    });
    return refreshToken;
};

export const verifyAccessToken = (accessToken) => {
    return jwt.verify(accessToken, config.ACCESS_TOKEN_SECRET);
};

export const verifyRefreshToken = (refreshToken) => {
    return jwt.verify(refreshToken, config.REFRESH_TOKEN_SECRET);
};
