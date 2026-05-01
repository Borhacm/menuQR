import { Resend } from "resend";
import { brand } from "@/config/brand";

const apiKey = process.env.RESEND_API_KEY;
const from = process.env.RESEND_FROM ?? `${brand.name} <onboarding@menuly.test>`;

const resend = apiKey ? new Resend(apiKey) : null;

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  if (!resend) {
    console.log("[email] (no RESEND_API_KEY, logging only) →", to, "·", subject);
    console.log(html);
    return { id: "dev-log" };
  }
  return resend.emails.send({ from, to, subject, html });
}

export function verificationEmailHtml(url: string) {
  return `<!doctype html>
<html><body style="font-family:system-ui;margin:0;padding:32px;background:#fafafa;color:#0a0a0a">
  <div style="max-width:520px;margin:0 auto;background:white;border-radius:16px;padding:32px">
    <h1 style="margin:0 0 12px;font-size:20px">Welcome to ${brand.name}</h1>
    <p style="color:#52525b;line-height:1.6">Click the button below to verify your email and activate your account.</p>
    <p><a href="${url}" style="display:inline-block;margin-top:16px;background:#f97316;color:white;text-decoration:none;padding:12px 18px;border-radius:8px;font-weight:600">Verify email</a></p>
    <p style="color:#71717a;font-size:12px;margin-top:24px">If you didn't request this, you can ignore this email.</p>
  </div>
</body></html>`;
}

export function inviteEmailHtml({
  orgName,
  inviterName,
  url,
}: {
  orgName: string;
  inviterName: string;
  url: string;
}) {
  return `<!doctype html>
<html><body style="font-family:system-ui;margin:0;padding:32px;background:#fafafa;color:#0a0a0a">
  <div style="max-width:520px;margin:0 auto;background:white;border-radius:16px;padding:32px">
    <h1 style="margin:0 0 12px;font-size:20px">${inviterName} invited you to ${orgName}</h1>
    <p style="color:#52525b;line-height:1.6">Join their workspace on ${brand.name} to manage menus together.</p>
    <p><a href="${url}" style="display:inline-block;margin-top:16px;background:#f97316;color:white;text-decoration:none;padding:12px 18px;border-radius:8px;font-weight:600">Accept invitation</a></p>
  </div>
</body></html>`;
}

export function emailChangeConfirmationHtml({
  url,
  nextEmail,
}: {
  url: string;
  nextEmail: string;
}) {
  return `<!doctype html>
<html><body style="font-family:system-ui;margin:0;padding:32px;background:#fafafa;color:#0a0a0a">
  <div style="max-width:520px;margin:0 auto;background:white;border-radius:16px;padding:32px">
    <h1 style="margin:0 0 12px;font-size:20px">Confirm your new email</h1>
    <p style="color:#52525b;line-height:1.6">You requested to change your account email to <strong>${nextEmail}</strong>.</p>
    <p style="color:#52525b;line-height:1.6">Click the button below to confirm this change.</p>
    <p><a href="${url}" style="display:inline-block;margin-top:16px;background:#f97316;color:white;text-decoration:none;padding:12px 18px;border-radius:8px;font-weight:600">Confirm new email</a></p>
    <p style="color:#71717a;font-size:12px;margin-top:24px">If you didn't request this, you can ignore this email.</p>
  </div>
</body></html>`;
}
