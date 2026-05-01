-- Add item-level analytics event types for future best-seller ranking.
ALTER TYPE "AnalyticsType" ADD VALUE IF NOT EXISTS 'ITEM_VIEW';
ALTER TYPE "AnalyticsType" ADD VALUE IF NOT EXISTS 'ITEM_CLICK';

ALTER TABLE "AnalyticsEvent"
ADD COLUMN IF NOT EXISTS "itemId" TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'AnalyticsEvent_itemId_fkey'
  ) THEN
    ALTER TABLE "AnalyticsEvent"
    ADD CONSTRAINT "AnalyticsEvent_itemId_fkey"
    FOREIGN KEY ("itemId")
    REFERENCES "Item"("id")
    ON DELETE SET NULL
    ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "AnalyticsEvent_resourceId_itemId_ts_idx"
ON "AnalyticsEvent"("resourceId", "itemId", "ts");
