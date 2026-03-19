"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { onAuthStateChanged } from "firebase/auth"
import { doc, getDoc } from "firebase/firestore"
import { auth, firestore } from "@/lib/firebase"
import { VICTeacherDashboard } from "@/components/vic-teacher-dashboard"
import { Loader2, Hand } from "lucide-react"

export default function TeacherDashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState<string>("Teacher")

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/auth/login")
        return
      }

      try {
        const profileDoc = await getDoc(doc(firestore, "profiles", user.uid))
        const profile = profileDoc.data()

        if (!profile || profile.role !== "teacher") {
          router.push("/auth/student-login")
          return
        }

        setUserName(profile.name || user.displayName || "Teacher")
      } catch (err) {
        console.error("Error fetching profile:", err)
        router.push("/auth/login")
        return
      }

      setLoading(false)
    })

    return () => unsubscribe()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center">
          <Hand className="w-7 h-7 text-primary-foreground" />
        </div>
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading your dashboard...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary flex items-center justify-center rounded-lg">
              <Hand className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <span className="text-xl font-bold">Silent Classrooms</span>
              <p className="text-sm text-muted-foreground">Teacher Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">Welcome, {userName}</span>
            <button
              className="text-sm text-destructive hover:underline"
              onClick={async () => {
                await auth.signOut()
                router.push("/")
              }}
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* VIC Teacher Dashboard — same as demo-learn */}
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <VICTeacherDashboard onClose={() => router.push("/")} />
      </main>
    </div>
  )
}
