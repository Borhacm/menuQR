import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { openai } from "@/lib/ai/client";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const membership = await db.membership.findFirst({
    where: { userId: session.user.id },
    include: { organization: { include: { resources: true } } },
  });
  const resource = membership?.organization.resources[0];
  if (!resource) return NextResponse.json({ error: "No resource" }, { status: 404 });

  const job = await db.translationJob.create({
    data: {
      resourceId: resource.id,
      payload: { kind: "resource-name", resourceName: resource.name },
      status: "RUNNING",
    },
  });

  try {
    let translated = `${resource.name} (ES)`;
    if (process.env.OPENAI_API_KEY) {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "Translate restaurant menu labels in culinary context. Output only translated text.",
          },
          { role: "user", content: `Translate to Spanish: ${resource.name}` },
        ],
      });
      translated = completion.choices[0]?.message?.content?.trim() || translated;
    }

    await db.translation.upsert({
      where: {
        entityType_entityId_locale_field: {
          entityType: "RESOURCE",
          entityId: resource.id,
          locale: "es",
          field: "name",
        },
      },
      update: { value: translated, source: "AI" },
      create: {
        entityType: "RESOURCE",
        entityId: resource.id,
        locale: "es",
        field: "name",
        value: translated,
        source: "AI",
      },
    });

    await db.translationJob.update({
      where: { id: job.id },
      data: { status: "DONE", finishedAt: new Date() },
    });
  } catch (error) {
    await db.translationJob.update({
      where: { id: job.id },
      data: {
        status: "FAILED",
        error: error instanceof Error ? error.message : "Unknown error",
        finishedAt: new Date(),
      },
    });
    return NextResponse.json({ error: "Translation failed" }, { status: 500 });
  }

  return NextResponse.redirect(new URL("/app/translations", process.env.NEXT_PUBLIC_APP_URL));
}
