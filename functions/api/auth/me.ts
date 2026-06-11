import { verifyToken, getTokenFromRequest, jsonResponse, corsOptions, getSecret } from "./_lib";

interface Env {
  DB: D1Database;
  ADMIN_SECRET: string;
}

interface AdminUserRow {
  id: number;
  username: string;
  email: string;
  role: string;
  is_active: number;
  last_login: string | null;
  created_at: string;
  avatar_url: string | null;
  full_name: string | null;
  contact_no: string | null;
  must_change_password: number;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const token = getTokenFromRequest(context.request);
    if (!token) return jsonResponse({ error: "Unauthorized." }, 401);

    const secret = getSecret(context.env);
    const payload = await verifyToken(token, secret);
    if (!payload) return jsonResponse({ error: "Invalid or expired token." }, 401);

    const user = await context.env.DB.prepare(
      "SELECT id, username, email, role, is_active, last_login, created_at, avatar_url, full_name, contact_no, must_change_password FROM admin_users WHERE id = ?"
    )
      .bind(payload.uid)
      .first<AdminUserRow>();

    if (!user || !user.is_active) {
      return jsonResponse({ error: "User not found or deactivated." }, 401);
    }

    return jsonResponse({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      last_login: user.last_login,
      created_at: user.created_at,
      avatar_url: user.avatar_url,
      full_name: user.full_name,
      contact_no: user.contact_no,
      must_change_password: !!user.must_change_password,
    });
  } catch (err: any) {
    console.error("me error:", err);
    return jsonResponse({ error: "Server error." }, 500);
  }
};

export const onRequestOptions: PagesFunction = async (context) => corsOptions(context.request);
