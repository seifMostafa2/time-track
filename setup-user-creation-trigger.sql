-- ============================================
-- Setup: Automatic User Profile Creation Trigger
-- ============================================
-- This SQL script creates a database trigger that automatically
-- creates a record in the 'students' table when a new user is
-- created in Supabase Auth.
--
-- HOW TO USE:
-- 1. Go to Supabase Dashboard → SQL Editor
-- 2. Copy and paste this entire script
-- 3. Click "Run" to execute
-- ============================================

-- Step 1: Create the function that will be triggered
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert a new row into the students table
  INSERT INTO public.students (
    auth_user_id,
    email,
    name,
    role,
    first_login,
    created_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', 'New User'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
    true,
    NOW()
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Step 3: Verify the trigger was created
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- ============================================
-- VERIFICATION
-- ============================================
-- After running this script:
-- 1. Try creating a new user from the app
-- 2. Check Supabase Dashboard → Authentication → Users
-- 3. Check Supabase Dashboard → Table Editor → students
-- 4. The user should appear in both places!

RAISE NOTICE '✅ User creation trigger setup complete!';
RAISE NOTICE 'Now try creating a user from the app.';

