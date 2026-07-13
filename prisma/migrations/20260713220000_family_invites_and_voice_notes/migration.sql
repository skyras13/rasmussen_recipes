-- Voice notes on recipes
ALTER TABLE "Recipe" ADD COLUMN "audioUrl" TEXT;

-- Family invite codes: add as nullable, backfill existing rows, then
-- require and unique-index the column.
ALTER TABLE "Family" ADD COLUMN "inviteCode" TEXT;

UPDATE "Family"
SET "inviteCode" = md5(random()::text || clock_timestamp()::text)
WHERE "inviteCode" IS NULL;

ALTER TABLE "Family" ALTER COLUMN "inviteCode" SET NOT NULL;

CREATE UNIQUE INDEX "Family_inviteCode_key" ON "Family"("inviteCode");
