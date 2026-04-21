# ehr-service

A single SMART-on-FHIR microservice that connects Doxia to any R4 EHR on
behalf of the signed-in user. Ships with **Epic** and **Cerner / Oracle
Health** configured out of the box; new vendors are added by dropping a
`ProviderConfig` entry in `src/providers/provider-registry.ts` and setting the
corresponding env vars.

Responsibilities:

- Drive the OAuth 2.0 authorization-code + PKCE handshake against each
  supported EHR.
- Persist per-(user, provider) access/refresh tokens encrypted at rest
  (AES-256-GCM).
- Auto-refresh expiring access tokens on the fly.
- Expose a minimal FHIR helper API (Patient, Condition, AllergyIntolerance,
  MedicationRequest, Observation) and a write path for `DocumentReference`
  so generated notes land back in the chart.

The service is fronted by `api-gateway`; the Next.js app only ever talks to
`http://localhost:3003/ehr/*`, which proxies transparently (including the
302 redirects from `/authorize` and `/callback`).

## Endpoints

All endpoints except `/ehr/:provider/callback`, `/ehr/health`, and
`/ehr/providers` require a Doxia JWT (issued by `user-service`) via
`Authorization: Bearer <token>` or `?token=<token>` for the redirect
endpoints.

| Method | Path                                                  | Purpose                                         |
| ------ | ----------------------------------------------------- | ----------------------------------------------- |
| GET    | `/ehr/health`                                         | Liveness                                        |
| GET    | `/ehr/providers`                                      | Which providers are configured                  |
| GET    | `/ehr/connections`                                    | All of the caller's active EHR connections      |
| GET    | `/ehr/:provider/authorize`                            | 302 → provider authorize URL                    |
| GET    | `/ehr/:provider/launch?iss=&launch=`                  | EHR launch entry; 302 → authorize              |
| GET    | `/ehr/:provider/callback?code=&state=`                | OAuth callback                                  |
| GET    | `/ehr/:provider/connection`                           | Connection status for a single provider         |
| DELETE | `/ehr/:provider/connection`                           | Disconnect + wipe tokens for that provider      |
| GET    | `/ehr/:provider/patient/:id`                          | Read Patient                                    |
| GET    | `/ehr/:provider/patient/:id/conditions`               | Problem list (`Condition`)                      |
| GET    | `/ehr/:provider/patient/:id/allergies`                | `AllergyIntolerance`                            |
| GET    | `/ehr/:provider/patient/:id/medications`              | Active `MedicationRequest`                      |
| GET    | `/ehr/:provider/patient/:id/vitals`                   | Vital-signs `Observation`                       |
| POST   | `/ehr/:provider/patient/:id/document`                 | Push a note as `DocumentReference`              |

Supported `:provider` values are `epic` and `cerner`.

`POST /ehr/:provider/patient/:id/document` body:

```json
{
  "title": "Progress note 2026-04-20",
  "content": "SOAP content as plain text...",
  "contentType": "text/plain",
  "loincCode": "11506-3",
  "encounterId": "optional-encounter-fhir-id",
  "authorReference": "Practitioner/abc123"
}
```

## Adding a new provider

1. Add the key to `EhrProvider` and `SUPPORTED_PROVIDERS` in
   `src/providers/provider-registry.ts`.
2. Add a `DEFAULTS[...]` entry with the vendor's sandbox URLs and default
   scopes.
3. Set `<PROVIDER>_CLIENT_ID` and `<PROVIDER>_REDIRECT_URI` (plus optionally
   `_CLIENT_SECRET`, `_FHIR_BASE_URL`, `_AUTHORIZE_URL`, `_TOKEN_URL`,
   `_SCOPES`) in the env.

No service changes are required — the same `SmartAuthService` and
`FhirService` handle every vendor that speaks SMART on FHIR R4.

## Configuration

See `.env.example`. Keys split into:

- **Shared**: `JWT_SECRET`, `TOKEN_ENCRYPTION_KEY`, DB vars, frontend redirect
  URLs.
- **Epic**: `EPIC_CLIENT_ID`, `EPIC_REDIRECT_URI`, optional
  `EPIC_CLIENT_SECRET`, `EPIC_FHIR_BASE_URL`, `EPIC_AUTHORIZE_URL`,
  `EPIC_TOKEN_URL`, `EPIC_SCOPES`.
- **Cerner**: `CERNER_CLIENT_ID`, `CERNER_REDIRECT_URI`, optional
  `CERNER_CLIENT_SECRET`, `CERNER_FHIR_BASE_URL`, `CERNER_AUTHORIZE_URL`,
  `CERNER_TOKEN_URL`, `CERNER_SCOPES`.

Sandbox defaults (Epic's public sandbox, Cerner's public R4 sandbox tenant
`ec2458f2-1e24-41c8-b71b-0e701af7583d`) are baked in — you only need the
client IDs + redirect URIs to get started.

## Local development

```bash
cd microservice-backend
cp ehr-service/.env.example ehr-service/.env   # then fill in values
docker compose up --build ehr-service api-gateway user-service postgres
```

Then open `http://localhost:3000/dashboard/integrations` in the browser and
click **Connect** next to each EHR you want to test.

## Registering on each vendor

### Epic (https://fhir.epic.com)

1. Create a non-production app; copy the **Client ID** → `EPIC_CLIENT_ID`.
2. Application Audience **Clinicians**, FHIR version **R4**.
3. SMART scopes matching `EPIC_SCOPES` (default list in
   `provider-registry.ts`).
4. Redirect URI must exactly match `EPIC_REDIRECT_URI`
   (e.g. `http://localhost:3004/ehr/epic/callback`).
5. Enable **Standalone Launch** (and **EHR Launch** if you also want to be
   launchable from inside Epic).
6. Use the sandbox (`Fhir.R4.Api.Sandbox`) with
   [Epic's sandbox test patients](https://fhir.epic.com/Documentation?docId=testpatients).
7. When ready, submit for production review via Epic's Showroom process.

### Cerner / Oracle Health (https://code.cerner.com)

1. Sign up and **Create App**; set App Type **Provider**, FHIR **R4**.
2. Copy the **Client ID** → `CERNER_CLIENT_ID`.
3. Scopes matching `CERNER_SCOPES`.
4. Redirect URI must match `CERNER_REDIRECT_URI`
   (e.g. `http://localhost:3004/ehr/cerner/callback`).
5. The sandbox tenant is
   `ec2458f2-1e24-41c8-b71b-0e701af7583d`; the baked-in defaults target its
   R4 FHIR + authorization endpoints so you can start without further
   config.
6. Use
   [Cerner's sandbox test data](https://code.cerner.com/documentation/sandbox)
   to grab patient IDs.
7. When ready, submit for App Gallery review and register with each Cerner
   customer via Cerner Central.
