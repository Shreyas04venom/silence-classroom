"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Hand,
  Loader2,
  FlaskConical,
  GraduationCap,
  Users,
  CheckCircle2,
  ArrowRight,
  BookOpen,
  Monitor,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"

const DEMO_TEACHER = {
  email: "silentclassrooms.demo.teacher@gmail.com",
  password: "DemoTeacher@123",
}

const DEMO_STUDENT = {
  email: "silentclassrooms.demo.student@gmail.com",
  rollNo: "DEMO001",
  password: "DemoStudent@123",
}

export default function DemoPage() {
  const [isSettingUp, setIsSettingUp] = useState(false)
  const [setupComplete, setSetupComplete] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoggingIn, setIsLoggingIn] = useState<"teacher" | "student" | null>(null)
  const router = useRouter()

  const handleSetupDemo = async () => {
    setIsSettingUp(true)
    setError(null)

    try {
      const res = await fetch("/api/setup-demo", { method: "POST" })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error)
      setSetupComplete(true)
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to setup demo")
    } finally {
      setIsSettingUp(false)
    }
  }

  const loginAsTeacher = async () => {
    setIsLoggingIn("teacher")
    setError(null)
    const supabase = createClient()
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: DEMO_TEACHER.email,
        password: DEMO_TEACHER.password,
      })
      if (error) throw error
      router.push("/dashboard")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to login. Please try using the login page.")
      setIsLoggingIn(null)
    }
  }

  const loginAsStudent = async () => {
    setIsLoggingIn("student")
    setError(null)
    const supabase = createClient()
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: DEMO_STUDENT.email,
        password: DEMO_STUDENT.password,
      })
      if (error) throw error
      router.push("/student/dashboard")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to login. Please try using the login page.")
      setIsLoggingIn(null)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <Hand className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">Silent Classrooms</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/auth/login">
              <Button variant="ghost">Teacher Login</Button>
            </Link>
            <Link href="/auth/student-login">
              <Button variant="outline" className="bg-transparent">
                Student Login
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="text-center mb-12">
          <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <FlaskConical className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Try Silent Classrooms</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Experience the full application with pre-configured demo accounts, a sample class, and a lesson on
            Photosynthesis.
          </p>
        </div>

        {!setupComplete ? (
          <Card className="mb-8">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Setup Demo Environment</CardTitle>
              <CardDescription className="text-base">
                This will create test accounts and sample data for you to explore
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-muted/50 text-center">
                  <GraduationCap className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <p className="font-medium">Demo Teacher</p>
                  <p className="text-sm text-muted-foreground">Full dashboard access</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50 text-center">
                  <Users className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <p className="font-medium">Demo Student</p>
                  <p className="text-sm text-muted-foreground">Student kiosk view</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50 text-center">
                  <BookOpen className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <p className="font-medium">Sample Lesson</p>
                  <p className="text-sm text-muted-foreground">Photosynthesis (Std 6)</p>
                </div>
              </div>

              {error && (
                <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg text-center">{error}</p>
              )}

              <Button onClick={handleSetupDemo} disabled={isSettingUp} className="w-full h-14 text-lg" size="lg">
                {isSettingUp ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Setting up demo environment...
                  </>
                ) : (
                  <>
                    <FlaskConical className="mr-2 h-5 w-5" />
                    Setup Demo & Create Accounts
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="mb-8 border-green-500/50 bg-green-500/5">
            <CardHeader className="text-center">
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>
              <CardTitle className="text-2xl text-green-700 dark:text-green-400">Demo Ready!</CardTitle>
              <CardDescription className="text-base">Choose how you want to explore the application</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg text-center">{error}</p>
              )}
              <div className="grid md:grid-cols-2 gap-4">
                <Card
                  className="cursor-pointer hover:border-primary transition-colors"
                  onClick={loginAsTeacher}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && loginAsTeacher()}
                >
                  <CardContent className="p-6 text-center">
                    <GraduationCap className="h-12 w-12 mx-auto mb-4 text-primary" />
                    <h3 className="text-xl font-semibold mb-2">Enter as Teacher</h3>
                    <p className="text-sm text-muted-foreground mb-4">Create lessons, manage classes, view analytics</p>
                    <Button className="w-full gap-2" disabled={isLoggingIn === "teacher"}>
                      {isLoggingIn === "teacher" ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Logging in...
                        </>
                      ) : (
                        <>
                          Teacher Dashboard <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </Button>
                    <div className="mt-4 text-xs text-muted-foreground">
                      <p>{DEMO_TEACHER.email}</p>
                      <p>{DEMO_TEACHER.password}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card
                  className="cursor-pointer hover:border-primary transition-colors"
                  onClick={loginAsStudent}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && loginAsStudent()}
                >
                  <CardContent className="p-6 text-center">
                    <Monitor className="h-12 w-12 mx-auto mb-4 text-primary" />
                    <h3 className="text-xl font-semibold mb-2">Enter as Student</h3>
                    <p className="text-sm text-muted-foreground mb-4">View lessons, track progress, kiosk display</p>
                    <Button
                      variant="outline"
                      className="w-full gap-2 bg-transparent"
                      disabled={isLoggingIn === "student"}
                    >
                      {isLoggingIn === "student" ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Logging in...
                        </>
                      ) : (
                        <>
                          Student View <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </Button>
                    <div className="mt-4 text-xs text-muted-foreground">
                      <p>{DEMO_STUDENT.email}</p>
                      <p>{DEMO_STUDENT.password}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Demo credentials reference */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Demo Credentials Reference</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" /> Teacher Account
                </h4>
                <div className="bg-muted p-3 rounded-lg font-mono text-sm space-y-1">
                  <p>
                    <span className="text-muted-foreground">Email:</span> {DEMO_TEACHER.email}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Password:</span> {DEMO_TEACHER.password}
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <Users className="h-4 w-4" /> Student Account
                </h4>
                <div className="bg-muted p-3 rounded-lg font-mono text-sm space-y-1">
                  <p>
                    <span className="text-muted-foreground">Email:</span> {DEMO_STUDENT.email}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Password:</span> {DEMO_STUDENT.password}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
