import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import passport from 'passport';
import path from 'path';
import { errorHandler } from './middleware/errorHandler.js';
import authRoutes from './modules/auth/auth.routes.js';
import userRoutes from './modules/user/user.routes.js';
import categoryRoutes from './modules/category/category.routes.js';
import transactionRoutes from './modules/transaction/transaction.routes.js';
import budgetRoutes from './modules/budget/budget.routes.js';
import statisticsRoutes from './modules/statistics/statistics.routes.js';
import reportRoutes from './modules/report/report.routes.js';
import notificationRoutes from './modules/notification/notification.routes.js';
import insightsRoutes from './modules/insights/insights.routes.js';

const app = express();

// Security and utility middlewares
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for development
  crossOriginEmbedderPolicy: false,
  // Default `same-origin` blocks the frontend (localhost:5173) from
  // loading static assets served by this backend (localhost:4000), e.g.
  // receipt photos rendered in <img>. Relax to `cross-origin` so the
  // browser can fetch them across the dev ports.
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(cors({
  origin: ['http://localhost:5173', 'exp://localhost:8081', process.env.FRONTEND_URL].filter(Boolean) as string[],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
// 5mb covers the largest payloads (base64-encoded avatar + CSV import).
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));
app.use(cookieParser());
app.use(morgan('dev'));
app.use(passport.initialize());

// Serve uploaded receipt photos so the frontend can render them inline
// (a Lidl-Plus-style thumbnail next to each transaction). The directory
// lives at <repo>/backend/uploads and is created on demand by the
// receipt-scanner service.
app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')));

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
app.use('/api/statistics', statisticsRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/insights', insightsRoutes);

// Error handling middleware should be last
app.use(errorHandler);

export { app };
