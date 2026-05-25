# Investor demo guide (5 minutes)

Use this script for live pitches. Stay on shipped features; avoid Team Sync, in-scribe Epic push, and edge-AI claims.

## One-liner

> Doxia is a privacy-conscious ambient scribe for independent clinicians: record the visit, get structured SOAP (or custom templates) in seconds, copy into any EHR. Beta is free with fair-use limits; HIPAA and direct EHR push are on the roadmap.

## Pre-demo setup

1. **Account:** Use Google sign-in or a pre-staged account (faster than email signup during the meeting).
2. **Backend:** Ensure `docker-compose up` and `npm run dev` are running; gateway at `NEXT_PUBLIC_GATEWAY_URL`.
3. **Mic:** Grant browser microphone permission before the call.
4. **Data:** Use a **scripted fake encounter** — do not use real patient PHI (beta is not HIPAA-certified).
5. **Optional demo account:** Create `demo@yourdomain.com` in staging and share credentials only in the meeting — never commit passwords to the repo.

## Demo path (~5 min)

| Step | Where | What to say / do |
|------|--------|------------------|
| 1 (30s) | Home `/` | Problem: documentation burden. Solution: ambient → structured note. Point at **DashboardPreview** and “What’s included in beta” — not the old Epic-connected mock. |
| 2 (30s) | Signup or pre-logged-in | “Free beta, no card. 30 min/session, 2 hrs total.” Skip signup if already logged in. |
| 3 (2 min) | `/dashboard/scribe` | Start recording → read 4–6 lines of scripted dialogue (e.g. back pain visit) → stop → show SOAP sections, diarization if enabled, billing codes. |
| 4 (45s) | Same page | **Copy to Clipboard** — paste into a text doc as “any EHR.” Do **not** click “Sync to Epic” (Soon). |
| 5 (30s) | `/dashboard/notes` | Show note saved to history. |
| 6 (30s) | `/dashboard/templates` | Custom/builtin templates — differentiation vs generic scribes. |
| 7 (30s) | FAQ on home or `/pricing` | HIPAA roadmap, PII scrubbing, beta limits. |
| Skip unless configured | `/dashboard/integrations` | Epic/Cerner OAuth only if sandbox credentials are set up. |

## Scripted encounter (example)

Read aloud after starting recording:

> Patient is a 45-year-old with lower back pain for three days after lifting. Pain seven out of ten, sharp, left hip. No numbness. Exam: tenderness L4-L5, flexion limited, straight leg raise negative, strength five out of five bilaterally. Plan: NSAIDs, PT referral, return if worsening.

## What not to demo

- Team Sync (coming soon)
- Sync to Epic from scribe (coming soon)
- Athena (not implemented)
- “Edge AI” / local-only processing (cloud pipeline)
- Real PHI

## If something breaks

- **Mic denied:** Refresh, check browser site settings.
- **Usage cap hit:** Explain 2-hour beta cap; use another test account.
- **Signup fails:** Use Google OAuth or pre-staged login.
- **Old signup API (no token):** Redeploy `user-service` so signup returns `access_token` + `user`.

## Links for investors after the call

- Product: `/signup`
- Beta limits: `/pricing`
- Features (with live/beta/roadmap badges): `/features`
