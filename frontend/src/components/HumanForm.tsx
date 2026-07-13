"use client";

import { useState } from "react";

interface Props {
  onSubmit: (data: any) => void;
  onCancel: () => void;
  initial?: any;
}

export default function HumanForm({ onSubmit, onCancel, initial }: Props) {
  const parseDate = (val?: string) => val ? val.split(" ")[0].split("T")[0] : "";

  const [form, setForm] = useState({
    firstName: initial?.firstName || "",
    secondName: initial?.secondName || "",
    patronymic: initial?.patronymic || "",
    gender: initial?.gender || "male",
    birthDate: parseDate(initial?.birthDate),
    deathDate: parseDate(initial?.deathDate),
    placeOfBirth: initial?.placeOfBirth || "",
    country: initial?.country || "",
  });

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [field]: e.target.value });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 mb-6">
      <h3 className="font-bold text-lg text-gray-800 mb-6">{initial ? "Редактировать человека" : "Новый человек"}</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Имя</label>
            <input type="text" value={form.firstName} onChange={update("firstName")} className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-gray-700 placeholder-gray-400 focus:outline-none focus:border-caramel focus:ring-1 focus:ring-caramel transition-colors" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Фамилия</label>
            <input type="text" value={form.secondName} onChange={update("secondName")} className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-gray-700 placeholder-gray-400 focus:outline-none focus:border-caramel focus:ring-1 focus:ring-caramel transition-colors" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Отчество</label>
            <input type="text" value={form.patronymic} onChange={update("patronymic")} className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-gray-700 placeholder-gray-400 focus:outline-none focus:border-caramel focus:ring-1 focus:ring-caramel transition-colors" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Пол</label>
            <select value={form.gender} onChange={update("gender")} className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-gray-700 focus:outline-none focus:border-caramel focus:ring-1 focus:ring-caramel transition-colors">
              <option value="male">Мужской</option>
              <option value="female">Женский</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Дата рождения</label>
            <input type="date" value={form.birthDate} onChange={update("birthDate")} className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-gray-700 focus:outline-none focus:border-caramel focus:ring-1 focus:ring-caramel transition-colors" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Дата смерти</label>
            <input type="date" value={form.deathDate} onChange={update("deathDate")} className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-gray-700 focus:outline-none focus:border-caramel focus:ring-1 focus:ring-caramel transition-colors" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Место рождения</label>
            <input type="text" value={form.placeOfBirth} onChange={update("placeOfBirth")} className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-gray-700 placeholder-gray-400 focus:outline-none focus:border-caramel focus:ring-1 focus:ring-caramel transition-colors" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Страна</label>
            <input type="text" value={form.country} onChange={update("country")} className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-gray-700 placeholder-gray-400 focus:outline-none focus:border-caramel focus:ring-1 focus:ring-caramel transition-colors" />
          </div>
        </div>
        <div className="flex gap-3 pt-4">
          <button type="submit" className="bg-caramel text-white px-6 py-3 rounded-lg hover:bg-caramel/90 transition-colors font-medium">
            {initial ? "Сохранить" : "Создать"}
          </button>
          <button type="button" onClick={onCancel} className="bg-white text-gray-600 px-6 py-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
            Отмена
          </button>
        </div>
      </form>
    </div>
  );
}
