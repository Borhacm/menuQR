ALTER TABLE "AnalyticsEvent"
ADD COLUMN IF NOT EXISTS "metadataJson" JSONB;
