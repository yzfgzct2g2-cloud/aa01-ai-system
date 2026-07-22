import assert from "node:assert/strict";
import test from "node:test";

import { createDraftId } from "../src/persistence/draftId.ts";

function withCrypto<T>(cryptoValue: Partial<Crypto> | undefined, run: () => T): T {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, "crypto");
  Object.defineProperty(globalThis, "crypto", {
    configurable: true,
    value: cryptoValue,
  });
  try {
    return run();
  } finally {
    if (descriptor) Object.defineProperty(globalThis, "crypto", descriptor);
    else delete (globalThis as { crypto?: Crypto }).crypto;
  }
}

test("crypto.randomUUID 存在時優先使用原生 draftId", () => {
  const id = withCrypto({
    randomUUID: () => "11111111-1111-4111-8111-111111111111",
    getRandomValues: () => { throw new Error("不應呼叫 getRandomValues"); },
  } as Partial<Crypto>, () => createDraftId());

  assert.equal(id, "11111111-1111-4111-8111-111111111111");
});

test("非安全環境缺少 randomUUID 時仍可建立 draftId", () => {
  const id = withCrypto({
    getRandomValues: <T extends ArrayBufferView | null>(array: T) => array,
  } as Partial<Crypto>, () => createDraftId());

  assert.ok(id.length > 0);
});

test("getRandomValues fallback 產生有效 RFC 4122 v4 UUID", () => {
  const id = withCrypto({
    getRandomValues: <T extends ArrayBufferView | null>(array: T) => {
      const bytes = array as Uint8Array;
      bytes.forEach((_, index) => { bytes[index] = index; });
      return array;
    },
  } as Partial<Crypto>, () => createDraftId());

  assert.match(id, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
});

test("randomUUID 與 getRandomValues 都不存在時不拋錯", () => {
  assert.doesNotThrow(() => withCrypto({}, () => createDraftId()));
});

test("最後 fallback 不回傳空字串", () => {
  const id = withCrypto(undefined, () => createDraftId());
  assert.ok(id.trim().length > 0);
});

test("最後 fallback 連續建立多個 ID 不重複", () => {
  const ids = withCrypto({}, () =>
    Array.from({ length: 100 }, () => createDraftId())
  );
  assert.equal(new Set(ids).size, ids.length);
});

test("randomUUID 或 getRandomValues 拋錯時使用最後 fallback", () => {
  const id = withCrypto({
    randomUUID: () => { throw new Error("not allowed"); },
    getRandomValues: () => { throw new Error("not allowed"); },
  } as Partial<Crypto>, () => createDraftId());

  assert.match(id, /^local-draft-/);
});
