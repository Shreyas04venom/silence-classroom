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
import { Hand, Loader2, User, FlaskConical } from "lucide-react"

const DEMO_CREDENTIALS = {
  email: "silentclassrooms.demo.student@gmail.com",
  rollNo: "DEMO001",
  password: "DemoStudent@123",
}

export default function StudentLoginPage() {
  const [email, setEmail] = useState("")
  const [rollNo, setRollNo] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [useRollNo, setUseRollNo] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const loginEmail = useRollNo ? `silentclassrooms.${rollNo.toLowerCase()}@gmail.com` : email

      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password,
      })
      if (error) throw error

      // Verify this is a student account from user_metadata first
      const userRole = data.user?.user_metadata?.role

      if (userRole !== "student") {
        // Fallback to profile check
        const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user.id).single()

        if (profile?.role !== "student") {
          await supabase.auth.signOut()
          throw new Error("This login is for students only.")
        }
      }

      router.push("/student/dashboard")
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Invalid email or password")
    } finally {
      setIsLoading(false)
    }
  }

  const fillDemoCredentials = () => {
    setUseRollNo(false)
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
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <User className="w-10 h-10 text-primary" />
          </div>
          <CardTitle className="text-3xl">Student Login</CardTitle>
          <CardDescription className="text-lg">Enter your credentials to access lessons</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="email" className="text-lg">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="student@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-14 text-xl"
                autoComplete="email"
              />
            </div>
            <div className="space-y-3">
              <Label htmlFor="password" className="text-lg">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-14 text-xl"
                autoComplete="current-password"
              />
            </div>
            {error && (
              <p className="text-base text-destructive bg-destructive/10 p-4 rounded-lg text-center" role="alert">
                {error}
              </p>
            )}
            <Button type="submit" className="w-full h-14 text-xl" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                  Logging in...
                </>
              ) : (
                "Enter Classroom"
              )}
            </Button>
          </form>

          <div className="mt-6 p-4 bg-muted/50 rounded-lg border border-dashed">
            <div className="flex items-center gap-2 mb-3">
              <FlaskConical className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Demo Student</span>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Try the student experience with a pre-configured demo account.
            </p>
            <Button type="button" variant="secondary" size="sm" onClick={fillDemoCredentials} className="w-full">
              Use Demo Student Credentials
            </Button>
            <div className="mt-3 text-xs text-muted-foreground space-y-1">
              <p>
                <strong>Email:</strong> {DEMO_CREDENTIALS.email}
              </p>
              <p>
                <strong>Password:</strong> {DEMO_CREDENTIALS.password}
              </p>
            </div>
          </div>

          <div className="mt-8 text-center text-sm text-muted-foreground">
            Are you a teacher?{" "}
            <Link href="/auth/login" className="text-primary hover:underline font-medium">
              Teacher Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
