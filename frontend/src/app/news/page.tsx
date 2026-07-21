"use client";

import { FiCalendar, FiTag } from "react-icons/fi";

const news = [
  {
    date: "21 июля 2026",
    isoDate: "2026-07-21",
    tag: "Обновление",
    title: "Крупное обновление: мобильная адаптация, лендинг, поиск связей",
    changes: [
      "Полная адаптация схемы для мобильных устройств — pinch-to-zoom, панорамирование, автоматическое масштабирование под размер экрана",
      "Адаптивный хедер — корректное отображение на экранах от 320px",
      "Кнопки «Семейное древо» и «Добавить человека» компактнее на мобилке",
      "Таблица участников теперь горизонтально скроллируется",
      "Колесико мышки снова работает для зума схемы",
      "Легенда схемы перемещена в безопасную зону на мобилке",
    ],
    newFeatures: [
      "Лендинг с описанием возможностей и пошаговым руководством",
      "Страницы «Новости» и «Обучение», доступные без авторизации",
      "Навигация в хедере: Главная, Новости, Обучение — видны всем пользователям",
      "Поиск людей при добавлении связей — по имени, фамилии или ID с выпадающим списком",
      "Редактирование типа связи — можно менять тип (родитель, ребёнок, брат/сестра и др.)",
      "Единый тип «Брат/Сестра» вместо отдельных — отображение зависит от гендера",
      "Просмотр фото в карточках людей — полноэкранный лайтбокс",
      "Просмотр фото на схеме — клик по фото на узле открывает лайтбокс",
      "Кнопка «глазик» для показа пароля при входе",
      "Case-insensitive логин — Nikita и nikita работают одинаково",
      "Защита схемы от зацикленных связей — вместо зависания показывается ошибка",
    ],
  },
  {
    date: "15 июля 2026",
    isoDate: "2026-07-15",
    tag: "Функция",
    title: "Фильтры и автокомплит",
    text: "Добавлена фильтрация людей по городу рождения и стране. Автоматическое заполнение существующими значениями из базы данных.",
  },
  {
    date: "10 июля 2026",
    isoDate: "2026-07-10",
    tag: "Улучшение",
    title: "Геокодинг адресов",
    text: "Адреса теперь отображаются на интерактивной карте. Автоматическое определение координат по текстовому адресу.",
  },
  {
    date: "1 июля 2026",
    isoDate: "2026-07-01",
    tag: "Запуск",
    title: "FamilyTree v2",
    text: "Запуск новой версии приложения. Полностью переработанный интерфейс, быстрая работа, удобное управление семейными данными.",
  },
];

function isFresh(isoDate: string): boolean {
  const now = new Date();
  const itemDate = new Date(isoDate);
  const diffMs = now.getTime() - itemDate.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays <= 3;
}

export default function NewsPage() {
  return (
    <div className="max-w-3xl mx-auto py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-8">Новости</h1>
      <div className="space-y-6">
        {news.map((item, i) => (
          <article key={i} className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center gap-3 mb-3 text-sm text-gray-500 flex-wrap">
              <span className="flex items-center gap-1">
                <FiCalendar className="w-4 h-4" />
                {item.date}
              </span>
              <span className="flex items-center gap-1 text-caramel font-medium">
                <FiTag className="w-4 h-4" />
                {item.tag}
              </span>
              {isFresh(item.isoDate) && (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-300">
                  Fresh
                </span>
              )}
            </div>
            <h2 className="text-lg font-semibold text-gray-800 mb-3">{item.title}</h2>

            {"changes" in item && item.changes ? (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">Изменения</h3>
                  <ul className="space-y-1.5">
                    {item.changes.map((c, j) => (
                      <li key={j} className="text-gray-600 text-sm flex items-start gap-2">
                        <span className="text-caramel mt-0.5 shrink-0">•</span>
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">Новый функционал</h3>
                  <ul className="space-y-1.5">
                    {item.newFeatures.map((f, j) => (
                      <li key={j} className="text-gray-600 text-sm flex items-start gap-2">
                        <span className="text-emerald-500 mt-0.5 shrink-0">★</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <p className="text-gray-600">{item.text}</p>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
