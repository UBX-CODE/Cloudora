-- CreateEnum
CREATE TYPE "FileStatus" AS ENUM ('PENDING', 'UPLOADED', 'FAILED');

-- CreateTable
CREATE TABLE "Folder" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "parentId" TEXT,
    "isStarred" BOOLEAN NOT NULL DEFAULT false,
    "isTrashed" BOOLEAN NOT NULL DEFAULT false,
    "trashedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Folder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "File" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" BIGINT NOT NULL,
    "storageKey" TEXT,
    "checksum" TEXT,
    "status" "FileStatus" NOT NULL DEFAULT 'PENDING',
    "ownerId" TEXT NOT NULL,
    "folderId" TEXT,
    "isStarred" BOOLEAN NOT NULL DEFAULT false,
    "isTrashed" BOOLEAN NOT NULL DEFAULT false,
    "trashedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "File_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Folder_ownerId_parentId_idx" ON "Folder"("ownerId", "parentId");

-- CreateIndex
CREATE INDEX "Folder_ownerId_createdAt_idx" ON "Folder"("ownerId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "File_storageKey_key" ON "File"("storageKey");

-- CreateIndex
CREATE INDEX "File_ownerId_folderId_idx" ON "File"("ownerId", "folderId");

-- CreateIndex
CREATE INDEX "File_ownerId_createdAt_idx" ON "File"("ownerId", "createdAt");

-- CreateIndex
CREATE INDEX "File_ownerId_isStarred_idx" ON "File"("ownerId", "isStarred");

-- CreateIndex
CREATE INDEX "File_ownerId_isTrashed_idx" ON "File"("ownerId", "isTrashed");

-- AddForeignKey
ALTER TABLE "Folder" ADD CONSTRAINT "Folder_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Folder" ADD CONSTRAINT "Folder_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Folder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "Folder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
