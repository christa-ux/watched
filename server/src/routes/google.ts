import { Router, Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { IUserDocument } from '../models/User';
import { generateTokens, setTokenCookies } from '../middleware/auth';

const router = Router();

// Check if Google OAuth is configured
const isGoogleConfigured = (): boolean => {
  return !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
};

// Initiate Google OAuth
router.get('/google', (req: Request, res: Response, next: NextFunction): void => {
  if (!isGoogleConfigured()) {
    res.status(501).json({ message: 'Google OAuth is not configured' });
    return;
  }

  passport.authenticate('google', {
    scope: ['profile', 'email'],
  })(req, res, next);
});

// Google OAuth callback
router.get(
  '/google/callback',
  (req: Request, res: Response, next: NextFunction): void => {
    if (!isGoogleConfigured()) {
      res.redirect(`${process.env.FRONTEND_URL}/login?error=google_not_configured`);
      return;
    }

    passport.authenticate('google', { session: false }, (err: Error | null, user: IUserDocument | false) => {
      if (err || !user) {
        console.error('Google auth error:', err);
        return res.redirect(`${process.env.FRONTEND_URL}/login?error=auth_failed`);
      }

      // Generate tokens
      const { accessToken, refreshToken } = generateTokens(
        user._id.toString(),
        user.email
      );
      setTokenCookies(res, accessToken, refreshToken);

      // Redirect to frontend
      res.redirect(`${process.env.FRONTEND_URL}/`);
    })(req, res, next);
  }
);

export default router;
