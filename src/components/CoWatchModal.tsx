import { useState, useEffect } from 'react';
import { X, Users } from 'lucide-react';
import { friendsApi } from '../api/friends';
import type { CoWatcher, Friend } from '../types';

interface CoWatchModalProps {
  title: string;
  currentCoWatchers: CoWatcher[];
  onSave: (coWatchers: CoWatcher[]) => Promise<void>;
  onClose: () => void;
}

function Avatar({ name, avatar }: { name: string; avatar: string | null }) {
  const [error, setError] = useState(false);
  if (avatar && !error) {
    return (
      <img
        src={avatar}
        alt={name}
        className="h-9 w-9 rounded-full object-cover flex-shrink-0"
        onError={() => setError(true)}
      />
    );
  }
  return (
    <div className="h-9 w-9 flex items-center justify-center rounded-full bg-indigo-100 text-sm font-medium text-indigo-600 flex-shrink-0">
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

export default function CoWatchModal({ title, currentCoWatchers, onSave, onClose }: CoWatchModalProps) {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selected, setSelected] = useState<Set<string>>(
    new Set(currentCoWatchers.map((cw) => cw.userId))
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    friendsApi.getFriends().then((f) => {
      setFriends(f);
      setIsLoading(false);
    }).catch(() => setIsLoading(false));
  }, []);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    const coWatchers: CoWatcher[] = friends
      .filter((f) => selected.has(f.id))
      .map((f) => ({ userId: f.id, name: f.name, avatar: f.avatar }));
    await onSave(coWatchers);
    setIsSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div>
            <h2 className="font-semibold text-gray-900">Co-watching with</h2>
            <p className="mt-0.5 text-xs text-gray-500 truncate max-w-[200px]">{title}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-72 overflow-y-auto px-4 py-3">
          {isLoading ? (
            <p className="py-6 text-center text-sm text-gray-400">Loading friends...</p>
          ) : friends.length === 0 ? (
            <div className="py-8 text-center">
              <Users className="mx-auto h-10 w-10 text-gray-200" />
              <p className="mt-2 text-sm text-gray-500">No friends yet</p>
              <p className="mt-1 text-xs text-gray-400">Add friends on the Friends page first</p>
            </div>
          ) : (
            <ul className="space-y-1">
              {friends.map((friend) => {
                const isSelected = selected.has(friend.id);
                return (
                  <li key={friend.id}>
                    <button
                      onClick={() => toggle(friend.id)}
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                        isSelected ? 'bg-indigo-50 ring-1 ring-indigo-200' : 'hover:bg-gray-50'
                      }`}
                    >
                      <Avatar name={friend.name} avatar={friend.avatar} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-900">{friend.name}</p>
                        <p className="truncate text-xs text-gray-500">{friend.email}</p>
                      </div>
                      <div
                        className={`h-5 w-5 flex-shrink-0 rounded-full border-2 transition-colors ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-600'
                            : 'border-gray-300 bg-white'
                        }`}
                      >
                        {isSelected && (
                          <svg viewBox="0 0 20 20" fill="white" className="h-full w-full">
                            <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="border-t border-gray-100 px-5 py-4">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : `Save${selected.size > 0 ? ` (${selected.size} selected)` : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
}
