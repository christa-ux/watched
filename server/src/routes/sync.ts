import { Router, Request, Response } from 'express';
import { authenticate, getUser } from '../middleware/auth';
import { User } from '../models/User';
import { SyncData } from '../types';

const router = Router();

// All sync routes require authentication
router.use(authenticate);

// Pull user data from server
router.get('/pull', async (_req: Request, res: Response): Promise<void> => {
  try {
    const authUser = getUser(res);
    const user = await User.findById(authUser._id);

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Convert to plain object for proper JSON serialization
    const userData = user.toJSON();

    res.json({
      shows: userData.shows || [],
      movies: userData.movies || [],
      lists: userData.lists || [],
    });
  } catch (error) {
    console.error('Pull error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Push local data to server (replaces server data)
router.post('/push', async (req: Request, res: Response): Promise<void> => {
  try {
    const authUser = getUser(res);
    const { shows, movies, lists } = req.body as SyncData;

    // Convert watchedEpisodes objects to Maps for Mongoose
    const processedShows = shows.map((show) => ({
      ...show,
      watchedEpisodes: new Map(Object.entries(show.watchedEpisodes || {})),
    }));

    await User.findByIdAndUpdate(authUser._id, {
      shows: processedShows,
      movies: movies || [],
      lists: lists || [],
    });

    res.json({ message: 'Data synced successfully' });
  } catch (error) {
    console.error('Push error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update shows
router.put('/shows', async (req: Request, res: Response): Promise<void> => {
  try {
    const authUser = getUser(res);
    const { shows } = req.body;

    const processedShows = shows.map((show: { watchedEpisodes?: Record<string, number[]> }) => ({
      ...show,
      watchedEpisodes: new Map(Object.entries(show.watchedEpisodes || {})),
    }));

    await User.findByIdAndUpdate(authUser._id, { shows: processedShows });

    res.json({ message: 'Shows updated' });
  } catch (error) {
    console.error('Update shows error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update movies
router.put('/movies', async (req: Request, res: Response): Promise<void> => {
  try {
    const authUser = getUser(res);
    const { movies } = req.body;

    await User.findByIdAndUpdate(authUser._id, { movies });

    res.json({ message: 'Movies updated' });
  } catch (error) {
    console.error('Update movies error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update lists
router.put('/lists', async (req: Request, res: Response): Promise<void> => {
  try {
    const authUser = getUser(res);
    const { lists } = req.body;

    await User.findByIdAndUpdate(authUser._id, { lists });

    res.json({ message: 'Lists updated' });
  } catch (error) {
    console.error('Update lists error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
