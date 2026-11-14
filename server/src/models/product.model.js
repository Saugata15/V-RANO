import mongoose from "mongoose";

const variantSchema = new mongoose.Schema(
  {
    size: {
      type: String,
      required: true,
      enum: ["S", "M", "L", "XL", "XXL"],
    },

    color: {
      type: String,
      required: true,
      trim: true,
      enum: [
        "Black",
        "White",
        "Grey",
        "Navy Blue",
        "Royal Blue",
        "Sky Blue",
        "Olive Green",
        "Beige",
        "Brown",
        "Maroon",
        "Red",
        "Burgundy",
        "Pink",
        "Lavender",
        "Purple",
        "Yellow",
        "Orange",
        "Cream",
      ],
    },

    stock: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
      validate: {
        validator: Number.isInteger,
        message: "Stock must be an integer",
      },
    },
  },
  { _id: false },
);

const imageSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true,
      trim: true,
    },

    fileId: {
      type: String,
      required: true,
    },

    alt: {
      type: String,
      default: "",
      trim: true,
    },

    isPrimary: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false },
);

const productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 6,
      maxlength: 60,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      minlength: 20,
      maxlength: 200,
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
      index: true,
    },
    brand: {
      type: String,
      required: true,
      trim: true,
    },
    images: {
      type: [imageSchema],
      default: [],
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    compareAtPrice: {
      type: Number,
      min: 0,
      default: null,
      validate: {
        validator: function (value) {
          return value == null || value > this.price;
        },
        message: "Compare-at price must be greater than selling price",
      },
    },
    tags: {
      type: [String],
      default: [],
    },
    variants: {
      type: [variantSchema],
      validate: {
        validator: (variants) => variants.length > 0,
        message: "At least one variant is required",
      },
    },
    ratings: {
      average: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
      },

      count: {
        type: Number,
        default: 0,
        min: 0,
        validate: {
          validator: Number.isInteger,
          message: "Rating count must be an integer",
        },
      },
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["active", "archived"],
      default: "active",
      index: true,
    },
  },
  { timestamps: true },
);

productSchema.path("images").validate(function (images) {
  const primaryImages = images.filter((image) => image.isPrimary);

  return primaryImages.length <= 1;
}, "Only one primary image is allowed");

productSchema.pre("validate", function () {
  const combinations = this.variants.map(
    (variant) =>
      `${variant.size.trim().toLowerCase()}-${variant.color.trim().toLowerCase()}`,
  );

  if (new Set(combinations).size !== combinations.length) {
    this.invalidate(
      "variants",
      "Duplicate size and color combinations are not allowed",
    );
  }
});

productSchema.index({ status: 1, categoryId: 1, createdAt: -1 });
productSchema.index({ status: 1, createdAt: -1 });
productSchema.index({ status: 1, price: 1 });

const Product = mongoose.model("Product", productSchema);

export default Product;
