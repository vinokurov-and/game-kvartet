# «Квартет» — правила проекта для агента

Ежедневная русская словесная головоломка «4 группы по 4» для App Store (первым) и RuStore. Монетизация —
только Yandex Mobile Ads. Без сервера: головоломки в бандле, обновления через EAS Update.

- Спека: `docs/superpowers/specs/2026-10-10-kvartet-design.md`. План: `docs/superpowers/plans/2026-10-10-kvartet-v1.md`.
- Общие знания по App Store, рекламе, модерации — Obsidian `~/app-store` (сначала искать там, итоги записывать туда).

## Стек
Expo SDK 54, Expo Router, TypeScript strict (без `any`), React Native StyleSheet + токены из `lib/theme.ts`
(Tamagui сознательно не используем — игре хватает своих компонентов `components/brutal.tsx`), Reanimated,
Zustand + MMKV, luxon (даты по МСК). EAS: проект `@vinokurov_and/kvartet`, каналы development/preview/production,
`runtimeVersion.policy = appVersion`.

## Правила
- Ставить пакеты через `npx expo install`. Реестр npm — публичный (`.npmrc` в проекте).
- Перед завершением задачи: `npm run typecheck`, `npm run lint`, `npm test`.
- Коммиты на русском, subject ≤ 72, без упоминаний Claude. Push — только по просьбе владельца.
- Ключи (bothub и т.п.) — только в `.env` (в .gitignore), никогда в клиенте.
- После JS-изменений, дошедших до тестовых сборок, — публиковать EAS Update в preview и production.
- Никаких LLM-вызовов из приложения: контент генерируется локальным скриптом заранее.

## Уроки (инциденты)
- 2026-10-10: OTA с новыми полями `GameState` уронила TestFlight-сборку — экран читал сохранение напрямую, без
  `withDefaults`. Сохранённое состояние читать **только** через `getGame` и проверять web-превью со «старым»
  localStorage (см. регрессионный тест в `lib/game/game.test.ts`).
- Не навигировать (`router.push`) из эффектов при старте: корневой layout до загрузки шрифтов рендерит null →
  «navigate before mounting Root Layout». Показывать нужное на месте.
- Откат прод-канала: `eas update:republish --group <старая группа> --destination-channel production`.
