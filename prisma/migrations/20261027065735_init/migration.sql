-- CreateTable
CREATE TABLE "Scan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "itemCount" INTEGER NOT NULL,
    "totalValueKes" INTEGER NOT NULL,
    "date" TEXT NOT NULL,
    "status" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Item" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scanId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "expectedQuantity" INTEGER NOT NULL,
    "condition" TEXT NOT NULL,
    "unitPriceKes" INTEGER NOT NULL,
    "confidence" INTEGER NOT NULL,
    "confirmed" BOOLEAN NOT NULL,
    "suggestedAction" TEXT NOT NULL,
    "actionReason" TEXT NOT NULL,
    "colorHex" TEXT NOT NULL,
    CONSTRAINT "Item_scanId_fkey" FOREIGN KEY ("scanId") REFERENCES "Scan" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
