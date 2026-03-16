import { useState } from 'react';
import { Plus, Trash2, Edit2, Check, X, ListVideo, Tv, Film } from 'lucide-react';
import { useStore } from '../store/useStore';
import { getImageUrl } from '../api/tmdb';
import type { CustomList } from '../types';

export default function Lists() {
  const lists = useStore((state) => state.lists);
  const createList = useStore((state) => state.createList);
  const deleteList = useStore((state) => state.deleteList);
  const renameList = useStore((state) => state.renameList);
  const removeFromList = useStore((state) => state.removeFromList);

  const [newListName, setNewListName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [expandedList, setExpandedList] = useState<string | null>(null);

  const handleCreate = () => {
    if (newListName.trim()) {
      createList(newListName.trim());
      setNewListName('');
      setIsCreating(false);
    }
  };

  const handleRename = (id: string) => {
    if (editName.trim()) {
      renameList(id, editName.trim());
      setEditingId(null);
    }
  };

  const startEditing = (list: CustomList) => {
    setEditingId(list.id);
    setEditName(list.name);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Lists</h1>
          <p className="mt-1 text-gray-500">{lists.length} custom lists</p>
        </div>

        {!isCreating && (
          <button
            onClick={() => setIsCreating(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
          >
            <Plus className="h-4 w-4" />
            New List
          </button>
        )}
      </div>

      {isCreating && (
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              placeholder="List name..."
              className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreate();
                if (e.key === 'Escape') setIsCreating(false);
              }}
            />
            <button
              onClick={handleCreate}
              className="rounded-lg bg-indigo-600 px-3 py-2 text-white hover:bg-indigo-500"
            >
              <Check className="h-4 w-4" />
            </button>
            <button
              onClick={() => setIsCreating(false)}
              className="rounded-lg bg-gray-100 px-3 py-2 text-gray-600 hover:bg-gray-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {lists.length > 0 ? (
        <div className="space-y-4">
          {lists.map((list) => (
            <div
              key={list.id}
              className="overflow-hidden rounded-xl border border-gray-200 bg-white"
            >
              <div
                className="flex cursor-pointer items-center justify-between px-4 py-3 hover:bg-gray-50"
                onClick={() =>
                  setExpandedList(expandedList === list.id ? null : list.id)
                }
              >
                <div className="flex items-center gap-3">
                  <ListVideo className="h-5 w-5 text-gray-400" />
                  {editingId === list.id ? (
                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="rounded border border-gray-200 px-2 py-1 text-sm outline-none focus:border-indigo-500"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleRename(list.id);
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                      />
                      <button
                        onClick={() => handleRename(list.id)}
                        className="text-green-600 hover:text-green-700"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="font-medium text-gray-900">{list.name}</span>
                      <span className="text-sm text-gray-500">
                        ({list.items.length} items)
                      </span>
                    </>
                  )}
                </div>

                <div
                  className="flex items-center gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => startEditing(list)}
                    className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => deleteList(list.id)}
                    className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {expandedList === list.id && (
                <div className="border-t border-gray-200 p-4">
                  {list.items.length > 0 ? (
                    <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                      {list.items.map((item) => (
                        <div
                          key={`${item.type}-${item.id}`}
                          className="group relative overflow-hidden rounded-lg"
                        >
                          <div className="aspect-[2/3] bg-gray-100">
                            {item.posterPath ? (
                              <img
                                src={getImageUrl(item.posterPath) ?? ''}
                                alt={item.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center">
                                {item.type === 'show' ? (
                                  <Tv className="h-8 w-8 text-gray-300" />
                                ) : (
                                  <Film className="h-8 w-8 text-gray-300" />
                                )}
                              </div>
                            )}
                          </div>
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 pt-6">
                            <p className="truncate text-xs font-medium text-white">
                              {item.name}
                            </p>
                          </div>
                          <button
                            onClick={() => removeFromList(list.id, item.id)}
                            className="absolute right-1 top-1 rounded-full bg-white/90 p-1 text-gray-500 opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="py-4 text-center text-sm text-gray-500">
                      This list is empty. Add items from the search page.
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        !isCreating && (
          <div className="rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
            <ListVideo className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No lists yet</h3>
            <p className="mt-2 text-gray-500">
              Create a list to organize your shows and movies
            </p>
            <button
              onClick={() => setIsCreating(true)}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
            >
              <Plus className="h-4 w-4" />
              Create your first list
            </button>
          </div>
        )
      )}
    </div>
  );
}
