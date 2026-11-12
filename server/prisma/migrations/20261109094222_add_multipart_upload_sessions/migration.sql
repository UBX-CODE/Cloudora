-- CreateEnum
CREATE TYPE "UploadSessionStatus" AS ENUM ('INITIATED', 'IN_PROGRESS', 'COMPLETED', 'ABORTED', 'FAILED');

-- CreateTable
CREATE TABLE "UploadSession" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "multipartUploadId" TEXT NOT NULL,
    "partSize" INTEGER NOT NULL,
    "totalParts" INTEGER NOT NULL,
    "status" "UploadSessionStatus" NOT NULL DEFAULT 'INITIATED',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UploadSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UploadSession_fileId_key" ON "UploadSession"("fileId");

-- CreateIndex
CREATE UNIQUE INDEX "UploadSession_multipartUploadId_key" ON "UploadSession"("multipartUploadId");

-- CreateIndex
CREATE INDEX "UploadSession_ownerId_status_idx" ON "UploadSession"("ownerId", "status");

-- CreateIndex
CREATE INDEX "UploadSession_expiresAt_idx" ON "UploadSession"("expiresAt");

-- AddForeignKey
ALTER TABLE "UploadSession" ADD CONSTRAINT "UploadSession_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UploadSession" ADD CONSTRAINT "UploadSession_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File"("id") ON DELETE CASCADE ON UPDATE CASCADE;
