export const SUPPORTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/jpg",
  "image/avif",
];

export const APPAREL_SIZES = ["S", "M", "L", "XL", "XXL", "Free Size"];

// UK/India shoe sizes. Sent as strings: "8", not 8.
export const FOOTWEAR_SIZES = ["3", "4", "5", "6", "7", "8", "9", "10", "11"];

// Keep this name: your model, cart, order and validators already import it
export const PRODUCT_SIZES = [...APPAREL_SIZES, ...FOOTWEAR_SIZES];

export const SIZES_BY_TYPE = {
  apparel: APPAREL_SIZES,
  footwear: FOOTWEAR_SIZES,
};

export const PRODUCT_COLORS = [
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
];

export const MAX_QUANTITY_PER_ITEM = 10;

export const PRODUCT_TAGS = [
  // occasion
  "festive", "wedding", "party", "casual", "daily-wear",
  // style
  "ethnic", "kurta", "kurta-set", "saree", "dupatta", "trousers",
  // pattern
  "printed", "floral", "geometric", "motifs", "embellished",
  // fabric
  "silk", "chanderi", "cotton", "dobby",

  "formal", "office", "sleepwear", "activewear", "sports", "winter", "summer",
  "shirt", "t-shirt", "jeans", "denim", "jacket", "dress", "top",
  "sneakers", "sandals", "formal-shoes", "boots", "leather",
];

export const MAX_TAGS_PER_PRODUCT = 10;

export const PRODUCT_FITS = ["regular", "slim", "relaxed", "oversized"];