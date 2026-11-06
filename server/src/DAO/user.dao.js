import bcrypt from "bcrypt";
import User from "../models/user.model.js";

const SALT = 12;

export const hashPassword = async (password) => {
  return await bcrypt.hash(password, SALT);
};

export const findUserByEmail = async (email) => {
  const user = await User.findOne({ email }).select("+passwordHash");
  return user;
};

export const createUser = async ({ name, email, password }) => {
  const passwordHash = await hashPassword(password);
  const newUser = await User.create({ name, email, passwordHash });
  return newUser;
};

export const findUserByIdWithPassword = async (userId) => {
  const user = await User.findById(userId).select("+passwordHash");
  return user;
};

export const setUserPassword = async ({ user, passwordHash }) => {
  user.passwordHash = passwordHash;
  await user.save();
  return user;
};

export const comparePassword = async ({ givenPassword, passwordHash }) => {
  return await bcrypt.compare(givenPassword, passwordHash);
};

export const findUserById = async (userId) => {
  const user = await User.findById(userId).select("+avatarFileId");
  return user;
};

export const findByGoogleId = async (googleId) => {
  const user = await User.findOne({ googleId });
  return user;
};

export const createGoogleUser = async ({ name, email, googleId }) => {
  const newUser = await User.create({ name, email, googleId });
  return newUser;
};
