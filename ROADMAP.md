# Roadmap

Doxia is in **free beta**. This page tracks what has shipped and what comes next. Feature status matches the badges on the in-app [Features](app/features/page.tsx) page.

## Shipped

### Jan 2026: Foundation
- Next.js web app, landing page, and clinician dashboard
- Microservice backend: API gateway, user service (auth, notes), scribe service
- Docker Compose setup for local development, with internal-only ports for Postgres, Redis, and RabbitMQ
- Ambient listening: record an encounter in the browser, stream it to the scribe service over WebSocket
- Structured note generation (SOAP, DAP, BIRP) with PII scrubbing on transcripts

### Apr 2026: Better transcripts
- Speaker diarization (who said what) for clinician / patient turns

### Apr–May 2026: EHR integrations
- EHR service with SMART on FHIR OAuth (PKCE) for Epic and Cerner / Oracle Health
- Encrypted token storage and an Integrations page in the dashboard

### May 2026: Accounts and deployment
- Google sign-in, with automatic linking to existing email accounts
- Redesigned home screen and Features page with live / beta / roadmap labels
- Backend on Fly.io with GitHub Actions deploys; frontend on Vercel

### Oct 2026: Open source
- README and MIT license
- Repo cleanup: build output (`dist/`, `venv/`, `*.tsbuildinfo`) no longer tracked

## Current feature status

| Feature | Status |
|---------|--------|
| Ambient listening | Live |
| SOAP / DAP / BIRP reporting | Live |
| Fast note generation | Live |
| Privacy-first design (no audio retention, PII scrubbing) | Live |
| Custom template engine | Beta |
| EHR compatibility (copy-paste works everywhere; Epic / Cerner OAuth) | Beta |
| Local & multi-language | Beta |
| Team collaboration | Roadmap |

## Up next

### Now
- **Tests:** unit tests for note generation and auth, and an e2e test for the record → note → save flow
- **Database migrations:** replace TypeORM auto-sync (`TYPEORM_SYNC`) with versioned migrations

### Next
- **Direct EHR push:** send a finished note from the scribe straight to Epic / Cerner (now: copy to clipboard)
- **Custom templates out of beta:** template builder polish and template sharing
- **Multi-language out of beta:** wider language coverage and accuracy checks

### Later
- **Team collaboration:** share notes with a care team, assign tasks, and support multi-provider workflows
- **HIPAA compliance:** BAAs, audit logging, and a security review
- **Message broker in production:** a managed RabbitMQ (or equivalent) for async scribe jobs

## Contributing

Want to help with something on this list? Open an issue to discuss it first, then send a PR. See the [README](README.md) for local setup.
