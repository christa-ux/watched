import { Request, Response, NextFunction } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import { User, IUserDocument } from '../models/User';
import { TokenPayload } from '../types';

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.cookies.accessToken;

    if (!token) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET!
    ) as TokenPayload;

    const user = await User.findById(decoded.userId);

    if (!user) {
      res.status(401).json({ message: 'User not found' });
      return;
    }

    // Store user in request locals
    res.locals.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ message: 'Token expired', code: 'TOKEN_EXPIRED' });
      return;
    }
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Helper to get user from response locals
export const getUser = (res: Response): IUserDocument => {
  return res.locals.user as IUserDocument;
};

export const generateTokens = (userId: string, email: string) => {
  const accessTokenOptions: SignOptions = {
    expiresIn: 900, // 15 minutes in seconds
  };

  const refreshTokenOptions: SignOptions = {
    expiresIn: 604800, // 7 days in seconds
  };

  const accessToken = jwt.sign(
    { userId, email } as TokenPayload,
    process.env.JWT_SECRET!,
    accessTokenOptions
  );

  const refreshToken = jwt.sign(
    { userId, email } as TokenPayload,
    process.env.REFRESH_TOKEN_SECRET!,
    refreshTokenOptions
  );

  return { accessToken, refreshToken };
};

export const setTokenCookies = (
  res: Response,
  accessToken: string,
  refreshToken: string
) => {
  const isProduction = process.env.NODE_ENV === 'production';

  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    maxAge: 15 * 60 * 1000, // 15 minutes
  });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

export const clearTokenCookies = (res: Response) => {
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
};
