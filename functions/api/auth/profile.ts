import {
  verifyToken,
  getTokenFromRequest,
  hashPassword,
  generateSalt,
  jsonResponse,
  corsOptions,
  getSecret,
  getCorsHeaders,
} from "./_lib";

interface Env {
  DB: D1Database;
  ADMIN_SECRET: string;
}

interface UserRow {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  password_salt: string;
}

export const onRequestPut: PagesFunction<Env> = async (context) => {
  try {
    const token = getTokenFromRequest(context.request);
    if (!token) return jsonResponse({ error: "Unauthorized." }, 401);

    const secret = getSecret(context.env);
    const actor = await verifyToken(token, secret);
    if (!actor) return jsonResponse({ error: "Unauthorized." }, 401);

    const data: any = await context.request.json();
    const { username, email, currentPassword, newPassword, avatar_url, full_name, contact_no } = data;

    if (!currentPassword) {
      return jsonResponse({ error: "Current password is required to save changes." }, 400);
    }

    // Fetch user row
    const user = await context.env.DB.prepare(
      "SELECT id, username, email, password_hash, password_salt, avatar_url FROM admin_users WHERE id = ?"
    )
      .bind(actor.uid)
      .first<UserRow & { avatar_url: string | null }>();

    if (!user) {
      return jsonResponse({ error: "User not found." }, 404);
    }

    // Verify current password
    const computedHash = await hashPassword(currentPassword, user.password_salt);
    if (computedHash !== user.password_hash) {
      return jsonResponse({ error: "Incorrect current password." }, 400);
    }

    const sets: string[] = [];
    const values: any[] = [];

    if (username?.trim()) {
      sets.push("username = ?");
      values.push(username.trim().toLowerCase());
    }

    if (email?.trim()) {
      sets.push("email = ?");
      values.push(email.trim().toLowerCase());
    }

    if (avatar_url !== undefined) {
      sets.push("avatar_url = ?");
      values.push(avatar_url ? avatar_url.trim() : null);
    }

    if (full_name !== undefined) {
      sets.push("full_name = ?");
      values.push(full_name ? full_name.trim() : null);
    }

    if (contact_no !== undefined) {
      sets.push("contact_no = ?");
      values.push(contact_no ? contact_no.trim() : null);
    }

    if (newPassword?.trim()) {
if (newPassword.length < 6) {
  return jsonResponse({ error: "New password must be at least 6 characters." }, 400);
      }
      const newSalt = generateSalt();
      const newHash = await hashPassword(newPassword, newSalt);
      sets.push("password_hash = ?", "password_salt = ?", "must_change_password = 0");
      values.push(newHash, newSalt);
    }

    if (sets.length === 0) {
      return jsonResponse({ error: "No changes to update." }, 400);
    }

    values.push(user.id);

    try {
      await context.env.DB.prepare(
        `UPDATE admin_users SET ${sets.join(", ")} WHERE id = ?`
      )
        .bind(...values)
        .run();
    } catch (err: any) {
      if (err.message?.includes("UNIQUE")) {
        return jsonResponse({ error: "Username or email already exists." }, 409);
      }
      throw err;
    }

    return jsonResponse({ success: true, message: "Profile updated successfully." });
  } catch (err: any) {
    console.error("Update profile error:", err);
    return jsonResponse({ error: "Server error." }, 500);
  }
};

export const onRequestOptions: PagesFunction = async (context) => corsOptions(context.request);
