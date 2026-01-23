-- CreateTable
CREATE TABLE "FabricType" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FabricType_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FabricType_code_key" ON "FabricType"("code");
