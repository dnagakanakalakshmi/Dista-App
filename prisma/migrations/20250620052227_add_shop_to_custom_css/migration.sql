/*
  Warnings:

  - Added the required column `shop` to the `CustomCSS` table without a default value. This is not possible if the table is not empty.
  - Added the required column `shop` to the `CustomCSS_RO` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CustomCSS" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "css" TEXT NOT NULL,
    "showAddToCart" BOOLEAN NOT NULL DEFAULT true,
    "showBuyNow" BOOLEAN NOT NULL DEFAULT true,
    "displayMode" TEXT NOT NULL DEFAULT 'carousel',
    "productsPerRow" INTEGER NOT NULL DEFAULT 3,
    "initialProducts" INTEGER NOT NULL DEFAULT 6,
    "cardLayout" TEXT NOT NULL DEFAULT 'default',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_CustomCSS" ("cardLayout", "createdAt", "css", "displayMode", "id", "initialProducts", "productsPerRow", "showAddToCart", "showBuyNow", "updatedAt", "shop") SELECT "cardLayout", "createdAt", "css", "displayMode", "id", "initialProducts", "productsPerRow", "showAddToCart", "showBuyNow", "updatedAt", 'dummy-shop.myshopify.com' FROM "CustomCSS";
DROP TABLE "CustomCSS";
ALTER TABLE "new_CustomCSS" RENAME TO "CustomCSS";
CREATE UNIQUE INDEX "CustomCSS_shop_key" ON "CustomCSS"("shop");
CREATE TABLE "new_CustomCSS_RO" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "css" TEXT NOT NULL,
    "showAddToCart" BOOLEAN NOT NULL DEFAULT true,
    "showReorder" BOOLEAN NOT NULL DEFAULT true,
    "displayMode" TEXT NOT NULL DEFAULT 'carousel',
    "productsPerRow" INTEGER NOT NULL DEFAULT 3,
    "initialProducts" INTEGER NOT NULL DEFAULT 6,
    "cardLayout" TEXT NOT NULL DEFAULT 'default',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_CustomCSS_RO" ("cardLayout", "createdAt", "css", "displayMode", "id", "initialProducts", "productsPerRow", "showAddToCart", "showReorder", "updatedAt", "shop") SELECT "cardLayout", "createdAt", "css", "displayMode", "id", "initialProducts", "productsPerRow", "showAddToCart", "showReorder", "updatedAt", 'dummy-shop.myshopify.com' FROM "CustomCSS_RO";
DROP TABLE "CustomCSS_RO";
ALTER TABLE "new_CustomCSS_RO" RENAME TO "CustomCSS_RO";
CREATE UNIQUE INDEX "CustomCSS_RO_shop_key" ON "CustomCSS_RO"("shop");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
