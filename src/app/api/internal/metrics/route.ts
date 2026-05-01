import { NextResponse } from "next/server";
import { metricSnapshot } from "@/lib/observability";

export async function GET(req: Request) {
  const token = process.env.METRICS_TOKEN;
  const requireToken = process.env.NODE_ENV === "production";
  if (!token && requireToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (token) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${token}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }
  return NextResponse.json(metricSnapshot());
}
