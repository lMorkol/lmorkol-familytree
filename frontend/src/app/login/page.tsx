"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { setToken } from "@/lib/auth";
import { FiAlertCircle, FiEye, FiEyeOff } from "react-icons/fi";

export default function LoginPage() {
  const router = useRouter();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const res = await api.post("/v1/user/login", { login, password });
      setToken(res.data.data.token);
      router.push("/trees");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Ошибка авторизации");
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Вход</h2>
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg border border-gray-200 space-y-6">
        {error && (
          <div className="flex items-center gap-2 text-gray-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm">
            <FiAlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            {error}
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Логин</label>
          <input
            type="text"
            value={login}
            onChange={(e) => setLogin(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-gray-700 placeholder-gray-400 focus:outline-none focus:border-caramel focus:ring-1 focus:ring-caramel transition-colors"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Пароль</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 pr-12 text-gray-700 placeholder-gray-400 focus:outline-none focus:border-caramel focus:ring-1 focus:ring-caramel transition-colors"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
            </button>
          </div>
        </div>
        <button
          type="submit"
          className="w-full bg-caramel text-white py-3 rounded-lg hover:bg-caramel/90 transition-colors font-medium"
        >
          Войти
        </button>
        <p className="text-center text-sm text-gray-500">
          Нет аккаунта?{" "}
          <a href="/register" className="text-caramel hover:text-caramel/80 transition-colors">
            Зарегистрироваться
          </a>
        </p>
      </form>
    </div>
  );
}
