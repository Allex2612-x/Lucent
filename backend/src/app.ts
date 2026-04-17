import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { errorHandler } from './middleware/errorHandler.js';
import authRoutes from './modules/auth/auth.routes.js';
import userRoutes from './modules/user/user.routes.js';
import categoryRoutes from './modules/category/category.routes.js';
import transactionRoutes from './modules/transaction/transaction.routes.js';
import budgetRoutes from './modules/budget/budget.routes.js';

const app = express();

// Security and utility middlewares
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:5173', 'exp://localhost:8081'],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('dev'));

// Basic health route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/budgets', budgetRoutes);

// Error handling middleware should be last
app.use(errorHandler);

export { app };
