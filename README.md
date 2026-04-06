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
- роли `admin`, `editor`, `reviewer` с route-level доступом;
- admin-only экран управления пользователями и ролями;
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
npm run seed:admin -- --email admin@example.com --password StrongPass123! --name "Admin" --role admin
npm run test:smoke
npm run verify:release
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
- `AI_RATE_LIMIT_MAX` и `AI_RATE_LIMIT_WINDOW_SECONDS` ограничивают Generate with AI по окну времени;
- `REVALIDATE_RATE_LIMIT_MAX` и `REVALIDATE_RATE_LIMIT_WINDOW_SECONDS` ограничивают частоту вызовов `POST /api/revalidate`;
- `GOOGLE_GENERATIVE_AI_API_KEY` и `UNSPLASH_ACCESS_KEY` нужны только для AI-кнопки генерации.

## Первый запуск

1. Убедитесь, что в `.env` задана рабочая MongoDB строка.
2. Добавьте `AUTH_SECRET`.
3. При необходимости оставьте старый `MONGODB_URI` без изменений: приложение его поддерживает.
4. Создайте первого пользователя:

```bash
npm run seed:admin -- --email admin@example.com --password StrongPass123! --name "Admin" --role admin
```

Допустимые роли: `admin`, `editor`, `reviewer`.

5. Запустите dev-сервер:

```bash
npm run dev
```

6. Откройте `/login` и войдите под созданным аккаунтом.

## Smoke Tests

Быстрый автоматизированный контур можно запускать так:

```bash
npm run test:smoke
```

Сейчас он покрывает:

- permission matrix для `admin`, `editor`, `reviewer`;
- route access rules и workflow guards;
- env fallback/override для rate limiting;
- request key extraction для API limiter.

## Operations

Предрелизная команда:

```bash
npm run verify:release
```

Полный operational runbook с backup/recovery находится в `OPERATIONS.md`.

## Основные маршруты

- `/login` — вход в админку
- `/admin` — dashboard
- `/admin/users` — управление пользователями и ролями
- `/admin/articles` — список статей
- `/admin/articles/new` — создание статьи
- `/api/posts` — headless API списка публикаций
- `/api/posts/[slug]` — headless API одной публикации
- `/api/health` — health/readiness check приложения и MongoDB
- `/preview/[slug]` — внешний preview по токену
- `/api/revalidate` — защищённый revalidation endpoint для cron/webhook

## Monitoring

Для liveness/readiness probe используйте:

```bash
curl http://localhost:3000/api/health
```

Endpoint:

- возвращает `200`, если приложение и MongoDB доступны;
- возвращает `503`, если база не отвечает или приложение не готово обслуживать трафик;
- поддерживает `HEAD` для дешёвых health probes;
- отдаёт timestamp, uptime и latency проверки базы.

## Cron / Scheduled Publishing

Если вы хотите точно обновлять публичные страницы в момент scheduled publish, вызывайте:

```bash
curl -X POST http://localhost:3000/api/revalidate \
   -H "Authorization: Bearer YOUR_CRON_SECRET"
```

Endpoint:

- проверяет `CRON_SECRET`;
- ограничивает частоту вызовов и возвращает `429` + `Retry-After`, если лимит превышен;
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