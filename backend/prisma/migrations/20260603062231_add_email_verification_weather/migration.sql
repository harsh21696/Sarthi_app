-- AlterTable
ALTER TABLE "users" ADD COLUMN     "city" TEXT,
ADD COLUMN     "email_verified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION,
ADD COLUMN     "otp" TEXT,
ADD COLUMN     "otp_expiry" TIMESTAMP(3),
ADD COLUMN     "primary_crop" TEXT;
