"use client"
import type React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, Mic, Monitor, BarChart3, Eye, Hand, FlaskConical, Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

export default function HomePage() {
  const { resolvedTheme, setTheme } = useTheme()

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <Hand className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">Silent Classrooms</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/auth/login">
              <Button variant="ghost" size="lg" className="text-base">
                Teacher Login
              </Button>
            </Link>
            <Link href="/auth/student-login">
              <Button variant="outline" size="lg" className="text-base bg-transparent">
                Student Login
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              aria-label="Toggle theme"
            >
              {resolvedTheme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main id="main-content">
        <section className="py-20 px-4 bg-gradient-to-b from-primary/5 to-background">
          <div className="container mx-auto text-center max-w-4xl">
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 text-balance">
              Visual Learning for Every Student
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 leading-relaxed text-pretty">
              Transform text lessons into engaging visual content with images, videos, and sign language support.
              Designed specifically for deaf and hard-of-hearing students.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/signup">
                <Button size="lg" className="text-lg px-8 py-6 w-full sm:w-auto">
                  Get Started as Teacher
                </Button>
              </Link>
              <Link href="/demo-learn">
                <Button size="lg" variant="outline" className="text-lg px-8 py-6 w-full sm:w-auto bg-transparent gap-2">
                  <FlaskConical className="h-5 w-5" />
                  Try Demo
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 px-4" aria-labelledby="features-heading">
          <div className="container mx-auto max-w-6xl">
            <h2 id="features-heading" className="text-3xl md:text-4xl font-bold text-center mb-12">
              Features Built for Accessibility
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <FeatureCard
                icon={<Mic className="w-8 h-8" />}
                title="Voice to Visual"
                description="Speak your lesson content and automatically generate relevant images, videos, and animations."
              />
              <FeatureCard
                icon={<Monitor className="w-8 h-8" />}
                title="Classroom Display Mode"
                description="Full-screen kiosk mode with large visuals and simple navigation for classroom presentations."
              />
              <FeatureCard
                icon={<BookOpen className="w-8 h-8" />}
                title="Maharashtra Curriculum"
                description="Pre-loaded subjects aligned with Maharashtra State Board syllabus for Standards 6-8."
              />
              <FeatureCard
                icon={<Hand className="w-8 h-8" />}
                title="Sign Language Support"
                description="Attach sign language videos to concepts for comprehensive visual learning."
              />
              <FeatureCard
                icon={<BarChart3 className="w-8 h-8" />}
                title="Progress Tracking"
                description="Monitor student engagement with detailed analytics on views, understanding, and replays."
              />
              <FeatureCard
                icon={<Eye className="w-8 h-8" />}
                title="Visual Recall"
                description="Spaced repetition system to reinforce learning through scheduled visual reviews."
              />
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-20 px-4 bg-secondary/50" aria-labelledby="how-it-works-heading">
          <div className="container mx-auto max-w-4xl">
            <h2 id="how-it-works-heading" className="text-3xl md:text-4xl font-bold text-center mb-12">
              How It Works
            </h2>
            <div className="space-y-8">
              <StepCard
                number="1"
                title="Create or Speak Your Lesson"
                description="Type or use voice input to enter your lesson content. Our AI will extract key concepts and keywords."
              />
              <StepCard
                number="2"
                title="Generate Visual Content"
                description="Automatically fetch relevant images and educational videos from trusted sources like YouTube, Pixabay, and Unsplash."
              />
              <StepCard
                number="3"
                title="Present in Classroom"
                description="Use the full-screen display mode with large buttons for students to navigate through visual content."
              />
              <StepCard
                number="4"
                title="Track Understanding"
                description="Students tap 'Understood' to confirm learning. Teachers see real-time analytics on comprehension."
              />
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-2xl text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Transform Your Classroom?</h2>
            <p className="text-lg text-muted-foreground mb-8">
              Join educators making learning accessible for every student.
            </p>
            <Link href="/auth/signup">
              <Button size="lg" className="text-lg px-10 py-6">
                Start Teaching Today
              </Button>
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-12 px-4 bg-card">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                  <Hand className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="font-bold">Silent Classrooms</span>
              </div>
              <p className="text-sm text-muted-foreground">Making education accessible through visual learning.</p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="#features-heading" className="hover:text-foreground">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="#how-it-works-heading" className="hover:text-foreground">
                    How It Works
                  </Link>
                </li>
                <li>
                  <Link href="/auth/signup" className="hover:text-foreground">
                    Get Started
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/help" className="hover:text-foreground">
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-foreground">
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link href="/accessibility" className="hover:text-foreground">
                    Accessibility
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/privacy" className="hover:text-foreground">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-foreground">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} Silent Classrooms. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
          {icon}
        </div>
        <CardTitle className="text-xl">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-base">{description}</CardDescription>
      </CardContent>
    </Card>
  )
}

function StepCard({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="flex gap-6 items-start">
      <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold shrink-0">
        {number}
      </div>
      <div>
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}
