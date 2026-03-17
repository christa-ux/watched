import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import {
  authenticate,
  generateTokens,
  setTokenCookies,
  clearTokenCookies,
  getUser,
} from '../middleware/auth';
import { TokenPayload } from '../types';

const router = Router();

// Register
router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { name, email, password } = req.body;

      // Check if user exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        res.status(400).json({ message: 'Email already registered' });
        return;
      }

      // Create user
      const user = await User.create({
        name,
        email,
        password,
        shows: [],
        movies: [],
        lists: [],
      });

      // Generate tokens
      const { accessToken, refreshToken } = generateTokens(
        user._id.toString(),
        user.email
      );
      setTokenCookies(res, accessToken, refreshToken);

      res.status(201).json({
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
        },
      });
    } catch (error) {
      console.error('Register error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Login
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { email, password } = req.body;

      // Find user with password
      const user = await User.findOne({ email }).select('+password');
      if (!user) {
        res.status(401).json({ message: 'Invalid email or password' });
        return;
      }

      // Check if user has password (not OAuth-only)
      if (!user.password) {
        res.status(401).json({
          message: 'This account uses Google login. Please sign in with Google.',
        });
        return;
      }

      // Verify password
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        res.status(401).json({ message: 'Invalid email or password' });
        return;
      }

      // Generate tokens
      const { accessToken, refreshToken } = generateTokens(
        user._id.toString(),
        user.email
      );
      setTokenCookies(res, accessToken, refreshToken);

      res.json({
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Logout
router.post('/logout', (_req: Request, res: Response): void => {
  clearTokenCookies(res);
  res.json({ message: 'Logged out successfully' });
});

// Get current user
router.get('/me', authenticate, async (_req: Request, res: Response): Promise<void> => {
  try {
    const user = getUser(res);
    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Refresh token
router.post('/refresh', async (req: Request, res: Response): Promise<void> => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      res.status(401).json({ message: 'Refresh token required' });
      return;
    }

    const decoded = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET!
    ) as TokenPayload;

    const user = await User.findById(decoded.userId);
    if (!user) {
      res.status(401).json({ message: 'User not found' });
      return;
    }

    // Generate new tokens
    const tokens = generateTokens(user._id.toString(), user.email);
    setTokenCookies(res, tokens.accessToken, tokens.refreshToken);

    res.json({ message: 'Token refreshed' });
  } catch (error) {
    clearTokenCookies(res);
    res.status(401).json({ message: 'Invalid refresh token' });
  }
});

export default router;
