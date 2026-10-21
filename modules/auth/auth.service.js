import bcrypt from "bcrypt";
import * as repo from "./auth.repository.js";
import { generateAccessToken, generateRefreshToken } from "../../utils/jwt.js";

export const signup = async (data) => {
    const existing = await repo.findUserByEmail(data.email);
    if (existing) throw new Error("Email already used");

    const hash = await bcrypt.hash(data.password, 10);

    const user = await repo.createUser({
        name: data.name,
        email: data.email,
        password: hash,
        provider: "local",
    });

    return await createSession(user);
};

export const signin = async (data) => {
    const user = await repo.findUserByEmail(data.email);
    if (!user) throw new Error("Invalid credentials");


    const valid = await bcrypt.compare(data.password, user.password);
    if (!valid) throw new Error("Invalid credentials");

    return await createSession(user);
};


export const createSession = async (user) => {
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken();

    await repo.createRefreshToken(user.id, refreshToken);

    return { user, accessToken, refreshToken };
};

// REFRESH TOKEN ROTATION
export const refreshToken = async (oldToken) => {
    const existing = await repo.findRefreshToken(oldToken);
    if (!existing) throw new Error("Invalid refresh token");

    // delete old token (ROTATION)
    await repo.deleteRefreshToken(existing.id);

    const user = await repo.findUserById(existing.user_id);

    return await createSession(user);
};

// UPDATE PROFILE
export const updateMe = async (userId, data) => {
    let updatedData = { ...data };

    if (data.password) {
        updatedData.password = await bcrypt.hash(data.password, 10);
    }

    return await repo.updateUser(userId, updatedData);
};

// REMOVE SESSION (LOGOUT)
export const removeSession = async (refreshToken, userId, all = false) => {
    if (!refreshToken && !all) {
        throw new Error("Refresh token required");
    }

    if (all) {
        // logout semua device
        await repo.deleteAllUserTokens(userId);
        return;
    }

    // logout single device
    await repo.deleteRefreshTokenByToken(refreshToken);
};

export const getUser = async (id) => {
    const user = await repo.findUserById(id);
    if (!user) throw new Error("User not found");

    return {
        id: user.id,
        email: user.email,
        role: user.role,
    };
};