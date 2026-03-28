import { Router, Request, Response } from 'express';
import { authenticate, getUser } from '../middleware/auth';
import { User, IUserDocument } from '../models/User';

const router = Router();
router.use(authenticate);

// Jaccard similarity score between two users' libraries
function calculateCompatibility(user1: IUserDocument, user2: IUserDocument): number {
  const u1Shows = new Set(user1.shows.map((s) => `show-${s.id}`));
  const u2Shows = new Set(user2.shows.map((s) => `show-${s.id}`));
  const u1Movies = new Set(user1.movies.map((m) => `movie-${m.id}`));
  const u2Movies = new Set(user2.movies.map((m) => `movie-${m.id}`));

  const u1All = new Set([...u1Shows, ...u1Movies]);
  const u2All = new Set([...u2Shows, ...u2Movies]);

  let shared = 0;
  for (const item of u1All) {
    if (u2All.has(item)) shared++;
  }

  const union = new Set([...u1All, ...u2All]).size;
  if (union === 0) return 0;
  return Math.round((shared / union) * 100);
}

// GET /api/friends — accepted friends with compatibility scores
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const authUser = getUser(res);
    const user = await User.findById(authUser._id);
    if (!user) { res.status(404).json({ message: 'User not found' }); return; }

    const acceptedIds = user.friends
      .filter((f) => f.status === 'accepted')
      .map((f) => f.userId);

    const friends = await User.find({ _id: { $in: acceptedIds } }).select('name email avatar shows movies');

    const result = friends.map((friend) => ({
      id: friend._id,
      name: friend.name,
      email: friend.email,
      avatar: friend.avatar || null,
      compatibilityScore: calculateCompatibility(user, friend),
    }));

    res.json({ friends: result });
  } catch (error) {
    console.error('Get friends error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/friends/requests — pending requests (received + sent)
router.get('/requests', async (_req: Request, res: Response): Promise<void> => {
  try {
    const authUser = getUser(res);
    const user = await User.findById(authUser._id);
    if (!user) { res.status(404).json({ message: 'User not found' }); return; }

    const pendingIds = user.friends
      .filter((f) => f.status === 'pending')
      .map((f) => f.userId);

    const pendingUsers = await User.find({ _id: { $in: pendingIds } }).select('name email avatar');

    const requests = user.friends
      .filter((f) => f.status === 'pending')
      .map((f) => {
        const u = pendingUsers.find((p) => p._id.toString() === f.userId.toString());
        return {
          userId: f.userId,
          name: u?.name || '',
          email: u?.email || '',
          avatar: u?.avatar || null,
          initiatedByMe: f.initiatedBy.toString() === authUser._id.toString(),
        };
      });

    res.json({ requests });
  } catch (error) {
    console.error('Get requests error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/friends/search?q= — search users by name or email
router.get('/search', async (req: Request, res: Response): Promise<void> => {
  try {
    const authUser = getUser(res);
    const q = (req.query.q as string || '').trim();
    if (!q || q.length < 2) { res.json({ users: [] }); return; }

    const users = await User.find({
      _id: { $ne: authUser._id },
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
      ],
    }).select('name email avatar').limit(10);

    // Load current user to know existing friend statuses
    const me = await User.findById(authUser._id);
    const friendMap = new Map(
      (me?.friends || []).map((f) => [f.userId.toString(), f.status])
    );

    const result = users.map((u) => ({
      id: u._id,
      name: u.name,
      email: u.email,
      avatar: u.avatar || null,
      friendStatus: friendMap.get(u._id.toString()) || null,
    }));

    res.json({ users: result });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/friends/request — send friend request { targetUserId }
router.post('/request', async (req: Request, res: Response): Promise<void> => {
  try {
    const authUser = getUser(res);
    const { targetUserId } = req.body;
    if (!targetUserId) { res.status(400).json({ message: 'targetUserId required' }); return; }
    if (targetUserId === authUser._id.toString()) {
      res.status(400).json({ message: 'Cannot add yourself' }); return;
    }

    const [me, target] = await Promise.all([
      User.findById(authUser._id),
      User.findById(targetUserId),
    ]);
    if (!me || !target) { res.status(404).json({ message: 'User not found' }); return; }

    const alreadyExists = me.friends.some((f) => f.userId.toString() === targetUserId);
    if (alreadyExists) { res.status(400).json({ message: 'Friend request already exists' }); return; }

    // Add pending entry on both sides
    me.friends.push({ userId: target._id as any, status: 'pending', initiatedBy: me._id as any, createdAt: new Date() });
    target.friends.push({ userId: me._id as any, status: 'pending', initiatedBy: me._id as any, createdAt: new Date() });

    await Promise.all([me.save(), target.save()]);
    res.json({ message: 'Friend request sent' });
  } catch (error) {
    console.error('Send request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/friends/accept/:userId — accept a friend request
router.post('/accept/:userId', async (req: Request, res: Response): Promise<void> => {
  try {
    const authUser = getUser(res);
    const { userId } = req.params;

    const [me, other] = await Promise.all([
      User.findById(authUser._id),
      User.findById(userId),
    ]);
    if (!me || !other) { res.status(404).json({ message: 'User not found' }); return; }

    const myEntry = me.friends.find((f) => f.userId.toString() === userId && f.status === 'pending');
    const theirEntry = other.friends.find((f) => f.userId.toString() === authUser._id.toString() && f.status === 'pending');

    if (!myEntry) { res.status(400).json({ message: 'No pending request found' }); return; }

    myEntry.status = 'accepted';
    if (theirEntry) theirEntry.status = 'accepted';

    await Promise.all([me.save(), other.save()]);
    res.json({ message: 'Friend request accepted' });
  } catch (error) {
    console.error('Accept request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/friends/:userId — decline request or remove friend
router.delete('/:userId', async (req: Request, res: Response): Promise<void> => {
  try {
    const authUser = getUser(res);
    const { userId } = req.params;

    const [me, other] = await Promise.all([
      User.findById(authUser._id),
      User.findById(userId),
    ]);
    if (!me) { res.status(404).json({ message: 'User not found' }); return; }

    me.friends = me.friends.filter((f) => f.userId.toString() !== userId) as typeof me.friends;
    if (other) {
      other.friends = other.friends.filter((f) => f.userId.toString() !== authUser._id.toString()) as typeof other.friends;
      await other.save();
    }
    await me.save();
    res.json({ message: 'Removed' });
  } catch (error) {
    console.error('Remove friend error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/friends/cowatch-progress — returns co-watcher episode/watched progress
router.get('/cowatch-progress', async (_req: Request, res: Response): Promise<void> => {
  try {
    const authUser = getUser(res);
    const user = await User.findById(authUser._id);
    if (!user) { res.status(404).json({ message: 'User not found' }); return; }

    // Collect all co-watcher IDs across shows and movies
    const coWatcherIds = new Set<string>();
    user.shows.forEach((s) => s.coWatchers.forEach((cw) => coWatcherIds.add(cw.userId)));
    user.movies.forEach((m) => m.coWatchers.forEach((cw) => coWatcherIds.add(cw.userId)));

    if (coWatcherIds.size === 0) { res.json({ shows: {}, movies: {} }); return; }

    const cwUsers = await User.find({ _id: { $in: [...coWatcherIds] } }).select('name avatar shows movies');

    const showProgress: Record<number, Array<{ userId: string; name: string; avatar: string | null; watchedCount: number; watchedEpisodes: Record<string, number[]> }>> = {};
    const movieProgress: Record<number, Array<{ userId: string; name: string; avatar: string | null; watched: boolean }>> = {};

    user.shows.forEach((show) => {
      if (!show.coWatchers.length) return;
      showProgress[show.id] = [];
      show.coWatchers.forEach((cw) => {
        const cwUser = cwUsers.find((u) => u._id.toString() === cw.userId);
        if (!cwUser) return;
        const cwShow = cwUser.shows.find((s) => s.id === show.id);
        const we = cwShow?.watchedEpisodes;
        const weObj = we instanceof Map ? Object.fromEntries(we) : (we || {});
        const watchedCount = Object.values(weObj).reduce((a: number, b) => a + (b as number[]).length, 0);
        showProgress[show.id].push({
          userId: cw.userId,
          name: cwUser.name,
          avatar: cwUser.avatar || null,
          watchedCount,
          watchedEpisodes: weObj as Record<string, number[]>,
        });
      });
    });

    user.movies.forEach((movie) => {
      if (!movie.coWatchers.length) return;
      movieProgress[movie.id] = [];
      movie.coWatchers.forEach((cw) => {
        const cwUser = cwUsers.find((u) => u._id.toString() === cw.userId);
        if (!cwUser) return;
        const cwMovie = cwUser.movies.find((m) => m.id === movie.id);
        movieProgress[movie.id].push({
          userId: cw.userId,
          name: cwUser.name,
          avatar: cwUser.avatar || null,
          watched: cwMovie?.watched || false,
        });
      });
    });

    res.json({ shows: showProgress, movies: movieProgress });
  } catch (error) {
    console.error('Cowatch progress error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/friends/cowatch/show/:showId — update co-watchers for a show
router.post('/cowatch/show/:showId', async (req: Request, res: Response): Promise<void> => {
  try {
    const authUser = getUser(res);
    const showId = parseInt(req.params.showId);
    const { coWatchers } = req.body as { coWatchers: Array<{ userId: string; name: string; avatar: string | null }> };

    await User.updateOne(
      { _id: authUser._id, 'shows.id': showId },
      { $set: { 'shows.$.coWatchers': coWatchers } }
    );

    res.json({ message: 'Co-watchers updated' });
  } catch (error) {
    console.error('Update show co-watchers error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/friends/cowatch/movie/:movieId — update co-watchers for a movie
router.post('/cowatch/movie/:movieId', async (req: Request, res: Response): Promise<void> => {
  try {
    const authUser = getUser(res);
    const movieId = parseInt(req.params.movieId);
    const { coWatchers } = req.body as { coWatchers: Array<{ userId: string; name: string; avatar: string | null }> };

    await User.updateOne(
      { _id: authUser._id, 'movies.id': movieId },
      { $set: { 'movies.$.coWatchers': coWatchers } }
    );

    res.json({ message: 'Co-watchers updated' });
  } catch (error) {
    console.error('Update movie co-watchers error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
