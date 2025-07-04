-- CreateTable
CREATE TABLE "widgetSettings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "shop" TEXT NOT NULL,
    "starsText" TEXT NOT NULL DEFAULT '{count} review/reviews',
    "starsColor" TEXT NOT NULL DEFAULT '#26d9b1',
    "showText" BOOLEAN NOT NULL DEFAULT true,
    "saveText" TEXT NOT NULL DEFAULT 'Save {percent}%',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
