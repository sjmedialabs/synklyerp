import { config } from "dotenv";
import { resolve } from "path";

/** Load .env.local first, then .env (matches Next.js precedence for local scripts). */
export function loadEnvFiles() {
  config({ path: resolve(process.cwd(), ".env.local") });
  config({ path: resolve(process.cwd(), ".env") });
}

loadEnvFiles();
