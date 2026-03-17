import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { authApi, syncApi, User, SyncData } from '../api/auth';
import { useStore } from '../store/useStore';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loginWithGoogle: () => void;
  syncToServer: () => Promise<void>;
  syncFromServer: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const store = useStore();

  // Check if user is logged in on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { user } = await authApi.getMe();
        setUser(user);
      } catch {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  const syncToServer = useCallback(async () => {
    if (!user) return;
    const data: SyncData = {
      shows: store.shows,
      movies: store.movies,
      lists: store.lists,
    };
    await syncApi.push(data);
  }, [user, store.shows, store.movies, store.lists]);

  const syncFromServer = useCallback(async () => {
    if (!user) return;
    const data = await syncApi.pull();
    // Load server data into store
    store.loadFromServer(data);
  }, [user, store]);

  const login = async (email: string, password: string) => {
    const { user } = await authApi.login(email, password);
    setUser(user);
  };

  const register = async (name: string, email: string, password: string) => {
    const { user } = await authApi.register(name, email, password);
    setUser(user);
  };

  const logout = async () => {
    await authApi.logout();
    setUser(null);
  };

  const loginWithGoogle = () => {
    window.location.href = authApi.getGoogleAuthUrl();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        loginWithGoogle,
        syncToServer,
        syncFromServer,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
