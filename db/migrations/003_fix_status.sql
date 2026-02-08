UPDATE "Project" 
SET status = 'ONGOING' 
WHERE status::text = 'IN_PROGRESS';
