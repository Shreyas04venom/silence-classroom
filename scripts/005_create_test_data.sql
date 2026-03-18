-- Test Data for Silent Classrooms
-- Run this AFTER creating test accounts via the app UI

-- ==================================================
-- INSTRUCTIONS FOR CREATING TEST ACCOUNTS:
-- ==================================================
-- 
-- TEACHER ACCOUNT:
-- 1. Go to /auth/login and click "Create account" under Teacher
-- 2. Use these credentials:
--    - Email: teacher@silentclassrooms.test
--    - Password: Teacher@123
--    - Name: Demo Teacher
--
-- STUDENT ACCOUNT:
-- 1. Students are created by teachers from the Classes page
-- 2. After teacher creates a class and adds a student:
--    - Roll No (Username): STU001
--    - Password: Student@123
--    - Name: Demo Student
--
-- ==================================================

-- After the teacher account is created, run this to get the teacher's UUID:
-- SELECT id FROM auth.users WHERE email = 'teacher@silentclassrooms.test';

-- Then update the variable below with that UUID and run the rest:

-- Create a function to set up test data for a teacher
CREATE OR REPLACE FUNCTION setup_test_data(teacher_uuid UUID)
RETURNS TEXT AS $$
DECLARE
  science_subject_id UUID;
  math_subject_id UUID;
  test_lesson_id UUID;
  test_class_id UUID;
  concept1_id UUID;
  concept2_id UUID;
  concept3_id UUID;
BEGIN
  -- Get subject IDs
  SELECT id INTO science_subject_id FROM public.subjects 
  WHERE name = 'Science' AND grade = 'Std 6' LIMIT 1;
  
  SELECT id INTO math_subject_id FROM public.subjects 
  WHERE name = 'Mathematics' AND grade = 'Std 6' LIMIT 1;

  -- Create a test class
  INSERT INTO public.classes (id, name, grade, teacher_id, description)
  VALUES (
    uuid_generate_v4(),
    'Class 6-A',
    'Std 6',
    teacher_uuid,
    'Standard 6 Section A - Morning batch for deaf students'
  ) RETURNING id INTO test_class_id;

  -- Create a sample lesson: Photosynthesis
  INSERT INTO public.lessons (id, subject_id, teacher_id, title, topic, lesson_text, summary, keywords, is_published)
  VALUES (
    uuid_generate_v4(),
    science_subject_id,
    teacher_uuid,
    'Photosynthesis - How Plants Make Food',
    'Photosynthesis Process',
    'Photosynthesis is the process by which plants make their own food using sunlight, water, and carbon dioxide. The leaves of plants contain a green pigment called chlorophyll, which captures sunlight. This energy is used to convert water (absorbed from roots) and carbon dioxide (absorbed from air through stomata) into glucose (sugar) and oxygen. The glucose is used by the plant for energy and growth, while oxygen is released into the air. This process is essential for life on Earth as it produces oxygen and forms the base of most food chains.',
    'Plants use sunlight, water, and CO2 to make food (glucose) and release oxygen through a process called photosynthesis.',
    '["photosynthesis", "chlorophyll", "sunlight", "carbon dioxide", "oxygen", "glucose", "leaves", "stomata", "plants", "food chain"]'::jsonb,
    true
  ) RETURNING id INTO test_lesson_id;

  -- Create concepts for the lesson
  INSERT INTO public.concepts (id, lesson_id, index, title, notes)
  VALUES (
    uuid_generate_v4(),
    test_lesson_id,
    1,
    'What is Photosynthesis?',
    'The process where plants make their own food using sunlight'
  ) RETURNING id INTO concept1_id;

  INSERT INTO public.concepts (id, lesson_id, index, title, notes)
  VALUES (
    uuid_generate_v4(),
    test_lesson_id,
    2,
    'What Plants Need',
    'Sunlight, water from roots, and carbon dioxide from air'
  ) RETURNING id INTO concept2_id;

  INSERT INTO public.concepts (id, lesson_id, index, title, notes)
  VALUES (
    uuid_generate_v4(),
    test_lesson_id,
    3,
    'What Plants Produce',
    'Glucose (food/sugar) for energy and oxygen released to air'
  ) RETURNING id INTO concept3_id;

  -- Add sample media resources
  INSERT INTO public.media_resources (lesson_id, concept_id, teacher_id, media_type, source, url, thumbnail_url, title, meta)
  VALUES 
    (test_lesson_id, concept1_id, teacher_uuid, 'image', 'placeholder', '/placeholder.svg?height=400&width=600', '/placeholder.svg?height=100&width=150', 'Photosynthesis Diagram', '{"keyword": "photosynthesis"}'::jsonb),
    (test_lesson_id, concept2_id, teacher_uuid, 'image', 'placeholder', '/placeholder.svg?height=400&width=600', '/placeholder.svg?height=100&width=150', 'Plant Absorbing Water', '{"keyword": "water absorption"}'::jsonb),
    (test_lesson_id, concept2_id, teacher_uuid, 'image', 'placeholder', '/placeholder.svg?height=400&width=600', '/placeholder.svg?height=100&width=150', 'Leaf Stomata', '{"keyword": "stomata"}'::jsonb),
    (test_lesson_id, concept3_id, teacher_uuid, 'image', 'placeholder', '/placeholder.svg?height=400&width=600', '/placeholder.svg?height=100&width=150', 'Oxygen Release', '{"keyword": "oxygen"}'::jsonb),
    (test_lesson_id, concept1_id, teacher_uuid, 'image', 'placeholder', '/placeholder.svg?height=400&width=600', '/placeholder.svg?height=100&width=150', 'Chlorophyll in Leaves', '{"keyword": "chlorophyll"}'::jsonb);

  -- Assign lesson to class
  INSERT INTO public.lesson_assignments (lesson_id, class_id, due_date)
  VALUES (test_lesson_id, test_class_id, NOW() + INTERVAL '7 days');

  -- Create another sample lesson: Basic Addition
  INSERT INTO public.lessons (id, subject_id, teacher_id, title, topic, lesson_text, summary, keywords, is_published)
  VALUES (
    uuid_generate_v4(),
    math_subject_id,
    teacher_uuid,
    'Addition of Numbers',
    'Basic Addition',
    'Addition is the process of combining two or more numbers to get a total. When we add numbers, we use the plus (+) sign. The result of addition is called the sum. For example, 2 + 3 = 5. Here, 2 and 3 are called addends, and 5 is the sum. Addition can be done with small numbers using fingers or with larger numbers using place value. The order of numbers in addition does not matter - this is called the commutative property. So 3 + 2 is the same as 2 + 3.',
    'Addition combines numbers to get a sum using the + sign. The order does not matter (commutative property).',
    '["addition", "sum", "plus", "addends", "commutative", "numbers", "total", "combine"]'::jsonb,
    true
  );

  RETURN 'Test data created successfully! Class: ' || test_class_id::text || ', Lesson: ' || test_lesson_id::text;
END;
$$ LANGUAGE plpgsql;

-- USAGE: After creating teacher account, run:
-- SELECT setup_test_data('YOUR-TEACHER-UUID-HERE');
