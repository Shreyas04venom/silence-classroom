-- Fix infinite recursion in profiles RLS policy
-- The issue: "Teachers can view all student profiles" policy references profiles table within itself

-- First, drop the problematic policy
DROP POLICY IF EXISTS "Teachers can view all student profiles" ON public.profiles;

-- Recreate without recursion by using auth.jwt() to get user metadata directly
-- This avoids querying the profiles table within its own policy
CREATE POLICY "Teachers can view all student profiles" ON public.profiles 
  FOR SELECT USING (
    auth.uid() = id 
    OR (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'teacher'
  );

-- Also fix any other policies that might cause recursion issues
-- Drop and recreate subjects policies to use jwt instead of profiles lookup
DROP POLICY IF EXISTS "Teachers can create subjects" ON public.subjects;
DROP POLICY IF EXISTS "Teachers can update subjects" ON public.subjects;

CREATE POLICY "Teachers can create subjects" ON public.subjects 
  FOR INSERT WITH CHECK (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'teacher'
  );

CREATE POLICY "Teachers can update subjects" ON public.subjects 
  FOR UPDATE USING (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'teacher'
  );

-- Fix lessons insert policy
DROP POLICY IF EXISTS "Teachers can create lessons" ON public.lessons;

CREATE POLICY "Teachers can create lessons" ON public.lessons 
  FOR INSERT WITH CHECK (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'teacher'
    AND teacher_id = auth.uid()
  );
