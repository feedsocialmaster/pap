/*
  Warnings:

  - You are about to drop the `Page` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PageHistory` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "PageHistory" DROP CONSTRAINT "PageHistory_pageId_fkey";

-- DropTable
DROP TABLE "Page";

-- DropTable
DROP TABLE "PageHistory";
