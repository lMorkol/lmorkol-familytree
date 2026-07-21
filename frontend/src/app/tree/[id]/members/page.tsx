"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import { isAuthenticated, getCurrentUserId } from "@/lib/auth";
import Modal from "@/components/ui/Modal";
import { FiArrowLeft, FiUserPlus, FiAlertCircle } from "react-icons/fi";
import type { TreeMember } from "@/types";

export default function TreeMembersPage() {
  const params = useParams();
  const router = useRouter();
  const treeId = params.id as string;

  const [members, setMembers] = useState<TreeMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteLogin, setInviteLogin] = useState("");
  const [inviteUserId, setInviteUserId] = useState("");
  const [inviteRole, setInviteRole] = useState("reader");
  const [inviteError, setInviteError] = useState("");
  const [creatorId, setCreatorId] = useState<number | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }
    setCurrentUserId(getCurrentUserId());
    loadData();
  }, [treeId, router]);

  const loadData = async () => {
    const [membersRes, treeRes] = await Promise.all([
      api.get(`/v1/trees/${treeId}/users`),
      api.get(`/v1/trees/${treeId}`),
    ]);
    setMembers(membersRes.data.data.items);
    setCreatorId(treeRes.data.data.createdBy);
    setLoading(false);
  };

  const handleInvite = async () => {
    setInviteError("");
    if (!inviteLogin && !inviteUserId) {
      setInviteError("Введите логин или ID пользователя");
      return;
    }
    try {
      const payload: any = { role: inviteRole };
      if (inviteUserId) {
        payload.userId = Number(inviteUserId);
      } else {
        payload.login = inviteLogin;
      }
      await api.post(`/v1/trees/${treeId}/users`, payload);
      setShowInvite(false);
      setInviteLogin("");
      setInviteUserId("");
      setInviteRole("reader");
      loadData();
    } catch (err: any) {
      setInviteError(err.response?.data?.detail || "Ошибка приглашения");
    }
  };

  const handleRoleChange = async (userId: number, newRole: string) => {
    try {
      await api.patch(`/v1/trees/${treeId}/users/${userId}`, { role: newRole });
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Ошибка смены роли");
    }
  };

  const handleRemove = async (userId: number) => {
    if (!confirm("Удалить участника из дерева?")) return;
    try {
      await api.delete(`/v1/trees/${treeId}/users/${userId}`);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Ошибка удаления");
    }
  };

  const handleLeave = async () => {
    if (!confirm("Покинуть дерево?")) return;
    try {
      await api.delete(`/v1/trees/${treeId}/users/me`);
      router.push("/trees");
    } catch (err: any) {
      alert(err.response?.data?.detail || "Ошибка выхода");
    }
  };

  if (loading) return <div className="py-10 text-center text-gray-500">Загрузка...</div>;

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/trees")}
            className="flex items-center gap-2 text-caramel hover:text-caramel/80 transition-colors"
          >
            <FiArrowLeft className="w-5 h-5" />
            Назад
          </button>
          <h2 className="text-2xl font-bold text-gray-800">Участники дерева</h2>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowInvite(true)}
            className="flex items-center gap-2 bg-caramel text-white px-6 py-3 rounded-lg hover:bg-caramel/90 transition-colors font-medium"
          >
            <FiUserPlus className="w-5 h-5" />
            Пригласить
          </button>
          {currentUserId !== creatorId && (
            <button
              onClick={handleLeave}
              className="bg-white text-gray-700 px-6 py-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors font-medium"
            >
              Покинуть дерево
            </button>
          )}
        </div>
      </div>

      <Modal isOpen={showInvite} onClose={() => setShowInvite(false)} title="Пригласить участника">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Логин пользователя</label>
            <input
              type="text"
              value={inviteLogin}
              onChange={(e) => { setInviteLogin(e.target.value); setInviteUserId(""); }}
              className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-gray-700 placeholder-gray-400 focus:outline-none focus:border-caramel focus:ring-1 focus:ring-caramel transition-colors"
              placeholder="Введите логин"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Или ID пользователя</label>
            <input
              type="number"
              value={inviteUserId}
              onChange={(e) => { setInviteUserId(e.target.value); setInviteLogin(""); }}
              className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-gray-700 placeholder-gray-400 focus:outline-none focus:border-caramel focus:ring-1 focus:ring-caramel transition-colors"
              placeholder="Введите ID"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Роль</label>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-gray-700 focus:outline-none focus:border-caramel focus:ring-1 focus:ring-caramel transition-colors"
            >
              <option value="reader">Читатель</option>
              <option value="editor">Редактор</option>
              <option value="admin">Админ</option>
            </select>
          </div>
          {inviteError && (
            <div className="flex items-center gap-2 text-gray-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm">
              <FiAlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              {inviteError}
            </div>
          )}
          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={() => { setShowInvite(false); setInviteError(""); setInviteLogin(""); setInviteUserId(""); }}
              className="px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Отмена
            </button>
            <button
              onClick={handleInvite}
              className="bg-caramel text-white px-6 py-3 rounded-lg hover:bg-caramel/90 transition-colors font-medium"
            >
              Пригласить
            </button>
          </div>
        </div>
      </Modal>

      <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Имя</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Фамилия</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Логин</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Роль</th>
              <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {members.map((member) => {
              const isCreator = creatorId === member.userId;
              return (
                <tr key={member.userId} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-gray-700">{member.firstName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-700">{member.secondName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">{member.login}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {isCreator ? (
                      <span className="px-4 py-1 rounded-lg text-xs font-medium bg-gray-100 text-caramel border border-gray-200">
                        Основатель
                      </span>
                    ) : (
                      <select
                        value={member.role}
                        onChange={(e) => handleRoleChange(member.userId, e.target.value)}
                        className="bg-white border border-gray-200 rounded-lg px-3 py-1 text-sm text-gray-700 focus:outline-none focus:border-caramel focus:ring-1 focus:ring-caramel transition-colors"
                      >
                        <option value="reader">Читатель</option>
                        <option value="editor">Редактор</option>
                        <option value="admin">Админ</option>
                      </select>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    {isCreator ? (
                      <span className="text-xs text-gray-400">—</span>
                    ) : (
                      <button
                        onClick={() => handleRemove(member.userId)}
                        className="text-gray-500 hover:text-gray-700 text-sm transition-colors"
                      >
                        Удалить
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {members.length === 0 && (
          <div className="py-12 text-center text-gray-500">Нет участников</div>
        )}
      </div>
    </div>
  );
}
