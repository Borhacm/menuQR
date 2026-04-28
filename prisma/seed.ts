import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const ALLERGENS = [
  { code: "gluten", name: "Gluten", icon: "🌾" },
  { code: "crustaceans", name: "Crustaceans", icon: "🦐" },
  { code: "eggs", name: "Eggs", icon: "🥚" },
  { code: "fish", name: "Fish", icon: "🐟" },
  { code: "peanuts", name: "Peanuts", icon: "🥜" },
  { code: "soybeans", name: "Soybeans", icon: "🫘" },
  { code: "milk", name: "Milk", icon: "🥛" },
  { code: "nuts", name: "Tree nuts", icon: "🌰" },
  { code: "celery", name: "Celery", icon: "🥬" },
  { code: "mustard", name: "Mustard", icon: "🌭" },
  { code: "sesame", name: "Sesame", icon: "⚪" },
  { code: "sulphites", name: "Sulphites", icon: "🍷" },
  { code: "lupin", name: "Lupin", icon: "🌼" },
  { code: "molluscs", name: "Molluscs", icon: "🦪" },
];

async function main() {
  for (const a of ALLERGENS) {
    await db.allergen.upsert({
      where: { code: a.code },
      update: { name: a.name, icon: a.icon },
      create: a,
    });
  }
  console.log(`Seeded ${ALLERGENS.length} allergens`);
}

main()
  .then(() => db.$disconnect())
  .catch((e) => {
    console.error(e);
    db.$disconnect();
    process.exit(1);
  });
