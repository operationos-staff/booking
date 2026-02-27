# 🌴 Пханг Нга Туры — Калькулятор

Next.js 14 + Supabase (npm пакет). Никаких CDN-скриптов.

## Быстрый старт

```bash
npm install
npm run dev
# → http://localhost:3000
```

## Структура проекта

```
src/
├── app/
│   ├── layout.js        # Root layout
│   ├── page.js          # Единственный маршрут — монтирует TourApp
│   └── globals.css      # Все стили
│
├── components/
│   ├── TourApp.js        ← ТОЧКА ВХОДА (все состояния, auth, routing)
│   ├── LoginPage.js      ← Экран входа
│   ├── Header.js         ← Шапка
│   ├── CalculatorPage.js ← Основной калькулятор
│   ├── BookingPage.js    ← Операционный отдел (роль: booking)
│   ├── ClientPage.js     ← Страница клиента (?tour=...)
│   ├── Modals.js         ← TextModal, LinkModal, AddOptModal
│   └── ToastContainer.js ← Уведомления
│
└── lib/
    ├── supabase.js    ← createClient() — ОДИН раз, синглтон
    ├── db.js          ← Все запросы к БД
    ├── constants.js   ← DEF_PACKAGES, DEF_OPTIONS, CAT_ICONS, ...
    ├── utils.js       ← fmt, computeCalc, buildClientData, doPrint, ...
    └── useToast.js    ← Toast hook
```

## Переменные окружения

Файл `.env.local` уже создан с вашими ключами:

```env
NEXT_PUBLIC_SUPABASE_URL=https://ufsvwlirjkcjkcouwgss.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

> ⚠️ Не коммитьте `.env.local` в git. Добавьте его в `.gitignore`.

## Деплой на Vercel

```bash
npx vercel
```

Добавьте переменные окружения в настройках проекта на Vercel (Settings → Environment Variables).

## Роли пользователей

Таблица `user_roles` в Supabase:

| user_id | role      |
|---------|-----------|
| uuid    | manager   |
| uuid    | booking   |

- **manager** — видит калькулятор с менеджерскими ценами
- **booking** — видит нетто-цены, наценки, раздел «Операционный отдел»

## Таблицы Supabase

```sql
-- packages
create table packages (
  id          serial primary key,
  sort_order  int default 0,
  type        text,         -- 'base' | 'vip'
  hours       int,
  name_ru     text,
  mgr_price   int,
  netto_price int,
  netto_detail text,
  extra_hour  int default 1000,
  note        text,
  updated_at  timestamptz
);

-- options
create table options (
  id               serial primary key,
  sort_order       int default 0,
  name_ru          text,
  mgr_price_adult  int,
  mgr_price_child  int,
  net_price_adult  int,
  net_price_child  int,
  only_8h          boolean default false,
  category         text,
  note             text,
  updated_at       timestamptz
);

-- calculations (client links)
create table calculations (
  id          uuid primary key default gen_random_uuid(),
  created_by  uuid references auth.users,
  client_name text,
  tour_date   date,
  payload     jsonb,
  created_at  timestamptz default now()
);

-- user roles
create table user_roles (
  user_id uuid primary key references auth.users,
  role    text -- 'manager' | 'booking'
);
```
