CREATE EXTENSION postgis;

-- AlterTable
ALTER TABLE "NodeEntry" ADD COLUMN     "coords" geometry(Point, 4326);

-- CreateIndex
CREATE INDEX "location_idx" ON "NodeEntry" USING GIST ("coords");
