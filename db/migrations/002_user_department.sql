ALTER TABLE "User" ADD COLUMN "dept_id" UUID REFERENCES "Department"("id");

UPDATE "User" u
SET dept_id = (
    SELECT d.id 
    FROM "Department" d 
    WHERE d.college_id = u.college_id 
    LIMIT 1
)
WHERE u.college_id IS NOT NULL;

ALTER TABLE "User" DROP COLUMN IF EXISTS "college_id";

ALTER TABLE "College" ADD COLUMN "total_students" INTEGER DEFAULT 0;

ALTER TABLE "Department" ADD COLUMN "total_students" INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_user_dept ON "User"("dept_id");
