-- ============================================
-- FIX: HR Role Foreign Key Constraint Error
-- ============================================
-- This SQL script fixes the issue where creating HR users fails with:
-- "insert or update on table 'students' violates foreign key constraint"
--
-- The problem is likely a CHECK constraint on the role column that only
-- allows 'student' and 'admin' values, but not 'hr'.
--
-- HOW TO USE:
-- 1. Go to Supabase Dashboard → SQL Editor
-- 2. Copy and paste this entire script
-- 3. Click "Run" to execute
-- ============================================

-- Step 1: Check if there's a constraint on the role column
-- Run this to see existing constraints:
-- SELECT conname, pg_get_constraintdef(oid) 
-- FROM pg_constraint 
-- WHERE conrelid = 'public.students'::regclass;

-- Step 2: Drop the old role check constraint if it exists
DO $$ 
BEGIN
    -- Try to drop the constraint if it exists
    IF EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conname = 'students_role_check' 
        AND conrelid = 'public.students'::regclass
    ) THEN
        ALTER TABLE public.students DROP CONSTRAINT students_role_check;
        RAISE NOTICE 'Dropped existing students_role_check constraint';
    END IF;
END $$;

-- Step 3: Add a new check constraint that allows 'student', 'admin', AND 'hr'
ALTER TABLE public.students
ADD CONSTRAINT students_role_check 
CHECK (role IN ('student', 'admin', 'hr'));

-- Step 4: Verify the constraint was added
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'public.students'::regclass 
AND conname = 'students_role_check';

-- ============================================
-- ALTERNATIVE: If the above doesn't work, try this
-- ============================================
-- If there's no CHECK constraint but the column is an ENUM type,
-- you need to alter the ENUM type to add 'hr':

-- First, check if role is an ENUM:
-- SELECT column_name, data_type, udt_name
-- FROM information_schema.columns
-- WHERE table_name = 'students' AND column_name = 'role';

-- If it's an ENUM, add 'hr' to it:
-- ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'hr';

-- Or if the enum is named differently, find it first:
-- SELECT typname FROM pg_type WHERE typtype = 'e';

-- Then alter it:
-- ALTER TYPE <enum_name> ADD VALUE IF NOT EXISTS 'hr';

-- ============================================
-- VERIFICATION
-- ============================================
-- After running this script, test by creating an HR user from the app.

RAISE NOTICE '✅ HR role constraint updated successfully!';
RAISE NOTICE 'You can now create users with role = ''hr''';

