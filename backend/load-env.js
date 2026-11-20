import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const backendRoot = path.dirname(fileURLToPath(import.meta.url));

process.env.DOTENV_CONFIG_QUIET ||= "true";

// The first file wins for duplicated keys. Platform-injected environment
// variables always win because dotenv does not override existing values.
const envFiles = [
  path.join(backendRoot, ".env"),
  path.join(backendRoot, "gateway", ".env"),
  path.join(backendRoot, "services", "auth", ".env"),
  path.join(backendRoot, "services", "resume", ".env"),
  path.join(backendRoot, "services", "interview", ".env"),
  path.join(backendRoot, "services", "roadmap", ".env"),
  path.join(backendRoot, "services", "billing", ".env"),
];

for (const envFile of envFiles) {
  if (fs.existsSync(envFile)) {
    dotenv.config({ path: envFile, override: false });
  }
}
