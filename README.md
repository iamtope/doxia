# Doxia

Doxia is an AI clinical scribe. It records a clinical encounter, transcribes it, scrubs PII, and drafts structured notes (SOAP, DAP, BIRP) that clinicians can review, edit, and push to their EHR (Epic, Cerner / Oracle Health) via SMART on FHIR.

## Architecture

| Component | Path | Stack | Local port |
|-----------|------|-------|------------|
| Web app | `app/` | Next.js 14, React 18, Tailwind | 3000 |
| API gateway | `microservice-backend/api-gateway` | NestJS | 3003 |
| User service (auth, notes) | `microservice-backend/user-service` | NestJS, TypeORM, Postgres | 3002 |
| EHR service (SMART on FHIR) | `microservice-backend/ehr-service` | NestJS, TypeORM, Postgres | 3004 |
| Scribe service (transcription, note generation) | `microservice-backend/scribe-service` | FastAPI, OpenAI, spaCy, Redis | 8001 |

The browser talks to the gateway for auth, notes, and EHR routes, and directly to the scribe service for realtime transcription over WebSocket. Postgres, Redis, and RabbitMQ back the services in local development.

## Getting started

### Prerequisites

- Node.js 20+
- Docker and Docker Compose
- An OpenAI API key

### 1. Start the backend

```bash
cd microservice-backend
export JWT_SECRET=change-me
export TOKEN_ENCRYPTION_KEY=change-me
export OPENAI_API_KEY=sk-...
docker compose up --build
```

Google sign-in and Epic / Cerner integrations are optional; see `microservice-backend/GOOGLE_AUTH.md` and `microservice-backend/ehr-service/README.md` for the extra variables.

### 2. Start the web app

Create `.env.local` in the repo root:

```bash
NEXT_PUBLIC_GATEWAY_URL=http://localhost:3003
NEXT_PUBLIC_SCRIBE_SERVICE_URL=http://localhost:8001
NEXT_PUBLIC_SCRIBE_WS_URL=ws://localhost:8001
```

Then:

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Deployment

- Frontend: Vercel — see [DEPLOY.md](DEPLOY.md).
- Backend services: Fly.io, auto-deployed from `main` by GitHub Actions — see [docs/FLY_DEPLOY.md](docs/FLY_DEPLOY.md).

## Contributing

Issues and pull requests are welcome. Please keep PRs scoped to a single change and describe how to test it.

## License

[MIT](LICENSE)
