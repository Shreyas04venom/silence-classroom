-- Enable Row Level Security on all tables

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.concepts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visual_recall ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles 
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles 
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles 
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Teachers can view all student profiles" ON public.profiles 
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'teacher')
  );

-- Subjects policies (readable by all authenticated, writable by teachers)
CREATE POLICY "Anyone can view subjects" ON public.subjects 
  FOR SELECT USING (TRUE);

CREATE POLICY "Teachers can create subjects" ON public.subjects 
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'teacher')
  );

CREATE POLICY "Teachers can update subjects" ON public.subjects 
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'teacher')
  );

-- Lessons policies
CREATE POLICY "Teachers can view own lessons" ON public.lessons 
  FOR SELECT USING (teacher_id = auth.uid());

CREATE POLICY "Students can view assigned lessons" ON public.lessons 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.lesson_assignments la
      JOIN public.class_assignments ca ON la.class_id = ca.class_id
      WHERE la.lesson_id = lessons.id AND ca.student_id = auth.uid()
    )
    OR is_published = TRUE
  );

CREATE POLICY "Teachers can create lessons" ON public.lessons 
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'teacher')
    AND teacher_id = auth.uid()
  );

CREATE POLICY "Teachers can update own lessons" ON public.lessons 
  FOR UPDATE USING (teacher_id = auth.uid());

CREATE POLICY "Teachers can delete own lessons" ON public.lessons 
  FOR DELETE USING (teacher_id = auth.uid());

-- Concepts policies
CREATE POLICY "Anyone can view concepts of accessible lessons" ON public.concepts 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.lessons l 
      WHERE l.id = concepts.lesson_id 
      AND (l.teacher_id = auth.uid() OR l.is_published = TRUE)
    )
  );

CREATE POLICY "Teachers can manage concepts" ON public.concepts 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.lessons l 
      WHERE l.id = concepts.lesson_id AND l.teacher_id = auth.uid()
    )
  );

-- Media resources policies
CREATE POLICY "Anyone can view media of accessible lessons" ON public.media_resources 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.lessons l 
      WHERE l.id = media_resources.lesson_id 
      AND (l.teacher_id = auth.uid() OR l.is_published = TRUE)
    )
  );

CREATE POLICY "Teachers can manage media" ON public.media_resources 
  FOR ALL USING (teacher_id = auth.uid());

-- Classes policies
CREATE POLICY "Teachers can view own classes" ON public.classes 
  FOR SELECT USING (teacher_id = auth.uid());

CREATE POLICY "Students can view assigned classes" ON public.classes 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.class_assignments 
      WHERE class_id = classes.id AND student_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can manage own classes" ON public.classes 
  FOR ALL USING (teacher_id = auth.uid());

-- Class assignments policies
CREATE POLICY "Teachers can view class assignments" ON public.class_assignments 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.classes c WHERE c.id = class_id AND c.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Students can view own assignments" ON public.class_assignments 
  FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Teachers can manage class assignments" ON public.class_assignments 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.classes c WHERE c.id = class_id AND c.teacher_id = auth.uid()
    )
  );

-- Lesson assignments policies
CREATE POLICY "Anyone can view lesson assignments" ON public.lesson_assignments 
  FOR SELECT USING (TRUE);

CREATE POLICY "Teachers can manage lesson assignments" ON public.lesson_assignments 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.lessons l WHERE l.id = lesson_id AND l.teacher_id = auth.uid()
    )
  );

-- Student progress policies
CREATE POLICY "Students can view own progress" ON public.student_progress 
  FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Teachers can view student progress" ON public.student_progress 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.lessons l WHERE l.id = lesson_id AND l.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Students can insert own progress" ON public.student_progress 
  FOR INSERT WITH CHECK (student_id = auth.uid());

-- Favorites policies
CREATE POLICY "Users can manage own favorites" ON public.favorites 
  FOR ALL USING (user_id = auth.uid());

-- API cache policies (service role only in practice, but allow read for caching)
CREATE POLICY "Anyone can read cache" ON public.api_cache FOR SELECT USING (TRUE);
CREATE POLICY "Service can manage cache" ON public.api_cache FOR ALL USING (TRUE);

-- Visual recall policies
CREATE POLICY "Students can manage own visual recall" ON public.visual_recall 
  FOR ALL USING (student_id = auth.uid());

CREATE POLICY "Teachers can view student visual recall" ON public.visual_recall 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.lessons l WHERE l.id = lesson_id AND l.teacher_id = auth.uid()
    )
  );
