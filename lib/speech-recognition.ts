/**
 * Live Speech Recognition Service
 * Uses Web Speech API for real-time speech-to-text conversion
 */

export interface SpeechRecognitionResult {
    transcript: string
    isFinal: boolean
    confidence: number
    timestamp: number
}

export interface SpeechRecognitionOptions {
    language?: string
    continuous?: boolean
    interimResults?: boolean
    onResult?: (result: SpeechRecognitionResult) => void
    onError?: (error: string) => void
    onEnd?: () => void
}

class LiveSpeechRecognition {
    private recognition: any = null
    private isListening = false
    private finalTranscript = ""
    private interimTranscript = ""

    constructor() {
        if (typeof window !== "undefined") {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
            if (SpeechRecognition) {
                this.recognition = new SpeechRecognition()
            }
        }
    }

    isSupported(): boolean {
        return this.recognition !== null
    }

    start(options: SpeechRecognitionOptions = {}): void {
        if (!this.recognition) {
            options.onError?.("Speech recognition is not supported in this browser")
            return
        }

        if (this.isListening) {
            return
        }

        // Configure recognition
        this.recognition.continuous = options.continuous ?? true
        this.recognition.interimResults = options.interimResults ?? true
        this.recognition.lang = options.language || "en-US"
        this.recognition.maxAlternatives = 1

        // Reset transcripts
        this.finalTranscript = ""
        this.interimTranscript = ""

        // Handle results
        this.recognition.onresult = (event: any) => {
            this.interimTranscript = ""

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript
                const confidence = event.results[i][0].confidence

                if (event.results[i].isFinal) {
                    this.finalTranscript += transcript + " "
                    options.onResult?.({
                        transcript: this.finalTranscript.trim(),
                        isFinal: true,
                        confidence,
                        timestamp: Date.now(),
                    })
                } else {
                    this.interimTranscript += transcript
                    options.onResult?.({
                        transcript: this.interimTranscript,
                        isFinal: false,
                        confidence,
                        timestamp: Date.now(),
                    })
                }
            }
        }

        // Handle errors
        this.recognition.onerror = (event: any) => {
            // Suppress common non-critical errors
            if (
                event.error !== "no-speech" &&
                event.error !== "audio-capture" &&
                event.error !== "network" // Network errors are temporary and recoverable
            ) {
                console.error("Speech recognition error:", event.error)
                options.onError?.(event.error)
            }

            // Auto-restart on certain errors
            if (event.error === "no-speech" || event.error === "audio-capture") {
                setTimeout(() => {
                    if (this.isListening) {
                        try {
                            this.recognition.start()
                        } catch (e) {
                            // Ignore "already started" errors
                        }
                    }
                }, 1000)
            }
        }

        // Handle end
        this.recognition.onend = () => {
            // Auto-restart if continuous mode
            if (this.isListening && options.continuous) {
                setTimeout(() => {
                    try {
                        this.recognition.start()
                    } catch (e) {
                        // Ignore "already started" errors
                    }
                }, 100)
            } else {
                this.isListening = false
                options.onEnd?.()
            }
        }

        // Start recognition
        try {
            this.recognition.start()
            this.isListening = true
        } catch (error) {
            options.onError?.("Failed to start speech recognition")
        }
    }

    stop(): void {
        if (this.recognition && this.isListening) {
            this.isListening = false
            this.recognition.stop()
        }
    }

    pause(): void {
        if (this.recognition && this.isListening) {
            this.recognition.stop()
        }
    }

    resume(): void {
        if (this.recognition && this.isListening) {
            try {
                this.recognition.start()
            } catch (e) {
                // Ignore "already started" errors
            }
        }
    }

    getTranscript(): string {
        return this.finalTranscript.trim()
    }

    clearTranscript(): void {
        this.finalTranscript = ""
        this.interimTranscript = ""
    }
}

export const speechRecognition = new LiveSpeechRecognition()
