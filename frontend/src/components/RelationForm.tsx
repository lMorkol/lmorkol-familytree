"use client";

import { useState, useEffect, useRef } from "react";
import api from "@/lib/api";

interface Props {
  treeId: number;
  initial?: {
    id: number;
    relationType: string;
    startDate?: string;
    endDate?: string;
  };
  onSubmit: (data: { relativeId: number; relationType: string; startDate?: string; endDate?: string }) => void;
  onCancel: () => void;
}

const SPOUSE_TYPES = ["spouse", "ex_spouse"];
const FAMILY_TYPES = ["parent", "child", "adopted", "sibling", "grandmother", "grandfather", "grandchild", "stepbrother", "stepsister"];

interface SearchResult {
  humanId: number;
  name: string;
}

const toDateInput = (val?: string) => {
  if (!val) return "";
  const d = val.includes("T") ? val.split("T")[0] : val.split(" ")[0];
  return /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : "";
};

export default function RelationForm({ treeId, initial, onSubmit, onCancel }: Props) {
  const [relativeId, setRelativeId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedName, setSelectedName] = useState("");
  const [relationType, setRelationType] = useState("parent");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout>>();

  const isEditing = !!initial;

  useEffect(() => {
    if (initial) {
      setRelationType(initial.relationType);
      setStartDate(toDateInput(initial.startDate));
      setEndDate(toDateInput(initial.endDate));
    }
  }, [initial]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setSelectedName("");
    setRelativeId(null);

    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    if (value.trim().length < 1) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    searchTimeout.current = setTimeout(async () => {
      try {
        const res = await api.get(`/v1/humans/search?q=${encodeURIComponent(value)}&tree_id=${treeId}`);
        const items = res.data.data.items || [];
        setSearchResults(items);
        setShowDropdown(items.length > 0);
      } catch {
        setSearchResults([]);
        setShowDropdown(false);
      }
    }, 300);
  };

  const handleSelect = (item: SearchResult) => {
    setRelativeId(item.humanId);
    setSelectedName(item.name);
    setSearchQuery(`${item.humanId} — ${item.name}`);
    setShowDropdown(false);
  };

  const showDates = relationType === "spouse" || relationType === "ex_spouse";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing) {
      const data: { relativeId: number; relationType: string; startDate?: string; endDate?: string } = {
        relativeId: 0,
        relationType,
      };
      if (showDates) {
        data.startDate = startDate || undefined;
        data.endDate = endDate || undefined;
      }
      onSubmit(data);
    } else {
      if (!relativeId) return;
      const data: { relativeId: number; relationType: string; startDate?: string; endDate?: string } = {
        relativeId,
        relationType,
      };
      if (showDates && startDate) data.startDate = startDate;
      if (showDates && endDate) data.endDate = endDate;
      onSubmit(data);
    }
  };

  return (
    <div className="bg-gray-50 p-5 rounded-lg border border-gray-200 mb-4">
      <h4 className="font-medium text-gray-700 mb-4">{isEditing ? "Редактировать связь" : "Новая связь"}</h4>
      <form onSubmit={handleSubmit} className="space-y-4">
        {!isEditing && (
          <div className="relative" ref={dropdownRef}>
            <label className="block text-sm font-medium text-gray-700 mb-2">Человек</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
              placeholder="Введите имя, фамилию или ID..."
              className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-gray-700 placeholder-gray-400 focus:outline-none focus:border-caramel focus:ring-1 focus:ring-caramel transition-colors"
              required
            />
            {showDropdown && searchResults.length > 0 && (
              <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {searchResults.map((item) => (
                  <button
                    key={item.humanId}
                    type="button"
                    onClick={() => handleSelect(item)}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-left hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-gray-400 text-xs">#{item.humanId}</span>
                    <span className="text-gray-700">{item.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Тип связи</label>
          <select value={relationType} onChange={(e) => setRelationType(e.target.value)} className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-gray-700 focus:outline-none focus:border-caramel focus:ring-1 focus:ring-caramel transition-colors">
            {isEditing && SPOUSE_TYPES.includes(initial?.relationType || "") ? (
              <>
                <option value="spouse">Супруг(а)</option>
                <option value="ex_spouse">Бывший супруг(а)</option>
              </>
            ) : isEditing && FAMILY_TYPES.includes(initial?.relationType || "") ? (
              <>
                <option value="parent">Родитель</option>
                <option value="child">Ребёнок</option>
                <option value="adopted">Усыновлённый</option>
                <option value="sibling">Брат/Сестра</option>
                <option value="grandmother">Бабушка</option>
                <option value="grandfather">Дедушка</option>
                <option value="grandchild">Внук(внучка)</option>
                <option value="stepbrother">Сводный брат</option>
                <option value="stepsister">Сводная сестра</option>
              </>
            ) : (
              <>
                <option value="parent">Родитель</option>
                <option value="child">Ребёнок</option>
                <option value="spouse">Супруг(а)</option>
                <option value="ex_spouse">Бывший супруг(а)</option>
                <option value="adopted">Усыновлённый</option>
                <option value="sibling">Брат/Сестра</option>
                <option value="grandmother">Бабушка</option>
                <option value="grandfather">Дедушка</option>
                <option value="grandchild">Внук(внучка)</option>
                <option value="stepbrother">Сводный брат</option>
                <option value="stepsister">Сводная сестра</option>
              </>
            )}
          </select>
        </div>
        {(showDates || isEditing) && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{showDates ? "Дата свадьбы" : "Дата начала"}</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-gray-700 focus:outline-none focus:border-caramel focus:ring-1 focus:ring-caramel transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{showDates ? "Дата развода" : "Дата окончания"} <span className="text-gray-400 font-normal">(необязательно)</span></label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-gray-700 focus:outline-none focus:border-caramel focus:ring-1 focus:ring-caramel transition-colors" />
            </div>
          </div>
        )}
        <div className="flex gap-3">
          <button type="submit" className="bg-caramel text-white px-5 py-2 rounded-lg hover:bg-caramel/90 transition-colors text-sm font-medium">{isEditing ? "Сохранить" : "Добавить"}</button>
          <button type="button" onClick={onCancel} className="bg-white text-gray-600 px-5 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-sm">Отмена</button>
        </div>
      </form>
    </div>
  );
}
