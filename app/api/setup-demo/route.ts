import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

// Demo credentials with valid email format
const DEMO_TEACHER = {
  email: "silentclassrooms.demo.teacher@gmail.com",
  password: "DemoTeacher@123",
  name: "Demo Teacher",
}

const DEMO_STUDENT = {
  email: "silentclassrooms.demo.student@gmail.com",
  rollNo: "DEMO001",
  password: "DemoStudent@123",
  name: "Demo Student",
}

export async function POST() {
  const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  try {
    // Check if demo teacher already exists by email using admin client
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    const existingTeacher = existingUsers?.users?.find((u) => u.email === DEMO_TEACHER.email)
    const existingStudent = existingUsers?.users?.find((u) => u.email === DEMO_STUDENT.email)

    let teacherId = existingTeacher?.id
    let studentId = existingStudent?.id

    // Create teacher if doesn't exist
    if (!teacherId) {
      const { data: teacherAuth, error: teacherError } = await supabaseAdmin.auth.admin.createUser({
        email: DEMO_TEACHER.email,
        password: DEMO_TEACHER.password,
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          name: DEMO_TEACHER.name,
          role: "teacher",
        },
      })

      if (teacherError) throw teacherError
      teacherId = teacherAuth?.user?.id

      // Create profile for teacher using admin client
      if (teacherId) {
        await supabaseAdmin.from("profiles").upsert({
          id: teacherId,
          name: DEMO_TEACHER.name,
          role: "teacher",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
      }
    }

    if (!teacherId) {
      return NextResponse.json({ error: "Failed to create teacher account" }, { status: 500 })
    }

    // Create student if doesn't exist
    if (!studentId) {
      const { data: studentAuth, error: studentError } = await supabaseAdmin.auth.admin.createUser({
        email: DEMO_STUDENT.email,
        password: DEMO_STUDENT.password,
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          name: DEMO_STUDENT.name,
          role: "student",
          roll_no: DEMO_STUDENT.rollNo,
        },
      })

      if (studentError) throw studentError
      studentId = studentAuth?.user?.id

      // Create profile for student using admin client
      if (studentId) {
        await supabaseAdmin.from("profiles").upsert({
          id: studentId,
          name: DEMO_STUDENT.name,
          role: "student",
          roll_no: DEMO_STUDENT.rollNo,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
      }
    }

    // Ensure profiles exist for both users (in case they were created previously without profiles)
    await supabaseAdmin.from("profiles").upsert([
      {
        id: teacherId,
        name: DEMO_TEACHER.name,
        role: "teacher",
        updated_at: new Date().toISOString(),
      },
      ...(studentId
        ? [
            {
              id: studentId,
              name: DEMO_STUDENT.name,
              role: "student",
              roll_no: DEMO_STUDENT.rollNo,
              updated_at: new Date().toISOString(),
            },
          ]
        : []),
    ])

    // Get or create a science subject
    let { data: subject } = await supabaseAdmin
      .from("subjects")
      .select("id")
      .eq("name", "Science")
      .eq("grade", "Std 6")
      .single()

    if (!subject) {
      const { data: newSubject } = await supabaseAdmin
        .from("subjects")
        .insert({
          name: "Science",
          board: "Maharashtra",
          grade: "Std 6",
          icon: "flask",
          description: "General Science for Std 6",
          created_by: teacherId,
        })
        .select("id")
        .single()
      subject = newSubject
    }

    if (!subject) {
      return NextResponse.json({ error: "Failed to create subject" }, { status: 500 })
    }

    // Check if demo class exists
    const { data: existingClass } = await supabaseAdmin
      .from("classes")
      .select("id")
      .eq("name", "Demo Class 6-A")
      .eq("teacher_id", teacherId)
      .single()

    let classId = existingClass?.id

    if (!classId) {
      const { data: newClass, error: classError } = await supabaseAdmin
        .from("classes")
        .insert({
          name: "Demo Class 6-A",
          grade: "Std 6",
          teacher_id: teacherId,
          description: "Demo class for testing Silent Classrooms features",
        })
        .select("id")
        .single()

      if (classError) throw classError
      classId = newClass?.id
    }

    // Assign student to class if both exist
    if (studentId && classId) {
      // Check if assignment exists
      const { data: existingAssignment } = await supabaseAdmin
        .from("class_assignments")
        .select("id")
        .eq("class_id", classId)
        .eq("student_id", studentId)
        .single()

      if (!existingAssignment) {
        await supabaseAdmin.from("class_assignments").insert({
          class_id: classId,
          student_id: studentId,
        })
      }
    }

    // Check if demo lesson exists
    const { data: existingLesson } = await supabaseAdmin
      .from("lessons")
      .select("id")
      .eq("title", "Photosynthesis - How Plants Make Food")
      .eq("teacher_id", teacherId)
      .single()

    let lessonId = existingLesson?.id

    if (!lessonId) {
      const { data: newLesson, error: lessonError } = await supabaseAdmin
        .from("lessons")
        .insert({
          subject_id: subject.id,
          teacher_id: teacherId,
          title: "Photosynthesis - How Plants Make Food",
          topic: "Photosynthesis Process",
          lesson_text: `Photosynthesis is the process by which plants make their own food using sunlight, water, and carbon dioxide. 
          
The leaves of plants contain a green pigment called chlorophyll, which captures sunlight. This energy is used to convert water (absorbed from roots) and carbon dioxide (absorbed from air through stomata) into glucose (sugar) and oxygen. 

The glucose is used by the plant for energy and growth, while oxygen is released into the air. This process is essential for life on Earth as it produces oxygen and forms the base of most food chains.`,
          summary:
            "Plants use sunlight, water, and CO2 to make food (glucose) and release oxygen through photosynthesis.",
          keywords: JSON.stringify([
            "photosynthesis",
            "chlorophyll",
            "sunlight",
            "carbon dioxide",
            "oxygen",
            "glucose",
            "leaves",
            "stomata",
          ]),
          is_published: true,
        })
        .select("id")
        .single()

      if (lessonError) throw lessonError
      lessonId = newLesson?.id

      if (lessonId) {
        // Create concepts
        const concepts = [
          { index: 1, title: "What is Photosynthesis?", notes: "Plants make their own food using sunlight" },
          { index: 2, title: "What Plants Need", notes: "Sunlight, water from roots, CO2 from air" },
          { index: 3, title: "What Plants Produce", notes: "Glucose (food) for energy, oxygen released to air" },
        ]

        for (const concept of concepts) {
          const { data: newConcept } = await supabaseAdmin
            .from("concepts")
            .insert({
              lesson_id: lessonId,
              index: concept.index,
              title: concept.title,
              notes: concept.notes,
            })
            .select("id")
            .single()

          if (newConcept) {
            await supabaseAdmin.from("media_resources").insert({
              lesson_id: lessonId,
              concept_id: newConcept.id,
              teacher_id: teacherId,
              media_type: "image",
              source: "placeholder",
              url: `/placeholder.svg?height=400&width=600&query=${encodeURIComponent(concept.title)}`,
              thumbnail_url: `/placeholder.svg?height=100&width=150&query=${encodeURIComponent(concept.title)}`,
              title: concept.title,
              meta: JSON.stringify({ keyword: concept.title.toLowerCase() }),
            })
          }
        }

        // Assign lesson to class
        if (classId) {
          await supabaseAdmin.from("lesson_assignments").insert({
            lesson_id: lessonId,
            class_id: classId,
            due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          })
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "Demo accounts and data created successfully!",
      credentials: {
        teacher: {
          email: DEMO_TEACHER.email,
          password: DEMO_TEACHER.password,
        },
        student: {
          email: DEMO_STUDENT.email,
          rollNo: DEMO_STUDENT.rollNo,
          password: DEMO_STUDENT.password,
        },
      },
    })
  } catch (error) {
    console.error("Setup demo error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to setup demo" },
      { status: 500 },
    )
  }
}

export async function GET() {
  return NextResponse.json({
    teacher: {
      email: DEMO_TEACHER.email,
      password: DEMO_TEACHER.password,
    },
    student: {
      email: DEMO_STUDENT.email,
      rollNo: DEMO_STUDENT.rollNo,
      password: DEMO_STUDENT.password,
    },
  })
}
