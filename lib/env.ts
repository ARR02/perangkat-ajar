/**
 * Environmental Variable Helper & Server Boundary Safeguard
 */

export const env = {
  get DATABASE_URL() {
    return process.env.DATABASE_URL || "";
  },
  get AI_PROVIDER() {
    return process.env.AI_PROVIDER || "gemini";
  },
  get STORAGE_URL() {
    return process.env.STORAGE_URL || "";
  },
  get AUTH_SECRET() {
    return process.env.AUTH_SECRET || "";
  },
  // API Key hanya boleh diakses server-side
  get AI_API_KEY() {
    if (typeof window !== "undefined") {
      throw new Error("SECURITY WARNING: AI_API_KEY cannot be accessed from client-side code.");
    }
    return process.env.AI_API_KEY || "";
  },
};
