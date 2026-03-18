"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  ArrowLeft,
  Monitor,
  RefreshCw,
  Trash2,
  Share2,
  Edit,
  ImageIcon,
  Video,
  Loader2,
  QrCode,
  ExternalLink,
} from "lucide-react"
import type { Lesson, MediaResource, Concept, Subject } from "@/lib/types"

interface LessonDetailContentProps {
  lesson: Lesson & {
    subject?: Subject
    concepts?: Concept[]
    media_resources?: MediaResource[]
  }
}

export function LessonDetailContent({ lesson }: LessonDetailContentProps) {
  const router = useRouter()
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showQRDialog, setShowQRDialog] = useState(false)

  const images = lesson.media_resources?.filter((m) => m.media_type === "image" || m.media_type === "gif") || []
  const videos = lesson.media_resources?.filter((m) => m.media_type === "video") || []

  const handleRegenerate = async () => {
    setIsRegenerating(true)
    try {
      const response = await fetch(`/api/lessons/${lesson.id}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessonText: lesson.lesson_text,
          title: lesson.title,
          topic: lesson.topic,
        }),
      })
      if (!response.ok) throw new Error("Failed to regenerate")
      router.refresh()
    } catch (error) {
      console.error("Regenerate error:", error)
    } finally {
      setIsRegenerating(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/lessons/${lesson.id}`, {
        method: "DELETE",
      })
      if (!response.ok) throw new Error("Failed to delete")
      router.push("/dashboard")
    } catch (error) {
      console.error("Delete error:", error)
    } finally {
      setIsDeleting(false)
    }
  }

  const displayUrl = `/lessons/${lesson.id}/display`

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold">{lesson.title}</h1>
                <p className="text-sm text-muted-foreground">
                  {lesson.subject?.name} • {lesson.subject?.grade}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link href={`/lessons/${lesson.id}/display`}>
                <Button className="gap-2">
                  <Monitor className="h-4 w-4" />
                  Classroom Display
                </Button>
              </Link>
              <Button variant="outline" size="icon" onClick={() => setShowQRDialog(true)}>
                <QrCode className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Summary Card */}
            <Card>
              <CardHeader>
                <CardTitle>Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg leading-relaxed">{lesson.summary || "No summary generated yet."}</p>
                {lesson.keywords && lesson.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {lesson.keywords.map((keyword, i) => (
                      <Badge key={i} variant="secondary" className="text-sm">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Images Gallery */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <ImageIcon className="h-5 w-5" />
                    Visual Resources ({images.length})
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {images.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No images generated yet. Click &quot;Regenerate&quot; to create visuals.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {images.map((media) => (
                      <div key={media.id} className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                        <img
                          src={media.url || "/placeholder.svg"}
                          alt={media.title || "Lesson visual"}
                          className="w-full h-full object-cover hover:scale-105 transition-transform"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Videos */}
            {videos.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Video className="h-5 w-5" />
                    Educational Videos ({videos.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    {videos.map((video) => (
                      <div key={video.id} className="space-y-2">
                        <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                          {video.meta?.youtubeId ? (
                            <iframe
                              src={`https://www.youtube.com/embed/${video.meta.youtubeId}`}
                              title={video.title || "Educational video"}
                              className="w-full h-full"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            />
                          ) : (
                            <img
                              src={video.thumbnail_url || "/placeholder.svg?height=200&width=400&query=video"}
                              alt={video.title || "Video thumbnail"}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                        <p className="text-sm font-medium truncate">{video.title}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Concepts */}
            {lesson.concepts && lesson.concepts.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Lesson Concepts</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {lesson.concepts
                      .sort((a, b) => a.index - b.index)
                      .map((concept) => (
                        <div key={concept.id} className="p-4 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-medium">
                              {concept.index + 1}
                            </span>
                            <div>
                              <h4 className="font-medium">{concept.title}</h4>
                              {concept.notes && <p className="text-sm text-muted-foreground">{concept.notes}</p>}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Actions Card */}
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full gap-2" onClick={handleRegenerate} disabled={isRegenerating}>
                  {isRegenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Regenerating...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4" />
                      Regenerate Visuals
                    </>
                  )}
                </Button>

                <Link href={`/lessons/${lesson.id}/edit`} className="block">
                  <Button variant="outline" className="w-full gap-2 bg-transparent">
                    <Edit className="h-4 w-4" />
                    Edit Lesson
                  </Button>
                </Link>

                <Button variant="outline" className="w-full gap-2 bg-transparent">
                  <Share2 className="h-4 w-4" />
                  Share Lesson
                </Button>

                <Button variant="destructive" className="w-full gap-2" onClick={() => setShowDeleteDialog(true)}>
                  <Trash2 className="h-4 w-4" />
                  Delete Lesson
                </Button>
              </CardContent>
            </Card>

            {/* Info Card */}
            <Card>
              <CardHeader>
                <CardTitle>Lesson Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <Badge variant={lesson.is_published ? "default" : "secondary"}>
                    {lesson.is_published ? "Published" : "Draft"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Images</span>
                  <span>{images.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Videos</span>
                  <span>{videos.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Concepts</span>
                  <span>{lesson.concepts?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created</span>
                  <span>{new Date(lesson.created_at).toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Lesson</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{lesson.title}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QR Code Dialog */}
      <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Classroom Display QR Code</DialogTitle>
            <DialogDescription>Scan this QR code to open the lesson display on any device.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="w-48 h-48 bg-muted rounded-lg flex items-center justify-center">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(displayUrl)}`}
                alt="QR Code for lesson display"
                className="w-full h-full"
              />
            </div>
            <p className="text-sm text-muted-foreground text-center break-all">{displayUrl}</p>
            <Button
              variant="outline"
              className="gap-2 bg-transparent"
              onClick={() => window.open(displayUrl + "?kiosk=true", "_blank")}
            >
              <ExternalLink className="h-4 w-4" />
              Open Kiosk Mode
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
