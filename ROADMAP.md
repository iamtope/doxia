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

- **Edit by voice:** dictate changes to a draft note ("add ibuprofen 400 mg to the plan")

### Next
- **Direct EHR push:** send a finished note from the scribe straight to Epic / Cerner (now: copy to clipboard)
- **Pre-charting from the EHR:** pull problems, medications, and allergies over FHIR before the visit so notes start with context
- **Custom templates out of beta:** template builder polish, plus a shared library of specialty templates (psychiatry, pediatrics, physiotherapy, dermatology)
- **Multi-language out of beta:** wider language coverage, and notes in English from visits held in another language
- **Coding suggestions:** ICD-10 and CPT suggestions with the transcript evidence for each code
- **More EHRs:** athenahealth, eClinicalWorks, and other SMART on FHIR systems

### Later
- **Patient after-visit summaries:** plain-language summaries and instructions in the patient's own language
- **Referral and follow-up letters:** generated from the note in one click
- **Mobile app:** record on a phone, with offline capture that uploads when back online
- **Team collaboration:** share notes with a care team, assign tasks, and support multi-provider workflows
- **Clinic accounts:** organization admin, SSO (SAML / OIDC), seat billing, and usage analytics (time saved per clinician)
- **On-device transcription:** process audio locally so it never leaves the clinic
- **Compliance:** HIPAA BAAs, GDPR, audit logging, and SOC 2

## Contributing

Want to help with something on this list? Open an issue to discuss it first, then send a PR. See the [README](README.md) for local setup.
