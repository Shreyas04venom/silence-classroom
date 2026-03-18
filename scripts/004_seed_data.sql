-- Seed Maharashtra Board subjects for Standards 6-8

-- First, we need to insert subjects without created_by since we don't have a teacher yet
-- These will be system subjects

INSERT INTO public.subjects (id, board, name, grade, description, icon) VALUES
  -- Standard 6
  (uuid_generate_v4(), 'Maharashtra', 'Science', 'Std 6', 'General Science for Standard 6 covering Physics, Chemistry, and Biology basics', '🔬'),
  (uuid_generate_v4(), 'Maharashtra', 'Mathematics', 'Std 6', 'Mathematics covering basic algebra, geometry, and arithmetic', '📐'),
  (uuid_generate_v4(), 'Maharashtra', 'English', 'Std 6', 'English language and literature', '📚'),
  (uuid_generate_v4(), 'Maharashtra', 'Marathi', 'Std 6', 'Marathi language and literature', '📖'),
  (uuid_generate_v4(), 'Maharashtra', 'Social Science', 'Std 6', 'History, Geography, and Civics', '🌍'),
  
  -- Standard 7
  (uuid_generate_v4(), 'Maharashtra', 'Science', 'Std 7', 'General Science for Standard 7 with advanced concepts', '🔬'),
  (uuid_generate_v4(), 'Maharashtra', 'Mathematics', 'Std 7', 'Mathematics including linear equations and data handling', '📐'),
  (uuid_generate_v4(), 'Maharashtra', 'English', 'Std 7', 'English language and literature', '📚'),
  (uuid_generate_v4(), 'Maharashtra', 'Marathi', 'Std 7', 'Marathi language and literature', '📖'),
  (uuid_generate_v4(), 'Maharashtra', 'Social Science', 'Std 7', 'History, Geography, and Civics', '🌍'),
  
  -- Standard 8
  (uuid_generate_v4(), 'Maharashtra', 'Science', 'Std 8', 'General Science including Physics, Chemistry, Biology', '🔬'),
  (uuid_generate_v4(), 'Maharashtra', 'Mathematics', 'Std 8', 'Mathematics including quadratic equations and geometry', '📐'),
  (uuid_generate_v4(), 'Maharashtra', 'English', 'Std 8', 'English language and literature', '📚'),
  (uuid_generate_v4(), 'Maharashtra', 'Marathi', 'Std 8', 'Marathi language and literature', '📖'),
  (uuid_generate_v4(), 'Maharashtra', 'Social Science', 'Std 8', 'History, Geography, and Civics', '🌍')
ON CONFLICT DO NOTHING;
