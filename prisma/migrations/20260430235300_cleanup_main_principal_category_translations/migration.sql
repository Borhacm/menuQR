DELETE FROM "Translation"
WHERE "entityType" = 'CATEGORY'
  AND "field" = 'name'
  AND LOWER(TRIM("value")) IN ('main', 'principal');
