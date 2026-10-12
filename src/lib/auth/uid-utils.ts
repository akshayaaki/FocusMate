import crypto from "crypto";

export function authUidToUuid(uid: string): string {
  // Deterministic UUID from external Auth UID (Clerk / OAuth) via MD5 hash
  const hash = crypto.createHash("md5").update(uid).digest("hex");
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-${hash.slice(12, 16)}-${hash.slice(16, 20)}-${hash.slice(20, 32)}`;
}

// Backwards-compatible alias
export const firebaseUidToUuid = authUidToUuid;
export const clerkUidToUuid = authUidToUuid;
