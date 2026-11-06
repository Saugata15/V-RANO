import mongoose from "mongoose";

const oauthStateSchema = new mongoose.Schema({
    stateHash: {
        type: String,
        required: true,
        unique: true,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    session: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Session",
        required: true,
    },
    expiresAt: {
        type: Date,
        required: true,
    },
});

// Automatically remove expired state records
oauthStateSchema.index(
    { expiresAt: 1 },
    { expireAfterSeconds: 0 }
);

const OAuthState = mongoose.model("OAuthState", oauthStateSchema);

export default OAuthState;
