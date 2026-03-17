import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import passport from 'passport';
import dotenv from 'dotenv';

import { connectDatabase } from './config/database';
import { configurePassport } from './config/passport';
import authRoutes from './routes/auth';
import googleRoutes from './routes/google';
import syncRoutes from './routes/sync';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  })
);

// Body parsing
app.use(express.json());
app.use(cookieParser());

// Initialize Passport
app.use(passport.initialize());
configurePassport();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/auth', googleRoutes);
app.use('/api/sync', syncRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Error handler
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error('Error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
);

// Start server
const startServer = async () => {
  try {
    await connectDatabase();
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
