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
} from "lucide-react"
import { speechRecognition } from "@/lib/speech-recognition"
import { validateContentWithAI } from "@/lib/content-validator"
import { saveSession, generateSessionId, VICSession } from "@/lib/session-storage"

interface TeacherDashboardProps {
    onClose: () => void
}

export function VICTeacherDashboard({ onClose }: TeacherDashboardProps) {
    const [isRecording, setIsRecording] = useState(false)
    const [isPaused, setIsPaused] = useState(false)
    const [transcript, setTranscript] = useState("")
    const [interimTranscript, setInterimTranscript] = useState("")
    const [isValidating, setIsValidating] = useState(false)
    const [showAlert, setShowAlert] = useState(false)
    const [activeTab, setActiveTab] = useState<"explanation" | "images" | "videos" | "accessibility">(
        "explanation"
    )

    // Generated content
    const [explanation, setExplanation] = useState("")
    const [translations, setTranslations] = useState<Record<string, string>>({})
    const [images, setImages] = useState<string[]>([])
    const [animations, setAnimations] = useState<string[]>([])
    const [visualTranscript, setVisualTranscript] = useState("")
    const [signLanguageData, setSignLanguageData] = useState<any[]>([])

    // Session data
    const sessionIdRef = useRef<string>(generateSessionId())
    const startTimeRef = useRef<number>(0)
    const lastValidationRef = useRef<string>("")
    const lastGeneratedTextRef = useRef<string>("") // Prevent duplicate generations
    const generationTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const [isGenerating, setIsGenerating] = useState(false)
    const [generationError, setGenerationError] = useState<string | null>(null)

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
            onResult: async (result) => {
                if (result.isFinal) {
                    const newTranscript = result.transcript
                    setTranscript((prev) => prev + " " + newTranscript)
                    setInterimTranscript("")

                    // Validate educational content (temporarily disabled for performance)
                    // if (newTranscript.trim().split(/\s+/).length >= 5) {
                    //     await validateContent(newTranscript)
                    // }

                    // Generate content
                    await generateContent(newTranscript)
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
        setShowAlert(false)
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
            translations,
            images,
            animations,
            accessibility: {
                visualTranscript,
                signLanguageData,
            },
            metadata: {
                teacher: "Demo Teacher",
            },
        }

        saveSession(session)
        alert("Session saved successfully!")
    }

    const validateContent = async (text: string) => {
        // Only validate sentences with at least 10 words to avoid over-validation
        if (text.trim().split(/\s+/).length < 10) {
            return
        }

        // Don't validate same content twice
        if (text === lastValidationRef.current) {
            return
        }

        lastValidationRef.current = text
        setIsValidating(true)

        try {
            const validation = await validateContentWithAI(text)

            if (!validation.isEducational && validation.confidence > 0.7) {
                setShowAlert(true)
                handlePauseRecording()
            }
        } catch (error) {
            // Silently ignore validation errors
        } finally {
            setIsValidating(false)
        }
    }

    const generateContent = async (text: string) => {
        // Debounce: Only generate for sentences with good length
        const wordCount = text.trim().split(/\s+/).length
        if (wordCount < 8) {
            return // Too short, wait for more content
        }

        // Prevent duplicate generations
        if (text === lastGeneratedTextRef.current) {
            return
        }

        // Debounce rapid changes
        if (generationTimeoutRef.current) {
            clearTimeout(generationTimeoutRef.current)
        }

        generationTimeoutRef.current = setTimeout(async () => {
            lastGeneratedTextRef.current = text
            setIsGenerating(true)
            setGenerationError(null)

            try {
                // Helper to handle streaming
                const processStream = async (contentType: string, onData: (data: any) => void) => {
                    try {
                        const response = await fetch("/api/live-generate", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ text, contentType }),
                        })

                        if (!response.ok) {
                            throw new Error(`HTTP ${response.status}`)
                        }

                        const reader = response.body?.getReader()
                        if (!reader) return

                        while (true) {
                            const { done, value } = await reader.read()
                            if (done) break

                            const chunk = new TextDecoder().decode(value)
                            const lines = chunk.split("\n")

                            for (const line of lines) {
                                if (line.startsWith("data: ")) {
                                    try {
                                        const data = JSON.parse(line.slice(6))
                                        if (data.error) {
                                            console.error(`${contentType} error:`, data.error)
                                        } else {
                                            onData(data)
                                        }
                                    } catch (e) {
                                        console.error(`Parse error for ${contentType}:`, e)
                                    }
                                }
                            }
                        }
                    } catch (error) {
                        console.error(`Stream error for ${contentType}:`, error)
                        // Don't throw - continue with other generations
                    }
                }

                // Prioritize most important content first
                // Generate explanation (most critical)
                await processStream("explanation", (data) => {
                    if (data.type === "explanation") {
                        setExplanation((prev) => prev + "\n\n" + data.content)
                    }
                })

                // Generate animation (second most important for visual learners)
                await processStream("animation", (data) => {
                    if (data.type === "animation") {
                        setAnimations((prev) => [...prev, data.content])
                    }
                })

                // OPTIONAL: Only generate if no quota errors yet
                // Generate accessibility features
                try {
                    await processStream("accessibility", (data) => {
                        if (data.type === "visualTranscript") {
                            setVisualTranscript(data.content)
                        } else if (data.type === "signLanguage") {
                            try {
                                setSignLanguageData(JSON.parse(data.content))
                            } catch (e) {
                                console.error("Sign language parse error:", e)
                            }
                        }
                    })
                } catch (e) {
                    console.warn("Skipping accessibility due to quota limits")
                }

                // OPTIONAL: Only if quota allows
                // Generate image prompt (optional)
                try {
                    await processStream("image", (data) => {
                        if (data.type === "imagePrompt") {
                            setImages((prev) => [...prev, data.content])
                        }
                    })
                } catch (e) {
                    console.warn("Skipping image due to quota limits")
                }

                // OPTIONAL: Skip translations if quota is low
                // Generate translations last (least critical, can skip if needed)
                try {
                    await processStream("translation", (data) => {
                        if (data.type === "translation") {
                            setTranslations((prev) => ({ ...prev, [data.language]: data.content }))
                        }
                    })
                } catch (e) {
                    console.warn("Skipping translations due to quota limits")
                }

                setIsGenerating(false)
            } catch (error: any) {
                console.error("Content generation error:", error)
                setGenerationError(error.message || "Generation failed")
                setIsGenerating(false)
            }
        }, 800) // 800ms debounce
    }

    return (
        <div className="space-y-6">
            {/* Non-Educational Content Alert */}
            {showAlert && (
                <Alert variant="destructive" className="border-red-500 bg-red-50 dark:bg-red-950">
                    <AlertTriangle className="h-5 w-5" />
                    <AlertTitle className="text-lg font-bold">Educational Content Only</AlertTitle>
                    <AlertDescription className="text-base">
                        This is for educational related purposes only. Please ensure your content is focused on academic
                        topics. Recording has been paused.
                    </AlertDescription>
                    <Button onClick={handleResumeRecording} className="mt-3" variant="outline">
                        Resume Recording
                    </Button>
                </Alert>
            )}

            {/* Recording Controls */}
            <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20">
                <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                        <Mic className={isRecording ? "animate-pulse text-red-500" : ""} />
                        Teacher Live Recording
                        {isValidating && <Loader2 className="w-4 h-4 animate-spin text-blue-500" />}
                        {isGenerating && (
                            <span className="flex items-center gap-2 text-sm font-normal text-blue-600">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Generating content...
                            </span>
                        )}
                        {generationError && (
                            <span className="text-sm font-normal text-red-600">
                                ⚠️ {generationError}
                            </span>
                        )}
                    </CardTitle>
                    <CardDescription>
                        Speak naturally about your educational topic. The system will generate content in real-time.
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
                        <Button
                            onClick={handleSaveSession}
                            size="lg"
                            variant="outline"
                            className="gap-2"
                            disabled={!transcript.trim()}
                        >
                            <Save className="w-5 h-5" />
                            Save Session
                        </Button>
                        <Button onClick={onClose} size="lg" variant="ghost">
                            Close VIC Mode
                        </Button>
                    </div>

                    {/* Live Transcript */}
                    <div className="bg-white dark:bg-gray-900 rounded-lg p-4 min-h-[100px] max-h-[200px] overflow-y-auto">
                        <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                            <Badge variant={isRecording ? "default" : "secondary"}>
                                {isRecording ? "Recording..." : "Stopped"}
                            </Badge>
                            Live Transcript
                        </p>
                        <p className="text-base whitespace-pre-wrap">
                            {transcript}
                            {interimTranscript && <span className="text-gray-400">{interimTranscript}</span>}
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Tabs for Generated Content */}
            {transcript && (
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
                                {explanation ? (
                                    <div className="prose dark:prose-invert max-w-none whitespace-pre-wrap">{explanation}</div>
                                ) : (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                                        Generating explanation...
                                    </div>
                                )}

                                {/* Multi-language Translations */}
                                {Object.keys(translations).length > 0 && (
                                    <div className="mt-6 space-y-3">
                                        <h4 className="font-semibold text-sm">Multi-Language Translations:</h4>
                                        {Object.entries(translations).map(([lang, text]) => (
                                            <details key={lang} className="bg-muted p-3 rounded-lg">
                                                <summary className="cursor-pointer font-medium capitalize">
                                                    {lang === "hi" && "Hindi"} {lang === "es" && "Spanish"} {lang === "fr" && "French"}{" "}
                                                    {lang === "de" && "German"} {lang === "zh" && "Chinese"} {lang === "ar" && "Arabic"}{" "}
                                                    {lang === "pt" && "Portuguese"} {lang === "ru" && "Russian"}
                                                </summary>
                                                <p className="mt-2 text-sm">{text}</p>
                                            </details>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Images Tab */}
                    {activeTab === "images" && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Generated Images</CardTitle>
                                <CardDescription>AI-generated educational images from your speech</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {images.length > 0 ? (
                                    <div className="space-y-4">
                                        {images.map((imgPrompt, idx) => (
                                            <div key={idx} className="p-4 bg-muted rounded-lg">
                                                <p className="text-sm mb-2">
                                                    <Badge>Image {idx + 1}</Badge>
                                                </p>
                                                <p className="text-sm text-muted-foreground">{imgPrompt}</p>
                                                <p className="text-xs mt-2 text-yellow-600">
                                                    Note: Full image generation will be implemented with image generation API
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                                        Generating images...
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Videos/Animations Tab */}
                    {activeTab === "videos" && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Generated Animations</CardTitle>
                                <CardDescription>Dynamic educational animations from your speech</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {animations.length > 0 ? (
                                    <div className="space-y-4">
                                        {animations.map((animCode, idx) => (
                                            <div key={idx} className="border rounded-lg overflow-hidden">
                                                <div className="bg-muted p-2 flex items-center gap-2">
                                                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                                                    <span className="text-sm font-medium">Animation {idx + 1}</span>
                                                </div>
                                                <div className="relative w-full aspect-video bg-white">
                                                    <iframe
                                                        srcDoc={animCode}
                                                        className="w-full h-full border-0"
                                                        title={`Animation ${idx + 1}`}
                                                        sandbox="allow-scripts"
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                                        Generating animations...
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Accessibility Tab */}
                    {activeTab === "accessibility" && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Accessibility Features</CardTitle>
                                <CardDescription>Visual transcripts and sign language support</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Visual Transcript */}
                                <div>
                                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                                        <Badge>Visual Transcript</Badge>
                                    </h4>
                                    {visualTranscript ? (
                                        <div className="bg-muted p-4 rounded-lg whitespace-pre-wrap text-sm">{visualTranscript}</div>
                                    ) : (
                                        <div className="text-center py-4 text-muted-foreground">
                                            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                                            Generating visual transcript...
                                        </div>
                                    )}
                                </div>

                                {/* Sign Language */}
                                <div>
                                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                                        <Badge>Sign Language Mode</Badge>
                                    </h4>
                                    {signLanguageData.length > 0 ? (
                                        <div className="grid gap-3">
                                            {signLanguageData.map((sign: any, idx: number) => (
                                                <div key={idx} className="bg-muted p-3 rounded-lg flex items-start gap-3">
                                                    <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center flex-shrink-0">
                                                        <span className="text-xs font-bold">{sign.time}s</span>
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">{sign.sign}</p>
                                                        <p className="text-sm text-muted-foreground">{sign.description}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-4 text-muted-foreground">
                                            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                                            Generating sign language data...
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}
        </div>
    )
}
