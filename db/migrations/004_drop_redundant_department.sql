-- Migration 004: Drop redundant department VARCHAR column from User table
-- Reason: dept_id (FK → Department) already references the Department table.
-- Having both 'department' (VARCHAR) and 'dept_id' (FK) creates a transitive dependency,
-- violating Third Normal Form (3NF): id → dept_id → department_name.
-- The department name should be resolved via JOIN with the Department table.

ALTER TABLE "User" DROP COLUMN IF EXISTS "department";
