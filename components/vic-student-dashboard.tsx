"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { getAllSessions, getSession, VICSession, formatDuration, searchSessions, deleteSession } from "@/lib/session-storage"
import { Clock, Search, Play, X, BookOpen, Trash2 } from "lucide-react"
import { DeafAccessibilityFeatures } from "@/components/deaf-accessibility-features"

interface StudentDashboardProps {
    onClose: () => void
    isTeacher?: boolean
}

export function VICStudentDashboard({ onClose, isTeacher = false }: StudentDashboardProps) {
    const [sessions, setSessions] = useState<VICSession[]>([])
    const [selectedSession, setSelectedSession] = useState<VICSession | null>(null)
    const [searchQuery, setSearchQuery] = useState("")
    const [activeTab, setActiveTab] = useState<"explanation" | "images" | "videos" | "accessibility">(
        "explanation"
    )

    useEffect(() => {
        loadSessions()
    }, [])

    const loadSessions = () => {
        const allSessions = getAllSessions()
        // Deduplicate by ID, keeping only first occurrence
        const seen = new Set<string>()
        const uniqueSessions = allSessions.filter((session) => {
            if (seen.has(session.id)) return false
            seen.add(session.id)
            return true
        })
        setSessions(uniqueSessions)
    }

    const handleSearch = (query: string) => {
        setSearchQuery(query)
        if (query.trim()) {
            const results = searchSessions(query)
            setSessions(results)
        } else {
            loadSessions()
        }
    }

    const handleSelectSession = (sessionId: string) => {
        const session = getSession(sessionId)
        setSelectedSession(session)
        setActiveTab("explanation")
    }

    const handleBack = () => {
        setSelectedSession(null)
    }

    const handleDeleteSession = (e: React.MouseEvent, id: string) => {
        e.stopPropagation()
        if (confirm("Are you sure you want to delete this session?")) {
            deleteSession(id)
            if (selectedSession?.id === id) {
                setSelectedSession(null)
            }
            loadSessions()
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20">
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span className="flex items-center gap-3">
                            <BookOpen className="w-6 h-6" />
                            Student Dashboard - Saved Lessons
                        </span>
                        <Button onClick={onClose} variant="ghost">
                            Close
                        </Button>
                    </CardTitle>
                    <CardDescription>Access previously recorded lessons and review educational content</CardDescription>
                </CardHeader>
                <CardContent>
                    {/* Search Bar */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Search lessons by topic, subject, or content..."
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Session List or Selected Session */}
            {!selectedSession ? (
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold">
                        {sessions.length > 0 ? `${sessions.length} Saved Lessons` : "No saved lessons yet"}
                    </h3>

                    {sessions.length === 0 ? (
                        <Card>
                            <CardContent className="py-12 text-center text-muted-foreground">
                                <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-50" />
                                <p className="text-lg">No lessons found</p>
                                <p className="text-sm mt-2">
                                    {searchQuery
                                        ? "Try a different search term"
                                        : "Teachers haven't recorded any lessons yet"}
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-4">
                            {sessions.map((session, index) => (
                                <Card
                                    key={`${session.id}_${index}`}
                                    className="cursor-pointer hover:border-blue-500 hover:shadow-md transition-all"
                                    onClick={() => handleSelectSession(session.id)}
                                >
                                    <CardContent className="pt-6">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1">
                                                <h4 className="font-semibold text-lg mb-2">{session.title}</h4>
                                                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                                                    {session.transcript.slice(0, 150)}...
                                                </p>
                                                <div className="flex flex-wrap gap-2">
                                                    {session.metadata.subject && (
                                                        <Badge variant="secondary">{session.metadata.subject}</Badge>
                                                    )}
                                                    {session.metadata.topic && <Badge variant="outline">{session.metadata.topic}</Badge>}
                                                    <Badge variant="outline" className="text-xs">
                                                        <Clock className="w-3 h-3 mr-1" />
                                                        {formatDuration(session.duration)}
                                                    </Badge>
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-2 flex-shrink-0">
                                                <Button size="sm" className="gap-2">
                                                    <Play className="w-4 h-4" />
                                                    View
                                                </Button>
                                                {isTeacher && (
                                                    <Button 
                                                        size="sm" 
                                                        variant="ghost" 
                                                        className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                        onClick={(e) => handleDeleteSession(e, session.id)}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                        Delete
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-4">
                    {/* Back Button */}
                    <Button onClick={handleBack} variant="outline" className="gap-2">
                        <X className="w-4 h-4" />
                        Back to All Lessons
                    </Button>

                    {/* Session Header */}
                    <Card>
                        <CardHeader>
                            <CardTitle>{selectedSession.title}</CardTitle>
                            <CardDescription>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {selectedSession.metadata.teacher && (
                                        <Badge>Teacher: {selectedSession.metadata.teacher}</Badge>
                                    )}
                                    <Badge variant="outline">
                                        <Clock className="w-3 h-3 mr-1" />
                                        {formatDuration(selectedSession.duration)}
                                    </Badge>
                                    <Badge variant="outline">{new Date(selectedSession.timestamp).toLocaleString()}</Badge>
                                </div>
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="bg-muted p-4 rounded-lg">
                                <p className="font-semibold text-sm mb-2">Full Transcript:</p>
                                <p className="text-sm whitespace-pre-wrap">{selectedSession.transcript}</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Tabs for Content */}
                    <div className="space-y-4">
                        <div className="flex gap-2 border-b border-border overflow-x-auto">
                            {["explanation", "images", "videos", "accessibility"].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab as typeof activeTab)}
                                    className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${activeTab === tab
                                            ? "border-blue-500 text-blue-600"
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
                                    <CardTitle>Lesson Explanation</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="prose dark:prose-invert max-w-none">
                                        <div className="space-y-4 text-base leading-relaxed text-foreground whitespace-pre-wrap">
                                            {selectedSession.explanation || selectedSession.transcript}
                                        </div>
                                    </div>
                                    
                                    {/* Multi-language Translations */}
                                    {selectedSession.translations && Object.keys(selectedSession.translations).length > 0 && (
                                        <div className="space-y-3 pt-6 border-t font-semibold text-sm">
                                            <h4 className="font-semibold text-sm">Available Translations:</h4>
                                            {Object.entries(selectedSession.translations).map(([lang, text]) => (
                                                <details key={lang} className="bg-muted p-3 rounded-lg">
                                                    <summary className="cursor-pointer font-medium capitalize">
                                                        {lang === "hi" && "🇮🇳 Hindi"} {lang === "es" && "🇪🇸 Spanish"}{" "}
                                                        {lang === "fr" && "🇫🇷 French"} {lang === "de" && "🇩🇪 German"}{" "}
                                                        {lang === "zh" && "🇨🇳 Chinese"} {lang === "ar" && "🇸🇦 Arabic"}{" "}
                                                        {lang === "pt" && "🇵🇹 Portuguese"} {lang === "ru" && "🇷🇺 Russian"}
                                                    </summary>
                                                    <p className="mt-2 text-sm whitespace-pre-wrap">{text}</p>
                                                </details>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {/* Images Tab */}
                        {activeTab === "images" && (() => {
                            const hasStaticImage = selectedSession.imageUrl && selectedSession.imageUrl.startsWith('/content/')
                            const hasRealSVG = !hasStaticImage && selectedSession.detailedIllustrationSVG &&
                                selectedSession.detailedIllustrationSVG.trim().startsWith('<') &&
                                (selectedSession.detailedIllustrationSVG.includes('<rect') || selectedSession.detailedIllustrationSVG.includes('<circle') ||
                                    selectedSession.detailedIllustrationSVG.includes('<path') || selectedSession.detailedIllustrationSVG.includes('<ellipse') ||
                                    selectedSession.detailedIllustrationSVG.includes('<polygon')) &&
                                selectedSession.detailedIllustrationSVG.length > 200

                            return (
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Visual Resources</CardTitle>
                                        <CardDescription>Generated educational images and diagrams</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        {hasStaticImage ? (
                                            <div className="space-y-4">
                                                <img
                                                    src={selectedSession.imageUrl!}
                                                    alt={selectedSession.metadata.topic || "Lesson visual"}
                                                    className="w-full rounded-lg border shadow-inner object-contain bg-white"
                                                    style={{ maxHeight: '600px' }}
                                                />
                                            </div>
                                        ) : hasRealSVG ? (
                                            <div className="space-y-4">
                                                <div
                                                    className="w-full rounded-lg overflow-hidden bg-white border shadow-inner flex items-center justify-center p-4"
                                                    style={{ minHeight: '400px' }}
                                                    dangerouslySetInnerHTML={{ __html: selectedSession.detailedIllustrationSVG! }}
                                                />
                                            </div>
                                        ) : selectedSession.images.length > 0 ? (
                                            <div className="grid gap-4">
                                                {selectedSession.images.map((img, idx) => (
                                                    <div key={idx} className="p-4 bg-muted rounded-lg">
                                                        <Badge className="mb-2">Reference {idx + 1}</Badge>
                                                        <p className="text-sm">{img}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-center py-8 text-muted-foreground">No visual resources in this session</p>
                                        )}
                                    </CardContent>
                                </Card>
                            )
                        })()}

                        {/* Videos Tab */}
                        {activeTab === "videos" && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Educational Animations</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {selectedSession.animationUrl ? (
                                        <div className="space-y-4">
                                            <div className="relative w-full rounded-lg overflow-hidden bg-black border shadow-inner" style={{ paddingBottom: '75.56%' }}>
                                                <iframe
                                                    src={selectedSession.animationUrl}
                                                    className="absolute inset-0 w-full h-full border-0"
                                                    title="Lesson Animation"
                                                    allowFullScreen
                                                />
                                            </div>
                                        </div>
                                    ) : selectedSession.animationCode || (selectedSession.animations && selectedSession.animations.length > 0) ? (
                                        <div className="space-y-4">
                                            {(selectedSession.animationCode ? [selectedSession.animationCode] : selectedSession.animations || []).map((animCode, idx) => (
                                                <div key={idx} className="border rounded-lg overflow-hidden">
                                                    <div className="relative w-full aspect-video bg-white">
                                                        <iframe
                                                            srcDoc={animCode.includes('<html>') ? animCode : `
                                                                <html>
                                                                <head>
                                                                    <style>body { margin: 0; overflow: hidden; display: flex; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif; }</style>
                                                                </head>
                                                                <body>
                                                                    ${animCode}
                                                                </body>
                                                                </html>
                                                            `}
                                                            className="w-full h-full border-0"
                                                            title={`Animation ${idx + 1}`}
                                                            sandbox="allow-scripts"
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-center py-8 text-muted-foreground">No animations in this session</p>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {/* Accessibility Tab */}
                        {activeTab === "accessibility" && (
                            <DeafAccessibilityFeatures
                                topic={selectedSession.metadata.topic || selectedSession.title}
                                signLanguageSVG={selectedSession.signLanguageSVG || ""}
                                visualTranscript={selectedSession.accessibility.visualTranscript || ""}
                            />
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
