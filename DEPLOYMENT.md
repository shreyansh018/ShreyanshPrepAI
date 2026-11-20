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

## Required before the app is fully functional

The backend was created with placeholder values for these Render environment variables:

- `MONGODB_URL`
- `REDIS_URL`
- `FIREBASE_SERVICE_ACCOUNT`
- `GROQ_API_KEY`
- `YOUTUBE_API_KEY`
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`

Update them in the Render dashboard, then trigger a redeploy. Do not paste real credentials into chat or commit them.

Also complete these external setup steps:

1. Add `shreyanshprepai.vercel.app` to Firebase Authorized Domains.
2. Restrict the Firebase web API key by HTTP referrer.
3. Restrict the YouTube API key to YouTube Data API v3.
4. Keep Razorpay in test mode.
5. Rotate any credentials that were previously stored in local `.env` files or `serviceAccountKey.json`.

## Auto-deploy

- Render auto-deploy is enabled for `main`.
- Vercel environment variables are stored in the project, but Git auto-deploy was not connected because the Vercel account needs a GitHub login connection. Connect it from the Vercel project settings if desired.

## Free-tier notes

- Render free web services sleep after 15 minutes idle; the first request can take about a minute.
- MongoDB Atlas M0, Upstash free Redis, Groq free quota, and YouTube's default quota all have tight limits.
- This deployment is suitable for a demo/portfolio, not production traffic.
