# RAVEZ OS — Frontend

Новый фронтенд для RAVEZ OS на React + Vite + Tailwind.
Подключается к существующему PHP API на ravez-one.ru.

---

## Быстрый старт

### 1. Открой проект в Cursor

Открой Cursor, затем **File → Open Folder** и выбери папку `ravez-os`.

### 2. Установи зависимости

Открой терминал в Cursor (Ctrl+` или Cmd+`) и выполни:

```bash
npm install
```

Подожди пока установятся все пакеты (1-2 минуты).

### 3. Запусти проект

```bash
npm run dev
```

Откроется браузер на `http://localhost:3000` с приложением.

### 4. Войди в систему

Используй свои логин и пароль от ravez-one.ru.

---

## Структура проекта

```
ravez-os/
├── src/
│   ├── api/
│   │   └── client.js        ← API клиент (подключение к PHP)
│   ├── hooks/
│   │   └── useAuth.js       ← Авторизация
│   ├── components/
│   │   ├── Layout.jsx       ← Основной лейаут
│   │   ├── Sidebar.jsx      ← Боковое меню (десктоп)
│   │   ├── MobileNav.jsx    ← Нижнее меню (мобильный)
│   │   └── ProtectedRoute.jsx ← Защита роутов
│   ├── pages/
│   │   ├── Login.jsx        ← Страница входа
│   │   ├── Dashboard.jsx    ← Дашборд
│   │   ├── Tasks.jsx        ← Задачи
│   │   ├── Events.jsx       ← События
│   │   ├── Team.jsx         ← Команда
│   │   ├── Shifts.jsx       ← Смены
│   │   └── Finances.jsx     ← Финансы
│   ├── utils/
│   │   └── constants.js     ← Роли, статусы, форматирование
│   ├── App.jsx              ← Роутер
│   ├── main.jsx             ← Точка входа
│   └── index.css            ← Стили (Tailwind)
├── .cursorrules             ← Правила для Cursor AI
├── index.html               ← HTML шаблон
├── package.json             ← Зависимости
├── tailwind.config.js       ← Настройка Tailwind
├── vite.config.js           ← Настройка Vite
└── postcss.config.js        ← PostCSS
```

---

## Как добавлять новые модули

### В Cursor:

1. Нажми **Cmd+K** (или Ctrl+K)
2. Напиши запрос на русском, например:

> Создай страницу Salary (src/pages/Salary.jsx) по образцу Tasks.jsx.
> API: GET salary/list → { salaries: [...] }, POST salary/save.
> Показывать таблицу с колонками: сотрудник, тип, сумма, период.
> Фильтры по типу зарплаты. Кнопка добавления с модальным окном.

3. Cursor сгенерирует файл
4. Добавь роут в App.jsx и пункт в Sidebar.jsx

---

## Деплой на хостинг

```bash
npm run build
```

Папку `dist/` загрузить на хостинг вместо старых HTML файлов.

---

## Полезные команды Cursor

- **Cmd+K** — задать вопрос AI / сгенерировать код
- **Cmd+L** — открыть AI чат (для более длинных запросов)
- **Cmd+I** — инлайн редактирование выделенного кода
- **Ctrl+`** — открыть терминал
