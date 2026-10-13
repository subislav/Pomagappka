# Pomagappka

Polskojęzyczna aplikacja webowa do organizacji dostaw posiłków dla osób i rodzin potrzebujących tymczasowego wsparcia (w stylu Meal Train).

## Wymagania

- Docker + Docker Compose v2
- (opcjonalnie) Node.js 20+ i pnpm 9 — do pracy poza kontenerami

## Szybki start (Docker)

```bash
cp .env.example .env
docker compose up --build
```

| Usługa | URL |
|--------|-----|
| Frontend (Vite) | http://localhost:5173 |
| API (Fastify) | http://localhost:3000 |
| Health | http://localhost:3000/health |
| Mailpit | http://localhost:8025 |

PostgreSQL działa tylko w sieci Compose (bez publikacji portu na hosta).

Frontend proxy’uje `/api/*` do API, żeby uniknąć problemów z CORS/cookies w development.

## Lokalnie bez Docker (API + web)

Wymaga działającego Postgres i (opcjonalnie) Mailpit.

```bash
corepack enable
pnpm install
pnpm --filter @pomagappka/shared build
pnpm --filter @pomagappka/api db:migrate
pnpm dev
```

Ustaw `DATABASE_URL` w `.env` przed migracją.

## Testy i typecheck

```bash
pnpm --filter @pomagappka/shared build
pnpm typecheck
pnpm test
```

E2E (Playwright) — wymaga działającego `docker compose up`:

```bash
pnpm install
pnpm --filter @pomagappka/e2e install:browsers
pnpm test:e2e
```

## Produkcja

Compose: `compose.prod.yaml` + Caddy (`deploy/Caddyfile`).

```bash
cp .env.prod.example .env.prod
docker compose -f compose.prod.yaml --env-file .env.prod up --build -d
```

Lokalna weryfikacja topologii produkcyjnej (HTTPS z lokalnym certem Caddy + Mailpit):

```bash
cp .env.prod.local.example .env.prod.local
docker compose -f compose.prod.yaml -f compose.prod.local.yaml --env-file .env.prod.local up --build -d
curl -fk https://localhost/api/health
```

Przenośne na VPS (Hetzner, Oracle Cloud, AWS EC2 itd.). Obrazy bazują na oficjalnych obrazach multi-arch (amd64/arm64), o ile upstream je wspiera.

Backupy Postgres: `deploy/backup-db.sh` / `deploy/restore-db.sh`.

## Auth

- Hasło: min. 8 znaków, wielka litera, mała litera, cyfra; nowe hasło nie może być takie samo jak poprzednie
- Reset hasła: `/zapomniane-haslo` (e-mail przez Mailpit/Resend)
- Google login: opcjonalnie, gdy ustawisz `GOOGLE_CLIENT_ID` i `GOOGLE_CLIENT_SECRET` (callback: `{BETTER_AUTH_URL}/api/auth/callback/google`)
- PIN: 5 błędnych prób z tego samego IP → wymagany nowy PIN od organizatora

## Fazy

Obecnie: **Faza 0–6** (docs, Docker, auth, wydarzenia, rezerwacje, e-mail, E2E/produkcja/ops).

Po zmianie zależności w `package.json` odtwórz wolumeny `node_modules` Compose
(`docker compose down` + usuń wolumeny `*_node_modules` + `docker compose up --build`),
inaczej kontenery mogą używać starego cache zależności.

## Założenia

- Nazwa produktu w UI: **Pomagappka**
- Strefa czasowa wyświetlania: `Europe/Warsaw` (UTC w bazie)
- Mail w development: tylko Mailpit (bez wysyłki do internetu)
