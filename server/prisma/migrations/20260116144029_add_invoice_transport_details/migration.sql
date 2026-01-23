-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "billOfLading" TEXT,
ADD COLUMN     "buyersOrderDate" TIMESTAMP(3),
ADD COLUMN     "buyersOrderNo" TEXT,
ADD COLUMN     "deliveryNote" TEXT,
ADD COLUMN     "deliveryNoteDate" TIMESTAMP(3),
ADD COLUMN     "destination" TEXT,
ADD COLUMN     "dispatchDocNo" TEXT,
ADD COLUMN     "dispatchedThrough" TEXT,
ADD COLUMN     "motorVehicleNo" TEXT,
ADD COLUMN     "otherReference" TEXT,
ADD COLUMN     "termsOfDelivery" TEXT;
