import "@testing-library/jest-dom/vitest";
import "fake-indexeddb/auto";
import { webcrypto } from "node:crypto";
Object.defineProperty(globalThis, "crypto", { value: webcrypto });

import { vi } from "vitest";
Object.defineProperty(window, "scrollTo", { value: vi.fn(), writable: true });
vi.stubGlobal(
  "fetch",
  vi.fn(async () => ({ ok: true })),
);
