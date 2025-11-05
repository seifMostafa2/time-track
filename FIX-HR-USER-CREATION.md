# 🔧 Fix: HR User Creation Error

## ❌ The Problem

When trying to create an **HR user**, you get this error:

```
Fehler beim Erstellen: insert or update on table "students" violates foreign key constraint "students_auth_user_id_fkey"
```

**Translation:** "Error creating: insert or update on table 'students' violates foreign key constraint"

**Important:** This error **only happens with HR users**, not with Student or Admin users.

## 🔍 Root Cause

The `students` table has a **CHECK constraint** on the `role` column that only allows these values:
- ✅ `'student'`
- ✅ `'admin'`
- ❌ `'hr'` ← **NOT ALLOWED!**

When you try to create an HR user, the database rejects it because 'hr' is not in the allowed list.

## ✅ Solution: Update Role Constraint

We need to update the database constraint to allow the 'hr' role.

## 📋 Step-by-Step Fix

### Step 1: Open Supabase SQL Editor

1. Go to your **Supabase Dashboard**: https://supabase.com/dashboard
2. Select your project: **ovazsnblvbvefsmhxwhw**
3. Click on **SQL Editor** in the left sidebar
4. Click **New Query**

### Step 2: Run the SQL Script

Copy and paste this SQL into the editor and click **Run**:

```sql
-- Drop the old role check constraint if it exists
DO $$ 
BEGIN
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

-- Add a new check constraint that allows 'student', 'admin', AND 'hr'
ALTER TABLE public.students
ADD CONSTRAINT students_role_check 
CHECK (role IN ('student', 'admin', 'hr'));

-- Verify the constraint was added
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'public.students'::regclass 
AND conname = 'students_role_check';
```

### Step 3: Verify the Fix

After running the SQL:

1. **Go back to your app**
2. **Try creating an HR user** from User Management
3. **It should work now!** ✅

## 🎯 What Changed

### Database Constraint

**Before:**
```sql
CHECK (role IN ('student', 'admin'))  -- ❌ HR not allowed
```

**After:**
```sql
CHECK (role IN ('student', 'admin', 'hr'))  -- ✅ HR allowed!
```

### UI Display (UserManagement.jsx)

I also updated the user list to properly display HR users with a pink badge:

**Before:**
```javascript
{student.role === 'admin' ? txt.admin : txt.student}
// ❌ HR users would show as "Student"
```

**After:**
```javascript
{student.role === 'admin' 
  ? txt.admin 
  : student.role === 'hr' 
  ? 'HR' 
  : txt.student}
// ✅ HR users show as "HR"
```

## 🎨 User Interface

After the fix, HR users will display with a **pink badge**:

```
┌─────────────────────────────────────────────────────────┐
│ Name          │ Email              │ Role              │
├─────────────────────────────────────────────────────────┤
│ John Doe      │ john@example.com   │ [Student]         │ ← Yellow
│ Jane Admin    │ jane@example.com   │ [Administrator]   │ ← Blue
│ Bob HR        │ bob@example.com    │ [HR]              │ ← Pink
└─────────────────────────────────────────────────────────┘
```

## 🧪 Testing

After applying the fix, test creating an HR user:

### Test: Create HR User

1. **Go to Admin View** → **User Management**
2. **Click "Add New User"**
3. **Fill in the form:**
   - Name: `Test HR User`
   - Email: `test.hr@example.com`
   - Password: `hr123456`
   - Role: **HR** ← Select this
4. **Click "Create User Account"**
5. ✅ **Should succeed** with success message
6. ✅ **HR user should appear** in the user list with a pink "HR" badge

### Verify in Database

1. Go to **Supabase Dashboard** → **Table Editor**
2. Open **"students"** table
3. Find the new HR user
4. ✅ **Verify** `role` column shows `'hr'`

## 🔍 Alternative: If It's an ENUM Type

If the above SQL doesn't work, the `role` column might be an **ENUM type** instead of a CHECK constraint.

### Check if it's an ENUM:

```sql
SELECT column_name, data_type, udt_name
FROM information_schema.columns
WHERE table_name = 'students' AND column_name = 'role';
```

If `data_type` shows `USER-DEFINED`, it's an ENUM.

### Fix for ENUM:

```sql
-- Find the enum type name
SELECT typname FROM pg_type WHERE typtype = 'e';

-- Add 'hr' to the enum (replace 'user_role' with actual enum name)
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'hr';
```

## 📁 Files Modified

### 1. `src/components/UserManagement.jsx`

Updated the user list display to show HR users with a pink badge:

```javascript
<span
  style={{
    ...styles.badge,
    ...(student.role === 'admin' 
      ? { background: '#dbeafe', color: '#1e40af' }  // Blue for Admin
      : student.role === 'hr'
      ? { background: '#fce7f3', color: '#9f1239' }  // Pink for HR
      : styles.badgePending),                         // Yellow for Student
  }}
>
  {student.role === 'admin' 
    ? txt.admin 
    : student.role === 'hr' 
    ? 'HR' 
    : txt.student}
</span>
```

## ✅ Expected Result

After applying the fix:

```
✅ HR user creation works perfectly
✅ No foreign key constraint errors
✅ HR users display with pink "HR" badge
✅ Student and Admin users still work as before
✅ All three roles work: student, admin, hr
```

## 🎉 Done!

Your HR user creation should now work flawlessly! 🚀

## 📊 Summary

| Issue | Cause | Solution |
|-------|-------|----------|
| HR users can't be created | CHECK constraint only allows 'student' and 'admin' | Update constraint to include 'hr' |
| HR users show as "Student" in UI | Display logic doesn't handle 'hr' role | Add HR role handling with pink badge |

---

**Next Steps:**
1. ✅ Run the SQL script in Supabase Dashboard
2. ✅ Test creating an HR user
3. ✅ Verify HR user appears with pink badge
4. ✅ Confirm HR user can log in and access HR dashboard

Let me know if it works! 🚀

