"use client";

import { useState } from "react";
import type { HumanAddress } from "@/types";

const ADDRESS_TYPES = [
  "Постоянное место жительства",
  "Дача",
  "Временное пребывание",
  "Место работы",
  "Другое",
];

interface Props {
  initial?: HumanAddress;
  onSubmit: (data: {
    country?: string;
    city?: string;
    street?: string;
    house?: string;
    apartment?: string;
    addressType?: string;
    periodStart?: string;
    periodEnd?: string;
  }) => void;
  onCancel: () => void;
}

export default function AddressForm({ initial, onSubmit, onCancel }: Props) {
  const [country, setCountry] = useState(initial?.country || "");
  const [city, setCity] = useState(initial?.city || "");
  const [street, setStreet] = useState(initial?.street || "");
  const [house, setHouse] = useState(initial?.house || "");
  const [apartment, setApartment] = useState(initial?.apartment || "");
  const [addressType, setAddressType] = useState(initial?.addressType || "");
  const [periodStart, setPeriodStart] = useState(initial?.periodStart || "");
  const [periodEnd, setPeriodEnd] = useState(initial?.periodEnd || "");

  const handleSubmit = () => {
    onSubmit({
      country: country || undefined,
      city: city || undefined,
      street: street || undefined,
      house: house || undefined,
      apartment: apartment || undefined,
      addressType: addressType || undefined,
      periodStart: periodStart || undefined,
      periodEnd: periodEnd || undefined,
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs text-gray-500 mb-1">Тип адреса</label>
        <select
          value={addressType}
          onChange={(e) => setAddressType(e.target.value)}
          className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-caramel focus:ring-1 focus:ring-caramel transition-colors"
        >
          <option value="">Не указан</option>
          {ADDRESS_TYPES.map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Страна</label>
          <input
            type="text"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            placeholder="Россия"
            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-caramel focus:ring-1 focus:ring-caramel transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Населённый пункт</label>
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Москва"
            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-caramel focus:ring-1 focus:ring-caramel transition-colors"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">Улица</label>
        <input
          type="text"
          value={street}
          onChange={(e) => setStreet(e.target.value)}
          placeholder="ул. Ленина"
          className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-caramel focus:ring-1 focus:ring-caramel transition-colors"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Дом</label>
          <input
            type="text"
            value={house}
            onChange={(e) => setHouse(e.target.value)}
            placeholder="10"
            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-caramel focus:ring-1 focus:ring-caramel transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Квартира</label>
          <input
            type="text"
            value={apartment}
            onChange={(e) => setApartment(e.target.value)}
            placeholder="42"
            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-caramel focus:ring-1 focus:ring-caramel transition-colors"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Период с</label>
          <input
            type="date"
            value={periodStart}
            onChange={(e) => setPeriodStart(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-caramel focus:ring-1 focus:ring-caramel transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Период по</label>
          <input
            type="date"
            value={periodEnd}
            onChange={(e) => setPeriodEnd(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-caramel focus:ring-1 focus:ring-caramel transition-colors"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
        >
          Отмена
        </button>
        <button
          onClick={handleSubmit}
          className="bg-caramel text-white px-4 py-2 rounded-lg text-sm hover:bg-caramel/90 transition-colors font-medium"
        >
          {initial ? "Сохранить" : "Добавить"}
        </button>
      </div>
    </div>
  );
}
