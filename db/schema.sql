CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE "ProjectStatus" AS ENUM (
    'DRAFT',
    'SUBMITTED',
    'PENDING',
    'APPROVED', 
    'REJECTED', 
    'AUDITED', 
    'ONGOING',
    'COMPLETED'
);

CREATE TYPE "ProjectMemberRole" AS ENUM (
    'AUDITOR',
    'RESEARCHER',
    'DEPARTMENT_HEAD', 
    'RESEARCH_ASSISTANT', 
    'INVESTIGATOR', 
    'MENTOR'
);

CREATE TYPE "ExpenseStatus" AS ENUM (
    'PENDING', 
    'APPROVED', 
    'REJECTED'
);

CREATE TYPE "ApprovalStatus" AS ENUM (
    'PENDING', 
    'APPROVED', 
    'REJECTED'
);

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE "User" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(100) NOT NULL UNIQUE, 
    "password" VARCHAR(255) NOT NULL,
    "department" VARCHAR(100), 

    "is_active" BOOLEAN DEFAULT TRUE,
    "last_login" TIMESTAMP,

    "created_at" TIMESTAMP DEFAULT NOW(),
    "updated_at" TIMESTAMP DEFAULT NOW()
);

CREATE TRIGGER update_user_time BEFORE UPDATE ON "User"
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE "Role" (
    "id" UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    "name" VARCHAR(50) NOT NULL UNIQUE,
    "description" TEXT,
    "permissions" JSONB DEFAULT '[]',
    "created_at" TIMESTAMP DEFAULT NOW(),
    "updated_at" TIMESTAMP DEFAULT NOW()
);

CREATE TRIGGER update_role_time BEFORE UPDATE ON "Role"
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE "Permission" (
    "id" UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    UNIQUE("action", "resource") 
);

CREATE TABLE "UserRole" (
    "user_id" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "role_id" UUID NOT NULL REFERENCES "Role"("id") ON DELETE CASCADE, -- Fixed typo: IN -> ON
    PRIMARY KEY ("user_id", "role_id")
);

CREATE TABLE "_RolePermission" (
    "A" UUID NOT NULL REFERENCES "Role"("id") ON DELETE CASCADE,
    "B" UUID NOT NULL REFERENCES "Permission"("id") ON DELETE CASCADE,
    PRIMARY KEY ("A", "B")
);

CREATE TABLE "Department" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    "name" VARCHAR(100) NOT NULL,
    "code" TEXT NOT NULL UNIQUE,

    "created_at" TIMESTAMP DEFAULT NOW(),
    "updated_at" TIMESTAMP DEFAULT NOW()
);

CREATE TRIGGER update_department_time BEFORE UPDATE ON "Department"
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE "ResearcherProfile" (
    "id" UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    "user_id" UUID NOT NULL UNIQUE REFERENCES "User"("id"),
    "dept_id" UUID NOT NULL REFERENCES "Department"("id"),
    "designation" TEXT NOT NULL,
    "h_index" INTEGER,
    "citations" INTEGER DEFAULT 0,

    "created_at" TIMESTAMP DEFAULT NOW(), 
    "updated_at" TIMESTAMP DEFAULT NOW()
);

CREATE TRIGGER update_researcher_time BEFORE UPDATE ON "ResearcherProfile"
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE "Project" (
    "id" UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL UNIQUE,
    "abstract" TEXT,

    "grant_amount" DECIMAL(15, 2) NOT NULL,
    "released_funds" DECIMAL(15, 2) NOT NULL DEFAULT 0,
    "duration" INTEGER NOT NULL, -- months

    "status" "ProjectStatus" NOT NULL DEFAULT 'DRAFT',
    "dept_id" UUID NOT NULL REFERENCES "Department"("id") ON DELETE CASCADE,

    "start_date" TIMESTAMP,
    "end_date" TIMESTAMP,

    "created_at" TIMESTAMP DEFAULT NOW(),
    "updated_at" TIMESTAMP DEFAULT NOW()
);

CREATE TRIGGER update_project_time BEFORE UPDATE ON "Project"
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE "ProjectMember" (
    "id" UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    "project_id" UUID NOT NULL REFERENCES "Project"("id") ON DELETE CASCADE,
    "user_id" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "role" "ProjectMemberRole" NOT NULL, 
    
    "created_at" TIMESTAMP DEFAULT NOW(),
    "updated_at" TIMESTAMP DEFAULT NOW(),
    
    UNIQUE("project_id", "user_id")
);

CREATE TRIGGER update_project_member_time BEFORE UPDATE ON "ProjectMember"
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE "Expense" (
    "id" UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    "project_id" UUID NOT NULL REFERENCES "Project"("id") ON DELETE CASCADE,
    "filed_by" UUID NOT NULL REFERENCES "ResearcherProfile"("id") ON DELETE CASCADE,
    "bill_date" TIMESTAMP NOT NULL,
    "category" TEXT NOT NULL,
    "amount" DECIMAL(15, 2) NOT NULL,
    "description" TEXT,
    "status" "ExpenseStatus" NOT NULL DEFAULT 'PENDING',

    "created_at" TIMESTAMP DEFAULT NOW() 
);

CREATE TABLE "AuditLog" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "user_id" UUID REFERENCES "User"("id"),
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" UUID NOT NULL,
    "changes" JSONB NOT NULL,
    "ip_address" TEXT,
    "timestamp" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE "Document" (
    "id" UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    "url" TEXT NOT NULL,
    "file_type" TEXT NOT NULL,
    "uploaded_at" TIMESTAMP DEFAULT NOW(),
    
    "project_id" UUID REFERENCES "Project"("id"),
    "expense_id" UUID REFERENCES "Expense"("id")
);

CREATE OR REPLACE FUNCTION check_project_budget()
RETURNS TRIGGER AS $$
DECLARE
    current_spending DECIMAL;
    total_released DECIMAL;
BEGIN
    IF NEW.status = 'APPROVED' THEN
        SELECT released_funds INTO total_released FROM "Project" WHERE id = NEW.project_id;
        
        SELECT COALESCE(SUM(amount), 0) INTO current_spending 
        FROM "Expense" 
        WHERE project_id = NEW.project_id AND status = 'APPROVED' AND id != NEW.id;

        IF (current_spending + NEW.amount) > total_released THEN
            RAISE EXCEPTION 'Budget Exceeded: Project funds insufficient.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validate_expense 
BEFORE INSERT OR UPDATE ON "Expense"
FOR EACH ROW EXECUTE FUNCTION check_project_budget();