import {
  hashPassword,
  generateSalt,
  jsonResponse,
  corsOptions,
} from "./_lib";

interface Env {
  DB: D1Database;
}

interface UserRow {
  id: number;
  username: string;
  email: string;
}

// GET /api/auth/reset-password?token=... — verify token validity
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const url = new URL(context.request.url);
    const token = url.searchParams.get("token");

    if (!token?.trim()) {
      return jsonResponse({ error: "Token is required." }, 400);
    }

    const user = await context.env.DB.prepare(
      "SELECT id, username FROM admin_users WHERE reset_token = ? AND reset_token_expires > datetime('now')"
    )
      .bind(token.trim())
      .first<UserRow>();

    if (!user) {
      return jsonResponse({ error: "Invalid or expired token." }, 400);
    }

    return jsonResponse({ valid: true });
  } catch (err: any) {
    console.error("Verify token error:", err);
    return jsonResponse({ error: "Server error." }, 500);
  }
};

// POST /api/auth/reset-password — perform password reset
export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { token, password }: { token: string; password: string } =
      await context.request.json();

    if (!token?.trim() || !password?.trim()) {
      return jsonResponse({ error: "Token and password are required." }, 400);
    }

if (password.length < 6) {
  return jsonResponse({ error: "Password must be at least 6 characters." }, 400);
    }

    // Verify token and find user
    const user = await context.env.DB.prepare(
      "SELECT id FROM admin_users WHERE reset_token = ? AND reset_token_expires > datetime('now')"
    )
      .bind(token.trim())
      .first<{ id: number }>();

    if (!user) {
      return jsonResponse({ error: "Invalid or expired token." }, 400);
    }

    // Hash the new password
    const salt = generateSalt();
    const hash = await hashPassword(password, salt);

    // Update password and invalidate reset token
    await context.env.DB.prepare(
      "UPDATE admin_users SET password_hash = ?, password_salt = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?"
    )
      .bind(hash, salt, user.id)
      .run();

    return jsonResponse({ success: true, message: "Password updated successfully." });
  } catch (err: any) {
    console.error("Reset password error:", err);
    return jsonResponse({ error: "Server error." }, 500);
  }
};

export const onRequestOptions: PagesFunction = async (context) => corsOptions(context.request);
