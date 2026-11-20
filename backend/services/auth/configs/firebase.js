import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const loadServiceAccount = () => {
  const inline = process.env.FIREBASE_SERVICE_ACCOUNT;

  if (inline) {
    const value = inline.trim();
    const json = value.startsWith("{")
      ? value
      : Buffer.from(value, "base64").toString("utf8");
    return JSON.parse(json);
  }

  const candidates = [
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH,
    fileURLToPath(new URL("../serviceAccountKey.json", import.meta.url)),
    fileURLToPath(new URL("../../../../serviceAccountKey.json", import.meta.url)),
  ].filter(Boolean);

  for (const filePath of candidates) {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, "utf8"));
    }
  }

  throw new Error(
    "Firebase Admin credentials are missing. Set FIREBASE_SERVICE_ACCOUNT in the environment.",
  );
};

let cachedAuth = null;

// Initialize lazily so the API can still boot and report /healthz while
// credentials are being configured on a new deployment.
export const getFirebaseAuth = () => {
  if (cachedAuth) return cachedAuth;

  const serviceAccount = loadServiceAccount();
  const app =
    getApps().length > 0
      ? getApps()[0]
      : initializeApp({
          credential: cert(serviceAccount),
        });

  cachedAuth = getAuth(app);
  return cachedAuth;
};
