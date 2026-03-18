import { type NextRequest, NextResponse } from "next/server"
import { createClient, createAdminClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verify teacher is logged in
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify user is a teacher
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

    if (profile?.role !== "teacher") {
      return NextResponse.json({ error: "Only teachers can register students" }, { status: 403 })
    }

    const body = await request.json()
    const { name, rollNo, classId } = body

    if (!name || !rollNo) {
      return NextResponse.json({ error: "Name and roll number are required" }, { status: 400 })
    }

    // Use admin client for creating user
    const adminSupabase = await createAdminClient()

    // Create student account with roll_no as both identifier and password
    const email = `${rollNo.toLowerCase()}@silentclass.local`

    const { data: newUser, error: createError } = await adminSupabase.auth.admin.createUser({
      email,
      password: rollNo, // Default password is roll number
      email_confirm: true, // Auto-confirm for student accounts
      user_metadata: {
        name,
        role: "student",
        roll_no: rollNo,
      },
    })

    if (createError) {
      if (createError.message.includes("already registered")) {
        return NextResponse.json({ error: "A student with this roll number already exists" }, { status: 409 })
      }
      throw createError
    }

    // Assign to class if provided
    if (classId && newUser.user) {
      await supabase.from("class_assignments").insert({
        class_id: classId,
        student_id: newUser.user.id,
      })
    }

    return NextResponse.json(
      {
        success: true,
        student: {
          id: newUser.user?.id,
          name,
          rollNo,
          email,
        },
        message: `Student ${name} created. Login: Roll No: ${rollNo}, Password: ${rollNo}`,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Student registration error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to register student" },
      { status: 500 },
    )
  }
}
