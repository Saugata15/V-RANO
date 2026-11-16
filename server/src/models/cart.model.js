import mongoose from "mongoose";
import {
    PRODUCT_SIZES,
    PRODUCT_COLORS,
} from "../constants/product.constants.js";

const cartItemSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
    },

    size: {
        type: String,
        required: true,
        enum: PRODUCT_SIZES,
    },

    color: {
        type: String,
        required: true,
        enum: PRODUCT_COLORS,
    },

    quantity: {
        type: Number,
        required: true,
        default: 1,
        min: 1,
        validate: {
            validator: Number.isInteger,
            message: "Quantity must be an integer",
        },
    },
});

const cartSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true,
        },

        items: {
            type: [cartItemSchema],
            default: [],
        },
    },
    { timestamps: true }
);

const Cart = mongoose.model("Cart", cartSchema);

export default Cart;
