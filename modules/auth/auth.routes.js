import { Router } from "express";
import * as authController from "./auth.controller.js";
import { auth } from "../../middleware/auth.middleware.js";

const router = Router();

// LOCAL
router.post("/local/signup", authController.signup);
router.post("/local/signin", authController.signin);

// REFRESH
router.post("/refresh-token", authController.refresh);

// ME
router.get("/user/me", auth, authController.me);

// UPDATE PROFILE
router.put("/user/me", auth, authController.updateMe);

// LOGOUT
router.delete("/remove-session", auth, authController.removeSession);

export default router;