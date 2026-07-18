# Nami Gear

Інтернет-магазин ігрових килимків і глайдів на Next.js 16 App Router.

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

## Перевірки

```bash
npm run typecheck
npm run lint
npm run build
npm audit
```
