import {
  hashPassword,
  createToken,
  jsonResponse,
  corsOptions,
  getSecret,
  type TokenPayload,
} from "./_lib";

interface Env {
  DB: D1Database;
  ADMIN_SECRET: string;
}

interface AdminUserRow {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  password_salt: string;
  role: string;
  is_active: number;
  contact_no: string | null;
  must_change_password: number;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { username, password }: { username: string; password: string } =
      await context.request.json();

    if (!username?.trim() || !password?.trim()) {
      return jsonResponse({ error: "Username and password are required." }, 400);
    }

    // Look up user in D1
    const user = await context.env.DB.prepare(
      "SELECT id, username, email, password_hash, password_salt, role, is_active, avatar_url, full_name, contact_no, must_change_password FROM admin_users WHERE username = ? OR email = ? OR contact_no = ?"
    )
      .bind(username.trim().toLowerCase(), username.trim().toLowerCase(), username.trim().toLowerCase())
      .first<AdminUserRow & { avatar_url: string | null; full_name: string | null; contact_no: string | null }>();

    if (!user) {
      await new Promise((r) => setTimeout(r, 500)); // slow brute force
      return jsonResponse({ error: "Invalid username or password." }, 401);
    }

    if (!user.is_active) {
      return jsonResponse({ error: "Your account has been deactivated. Contact an administrator." }, 403);
    }

    // Verify password using PBKDF2
    const computedHash = await hashPassword(password, user.password_salt);
    if (computedHash !== user.password_hash) {
      await new Promise((r) => setTimeout(r, 500));
      return jsonResponse({ error: "Invalid username or password." }, 401);
    }

    // Build token
    const secret = getSecret(context.env);
    const now = Math.floor(Date.now() / 1000);
    const payload: TokenPayload = {
      sub: user.username,
      uid: user.id,
      role: user.role,
      iat: now,
      exp: now + 60 * 60 * 24 * 7, // 7 days
    };

    const token = await createToken(payload, secret);

    // Update last_login
    await context.env.DB.prepare(
      "UPDATE admin_users SET last_login = datetime('now') WHERE id = ?"
    )
      .bind(user.id)
      .run();

    return jsonResponse({
      token,
      mustChangePassword: !!user.must_change_password,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        avatar_url: user.avatar_url,
        full_name: user.full_name,
        contact_no: user.contact_no,
        must_change_password: !!user.must_change_password,
      },
    });
  } catch (err: any) {
    console.error("Login error:", err);
    const origin = context.request.headers.get("Origin");
    return jsonResponse({ error: "Server error." }, 500, origin || undefined);
  }
};

export const onRequestOptions: PagesFunction = async (context) => corsOptions(context.request);
