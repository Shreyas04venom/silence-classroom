"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import {
    Mic,
    MicOff,
    Pause,
    Play,
    StopCircle,
    Save,
    AlertTriangle,
    Loader2,
    CheckCircle2,
    Send,
    History,
} from "lucide-react"
import { VICStudentDashboard } from "./vic-student-dashboard"
import { speechRecognition } from "@/lib/speech-recognition"
import { saveSession, generateSessionId, VICSession } from "@/lib/session-storage"
import { DeafAccessibilityFeatures } from "@/components/deaf-accessibility-features"
import { saveSessionToSupabase } from "@/lib/supabase-services"

interface TeacherDashboardProps {
    onClose: () => void
}

export function VICTeacherDashboard({ onClose }: TeacherDashboardProps) {
    const [isRecording, setIsRecording] = useState(false)
    const [isPaused, setIsPaused] = useState(false)
    const [transcript, setTranscript] = useState("")
    const [interimTranscript, setInterimTranscript] = useState("")
    const [activeTab, setActiveTab] = useState<"explanation" | "images" | "videos" | "accessibility">(
        "explanation"
    )
    const [isViewingSessions, setIsViewingSessions] = useState(false)

    // Generated content (matching generate-content API response shape)
    const [explanation, setExplanation] = useState<string | null>(null)
    const [imageUrl, setImageUrl] = useState<string | null>(null)
    const [detailedIllustrationSVG, setDetailedIllustrationSVG] = useState<string | null>(null)
    const [animationCode, setAnimationCode] = useState<string | null>(null)
    const [animationUrl, setAnimationUrl] = useState<string | null>(null)
    const [signLanguageSVG, setSignLanguageSVG] = useState<string | null>(null)
    const [visualTranscript, setVisualTranscript] = useState<string | null>(null)

    // Session data
    const sessionIdRef = useRef<string>(generateSessionId())
    const startTimeRef = useRef<number>(0)
    const [isGenerating, setIsGenerating] = useState(false)
    const [generationError, setGenerationError] = useState<string | null>(null)
    const [hasGenerated, setHasGenerated] = useState(false)

    useEffect(() => {
        if (!speechRecognition.isSupported()) {
            alert("Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari.")
        }

        return () => {
            if (isRecording) {
                speechRecognition.stop()
            }
        }
    }, [])

    const handleStartRecording = () => {
        if (!speechRecognition.isSupported()) {
            return
        }

        setTranscript("")
        setInterimTranscript("")
        startTimeRef.current = Date.now()

        speechRecognition.start({
            continuous: true,
            interimResults: true,
            onResult: (result) => {
                if (result.isFinal) {
                    // result.transcript is the FULL accumulated transcript from the speech recognition library
                    setTranscript(result.transcript)
                    setInterimTranscript("")
                } else {
                    setInterimTranscript(result.transcript)
                }
            },
            onError: (error) => {
                console.error("Speech recognition error:", error)
            },
            onEnd: () => {
                if (!isPaused) {
                    setIsRecording(false)
                }
            },
        })

        setIsRecording(true)
        setIsPaused(false)
    }

    const handlePauseRecording = () => {
        speechRecognition.pause()
        setIsPaused(true)
    }

    const handleResumeRecording = () => {
        speechRecognition.resume()
        setIsPaused(false)
    }

    const handleStopRecording = () => {
        speechRecognition.stop()
        setIsRecording(false)
        setIsPaused(false)
    }

    const handleSaveSession = () => {
        const duration = Date.now() - startTimeRef.current

        const session: VICSession = {
            id: sessionIdRef.current,
            title: `Session ${new Date().toLocaleString()}`,
            timestamp: startTimeRef.current,
            duration,
            transcript: transcript.trim(),
            translations: {},
            images: imageUrl ? [imageUrl] : [],
            animations: animationCode ? [animationCode] : [],
            // Save all generated content
            explanation: explanation || undefined,
            imageUrl: imageUrl || undefined,
            detailedIllustrationSVG: detailedIllustrationSVG || undefined,
            animationCode: animationCode || undefined,
            animationUrl: animationUrl || undefined,
            signLanguageSVG: signLanguageSVG || undefined,
            accessibility: {
                visualTranscript: visualTranscript || "",
                signLanguageData: [],
            },
            metadata: {
                teacher: "Demo Teacher",
                topic: transcript.trim().split(/\s+/).slice(0, 5).join(" "),
            },
        }

        saveSession(session)
        alert("Session saved locally. Syncing to cloud...")
        
        // Sync to Supabase in the background
        saveSessionToSupabase(session).then((success) => {
            if (success) {
                console.log("Successfully synced session to Supabase cloud.")
            } else {
                console.error("Failed to sync session to cloud database.")
            }
        })
    }

    // Single unified API call — same endpoint as "Generate Educational Content" button
    const handleSubmitAndGenerate = async () => {
        const conceptText = transcript.trim()
        if (!conceptText) {
            setGenerationError("Please speak or type a concept first.")
            return
        }

        // Stop recording if still active
        if (isRecording) {
            handleStopRecording()
        }

        setIsGenerating(true)
        setGenerationError(null)
        setHasGenerated(false)

        // Reset previous content
        setExplanation(null)
        setImageUrl(null)
        setDetailedIllustrationSVG(null)
        setAnimationCode(null)
        setAnimationUrl(null)
        setSignLanguageSVG(null)
        setVisualTranscript(null)

        try {
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 90000) // 90s timeout

            const res = await fetch("/api/generate-content", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    topic: conceptText,
                    chapter: "",
                    standard: "",
                    subject: "",
                }),
                signal: controller.signal,
            })

            clearTimeout(timeoutId)

            let data
            try {
                data = await res.json()
            } catch (jsonError) {
                throw new Error(`Server response error: ${res.status} ${res.statusText}`)
            }

            if (!res.ok) {
                throw new Error(data.error || `HTTP ${res.status}: Failed to generate content`)
            }

            // Map response to state
            setExplanation(data.explanation || null)
            setImageUrl(data.imageUrl || null)
            setDetailedIllustrationSVG(data.detailedIllustrationSVG || null)
            setAnimationUrl(data.animationUrl || null)
            setAnimationCode(data.animationCode || null)
            setSignLanguageSVG(data.signLanguageSVG || null)
            setVisualTranscript(data.visualTranscript || null)
            setHasGenerated(true)
            setActiveTab("explanation")
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Failed to generate content"
            setGenerationError(errorMessage)
            console.error("[VIC] Content generation error:", errorMessage, err)
        } finally {
            setIsGenerating(false)
        }
    }

    const conceptText = transcript.trim()

    if (isViewingSessions) {
        return (
            <VICStudentDashboard 
                isTeacher={true} 
                onClose={() => setIsViewingSessions(false)} 
            />
        )
    }

    return (
        <div className="space-y-6">
            {/* Recording Controls */}
            <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20">
                <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                        <Mic className={isRecording ? "animate-pulse text-red-500" : ""} />
                        Teacher Live Recording
                        {isGenerating && (
                            <span className="flex items-center gap-2 text-sm font-normal text-blue-600">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Generating content...
                            </span>
                        )}
                        {hasGenerated && !isGenerating && (
                            <span className="flex items-center gap-2 text-sm font-normal text-green-600">
                                <CheckCircle2 className="w-4 h-4" />
                                Content generated!
                            </span>
                        )}
                    </CardTitle>
                    <CardDescription>
                        Speak your educational concept, then click &quot;Submit &amp; Generate Content&quot; to create visual learning materials.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-3">
                        {!isRecording ? (
                            <Button onClick={handleStartRecording} size="lg" className="gap-2 bg-green-600 hover:bg-green-700">
                                <Mic className="w-5 h-5" />
                                Start Recording
                            </Button>
                        ) : (
                            <>
                                {!isPaused ? (
                                    <Button onClick={handlePauseRecording} size="lg" className="gap-2 bg-yellow-600 hover:bg-yellow-700">
                                        <Pause className="w-5 h-5" />
                                        Pause
                                    </Button>
                                ) : (
                                    <Button onClick={handleResumeRecording} size="lg" className="gap-2 bg-blue-600 hover:bg-blue-700">
                                        <Play className="w-5 h-5" />
                                        Resume
                                    </Button>
                                )}
                                <Button onClick={handleStopRecording} size="lg" variant="destructive" className="gap-2">
                                    <StopCircle className="w-5 h-5" />
                                    Stop
                                </Button>
                            </>
                        )}

                        {/* Submit & Generate button */}
                        <Button
                            onClick={handleSubmitAndGenerate}
                            size="lg"
                            className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg"
                            disabled={isGenerating || !conceptText}
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <Send className="w-5 h-5" />
                                    Submit &amp; Generate Content
                                </>
                            )}
                        </Button>

                        <Button
                            onClick={handleSaveSession}
                            size="lg"
                            variant="outline"
                            className="gap-2"
                            disabled={!conceptText}
                        >
                            <Save className="w-5 h-5" />
                            Save Session
                        </Button>
                        <Button
                            onClick={() => setIsViewingSessions(!isViewingSessions)}
                            size="lg"
                            variant="secondary"
                            className="gap-2"
                        >
                            {isViewingSessions ? (
                                <>
                                    <Mic className="w-5 h-5" />
                                    Back to Recording
                                </>
                            ) : (
                                <>
                                    <History className="w-5 h-5" />
                                    Manage Saved Lessons
                                </>
                            )}
                        </Button>
                        <Button onClick={onClose} size="lg" variant="ghost">
                            Close VIC Mode
                        </Button>
                    </div>

                    {/* Live Transcript (editable) */}
                    <div className="bg-white dark:bg-gray-900 rounded-lg p-4 min-h-[100px] max-h-[200px] overflow-y-auto">
                        <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                            <Badge variant={isRecording ? "default" : "secondary"}>
                                {isRecording ? "Recording..." : "Stopped"}
                            </Badge>
                            Live Transcript
                        </p>
                        <textarea
                            className="w-full min-h-[60px] bg-transparent border-0 outline-none resize-none text-base"
                            value={transcript + (interimTranscript ? " " + interimTranscript : "")}
                            onChange={(e) => {
                                setTranscript(e.target.value)
                                setInterimTranscript("")
                            }}
                            placeholder="Speak your educational concept, or type it here..."
                        />
                    </div>

                    {/* Error message */}
                    {generationError && (
                        <Alert variant="destructive" className="border-red-500 bg-red-50 dark:bg-red-950">
                            <AlertTriangle className="h-5 w-5" />
                            <AlertTitle>Generation Error</AlertTitle>
                            <AlertDescription>{generationError}</AlertDescription>
                        </Alert>
                    )}
                </CardContent>
            </Card>

            {/* Generated Content Tabs */}
            {(explanation || isGenerating) && (
                <div className="space-y-4">
                    <div className="flex gap-2 border-b border-border overflow-x-auto">
                        {["explanation", "images", "videos", "accessibility"].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab as typeof activeTab)}
                                className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${activeTab === tab
                                    ? "border-purple-500 text-purple-600"
                                    : "border-transparent text-muted-foreground hover:text-foreground"
                                    }`}
                            >
                                {tab === "explanation" && "📖 Explanation"}
                                {tab === "images" && "🖼️ Images"}
                                {tab === "videos" && "▶️ Videos"}
                                {tab === "accessibility" && "♿ Accessibility"}
                            </button>
                        ))}
                    </div>

                    {/* Explanation Tab */}
                    {activeTab === "explanation" && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Live Explanation</CardTitle>
                                <CardDescription>AI-generated educational content from your speech</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {isGenerating ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                                        Generating explanation...
                                    </div>
                                ) : explanation ? (
                                    <div className="prose dark:prose-invert max-w-none">
                                        <div className="space-y-4 text-base leading-relaxed text-foreground whitespace-pre-wrap">
                                            {explanation}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-muted-foreground">
                                        No explanation generated yet. Click &quot;Submit &amp; Generate Content&quot; above.
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Images Tab */}
                    {activeTab === "images" && (() => {
                        const hasStaticImage = imageUrl && imageUrl.startsWith('/content/')
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
                                    <CardDescription>AI-generated educational images from your speech</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {isGenerating ? (
                                        <div className="text-center py-8 text-muted-foreground">
                                            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                                            Generating images...
                                        </div>
                                    ) : hasStaticImage ? (
                                        <div className="space-y-4">
                                            <img
                                                src={imageUrl!}
                                                alt={conceptText}
                                                className="w-full rounded-lg border shadow-inner object-contain bg-white"
                                                style={{ maxHeight: '600px' }}
                                            />
                                            <p className="text-sm text-muted-foreground">
                                                🖼️ Educational diagram for: {conceptText}
                                            </p>
                                        </div>
                                    ) : hasRealSVG ? (
                                        <div className="space-y-4">
                                            <div
                                                className="w-full rounded-lg overflow-hidden bg-white border shadow-inner flex items-center justify-center p-4"
                                                style={{ minHeight: '400px' }}
                                                dangerouslySetInnerHTML={{ __html: detailedIllustrationSVG! }}
                                            />
                                            <p className="text-sm text-muted-foreground">
                                                🖼️ AI-generated educational diagram for: {conceptText}
                                            </p>
                                        </div>
                                    ) : animationUrl ? (
                                        <div className="space-y-4">
                                            <div className="relative w-full rounded-lg overflow-hidden bg-black border shadow-inner" style={{ paddingBottom: '75.56%' }}>
                                                <iframe
                                                    src={animationUrl}
                                                    className="absolute inset-0 w-full h-full border-0"
                                                    title={`${conceptText} Visual`}
                                                    allowFullScreen
                                                />
                                            </div>
                                            <p className="text-sm text-muted-foreground">
                                                🎬 Interactive visual animation — also see the Videos tab
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

                    {/* Videos/Animations Tab */}
                    {activeTab === "videos" && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Educational Animation</CardTitle>
                                <CardDescription>Visual concept animation from your speech</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {isGenerating ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                                        Generating animations...
                                    </div>
                                ) : animationUrl ? (
                                    <div className="space-y-4">
                                        <div className="relative w-full rounded-lg overflow-hidden bg-black border shadow-inner" style={{ paddingBottom: '75.56%' }}>
                                            <iframe
                                                src={animationUrl}
                                                className="absolute inset-0 w-full h-full border-0"
                                                title={`${conceptText} Animation`}
                                                allowFullScreen
                                            />
                                        </div>
                                        <p className="text-sm text-muted-foreground">🎬 Pre-built interactive animation</p>
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
                                        <p className="text-sm text-muted-foreground">AI-generated visual animation</p>
                                    </div>
                                ) : (
                                    <div className="py-12 text-center text-muted-foreground">
                                        <p>No animation generated.</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Accessibility Tab */}
                    {activeTab === "accessibility" && (
                        isGenerating ? (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Accessibility Features</CardTitle>
                                    <CardDescription>Visual transcripts and sign language support</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-center py-8 text-muted-foreground">
                                        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                                        Generating accessibility features...
                                    </div>
                                </CardContent>
                            </Card>
                        ) : (
                            <DeafAccessibilityFeatures
                                topic={conceptText}
                                signLanguageSVG={signLanguageSVG || ""}
                                visualTranscript={visualTranscript || ""}
                            />
                        )
                    )}
                </div>
            )}

            {/* Initial state - no content yet */}
            {!explanation && !isGenerating && (
                <Card className="text-center py-12">
                    <CardContent>
                        <Mic className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="text-lg font-semibold mb-2">Ready to Create Content</h3>
                        <p className="text-muted-foreground mb-4">
                            Click &quot;Start Recording&quot; and speak your educational concept, or type it directly.
                            <br />
                            Then click &quot;Submit &amp; Generate Content&quot; to create visual learning materials.
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
