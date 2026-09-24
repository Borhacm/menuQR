import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";
import { buildWeeklySummary, weeklySummaryEmail, weeklySummaryRecipients } from "@/lib/analytics/weekly-summary";

export const maxDuration = 60;

// Called by Vercel Cron (vercel.json). Vercel sends `Authorization: Bearer $CRON_SECRET`;
// without that secret configured the route stays closed.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ skipped: "RESEND_API_KEY not configured" });
  }

  const recipients = await weeklySummaryRecipients();
  let sent = 0;
  const failures: string[] = [];
  for (const { email, resourceId } of recipients) {
    try {
      const summary = await buildWeeklySummary(resourceId);
      if (!summary) continue;
      const { subject, html } = weeklySummaryEmail(summary);
      await sendEmail({ to: email, subject, html });
      sent++;
    } catch (error) {
      failures.push(resourceId);
      console.error("[weekly-summary] failed", resourceId, error);
    }
  }
  return NextResponse.json({ recipients: recipients.length, sent, failures: failures.length });
}
