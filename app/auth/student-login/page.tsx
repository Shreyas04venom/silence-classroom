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
import { Hand, Loader2, User, FlaskConical } from "lucide-react"

const DEMO_CREDENTIALS = {
  email: "silentclassrooms.demo.student@gmail.com",
  rollNo: "DEMO001",
  password: "DemoStudent@123",
}

export default function StudentLoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      // Verify this is a student account from Firestore
      const profileDoc = await getDoc(doc(firestore, "profiles", user.uid))
      const profileData = profileDoc.data()

      if (!profileDoc.exists() || profileData?.role !== "student") {
        await auth.signOut()
        throw new Error("This login is for students only.")
      }

      router.push("/student/dashboard")
    } catch (error: any) {
      setError(error.message || "Invalid email or password")
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    console.log("Starting Google Student Login...")
    setIsGoogleLoading(true)
    setError(null)
    try {
      console.log("Calling signInWithPopup...")
      const result = await signInWithPopup(auth, googleProvider)
      const user = result.user
      console.log("Sign-in successful for student:", user.email)

      // Check for Student role in Firestore
      console.log("Checking for student profile in Firestore...")
      const profileDoc = await getDoc(doc(firestore, "profiles", user.uid))
      
      if (!profileDoc.exists()) {
        console.log("Student profile not found, creating new student profile...")
        // If profile doesn't exist, create one as student
        await setDoc(doc(firestore, "profiles", user.uid), {
          name: user.displayName || "Student",
          email: user.email,
          role: "student",
          createdAt: new Date().toISOString(),
        })
      } else if (profileDoc.data()?.role !== "student") {
        console.log("Account is not a student, signing out...")
        await auth.signOut()
        throw new Error("This account is not registered as a student.")
      }

      console.log("Redirecting to student dashboard...")
      router.push("/student/dashboard")
    } catch (error: any) {
      console.error("Student Google login error:", error)
      setError(error.message || "Google login failed")
    } finally {
      setIsGoogleLoading(false)
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
            <Button type="submit" className="w-full h-14 text-xl" disabled={isLoading || isGoogleLoading}>
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

          <div className="relative my-8">
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
            className="w-full h-14 text-xl"
            onClick={handleGoogleLogin}
            disabled={isLoading || isGoogleLoading}
          >
            {isGoogleLoading ? (
              <Loader2 className="mr-2 h-6 w-6 animate-spin" />
            ) : (
              <svg className="mr-3 h-6 w-6" viewBox="0 0 24 24">
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

