import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";

export type UserSettings = {
  timezone: string;
  dateFormat: string;
  currencyFormat: string;
  notifications: {
    invites: boolean;
    billing: boolean;
    weekly: boolean;
  };
};

const defaultSettings: UserSettings = {
  timezone: "Europe/Madrid",
  dateFormat: "dd/mm/yyyy",
  currencyFormat: "EUR",
  notifications: {
    invites: true,
    billing: true,
    weekly: false,
  },
};
const DASHBOARD_CHECKLIST_HIDDEN_KEY = "dashboardChecklistHidden";

async function ensureUserSettingsTable() {
  await db.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "user_settings" (
      "user_id" TEXT PRIMARY KEY REFERENCES "User"(id) ON DELETE CASCADE ON UPDATE CASCADE,
      "timezone" TEXT,
      "date_format" TEXT,
      "currency_format" TEXT,
      "notifications_json" JSONB NOT NULL DEFAULT '{}'::jsonb,
      "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

function isMissingUserSettingsTable(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2021" &&
    typeof error.message === "string" &&
    error.message.includes("public.user_settings")
  );
}

function normalizeNotifications(value: unknown): UserSettings["notifications"] {
  const input =
    value && typeof value === "object"
      ? (value as Partial<UserSettings["notifications"]>)
      : {};
  return {
    invites: input.invites ?? defaultSettings.notifications.invites,
    billing: input.billing ?? defaultSettings.notifications.billing,
    weekly: input.weekly ?? defaultSettings.notifications.weekly,
  };
}

function rowToSettings(row: {
  timezone: string | null;
  dateFormat: string | null;
  currencyFormat: string | null;
  notificationsJson: unknown;
} | null): UserSettings {
  if (!row) return defaultSettings;
  return {
    timezone: row.timezone || defaultSettings.timezone,
    dateFormat: row.dateFormat || defaultSettings.dateFormat,
    currencyFormat: row.currencyFormat || defaultSettings.currencyFormat,
    notifications: normalizeNotifications(row.notificationsJson),
  };
}

export async function getUserSettings(userId: string): Promise<UserSettings> {
  let row: {
    timezone: string | null;
    dateFormat: string | null;
    currencyFormat: string | null;
    notificationsJson: unknown;
  } | null = null;
  try {
    row = await db.userSettings.findUnique({
      where: { userId },
      select: {
        timezone: true,
        dateFormat: true,
        currencyFormat: true,
        notificationsJson: true,
      },
    });
  } catch (error) {
    if (!isMissingUserSettingsTable(error)) throw error;
    await ensureUserSettingsTable();
    row = await db.userSettings.findUnique({
      where: { userId },
      select: {
        timezone: true,
        dateFormat: true,
        currencyFormat: true,
        notificationsJson: true,
      },
    });
  }
  return rowToSettings(row);
}

export async function saveUserSettings(userId: string, input: Partial<UserSettings>) {
  const current = await getUserSettings(userId);
  const next: UserSettings = {
    timezone: input.timezone ?? current.timezone,
    dateFormat: input.dateFormat ?? current.dateFormat,
    currencyFormat: input.currencyFormat ?? current.currencyFormat,
    notifications: input.notifications
      ? {
          invites: input.notifications.invites ?? current.notifications.invites,
          billing: input.notifications.billing ?? current.notifications.billing,
          weekly: input.notifications.weekly ?? current.notifications.weekly,
        }
      : current.notifications,
  };

  await db.userSettings.upsert({
    where: { userId },
    update: {
      timezone: next.timezone,
      dateFormat: next.dateFormat,
      currencyFormat: next.currencyFormat,
      notificationsJson: next.notifications,
    },
    create: {
      userId,
      timezone: next.timezone,
      dateFormat: next.dateFormat,
      currencyFormat: next.currencyFormat,
      notificationsJson: next.notifications,
    },
  });

  return next;
}

function readChecklistHidden(notificationsJson: unknown) {
  if (!notificationsJson || typeof notificationsJson !== "object") return false;
  const value = (notificationsJson as Record<string, unknown>)[DASHBOARD_CHECKLIST_HIDDEN_KEY];
  return value === true;
}

export async function getDashboardChecklistHidden(userId: string): Promise<boolean> {
  try {
    const row = await db.userSettings.findUnique({
      where: { userId },
      select: { notificationsJson: true },
    });
    return readChecklistHidden(row?.notificationsJson);
  } catch (error) {
    if (!isMissingUserSettingsTable(error)) throw error;
    await ensureUserSettingsTable();
    const row = await db.userSettings.findUnique({
      where: { userId },
      select: { notificationsJson: true },
    });
    return readChecklistHidden(row?.notificationsJson);
  }
}

export async function hideDashboardChecklist(userId: string) {
  const current = await getUserSettings(userId);
  const currentRow = await db.userSettings.findUnique({
    where: { userId },
    select: { notificationsJson: true },
  });
  const notificationsJson =
    currentRow?.notificationsJson && typeof currentRow.notificationsJson === "object"
      ? { ...(currentRow.notificationsJson as Record<string, unknown>) }
      : {};
  notificationsJson[DASHBOARD_CHECKLIST_HIDDEN_KEY] = true;
  const notificationsJsonInput = notificationsJson as Prisma.InputJsonValue;

  await db.userSettings.upsert({
    where: { userId },
    update: {
      timezone: current.timezone,
      dateFormat: current.dateFormat,
      currencyFormat: current.currencyFormat,
      notificationsJson: notificationsJsonInput,
    },
    create: {
      userId,
      timezone: current.timezone,
      dateFormat: current.dateFormat,
      currencyFormat: current.currencyFormat,
      notificationsJson: notificationsJsonInput,
    },
  });
}
