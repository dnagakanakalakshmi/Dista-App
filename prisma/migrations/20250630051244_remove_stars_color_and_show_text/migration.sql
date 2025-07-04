/*
  Warnings:

  - You are about to drop the column `showText` on the `widgetSettings` table. All the data in the column will be lost.
  - You are about to drop the column `starsColor` on the `widgetSettings` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_widgetSettings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "shop" TEXT NOT NULL,
    "starsText" TEXT NOT NULL DEFAULT '{count} review/reviews',
    "saveText" TEXT NOT NULL DEFAULT 'Save {percent}%',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_widgetSettings" ("createdAt", "id", "saveText", "shop", "starsText", "updatedAt") SELECT "createdAt", "id", "saveText", "shop", "starsText", "updatedAt" FROM "widgetSettings";
DROP TABLE "widgetSettings";
ALTER TABLE "new_widgetSettings" RENAME TO "widgetSettings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
