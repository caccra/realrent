-- AlterEnum
BEGIN;
CREATE TYPE "PropertyType_new" AS ENUM ('APARTMENT', 'HOUSE', 'HOSTEL', 'SHELL_HOUSE', 'SEMI_DETACHED', 'STOREYED_BUILDING', 'STUDIO_ROOM', 'MANSION', 'DUPLEX', 'BUNGALOW');
ALTER TABLE "Property" ALTER COLUMN "propertyType" TYPE "PropertyType_new" USING ("propertyType"::text::"PropertyType_new");
ALTER TYPE "PropertyType" RENAME TO "PropertyType_old";
ALTER TYPE "PropertyType_new" RENAME TO "PropertyType";
DROP TYPE "public"."PropertyType_old";
COMMIT;

