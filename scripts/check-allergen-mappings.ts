import { db } from "@/lib/db";
import {
  getAllergenLocalizationCodes,
  hasAllergenLocalization,
  normalizeAllergenCode,
} from "@/lib/allergens";

type CheckResult = {
  checked: number;
  knownLocalizationKeys: number;
  missing: Array<{
    code: string;
    name: string;
    normalized: string;
  }>;
};

async function main() {
  const args = new Set(process.argv.slice(2));
  const jsonOutput = args.has("--json");
  const failOnMissing = args.has("--fail-on-missing");

  const allergens = await db.allergen.findMany({
    orderBy: { code: "asc" },
    select: { code: true, name: true },
  });

  const missing = allergens
    .filter((allergen) => !hasAllergenLocalization(allergen.code))
    .map((allergen) => ({
      code: allergen.code,
      name: allergen.name,
      normalized: normalizeAllergenCode(allergen.code),
    }));

  const result: CheckResult = {
    checked: allergens.length,
    knownLocalizationKeys: getAllergenLocalizationCodes().length,
    missing,
  };

  if (jsonOutput) {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } else {
    console.log(`Checked ${result.checked} allergen codes in DB.`);
    console.log(`Known localization keys: ${result.knownLocalizationKeys}`);

    if (!result.missing.length) {
      console.log("All allergen codes are mapped for en/es localization.");
    } else {
      console.log("");
      console.log("Unmapped allergen codes:");
      for (const allergen of result.missing) {
        console.log(
          `- code="${allergen.code}" name="${allergen.name}" normalized="${allergen.normalized}"`
        );
      }

      console.log("");
      console.log("Suggested entries for src/lib/allergens.ts:");
      for (const allergen of result.missing) {
        console.log(`  "${allergen.normalized}": { en: "${allergen.name}", es: "${allergen.name}" },`);
      }
    }
  }

  if (failOnMissing && result.missing.length > 0) {
    process.exitCode = 1;
  }
}

main()
  .then(async () => {
    await db.$disconnect();
  })
  .catch(async (error) => {
    console.error("Failed to check allergen mappings.");
    console.error(error);
    await db.$disconnect();
    process.exit(1);
  });
