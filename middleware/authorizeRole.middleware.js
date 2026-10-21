export const authorizeRoles = (roles = []) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.sendStatus(401);
        }

        // normalize ke array
        const allowedRoles = Array.isArray(roles) ? roles : [roles];

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                message: "Forbidden: insufficient role",
            });
        }

        next();
    };
};