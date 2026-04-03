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
- AI-генерация title, meta description, slug, markdown, tags и image query;
- автоподбор 5-6 изображений из Unsplash;
- публичный API `GET /api/posts` и `GET /api/posts/[slug]`;
- rich text editor на Tiptap;
- автоматический SEO score.

## Быстрый старт

```bash
npm install
npm run seed:admin -- --email admin@example.com --password StrongPass123! --name "Admin"
npm run dev
```

Откройте `http://localhost:3000/login`.

## Переменные окружения

См. `.env.example`. Для совместимости поддерживаются оба ключа подключения к MongoDB: `MONGO_URI` и `MONGODB_URI`.

## Основные маршруты

- `/login` — вход в админку
- `/admin` — dashboard
- `/admin/articles` — список статей
- `/admin/articles/new` — создание статьи
- `/api/posts` — headless API списка публикаций
- `/api/posts/[slug]` — headless API одной публикации

---

## 10. Сервер и API

Основной серверный файл: server.js  
Дополнительная документация по API: LMS_API_TODAY.md

Сервер включает:

- маршруты и бизнес-логику;
- middleware-проверки;
- модельный слой;
- обработку загрузок и файлов.

---

## 11. Smoke-тесты

Для ручной проверки используйте:

- SMOKE_TEST_CHECKLIST.md

Рекомендуется проверять:

- регистрацию/вход;
- ролевые ограничения;
- операции в админ-панели;
- зачисления и отображение данных студента;
- корректность API-ответов.

---

## 12. Дорожная карта

- добавить unit/integration тесты ключевых модулей;
- усилить обработку ошибок на клиенте и сервере;
- улучшить мониторинг и логирование;
- расширить мобильную адаптацию интерфейса;
- добавить продвинутую аналитику по кружкам и успеваемости.

---

## Репозиторий

GitHub: https://github.com/wqesa121/lms_fomin.d.git