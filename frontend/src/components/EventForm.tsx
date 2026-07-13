"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { FiPaperclip, FiX, FiSearch, FiUser } from "react-icons/fi";
import api from "@/lib/api";

interface Participant {
  humanId: number;
  name: string;
  role?: string;
}

interface SearchUser {
  humanId: number;
  name: string;
  gender: string;
  treeId: number;
}

interface Props {
  initial?: {
    eventId: number;
    name?: string;
    eventDate: string;
    eventEndDate?: string;
    eventDescription: string;
    participants?: Participant[];
  };
  treeId: number;
  currentHumanId: number;
  onSubmit: (data: { eventDate: string; eventEndDate?: string; eventDescription: string; name?: string; participants?: number[] }, files?: File[]) => void;
  onCancel: () => void;
}

const toDateInput = (val?: string) => {
  if (!val) return "";
  const d = val.includes("T") ? val.split("T")[0] : val.split(" ")[0];
  return /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : "";
};

export default function EventForm({ initial, treeId, currentHumanId, onSubmit, onCancel }: Props) {
  const [eventDate, setEventDate] = useState(toDateInput(initial?.eventDate));
  const [eventEndDate, setEventEndDate] = useState(toDateInput(initial?.eventEndDate));
  const [eventName, setEventName] = useState(initial?.name || "");
  const [eventDescription, setEventDescription] = useState(initial?.eventDescription || "");
  const [files, setFiles] = useState<File[]>([]);
  const [participants, setParticipants] = useState<Participant[]>(initial?.participants || []);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isEditing = !!initial;

  const handleSearch = useCallback(async (query: string) => {
    if (query.length < 1) {
      setSearchResults([]);
      return;
    }
    setSearchLoading(true);
    try {
      const res = await api.get(`/v1/humans/search?q=${encodeURIComponent(query)}&tree_id=${treeId}`);
      const filtered = res.data.data.items.filter((u: SearchUser) =>
        !participants.some(p => p.humanId === u.humanId)
      );
      setSearchResults(filtered);
    } catch {
      setSearchResults([]);
    }
    setSearchLoading(false);
  }, [treeId, participants]);

  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => handleSearch(searchQuery), 300);
    return () => { if (searchTimerRef.current) clearTimeout(searchTimerRef.current); };
  }, [searchQuery, handleSearch]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearch(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const addParticipant = (user: SearchUser) => {
    if (!participants.some(p => p.humanId === user.humanId)) {
      setParticipants(prev => [...prev, { humanId: user.humanId, name: user.name }]);
    }
    setSearchQuery("");
    setSearchResults([]);
    setShowSearch(false);
  };

  const removeParticipant = (humanId: number) => {
    setParticipants(prev => prev.filter(p => p.humanId !== humanId));
  };

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files;
    if (selected) {
      setFiles(prev => [...prev, ...Array.from(selected)]);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(
      {
        eventDate,
        eventEndDate: eventEndDate || undefined,
        eventDescription,
        name: eventName || undefined,
        participants: participants.map(p => p.humanId),
      },
      files.length > 0 ? files : undefined,
    );
  };

  return (
    <div className="bg-gray-50 p-5 rounded-lg border border-gray-200 mb-4">
      <h4 className="font-medium text-gray-700 mb-4">{isEditing ? "Редактировать событие" : "Новое событие"}</h4>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Название события</label>
          <input type="text" value={eventName} onChange={(e) => setEventName(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-gray-700 placeholder-gray-400 focus:outline-none focus:border-caramel focus:ring-1 focus:ring-caramel transition-colors"
            placeholder="Например: Свадьба, Рождение ребёнка" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Дата начала</label>
            <input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-gray-700 focus:outline-none focus:border-caramel focus:ring-1 focus:ring-caramel transition-colors" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Дата окончания <span className="text-gray-400 font-normal">(необязательно)</span></label>
            <input type="date" value={eventEndDate} onChange={(e) => setEventEndDate(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-gray-700 focus:outline-none focus:border-caramel focus:ring-1 focus:ring-caramel transition-colors" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Описание</label>
          <input type="text" value={eventDescription} onChange={(e) => setEventDescription(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-gray-700 placeholder-gray-400 focus:outline-none focus:border-caramel focus:ring-1 focus:ring-caramel transition-colors"
            placeholder="Подробности события" required />
        </div>

        {/* Люди в событии */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Люди в событии</label>
          <div ref={searchRef} className="relative">
            <div className="flex items-center bg-white border border-gray-200 rounded-lg px-3 py-2 focus-within:border-caramel focus-within:ring-1 focus-within:ring-caramel transition-colors">
              <FiSearch className="w-4 h-4 text-gray-400 mr-2 shrink-0" />
              <input type="text" value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setShowSearch(true); }}
                onFocus={() => setShowSearch(true)}
                className="flex-1 text-sm text-gray-700 placeholder-gray-400 focus:outline-none"
                placeholder="Поиск по имени, фамилии или ID..." />
            </div>
            {showSearch && searchResults.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {searchResults.map(u => (
                  <button key={u.humanId} type="button"
                    onClick={() => addParticipant(u)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left">
                    <FiUser className="w-4 h-4 text-gray-400 shrink-0" />
                    <span className="truncate">{u.name}</span>
                    <span className="text-xs text-gray-400 ml-auto shrink-0">ID: {u.humanId}</span>
                  </button>
                ))}
              </div>
            )}
            {showSearch && searchQuery.length > 0 && searchResults.length === 0 && !searchLoading && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-sm text-gray-500">
                Ничего не найдено
              </div>
            )}
          </div>
          {participants.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {participants.map(p => (
                <span key={p.humanId} className="inline-flex items-center gap-1 bg-white border border-gray-200 text-gray-700 text-xs px-2 py-1 rounded-lg">
                  {p.name}
                  <button type="button" onClick={() => removeParticipant(p.humanId)} className="text-gray-400 hover:text-gray-600">
                    <FiX className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Вложение файлов */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Вложения</label>
          <div
            onClick={() => fileInputRef.current?.click()}
            className="w-full border-2 border-dashed border-gray-300 rounded-lg px-4 py-4 text-center cursor-pointer hover:border-caramel hover:bg-gray-100 transition-colors"
          >
            <FiPaperclip className="w-5 h-5 text-gray-400 mx-auto mb-1" />
            <p className="text-sm text-gray-500">Нажмите или перетащите файлы</p>
            <p className="text-xs text-gray-400">Фото, видео, документы</p>
          </div>
          <input ref={fileInputRef} type="file" multiple className="hidden"
            accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.txt" onChange={handleFilesChange} />
          {files.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {files.map((f, i) => (
                <span key={i} className="inline-flex items-center gap-1 bg-white border border-gray-200 text-gray-700 text-xs px-2 py-1 rounded-lg">
                  {f.name}
                  <button type="button" onClick={() => removeFile(i)} className="text-gray-400 hover:text-gray-600">
                    <FiX className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button type="submit" className="bg-caramel text-white px-5 py-2 rounded-lg hover:bg-caramel/90 transition-colors text-sm font-medium">
            {isEditing ? "Сохранить" : "Добавить"}
          </button>
          <button type="button" onClick={onCancel} className="bg-white text-gray-600 px-5 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-sm">Отмена</button>
        </div>
      </form>
    </div>
  );
}
