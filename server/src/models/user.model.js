import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Name is required"],
            trim: true,
            minlength: 3,
            maxlength: 30,
        },
        email: {
            type: String,
            required: [true, "Email is required"],
            lowercase: true,
            trim: true,
            unique: true,
            index: true,
            match: [
                /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                "Please enter a valid email address",
            ],
        },
        googleId: {
            type: String,
            unique: true,
            sparse: true,
        },
        passwordHash: {
            type: String,
            select: false,
            required: function () {
                return !this.googleId;
            },
        },
        avatar: {
            type: String,
            default: "",
        },
        avatarFileId: {
            type: String,
            default: null,
            select: false,
        },
        role: {
            type: String,
            enum: ["user", "admin"],
            default: "user",
        },
        emailVerified: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true },
);

const User = mongoose.model("User", userSchema);
export default User;
