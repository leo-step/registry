/*
  Warnings:

  - You are about to alter the column `coords` on the `NodeEntry` table. The data in that column could be lost. The data in that column will be cast from `Text` to `Unsupported("geometry(Point, 4326)")`.

*/
-- AlterTable
ALTER TABLE "NodeEntry" ALTER COLUMN "coords" SET DATA TYPE geometry(Point, 4326);

-- CreateIndex
CREATE INDEX "location_idx" ON "NodeEntry" USING GIST ("coords");
