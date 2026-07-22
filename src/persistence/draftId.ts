let fallbackSequence = 0;

function formatUuid(bytes: Uint8Array) {
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function createDraftId(): string {
  let cryptoApi: Crypto | undefined;

  try {
    cryptoApi = globalThis.crypto;
  } catch {
    cryptoApi = undefined;
  }

  if (typeof cryptoApi?.randomUUID === "function") {
    try {
      const draftId = cryptoApi.randomUUID();
      if (draftId) return draftId;
    } catch {
      // Continue to the secure random byte fallback.
    }
  }

  if (typeof cryptoApi?.getRandomValues === "function") {
    try {
      const bytes = cryptoApi.getRandomValues(new Uint8Array(16));
      bytes[6] = (bytes[6] & 0x0f) | 0x40;
      bytes[8] = (bytes[8] & 0x3f) | 0x80;
      return formatUuid(bytes);
    } catch {
      // Continue to the final local-only fallback.
    }
  }

  fallbackSequence += 1;
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2) || "0";
  return `local-draft-${timestamp}-${fallbackSequence.toString(36)}-${random}`;
}
