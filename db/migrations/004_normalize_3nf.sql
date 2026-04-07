BEGIN;

ALTER TABLE "User" DROP COLUMN IF EXISTS "department";

ALTER TABLE "College" DROP COLUMN IF EXISTS "total_students";

ALTER TABLE "Department" DROP COLUMN IF EXISTS "total_students";

ALTER TABLE "Role" DROP COLUMN IF EXISTS "permissions";


CREATE TABLE "ProjectDocument" (
    "project_id" UUID NOT NULL REFERENCES "Project"("id") ON DELETE CASCADE,
    "document_id" UUID NOT NULL REFERENCES "Document"("id") ON DELETE CASCADE,
    PRIMARY KEY ("project_id", "document_id")
);

CREATE TABLE "ExpenseDocument" (
    "expense_id" UUID NOT NULL REFERENCES "Expense"("id") ON DELETE CASCADE,
    "document_id" UUID NOT NULL REFERENCES "Document"("id") ON DELETE CASCADE,
    PRIMARY KEY ("expense_id", "document_id")
);

INSERT INTO "ProjectDocument" ("project_id", "document_id")
SELECT "project_id", "id" FROM "Document" WHERE "project_id" IS NOT NULL;

INSERT INTO "ExpenseDocument" ("expense_id", "document_id")
SELECT "expense_id", "id" FROM "Document" WHERE "expense_id" IS NOT NULL;

ALTER TABLE "Document" DROP COLUMN IF EXISTS "project_id";
ALTER TABLE "Document" DROP COLUMN IF EXISTS "expense_id";


ALTER TABLE "Expense" DROP CONSTRAINT IF EXISTS "Expense_filed_by_fkey";
ALTER TABLE "Expense"
    ADD CONSTRAINT "Expense_filed_by_fkey"
    FOREIGN KEY ("filed_by") REFERENCES "User"("id") ON DELETE CASCADE;

COMMIT;
