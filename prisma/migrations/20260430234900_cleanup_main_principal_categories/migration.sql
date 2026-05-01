UPDATE "Category" AS c
SET "name" = m."name"
FROM "Menu" AS m
WHERE c."menuId" = m."id"
  AND LOWER(TRIM(c."name")) IN ('main', 'principal');
