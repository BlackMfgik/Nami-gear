# Nami Gear

Інтернет-магазин ігрових килимків на Next.js 16 App Router.

## Стек

- Next.js 16, React 19, TypeScript 6
- Tailwind CSS 4
- Neon PostgreSQL (каталог товарів)
- Cloudinary CDN (фотографії товарів)
- Zustand (кошик із localStorage)
- TanStack Query (синхронізація наявності)
- Next.js Route Handler (парсер Artisan)

## Запуск

```bash
npm install
npm run dev
```

Або запустіть `start-store.bat` у Windows. Він відкриє сайт на `http://localhost:3002`.

Створіть `.env.local` зі змінною `DATABASE_URL`. Каталог завантажується з Neon, а фотографії віддаються через Cloudinary CDN.

Перед першим запуском оформлення замовлень створіть таблицю замовлень:

```bash
npm run db:init
```

## Передоплата на банку

Змінні описані в `.env.example`. `MONO_JAR_ID` і `TELEGRAM_CHAT_ID` можна дізнатися так:

```bash
npm run mono:setup
npm run telegram:setup
```

Після деплою:

```bash
npm run mono:setup -- --webhook "https://DOMAIN/api/payments/mono/webhook?key=MONO_WEBHOOK_SECRET"
npm run telegram:setup -- --webhook https://DOMAIN
```

`/api/cron/sync?key=CRON_SECRET` треба викликати щохвилини (наприклад, через cron-job.org), бо Vercel Hobby запускає cron лише раз на добу.

## Перевірки

```bash
npm run typecheck
npm run lint
npm run build
npm audit
```
