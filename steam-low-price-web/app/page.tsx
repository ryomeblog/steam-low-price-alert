'use client';

import { useState, useEffect } from 'react';

type Game = {
  id: string;
  title: string;
  steamUrl: string;
  lowestPrice: number;
  createdAt: string;
  updatedAt: string;
};

export default function Home() {
  const [games, setGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingGame, setEditingGame] = useState<Game | null>(null);
  const [deletingGame, setDeletingGame] = useState<Game | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    steamUrl: '',
    lowestPrice: '',
  });

  // ゲーム一覧を取得
  const fetchGames = async () => {
    try {
      const response = await fetch('/api/games');
      const data = await response.json();
      setGames(data);
    } catch (error) {
      console.error('Error fetching games:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGames();
  }, []);

  // フォームの送信処理
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const url = editingGame ? `/api/games/${editingGame.id}` : '/api/games';
    const method = editingGame ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title,
          steamUrl: formData.steamUrl,
          lowestPrice: parseInt(formData.lowestPrice),
        }),
      });

      if (response.ok) {
        fetchGames();
        closeModal();
      }
    } catch (error) {
      console.error('Error saving game:', error);
    }
  };

  // 削除モーダルを開く
  const openDeleteModal = (game: Game) => {
    setDeletingGame(game);
    setIsDeleteModalOpen(true);
  };

  // 削除モーダルを閉じる
  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setDeletingGame(null);
  };

  // 削除実行
  const confirmDelete = async () => {
    if (!deletingGame) return;

    try {
      const response = await fetch(`/api/games/${deletingGame.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchGames();
        closeDeleteModal();
      }
    } catch (error) {
      console.error('Error deleting game:', error);
    }
  };

  // モーダルを開く（新規作成）
  const openCreateModal = () => {
    setEditingGame(null);
    setFormData({ title: '', steamUrl: '', lowestPrice: '' });
    setIsModalOpen(true);
  };

  // モーダルを開く（編集）
  const openEditModal = (game: Game) => {
    setEditingGame(game);
    setFormData({
      title: game.title,
      steamUrl: game.steamUrl,
      lowestPrice: game.lowestPrice.toString(),
    });
    setIsModalOpen(true);
  };

  // モーダルを閉じる
  const closeModal = () => {
    setIsModalOpen(false);
    setEditingGame(null);
    setFormData({ title: '', steamUrl: '', lowestPrice: '' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* ヘッダー */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Steam 最安値監視
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Steamゲームの最安値を記録・管理します
          </p>
        </div>

        {/* 新規登録ボタン */}
        <div className="mb-6">
          <button
            onClick={openCreateModal}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-lg transition duration-200 ease-in-out transform hover:scale-105"
          >
            + 新規登録
          </button>
        </div>

        {/* ローディング */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">読み込み中...</p>
          </div>
        ) : games.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-12 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              データがありません。新規登録してください。
            </p>
          </div>
        ) : (
          <>
            {/* デスクトップ：テーブル表示 */}
            <div className="hidden md:block bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        タイトル
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
                              onClick={() => openEditModal(game)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-900 dark:hover:bg-indigo-800 text-indigo-700 dark:text-indigo-300 rounded-md transition-colors"
                            >
                              <span>✏️</span>
                              <span>編集</span>
                            </button>
                            <button
                              onClick={() => openDeleteModal(game)}
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

            {/* モバイル：カード表示 */}
            <div className="md:hidden space-y-4">
              {games.map((game) => (
                <div key={game.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-5">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
                    {game.title}
                  </h3>
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
                      onClick={() => openEditModal(game)}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-900 dark:hover:bg-indigo-800 text-indigo-700 dark:text-indigo-300 rounded-lg font-medium transition-colors"
                    >
                      <span>✏️</span>
                      <span>編集</span>
                    </button>
                    <button
                      onClick={() => openDeleteModal(game)}
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

        {/* 編集/新規登録モーダル */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-md w-full p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                {editingGame ? 'ゲーム編集' : '新規登録'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    タイトル *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
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
                    value={formData.steamUrl}
                    onChange={(e) => setFormData({ ...formData, steamUrl: e.target.value })}
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
                    value={formData.lowestPrice}
                    onChange={(e) => setFormData({ ...formData, lowestPrice: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="4980"
                  />
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
                    onClick={closeModal}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-800 dark:text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
                  >
                    キャンセル
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 削除確認モーダル */}
        {isDeleteModalOpen && deletingGame && (
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
                  onClick={confirmDelete}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
                >
                  削除
                </button>
                <button
                  onClick={closeDeleteModal}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-800 dark:text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
                >
                  キャンセル
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
