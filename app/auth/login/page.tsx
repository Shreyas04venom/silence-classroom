"use client"

import type React from "react"
import { auth, firestore, googleProvider } from "@/lib/firebase"
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth"
import { doc, getDoc, setDoc } from "firebase/firestore"
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
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [isSettingUpDemo, setIsSettingUpDemo] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      // Check for Teacher role in Firestore
      const profileDoc = await getDoc(doc(firestore, "profiles", user.uid))
      const profileData = profileDoc.data()

      if (!profileDoc.exists() || profileData?.role !== "teacher") {
        await auth.signOut()
        throw new Error("This login is for teachers only. Please use Student Login.")
      }

      router.push("/dashboard")
    } catch (error: any) {
      setError(error.message || "Invalid email or password")
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    console.log("Starting Google Login...")
    setIsGoogleLoading(true)
    setError(null)
    try {
      console.log("Calling signInWithPopup...")
      const result = await signInWithPopup(auth, googleProvider)
      const user = result.user
      console.log("Sign-in successful for user:", user.email)

      // Check for Teacher role in Firestore
      console.log("Checking for profile in Firestore...")
      const profileDoc = await getDoc(doc(firestore, "profiles", user.uid))
      
      if (!profileDoc.exists()) {
        console.log("Profile not found, creating new teacher profile...")
        // If profile doesn't exist, create one as teacher (for demo/simplicity)
        await setDoc(doc(firestore, "profiles", user.uid), {
          name: user.displayName || "Teacher",
          email: user.email,
          role: "teacher",
          createdAt: new Date().toISOString(),
        })
      } else if (profileDoc.data()?.role !== "teacher") {
        console.log("Account is not a teacher, signing out...")
        await auth.signOut()
        throw new Error("This account is not registered as a teacher.")
      }

      console.log("Redirecting to dashboard...")
      router.push("/dashboard")
    } catch (error: any) {
      console.error("Google login error:", error)
      setError(error.message || "Google login failed")
    } finally {
      setIsGoogleLoading(false)
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
      
      // Note: User still needs to be created in Firebase Auth if not already there.
      // We show a message to the user.
      setError("Demo data setup in Supabase. Ensure these credentials exist in Firebase Auth too.")
    } catch (error: any) {
      setError(error.message || "Failed to setup demo")
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
            <Button type="submit" className="w-full h-12 text-base" disabled={isLoading || isGoogleLoading}>
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

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>

          <Button
            variant="outline"
            type="button"
            className="w-full h-12 text-base"
            onClick={handleGoogleLogin}
            disabled={isLoading || isGoogleLoading}
          >
            {isGoogleLoading ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1c-4.3 0-8.08 2.54-9.82 6.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
            )}
            Sign in with Google
          </Button>

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

