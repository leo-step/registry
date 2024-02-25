/*
  Warnings:

  - You are about to alter the column `coords` on the `NodeEntry` table. The data in that column could be lost. The data in that column will be cast from `Unsupported("geometry")` to `Text`.
  - Made the column `coords` on table `NodeEntry` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "location_idx";

-- AlterTable
ALTER TABLE "NodeEntry" ALTER COLUMN "coords" SET NOT NULL,
ALTER COLUMN "coords" SET DATA TYPE TEXT;
