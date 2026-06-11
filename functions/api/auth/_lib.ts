/**
 * Shared auth helpers for Cloudflare Functions.
 * Used by login.ts, me.ts, and any protected API routes.
 */

export interface AdminUser {
  id: number;
  username: string;
  email: string;
  role: "superadmin" | "editor" | "viewer";
  is_active: number;
}

export interface TokenPayload {
  sub: string;       // username
  uid: number;       // user id
  role: string;
  iat: number;
  exp: number;
}

const ENCODER = new TextEncoder();

// ─── Password Helpers ─────────────────────────────────────────────────────────

export async function hashPassword(password: string, saltHex: string): Promise<string> {
  const saltBytes = hexToBytes(saltHex);
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    ENCODER.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const derivedBits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: saltBytes, iterations: 100000, hash: "SHA-256" },
    keyMaterial,
    256
  );
  return bytesToHex(new Uint8Array(derivedBits));
}

export function generateSalt(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return bytesToHex(bytes);
}

// ─── Token Helpers ────────────────────────────────────────────────────────────

export async function createToken(payload: TokenPayload, secret: string): Promise<string> {
  const data = JSON.stringify(payload);
  const key = await hmacKey(secret);
  const signature = await crypto.subtle.sign("HMAC", key, ENCODER.encode(data));
  const payloadB64 = btoa(data);
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(signature)));
  return `${payloadB64}.${sigB64}`;
}

export async function verifyToken(token: string, secret: string): Promise<TokenPayload | null> {
  try {
    const [payloadB64, sigB64] = token.split(".");
    if (!payloadB64 || !sigB64) return null;

    const data = atob(payloadB64);
    const key = await hmacKey(secret);
    const expectedSig = await crypto.subtle.sign("HMAC", key, ENCODER.encode(data));
    const expectedSigB64 = btoa(String.fromCharCode(...new Uint8Array(expectedSig)));

    if (sigB64 !== expectedSigB64) return null;

    const payload: TokenPayload = JSON.parse(data);
    if (payload.exp < Math.floor(Date.now() / 1000)) return null; // expired

    return payload;
  } catch {
    return null;
  }
}

export function getTokenFromRequest(request: Request): string | null {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  return authHeader.slice(7);
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    ENCODER.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

export function getCorsHeaders(origin?: string | null) {
  const allowed = [
    "http://localhost:5173",
    "http://localhost:8788",
    "https://admin-signova.pages.dev",
    "https://admin.signova.in",
  ];
  if (origin && (allowed.includes(origin) || origin.endsWith(".pages.dev"))) {
    return {
      "Access-Control-Allow-Origin": origin,
      "Content-Type": "application/json",
    };
  }
  return {
    "Access-Control-Allow-Origin": "https://admin.signova.in",
    "Content-Type": "application/json",
  };
}

export const CORS_HEADERS = getCorsHeaders();

export function jsonResponse(data: unknown, status = 200, origin?: string): Response {
  return new Response(JSON.stringify(data), { status, headers: getCorsHeaders(origin) });
}

export function corsOptions(request?: Request): Response {
  const origin = request?.headers.get("Origin");
  const headers = getCorsHeaders(origin);
  return new Response(null, {
    status: 204,
    headers: {
      ...headers,
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    },
  });
}

export function getSecret(env: any): string {
  const secret = env.ADMIN_SECRET;
  if (!secret) {
    console.warn("WARNING: ADMIN_SECRET environment variable is not set. Using insecure fallback. Set ADMIN_SECRET in production.");
    return "signova-admin-secret-change-me";
  }
  return secret;
}

export async function requireSuperadmin(request: Request, env: any) {
  const token = getTokenFromRequest(request);
  if (!token) return null;
  const payload = await verifyToken(token, getSecret(env));
  if (!payload || payload.role !== "superadmin") return null;
  return payload;
}

export async function requireAdmin(request: Request, env: any) {
  const token = getTokenFromRequest(request);
  if (!token) return null;
  const payload = await verifyToken(token, getSecret(env));
  if (!payload) return null;
  return payload;
}

export function serverError(err: any, origin?: string): Response {
  console.error("Server error:", err);
  return jsonResponse({ error: "Internal server error." }, 500, origin);
}
