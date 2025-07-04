-- CreateTable
CREATE TABLE "CustomCSS" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
