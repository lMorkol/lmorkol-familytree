"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import api, { getApiBaseUrl } from "@/lib/api";
import { isAuthenticated } from "@/lib/auth";
import HumanPreview from "@/components/HumanPreview";
import Modal from "@/components/ui/Modal";
import { FiArrowLeft, FiPlus, FiChevronRight, FiChevronDown, FiFilter, FiX } from "react-icons/fi";
import AutocompleteInput from "@/components/ui/AutocompleteInput";
import type { HumanBrief, TreeInfoResponse } from "@/types";

export default function TreePage() {
  const router = useRouter();
  const params = useParams();
  const treeId = Number(params.id);
  const [tree, setTree] = useState<TreeInfoResponse | null>(null);
  const [humans, setHumans] = useState<HumanBrief[]>([]);
  const [showGenderModal, setShowGenderModal] = useState(false);
  const [selectedHuman, setSelectedHuman] = useState<number | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingTree, setEditingTree] = useState(false);
  const [treeName, setTreeName] = useState("");
  const [myHumanId, setMyHumanId] = useState<number | null>(null);
  const [myHuman, setMyHuman] = useState<HumanBrief | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [secondName, setSecondName] = useState("");
  const [filterGender, setFilterGender] = useState("");
  const [filterBirthplace, setFilterBirthplace] = useState<string[]>([]);
  const [filterCountry, setFilterCountry] = useState<string[]>([]);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [showMyHuman, setShowMyHuman] = useState(false);
  const [filterCities, setFilterCities] = useState<string[]>([]);
  const [filterCountries, setFilterCountries] = useState<string[]>([]);

  const fetchTree = useCallback(async () => {
    try {
      const params: Record<string, string> = {};
      if (firstName) params.first_name = firstName;
      if (secondName) params.second_name = secondName;
      if (filterGender) params.gender = filterGender;
      if (filterBirthplace.length > 0) params.place_of_birth = filterBirthplace.join(",");
      if (filterCountry.length > 0) params.country = filterCountry.join(",");
      params.limit = String(pageSize);
      params.offset = String((currentPage - 1) * pageSize);

      const qs = new URLSearchParams(params).toString();
      const [treeRes, humansRes, userRes, filterRes] = await Promise.all([
        api.get(`/v1/trees/${treeId}`),
        api.get(`/v1/trees/${treeId}/humans${qs ? "?" + qs : ""}`),
        api.get("/v1/user/me"),
        api.get(`/v1/trees/${treeId}/filter-values`),
      ]);
      setTree(treeRes.data.data);
      setTreeName(treeRes.data.data.name);
      setHumans(humansRes.data.data.items);
      setTotalCount(humansRes.data.data.total);
      setFilterCities(filterRes.data.data.cities || []);
      setFilterCountries(filterRes.data.data.countries || []);
      const userTrees = userRes.data.data.trees || [];
      const currentTree = userTrees.find((t: any) => t.id === treeId);
      const newMyHumanId = currentTree?.humanId ?? null;
      setMyHumanId(newMyHumanId);
      if (newMyHumanId) {
        try {
          const myRes = await api.get(`/v1/humans/${newMyHumanId}`);
          setMyHuman({
            humanId: myRes.data.data.humanId,
            firstName: myRes.data.data.firstName,
            secondName: myRes.data.data.secondName,
            gender: myRes.data.data.gender,
            photo: myRes.data.data.photo,
          });
        } catch {
          setMyHuman(null);
        }
      } else {
        setMyHuman(null);
      }
      setLoading(false);
    } catch {
      router.push("/trees");
    }
  }, [treeId, firstName, secondName, filterGender, filterBirthplace, filterCountry, pageSize, currentPage]);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }
    fetchTree();
  }, [fetchTree]);

  useEffect(() => {
    setCurrentPage(1);
  }, [firstName, secondName, filterGender, filterBirthplace, filterCountry, pageSize]);

  useEffect(() => {
    const t = setTimeout(() => fetchTree(), 300);
    return () => clearTimeout(t);
  }, [firstName, secondName, filterGender, filterBirthplace, filterCountry, pageSize, currentPage]);

  const handleCreateHuman = async (gender: string) => {
    const res = await api.post("/v1/humans", { treeId, gender });
    const newId = res.data.data.humanId;
    setShowGenderModal(false);
    router.push(`/tree/${treeId}/human/${newId}`);
  };

  const handleRenameTree = async () => {
    if (!treeName.trim() || treeName === tree?.name) {
      setEditingTree(false);
      return;
    }
    await api.patch(`/v1/trees/${treeId}`, { name: treeName.trim() });
    setEditingTree(false);
    fetchTree();
  };

  const resetFilters = () => {
    setFirstName("");
    setSecondName("");
    setFilterGender("");
    setFilterBirthplace([]);
    setFilterCountry([]);
    setCurrentPage(1);
  };

  if (loading) return <div className="py-10 text-center text-gray-500">Загрузка...</div>;

  const filterPanel = (
    <div className="space-y-4">
      <div>
        <label className="block text-xs text-gray-500 mb-2">Имя</label>
        <input
          type="text"
          placeholder="Имя..."
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-caramel focus:ring-1 focus:ring-caramel transition-colors"
        />
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-2">Фамилия</label>
        <input
          type="text"
          placeholder="Фамилия..."
          value={secondName}
          onChange={(e) => setSecondName(e.target.value)}
          className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-caramel focus:ring-1 focus:ring-caramel transition-colors"
        />
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-2">Пол</label>
        <div className="relative">
          <select
            value={filterGender}
            onChange={(e) => setFilterGender(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-4 py-2 pr-8 text-sm !text-gray-700 appearance-none focus:outline-none focus:border-caramel focus:ring-1 focus:ring-caramel transition-colors"
            style={{ backgroundColor: "#ffffff" }}
          >
            <option value="">Все</option>
            <option value="male">Мужской</option>
            <option value="female">Женский</option>
          </select>
          <FiChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-2">Город рождения</label>
        <AutocompleteInput
          value={filterBirthplace}
          onChange={setFilterBirthplace}
          suggestions={filterCities}
          placeholder="Город..."
        />
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-2">Страна рождения</label>
        <AutocompleteInput
          value={filterCountry}
          onChange={setFilterCountry}
          suggestions={filterCountries}
          placeholder="Страна..."
        />
      </div>
      <button
        onClick={resetFilters}
        className="w-full text-sm text-gray-500 hover:text-gray-700 py-2 transition-colors"
      >
        Сбросить фильтры
      </button>
    </div>
  );

  return (
    <div>
      <button
        onClick={() => router.push("/trees")}
        className="flex items-center gap-2 text-caramel hover:text-caramel/80 mb-6 transition-colors"
      >
        <FiArrowLeft className="w-5 h-5" />
        Назад к деревьям
      </button>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        {editingTree ? (
          <div className="flex gap-2 items-center">
            <input
              type="text"
              value={treeName}
              onChange={(e) => setTreeName(e.target.value)}
              className="bg-white border border-gray-200 rounded-lg px-4 py-2 text-xl font-bold text-gray-700 focus:outline-none focus:border-caramel focus:ring-1 focus:ring-caramel transition-colors"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleRenameTree()}
            />
            <button
              onClick={handleRenameTree}
              className="bg-caramel text-white px-4 py-2 rounded-lg hover:bg-caramel/90 transition-colors"
            >
              OK
            </button>
            <button
              onClick={() => { setEditingTree(false); setTreeName(tree?.name || ""); }}
              className="text-gray-500 hover:text-gray-700 px-4 py-2 transition-colors"
            >
              Отмена
            </button>
          </div>
        ) : (
          <h2
            className="text-2xl font-bold text-gray-800 cursor-pointer hover:text-caramel transition-colors"
            onClick={() => setEditingTree(true)}
            title="Нажмите чтобы изменить название"
          >
            {tree?.name}
            <span className="text-sm text-gray-500 font-normal ml-2">(нажмите для редактирования)</span>
          </h2>
        )}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
          <button
            onClick={() => router.push(`/tree/${treeId}/schema`)}
            className="bg-caramel text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-caramel/90 transition-colors font-medium w-full sm:w-auto text-sm sm:text-base"
          >
            Семейное древо
          </button>
          <button
            onClick={() => setShowGenderModal(true)}
            className="flex items-center justify-center gap-2 bg-white text-gray-700 px-4 sm:px-6 py-2 sm:py-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors font-medium w-full sm:w-auto text-sm sm:text-base"
          >
            <FiPlus className="w-4 h-4 sm:w-5 sm:h-5" />
            Добавить человека
          </button>
        </div>
      </div>

      <Modal isOpen={showGenderModal} onClose={() => setShowGenderModal(false)} title="Новый человек">
        <p className="text-gray-600 mb-6">Выберите пол:</p>
        <div className="flex gap-4">
          <button
            onClick={() => handleCreateHuman("male")}
            className="flex-1 bg-gray-50 text-gray-700 px-6 py-4 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors font-medium"
          >
            Мужской
          </button>
          <button
            onClick={() => handleCreateHuman("female")}
            className="flex-1 bg-gray-50 text-gray-700 px-6 py-4 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors font-medium"
          >
            Женский
          </button>
        </div>
        <button
          onClick={() => setShowGenderModal(false)}
          className="w-full mt-4 text-sm text-gray-500 hover:text-gray-700 py-2 transition-colors"
        >
          Отмена
        </button>
      </Modal>

      {/* Mobile filter button */}
      <button
        onClick={() => setShowFilters(true)}
        className="lg:hidden flex items-center gap-2 bg-white text-gray-700 px-4 py-2 rounded-lg border border-gray-200 mb-4"
      >
        <FiFilter className="w-4 h-4" />
        Фильтры
      </button>

      {/* Mobile filter modal */}
      <Modal isOpen={showFilters} onClose={() => setShowFilters(false)} title="Фильтры">
        {filterPanel}
        <button
          onClick={() => setShowFilters(false)}
          className="w-full mt-4 bg-caramel text-white py-3 rounded-lg hover:bg-caramel/90 transition-colors font-medium"
        >
          Применить
        </button>
      </Modal>

      <div className="flex gap-8">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block w-64 shrink-0">
          <div className="bg-white p-6 rounded-lg border border-gray-200 sticky top-4">
            <h3 className="font-medium text-sm text-gray-700 mb-4 flex items-center gap-2">
              <FiFilter className="w-4 h-4 text-caramel" />
              Фильтры
            </h3>
            {filterPanel}
          </div>
        </aside>

        <main className="flex-1 min-w-0">
          {myHuman && (
            <div className="mb-6">
              <p className="text-xs text-caramel font-medium mb-3 uppercase tracking-wide">Вы в этом дереве</p>
              <div className="bg-white p-5 rounded-lg border border-gray-200 border-l-4 border-caramel">
                <div className="flex items-center justify-between">
                  <div
                    onClick={() => setShowMyHuman(!showMyHuman)}
                    className="flex items-center gap-4 cursor-pointer flex-1"
                  >
                    {myHuman.photo ? (
                      <img
                        src={`${getApiBaseUrl()}/uploads/${myHuman.photo}`}
                        alt=""
                        className="w-14 h-14 rounded-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={(e) => { e.stopPropagation(); setPhotoUrl(`${getApiBaseUrl()}/uploads/${myHuman.photo}`); }}
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center text-caramel text-lg font-semibold">
                        {[myHuman.secondName, myHuman.firstName].filter(Boolean).map(n => n![0]).join("").slice(0, 2) || "?"}
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-gray-800">
                        {[myHuman.secondName, myHuman.firstName].filter(Boolean).join(" ") || "Без имени"}
                        <span className="text-xs text-caramel font-medium ml-2">Вы</span>
                      </h3>
                      <p className="text-sm text-gray-500">{myHuman.gender === "male" ? "Мужчина" : "Женщина"}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => router.push(`/tree/${treeId}/human/${myHuman.humanId}`)}
                    className="text-sm bg-gray-50 text-caramel px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors shrink-0 ml-3"
                  >
                    Подробнее
                  </button>
                  <FiChevronRight
                    onClick={() => setShowMyHuman(!showMyHuman)}
                    className={`w-5 h-5 text-gray-500 cursor-pointer transition-transform duration-300 shrink-0 ml-2 ${showMyHuman ? "rotate-90" : ""}`}
                  />
                </div>
              </div>
              {showMyHuman && (
                <div className="mt-3">
                  <HumanPreview
                    humanId={myHuman.humanId}
                    treeId={treeId}
                    onClose={() => {
                      setShowMyHuman(false);
                      fetchTree();
                    }}
                  />
                </div>
              )}
            </div>
          )}
          <div className="space-y-4">
            {humans.length === 0 ? (
              <p className="text-center text-gray-500 py-16 bg-white rounded-lg border border-gray-200">В дереве пока нет людей</p>
            ) : (
              humans.filter(h => h.humanId !== myHumanId).map((h) => (
                <div key={h.humanId}>
                  <div className="bg-white p-5 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div
                        onClick={() => setSelectedHuman(selectedHuman === h.humanId ? null : h.humanId)}
                        className="flex items-center gap-4 cursor-pointer flex-1"
                      >
                        {h.photo ? (
                          <img
                            src={`${getApiBaseUrl()}/uploads/${h.photo}`}
                            alt=""
                            className="w-14 h-14 rounded-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={(e) => { e.stopPropagation(); setPhotoUrl(`${getApiBaseUrl()}/uploads/${h.photo}`); }}
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-lg font-semibold">
                            {[h.secondName, h.firstName].filter(Boolean).map(n => n![0]).join("").slice(0, 2) || "?"}
                          </div>
                        )}
                        <div>
                          <h3 className="font-semibold text-gray-800">
                            {[h.secondName, h.firstName].filter(Boolean).join(" ") || "Без имени"}
                            <span className="text-xs text-gray-400 font-normal ml-2">ID: {h.humanId}</span>
                          </h3>
                          <p className="text-sm text-gray-500">{h.gender === "male" ? "Мужчина" : "Женщина"}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => router.push(`/tree/${treeId}/human/${h.humanId}`)}
                        className="text-sm bg-gray-50 text-caramel px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors shrink-0 ml-3"
                      >
                        Подробнее
                      </button>
                      <FiChevronRight
                        onClick={() => setSelectedHuman(selectedHuman === h.humanId ? null : h.humanId)}
                        className={`w-5 h-5 text-gray-500 cursor-pointer transition-transform duration-300 shrink-0 ml-2 ${selectedHuman === h.humanId ? "rotate-90" : ""}`}
                      />
                    </div>
                  </div>
                  {selectedHuman === h.humanId && (
                    <div className="mt-3">
                      <HumanPreview
                        humanId={h.humanId}
                        treeId={treeId}
                        onClose={() => {
                          setSelectedHuman(null);
                          fetchTree();
                        }}
                      />
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {totalCount > 0 && (
            <div className="flex items-center justify-between mt-6 text-sm text-gray-500">
              <div className="flex items-center gap-3">
                <span>Отобразить:</span>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="bg-white border border-gray-200 rounded-lg px-3 py-1 text-sm text-gray-700 focus:outline-none focus:border-caramel focus:ring-1 focus:ring-caramel transition-colors"
                >
                  <option value={10}>10</option>
                  <option value={30}>30</option>
                  <option value={100}>100</option>
                </select>
                <span>из {totalCount}</span>
              </div>
              {totalCount > pageSize && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 rounded-lg bg-white border border-gray-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                  >
                    &laquo;
                  </button>
                  {Array.from({ length: Math.ceil(totalCount / pageSize) }, (_, i) => i + 1)
                    .filter(p => Math.abs(p - currentPage) <= 2 || p === 1 || p === Math.ceil(totalCount / pageSize))
                    .map((p, idx, arr) => (
                      <span key={p} className="flex items-center">
                        {idx > 0 && arr[idx - 1] !== p - 1 && <span className="px-1">...</span>}
                        <button
                          onClick={() => setCurrentPage(p)}
                          className={`px-3 py-1 rounded-lg transition-colors ${
                            currentPage === p
                              ? "bg-caramel text-white"
                              : "bg-white border border-gray-200 hover:bg-gray-50"
                          }`}
                        >
                          {p}
                        </button>
                      </span>
                    ))
                  }
                  <button
                    onClick={() => setCurrentPage(p => Math.min(Math.ceil(totalCount / pageSize), p + 1))}
                    disabled={currentPage === Math.ceil(totalCount / pageSize)}
                    className="px-3 py-1 rounded-lg bg-white border border-gray-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                  >
                    &raquo;
                  </button>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {photoUrl && (
        <div
          className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setPhotoUrl(null)}
        >
          <img
            src={photoUrl}
            alt=""
            className="max-w-full max-h-[90vh] rounded-lg shadow-2xl object-contain"
          />
          <button
            onClick={() => setPhotoUrl(null)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
          >
            <FiX className="w-8 h-8" />
          </button>
        </div>
      )}
    </div>
  );
}
