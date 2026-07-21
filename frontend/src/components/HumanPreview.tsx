"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import RelationForm from "./RelationForm";
import { FiPlus, FiX } from "react-icons/fi";
import { getRelationLabel } from "@/lib/relations";
import type { Human, Relation } from "@/types";

interface Props {
  humanId: number;
  treeId: number;
  onClose: () => void;
}

export default function HumanPreview({ humanId, treeId, onClose }: Props) {
  const router = useRouter();
  const [human, setHuman] = useState<Human | null>(null);
  const [relations, setRelations] = useState<Relation[]>([]);
  const [showRelationForm, setShowRelationForm] = useState(false);

  const fetchAll = async () => {
    const [hRes, rRes] = await Promise.all([
      api.get(`/v1/humans/${humanId}`),
      api.get(`/v1/humans/${humanId}/relations`),
    ]);
    setHuman(hRes.data.data);
    setRelations(rRes.data.data.items);
  };

  useEffect(() => {
    fetchAll();
  }, [humanId]);

  const handleAddRelation = async (data: any) => {
    await api.post(`/v1/humans/${humanId}/relations`, data);
    setShowRelationForm(false);
    fetchAll();
  };

  if (!human) return <div className="bg-white p-5 rounded-lg border border-gray-200">Загрузка...</div>;

  return (
    <div className="bg-white p-5 rounded-lg border border-gray-200 mb-3">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-bold text-gray-800">
            {[human.secondName, human.firstName, human.patronymic].filter(Boolean).join(" ")}
          </h3>
          <span className="text-xs text-gray-500">ID: {human.humanId}</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowRelationForm(!showRelationForm)}
            className="flex items-center gap-1 text-sm bg-gray-50 text-caramel px-3 py-1 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
          >
            <FiPlus className="w-4 h-4" />
            Связь
          </button>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-100 transition-colors">
            <FiX className="w-5 h-5" />
          </button>
        </div>
      </div>

      {showRelationForm && (
        <div className="mb-4">
          <RelationForm treeId={treeId} onSubmit={handleAddRelation} onCancel={() => setShowRelationForm(false)} />
        </div>
      )}

      <div className="text-sm text-gray-500 mb-3">
        {human.birthDate && <div>Дата рождения: {new Date(human.birthDate).toLocaleDateString("ru-RU")}</div>}
        {human.placeOfBirth && <div>Место рождения: {human.placeOfBirth}</div>}
        {human.country && <div>Страна: {human.country}</div>}
      </div>

      {relations.length > 0 && (
        <div className="space-y-2">
          {relations.map(r => (
            <div key={r.id} className="text-sm bg-gray-50 px-4 py-2 rounded-lg border border-gray-200">
              <span className="font-medium text-gray-700">{getRelationLabel(r.relationType, human.gender, r.relatedGender || "")}</span>
              <span className="text-gray-500"> — </span>
              <button
                onClick={() => router.push(`/tree/${treeId}/human/${r.toHumanId}`)}
                className="text-caramel hover:text-caramel/80 hover:underline transition-colors"
              >
                {r.relatedName || `человек #${r.toHumanId}`}
              </button>
              {(r.relationType === "spouse" || r.relationType === "ex_spouse") && (r.startDate || r.endDate) && (
                <div className="text-xs text-gray-400 mt-1">
                  {r.startDate && <span>Брак: {new Date(r.startDate).toLocaleDateString("ru-RU")}</span>}
                  {r.startDate && r.endDate && <span className="mx-1">|</span>}
                  {r.endDate && <span>Развод: {new Date(r.endDate).toLocaleDateString("ru-RU")}</span>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
