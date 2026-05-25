# Fly.io deployment

## Apps

| Directory | Fly app | URL |
|-----------|---------|-----|
| `microservice-backend/api-gateway` | `doxia-gateway` | https://doxia-gateway.fly.dev |
| `microservice-backend/user-service` | `doxia-user` | https://doxia-user.fly.dev |
| `microservice-backend/scribe-service` | `doxia-scribe` | https://doxia-scribe.fly.dev |
| `microservice-backend/ehr-service` | `doxia-ehr` | https://doxia-ehr.fly.dev |

## Auto-deploy (GitHub Actions)

Pushes to **`main`** that touch a service folder trigger [`.github/workflows/fly-deploy.yml`](../.github/workflows/fly-deploy.yml).

- Only changed services are deployed (path filters).
- **Run workflow** manually in GitHub → Actions → Fly Deploy → Run workflow deploys **all four**.

### One-time setup

1. Create a deploy token:

   ```bash
   fly auth login
   fly tokens create deploy -x 999999h
   ```

2. Add the token to GitHub: **Settings → Secrets and variables → Actions → `FLY_API_TOKEN`**.

3. Create the EHR app on first deploy (if it does not exist yet):

   ```bash
   cd microservice-backend/ehr-service
   fly apps create doxia-ehr --org personal   # skip if already created
   fly deploy -a doxia-ehr
   ```

4. Point the gateway at the EHR service (required for `/ehr/*` on the gateway):

   ```bash
   fly secrets set EHR_SERVICE_URL=https://doxia-ehr.fly.dev/ehr -a doxia-gateway
   ```

5. Push to `main` (or run the workflow manually).

## Fly secrets (by app)

Set via `fly secrets set KEY=value -a <app>`. Use the same Postgres as `doxia-user` for user + EHR DB.

### `doxia-gateway`

- `USER_SERVICE_URL` — e.g. `https://doxia-user.fly.dev/users`
- `EHR_SERVICE_URL` — `https://doxia-ehr.fly.dev/ehr`
- `CORS_ORIGINS` — your Vercel URL + `http://localhost:3000`

### `doxia-user`

- `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME`
- `JWT_SECRET`
- Do **not** set `RABBITMQ_URL` or `RABBITMQ_ENABLED` on Fly (no broker in this stack yet; avoids reconnect errors)
- `CORS_ORIGINS`
- `TYPEORM_SYNC` — omit or `true` (default: auto-sync schema on boot). Set `false` only when you add migrations.

### `doxia-scribe`

- `REDIS_URL` (required for session memory). `RABBITMQ_ENABLED` / `RABBITMQ_URL` only if you add a cloud AMQP broker
- `OPENAI_API_KEY`
- `CORS_ORIGINS`

### `doxia-ehr`

- Same DB vars as user-service (`DB_*`)
- `JWT_SECRET`, `TOKEN_ENCRYPTION_KEY`
- `CORS_ORIGINS`
- `EHR_FRONTEND_SUCCESS_URL`, `EHR_FRONTEND_ERROR_URL` — e.g. `https://your-app.vercel.app/dashboard/integrations`
- Epic / Cerner: `EPIC_*`, `CERNER_*` (see `ehr-service/README.md`)
- `TYPEORM_SYNC` — omit or `true` (default: auto-sync schema on boot). Set `false` only when you add migrations.

## Manual deploy

```bash
cd microservice-backend/api-gateway && fly deploy -a doxia-gateway
cd microservice-backend/user-service && fly deploy -a doxia-user
cd microservice-backend/scribe-service && fly deploy -a doxia-scribe
cd microservice-backend/ehr-service && fly deploy -a doxia-ehr
```

## Frontend (Vercel)

Next.js is deployed separately (see [`DEPLOY.md`](../DEPLOY.md)). Point Vercel env at Fly:

```bash
NEXT_PUBLIC_GATEWAY_URL=https://doxia-gateway.fly.dev
NEXT_PUBLIC_SCRIBE_SERVICE_URL=https://doxia-scribe.fly.dev
NEXT_PUBLIC_SCRIBE_WS_URL=wss://doxia-scribe.fly.dev
```

Set `CORS_ORIGINS` on gateway, user, scribe, and ehr Fly secrets to include your Vercel URL.

## Verify EHR

```bash
curl https://doxia-ehr.fly.dev/ehr/health
curl https://doxia-gateway.fly.dev/ehr/providers
```

Both should return JSON (not 404).

## Gateway cold starts

`api-gateway/fly.toml` uses `min_machines_running = 0` (scales to zero). For demos, set `min_machines_running = 1` and redeploy.
