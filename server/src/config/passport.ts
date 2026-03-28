import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { User } from '../models/User';

export const configurePassport = (): void => {
  // Only configure Google OAuth if credentials are provided
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback',
        },
        async (_accessToken, _refreshToken, profile, done) => {
          try {
            // Check if user exists with this Google ID
            let user = await User.findOne({ googleId: profile.id });

            if (user) {
              return done(null, user);
            }

            // Check if user exists with this email
            const email = profile.emails?.[0]?.value;
            if (email) {
              user = await User.findOne({ email });
              if (user) {
                // Link Google account to existing user
                user.googleId = profile.id;
                if (!user.avatar && profile.photos?.[0]?.value) {
                  user.avatar = profile.photos[0].value;
                }
                await user.save();
                return done(null, user);
              }
            }

            // Create new user
            user = await User.create({
              googleId: profile.id,
              email: email,
              name: profile.displayName,
              avatar: profile.photos?.[0]?.value,
              shows: [],
              movies: [],
              lists: [],
            });

            done(null, user);
          } catch (error) {
            done(error as Error, undefined);
          }
        }
      )
    );
  }

  passport.serializeUser((user, done) => {
    done(null, (user as { _id: string })._id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });
};
