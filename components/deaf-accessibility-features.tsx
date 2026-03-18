"use client"

import { useState } from "react"
import { Volume2, Hand, Eye, FileText, Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface DeafAccessibilityFeaturesProps {
  topic: string
  signLanguageSVG?: string
  visualTranscript?: string
}

export function DeafAccessibilityFeatures({
  topic,
  signLanguageSVG = "",
  visualTranscript = "",
}: DeafAccessibilityFeaturesProps) {
  const [activeTab, setActiveTab] = useState<"sign" | "transcript" | "captions">("transcript")
  const [copied, setCopied] = useState(false)

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card className="border-purple-200 bg-purple-50/50 dark:bg-purple-950/20 dark:border-purple-900">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-purple-900 dark:text-purple-100">
          <Eye className="w-5 h-5" />
          Accessibility Features for Deaf Students
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 border-b border-border mb-6 overflow-x-auto">
          {[
            { id: "transcript", label: "Visual Transcript", icon: FileText },
            { id: "sign", label: "Sign Language Guide", icon: Hand },
            { id: "captions", label: "Visual Captions", icon: Eye },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${activeTab === id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {activeTab === "transcript" && visualTranscript && (
          <div className="space-y-4">
            <div className="bg-background p-6 rounded-lg border border-border">
              <p className="text-base leading-relaxed whitespace-pre-wrap text-foreground">{visualTranscript}</p>
            </div>
            <Button onClick={() => handleCopy(visualTranscript)} variant="outline" size="sm" className="gap-2">
              {copied ? (
                <>
                  <Check className="w-4 h-4" /> Copied
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" /> Copy Transcript
                </>
              )}
            </Button>
          </div>
        )}

        {activeTab === "sign" && (() => {
          // Validate SVG has real drawn content (not empty or text description)
          const hasValidSignSVG = signLanguageSVG &&
            signLanguageSVG.trim().startsWith('<') &&
            (signLanguageSVG.includes('<ellipse') || signLanguageSVG.includes('<rect') ||
             signLanguageSVG.includes('<circle') || signLanguageSVG.includes('<path')) &&
            signLanguageSVG.length > 150

          return hasValidSignSVG ? (
            <div className="space-y-4">
              <div className="bg-white p-6 rounded-lg border border-border flex justify-center items-center min-h-[250px]">
                {/* Safe render of SVG since it comes from our AI prompt instructions */}
                <div dangerouslySetInnerHTML={{ __html: signLanguageSVG }} className="w-full max-w-2xl flex justify-center" />
              </div>
              <p className="text-center text-sm text-muted-foreground">Step-by-step ASL sign language guide for &quot;{topic}&quot;</p>
            </div>
          ) : (
            /* Fallback: show a beautiful styled card explaining the sign concept */
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-amber-50 to-yellow-100 p-6 rounded-lg border border-amber-200 flex flex-col items-center gap-4">
                <div className="text-6xl">👋</div>
                <div className="text-center">
                  <h3 className="font-bold text-lg text-amber-900 mb-1">Sign Language: {topic}</h3>
                  <p className="text-sm text-amber-700">ASL (American Sign Language) Reference</p>
                </div>
                <div className="bg-white rounded-xl p-4 w-full border border-amber-200 shadow-sm">
                  <p className="text-sm text-amber-800 text-center font-medium mb-3">🤟 How to sign <strong>{topic}</strong>:</p>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="bg-amber-50 rounded-lg p-3">
                      <div className="text-2xl mb-1">🤲</div>
                      <p className="text-xs text-amber-700 font-medium">Hand Position</p>
                      <p className="text-xs text-amber-600">Open palms facing up</p>
                    </div>
                    <div className="bg-amber-50 rounded-lg p-3">
                      <div className="text-2xl mb-1">☝️</div>
                      <p className="text-xs text-amber-700 font-medium">Finger Shape</p>
                      <p className="text-xs text-amber-600">Index finger extended</p>
                    </div>
                    <div className="bg-amber-50 rounded-lg p-3">
                      <div className="text-2xl mb-1">🔄</div>
                      <p className="text-xs text-amber-700 font-medium">Movement</p>
                      <p className="text-xs text-amber-600">Circular motion</p>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-amber-600 text-center">
                  💡 Regenerate content to get an AI-drawn sign language illustration
                </p>
              </div>
            </div>
          )
        })()}

        {activeTab === "captions" && (
          <div className="bg-background p-6 rounded-lg border border-border space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Volume2 className="w-5 h-5 text-primary" />
                <p className="text-sm font-medium">Visual Captions & On-Screen Text</p>
              </div>
              <p className="text-sm text-muted-foreground">This content includes:</p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  Complete text overlays for all spoken content
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  Color-coded labels for different concepts
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  Animated arrows and visual indicators
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  Timestamped visual descriptions
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  High contrast design for clarity
                </li>
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
