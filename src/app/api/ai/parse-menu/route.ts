import { NextResponse } from "next/server";
import { openai } from "@/lib/ai/client";
import { auth } from "@/auth";
import { checkRateLimit, getClientIpFromHeaders } from "@/lib/rate-limit";
import { logEvent, metricIncr } from "@/lib/observability";
import { isTrustedRequestOrigin } from "@/lib/security/request-origin";

const MAX_IMAGE_SIZE_BYTES = 8 * 1024 * 1024;
const ALLOWED_IMAGE_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(req: Request) {
  if (!isTrustedRequestOrigin(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const ip = getClientIpFromHeaders(req.headers);
  const rl = checkRateLimit({
    key: `ai-parse:${session.user.id}:${ip}`,
    limit: 10,
    windowMs: 10 * 60 * 1000,
  });
  if (!rl.allowed) {
    metricIncr("ai_parse_rate_limited_total");
    return NextResponse.json({ error: "Too many parse requests" }, { status: 429 });
  }

  const formData = await req.formData();
  const image = formData.get("image");
  if (!(image instanceof File)) {
    return NextResponse.json({ error: "image file required" }, { status: 400 });
  }
  if (!ALLOWED_IMAGE_MIME.has(image.type)) {
    return NextResponse.json({ error: "unsupported image type" }, { status: 400 });
  }
  if (image.size > MAX_IMAGE_SIZE_BYTES) {
    return NextResponse.json({ error: "image too large (max 8MB)" }, { status: 400 });
  }

  if (!process.env.OPENAI_API_KEY) {
    metricIncr("ai_parse_mock_total");
    return NextResponse.json({
      categories: [
        {
          name: "Starters",
          items: [{ name: "Bruschetta", description: "Tomato and basil", prices: [7.5] }],
        },
      ],
    });
  }

  const bytes = await image.arrayBuffer();
  const b64 = Buffer.from(bytes).toString("base64");
  const mime = image.type || "image/jpeg";

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content:
          "Extract menu into JSON with shape {categories:[{name,items:[{name,description,prices:number[]}]}]}.",
      },
      {
        role: "user",
        content: [
          { type: "text", text: "Parse this menu image." },
          {
            type: "image_url",
            image_url: { url: `data:${mime};base64,${b64}` },
          },
        ],
      },
    ],
    response_format: { type: "json_object" },
  });

  const payload = completion.choices[0]?.message?.content;
  metricIncr("ai_parse_success_total");
  logEvent("info", "ai.parse.success", {
    userId: session.user.id,
    mime,
    size: image.size,
  });
  return NextResponse.json(payload ? JSON.parse(payload) : { categories: [] });
}
