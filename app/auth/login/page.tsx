"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Hand, Loader2, FlaskConical } from "lucide-react"

const DEMO_CREDENTIALS = {
  email: "silentclassrooms.demo.teacher@gmail.com",
  password: "DemoTeacher@123",
}

export default function TeacherLoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSettingUpDemo, setIsSettingUpDemo] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error

      // Check if user is a teacher from user_metadata first (avoids RLS issues)
      const userRole = data.user?.user_metadata?.role

      if (userRole !== "teacher") {
        // Fallback to profile check
        const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user.id).single()

        if (profile?.role !== "teacher") {
          await supabase.auth.signOut()
          throw new Error("This login is for teachers only. Please use Student Login.")
        }
      }

      router.push("/dashboard")
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSetupDemo = async () => {
    setIsSettingUpDemo(true)
    setError(null)

    try {
      const res = await fetch("/api/setup-demo", { method: "POST" })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error)

      // Auto-fill credentials
      setEmail(data.credentials.teacher.email)
      setPassword(data.credentials.teacher.password)
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to setup demo")
    } finally {
      setIsSettingUpDemo(false)
    }
  }

  const fillDemoCredentials = () => {
    setEmail(DEMO_CREDENTIALS.email)
    setPassword(DEMO_CREDENTIALS.password)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      <Link href="/" className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
          <Hand className="w-6 h-6 text-primary-foreground" />
        </div>
        <span className="text-xl font-bold">Silent Classrooms</span>
      </Link>

      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Teacher Login</CardTitle>
          <CardDescription>Enter your credentials to access your dashboard</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="teacher@school.edu"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 text-base"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 text-base"
              />
            </div>
            {error && (
              <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg" role="alert">
                {error}
              </p>
            )}
            <Button type="submit" className="w-full h-12 text-base" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Logging in...
                </>
              ) : (
                "Login"
              )}
            </Button>
          </form>

          <div className="mt-6 p-4 bg-muted/50 rounded-lg border border-dashed">
            <div className="flex items-center gap-2 mb-3">
              <FlaskConical className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Demo Mode</span>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Try the app with pre-configured test data including a teacher account, student, class, and sample lesson.
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSetupDemo}
                disabled={isSettingUpDemo}
                className="flex-1 bg-transparent"
              >
                {isSettingUpDemo ? (
                  <>
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    Setting up...
                  </>
                ) : (
                  "Setup Demo Data"
                )}
              </Button>
              <Button type="button" variant="secondary" size="sm" onClick={fillDemoCredentials} className="flex-1">
                Use Demo Credentials
              </Button>
            </div>
            <div className="mt-3 text-xs text-muted-foreground space-y-1">
              <p>
                <strong>Email:</strong> {DEMO_CREDENTIALS.email}
              </p>
              <p>
                <strong>Password:</strong> {DEMO_CREDENTIALS.password}
              </p>
            </div>
          </div>

          <div className="mt-6 text-center text-sm">
            <p className="text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link href="/auth/signup" className="text-primary hover:underline font-medium">
                Sign up
              </Link>
            </p>
            <p className="text-muted-foreground mt-2">
              Are you a student?{" "}
              <Link href="/auth/student-login" className="text-primary hover:underline font-medium">
                Student Login
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
