-- Run this in Supabase SQL Editor to add Post-UTME support

-- 1. Add wallet columns to users table
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "walletBalance" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "pendingBalance" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- 2. Create Post-UTME properties table
CREATE TABLE IF NOT EXISTS "post_utme_properties" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    "distanceFromOOU" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "pricePerNight" DOUBLE PRECISION NOT NULL,
    "fullBookingPrice" DOUBLE PRECISION,
    "totalRooms" INTEGER NOT NULL DEFAULT 1,
    "availableRooms" INTEGER NOT NULL DEFAULT 1,
    "totalBeds" INTEGER NOT NULL DEFAULT 1,
    "maxGuests" INTEGER NOT NULL DEFAULT 1,
    "checkInDate" TIMESTAMP(3),
    "checkOutDate" TIMESTAMP(3),
    "amenities" TEXT NOT NULL DEFAULT '[]',
    "rules" TEXT,
    "checkInInfo" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "views" INTEGER NOT NULL DEFAULT 0,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "post_utme_properties_pkey" PRIMARY KEY ("id")
);

-- 3. Create Post-UTME property images
CREATE TABLE IF NOT EXISTS "post_utme_property_images" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "post_utme_property_images_pkey" PRIMARY KEY ("id")
);

-- 4. Create Post-UTME bookings
CREATE TABLE IF NOT EXISTS "post_utme_bookings" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "renterId" TEXT NOT NULL,
    "checkInDate" TIMESTAMP(3) NOT NULL,
    "checkOutDate" TIMESTAMP(3) NOT NULL,
    "numberOfGuests" INTEGER NOT NULL DEFAULT 1,
    "numberOfNights" INTEGER NOT NULL,
    "totalPrice" DOUBLE PRECISION NOT NULL,
    "serviceFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalPayable" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING_PAYMENT',
    "verificationCode" TEXT,
    "renterConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "checkedInAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "post_utme_bookings_pkey" PRIMARY KEY ("id")
);

-- 5. Create Post-UTME payments
CREATE TABLE IF NOT EXISTS "post_utme_payments" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reference" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'MOCK',
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "post_utme_payments_pkey" PRIMARY KEY ("id")
);

-- 6. Create wallet transactions
CREATE TABLE IF NOT EXISTS "wallet_transactions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "balance" DOUBLE PRECISION NOT NULL,
    "description" TEXT NOT NULL,
    "reference" TEXT,
    "bookingId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "wallet_transactions_pkey" PRIMARY KEY ("id")
);

-- 7. Create payout requests
CREATE TABLE IF NOT EXISTS "payout_requests" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "bankName" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "accountName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "adminNotes" TEXT,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "payout_requests_pkey" PRIMARY KEY ("id")
);

-- 8. Create Post-UTME reviews
CREATE TABLE IF NOT EXISTS "post_utme_reviews" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "post_utme_reviews_pkey" PRIMARY KEY ("id")
);

-- 9. Create refund requests
CREATE TABLE IF NOT EXISTS "refund_requests" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "renterId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "reason" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'REQUESTED',
    "adminNotes" TEXT,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "refund_requests_pkey" PRIMARY KEY ("id")
);

-- 10. Create disputes
CREATE TABLE IF NOT EXISTS "disputes" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "renterId" TEXT NOT NULL,
    "filedBy" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "adminNotes" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "disputes_pkey" PRIMARY KEY ("id")
);

-- 11. Create audit logs
CREATE TABLE IF NOT EXISTS "audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "details" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- Indexes for post_utme_properties
CREATE INDEX IF NOT EXISTS "post_utme_properties_ownerId_idx" ON "post_utme_properties"("ownerId");
CREATE INDEX IF NOT EXISTS "post_utme_properties_status_idx" ON "post_utme_properties"("status");
CREATE INDEX IF NOT EXISTS "post_utme_properties_area_idx" ON "post_utme_properties"("area");
CREATE INDEX IF NOT EXISTS "post_utme_properties_isVerified_idx" ON "post_utme_properties"("isVerified");

-- Indexes for post_utme_property_images
CREATE INDEX IF NOT EXISTS "post_utme_property_images_propertyId_idx" ON "post_utme_property_images"("propertyId");

-- Indexes for post_utme_bookings
CREATE INDEX IF NOT EXISTS "post_utme_bookings_studentId_idx" ON "post_utme_bookings"("studentId");
CREATE INDEX IF NOT EXISTS "post_utme_bookings_propertyId_idx" ON "post_utme_bookings"("propertyId");
CREATE INDEX IF NOT EXISTS "post_utme_bookings_renterId_idx" ON "post_utme_bookings"("renterId");
CREATE INDEX IF NOT EXISTS "post_utme_bookings_status_idx" ON "post_utme_bookings"("status");

-- Indexes for post_utme_payments
CREATE UNIQUE INDEX IF NOT EXISTS "post_utme_payments_bookingId_key" ON "post_utme_payments"("bookingId");
CREATE UNIQUE INDEX IF NOT EXISTS "post_utme_payments_reference_key" ON "post_utme_payments"("reference");
CREATE INDEX IF NOT EXISTS "post_utme_payments_reference_idx" ON "post_utme_payments"("reference");
CREATE INDEX IF NOT EXISTS "post_utme_payments_status_idx" ON "post_utme_payments"("status");

-- Indexes for wallet_transactions
CREATE INDEX IF NOT EXISTS "wallet_transactions_userId_idx" ON "wallet_transactions"("userId");
CREATE INDEX IF NOT EXISTS "wallet_transactions_type_idx" ON "wallet_transactions"("type");
CREATE INDEX IF NOT EXISTS "wallet_transactions_createdAt_idx" ON "wallet_transactions"("createdAt");

-- Indexes for payout_requests
CREATE INDEX IF NOT EXISTS "payout_requests_userId_idx" ON "payout_requests"("userId");
CREATE INDEX IF NOT EXISTS "payout_requests_status_idx" ON "payout_requests"("status");

-- Indexes for post_utme_reviews
CREATE INDEX IF NOT EXISTS "post_utme_reviews_propertyId_idx" ON "post_utme_reviews"("propertyId");
CREATE UNIQUE INDEX IF NOT EXISTS "post_utme_reviews_studentId_propertyId_key" ON "post_utme_reviews"("studentId", "propertyId");

-- Indexes for refund_requests
CREATE UNIQUE INDEX IF NOT EXISTS "refund_requests_bookingId_key" ON "refund_requests"("bookingId");
CREATE INDEX IF NOT EXISTS "refund_requests_studentId_idx" ON "refund_requests"("studentId");
CREATE INDEX IF NOT EXISTS "refund_requests_renterId_idx" ON "refund_requests"("renterId");
CREATE INDEX IF NOT EXISTS "refund_requests_status_idx" ON "refund_requests"("status");

-- Indexes for disputes
CREATE INDEX IF NOT EXISTS "disputes_studentId_idx" ON "disputes"("studentId");
CREATE INDEX IF NOT EXISTS "disputes_renterId_idx" ON "disputes"("renterId");
CREATE INDEX IF NOT EXISTS "disputes_status_idx" ON "disputes"("status");

-- Indexes for audit_logs
CREATE INDEX IF NOT EXISTS "audit_logs_userId_idx" ON "audit_logs"("userId");
CREATE INDEX IF NOT EXISTS "audit_logs_action_idx" ON "audit_logs"("action");
CREATE INDEX IF NOT EXISTS "audit_logs_entity_idx" ON "audit_logs"("entity");
CREATE INDEX IF NOT EXISTS "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- Foreign keys
DO $$ BEGIN
    ALTER TABLE "post_utme_properties" ADD CONSTRAINT "post_utme_properties_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "post_utme_property_images" ADD CONSTRAINT "post_utme_property_images_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "post_utme_properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "post_utme_bookings" ADD CONSTRAINT "post_utme_bookings_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "post_utme_bookings" ADD CONSTRAINT "post_utme_bookings_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "post_utme_properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "post_utme_bookings" ADD CONSTRAINT "post_utme_bookings_renterId_fkey" FOREIGN KEY ("renterId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "post_utme_payments" ADD CONSTRAINT "post_utme_payments_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "post_utme_bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "payout_requests" ADD CONSTRAINT "payout_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "post_utme_reviews" ADD CONSTRAINT "post_utme_reviews_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "post_utme_reviews" ADD CONSTRAINT "post_utme_reviews_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "post_utme_properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "refund_requests" ADD CONSTRAINT "refund_requests_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "post_utme_bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "refund_requests" ADD CONSTRAINT "refund_requests_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "refund_requests" ADD CONSTRAINT "refund_requests_renterId_fkey" FOREIGN KEY ("renterId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "disputes" ADD CONSTRAINT "disputes_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "disputes" ADD CONSTRAINT "disputes_renterId_fkey" FOREIGN KEY ("renterId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
