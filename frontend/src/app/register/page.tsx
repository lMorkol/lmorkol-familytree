"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { setToken } from "@/lib/auth";
import { FiAlertCircle, FiEye, FiEyeOff } from "react-icons/fi";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ login: "", password: "", firstName: "", secondName: "", gender: "male", email: "", phone: "" });
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const payload: any = { ...form };
      if (!payload.email) delete payload.email;
      if (!payload.phone) delete payload.phone;
      const res = await api.post("/v1/user/register", payload);
      setToken(res.data.data.token);
      router.push("/profile");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Ошибка регистрации");
    }
  };

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [field]: e.target.value });

  return (
    <div className="max-w-md mx-auto mt-20">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Регистрация</h2>
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg border border-gray-200 space-y-6">
        {error && (
          <div className="flex items-center gap-2 text-gray-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm">
            <FiAlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            {error}
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Имя</label>
          <input type="text" value={form.firstName} onChange={update("firstName")} className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-gray-700 placeholder-gray-400 focus:outline-none focus:border-caramel focus:ring-1 focus:ring-caramel transition-colors" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Фамилия</label>
          <input type="text" value={form.secondName} onChange={update("secondName")} className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-gray-700 placeholder-gray-400 focus:outline-none focus:border-caramel focus:ring-1 focus:ring-caramel transition-colors" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Пол</label>
          <select value={form.gender} onChange={update("gender")} className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-gray-700 focus:outline-none focus:border-caramel focus:ring-1 focus:ring-caramel transition-colors" required>
            <option value="male">Мужской</option>
            <option value="female">Женский</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Логин</label>
          <input type="text" value={form.login} onChange={update("login")} className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-gray-700 placeholder-gray-400 focus:outline-none focus:border-caramel focus:ring-1 focus:ring-caramel transition-colors" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Пароль</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={form.password}
              onChange={update("password")}
              className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-gray-700 placeholder-gray-400 focus:outline-none focus:border-caramel focus:ring-1 focus:ring-caramel transition-colors pr-12"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
            >
              {showPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email <span className="text-gray-400 font-normal">(необязательно)</span>
          </label>
          <input type="email" value={form.email} onChange={update("email")} className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-gray-700 placeholder-gray-400 focus:outline-none focus:border-caramel focus:ring-1 focus:ring-caramel transition-colors" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Телефон <span className="text-gray-400 font-normal">(необязательно)</span>
          </label>
          <input type="tel" value={form.phone} onChange={update("phone")} className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-gray-700 placeholder-gray-400 focus:outline-none focus:border-caramel focus:ring-1 focus:ring-caramel transition-colors" />
        </div>
        <button type="submit" className="w-full bg-caramel text-white py-3 rounded-lg hover:bg-caramel/90 transition-colors font-medium">
          Зарегистрироваться
        </button>
        <p className="text-center text-sm text-gray-500">
          Уже есть аккаунт?{" "}
          <a href="/login" className="text-caramel hover:text-caramel/80 transition-colors">Войти</a>
        </p>
      </form>
    </div>
  );
}
