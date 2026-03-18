import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export default async function NewClassPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  // Redirect to classes page where the dialog will be shown
  redirect("/classes")
}
