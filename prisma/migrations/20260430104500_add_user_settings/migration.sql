-- CreateTable
CREATE TABLE IF NOT EXISTS "user_settings" (
    "user_id" TEXT NOT NULL,
    "timezone" TEXT,
    "date_format" TEXT,
    "currency_format" TEXT,
    "notifications_json" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "user_settings_pkey" PRIMARY KEY ("user_id")
);

-- Ensure foreign key exists (safe if table was pre-created).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'user_settings_user_id_fkey'
  ) THEN
    ALTER TABLE "user_settings"
      ADD CONSTRAINT "user_settings_user_id_fkey"
      FOREIGN KEY ("user_id") REFERENCES "User"("id")
      ON DELETE CASCADE
      ON UPDATE CASCADE;
  END IF;
END $$;
