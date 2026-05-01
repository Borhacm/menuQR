import { cookies } from "next/headers";
import { db } from "@/lib/db";

export const TENANT_COOKIE = "menuly_org";

function getPreferredOrganizationId(rawValue: string | undefined) {
  if (!rawValue) return null;
  const value = rawValue.trim();
  return value.length > 0 && value.length <= 64 ? value : null;
}

export async function resolveTenantMembership(userId: string) {
  const cookieStore = await cookies();
  const preferredOrgId = getPreferredOrganizationId(cookieStore.get(TENANT_COOKIE)?.value);

  if (preferredOrgId) {
    const selected = await db.membership.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId: preferredOrgId,
        },
      },
      include: {
        organization: {
          include: {
            resources: {
              orderBy: { createdAt: "asc" },
            },
            subscription: true,
          },
        },
      },
    });
    if (selected) return selected;
  }

  return db.membership.findFirst({
    where: { userId },
    orderBy: { createdAt: "asc" },
    include: {
      organization: {
        include: {
          resources: {
            orderBy: { createdAt: "asc" },
          },
          subscription: true,
        },
      },
    },
  });
}

export async function setTenantCookieForUser(userId: string, organizationId: string) {
  const membership = await db.membership.findUnique({
    where: {
      userId_organizationId: {
        userId,
        organizationId,
      },
    },
    select: { id: true },
  });
  if (!membership) return false;

  const cookieStore = await cookies();
  cookieStore.set(TENANT_COOKIE, organizationId, {
    path: "/",
    sameSite: "lax",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365,
  });
  return true;
}

