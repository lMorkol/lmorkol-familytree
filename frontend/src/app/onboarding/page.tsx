"use client";

import { useRouter } from "next/navigation";
import { FiUserPlus, FiGitBranch, FiUsers, FiLink, FiCamera, FiUsers as FiTeam } from "react-icons/fi";

const steps = [
  {
    icon: FiUserPlus,
    title: "Регистрация и вход",
    items: [
      "Откройте familytreebp.ru и нажмите «Зарегистрироваться»",
      "Укажите логин, пароль, имя и фамилию",
      "После регистрации вы автоматически войдёте в аккаунт",
      "Вход по логину и паролю (регистр не важен)",
    ],
  },
  {
    icon: FiGitBranch,
    title: "Создание дерева",
    items: [
      "При регистрации автоматически создаётся первое дерево",
      "Нажмите на название дерева, чтобы переименовать его",
      "Можно создать несколько деревьев через меню «Все деревья»",
    ],
  },
  {
    icon: FiUsers,
    title: "Добавление людей",
    items: [
      "На странице дерева нажмите «Добавить человека»",
      "Укажите пол, имя, фамилию и отчество",
      "Заполните даты рождения и смерти, место рождения",
      "Загрузите фотографию",
    ],
  },
  {
    icon: FiLink,
    title: "Установление связей",
    items: [
      "Откройте карточку человека и нажмите «Добавить связь»",
      "Выберите тип связи: родитель-ребёнок, супруги, братья/сёстры",
      "Укажите дату начала и окончания связи",
      "Связи отображаются на схеме древа",
    ],
  },
  {
    icon: FiCamera,
    title: "Медиа и документы",
    items: [
      "В карточке человека загружайте фотографии и документы",
      "Создавайте альбомы для группировки",
      "Храните аудиозаписи и видео",
    ],
  },
  {
    icon: FiTeam,
    title: "Совместная работа",
    items: [
      "Перейдите в «Участники дерева»",
      "Пригласите родственников по логину",
      "Назначьте роли: админ, редактор, читатель",
      "Каждый участник видит и редактирует дерево по своим правам",
    ],
  },
];

export default function OnboardingPage() {
  const router = useRouter();

  return (
    <div className="max-w-3xl mx-auto py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">Как пользоваться FamilyTree</h1>
      <p className="text-gray-500 mb-8">Пошаговое руководство для начала работы</p>

      <div className="space-y-6">
        {steps.map((step, i) => (
          <div key={i} className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-caramel/10 flex items-center justify-center shrink-0">
                <step.icon className="w-5 h-5 text-caramel" />
              </div>
              <h2 className="text-lg font-semibold text-gray-800">{step.title}</h2>
            </div>
            <ul className="space-y-2 ml-[52px]">
              {step.items.map((item, j) => (
                <li key={j} className="text-gray-600 text-sm flex items-start gap-2">
                  <span className="text-caramel mt-0.5">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-10 text-center">
        <button
          onClick={() => router.push("/register")}
          className="bg-caramel text-white px-8 py-3 rounded-lg hover:bg-caramel/90 transition-colors font-medium"
        >
          Начать сейчас
        </button>
      </div>
    </div>
  );
}
