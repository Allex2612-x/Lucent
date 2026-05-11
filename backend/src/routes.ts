import { Router } from "express";
import authRouter from "./modules/auth/auth.routes.js";
import userRouter from "./modules/user/user.routes.js";
import transactionRouter from "./modules/transaction/transaction.routes.js";
import categoryRouter from "./modules/category/category.routes.js";
import budgetRouter from "./modules/budget/budget.routes.js";
import notificationRouter from "./modules/notification/notification.routes.js";
import statisticsRouter from "./modules/statistics/statistics.routes.js";
import reportRouter from "./modules/report/report.routes.js";

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
apiRouter.use("/transactions", transactionRouter);
apiRouter.use("/categories", categoryRouter);
apiRouter.use("/budgets", budgetRouter);
apiRouter.use("/notifications", notificationRouter);
apiRouter.use("/statistics", statisticsRouter);
apiRouter.use("/reports", reportRouter);

