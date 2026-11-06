import { createHash, randomBytes } from "node:crypto";
import OAuthState from "../models/oauth-state.model.js";

const hashState = (state) => {
    return createHash("sha256").update(state).digest("hex");
};

// Generate and store state
export const createOAuthState = async ({ userId, sessionId }) => {
    const state = randomBytes(32).toString("base64url");

    await OAuthState.create({
        stateHash: hashState(state),
        user: userId,
        session: sessionId,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    return state;
};

// Validate and consume state
export const consumeOAuthState = async (state) => {
    if (typeof state !== "string" || !state) {
        return null;
    }

    const record = await OAuthState.findOneAndDelete({
        stateHash: hashState(state),
        expiresAt: { $gt: new Date() },
    });

    return record;
};
