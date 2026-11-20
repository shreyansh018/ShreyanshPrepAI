# Deployment status

## Live URLs

| Component | URL |
|---|---|
| Frontend | https://shreyanshprepai.vercel.app |
| Backend API | https://shreyanshprepai-api.onrender.com |
| Backend health check | https://shreyanshprepai-api.onrender.com/healthz |
| Render dashboard | https://dashboard.render.com/web/srv-dc0a6j17lnhs73a5m21g |
| Vercel project | https://vercel.com/shreyanshs-projects-a4987237/shreyanshprepai |

## Verified

- Backend deploy is live on the Render free plan.
- `GET /healthz` returns `200 {"ok":true}`.
- CORS allows `https://shreyanshprepai.vercel.app` with credentials.
- Frontend production deployment is live on Vercel.
- The built frontend bundle points to the Render API URL, not localhost.
- MongoDB connects successfully from the deployed backend.
- Upstash Redis connects successfully from the deployed backend.
- `GET /api/me` with a fake session returns `401 {"message":"Session Expired"}`, confirming the Redis session lookup path works.
- All required Render environment variables are populated with non-placeholder values.

## Remaining external setup

Do not paste credentials into chat or commit them.

Complete these external setup steps:

1. Add `shreyanshprepai.vercel.app` to Firebase Authorized Domains.
2. Restrict the Firebase web API key by HTTP referrer.
3. Restrict the YouTube API key to YouTube Data API v3.
4. Keep Razorpay in test mode.
5. Rotate any credentials that were previously stored in local `.env` files or `serviceAccountKey.json`.

## Auto-deploy

- Render auto-deploy is enabled for `main` and deploys `backend/`.
- Vercel is connected to `shreyansh018/ShreyanshPrepAI` with production branch `main`.
- Vercel builds from the `frontend/` root directory using `npm run build` and output directory `dist`.
- Vercel environment variables are stored in the project for the Production environment.

## Free-tier notes

- Render free web services sleep after 15 minutes idle; the first request can take about a minute.
- MongoDB Atlas M0, Upstash free Redis, Groq free quota, and YouTube's default quota all have tight limits.
- This deployment is suitable for a demo/portfolio, not production traffic.
