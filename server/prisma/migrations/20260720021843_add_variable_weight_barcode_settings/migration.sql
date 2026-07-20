-- AlterTable
ALTER TABLE "Setting"
  ADD COLUMN     "variableWeightEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN     "variableWeightPrefix" TEXT NOT NULL DEFAULT '2',
  ADD COLUMN     "variableWeightItemStart" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN     "variableWeightItemLength" INTEGER NOT NULL DEFAULT 5,
  ADD COLUMN     "variableWeightWeightStart" INTEGER NOT NULL DEFAULT 6,
  ADD COLUMN     "variableWeightWeightLength" INTEGER NOT NULL DEFAULT 5,
  ADD COLUMN     "variableWeightDecimals" INTEGER NOT NULL DEFAULT 3,
  ADD COLUMN     "variableWeightUnit" TEXT NOT NULL DEFAULT 'kg';
