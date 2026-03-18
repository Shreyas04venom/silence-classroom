import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    const board = searchParams.get("board") || "Maharashtra"
    const grade = searchParams.get("grade")

    let query = supabase.from("subjects").select("*").eq("board", board).order("name")

    if (grade) {
      query = query.eq("grade", grade)
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error("Subjects fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch subjects" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, grade, description, board = "Maharashtra" } = body

    if (!name || !grade) {
      return NextResponse.json({ error: "Name and grade are required" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("subjects")
      .insert({
        name,
        grade,
        description,
        board,
        created_by: user.id,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error("Subject create error:", error)
    return NextResponse.json({ error: "Failed to create subject" }, { status: 500 })
  }
}
