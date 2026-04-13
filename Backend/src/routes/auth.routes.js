import { Router } from 'express';
import * as authController from "../controllers/auth.controller.js"
import authMiddleware from '../middlewares/auth.middleware.js';

//authRouter ka instance banaya
const authRouter = Router();

//routes
authRouter.post("/login",authController.login);
authRouter.post("/google", authController.googleAuth);
authRouter.get("/profile",authMiddleware,authController.getProfile);
authRouter.get("/refresh-token",authController.refreshToken);
authRouter.post("/logout",authController.logout);
authRouter.get("/logout-all",authMiddleware,authController.logoutAll);
authRouter.delete("/delete-account", authMiddleware, authController.deleteAccount);


export default authRouter;