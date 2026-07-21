"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FiGitBranch, FiUsers, FiMap, FiCamera, FiShield, FiArrowRight } from "react-icons/fi";

export default function Home() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="text-center py-20 text-gray-500">Загрузка...</div>;

  const features = [
    { icon: FiGitBranch, title: "Семейные древа", desc: "Создавайте и визуализируйте родственные связи в удобном интерфейсе" },
    { icon: FiUsers, title: "Совместное редактирование", desc: "Приглашайте родственников и работайте над деревом вместе" },
    { icon: FiCamera, title: "Медиатека", desc: "Храните фотографии, документы и аудиозаписи в альбомах" },
    { icon: FiMap, title: "Адреса на карте", desc: "Отмечайте места рождения и жизни на интерактивной карте" },
    { icon: FiShield, title: "Ролевой доступ", desc: "Управляйте правами: админ, редактор, читатель" },
  ];

  const steps = [
    { num: "1", title: "Зарегистрируйтесь", desc: "Создайте аккаунт за минуту" },
    { num: "2", title: "Добавьте родственников", desc: "Вносите людей и устанавливайте связи" },
    { num: "3", title: "Просматривайте древо", desc: "Наглядная схема вашей семьи" },
  ];

  return (
    <div className="min-h-[calc(100dvh-200px)]">
      {/* Hero */}
      <section className="text-center py-16 sm:py-24">
        <h1 className="text-3xl sm:text-5xl font-bold text-gray-800 mb-4">
          FamilyTree
        </h1>
        <p className="text-lg sm:text-xl text-gray-500 mb-8 max-w-2xl mx-auto">
          Создайте своё семейное древо. Сохраняйте историю рода, делитесь воспоминаниями с близкими.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => router.push("/register")}
            className="bg-caramel text-white px-8 py-3 rounded-lg hover:bg-caramel/90 transition-colors font-medium text-lg"
          >
            Начать бесплатно
          </button>
          <button
            onClick={() => router.push("/login")}
            className="bg-white text-gray-700 px-8 py-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors font-medium text-lg"
          >
            Войти
          </button>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-white rounded-xl border border-gray-200 px-6 mb-16">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-10">Возможности</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {features.map((f, i) => (
            <div key={i} className="flex gap-4">
              <div className="w-12 h-12 rounded-lg bg-caramel/10 flex items-center justify-center shrink-0">
                <f.icon className="w-6 h-6 text-caramel" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-1">{f.title}</h3>
                <p className="text-sm text-gray-500">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 mb-16">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-10">Как это работает</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {steps.map((s, i) => (
            <div key={i} className="text-center">
              <div className="w-12 h-12 rounded-full bg-caramel text-white flex items-center justify-center text-xl font-bold mx-auto mb-4">
                {s.num}
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">{s.title}</h3>
              <p className="text-sm text-gray-500">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Navigation links */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto mb-16">
        <a href="/news" className="bg-white p-6 rounded-lg border border-gray-200 hover:border-caramel hover:shadow-sm transition-all text-center">
          <h3 className="font-semibold text-gray-800 mb-1">Новости</h3>
          <p className="text-sm text-gray-500">Последние обновления и изменения</p>
        </a>
        <a href="/onboarding" className="bg-white p-6 rounded-lg border border-gray-200 hover:border-caramel hover:shadow-sm transition-all text-center">
          <h3 className="font-semibold text-gray-800 mb-1">Обучение</h3>
          <p className="text-sm text-gray-500">Как пользоваться FamilyTree</p>
        </a>
      </section>

      {/* CTA */}
      <section className="text-center py-12 bg-caramel/5 rounded-xl border border-caramel/20">
        <h2 className="text-xl font-bold text-gray-800 mb-3">Готовы начать?</h2>
        <p className="text-gray-500 mb-6">Бесплатно, без ограничений</p>
        <button
          onClick={() => router.push("/register")}
          className="bg-caramel text-white px-8 py-3 rounded-lg hover:bg-caramel/90 transition-colors font-medium inline-flex items-center gap-2"
        >
          Зарегистрироваться <FiArrowRight className="w-4 h-4" />
        </button>
      </section>
    </div>
  );
}
