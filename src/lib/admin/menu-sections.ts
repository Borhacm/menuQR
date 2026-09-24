import { db } from "@/lib/db";

/**
 * In the admin UI each "category" is a Menu row whose dishes live in a single Category with the
 * same name. Older sections were created without that Category, so they never showed up in the
 * product form. Create the missing ones (idempotent, cheap when nothing is missing).
 */
export async function ensureMenuSectionCategories(resourceId: string) {
  const menusWithoutCategory = await db.menu.findMany({
    where: { resourceId, categories: { none: {} } },
    select: { id: true, name: true },
  });
  if (!menusWithoutCategory.length) return;
  await db.category.createMany({
    data: menusWithoutCategory.map((menu) => ({ menuId: menu.id, name: menu.name, position: 0 })),
  });
}
