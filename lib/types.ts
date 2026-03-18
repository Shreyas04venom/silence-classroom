export interface Profile {
  id: string
  name: string
  role: "teacher" | "student"
  roll_no?: string
  avatar_url?: string
  preferred_language?: string
  created_at: string
  updated_at: string
}

export interface Subject {
  id: string
  board: string
  name: string
  grade: string
  description?: string
  icon?: string
  created_by?: string
  created_at: string
}

export interface Lesson {
  id: string
  subject_id: string
  teacher_id: string
  title: string
  topic?: string
  lesson_text?: string
  summary?: string
  keywords: string[]
  is_published: boolean
  created_at: string
  updated_at: string
  subject?: Subject
  concepts?: Concept[]
  media_resources?: MediaResource[]
}

export interface Concept {
  id: string
  lesson_id: string
  index: number
  title: string
  notes?: string
  sign_language_video_url?: string
  created_at: string
  media_resources?: MediaResource[]
}

export interface MediaResource {
  id: string
  concept_id?: string
  lesson_id: string
  teacher_id: string
  media_type: "image" | "video" | "animation" | "gif"
  source: string
  url: string
  thumbnail_url?: string
  title?: string
  meta: Record<string, unknown>
  created_at: string
}

export interface Class {
  id: string
  name: string
  grade: string
  teacher_id: string
  description?: string
  created_at: string
  students?: Profile[]
}

export interface ClassAssignment {
  id: string
  class_id: string
  student_id: string
  assigned_at: string
  student?: Profile
}

export interface LessonAssignment {
  id: string
  lesson_id: string
  class_id: string
  assigned_at: string
  due_date?: string
}

export interface StudentProgress {
  id: string
  student_id: string
  lesson_id: string
  concept_id?: string
  action: "viewed" | "understood" | "replay" | "completed"
  duration_seconds: number
  created_at: string
}

export interface Favorite {
  id: string
  user_id: string
  lesson_id?: string
  media_id?: string
  created_at: string
}

export interface VisualRecall {
  id: string
  student_id: string
  lesson_id: string
  next_review_at: string
  interval_days: number
  ease_factor: number
  repetitions: number
  created_at: string
}

export interface GenerateResponse {
  lessonId: string
  summary: string
  keywords: string[]
  mediaResources: MediaResource[]
}
