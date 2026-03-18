import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Hand, Mail, CheckCircle } from "lucide-react"

export default function SignupSuccessPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      <Link href="/" className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
          <Hand className="w-6 h-6 text-primary-foreground" />
        </div>
        <span className="text-xl font-bold">Silent Classrooms</span>
      </Link>

      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-success" />
          </div>
          <CardTitle className="text-2xl">Account Created!</CardTitle>
          <CardDescription>Please check your email to confirm your account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-center gap-3 p-4 bg-secondary rounded-lg">
            <Mail className="w-6 h-6 text-primary" />
            <span className="text-sm">Confirmation email sent</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Click the link in your email to verify your account. Once verified, you can start creating visual lessons
            for your students.
          </p>
          <Link href="/auth/login">
            <Button className="w-full h-12">Go to Login</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
