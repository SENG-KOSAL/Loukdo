import { randomBytes, scryptSync, timingSafeEqual } from "crypto"

export function hash(password: string): string {
  const s = randomBytes(16).toString("hex")
  const key = scryptSync(password, s, 64)
  return `${s}:${key.toString("hex")}`
}

export function verify(password: string, stored: string): boolean {
  const [s, keyHex] = stored.split(":")
  if (!s || !keyHex) return false
  const key = Buffer.from(keyHex, "hex")
  const derived = scryptSync(password, s, 64)
  return derived.length === key.length && timingSafeEqual(derived, key)
}

export function generatePassword(): string {
  return randomBytes(4).toString("hex")
}
