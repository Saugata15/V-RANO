import mongoose from "mongoose";
import { ADDRESS_TYPES } from "../constants/address.constants.js";

const addressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 60,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    line1: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    line2: {
      type: String,
      trim: true,
      maxlength: 120,
      default: "",
    },
    landmark: {
      type: String,
      trim: true,
      maxlength: 80,
      default: "",
    },
    city: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    state: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    postalCode: {
      type: String,
      required: true,
      trim: true,
      match: [/^[1-9][0-9]{5}$/, "Invalid postal code"],
    },
    country: {
      type: String,
      default: "India",
      trim: true,
    },
    type: {
      type: String,
      enum: ADDRESS_TYPES,
      default: "home",
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

// At most one default address per user, enforced by the database
addressSchema.index(
  { user: 1, isDefault: 1 },
  { unique: true, partialFilterExpression: { isDefault: true } },
);

const Address = mongoose.model("Address", addressSchema);

export default Address;
