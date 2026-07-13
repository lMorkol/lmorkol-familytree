"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { isAuthenticated } from "@/lib/auth";
import { useTree } from "@/contexts/TreeContext";
import Modal from "@/components/ui/Modal";
import { FiAlertCircle, FiCheckCircle, FiChevronDown, FiExternalLink, FiCopy, FiCheck, FiSearch, FiUser, FiX, FiGitBranch } from "react-icons/fi";

interface UserProfile {
  id: number;
  login: string;
  firstName: string;
  secondName: string;
  email: string | null;
  phone: string | null;
  trees: { id: number; name: string; humanId: number | null }[];
}

interface SearchUser {
  humanId: number;
  name: string;
  gender: string;
  treeId: number;
}

export default function ProfilePage() {
  const router = useRouter();
  const { currentTreeId } = useTree();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [humanTreeId, setHumanTreeId] = useState<number | null>(null);
  const [humanNames, setHumanNames] = useState<Record<number, string>>({});

  const [openSection, setOpenSection] = useState<"security" | null>(null);

  const [editing, setEditing] = useState(false);
  const [editFirstName, setEditFirstName] = useState("");
  const [editSecondName, setEditSecondName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editHumanId, setEditHumanId] = useState("");
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Поиск людей
  const [humanSearchQuery, setHumanSearchQuery] = useState("");
  const [humanSearchResults, setHumanSearchResults] = useState<SearchUser[]>([]);
  const [showHumanSearch, setShowHumanSearch] = useState(false);
  const [selectedHumanName, setSelectedHumanName] = useState("");
  const humanSearchRef = useRef<HTMLDivElement>(null);
  const humanSearchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const searchHumans = useCallback(async (query: string) => {
    if (query.length < 1 || !currentTreeId) {
      setHumanSearchResults([]);
      return;
    }
    try {
      const res = await api.get(`/v1/humans/search?q=${encodeURIComponent(query)}&tree_id=${currentTreeId}`);
      setHumanSearchResults(res.data.data.items);
    } catch {
      setHumanSearchResults([]);
    }
  }, [currentTreeId]);

  useEffect(() => {
    if (humanSearchTimer.current) clearTimeout(humanSearchTimer.current);
    humanSearchTimer.current = setTimeout(() => searchHumans(humanSearchQuery), 300);
    return () => { if (humanSearchTimer.current) clearTimeout(humanSearchTimer.current); };
  }, [humanSearchQuery, searchHumans]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (humanSearchRef.current && !humanSearchRef.current.contains(e.target as Node)) {
        setShowHumanSearch(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectHuman = (user: SearchUser) => {
    setEditHumanId(String(user.humanId));
    setSelectedHumanName(user.name);
    setHumanSearchQuery("");
    setHumanSearchResults([]);
    setShowHumanSearch(false);
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }
    api.get("/v1/user/me").then((userRes) => {
      const p = userRes.data.data;
      setProfile(p);
      if (p.humanId) {
        api.get(`/v1/humans/${p.humanId}`).then((hRes) => {
          setHumanTreeId(hRes.data.data.treeId);
        }).catch(() => {});
      }
      const humanIds = (p.trees || []).filter((t: any) => t.humanId).map((t: any) => t.humanId);
      if (humanIds.length > 0) {
        Promise.all(
          humanIds.map((id: number) =>
            api.get(`/v1/humans/${id}`).then((r) => {
              const h = r.data.data;
              return [id, [h.secondName, h.firstName].filter(Boolean).join(" ") || `#${id}`];
            }).catch(() => [id, `#${id}`])
          )
        ).then((pairs) => {
          const map: Record<number, string> = {};
          pairs.forEach(([id, name]) => { map[id as number] = name as string; });
          setHumanNames(map);
        });
      }
      setLoading(false);
    });
  }, [router]);

  const startEditing = () => {
    setEditFirstName(profile?.firstName || "");
    setEditSecondName(profile?.secondName || "");
    setEditEmail(profile?.email || "");
    setEditPhone(profile?.phone || "");
    const currentTree = profile?.trees?.find((t: any) => t.id === currentTreeId);
    setEditHumanId(currentTree?.humanId?.toString() || "");
    setSelectedHumanName("");
    setProfileError("");
    setProfileSuccess(false);
    setPasswordSuccess(false);
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
    setProfileError("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordError("");
  };

  const handleSaveProfile = async () => {
    setProfileError("");
    if (!editFirstName.trim() || !editSecondName.trim()) {
      setProfileError("Имя и фамилия обязательны");
      return;
    }
    try {
      const res = await api.patch("/v1/user/me", {
        firstName: editFirstName.trim(),
        secondName: editSecondName.trim(),
        email: editEmail.trim() || null,
        phone: editPhone.trim() || null,
        humanId: editHumanId ? Number(editHumanId) : null,
        humanTreeId: editHumanId ? currentTreeId : null,
      });
      setProfile(res.data.data);
      setEditing(false);
      setProfileSuccess(true);
    } catch (err: any) {
      setProfileError(err.response?.data?.detail || "Ошибка сохранения");
    }
  };

  const handlePasswordChange = () => {
    setPasswordError("");
    setPasswordSuccess(false);

    if (!newPassword) {
      setPasswordError("Введите новый пароль");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Пароли не совпадают");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError("Пароль должен быть не менее 6 символов");
      return;
    }
    setShowConfirmModal(true);
  };

  const confirmPasswordChange = async () => {
    try {
      await api.patch("/v1/user/me/password", { newPassword });
      setShowConfirmModal(false);
      setNewPassword("");
      setConfirmPassword("");
      setPasswordSuccess(true);
    } catch (err: any) {
      setPasswordError(err.response?.data?.detail || "Ошибка смены пароля");
    }
  };

  if (loading) return <div className="py-10 text-center text-gray-500">Загрузка...</div>;

  const SectionHeader = ({ title, section, isOpen }: { title: string; section: "security"; isOpen: boolean }) => (
    <button
      onClick={() => setOpenSection(isOpen ? null : section)}
      className="w-full flex items-center justify-between py-4 text-left"
    >
      <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
      <FiChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${isOpen ? "rotate-180" : ""}`} />
    </button>
  );

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800">Профиль</h2>
      </div>

      {/* Обо мне */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-800">Обо мне</h3>
          {!editing && (
            <button
              onClick={startEditing}
              className="text-sm text-caramel hover:text-caramel/80 transition-colors"
            >
              Редактировать
            </button>
          )}
        </div>

        {editing ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Имя</label>
              <input
                type="text"
                value={editFirstName}
                onChange={(e) => setEditFirstName(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-gray-700 placeholder-gray-400 focus:outline-none focus:border-caramel focus:ring-1 focus:ring-caramel transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Фамилия</label>
              <input
                type="text"
                value={editSecondName}
                onChange={(e) => setEditSecondName(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-gray-700 placeholder-gray-400 focus:outline-none focus:border-caramel focus:ring-1 focus:ring-caramel transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-gray-700 placeholder-gray-400 focus:outline-none focus:border-caramel focus:ring-1 focus:ring-caramel transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Телефон</label>
              <input
                type="tel"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-gray-700 placeholder-gray-400 focus:outline-none focus:border-caramel focus:ring-1 focus:ring-caramel transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Человек в дереве</label>
              <div ref={humanSearchRef} className="relative">
                <div className="flex items-center bg-white border border-gray-200 rounded-lg px-3 py-2 focus-within:border-caramel focus-within:ring-1 focus-within:ring-caramel transition-colors">
                  <FiSearch className="w-4 h-4 text-gray-400 mr-2 shrink-0" />
                  <input
                    type="text"
                    value={humanSearchQuery || selectedHumanName || editHumanId}
                    onChange={(e) => { setHumanSearchQuery(e.target.value); setSelectedHumanName(""); setEditHumanId(""); setShowHumanSearch(true); }}
                    onFocus={() => setShowHumanSearch(true)}
                    className="flex-1 text-sm text-gray-700 placeholder-gray-400 focus:outline-none"
                    placeholder={currentTreeId ? "Поиск по имени, фамилии или ID..." : "Сначала выберите дерево"}
                    disabled={!currentTreeId}
                  />
                  {editHumanId && (
                    <button type="button" onClick={() => { setEditHumanId(""); setSelectedHumanName(""); setHumanSearchQuery(""); }}
                      className="text-gray-400 hover:text-gray-600 ml-1">
                      <FiX className="w-4 h-4" />
                    </button>
                  )}
                </div>
                {showHumanSearch && humanSearchResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {humanSearchResults.map(u => (
                      <button key={u.humanId} type="button"
                        onClick={() => selectHuman(u)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left">
                        <FiUser className="w-4 h-4 text-gray-400 shrink-0" />
                        <span className="truncate">{u.name}</span>
                        <span className="text-xs text-gray-400 ml-auto shrink-0">ID: {u.humanId}</span>
                      </button>
                    ))}
                  </div>
                )}
                {showHumanSearch && humanSearchQuery.length > 0 && humanSearchResults.length === 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-sm text-gray-500">
                    Ничего не найдено
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {currentTreeId ? "Привяжите профиль к карточке человека в текущем дереве" : "Выберите дерево в хедере для привязки"}
              </p>
            </div>

            {profileError && (
              <div className="flex items-center gap-2 text-gray-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm">
                <FiAlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                {profileError}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={cancelEditing}
                className="px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={handleSaveProfile}
                className="bg-caramel text-white px-6 py-3 rounded-lg hover:bg-caramel/90 transition-colors font-medium"
              >
                Сохранить
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-500">Имя:</span>
              <span className="font-medium text-gray-700">{profile?.firstName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Фамилия:</span>
              <span className="font-medium text-gray-700">{profile?.secondName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Email:</span>
              <span className="font-medium text-gray-700">{profile?.email || <span className="text-gray-400 italic">Не указан</span>}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Телефон:</span>
              <span className="font-medium text-gray-700">{profile?.phone || <span className="text-gray-400 italic">Не указан</span>}</span>
            </div>

            {/* Привязка к текущему дереву */}
            {currentTreeId && profile?.trees && (
              (() => {
                const currentTree = profile.trees.find((t: any) => t.id === currentTreeId);
                if (!currentTree) return null;
                return (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Вы в семье:</span>
                    <div className="flex items-center gap-2">
                      {currentTree.humanId ? (
                        <>
                          <span className="font-medium text-gray-700">{humanNames[currentTree.humanId] || `ID: ${currentTree.humanId}`}</span>
                          <button
                            onClick={() => router.push(`/tree/${currentTreeId}/human/${currentTree.humanId}`)}
                            className="text-caramel hover:text-caramel/80 transition-colors"
                            title="Перейти к карточке"
                          >
                            <FiExternalLink className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <span className="text-gray-400 italic">Не привязан</span>
                      )}
                    </div>
                  </div>
                );
              })()
            )}

            {profileSuccess && (
              <div className="flex items-center gap-2 text-gray-700 bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm">
                <FiCheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                Профиль обновлён
              </div>
            )}
          </div>
        )}
      </div>

      {/* Безопасность */}
      <div className="bg-white rounded-lg border border-gray-200 mb-6">
        <div className="px-6 border-b border-gray-200">
          <SectionHeader title="Безопасность" section="security" isOpen={openSection === "security"} />
        </div>
        {openSection === "security" && (
          <div className="px-6 pb-6 pt-4">
            <div className="space-y-4 mb-6">
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <div>
                  <span className="text-xs text-gray-400 uppercase tracking-wide">ID</span>
                  <p className="text-gray-700 font-mono">{profile?.id}</p>
                </div>
                <button
                  onClick={() => copyToClipboard(String(profile?.id || ""), "id")}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Копировать ID"
                >
                  {copiedField === "id" ? (
                    <FiCheck className="w-4 h-4 text-green-500" />
                  ) : (
                    <FiCopy className="w-4 h-4" />
                  )}
                </button>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <div>
                  <span className="text-xs text-gray-400 uppercase tracking-wide">Логин</span>
                  <p className="text-gray-700 font-mono">{profile?.login}</p>
                </div>
                <button
                  onClick={() => copyToClipboard(profile?.login || "", "login")}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Копировать логин"
                >
                  {copiedField === "login" ? (
                    <FiCheck className="w-4 h-4 text-green-500" />
                  ) : (
                    <FiCopy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h4 className="text-sm font-medium text-gray-700 mb-4">Изменить пароль</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-500 mb-2">Новый пароль</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-gray-700 placeholder-gray-400 focus:outline-none focus:border-caramel focus:ring-1 focus:ring-caramel transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-2">Повторите пароль</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-gray-700 placeholder-gray-400 focus:outline-none focus:border-caramel focus:ring-1 focus:ring-caramel transition-colors"
                  />
                </div>
                {passwordError && (
                  <div className="flex items-center gap-2 text-gray-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm">
                    <FiAlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                    {passwordError}
                  </div>
                )}
                {passwordSuccess && (
                  <div className="flex items-center gap-2 text-gray-700 bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm">
                    <FiCheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    Пароль успешно изменён
                  </div>
                )}
                <button
                  onClick={handlePasswordChange}
                  className="bg-caramel text-white px-6 py-3 rounded-lg hover:bg-caramel/90 transition-colors text-sm font-medium"
                >
                  Изменить пароль
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <Modal isOpen={showConfirmModal} onClose={() => setShowConfirmModal(false)} title="Подтверждение">
        <p className="text-gray-600 mb-6">Вы уверены, что хотите изменить пароль?</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={() => setShowConfirmModal(false)}
            className="px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Отмена
          </button>
          <button
            onClick={confirmPasswordChange}
            className="bg-caramel text-white px-6 py-3 rounded-lg hover:bg-caramel/90 transition-colors font-medium"
          >
            Да, изменить
          </button>
        </div>
      </Modal>
    </div>
  );
}
