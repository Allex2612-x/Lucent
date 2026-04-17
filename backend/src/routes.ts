import { Router } from "express";
import authRouter from "./modules/auth/auth.routes.js";
import userRouter from "./modules/user/user.routes.js";

export const apiRouter = Router();

// Modules will mount here:
// - /auth
// - /users
// - /transactions
// - /categories
// - /budgets
// - /notifications
// - /statistics
// - /reports
// - /ocr (optional)

apiRouter.use("/auth", authRouter);
apiRouter.use("/users", userRouter);

