'use client';

import { useState, useEffect } from 'react';

type Folder = {
  id: string;
  name: string;
  color: string;
  sortOrder: number;
  gameCount: number;
};

type GameFolderRef = {
  id: string;
  name: string;
  color: string;
};

type Game = {
  id: string;
  title: string;
  steamUrl: string;
  lowestPrice: number;
  createdAt: string;
  updatedAt: string;
  folders: GameFolderRef[];
};

type SelectedFolder = 'all' | 'unassigned' | string;

const COLOR_PRESETS = [
  '#EF4444', // red
  '#F59E0B', // orange
  '#EAB308', // yellow
  '#10B981', // green
  '#3B82F6', // blue
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#6B7280', // gray
];

const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/;

export default function Home() {
  const [games, setGames] = useState<Game[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<SelectedFolder>('all');

  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // ゲームモーダル
  const [isGameModalOpen, setIsGameModalOpen] = useState(false);
  const [isGameDeleteModalOpen, setIsGameDeleteModalOpen] = useState(false);
  const [editingGame, setEditingGame] = useState<Game | null>(null);
  const [deletingGame, setDeletingGame] = useState<Game | null>(null);
  const [gameForm, setGameForm] = useState({
    title: '',
    steamUrl: '',
    lowestPrice: '',
    folderIds: [] as string[],
  });

  // フォルダモーダル
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [isFolderDeleteModalOpen, setIsFolderDeleteModalOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
  const [deletingFolder, setDeletingFolder] = useState<Folder | null>(null);
  const [folderForm, setFolderForm] = useState({
    name: '',
    color: COLOR_PRESETS[3],
  });

  // ---- データ取得 ----
  const fetchFolders = async () => {
    try {
      const res = await fetch('/api/folders');
      const data = await res.json();
      setFolders(data);
    } catch (error) {
      console.error('Error fetching folders:', error);
    }
  };

  const fetchGames = async (folderKey: SelectedFolder) => {
    try {
      const query = `?folderId=${encodeURIComponent(folderKey)}`;
      const res = await fetch(`/api/games${query}`);
      const data = await res.json();
      setGames(data);
    } catch (error) {
      console.error('Error fetching games:', error);
    }
  };

  const refreshAll = async (folderKey: SelectedFolder = selectedFolder) => {
    await Promise.all([fetchFolders(), fetchGames(folderKey)]);
  };

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      await refreshAll('all');
      setIsLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchGames(selectedFolder);
  }, [selectedFolder]);

  // 「すべて」「未分類」の件数はサイドバー選択に依存させず、全件取得APIで別管理
  const [allCount, setAllCount] = useState<number>(0);
  const [unassignedCount, setUnassignedCount] = useState<number>(0);

  useEffect(() => {
    (async () => {
      try {
        const [allRes, unRes] = await Promise.all([
          fetch('/api/games?folderId=all'),
          fetch('/api/games?folderId=unassigned'),
        ]);
        const [all, un] = await Promise.all([allRes.json(), unRes.json()]);
        setAllCount(Array.isArray(all) ? all.length : 0);
        setUnassignedCount(Array.isArray(un) ? un.length : 0);
      } catch (error) {
        console.error('Error fetching counts:', error);
      }
    })();
  }, [games, folders]);

  // ---- ゲーム操作 ----
  const openGameCreateModal = () => {
    setEditingGame(null);
    const preselected = !['all', 'unassigned'].includes(selectedFolder)
      ? [selectedFolder]
      : [];
    setGameForm({
      title: '',
      steamUrl: '',
      lowestPrice: '',
      folderIds: preselected,
    });
    setIsGameModalOpen(true);
  };

  const openGameEditModal = (game: Game) => {
    setEditingGame(game);
    setGameForm({
      title: game.title,
      steamUrl: game.steamUrl,
      lowestPrice: game.lowestPrice.toString(),
      folderIds: game.folders.map((f) => f.id),
    });
    setIsGameModalOpen(true);
  };

  const closeGameModal = () => {
    setIsGameModalOpen(false);
    setEditingGame(null);
    setGameForm({ title: '', steamUrl: '', lowestPrice: '', folderIds: [] });
  };

  const handleGameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingGame ? `/api/games/${editingGame.id}` : '/api/games';
    const method = editingGame ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: gameForm.title,
          steamUrl: gameForm.steamUrl,
          lowestPrice: parseInt(gameForm.lowestPrice),
          folderIds: gameForm.folderIds,
        }),
      });
      if (res.ok) {
        await refreshAll();
        closeGameModal();
      }
    } catch (error) {
      console.error('Error saving game:', error);
    }
  };

  const toggleFormFolder = (folderId: string) => {
    setGameForm((prev) => ({
      ...prev,
      folderIds: prev.folderIds.includes(folderId)
        ? prev.folderIds.filter((id) => id !== folderId)
        : [...prev.folderIds, folderId],
    }));
  };

  const openGameDeleteModal = (game: Game) => {
    setDeletingGame(game);
    setIsGameDeleteModalOpen(true);
  };
  const closeGameDeleteModal = () => {
    setIsGameDeleteModalOpen(false);
    setDeletingGame(null);
  };
  const confirmGameDelete = async () => {
    if (!deletingGame) return;
    try {
      const res = await fetch(`/api/games/${deletingGame.id}`, { method: 'DELETE' });
      if (res.ok) {
        await refreshAll();
        closeGameDeleteModal();
      }
    } catch (error) {
      console.error('Error deleting game:', error);
    }
  };

  // ---- フォルダ操作 ----
  const openFolderCreateModal = () => {
    setEditingFolder(null);
    setFolderForm({ name: '', color: COLOR_PRESETS[3] });
    setIsFolderModalOpen(true);
  };
  const openFolderEditModal = (folder: Folder) => {
    setEditingFolder(folder);
    setFolderForm({ name: folder.name, color: folder.color });
    setIsFolderModalOpen(true);
  };
  const closeFolderModal = () => {
    setIsFolderModalOpen(false);
    setEditingFolder(null);
  };

  const handleFolderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!HEX_COLOR.test(folderForm.color)) return;
    const url = editingFolder ? `/api/folders/${editingFolder.id}` : '/api/folders';
    const method = editingFolder ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: folderForm.name,
          color: folderForm.color,
        }),
      });
      if (res.ok) {
        await refreshAll();
        closeFolderModal();
      }
    } catch (error) {
      console.error('Error saving folder:', error);
    }
  };

  const openFolderDeleteModal = (folder: Folder) => {
    setDeletingFolder(folder);
    setIsFolderDeleteModalOpen(true);
  };
  const closeFolderDeleteModal = () => {
    setIsFolderDeleteModalOpen(false);
    setDeletingFolder(null);
  };
  const confirmFolderDelete = async () => {
    if (!deletingFolder) return;
    try {
      const res = await fetch(`/api/folders/${deletingFolder.id}`, { method: 'DELETE' });
      if (res.ok) {
        if (selectedFolder === deletingFolder.id) setSelectedFolder('all');
        await refreshAll(selectedFolder === deletingFolder.id ? 'all' : selectedFolder);
        closeFolderDeleteModal();
      }
    } catch (error) {
      console.error('Error deleting folder:', error);
    }
  };

  // ---- 現在のフォルダ表示情報 ----
  const currentFolderLabel =
    selectedFolder === 'all'
      ? '📋 すべてのゲーム'
      : selectedFolder === 'unassigned'
      ? '📥 未分類'
      : folders.find((f) => f.id === selectedFolder)?.name ?? '';

  // ---- サイドバー ----
  const Sidebar = (
    <aside className="w-64 shrink-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col h-full">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">📁 フォルダ</h2>
        <button
          onClick={openFolderCreateModal}
          className="text-sm px-2 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white transition-colors"
          title="新規フォルダ"
        >
          + 新規
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto p-2 space-y-1">
        <button
          onClick={() => {
            setSelectedFolder('all');
            setIsSidebarOpen(false);
          }}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors ${
            selectedFolder === 'all'
              ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 font-semibold'
              : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200'
          }`}
        >
          <span>📋 すべて</span>
          <span className="text-xs text-gray-500 dark:text-gray-400">{allCount}</span>
        </button>

        <button
          onClick={() => {
            setSelectedFolder('unassigned');
            setIsSidebarOpen(false);
          }}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors ${
            selectedFolder === 'unassigned'
              ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 font-semibold'
              : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200'
          }`}
        >
          <span>📥 未分類</span>
          <span className="text-xs text-gray-500 dark:text-gray-400">{unassignedCount}</span>
        </button>

        <div className="border-t border-gray-200 dark:border-gray-700 my-2" />

        {folders.length === 0 ? (
          <p className="text-xs text-gray-400 dark:text-gray-500 px-3 py-2">
            フォルダがありません
          </p>
        ) : (
          folders.map((folder) => (
            <div
              key={folder.id}
              className={`group flex items-center rounded-md transition-colors ${
                selectedFolder === folder.id
                  ? 'bg-blue-100 dark:bg-blue-900'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <button
                onClick={() => {
                  setSelectedFolder(folder.id);
                  setIsSidebarOpen(false);
                }}
                className={`flex-1 flex items-center gap-2 px-3 py-2 text-sm text-left min-w-0 ${
                  selectedFolder === folder.id
                    ? 'text-blue-800 dark:text-blue-200 font-semibold'
                    : 'text-gray-700 dark:text-gray-200'
                }`}
              >
                <span
                  className="inline-block w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: folder.color }}
                />
                <span className="truncate flex-1">{folder.name}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {folder.gameCount}
                </span>
              </button>
              <div className="hidden group-hover:flex pr-1 gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openFolderEditModal(folder);
                  }}
                  className="p-1 text-xs text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400"
                  title="編集"
                >
                  ✏️
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openFolderDeleteModal(folder);
                  }}
                  className="p-1 text-xs text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400"
                  title="削除"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))
        )}
      </nav>
    </aside>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800 flex">
      {/* デスクトップ：常時サイドバー */}
      <div className="hidden md:flex md:w-64 md:shrink-0 md:h-screen md:sticky md:top-0">
        {Sidebar}
      </div>

      {/* モバイル：ドロワー */}
      {isSidebarOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsSidebarOpen(false)} />
          <div className="relative z-10 h-full">{Sidebar}</div>
        </div>
      )}

      {/* メインエリア */}
      <main className="flex-1 min-w-0">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="mb-8 flex items-start justify-between gap-3">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                Steam 最安値監視
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Steamゲームの最安値を記録・管理します
              </p>
            </div>
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm shadow"
            >
              📁 フォルダ
            </button>
          </div>

          <div className="mb-4 flex items-center justify-between gap-3 flex-wrap">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
              {currentFolderLabel}
              <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
                （{games.length}件）
              </span>
            </h2>
            <button
              onClick={openGameCreateModal}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-5 rounded-lg shadow transition duration-200"
            >
              + 新規登録
            </button>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">読み込み中...</p>
            </div>
          ) : games.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-12 text-center">
              <p className="text-gray-500 dark:text-gray-400">
                このフォルダにはゲームがありません。
              </p>
            </div>
          ) : (
            <>
              {/* デスクトップ：テーブル */}
              <div className="hidden md:block bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          タイトル
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          フォルダ
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Steam URL
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          最安値
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          操作
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                      {games.map((game) => (
                        <tr key={game.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                          <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                            {game.title}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <div className="flex flex-wrap gap-1.5">
                              {game.folders.length === 0 ? (
                                <span className="text-xs text-gray-400">—</span>
                              ) : (
                                game.folders.map((f) => (
                                  <span
                                    key={f.id}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium text-white"
                                    style={{ backgroundColor: f.color }}
                                  >
                                    {f.name}
                                  </span>
                                ))
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                            <a
                              href={game.steamUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline"
                            >
                              <span>🔗</span>
                              <span>Steam ページ</span>
                            </a>
                          </td>
                          <td className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">
                            ¥{game.lowestPrice.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-sm font-medium">
                            <div className="flex gap-2">
                              <button
                                onClick={() => openGameEditModal(game)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-900 dark:hover:bg-indigo-800 text-indigo-700 dark:text-indigo-300 rounded-md transition-colors"
                              >
                                <span>✏️</span>
                                <span>編集</span>
                              </button>
                              <button
                                onClick={() => openGameDeleteModal(game)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-100 hover:bg-red-200 dark:bg-red-900 dark:hover:bg-red-800 text-red-700 dark:text-red-300 rounded-md transition-colors"
                              >
                                <span>🗑️</span>
                                <span>削除</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* モバイル：カード */}
              <div className="md:hidden space-y-4">
                {games.map((game) => (
                  <div key={game.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-5">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                      {game.title}
                    </h3>
                    {game.folders.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {game.folders.map((f) => (
                          <span
                            key={f.id}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium text-white"
                            style={{ backgroundColor: f.color }}
                          >
                            {f.name}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500 dark:text-gray-400">最安値:</span>
                        <span className="text-lg font-semibold text-gray-900 dark:text-white">
                          ¥{game.lowestPrice.toLocaleString()}
                        </span>
                      </div>
                      <a
                        href={game.steamUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm hover:underline"
                      >
                        <span>🔗</span>
                        <span>Steam ページを開く</span>
                      </a>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => openGameEditModal(game)}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-900 dark:hover:bg-indigo-800 text-indigo-700 dark:text-indigo-300 rounded-lg font-medium transition-colors"
                      >
                        <span>✏️</span>
                        <span>編集</span>
                      </button>
                      <button
                        onClick={() => openGameDeleteModal(game)}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-red-100 hover:bg-red-200 dark:bg-red-900 dark:hover:bg-red-800 text-red-700 dark:text-red-300 rounded-lg font-medium transition-colors"
                      >
                        <span>🗑️</span>
                        <span>削除</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </main>

      {/* --- ゲーム登録/編集モーダル --- */}
      {isGameModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              {editingGame ? 'ゲーム編集' : '新規登録'}
            </h2>
            <form onSubmit={handleGameSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  タイトル *
                </label>
                <input
                  type="text"
                  required
                  value={gameForm.title}
                  onChange={(e) => setGameForm({ ...gameForm, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="ELDEN RING"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Steam URL *
                </label>
                <input
                  type="url"
                  required
                  value={gameForm.steamUrl}
                  onChange={(e) => setGameForm({ ...gameForm, steamUrl: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="https://store.steampowered.com/app/..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  最安値（円） *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="1"
                  value={gameForm.lowestPrice}
                  onChange={(e) => setGameForm({ ...gameForm, lowestPrice: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="4980"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  所属フォルダ（複数選択可）
                </label>
                {folders.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    先に左のサイドバーからフォルダを作成してください。
                  </p>
                ) : (
                  <div className="max-h-40 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-lg p-2 space-y-1">
                    {folders.map((f) => (
                      <label
                        key={f.id}
                        className="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={gameForm.folderIds.includes(f.id)}
                          onChange={() => toggleFormFolder(f.id)}
                          className="rounded"
                        />
                        <span
                          className="inline-block w-3 h-3 rounded-full"
                          style={{ backgroundColor: f.color }}
                        />
                        <span className="text-sm text-gray-800 dark:text-gray-200 truncate">
                          {f.name}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
                >
                  {editingGame ? '更新' : '登録'}
                </button>
                <button
                  type="button"
                  onClick={closeGameModal}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-800 dark:text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
                >
                  キャンセル
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- ゲーム削除モーダル --- */}
      {isGameDeleteModalOpen && deletingGame && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              削除の確認
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              本当に「<span className="font-semibold">{deletingGame.title}</span>」を削除しますか？
            </p>
            <div className="flex gap-3">
              <button
                onClick={confirmGameDelete}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
              >
                削除
              </button>
              <button
                onClick={closeGameDeleteModal}
                className="flex-1 bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-800 dark:text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- フォルダ登録/編集モーダル --- */}
      {isFolderModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              {editingFolder ? 'フォルダ編集' : '新規フォルダ'}
            </h2>
            <form onSubmit={handleFolderSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  フォルダ名 *
                </label>
                <input
                  type="text"
                  required
                  maxLength={100}
                  value={folderForm.name}
                  onChange={(e) => setFolderForm({ ...folderForm, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="欲しい物リスト"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  カラー *
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {COLOR_PRESETS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setFolderForm({ ...folderForm, color: c })}
                      className={`w-8 h-8 rounded-full border-2 transition ${
                        folderForm.color.toUpperCase() === c.toUpperCase()
                          ? 'border-gray-900 dark:border-white scale-110'
                          : 'border-transparent'
                      }`}
                      style={{ backgroundColor: c }}
                      title={c}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={HEX_COLOR.test(folderForm.color) ? folderForm.color : '#3B82F6'}
                    onChange={(e) => setFolderForm({ ...folderForm, color: e.target.value })}
                    className="w-12 h-10 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={folderForm.color}
                    onChange={(e) => setFolderForm({ ...folderForm, color: e.target.value })}
                    placeholder="#3B82F6"
                    pattern="^#[0-9A-Fa-f]{6}$"
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white font-mono text-sm"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
                >
                  {editingFolder ? '更新' : '作成'}
                </button>
                <button
                  type="button"
                  onClick={closeFolderModal}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-800 dark:text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
                >
                  キャンセル
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- フォルダ削除モーダル --- */}
      {isFolderDeleteModalOpen && deletingFolder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              フォルダ削除の確認
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-2">
              フォルダ「<span className="font-semibold">{deletingFolder.name}</span>」を削除しますか？
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              ※ このフォルダに属する {deletingFolder.gameCount} 件のゲーム自体は削除されず、未分類になります。
            </p>
            <div className="flex gap-3">
              <button
                onClick={confirmFolderDelete}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
              >
                削除
              </button>
              <button
                onClick={closeFolderDeleteModal}
                className="flex-1 bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-800 dark:text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
