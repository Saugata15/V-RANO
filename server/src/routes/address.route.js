import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import asyncHandler from "../utils/asyncHandler.js";
import {
  createAddressController,
  deleteAddressController,
  getAddressController,
  getAddressesController,
  setDefaultAddressController,
  updateAddressController,
} from "../controllers/address.controller.js";
import {
  addressIdValidator,
  createAddressValidator,
  updateAddressValidator,
} from "../validators/address.validator.js";
import { validate } from "../middlewares/validate.middleware.js";

const router = Router();

router.post(
  "/",
  asyncHandler(requireAuth),
  createAddressValidator,
  validate,
  asyncHandler(createAddressController),
);

router.get("/", asyncHandler(requireAuth), asyncHandler(getAddressesController));

router.get(
  "/:id",
  asyncHandler(requireAuth),
  addressIdValidator,
  validate,
  asyncHandler(getAddressController),
);

router.patch(
  "/:id",
  asyncHandler(requireAuth),
  updateAddressValidator,
  validate,
  asyncHandler(updateAddressController),
);

router.patch(
  "/:id/default",
  asyncHandler(requireAuth),
  addressIdValidator,
  validate,
  asyncHandler(setDefaultAddressController),
);

router.delete(
  "/:id",
  asyncHandler(requireAuth),
  addressIdValidator,
  validate,
  asyncHandler(deleteAddressController),
);

export default router;