import Address from "../models/address.model.js";

export const countAddressesByUserDAO = async (userId) => {
    return await Address.countDocuments({ user: userId });
};

export const createAddressDAO = async (data) => {
    return await Address.create(data);
};

export const getAddressesByUserDAO = async (userId) => {
    return await Address.find({ user: userId })
        .sort({ isDefault: -1, createdAt: -1 })
        .lean();
};

export const findAddressByIdDAO = async ({ userId, id }) => {
    return await Address.findOne({ _id: id, user: userId }).lean();
};

export const updateAddressDAO = async ({ userId, id, updateData }) => {
    return await Address.findOneAndUpdate(
        { _id: id, user: userId },
        { $set: updateData },
        { new: true, runValidators: true },
    ).lean();
};

export const deleteAddressDAO = async ({ userId, id }) => {
    return await Address.findOneAndDelete({ _id: id, user: userId }).lean();
};

// Clear the default flag on every address of this user
export const unsetDefaultAddressesDAO = async (userId) => {
    return await Address.updateMany(
        { user: userId, isDefault: true },
        { $set: { isDefault: false } },
    );
};

export const setDefaultAddressDAO = async ({ userId, id }) => {
    return await Address.findOneAndUpdate(
        { _id: id, user: userId },
        { $set: { isDefault: true } },
        { new: true },
    ).lean();
};

// After deleting the default, make the newest remaining address the default
export const promoteLatestAddressDAO = async (userId) => {
    const latest = await Address.findOne({ user: userId }).sort({
        createdAt: -1,
    });

    if (!latest) return null;

    latest.isDefault = true;
    await latest.save();

    return latest;
};