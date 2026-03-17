import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUserDocument extends Document {
  email: string;
  password?: string;
  googleId?: string;
  name: string;
  avatar?: string;
  shows: Array<{
    id: number;
    name: string;
    posterPath: string | null;
    addedAt: string;
    totalSeasons: number;
    totalEpisodes: number;
    watchedEpisodes: Map<string, number[]>;
  }>;
  movies: Array<{
    id: number;
    title: string;
    posterPath: string | null;
    addedAt: string;
    watched: boolean;
    watchedAt: string | null;
  }>;
  lists: Array<{
    id: string;
    name: string;
    createdAt: string;
    items: Array<{
      id: number;
      type: 'show' | 'movie';
      name: string;
      posterPath: string | null;
      addedAt: string;
    }>;
  }>;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const listItemSchema = new Schema({
  id: { type: Number, required: true },
  type: { type: String, enum: ['show', 'movie'], required: true },
  name: { type: String, required: true },
  posterPath: { type: String, default: null },
  addedAt: { type: String, required: true },
}, { _id: false });

const customListSchema = new Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  createdAt: { type: String, required: true },
  items: [listItemSchema],
}, { _id: false });

const watchedShowSchema = new Schema({
  id: { type: Number, required: true },
  name: { type: String, required: true },
  posterPath: { type: String, default: null },
  addedAt: { type: String, required: true },
  totalSeasons: { type: Number, required: true },
  totalEpisodes: { type: Number, required: true },
  watchedEpisodes: { type: Map, of: [Number], default: {} },
}, { _id: false });

const watchedMovieSchema = new Schema({
  id: { type: Number, required: true },
  title: { type: String, required: true },
  posterPath: { type: String, default: null },
  addedAt: { type: String, required: true },
  watched: { type: Boolean, default: false },
  watchedAt: { type: String, default: null },
}, { _id: false });

const userSchema = new Schema<IUserDocument>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      select: false, // Don't include password by default in queries
    },
    googleId: {
      type: String,
      sparse: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    avatar: {
      type: String,
    },
    shows: [watchedShowSchema],
    movies: [watchedMovieSchema],
    lists: [customListSchema],
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

// Transform watchedEpisodes Map to plain object for JSON
userSchema.set('toJSON', {
  virtuals: true,
  transform: function(_doc, ret) {
    // Transform shows' watchedEpisodes from Map to plain object
    if (ret.shows) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ret.shows = ret.shows.map((show: any) => {
        const we = show.watchedEpisodes;
        return {
          id: show.id,
          name: show.name,
          posterPath: show.posterPath,
          addedAt: show.addedAt,
          totalSeasons: show.totalSeasons,
          totalEpisodes: show.totalEpisodes,
          watchedEpisodes: we instanceof Map ? Object.fromEntries(we) : (we || {}),
        };
      });
    }
    // Remove sensitive fields
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj = ret as any;
    delete obj.password;
    delete obj.__v;
    return ret;
  },
});

export const User = mongoose.model<IUserDocument>('User', userSchema);
