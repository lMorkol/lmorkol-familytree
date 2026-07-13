"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import api, { getApiBaseUrl } from "@/lib/api";
import { isAuthenticated } from "@/lib/auth";
import { FiTrash2, FiUsers, FiEdit, FiPlus, FiGitBranch, FiCamera, FiList } from "react-icons/fi";
import type { Tree } from "@/types";

export default function TreesPage() {
  const router = useRouter();
  const [trees, setTrees] = useState<Tree[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [lightboxPhoto, setLightboxPhoto] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<number | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }
    api.get("/v1/trees").then((res) => {
      setTrees(res.data.data.items);
      setLoading(false);
    });
  }, [router]);

  const handleDelete = async (treeId: number, treeName: string) => {
    if (!confirm(`Удалить дерево «${treeName}»?`)) return;
    try {
      await api.delete(`/v1/trees/${treeId}`);
      setTrees(trees.filter(t => t.id !== treeId));
    } catch (err: any) {
      alert(err.response?.data?.detail || "Ошибка удаления");
    }
  };

  const handleRename = async (treeId: number) => {
    if (!editName.trim()) return;
    await api.patch(`/v1/trees/${treeId}`, { name: editName.trim() });
    setTrees(trees.map(t => t.id === treeId ? { ...t, name: editName.trim() } : t));
    setEditingId(null);
  };

  const handleUploadPhoto = async (treeId: number, file: File) => {
    setUploadingId(treeId);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await api.post(`/v1/trees/${treeId}/photo`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const photo = res.data.data.photo;
      setTrees(trees.map(t => t.id === treeId ? { ...t, photo } : t));
    } catch {}
    setUploadingId(null);
  };

  const handleCreateTree = async () => {
    const name = prompt("Название дерева:");
    if (name) {
      const res = await api.post("/v1/trees", { name });
      setTrees([...trees, { id: res.data.data.id, name: res.data.data.name }]);
    }
  };

  if (loading) return <div className="py-10 text-center text-gray-500">Загрузка...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-gray-800">Мои деревья</h2>
        <button
          onClick={handleCreateTree}
          className="flex items-center gap-2 bg-caramel text-white px-6 py-3 rounded-lg hover:bg-caramel/90 transition-colors font-medium"
        >
          <FiPlus className="w-5 h-5" />
          Создать дерево
        </button>
      </div>
      {trees.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-lg border border-gray-200">
          <FiGitBranch className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg mb-2">У вас пока нет деревьев</p>
          <p className="text-gray-400 text-sm mb-6">Создайте первое дерево, чтобы начать</p>
          <button
            onClick={handleCreateTree}
            className="inline-flex items-center gap-2 bg-caramel text-white px-8 py-3 rounded-lg hover:bg-caramel/90 transition-colors font-medium"
          >
            <FiPlus className="w-5 h-5" />
            Создать дерево
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trees.map((tree) => (
            <TreeCard
              key={tree.id}
              tree={tree}
              editingId={editingId}
              editName={editName}
              setEditingId={setEditingId}
              setEditName={setEditName}
              onRename={handleRename}
              onUploadPhoto={handleUploadPhoto}
              onDelete={handleDelete}
              onLightbox={setLightboxPhoto}
              uploadingId={uploadingId}
              router={router}
            />
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightboxPhoto && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center cursor-pointer"
          onClick={() => setLightboxPhoto(null)}
        >
          <img
            src={`${getApiBaseUrl()}/uploads/${lightboxPhoto}`}
            alt=""
            className="max-w-[90vw] max-h-[90vh] rounded-lg object-contain"
          />
        </div>
      )}
    </div>
  );
}

function TreeCard({
  tree, editingId, editName, setEditingId, setEditName,
  onRename, onUploadPhoto, onDelete, onLightbox, uploadingId, router,
}: {
  tree: Tree;
  editingId: number | null;
  editName: string;
  setEditingId: (id: number | null) => void;
  setEditName: (name: string) => void;
  onRename: (id: number) => void;
  onUploadPhoto: (id: number, file: File) => void;
  onDelete: (id: number, name: string) => void;
  onLightbox: (photo: string) => void;
  uploadingId: number | null;
  router: any;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="bg-white p-5 rounded-lg border border-gray-200 flex flex-col min-h-[180px]">
      {/* Photo + Name */}
      <div className="flex items-start gap-4 mb-4">
        {/* Photo */}
        <div
          className="shrink-0 relative group cursor-pointer"
          onClick={() => {
            if (tree.photo) {
              onLightbox(tree.photo);
            } else {
              fileInputRef.current?.click();
            }
          }}
        >
          {tree.photo ? (
            <img
              src={`${getApiBaseUrl()}/uploads/${tree.photo}`}
              alt=""
              className="w-16 h-16 rounded-lg object-cover"
            />
          ) : (
            <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400">
              {uploadingId === tree.id ? (
                <div className="w-5 h-5 border-2 border-caramel border-t-transparent rounded-full animate-spin" />
              ) : (
                <FiCamera className="w-6 h-6" />
              )}
            </div>
          )}
          <div className="absolute inset-0 bg-black/40 rounded-lg opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
            <FiEdit className="w-4 h-4 text-white" />
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onUploadPhoto(tree.id, file);
            }}
          />
        </div>

        {/* Name */}
        <div className="flex-1 min-w-0">
          {editingId === tree.id ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && onRename(tree.id)}
                className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-lg font-bold text-gray-700 focus:outline-none focus:border-caramel focus:ring-1 focus:ring-caramel transition-colors"
                autoFocus
              />
              <button
                onClick={() => onRename(tree.id)}
                className="text-caramel hover:text-caramel/80 text-sm font-medium"
              >
                OK
              </button>
              <button
                onClick={() => setEditingId(null)}
                className="text-gray-500 hover:text-gray-700 text-sm"
              >
                Отмена
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h3
                className="font-bold text-lg text-gray-800 truncate cursor-pointer hover:text-caramel transition-colors"
                onClick={() => router.push(`/tree/${tree.id}/schema`)}
              >
                {tree.name}
              </h3>
              <button
                onClick={() => { setEditingId(tree.id); setEditName(tree.name); }}
                className="text-gray-400 hover:text-caramel transition-colors shrink-0"
                title="Редактировать название"
              >
                <FiEdit className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="border-t border-gray-200 pt-3 mt-auto">
        <div className="flex gap-2 items-center">
          <button
            onClick={() => router.push(`/tree/${tree.id}/schema`)}
            className="flex-1 flex items-center justify-center gap-1.5 text-xs bg-gray-50 text-gray-600 px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
          >
            <FiGitBranch className="w-3.5 h-3.5" />
            Древо
          </button>
          <button
            onClick={() => router.push(`/tree/${tree.id}`)}
            className="flex-1 flex items-center justify-center gap-1.5 text-xs bg-gray-50 text-gray-600 px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
          >
            <FiList className="w-3.5 h-3.5" />
            Список
          </button>
          <button
            onClick={() => router.push(`/tree/${tree.id}/members`)}
            className="flex-1 flex items-center justify-center gap-1.5 text-xs bg-gray-50 text-gray-600 px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
          >
            <FiUsers className="w-3.5 h-3.5" />
            Участники
          </button>
          <button
            onClick={() => onDelete(tree.id, tree.name)}
            className="text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100 transition-colors"
            title={`Удалить дерево «${tree.name}»`}
          >
            <FiTrash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
