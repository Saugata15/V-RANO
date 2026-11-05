import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        refreshTokenHash: {
            type: String,
            select: false,
            default: null,
        },
        ip: {
            type: String,
        },
        userAgent: {
            type: String,
        },
        revoked: {
            type: Boolean,
            default: false,
        },
        expiresAt: {
            type: Date,
            required: true,
        },
    },
    { timestamps: true },
);

const Session = mongoose.model("Session", sessionSchema);

export default Session;