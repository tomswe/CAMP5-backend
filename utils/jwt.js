import jwt from "jsonwebtoken";
import crypto from "crypto";

export const generateAccessToken = (user) => {
    return jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
        expiresIn: "1h",
    });
};

export const generateRefreshToken = () => {
    return crypto.randomBytes(64).toString("hex");
};