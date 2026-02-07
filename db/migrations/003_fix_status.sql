-- Fix projects with IN_PROGRESS status (invalid enum value)
-- This updates any existing projects that have the old status

UPDATE "Project" 
SET status = 'ONGOING' 
WHERE status::text = 'IN_PROGRESS';
