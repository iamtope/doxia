# Google sign-in setup

## Google Cloud Console

1. Create an OAuth 2.0 **Web application** client.
2. **Authorized redirect URIs** (must match exactly):
   - Local: `http://localhost:3003/auth/google/callback`
   - Production: `https://<your-gateway-host>/auth/google/callback`
3. Copy **Client ID** and **Client secret**.

## Environment variables

Add to `microservice-backend/.env` (used by `docker-compose`):

```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3003/auth/google/callback
AUTH_FRONTEND_CALLBACK_URL=http://localhost:3000/auth/callback
```

Restart `user-service` after changing env vars.

## Flow

1. User clicks **Continue with Google** on `/login` or `/signup`.
2. Browser → `GET /auth/google` (gateway) → Google consent.
3. Google → `GET /auth/google/callback` (gateway → user-service).
4. user-service issues the same JWT as email login and redirects to `/auth/callback?access_token=...&user=...`.
5. Frontend stores token via `AuthContext.login()` and opens the dashboard.

## Account linking

- Same email as an existing password account → Google is linked automatically; both sign-in methods work.
- Google-only accounts have no password; email login shows a message to use Google.
