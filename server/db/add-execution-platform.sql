-- Add execution_platform column if it doesn't exist
ALTER TABLE submissions 
ADD COLUMN execution_platform VARCHAR(20) DEFAULT 'windows' COMMENT 'Platform where code was executed';

-- Update existing submissions to mark them as platform-specific
UPDATE submissions SET execution_platform = 'windows' WHERE execution_platform IS NULL;