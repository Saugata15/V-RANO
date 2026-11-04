import bcrypt from 'bcrypt'
import User from '../models/user.model.js'

const SALT = 12;

export const findUserByEmail = async (email) => {
    const user = await User.findOne({ email }).select("+passwordHash");
    return user;
};

export const createUser = async ({ name, email, password }) => {
    const passwordHash = await bcrypt.hash(password, SALT);
    const newUser = await User.create({ name, email, passwordHash });
    return newUser;
};

export const comparePassword = async ({ givenPassword, passwordHash }) => {
    return await bcrypt.compare(givenPassword, passwordHash);
}