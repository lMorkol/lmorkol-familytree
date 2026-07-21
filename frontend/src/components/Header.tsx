"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated, removeToken } from "@/lib/auth";
import { useTree } from "@/contexts/TreeContext";
import { FiUser, FiLogOut, FiChevronDown, FiGitBranch } from "react-icons/fi";

export default function Header() {
  const router = useRouter();
  const { currentTreeId, trees, setCurrentTree } = useTree();
  const [auth, setAuth] = useState(false);
  const [showTreeDropdown, setShowTreeDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setAuth(isAuthenticated());
    const onUpdate = () => setAuth(isAuthenticated());
    window.addEventListener("auth-change", onUpdate);
    return () => window.removeEventListener("auth-change", onUpdate);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowTreeDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    removeToken();
    setAuth(false);
    router.push("/login");
  };

  const currentTree = trees.find(t => t.id === currentTreeId);

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4 flex flex-wrap justify-between items-center gap-2">
        <div className="flex items-center gap-3 sm:gap-6 min-w-0">
          <h1
            className="text-lg sm:text-xl font-bold text-gray-800 cursor-pointer shrink-0"
            onClick={() => router.push("/")}
          >
            FamilyTree
          </h1>

          {auth && trees.length > 0 && (
            <div ref={dropdownRef} className="relative min-w-0">
              <button
                onClick={() => setShowTreeDropdown(!showTreeDropdown)}
                className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm bg-gray-50 text-gray-700 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors min-h-[36px]"
              >
                <FiGitBranch className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-caramel shrink-0" />
                <span className="max-w-[90px] sm:max-w-[150px] truncate">{currentTree?.name || "Выберите дерево"}</span>
                <FiChevronDown className={`w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 transition-transform shrink-0 ${showTreeDropdown ? "rotate-180" : ""}`} />
              </button>
              {showTreeDropdown && (
                <div className="absolute z-50 left-0 mt-1 w-[calc(100vw-2rem)] sm:w-64 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {trees.map(tree => (
                    <button
                      key={tree.id}
                      onClick={() => { setCurrentTree(tree.id); setShowTreeDropdown(false); }}
                      className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm text-left transition-colors ${
                        tree.id === currentTreeId
                          ? "bg-caramel/10 text-caramel font-medium"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <FiGitBranch className="w-4 h-4 shrink-0" />
                      <span className="truncate">{tree.name}</span>
                    </button>
                  ))}
                  <div className="border-t border-gray-100">
                    <button
                      onClick={() => { router.push("/trees"); setShowTreeDropdown(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-gray-500 hover:bg-gray-50 transition-colors"
                    >
                      Все деревья...
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <nav className="flex gap-2 sm:gap-4 items-center">
          <a href="/" className="text-xs sm:text-sm text-gray-600 hover:text-gray-800 transition-colors">Главная</a>
          <a href="/news" className="text-xs sm:text-sm text-gray-600 hover:text-gray-800 transition-colors">Новости</a>
          <a href="/onboarding" className="text-xs sm:text-sm text-gray-600 hover:text-gray-800 transition-colors">Обучение</a>
          {auth ? (
            <>
              <button
                onClick={() => router.push("/profile")}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-caramel hover:bg-gray-200 transition-colors"
                title="Профиль"
              >
                <FiUser className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm bg-white text-gray-600 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors min-h-[36px]"
              >
                <FiLogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Выйти</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => router.push("/login")}
                className="text-gray-600 hover:text-gray-800 transition-colors text-sm"
              >
                Войти
              </button>
              <button
                onClick={() => router.push("/register")}
                className="text-xs sm:text-sm bg-caramel text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg hover:bg-caramel/90 transition-colors"
              >
                Регистрация
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
