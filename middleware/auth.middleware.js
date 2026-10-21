import jwt from "jsonwebtoken";

export const auth = (req, res, next) => {
    const token =
        req.cookies.access_token || req.headers.authorization?.split(" ")[1];

    if (!token) return res.sendStatus(401);

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch {
        return res.sendStatus(401);
    }
};