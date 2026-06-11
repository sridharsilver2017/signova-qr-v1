import {
  generateSalt,
  jsonResponse,
  corsOptions,
} from "./_lib";

interface Env {
  DB: D1Database;
  BREVO_API_KEY?: string;
  BREVO_FROM_EMAIL?: string;
}

interface UserRow {
  id: number;
  username: string;
  email: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body: any = await context.request.json();
    const email = body?.email;

    if (typeof email !== "string" || !email?.trim()) {
      return jsonResponse({ error: "Email is required." }, 400);
    }

    // Look up user by email
    const user = await context.env.DB.prepare(
      "SELECT id, username, email FROM admin_users WHERE email = ?"
    )
      .bind(email.trim().toLowerCase())
      .first<UserRow>();

    if (!user) {
      return jsonResponse({ error: "No account found with this email address." }, 404);
    }

    // Generate secure reset token
    const token = generateSalt();
    
    // Update in DB with 1 hour expiration
    await context.env.DB.prepare(
      "UPDATE admin_users SET reset_token = ?, reset_token_expires = datetime('now', '+1 hour') WHERE id = ?"
    )
      .bind(token, user.id)
      .run();

    // Determine base URL from request origin/referer
    const referer = context.request.headers.get("referer");
    let baseUrl = "http://localhost:5173";
    if (referer) {
      try {
        const urlObj = new URL(referer);
        baseUrl = urlObj.origin;
      } catch (_) {}
    }
    
    const resetLink = `${baseUrl}/reset-password?token=${token}`;
    console.log(`\n========================================\n[PASSWORD RESET LINK FOR ${user.username} (${user.email})]:\n${resetLink}\n========================================\n`);


    // Send email if Brevo API Key is configured
    const brevoApiKey = context.env.BREVO_API_KEY;
    if (brevoApiKey) {
      const fromEmail = context.env.BREVO_FROM_EMAIL || "no-reply@signova.in";
      const emailRes = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "accept": "application/json",
          "api-key": brevoApiKey,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          sender: { name: "Signova Admin", email: fromEmail },
          to: [{ email: user.email }],
          subject: "Reset your Signova Admin Password",
          htmlContent: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
              <h2 style="color: #0f172a; margin-bottom: 16px;">Reset Your Password</h2>
              <p style="color: #475569; font-size: 16px; line-height: 24px;">
                Hello ${user.username},
              </p>
              <p style="color: #475569; font-size: 16px; line-height: 24px;">
                You requested a password reset for your Signova Admin account. Click the button below to set a new password:
              </p>
              <div style="margin: 24px 0;">
                <a href="${resetLink}" style="background-color: #2563eb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">
                  Reset Password
                </a>
              </div>
              <p style="color: #64748b; font-size: 14px; line-height: 20px;">
                If the button above does not work, copy and paste this URL into your browser:
              </p>
              <p style="color: #2563eb; font-size: 14px; word-break: break-all;">
                ${resetLink}
              </p>
              <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
              <p style="color: #94a3b8; font-size: 12px; line-height: 16px;">
                This link will expire in 1 hour. If you did not request a password reset, you can safely ignore this email.
              </p>
            </div>
          `,
        }),
      });

      if (!emailRes.ok) {
        const errText = await emailRes.text();
        console.error("Brevo API failed:", errText);
      }
    }

    return jsonResponse({
      message: "A password reset link has been sent to your email address.",
    });
  } catch (err: any) {
    console.error("Forgot password error:", err);
    const origin = context.request.headers.get("Origin");
    return jsonResponse({ error: "Server error." }, 500, origin || undefined);
  }
};

export const onRequestOptions: PagesFunction = async (context) => corsOptions(context.request);
