import { NextResponse } from "next/server";
import { metricSnapshot } from "@/lib/observability";

function isAuthorized(req: Request) {
  const token = process.env.METRICS_TOKEN;
  if (!token) return process.env.NODE_ENV !== "production";
  return req.headers.get("authorization") === `Bearer ${token}`;
}

function toPrometheusText(snapshot: ReturnType<typeof metricSnapshot>) {
  const lines: string[] = [];
  lines.push("# HELP menuly_uptime_ms Process uptime in milliseconds");
  lines.push("# TYPE menuly_uptime_ms gauge");
  lines.push(`menuly_uptime_ms ${snapshot.uptimeMs}`);

  lines.push("# HELP menuly_counter_total Internal counter values");
  lines.push("# TYPE menuly_counter_total counter");
  for (const [key, value] of Object.entries(snapshot.counters)) {
    const metricName = key
      .replace(/[^a-zA-Z0-9_]/g, "_")
      .replace(/_{2,}/g, "_")
      .replace(/^_+|_+$/g, "");
    lines.push(`menuly_${metricName} ${value}`);
  }

  return `${lines.join("\n")}\n`;
}

export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const snapshot = metricSnapshot();
  return new NextResponse(toPrometheusText(snapshot), {
    headers: {
      "content-type": "text/plain; version=0.0.4; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}
