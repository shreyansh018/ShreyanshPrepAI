# ShreyanshPrepAI

AI-powered resume scoring, interview practice, roadmap generation and billing.

## Architecture

```text
Browser
  -> React/Vite SPA (Vercel)
  -> Unified Express API (Render free web service)
       -> MongoDB Atlas M0
       -> Upstash Redis
       -> Firebase Admin
       -> Groq
       -> YouTube Data API
       -> Razorpay (test mode)
```

The backend exposes the original API prefixes:

- `/api/auth`
- `/api/me`
- `/api/resume`
- `/api/interview`
- `/api/roadmap`
- `/api/billing`
- `/healthz`

All five microservices are mounted into one Node process via `backend/server.js`. This avoids multi-service cold-start chains and keeps the deployment within free-tier limits.

## Local development

### Backend

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

If you do not create `backend/.env`, the loader will fall back to the existing service-level `.env` files for local development. For a clean deploy, create `backend/.env` with a single MongoDB database URI.

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Set `VITE_BACKEND_URL` to your local backend, for example `http://localhost:6000`.

## Environment variables

### Backend (`backend/.env` or platform secrets)

| Variable | Required | Description |
|---|---:|---|
| `PORT` | no | Injected by Render; defaults to `10000` |
| `NODE_ENV` | no | `production` recommended |
| `FRONTEND_URL` | yes | Frontend origin, comma-separated if multiple |
| `MONGODB_URL` | yes | MongoDB URI with one database name |
| `REDIS_URL` | yes | Upstash `rediss://` URL |
| `FIREBASE_SERVICE_ACCOUNT` | yes | Full service account JSON or base64 JSON |
| `GROQ_API_KEY` | yes | Groq API key |
| `YOUTUBE_API_KEY` | yes | YouTube Data API v3 key |
| `RAZORPAY_KEY_ID` | yes | Razorpay test key ID |
| `RAZORPAY_KEY_SECRET` | yes | Razorpay test key secret |

Firebase Admin may alternatively read `FIREBASE_SERVICE_ACCOUNT_PATH`, otherwise it falls back to the local `backend/services/auth/serviceAccountKey.json` file for development.

### Frontend (`frontend/.env`)

| Variable | Description |
|---|---|
| `VITE_BACKEND_URL` | Full deployed backend URL |
| `VITE_FIREBASE_APIKEY` | Firebase web API key |
| `VITE_RAZORPAY_KEY_ID` | Razorpay test key ID |

Vite embeds `VITE_*` variables at build time. Rebuild/redeploy the frontend after changing them.

## Free deployment

### 1. Prepare accounts

- GitHub: push this repository.
- MongoDB Atlas: create an M0 cluster and one database user.
- Upstash: create one free Redis database.
- Firebase: use the Spark plan; enable Google sign-in.
- Groq: create an API key.
- Google Cloud: enable YouTube Data API v3 and create an API key.
- Razorpay: use test keys.

Rotate any credentials that were previously stored in local `.env` files or `serviceAccountKey.json`.

### 2. Deploy the backend on Render

- New → Web Service → connect GitHub repo.
- Root directory: `backend`
- Runtime: Node 22
- Build command: `npm ci`
- Start command: `npm start`
- Plan: Free
- Health check path: `/healthz`
- Add all backend environment variables from the table above.

### 3. Deploy the frontend on Vercel

- Import the GitHub repo.
- Root directory: `frontend`
- Framework preset: Vite
- Build command: `npm run build`
- Output directory: `dist`
- Add the frontend environment variables.
- Deploy, then set the backend `FRONTEND_URL` to the Vercel URL and redeploy the backend.

### 4. Firebase and domain setup

- Add the Vercel domain to Firebase Authorized Domains.
- Restrict the Firebase web API key by HTTP referrer.
- Restrict the YouTube API key to YouTube Data API v3.
- Keep Razorpay in test mode.

## Smoke test

1. `GET /healthz` returns `{"ok":true}`.
2. Google sign-in works and sets the `session` cookie.
3. `GET /api/me` returns the current user.
4. Resume upload and scoring work.
5. Roadmap generation works.
6. Interview start, answer and report work.
7. Razorpay test payment adds coins.
8. Logout clears the session.
9. Wait 15 minutes and reload to verify Render cold-start behavior.

## Notes and limitations

- Render free web services sleep after 15 minutes idle; the first request takes about a minute.
- Free tier is intended for demos/portfolios, not production traffic.
- MongoDB M0 has 512 MB storage and shared compute.
- Groq free limits can produce `429` errors under load; AI responses are cached where possible and AI endpoints have a lightweight per-user rate limit.
- YouTube search is capped at 100 `search.list` calls/day by default; resource lookups are cached for 7 days.
- Razorpay test mode does not move real money. Live payments charge Razorpay fees.
- Coins are credited by the backend only after Razorpay signature verification. The old client-callable `/api/auth/add-coins` route has been removed.
- Do not commit `.env` files or service account JSON files.
