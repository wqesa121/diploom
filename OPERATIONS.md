# Operations Runbook

Этот документ нужен для предрелизной проверки, backup/recovery и быстрого восстановления после инцидентов.

## Release Checklist

Перед релизом выполните:

```bash
npm install
npm run verify:release
```

Если приложение уже развернуто и доступно по URL, можно дополнительно включить live health probe:

```bash
set HEALTHCHECK_URL=https://your-domain.example/api/health
npm run verify:release
```

Release считается готовым, если:

- `npm run test:smoke` проходит без ошибок;
- `npm run build` проходит без ошибок;
- `/api/health` возвращает `200` и `checks.database.status = ok`;
- admin login работает;
- `/api/posts` отвечает и возвращает published контент.

## Backup Strategy

Основной источник данных: MongoDB Atlas.

Рекомендуемый минимальный режим:

- включить automated backups / snapshots на стороне Atlas;
- перед рискованными миграциями делать on-demand snapshot;
- хранить `.env` секреты отдельно от репозитория;
- документировать последний успешный backup timestamp.

### Manual Backup

Если доступен MongoDB Database Tools, можно сделать ручной dump:

```bash
mongodump --uri="YOUR_MONGO_URI" --out="./backups/manual-YYYY-MM-DD"
```

Что должно попасть в backup:

- коллекции `users`, `articles`, `articlerevisions`, `activitylogs`, `apiratelimits`;
- любые дополнительные коллекции, появившиеся после расширений проекта.

После backup проверьте, что каталог dump не пустой и содержит BSON/metadata файлы.

## Recovery Procedure

### Restore from Atlas Snapshot

Используйте restore flow из MongoDB Atlas и восстановите кластер или временный cluster-from-snapshot.

После восстановления:

1. Обновите `MONGO_URI` / `MONGODB_URI`, если restore развёрнут в новый кластер.
2. Убедитесь, что `AUTH_SECRET`, `CRON_SECRET` и `PREVIEW_TOKEN` заданы корректно.
3. Запустите `npm run verify:release`.
4. Проверьте `/api/health`.
5. Проверьте вход в `/login` под admin account.

### Restore from mongodump

```bash
mongorestore --uri="YOUR_MONGO_URI" "./backups/manual-YYYY-MM-DD"
```

После `mongorestore` выполните:

```bash
npm run verify:release
```

И затем вручную проверьте:

- `/api/health`
- `/admin/users`
- `/admin/articles`
- `/api/posts`

## Incident Triage

### Symptom: `/api/health` returns 503

Проверьте:

- доступность MongoDB Atlas;
- корректность `MONGO_URI` / `MONGODB_URI`;
- сетевые allowlists Atlas;
- не истёк ли секрет или пароль БД.

### Symptom: AI generation returns 429

Проверьте:

- `AI_RATE_LIMIT_MAX`
- `AI_RATE_LIMIT_WINDOW_SECONDS`
- не идёт ли аномальный burst запросов из admin panel.

### Symptom: revalidate endpoint returns 429

Проверьте:

- cron frequency;
- `REVALIDATE_RATE_LIMIT_MAX`
- `REVALIDATE_RATE_LIMIT_WINDOW_SECONDS`

### Symptom: users cannot log in

Проверьте:

- `AUTH_SECRET` / `JWT_SECRET`;
- наличие user records в коллекции `users`;
- доступность MongoDB;
- что нужному пользователю не изменили роль или email.

## Post-Incident Validation

После любого восстановления или hotfix:

```bash
npm run verify:release
```

Минимальный ручной checklist:

- `/api/health` отвечает `200`;
- вход в `/login` успешен;
- создание/редактирование статьи работает;
- review queue открывается;
- `/api/posts` и `/api/posts/[slug]` отвечают корректно.