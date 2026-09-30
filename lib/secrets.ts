import { timingSafeEqual } from "node:crypto";

export function matchesSecret(provided: string | null | undefined, expected: string | undefined) {
  if (!provided || !expected || expected.length < 16) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
