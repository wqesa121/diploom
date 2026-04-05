# NeuraCMS

NeuraCMS — современная headless CMS на Next.js 15 с MongoDB, Auth.js, Tiptap и встроенным AI-генератором SEO-контента на базе Gemini. Проект ориентирован на контент-команды, которым нужен быстрый production-ready бэкофис и публичный headless API без платной инфраструктуры.

## Стек

- Next.js 15 App Router, Server Components, Server Actions
- TypeScript strict mode
- Tailwind CSS, shadcn/ui, Radix UI, lucide-react
- MongoDB Atlas + Mongoose
- Auth.js v5 + MongoDB adapter + Credentials provider
- Google Generative AI SDK + Gemini Flash
- Unsplash API free tier
- Zod
- Tiptap headless editor

## Оптимальная структура

```text
app/
   (auth)/login
   (admin)/admin
   api/auth/[...nextauth]
   api/admin/ai/generate
   api/posts
actions/
components/
   admin/
   auth/
   editor/
   ui/
lib/
models/
scripts/
types/
```

## Возможности

- защищенная админ-панель с боковой навигацией;
- CRUD для статей;
- draft / published workflow;
- scheduled publishing workflow;
- AI-генерация title, meta description, slug, markdown, tags и image query;
- автоподбор 5-6 изображений из Unsplash;
- публичный API `GET /api/posts` и `GET /api/posts/[slug]`;
- rich text editor на Tiptap;
- автоматический SEO score;
- приватный preview по токену и webhook-friendly revalidation endpoint.

## Быстрый старт

```bash
npm install
npm run seed:admin -- --email admin@example.com --password StrongPass123! --name "Admin"
npm run dev
```

Откройте `http://localhost:3000/login`.

## Переменные окружения

См. `.env.example`.

Что важно:

- поддерживаются оба ключа подключения к MongoDB: `MONGO_URI` и `MONGODB_URI`;
- `AUTH_SECRET` обязателен для Auth.js;
- если в старом окружении уже есть только `JWT_SECRET`, приложение умеет использовать его как fallback;
- `PREVIEW_TOKEN` включает внешний preview draft-материалов;
- `CRON_SECRET` защищает `POST /api/revalidate` для cron/webhook вызовов;
- `GOOGLE_GENERATIVE_AI_API_KEY` и `UNSPLASH_ACCESS_KEY` нужны только для AI-кнопки генерации.

## Первый запуск

1. Убедитесь, что в `.env` задана рабочая MongoDB строка.
2. Добавьте `AUTH_SECRET`.
3. При необходимости оставьте старый `MONGODB_URI` без изменений: приложение его поддерживает.
4. Создайте первого администратора:

```bash
npm run seed:admin -- --email admin@example.com --password StrongPass123! --name "Admin"
```

5. Запустите dev-сервер:

```bash
npm run dev
```

6. Откройте `/login` и войдите под созданным аккаунтом.

## Основные маршруты

- `/login` — вход в админку
- `/admin` — dashboard
- `/admin/articles` — список статей
- `/admin/articles/new` — создание статьи
- `/api/posts` — headless API списка публикаций
- `/api/posts/[slug]` — headless API одной публикации
- `/preview/[slug]` — внешний preview по токену
- `/api/revalidate` — защищённый revalidation endpoint для cron/webhook

## Cron / Scheduled Publishing

Если вы хотите точно обновлять публичные страницы в момент scheduled publish, вызывайте:

```bash
curl -X POST http://localhost:3000/api/revalidate \
   -H "Authorization: Bearer YOUR_CRON_SECRET"
```

Endpoint:

- проверяет `CRON_SECRET`;
- revalidate-ит `/`, `/posts`, `/api/posts`;
- находит уже наступившие scheduled-статьи и revalidate-ит `/posts/[slug]` и `/api/posts/[slug]`.

## Что уже реализовано

- защищенная admin-зона через Auth.js middleware;
- credentials login с MongoDB adapter;
- Article model на Mongoose;
- AI generation endpoint для title, meta, slug, markdown, tags и image query;
- интеграция с Unsplash для 5-6 изображений;
- headless API для published-постов;
- Tiptap editor и AI-first article form.

## Репозиторий

GitHub: https://github.com/wqesa121/diploom