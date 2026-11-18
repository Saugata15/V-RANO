import {
  countAddressesByUserDAO,
  createAddressDAO,
  deleteAddressDAO,
  findAddressByIdDAO,
  getAddressesByUserDAO,
  promoteLatestAddressDAO,
  setDefaultAddressDAO,
  unsetDefaultAddressesDAO,
  updateAddressDAO,
} from "../DAO/address.dao.js";
import { MAX_ADDRESSES_PER_USER } from "../constants/address.constants.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { AppError } from "../utils/AppError.js";

const EDITABLE_FIELDS = [
  "fullName",
  "phone",
  "line1",
  "line2",
  "landmark",
  "city",
  "state",
  "postalCode",
  "type",
];

// Add address
export const createAddressController = async (req, res) => {
  const userId = req.user._id;

  const count = await countAddressesByUserDAO(userId);

  if (count >= MAX_ADDRESSES_PER_USER) {
    throw new AppError(
      400,
      `You can save up to ${MAX_ADDRESSES_PER_USER} addresses`,
    );
  }

  const data = {};
  for (const field of EDITABLE_FIELDS) {
    if (req.body[field] !== undefined) data[field] = req.body[field];
  }

  const makeDefault = count === 0 || req.body.isDefault === true;

  if (makeDefault) {
    await unsetDefaultAddressesDAO(userId);
  }

  const address = await createAddressDAO({
    ...data,
    user: userId,
    isDefault: makeDefault,
  });

  sendSuccess(res, 201, "Address added successfully", { address });
};

// Get my addresses
export const getAddressesController = async (req, res) => {
  const addresses = await getAddressesByUserDAO(req.user._id);

  sendSuccess(res, 200, "Addresses fetched successfully", { addresses });
};

// Get one address
export const getAddressController = async (req, res) => {
  const address = await findAddressByIdDAO({
    userId: req.user._id,
    id: req.params.id,
  });

  if (!address) {
    throw new AppError(404, "Address not found");
  }

  sendSuccess(res, 200, "Address fetched successfully", { address });
};

// Update address fields
export const updateAddressController = async (req, res) => {
  const updateData = {};

  for (const field of EDITABLE_FIELDS) {
    if (req.body[field] !== undefined) updateData[field] = req.body[field];
  }

  if (Object.keys(updateData).length === 0) {
    throw new AppError(400, "No fields provided for update");
  }

  const address = await updateAddressDAO({
    userId: req.user._id,
    id: req.params.id,
    updateData,
  });

  if (!address) {
    throw new AppError(404, "Address not found");
  }

  sendSuccess(res, 200, "Address updated successfully", { address });
};

// Make an address the default
export const setDefaultAddressController = async (req, res) => {
  const userId = req.user._id;
  const { id } = req.params;

  const existing = await findAddressByIdDAO({ userId, id });

  if (!existing) {
    throw new AppError(404, "Address not found");
  }

  if (!existing.isDefault) {
    await unsetDefaultAddressesDAO(userId);
  }

  const address = await setDefaultAddressDAO({ userId, id });

  sendSuccess(res, 200, "Default address updated successfully", { address });
};

// Delete address
export const deleteAddressController = async (req, res) => {
  const userId = req.user._id;
  const { id } = req.params;

  const deleted = await deleteAddressDAO({ userId, id });

  if (!deleted) {
    throw new AppError(404, "Address not found");
  }

  if (deleted.isDefault) {
    await promoteLatestAddressDAO(userId);
  }

  sendSuccess(res, 200, "Address deleted successfully");
};