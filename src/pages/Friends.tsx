import { useState, useEffect, useCallback } from 'react';
import { Users, Search, UserPlus, Check, X, UserMinus } from 'lucide-react';
import { friendsApi, SearchedUser } from '../api/friends';
import type { Friend, FriendRequest } from '../types';
import { useAuth } from '../context/AuthContext';

function Avatar({ name, avatar, size = 'md' }: { name: string; avatar: string | null; size?: 'sm' | 'md' | 'lg' }) {
  const [error, setError] = useState(false);
  const sizeClass = size === 'sm' ? 'h-8 w-8 text-xs' : size === 'lg' ? 'h-14 w-14 text-lg' : 'h-10 w-10 text-sm';
  if (avatar && !error) {
    return (
      <img
        src={avatar}
        alt={name}
        className={`${sizeClass} rounded-full object-cover flex-shrink-0`}
        onError={() => setError(true)}
      />
    );
  }
  return (
    <div className={`${sizeClass} flex items-center justify-center rounded-full bg-indigo-100 font-medium text-indigo-600 flex-shrink-0`}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

function CompatibilityBar({ score }: { score: number }) {
  const color = score >= 70 ? 'bg-green-500' : score >= 40 ? 'bg-yellow-500' : 'bg-red-400';
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className="w-10 text-right text-xs font-semibold text-gray-700">{score}%</span>
    </div>
  );
}

export default function Friends() {
  const { isAuthenticated } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchedUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const [f, r] = await Promise.all([friendsApi.getFriends(), friendsApi.getRequests()]);
      setFriends(f);
      setRequests(r);
    } catch {
      // ignore
    }
  }, [isAuthenticated]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (searchQuery.length < 2) { setSearchResults([]); return; }
    const timeout = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await friendsApi.searchUsers(searchQuery);
        setSearchResults(results);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  const handleSendRequest = async (userId: string) => {
    setLoadingAction(userId);
    setError('');
    try {
      await friendsApi.sendRequest(userId);
      setSearchResults((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, friendStatus: 'pending' } : u))
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to send request');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleAccept = async (userId: string) => {
    setLoadingAction(userId);
    try {
      await friendsApi.acceptRequest(userId);
      await load();
    } catch {
      // ignore
    } finally {
      setLoadingAction(null);
    }
  };

  const handleDeclineOrRemove = async (userId: string) => {
    setLoadingAction(userId);
    try {
      await friendsApi.removeFriend(userId);
      await load();
    } catch {
      // ignore
    } finally {
      setLoadingAction(null);
    }
  };

  const receivedRequests = requests.filter((r) => !r.initiatedByMe);
  const sentRequests = requests.filter((r) => r.initiatedByMe);

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Friends</h1>
        <p className="mt-1 text-gray-500">Find friends and see how your taste overlaps</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-xl border border-gray-200 py-3 pl-10 pr-4 text-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
        />
      </div>

      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}

      {/* Search Results */}
      {(searchResults.length > 0 || isSearching) && (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-4 py-3">
            <h2 className="text-sm font-semibold text-gray-700">Search Results</h2>
          </div>
          {isSearching ? (
            <div className="p-6 text-center text-sm text-gray-400">Searching...</div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {searchResults.map((user) => (
                <li key={user.id} className="flex items-center gap-3 px-4 py-3">
                  <Avatar name={user.name} avatar={user.avatar} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900">{user.name}</p>
                    <p className="truncate text-xs text-gray-500">{user.email}</p>
                  </div>
                  {user.friendStatus === 'accepted' ? (
                    <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">Friends</span>
                  ) : user.friendStatus === 'pending' ? (
                    <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-700">Pending</span>
                  ) : (
                    <button
                      onClick={() => handleSendRequest(user.id)}
                      disabled={loadingAction === user.id}
                      className="flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                    >
                      <UserPlus className="h-3.5 w-3.5" />
                      Add
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Received Requests */}
      {receivedRequests.length > 0 && (
        <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 shadow-sm">
          <div className="border-b border-indigo-100 px-4 py-3">
            <h2 className="text-sm font-semibold text-indigo-700">
              Friend Requests
              <span className="ml-2 rounded-full bg-indigo-600 px-2 py-0.5 text-xs font-bold text-white">
                {receivedRequests.length}
              </span>
            </h2>
          </div>
          <ul className="divide-y divide-indigo-50">
            {receivedRequests.map((req) => (
              <li key={req.userId} className="flex items-center gap-3 px-4 py-3">
                <Avatar name={req.name} avatar={req.avatar} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900">{req.name}</p>
                  <p className="truncate text-xs text-gray-500">{req.email}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAccept(req.userId)}
                    disabled={loadingAction === req.userId}
                    className="flex items-center gap-1 rounded-lg bg-green-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-600 disabled:opacity-50"
                  >
                    <Check className="h-3.5 w-3.5" />
                    Accept
                  </button>
                  <button
                    onClick={() => handleDeclineOrRemove(req.userId)}
                    disabled={loadingAction === req.userId}
                    className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <X className="h-3.5 w-3.5" />
                    Decline
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Sent Requests */}
      {sentRequests.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-4 py-3">
            <h2 className="text-sm font-semibold text-gray-700">Sent Requests</h2>
          </div>
          <ul className="divide-y divide-gray-100">
            {sentRequests.map((req) => (
              <li key={req.userId} className="flex items-center gap-3 px-4 py-3">
                <Avatar name={req.name} avatar={req.avatar} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900">{req.name}</p>
                  <p className="truncate text-xs text-gray-500">{req.email}</p>
                </div>
                <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-700">Pending</span>
                <button
                  onClick={() => handleDeclineOrRemove(req.userId)}
                  disabled={loadingAction === req.userId}
                  className="rounded-lg border border-gray-200 p-1.5 text-gray-400 hover:bg-gray-50 hover:text-gray-600 disabled:opacity-50"
                  title="Cancel request"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Friends List */}
      <div>
        <h2 className="mb-4 text-sm font-semibold text-gray-700">
          Your Friends {friends.length > 0 && <span className="text-gray-400">({friends.length})</span>}
        </h2>

        {friends.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
            <Users className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-3 text-sm text-gray-500">No friends yet — search above to add some</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {friends.map((friend) => (
              <div key={friend.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <Avatar name={friend.name} avatar={friend.avatar} size="lg" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-gray-900">{friend.name}</p>
                    <p className="truncate text-xs text-gray-500">{friend.email}</p>
                  </div>
                  <button
                    onClick={() => handleDeclineOrRemove(friend.id)}
                    disabled={loadingAction === friend.id}
                    className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
                    title="Remove friend"
                  >
                    <UserMinus className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-4">
                  <p className="mb-1.5 text-xs font-medium text-gray-500">Taste compatibility</p>
                  <CompatibilityBar score={friend.compatibilityScore} />
                  <p className="mt-1.5 text-xs text-gray-400">
                    {friend.compatibilityScore >= 70
                      ? 'Great match — you love similar things!'
                      : friend.compatibilityScore >= 40
                      ? 'Some overlap — worth comparing notes'
                      : 'Different tastes — good for recommendations'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
