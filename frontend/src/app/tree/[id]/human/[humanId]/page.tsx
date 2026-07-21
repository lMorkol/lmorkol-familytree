"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import api, { getApiBaseUrl } from "@/lib/api";
import { isAuthenticated } from "@/lib/auth";
import EventForm from "@/components/EventForm";
import RelationForm from "@/components/RelationForm";
import HumanForm from "@/components/HumanForm";
import AddressForm from "@/components/AddressForm";
import AddressMap from "@/components/AddressMap";
import { FiArrowLeft, FiEdit, FiTrash2, FiPlus, FiCamera, FiUpload, FiFileText, FiImage, FiMic, FiFolder, FiMapPin } from "react-icons/fi";
import { getRelationLabel } from "@/lib/relations";
import { geocodeAddress } from "@/lib/geocode";
import type { Human, Event, Relation, Media, Album, Document, HumanAddress } from "@/types";

const DOC_TYPES: Record<string, string> = {
  passport: "Паспорт",
  birth_certificate: "Свидетельство о рождении",
  marriage_certificate: "Свидетельство о браке",
  vehicle_rights: "Права на ТС",
};

type MainTab = "relations" | "events" | "documents" | "media" | "voice";

export default function HumanPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const treeId = Number(params.id);
  const humanId = Number(params.humanId);
  const fromSchema = searchParams.get("from") === "schema";

  const [human, setHuman] = useState<Human | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [relations, setRelations] = useState<Relation[]>([]);
  const [mediaItems, setMediaItems] = useState<Media[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [addresses, setAddresses] = useState<HumanAddress[]>([]);
  const [activeTab, setActiveTab] = useState<MainTab>("relations");
  const [showEventForm, setShowEventForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [showRelationForm, setShowRelationForm] = useState(false);
  const [editingRelation, setEditingRelation] = useState<Relation | null>(null);
  const [showDocForm, setShowDocForm] = useState(false);
  const [showAlbumForm, setShowAlbumForm] = useState(false);
  const [editing, setEditing] = useState(false);
  const [lightboxPhoto, setLightboxPhoto] = useState<string | null>(null);
  const [docLightbox, setDocLightbox] = useState<{ images: string[]; index: number } | null>(null);

  const [docForm, setDocForm] = useState({ docType: "passport", title: "", description: "" });
  const [albumName, setAlbumName] = useState("");
  const [selectedAlbum, setSelectedAlbum] = useState<number | null>(null);
  const [albumMedia, setAlbumMedia] = useState<Media[]>([]);
  const [voiceTitle, setVoiceTitle] = useState("");
  const [voiceDesc, setVoiceDesc] = useState("");
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<HumanAddress | null>(null);

  const API_URL = getApiBaseUrl();

  const fetchAll = async () => {
    const [hRes, eRes, rRes, mRes, aRes, dRes, addrRes] = await Promise.all([
      api.get(`/v1/humans/${humanId}`),
      api.get(`/v1/humans/${humanId}/events`),
      api.get(`/v1/humans/${humanId}/relations`),
      api.get(`/v1/humans/${humanId}/media`),
      api.get(`/v1/humans/${humanId}/albums`),
      api.get(`/v1/humans/${humanId}/documents`),
      api.get(`/v1/humans/${humanId}/addresses`),
    ]);
    setHuman(hRes.data.data);
    setEvents(eRes.data.data.items);
    setRelations(rRes.data.data.items);
    setMediaItems(mRes.data.data.items);
    setAlbums(aRes.data.data.items);
    setDocuments(dRes.data.data.items);
    setAddresses(addrRes.data.data);
  };

  useEffect(() => {
    if (!isAuthenticated()) { router.push("/login"); return; }
    fetchAll();
  }, [humanId]);

  const handleDelete = async () => {
    if (!confirm("Удалить этого человека?")) return;
    await api.delete(`/v1/humans/${humanId}`);
    router.push(fromSchema ? `/tree/${treeId}/schema` : `/tree/${treeId}`);
  };

  const handleEdit = async (data: any) => {
    await api.patch(`/v1/humans/${humanId}`, data);
    setEditing(false);
    fetchAll();
  };

  const handleAddEvent = async (data: any, files?: File[]) => {
    const res = await api.post(`/v1/humans/${humanId}/events`, data);
    const eventId = res.data.data.eventId;
    if (files && files.length > 0) {
      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);
        await api.post(`/v1/events/${eventId}/media`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }
    }
    setShowEventForm(false);
    fetchAll();
  };

  const handleAddRelation = async (data: any) => {
    await api.post(`/v1/humans/${humanId}/relations`, data);
    setShowRelationForm(false);
    fetchAll();
  };

  const handleEditRelation = async (data: any) => {
    if (!editingRelation) return;
    await api.patch(`/v1/relations/${editingRelation.id}`, {
      relationType: data.relationType,
      startDate: data.startDate || null,
      endDate: data.endDate || null,
    });
    setEditingRelation(null);
    setShowRelationForm(false);
    fetchAll();
  };

  const handleDeleteEvent = async (eventId: number) => {
    if (!confirm("Удалить событие?")) return;
    try {
      await api.delete(`/v1/events/${eventId}`);
      setEvents(events.filter(e => e.eventId !== eventId));
    } catch {}
  };

  const handleEditEvent = async (data: any, files?: File[]) => {
    if (!editingEvent) return;
    await api.patch(`/v1/events/${editingEvent.eventId}`, {
      eventDate: data.eventDate,
      eventEndDate: data.eventEndDate,
      eventDescription: data.eventDescription,
      name: data.name,
      participants: data.participants,
    });
    if (files && files.length > 0) {
      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);
        await api.post(`/v1/events/${editingEvent.eventId}/media`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }
    }
    setEditingEvent(null);
    setShowEventForm(false);
    fetchAll();
  };

  const handleDeleteRelation = async (relationId: number) => {
    if (!confirm("Удалить связь?")) return;
    await api.delete(`/v1/relations/${relationId}`);
    fetchAll();
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    await api.post(`/v1/humans/${humanId}/photo`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    fetchAll();
  };

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    await api.post(`/v1/humans/${humanId}/media`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    fetchAll();
  };

  const handleVoiceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    if (voiceTitle) formData.append("title", voiceTitle);
    if (voiceDesc) formData.append("description", voiceDesc);
    await api.post(`/v1/humans/${humanId}/media`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    setVoiceTitle("");
    setVoiceDesc("");
    fetchAll();
  };

  const handleDeleteMedia = async (mediaId: number) => {
    if (!confirm("Удалить файл?")) return;
    try {
      await api.delete(`/v1/media/${mediaId}`);
      setMediaItems(mediaItems.filter(m => m.id !== mediaId));
    } catch {}
  };

  const handleCreateDoc = async () => {
    await api.post(`/v1/humans/${humanId}/documents`, docForm);
    setShowDocForm(false);
    setDocForm({ docType: "passport", title: "", description: "" });
    fetchAll();
  };

  const handleDeleteDoc = async (docId: number) => {
    if (!confirm("Удалить документ?")) return;
    await api.delete(`/v1/documents/${docId}`);
    fetchAll();
  };

  const handleDocMediaUpload = async (docId: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const inputFiles = e.target.files;
    if (!inputFiles || inputFiles.length === 0) return;

    const readFile = (file: File): Promise<ArrayBuffer> =>
      new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as ArrayBuffer);
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
      });

    // Читаем каждый файл через FileReader — garantantly берёт данные из файла
    const fileData: { name: string; type: string; buf: ArrayBuffer }[] = [];
    for (let i = 0; i < inputFiles.length; i++) {
      const f = inputFiles[i];
      fileData.push({ name: f.name, type: f.type, buf: await readFile(f) });
    }
    e.target.value = "";

    for (const fd of fileData) {
      try {
        const formData = new FormData();
        formData.append("file", new Blob([fd.buf], { type: fd.type }), fd.name);
        await api.post(`/v1/documents/${docId}/media`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } catch (err) {
        console.error("Ошибка загрузки файла:", fd.name, err);
      }
    }
    await fetchAll();
  };

  const handleDeleteDocMedia = async (mediaId: number) => {
    if (!confirm("Удалить изображение?")) return;
    await api.delete(`/v1/documents/media/${mediaId}`);
    fetchAll();
  };

  const handleCreateAlbum = async () => {
    if (!albumName.trim()) return;
    await api.post(`/v1/humans/${humanId}/albums`, { name: albumName.trim() });
    setAlbumName("");
    setShowAlbumForm(false);
    fetchAll();
  };

  const handleDeleteAlbum = async (albumId: number) => {
    if (!confirm("Удалить альбом?")) return;
    await api.delete(`/v1/albums/${albumId}`);
    if (selectedAlbum === albumId) setSelectedAlbum(null);
    fetchAll();
  };

  const handleOpenAlbum = async (albumId: number) => {
    setSelectedAlbum(albumId);
    const res = await api.get(`/v1/albums/${albumId}/media`);
    setAlbumMedia(res.data.data.items);
  };

  const handleAddToAlbum = async (albumId: number, mediaId: number) => {
    await api.post(`/v1/albums/${albumId}/media`, { mediaId });
    handleOpenAlbum(albumId);
  };

  const handleRemoveFromAlbum = async (albumId: number, mediaId: number) => {
    await api.delete(`/v1/albums/${albumId}/media/${mediaId}`);
    handleOpenAlbum(albumId);
  };

  const handleAddAddress = async (data: any) => {
    const res = await api.post(`/v1/humans/${humanId}/addresses`, data);
    const addressId = res.data.data.id;
    const coords = await geocodeAddress(data.street, data.house, data.city, data.country);
    if (coords) {
      await api.patch(`/v1/addresses/${addressId}`, coords);
    }
    setShowAddressForm(false);
    fetchAll();
  };

  const handleEditAddress = async (data: any) => {
    if (!editingAddress) return;
    await api.patch(`/v1/addresses/${editingAddress.id}`, data);
    const coords = await geocodeAddress(data.street, data.house, data.city, data.country);
    if (coords) {
      await api.patch(`/v1/addresses/${editingAddress.id}`, coords);
    }
    setEditingAddress(null);
    setShowAddressForm(false);
    fetchAll();
  };

  const handleDeleteAddress = async (addressId: number) => {
    if (!confirm("Удалить адрес?")) return;
    await api.delete(`/v1/addresses/${addressId}`);
    fetchAll();
  };

  const handleGeocodeAddress = async (addr: HumanAddress) => {
    const coords = await geocodeAddress(addr.street, addr.house, addr.city, addr.country);
    if (coords) {
      await api.patch(`/v1/addresses/${addr.id}`, coords);
      fetchAll();
    }
  };

  const tabs: { key: MainTab; label: string; icon: any }[] = [
    { key: "relations", label: "Основное", icon: FiEdit },
    { key: "events", label: "События", icon: FiFileText },
    { key: "documents", label: "Документы", icon: FiFileText },
    { key: "media", label: "Медиа", icon: FiImage },
    { key: "voice", label: "Голосовые", icon: FiMic },
  ];

  if (!human) return <div className="py-10 text-center text-gray-500">Загрузка...</div>;

  return (
    <div>
      <button
        onClick={() => router.push(fromSchema ? `/tree/${treeId}/schema` : `/tree/${treeId}`)}
        className="flex items-center gap-2 text-caramel hover:text-caramel/80 mb-6 transition-colors"
      >
        <FiArrowLeft className="w-5 h-5" />
        {fromSchema ? "Назад к семейному древу" : "Назад к списку"}
      </button>

      {/* Profile Card */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="flex flex-col sm:flex-row items-start gap-6">
          <div className="shrink-0">
            {human.photo ? (
              <img
                src={`${API_URL}/uploads/${human.photo}`}
                alt={[human.secondName, human.firstName].filter(Boolean).join(" ")}
                className="w-36 h-36 rounded-lg object-cover cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setLightboxPhoto(human.photo ?? null)}
              />
            ) : (
              <div className="w-36 h-36 rounded-lg bg-gray-100 flex items-center justify-center text-4xl text-gray-500">
                {[human.secondName, human.firstName].filter(Boolean).map(n => n![0]).join("").slice(0, 2) || "?"}
              </div>
            )}
            <label className="block mt-3 text-xs text-center">
              <span className="flex items-center justify-center gap-1 text-caramel hover:text-caramel/80 cursor-pointer transition-colors">
                <FiCamera className="w-4 h-4" />
                Загрузить фото
              </span>
              <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
            </label>
          </div>

          <div className="flex-1">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  {[human.secondName, human.firstName, human.patronymic].filter(Boolean).join(" ")}
                </h2>
                <span className="text-sm text-gray-500">ID: {human.humanId}</span>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setEditing(true)}
                  className="flex items-center gap-2 text-sm bg-gray-50 text-gray-700 px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                >
                  <FiEdit className="w-4 h-4" />
                  Редактировать
                </button>
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-2 text-sm bg-red-50 text-red-600 px-4 py-2 rounded-lg border border-red-200 hover:bg-red-100 transition-colors"
                >
                  <FiTrash2 className="w-4 h-4" />
                  Удалить
                </button>
              </div>
            </div>

            {editing ? (
              <HumanForm initial={human} onSubmit={handleEdit} onCancel={() => setEditing(false)} />
            ) : (
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-500">
                <div><span className="font-medium text-gray-700">Пол:</span> {human.gender === "male" ? "Мужской" : "Женский"}</div>
                {human.birthDate && <div><span className="font-medium text-gray-700">Дата рождения:</span> {new Date(human.birthDate).toLocaleDateString("ru-RU")}</div>}
                {human.deathDate && <div><span className="font-medium text-gray-700">Дата смерти:</span> {new Date(human.deathDate).toLocaleDateString("ru-RU")}</div>}
                {human.placeOfBirth && <div><span className="font-medium text-gray-700">Место рождения:</span> {human.placeOfBirth}</div>}
                {human.country && <div><span className="font-medium text-gray-700">Страна:</span> {human.country}</div>}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg border border-gray-200 mb-6">
        <div className="flex border-b border-gray-200 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.key
                  ? "border-caramel text-caramel"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* === Вкладка: Связи === */}
          {activeTab === "relations" && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-lg text-gray-800">Связи</h3>
                <button
                  onClick={() => setShowRelationForm(!showRelationForm)}
                  className="flex items-center gap-2 text-sm bg-gray-50 text-caramel px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                >
                  <FiPlus className="w-4 h-4" />
                  Связь
                </button>
              </div>
              {showRelationForm && !editingRelation && (
                <RelationForm treeId={treeId} onSubmit={handleAddRelation} onCancel={() => setShowRelationForm(false)} />
              )}
              {editingRelation && (
                <RelationForm treeId={treeId} initial={editingRelation} onSubmit={handleEditRelation} onCancel={() => { setEditingRelation(null); setShowRelationForm(false); }} />
              )}

              {relations.length === 0 ? (
                <p className="text-gray-500 text-sm">Нет связей</p>
              ) : (
                <>
                  {/* --- Браки --- */}
                  {relations.some(r => r.relationType === "spouse" || r.relationType === "ex_spouse") && (
                    <div className="mb-6">
                      <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Браки</h4>
                      <div className="space-y-2">
                        {relations.filter(r => r.relationType === "spouse" || r.relationType === "ex_spouse").map(r => (
                          <div key={r.id} className="bg-gray-50 px-4 py-3 rounded-lg border border-gray-200 text-sm">
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="font-medium text-gray-700">
                                  {getRelationLabel(r.relationType, human.gender, r.relatedGender || "")}
                                </span>
                                <span className="text-gray-500"> — </span>
                                <button
                                  onClick={() => router.push(`/tree/${treeId}/human/${r.toHumanId}`)}
                                  className="text-caramel hover:text-caramel/80 hover:underline transition-colors"
                                >
                                  {r.relatedName || `человек #${r.toHumanId}`}
                                </button>
                              </div>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => { setEditingRelation(r); setShowRelationForm(true); }}
                                  className="text-gray-500 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-100 transition-colors"
                                  title="Редактировать даты"
                                >
                                  <FiEdit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteRelation(r.id)}
                                  className="text-gray-500 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-100 transition-colors"
                                >
                                  <FiTrash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                            {(r.startDate || r.endDate) ? (
                              <div className="mt-1 text-xs text-gray-500">
                                {r.startDate && <span>Заключение брака: {new Date(r.startDate).toLocaleDateString("ru-RU")}</span>}
                                {r.startDate && r.endDate && <span className="mx-1">|</span>}
                                {r.endDate && <span>Развод: {new Date(r.endDate).toLocaleDateString("ru-RU")}</span>}
                              </div>
                            ) : (
                              <div className="mt-1 text-xs text-gray-400 italic">Даты не указаны — нажмите для редактирования</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* --- Родственные связи --- */}
                  {relations.some(r => r.relationType !== "spouse" && r.relationType !== "ex_spouse") && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Родственные связи</h4>
                      <div className="space-y-2">
                        {relations.filter(r => r.relationType !== "spouse" && r.relationType !== "ex_spouse").map(r => (
                          <div key={r.id} className="flex items-center justify-between bg-gray-50 px-4 py-3 rounded-lg border border-gray-200 text-sm">
                            <span className="text-gray-700">
                              <span className="font-medium">{getRelationLabel(r.relationType, human.gender, r.relatedGender || "")}</span>
                              {" — "}
                              <button
                                onClick={() => router.push(`/tree/${treeId}/human/${r.toHumanId}`)}
                                className="text-caramel hover:text-caramel/80 hover:underline transition-colors"
                              >
                                {r.relatedName || `человек #${r.toHumanId}`}
                              </button>
                            </span>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => { setEditingRelation(r); setShowRelationForm(true); }}
                                className="text-gray-500 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-100 transition-colors"
                                title="Редактировать"
                              >
                                <FiEdit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteRelation(r.id)}
                                className="text-gray-500 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-100 transition-colors"
                              >
                                <FiTrash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* --- Адреса --- */}
              <div className="mt-8">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-lg text-gray-800">Адреса</h3>
                  <button
                    onClick={() => { setShowAddressForm(!showAddressForm); setEditingAddress(null); }}
                    className="flex items-center gap-2 text-sm bg-gray-50 text-caramel px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                  >
                    <FiPlus className="w-4 h-4" />
                    Добавить адрес
                  </button>
                </div>

                {showAddressForm && !editingAddress && (
                  <AddressForm onSubmit={handleAddAddress} onCancel={() => setShowAddressForm(false)} />
                )}
                {editingAddress && (
                  <AddressForm initial={editingAddress} onSubmit={handleEditAddress} onCancel={() => { setEditingAddress(null); setShowAddressForm(false); }} />
                )}

                {addresses.length === 0 ? (
                  <p className="text-gray-500 text-sm">Нет адресов</p>
                ) : (
                  <>
                    {/* Combined map */}
                    <div className="mb-4">
                      <AddressMap addresses={addresses} />
                    </div>

                    {/* Address list */}
                    <div className="space-y-3">
                      {addresses.map(addr => (
                        <div key={addr.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                          <div className="flex items-start justify-between">
                            <div className="text-sm">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-700">
                                  {[addr.city, addr.country].filter(Boolean).join(", ") || "Адрес не указан"}
                                </span>
                                {addr.addressType && (
                                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 text-gray-600">
                                    {addr.addressType}
                                  </span>
                                )}
                              </div>
                              {addr.street && (
                                <div className="text-gray-500 mt-1">{addr.street}</div>
                              )}
                              {(addr.house || addr.apartment) && (
                                <div className="text-gray-500 mt-1">
                                  {[addr.house, addr.apartment && `кв. ${addr.apartment}`].filter(Boolean).join(", ")}
                                </div>
                              )}
                              {(addr.periodStart || addr.periodEnd) && (
                                <div className="text-xs text-gray-400 mt-1">
                                  {addr.periodStart && new Date(addr.periodStart).toLocaleDateString("ru-RU")}
                                  {addr.periodStart && addr.periodEnd && " — "}
                                  {addr.periodEnd && new Date(addr.periodEnd).toLocaleDateString("ru-RU")}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              {(!addr.lat || !addr.lng) && (
                                <button
                                  onClick={() => handleGeocodeAddress(addr)}
                                  className="text-caramel hover:text-caramel/80 p-1 rounded-lg hover:bg-gray-100 transition-colors"
                                  title="Показать на карте"
                                >
                                  <FiMapPin className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => { setEditingAddress(addr); setShowAddressForm(true); }}
                                className="text-gray-500 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-100 transition-colors"
                                title="Редактировать"
                              >
                                <FiEdit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteAddress(addr.id)}
                                className="text-gray-500 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-100 transition-colors"
                                title="Удалить"
                              >
                                <FiTrash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* === Вкладка: События === */}
          {activeTab === "events" && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-lg text-gray-800">События</h3>
                <button
                  onClick={() => setShowEventForm(!showEventForm)}
                  className="flex items-center gap-2 text-sm bg-gray-50 text-caramel px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                >
                  <FiPlus className="w-4 h-4" />
                  Событие
                </button>
              </div>
              {showEventForm && !editingEvent && (
                <EventForm treeId={treeId} currentHumanId={humanId} onSubmit={handleAddEvent} onCancel={() => setShowEventForm(false)} />
              )}
              {editingEvent && (
                <EventForm
                  treeId={treeId}
                  currentHumanId={humanId}
                  initial={editingEvent}
                  onSubmit={handleEditEvent}
                  onCancel={() => { setEditingEvent(null); setShowEventForm(false); }}
                />
              )}
              {events.length === 0 ? (
                <p className="text-gray-500 text-sm">Нет событий</p>
              ) : (
                <div className="space-y-3">
                  {[...events].sort((a, b) => (b.eventDate || "").localeCompare(a.eventDate || "")).map(e => (
                    <div key={e.eventId} className="bg-gray-50 px-4 py-3 rounded-lg border border-gray-200 text-sm">
                      <div className="flex items-center justify-between">
                        <div className="text-gray-700">
                          <span className="font-medium">{e.name || e.eventDescription}</span>
                          <span className="text-gray-400 ml-2">
                            {new Date(e.eventDate).toLocaleDateString("ru-RU")}
                            {e.eventEndDate && ` — ${new Date(e.eventEndDate).toLocaleDateString("ru-RU")}`}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0 ml-2">
                          <button
                            onClick={() => { setEditingEvent(e); setShowEventForm(true); }}
                            className="text-gray-500 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-100 transition-colors"
                            title="Редактировать"
                          >
                            <FiEdit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteEvent(e.eventId)}
                            className="text-gray-500 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      {e.name && e.name !== e.eventDescription && (
                        <p className="text-gray-500 mt-1">{e.eventDescription}</p>
                      )}
                      {e.participants && e.participants.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {e.participants.map(p => (
                            <span key={p.humanId} className="text-xs bg-white border border-gray-200 text-gray-600 px-2 py-0.5 rounded">
                              {p.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* === Вкладка: Документы === */}
          {activeTab === "documents" && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-lg text-gray-800">Документы</h3>
                <button
                  onClick={() => setShowDocForm(!showDocForm)}
                  className="flex items-center gap-2 text-sm bg-gray-50 text-caramel px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                >
                  <FiPlus className="w-4 h-4" />
                  Документ
                </button>
              </div>
              {showDocForm && (
                <div className="bg-gray-50 p-5 rounded-lg border border-gray-200 mb-4 space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Тип</label>
                    <select value={docForm.docType} onChange={e => setDocForm({ ...docForm, docType: e.target.value })}
                      className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-caramel">
                      {Object.entries(DOC_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Название</label>
                    <input type="text" value={docForm.title} onChange={e => setDocForm({ ...docForm, title: e.target.value })}
                      className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-caramel" placeholder="Например: Паспорт РФ" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Описание</label>
                    <input type="text" value={docForm.description} onChange={e => setDocForm({ ...docForm, description: e.target.value })}
                      className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-caramel" placeholder="Необязательно" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleCreateDoc} className="bg-caramel text-white px-4 py-2 rounded-lg text-sm hover:bg-caramel/90 transition-colors">Добавить</button>
                    <button onClick={() => setShowDocForm(false)} className="text-gray-500 px-4 py-2 text-sm hover:text-gray-700">Отмена</button>
                  </div>
                </div>
              )}
              {documents.length === 0 ? (
                <p className="text-gray-500 text-sm">Нет документов</p>
              ) : (
                <div className="space-y-4">
                  {documents.map(d => (
                    <div key={d.id} className="bg-gray-50 px-4 py-3 rounded-lg border border-gray-200 text-sm">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="inline-block bg-gray-200 text-gray-600 text-xs px-2 py-0.5 rounded mb-1">{DOC_TYPES[d.docType] || d.docType}</span>
                          <p className="font-medium text-gray-700">{d.title}</p>
                          {d.description && <p className="text-gray-500 text-xs">{d.description}</p>}
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-3">
                          <label className="flex items-center gap-1 text-xs bg-white border border-gray-200 text-caramel px-2 py-1 rounded cursor-pointer hover:bg-gray-100 transition-colors">
                            <FiUpload className="w-3 h-3" />
                            Фото
                            <input type="file" accept="image/*" multiple className="hidden"
                              onChange={(e) => handleDocMediaUpload(d.id, e)} />
                          </label>
                          <button onClick={() => handleDeleteDoc(d.id)} className="text-gray-500 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-100 transition-colors">
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      {d.media && d.media.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {d.media.map((m, idx) => (
                            <div key={m.id} className="relative group cursor-pointer"
                              onClick={() => setDocLightbox({ images: d.media!.map(mi => mi.filePath), index: idx })}>
                              <img src={`${API_URL}/uploads/${m.filePath}`} alt={m.originalFilename}
                                className="w-20 h-20 object-cover rounded border border-gray-200" />
                              <button onClick={(e) => { e.stopPropagation(); handleDeleteDocMedia(m.id); }}
                                className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">&times;</button>
                            </div>
                          ))}
                          {d.media.length < 40 && (
                            <label className="w-20 h-20 flex items-center justify-center border-2 border-dashed border-gray-300 rounded cursor-pointer hover:border-caramel transition-colors">
                              <FiPlus className="w-4 h-4 text-gray-400" />
                              <input type="file" accept="image/*" multiple className="hidden"
                                onChange={(e) => handleDocMediaUpload(d.id, e)} />
                            </label>
                          )}
                          <span className="text-xs text-gray-400 self-center">{d.media.length}/40</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* === Вкладка: Медиа / Альбомы === */}
          {activeTab === "media" && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-lg text-gray-800">Альбомы</h3>
                <div className="flex gap-2">
                  <label className="flex items-center gap-2 text-sm bg-gray-50 text-caramel px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-100 cursor-pointer transition-colors">
                    <FiUpload className="w-4 h-4" />
                    Загрузить
                    <input type="file" className="hidden" onChange={handleMediaUpload}
                      accept="image/*,video/*" />
                  </label>
                  <button
                    onClick={() => setShowAlbumForm(!showAlbumForm)}
                    className="flex items-center gap-2 text-sm bg-gray-50 text-caramel px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                  >
                    <FiPlus className="w-4 h-4" />
                    Альбом
                  </button>
                </div>
              </div>
              {showAlbumForm && (
                <div className="flex gap-2 mb-4">
                  <input type="text" value={albumName} onChange={e => setAlbumName(e.target.value)}
                    className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-caramel" placeholder="Название альбома" />
                  <button onClick={handleCreateAlbum} className="bg-caramel text-white px-4 py-2 rounded-lg text-sm hover:bg-caramel/90 transition-colors">Создать</button>
                </div>
              )}

              {selectedAlbum !== null ? (
                <div>
                  <button onClick={() => setSelectedAlbum(null)} className="text-sm text-caramel hover:text-caramel/80 mb-3">&larr; Назад к альбомам</button>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {albumMedia.map(m => (
                      <div key={m.id} className="relative group">
                        <img src={`${API_URL}/uploads/${m.filePath}`} alt={m.originalFilename} className="w-full h-28 object-cover rounded-lg" />
                        <button onClick={() => handleRemoveFromAlbum(selectedAlbum, m.id)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity">&times;</button>
                      </div>
                    ))}
                    {albumMedia.length === 0 && <p className="text-gray-500 text-sm col-span-full">Альбом пуст</p>}
                  </div>
                  {mediaItems.filter(m => !albumMedia.some(am => am.id === m.id) && (m.fileType === "photo" || m.fileType === "video")).length > 0 && (
                    <div className="mt-4">
                      <p className="text-xs text-gray-500 mb-2">Добавить в альбом:</p>
                      <div className="flex flex-wrap gap-2">
                        {mediaItems.filter(m => !albumMedia.some(am => am.id === m.id) && (m.fileType === "photo" || m.fileType === "video")).map(m => (
                          <button key={m.id} onClick={() => handleAddToAlbum(selectedAlbum, m.id)}
                            className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded transition-colors">{m.originalFilename}</button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {albums.map(a => (
                    <div key={a.id} onClick={() => handleOpenAlbum(a.id)}
                      className="flex items-center justify-between bg-gray-50 px-4 py-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <FiFolder className="w-5 h-5 text-caramel" />
                        <div>
                          <p className="font-medium text-gray-700">{a.name}</p>
                          <p className="text-xs text-gray-500">{a.mediaCount} файлов</p>
                        </div>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); handleDeleteAlbum(a.id); }}
                        className="text-gray-500 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-200 transition-colors">
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {albums.length === 0 && <p className="text-gray-500 text-sm">Нет альбомов</p>}

                  {/* Несортированные файлы */}
                  {mediaItems.filter(m => !albums.some(a => true) || m.fileType === "photo" || m.fileType === "video").length > 0 && (
                    <div className="mt-6 pt-4 border-t border-gray-200">
                      <p className="text-sm font-medium text-gray-700 mb-3">Все файлы</p>
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                        {mediaItems.filter(m => m.fileType === "photo" || m.fileType === "video").map(m => (
                          <div key={m.id} className="relative group cursor-pointer" onClick={() => m.fileType === "photo" && setLightboxPhoto(m.filePath)}>
                            {m.fileType === "photo" ? (
                              <img src={`${API_URL}/uploads/${m.filePath}`} alt="" className="w-full h-20 object-cover rounded" />
                            ) : (
                              <div className="w-full h-20 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">Видео</div>
                            )}
                            <button onClick={(e) => { e.stopPropagation(); handleDeleteMedia(m.id); }}
                              className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">&times;</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* === Вкладка: Голосовые === */}
          {activeTab === "voice" && (
            <div>
              <div className="mb-4">
                <h3 className="font-semibold text-lg text-gray-800 mb-4">Голосовые записи</h3>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Название (необязательно)</label>
                    <input type="text" value={voiceTitle} onChange={e => setVoiceTitle(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-caramel" placeholder="Название записи" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Описание (необязательно)</label>
                    <input type="text" value={voiceDesc} onChange={e => setVoiceDesc(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-caramel" placeholder="Краткое описание" />
                  </div>
                  <label className="flex items-center justify-center gap-2 w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 hover:border-caramel cursor-pointer transition-colors">
                    <FiUpload className="w-4 h-4 text-caramel" />
                    Выбрать аудиофайл
                    <input type="file" accept="audio/*" className="hidden" onChange={handleVoiceUpload} />
                  </label>
                </div>
              </div>
              {mediaItems.filter(m => m.fileType === "audio").length === 0 ? (
                <p className="text-gray-500 text-sm">Нет голосовых записей</p>
              ) : (
                <div className="space-y-3">
                  {mediaItems.filter(m => m.fileType === "audio").map(m => (
                    <div key={m.id} className="bg-gray-50 px-4 py-3 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-medium text-gray-700 text-sm">{m.title || m.originalFilename}</p>
                          {m.description && <p className="text-xs text-gray-500">{m.description}</p>}
                        </div>
                        <button onClick={() => handleDeleteMedia(m.id)} className="text-gray-500 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-100 transition-colors">
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <audio src={`${API_URL}/uploads/${m.filePath}`} controls className="w-full" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxPhoto && (() => {
        const photos = mediaItems.filter(m => m.fileType === "photo");
        const currentIndex = photos.findIndex(m => m.filePath === lightboxPhoto);
        const go = (dir: number) => {
          const next = currentIndex + dir;
          if (next >= 0 && next < photos.length) setLightboxPhoto(photos[next].filePath);
        };
        return (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={() => setLightboxPhoto(null)}>
            <button onClick={() => setLightboxPhoto(null)} className="absolute top-4 right-4 text-white text-3xl hover:text-gray-300 transition-colors">&times;</button>
            {currentIndex > 0 && (
              <button onClick={(e) => { e.stopPropagation(); go(-1); }} className="absolute left-4 text-white text-4xl hover:text-gray-300 transition-colors">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
            )}
            <img
              src={`${API_URL}/uploads/${lightboxPhoto}`}
              alt=""
              className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
            {currentIndex < photos.length - 1 && (
              <button onClick={(e) => { e.stopPropagation(); go(1); }} className="absolute right-4 text-white text-4xl hover:text-gray-300 transition-colors">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
            )}
            <div className="absolute bottom-4 text-white text-sm">{currentIndex + 1} / {photos.length}</div>
          </div>
        );
      })()}

      {/* Doc Lightbox — перелистывание с зацикливанием */}
      {docLightbox && (() => {
        const { images, index } = docLightbox;
        const go = (dir: number) => {
          const next = (index + dir + images.length) % images.length;
          setDocLightbox({ images, index: next });
        };
        return (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={() => setDocLightbox(null)}>
            <button onClick={() => setDocLightbox(null)} className="absolute top-4 right-4 text-white text-3xl hover:text-gray-300 transition-colors">&times;</button>
            <button onClick={(e) => { e.stopPropagation(); go(-1); }} className="absolute left-4 text-white text-4xl hover:text-gray-300 transition-colors">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <img
              src={`${API_URL}/uploads/${images[index]}`}
              alt=""
              className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
            <button onClick={(e) => { e.stopPropagation(); go(1); }} className="absolute right-4 text-white text-4xl hover:text-gray-300 transition-colors">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
            <div className="absolute bottom-4 text-white text-sm">{index + 1} / {images.length}</div>
          </div>
        );
      })()}
    </div>
  );
}
