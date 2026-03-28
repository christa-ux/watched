import { useState, useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Home, Tv, Film, ListVideo, Search, Sparkles, LogOut, User, Users /*, Upload, Download*/ } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { friendsApi } from '../api/friends';

const navItems = [
  { to: '/', label: 'Dashboard', icon: Home },
  { to: '/shows', label: 'Shows', icon: Tv },
  { to: '/movies', label: 'Movies', icon: Film },
  { to: '/lists', label: 'Lists', icon: ListVideo },
  { to: '/search', label: 'Search', icon: Search },
  { to: '/assistant', label: 'AI', icon: Sparkles },
];

export default function Navbar() {
  const { user, isAuthenticated, logout, isLoading /*, syncToServer, syncFromServer*/ } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const [pendingRequestCount, setPendingRequestCount] = useState(0);
  // const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'done' | 'error'>('idle');

  useEffect(() => {
    if (!isAuthenticated) return;
    friendsApi.getRequests().then((requests) => {
      setPendingRequestCount(requests.filter((r) => !r.initiatedByMe).length);
    }).catch(() => {});
  }, [isAuthenticated]);

  const handleLogout = async () => {
    await logout();
    setShowDropdown(false);
  };

  /* const handleSync = async (direction: 'push' | 'pull') => {
    setSyncStatus('syncing');
    try {
      if (direction === 'push') await syncToServer();
      else await syncFromServer();
      setSyncStatus('done');
      setTimeout(() => setSyncStatus('idle'), 2000);
    } catch {
      setSyncStatus('error');
      setTimeout(() => setSyncStatus('idle'), 2000);
    }
  }; */

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <NavLink to="/" className="text-xl font-bold text-gray-900">
            Watched
          </NavLink>

          <div className="flex items-center gap-1">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-600'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`
                }
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{label}</span>
              </NavLink>
            ))}

            {/* Friends nav item with badge */}
            {isAuthenticated && (
              <NavLink
                to="/friends"
                className={({ isActive }) =>
                  `relative flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-600'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`
                }
              >
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Friends</span>
                {pendingRequestCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                    {pendingRequestCount}
                  </span>
                )}
              </NavLink>
            )}

            {/* Auth section */}
            <div className="ml-2 border-l border-gray-200 pl-2">
              {isLoading ? (
                <div className="h-8 w-8 animate-pulse rounded-full bg-gray-200" />
              ) : isAuthenticated && user ? (
                <div className="relative">
                  <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
                  >
                    {user.avatar && !avatarError ? (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="h-6 w-6 rounded-full"
                        onError={() => setAvatarError(true)}
                      />
                    ) : (
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-xs font-medium text-indigo-600">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="hidden sm:inline">{user.name}</span>
                  </button>

                  {showDropdown && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowDropdown(false)}
                      />
                      <div className="absolute right-0 z-20 mt-2 w-48 rounded-lg bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5">
                        <div className="border-b border-gray-100 px-4 py-2">
                          <p className="text-sm font-medium text-gray-900">{user.name}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                        {/* Sync buttons — uncomment to re-enable
                        <div className="border-b border-gray-100 px-4 py-2">
                          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-400">Sync data</p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleSync('push')}
                              disabled={syncStatus === 'syncing'}
                              className="flex flex-1 items-center justify-center gap-1 rounded-md bg-indigo-50 px-2 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-100 disabled:opacity-50"
                              title="Save your local data to the server"
                            >
                              <Upload className="h-3 w-3" />
                              Save
                            </button>
                            <button
                              onClick={() => handleSync('pull')}
                              disabled={syncStatus === 'syncing'}
                              className="flex flex-1 items-center justify-center gap-1 rounded-md bg-indigo-50 px-2 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-100 disabled:opacity-50"
                              title="Load your data from the server"
                            >
                              <Download className="h-3 w-3" />
                              Load
                            </button>
                          </div>
                          {syncStatus === 'done' && <p className="mt-1 text-center text-xs text-green-600">Done!</p>}
                          {syncStatus === 'error' && <p className="mt-1 text-center text-xs text-red-500">Failed</p>}
                        </div>
                        */}
                        <button
                          onClick={handleLogout}
                          className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <LogOut className="h-4 w-4" />
                          Sign out
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <Link
                  to="/login"
                  className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                >
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">Sign in</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
