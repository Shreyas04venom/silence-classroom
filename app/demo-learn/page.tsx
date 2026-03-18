"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Hand, Menu, X, Loader2, BookOpen, Users, Info, Home, Play, Volume2, ChevronDown } from "lucide-react"
import { DeafAccessibilityFeatures } from "@/components/deaf-accessibility-features"
import { VICModeToggle } from "@/components/vic-mode-toggle"
import { VICTeacherDashboard } from "@/components/vic-teacher-dashboard"
import { VICStudentDashboard } from "@/components/vic-student-dashboard"

// Curriculum data structure
const CURRICULUM_DATA = {
  "6": {
    Science: {
      "Basic Life Processes": ["Nutrition in Plants", "Nutrition in Animals", "Respiration"],
      "Living Organisms": ["Structure of Plants", "Structure of Animals"],
    },
    Mathematics: {
      Numbers: ["Natural Numbers", "Whole Numbers"],
    },
  },
  "7": {
    Science: {
      "Life Processes": ["Reproduction in Plants", "Reproduction in Animals", "Photosynthesis"],
      "Human Body": ["Skeletal System", "Digestive System"],
    },
    Mathematics: {
      Algebra: ["Variables", "Equations"],
    },
  },
  "8": {
    Science: {
      "Life Processes in Living Organisms": ["Human Digestive System", "Circulatory System", "Nervous System"],
      Ecology: ["Ecosystems", "Food Chain"],
    },
    Mathematics: {
      Geometry: ["Triangles", "Quadrilaterals"],
    },
  },
}

export default function DemoLearnPage() {
  const [selectedStandard, setSelectedStandard] = useState("")
  const [selectedSubject, setSelectedSubject] = useState("")
  const [selectedChapter, setSelectedChapter] = useState("")
  const [selectedTopic, setSelectedTopic] = useState("")

  const [isGenerating, setIsGenerating] = useState(false)
  const [explanation, setExplanation] = useState<string | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [detailedIllustrationSVG, setDetailedIllustrationSVG] = useState<string | null>(null)
  const [animationCode, setAnimationCode] = useState<string | null>(null)
  const [animationUrl, setAnimationUrl] = useState<string | null>(null)
  const [signLanguageSVG, setSignLanguageSVG] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<"content" | "images" | "videos" | "accessibility">("content")
  const [visualTranscript, setVisualTranscript] = useState<string | null>(null)

  // VIC Mode State
  const [vicMode, setVicMode] = useState<"off" | "teacher" | "student">("off")

  const handleVicModeSelect = (mode: "teacher" | "student") => {
    setVicMode(mode)
  }

  const handleVicModeClose = () => {
    setVicMode("off")
  }

  // Get available options based on selections
  const standards = Object.keys(CURRICULUM_DATA)
  const subjects = selectedStandard
    ? Object.keys(CURRICULUM_DATA[selectedStandard as keyof typeof CURRICULUM_DATA])
    : []
  const chapters =
    selectedStandard && selectedSubject
      ? Object.keys(CURRICULUM_DATA[selectedStandard as keyof typeof CURRICULUM_DATA][selectedSubject as keyof typeof CURRICULUM_DATA[keyof typeof CURRICULUM_DATA]] || {})
      : []
  const topics =
    selectedStandard && selectedSubject && selectedChapter
      ? (CURRICULUM_DATA[selectedStandard as keyof typeof CURRICULUM_DATA][
        selectedSubject as keyof typeof CURRICULUM_DATA[keyof typeof CURRICULUM_DATA]
      ] as Record<string, string[]>)[selectedChapter] || []
      : []

  // Reset dependent selections when parent selection changes
  const handleStandardChange = (std: string) => {
    setSelectedStandard(std)
    setSelectedSubject("")
    setSelectedChapter("")
    setSelectedTopic("")
    setExplanation(null)
  }

  const handleSubjectChange = (subject: string) => {
    setSelectedSubject(subject)
    setSelectedChapter("")
    setSelectedTopic("")
    setExplanation(null)
  }

  const handleChapterChange = (chapter: string) => {
    setSelectedChapter(chapter)
    setSelectedTopic("")
    setExplanation(null)
  }

  const handleTopicChange = (topic: string) => {
    setSelectedTopic(topic)
    setExplanation(null)
  }

  const handleGenerateContent = async () => {
    if (!selectedTopic) {
      setError("Please select a topic first")
      return
    }

    setIsGenerating(true)
    setError(null)

    try {
      console.log("[Demo Learn] Starting content generation for topic:", selectedTopic)
      
      // Create abort controller with 90 second timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 90000)
      
      const res = await fetch("/api/generate-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: selectedTopic,
          chapter: selectedChapter,
          standard: selectedStandard,
          subject: selectedSubject,
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)
      console.log("[Demo Learn] API Response status:", res.status)

      let data
      try {
        data = await res.json()
      } catch (jsonError) {
        console.error("[Demo Learn] Failed to parse JSON response:", jsonError)
        throw new Error(`Server response error: ${res.status} ${res.statusText}`)
      }

      if (!res.ok) {
        throw new Error(data.error || `HTTP ${res.status}: Failed to generate content`)
      }

      console.log("[Demo Learn] Content generated successfully")
      setExplanation(data.explanation)
      setSignLanguageSVG(data.signLanguageSVG || null)
      setVisualTranscript(data.visualTranscript || null)
      setImageUrl(data.imageUrl || "/placeholder.svg")
      setDetailedIllustrationSVG(data.detailedIllustrationSVG || null)
      setAnimationUrl(data.animationUrl || null)
      setAnimationCode(data.animationCode || null)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to generate content"
      setError(errorMessage)
      console.error("[Demo Learn] Error:", errorMessage, err)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Header */}
      <header className="border-b border-border bg-card sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <Hand className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">Silent Classroom</span>
          </Link>

          {/* Desktop Menu */}
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-sm hover:text-primary transition-colors gap-2 flex items-center">
              <Home className="w-4 h-4" />
              Dashboard
            </Link>
            <Link href="#" className="text-sm hover:text-primary transition-colors gap-2 flex items-center">
              <BookOpen className="w-4 h-4" />
              Topics
            </Link>
            <Link href="#" className="text-sm hover:text-primary transition-colors gap-2 flex items-center">
              <Volume2 className="w-4 h-4" />
              AI Content
            </Link>
            <Link href="#" className="text-sm hover:text-primary transition-colors gap-2 flex items-center">
              <Info className="w-4 h-4" />
              About
            </Link>
            <div className="flex items-center gap-3 pl-6 border-l border-border">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div className="text-sm">
                <p className="font-medium">Demo Student</p>
                <p className="text-xs text-muted-foreground">Demo Mode</p>
              </div>
            </div>
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 hover:bg-muted rounded-lg transition-colors"
          >
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-border bg-card">
            <nav className="container mx-auto px-4 py-4 space-y-3">
              <Link href="/" className="block text-sm hover:text-primary py-2">
                Dashboard
              </Link>
              <Link href="#" className="block text-sm hover:text-primary py-2">
                Topics
              </Link>
              <Link href="#" className="block text-sm hover:text-primary py-2">
                AI Content
              </Link>
              <Link href="#" className="block text-sm hover:text-primary py-2">
                About
              </Link>
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Syllabus Selection Card */}
        <Card className="mb-8 border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-900">
          <CardHeader>
            <CardTitle className="text-2xl text-blue-900 dark:text-blue-100">Select Your Learning Path</CardTitle>
            <CardDescription>
              Choose Standard, Subject, Chapter, and Topic to generate educational content
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Standard Dropdown */}
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground font-semibold uppercase">Standard</label>
                <div className="relative">
                  <select
                    value={selectedStandard}
                    onChange={(e) => handleStandardChange(e.target.value)}
                    className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm appearance-none cursor-pointer pr-8"
                  >
                    <option value="">Select Standard</option>
                    {standards.map((std) => (
                      <option key={std} value={std}>
                        Standard {std}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-muted-foreground" />
                </div>
              </div>

              {/* Subject Dropdown */}
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground font-semibold uppercase">Subject</label>
                <div className="relative">
                  <select
                    value={selectedSubject}
                    onChange={(e) => handleSubjectChange(e.target.value)}
                    disabled={!selectedStandard}
                    className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm appearance-none cursor-pointer pr-8 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">Select Subject</option>
                    {subjects.map((subject) => (
                      <option key={subject} value={subject}>
                        {subject}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-muted-foreground" />
                </div>
              </div>

              {/* Chapter Dropdown */}
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground font-semibold uppercase">Chapter</label>
                <div className="relative">
                  <select
                    value={selectedChapter}
                    onChange={(e) => handleChapterChange(e.target.value)}
                    disabled={!selectedSubject}
                    className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm appearance-none cursor-pointer pr-8 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">Select Chapter</option>
                    {chapters.map((chapter) => (
                      <option key={chapter} value={chapter}>
                        {chapter}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-muted-foreground" />
                </div>
              </div>

              {/* Topic Dropdown */}
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground font-semibold uppercase">Topic</label>
                <div className="relative">
                  <select
                    value={selectedTopic}
                    onChange={(e) => handleTopicChange(e.target.value)}
                    disabled={!selectedChapter}
                    className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm appearance-none cursor-pointer pr-8 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">Select Topic</option>
                    {topics.map((topic) => (
                      <option key={topic} value={topic}>
                        {topic}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-muted-foreground" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Generate Button and VIC Mode Toggle */}
        <div className="mb-8 flex flex-col md:flex-row gap-4">
          <Button
            onClick={handleGenerateContent}
            disabled={isGenerating || !selectedTopic}
            size="lg"
            className="w-full md:w-auto text-base h-12 gap-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating Educational Content...
              </>
            ) : (
              <>
                <Volume2 className="w-5 h-5" />
                Generate Educational Content
              </>
            )}
          </Button>

          {/* VIC Mode Toggle */}
          <VICModeToggle onModeSelect={handleVicModeSelect} />
        </div>

        {/* Error Message */}
        {error && (
          <Card className="mb-8 border-red-200 bg-red-50/50 dark:bg-red-950/20 dark:border-red-900">
            <CardContent className="pt-6">
              <p className="text-sm text-red-700 dark:text-red-200">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* VIC Mode Dashboards */}
        {vicMode === "teacher" && <VICTeacherDashboard onClose={handleVicModeClose} />}
        {vicMode === "student" && <VICStudentDashboard onClose={handleVicModeClose} />}

        {/* Regular Content Generation (show only when VIC mode is off) */}
        {vicMode === "off" && (
          <>
            {/* Tabs for Content Sections */}
            {explanation && (
              <div className="space-y-6">
                <div className="flex gap-2 border-b border-border overflow-x-auto">
                  {["content", "images", "videos", "accessibility"].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab as typeof activeTab)}
                      className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${activeTab === tab
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                        }`}
                    >
                      {tab === "content" && "📖 Explanation"}
                      {tab === "images" && "🖼️ Images"}
                      {tab === "videos" && "▶️ Videos"}
                      {tab === "accessibility" && "♿ Accessibility"}
                    </button>
                  ))}
                </div>

                {/* Explanation Content */}
                {activeTab === "content" && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Educational Explanation</CardTitle>
                      <CardDescription>AI-generated content for {selectedTopic}</CardDescription>
                    </CardHeader>
                    <CardContent className="prose dark:prose-invert max-w-none">
                      <div className="space-y-4 text-base leading-relaxed text-foreground whitespace-pre-wrap">
                        {explanation}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Images Section */}
                {activeTab === "images" && (() => {
                  // Only use imageUrl if it's a pre-generated static file (reliable)
                  const hasStaticImage = imageUrl && imageUrl.startsWith('/content/')
                  // Only use SVG if it actually has real drawn content (not empty/description text)
                  const hasRealSVG = !hasStaticImage && detailedIllustrationSVG &&
                    detailedIllustrationSVG.trim().startsWith('<') &&
                    (detailedIllustrationSVG.includes('<rect') || detailedIllustrationSVG.includes('<circle') ||
                     detailedIllustrationSVG.includes('<path') || detailedIllustrationSVG.includes('<ellipse') ||
                     detailedIllustrationSVG.includes('<polygon')) &&
                    detailedIllustrationSVG.length > 200

                  return (
                    <Card>
                      <CardHeader>
                        <CardTitle>Visual Resources</CardTitle>
                        <CardDescription>Visual learning content for {selectedTopic}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {hasStaticImage ? (
                          /* 1st priority: pre-generated PNG (most reliable) */
                          <div className="space-y-4">
                            <img
                              src={imageUrl!}
                              alt={selectedTopic}
                              className="w-full rounded-lg border shadow-inner object-contain bg-white"
                              style={{ maxHeight: '600px' }}
                            />
                            <p className="text-sm text-muted-foreground">
                              🖼️ Educational diagram of {selectedTopic}
                            </p>
                          </div>
                        ) : hasRealSVG ? (
                          /* 2nd priority: AI-generated SVG diagram with real drawn content */
                          <div className="space-y-4">
                            <div
                              className="w-full rounded-lg overflow-hidden bg-white border shadow-inner flex items-center justify-center p-4"
                              style={{ minHeight: '400px' }}
                              dangerouslySetInnerHTML={{ __html: detailedIllustrationSVG! }}
                            />
                            <p className="text-sm text-muted-foreground">
                              🖼️ AI-generated educational diagram of {selectedTopic}
                            </p>
                          </div>
                        ) : animationUrl ? (
                          /* 3rd priority: show animation as visual reference when no dedicated image */
                          <div className="space-y-4">
                            <div className="relative w-full rounded-lg overflow-hidden bg-black border shadow-inner" style={{ paddingBottom: '75.56%' }}>
                              <iframe
                                src={animationUrl}
                                className="absolute inset-0 w-full h-full border-0"
                                title={`${selectedTopic} Visual`}
                                allowFullScreen
                              />
                            </div>
                            <p className="text-sm text-muted-foreground">
                              🎬 Interactive visual animation for {selectedTopic} — also see the Videos tab
                            </p>
                          </div>
                        ) : (
                          <div className="py-12 text-center text-muted-foreground">
                            <p>No visual resources available. Try regenerating content.</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })()}

                {/* Videos/Animation Section */}
                {activeTab === "videos" && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Educational Animation (Visual)</CardTitle>
                      <CardDescription>Visual concept animation for {selectedTopic}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {animationUrl ? (
                        <div className="space-y-4">
                          {/* Aspect ratio based on the canvas size used in animation files (900×680 = 75.56%) */}
                          <div className="relative w-full rounded-lg overflow-hidden bg-black border shadow-inner" style={{ paddingBottom: '75.56%' }}>
                            <iframe
                              src={animationUrl}
                              className="absolute inset-0 w-full h-full border-0"
                              title={`${selectedTopic} Animation`}
                              allowFullScreen
                            />
                          </div>
                          <p className="text-sm text-muted-foreground">🎬 Pre-built interactive animation for {selectedTopic}</p>
                        </div>
                      ) : animationCode ? (
                        <div className="space-y-4">
                          <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-white border shadow-inner">
                            <iframe
                              srcDoc={`
                                <html>
                                <head>
                                    <style>body { margin: 0; overflow: hidden; display: flex; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif; }</style>
                                </head>
                                <body>
                                    ${animationCode}
                                </body>
                                </html>
                                `}
                              className="w-full h-full border-0"
                              title="Generated Animation"
                            />
                          </div>
                          <p className="text-sm text-muted-foreground">AI-generated visual animation of {selectedTopic}</p>
                        </div>
                      ) : (
                        <div className="py-12 text-center text-muted-foreground">
                          <p>No animation generated.</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Accessibility Section */}
                {activeTab === "accessibility" && (
                  <DeafAccessibilityFeatures
                    topic={selectedTopic}
                    signLanguageSVG={signLanguageSVG || ""}
                    visualTranscript={visualTranscript || ""}
                  />
                )}
              </div>
            )}

            {/* Initial State */}
            {!explanation && !isGenerating && (
              <Card className="text-center py-16">
                <CardContent>
                  <BookOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">Ready to Learn?</h3>
                  <p className="text-muted-foreground mb-6">
                    Select your learning path above and click "Generate Educational Content" to create an AI-powered visual
                    lesson, or use Live Voice-to-Content (VIC) mode for real-time content generation
                  </p>
                  <Button onClick={handleGenerateContent} disabled={!selectedTopic} size="lg" className="gap-2">
                    <Play className="w-5 h-5" />
                    Start Learning
                  </Button>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4 mt-12">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          <p>&copy; 2025 Silent Classrooms. Demo Mode - No authentication required.</p>
          <p className="mt-2 text-xs">
            <Link href="/" className="hover:text-primary transition-colors">
              Back to Home
            </Link>
          </p>
        </div>
      </footer>
    </div>
  )
}
