-- College Migration Script
-- Run this after the initial schema

-- Create College table
CREATE TABLE IF NOT EXISTS "College" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "name" VARCHAR(200) NOT NULL UNIQUE,
    "code" VARCHAR(20) NOT NULL UNIQUE,
    "address" TEXT,
    "is_active" BOOLEAN DEFAULT TRUE,
    "created_at" TIMESTAMP DEFAULT NOW(),
    "updated_at" TIMESTAMP DEFAULT NOW()
);

-- Add college_id to User table
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "college_id" UUID REFERENCES "College"("id") ON DELETE SET NULL;

-- Add college_id to Department table
ALTER TABLE "Department" ADD COLUMN IF NOT EXISTS "college_id" UUID REFERENCES "College"("id") ON DELETE CASCADE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_college ON "User"("college_id");
CREATE INDEX IF NOT EXISTS idx_department_college ON "Department"("college_id");

-- Add update trigger for College
CREATE TRIGGER update_college_updated_at
    BEFORE UPDATE ON "College"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();
