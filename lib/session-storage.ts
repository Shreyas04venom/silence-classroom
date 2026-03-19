/**
 * Session Storage for VIC Recordings
 * Saves and loads previous recording sessions for student access
 */

export interface VICSession {
    id: string
    title: string
    timestamp: number
    duration: number
    transcript: string
    translations: Record<string, string>
    images: string[]
    animations: string[]
    // Generated content fields
    explanation?: string
    imageUrl?: string
    detailedIllustrationSVG?: string
    animationCode?: string
    animationUrl?: string
    signLanguageSVG?: string
    accessibility: {
        visualTranscript: string
        signLanguageData: any[]
    }
    metadata: {
        teacher?: string
        subject?: string
        topic?: string
        standard?: string
    }
}

const STORAGE_KEY = "vic_sessions"
const MAX_SESSIONS = 50 // Keep last 50 sessions

export function saveSession(session: VICSession): void {
    try {
        let sessions = getAllSessions()

        // Remove existing session with same ID if it exists (prevent duplicates)
        sessions = sessions.filter(s => s.id !== session.id)

        // Add new session at the beginning
        sessions.unshift(session)

        // Keep only MAX_SESSIONS
        if (sessions.length > MAX_SESSIONS) {
            sessions.splice(MAX_SESSIONS)
        }

        localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions))
    } catch (error) {
        console.error("Failed to save session:", error)
    }
}

export function getAllSessions(): VICSession[] {
    try {
        const data = localStorage.getItem(STORAGE_KEY)
        return data ? JSON.parse(data) : []
    } catch (error) {
        console.error("Failed to load sessions:", error)
        return []
    }
}

export function getSession(id: string): VICSession | null {
    const sessions = getAllSessions()
    return sessions.find(s => s.id === id) || null
}

export function deleteSession(id: string): void {
    try {
        const sessions = getAllSessions().filter(s => s.id !== id)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions))
    } catch (error) {
        console.error("Failed to delete session:", error)
    }
}

export function updateSession(id: string, updates: Partial<VICSession>): void {
    try {
        const sessions = getAllSessions()
        const index = sessions.findIndex(s => s.id === id)

        if (index !== -1) {
            sessions[index] = { ...sessions[index], ...updates }
            localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions))
        }
    } catch (error) {
        console.error("Failed to update session:", error)
    }
}

export function generateSessionId(): string {
    return `vic_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

export function formatDuration(milliseconds: number): string {
    const seconds = Math.floor(milliseconds / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)

    if (hours > 0) {
        return `${hours}h ${minutes % 60}m`
    } else if (minutes > 0) {
        return `${minutes}m ${seconds % 60}s`
    } else {
        return `${seconds}s`
    }
}

export function searchSessions(query: string): VICSession[] {
    const sessions = getAllSessions()
    const lowerQuery = query.toLowerCase()

    return sessions.filter(session =>
        session.title.toLowerCase().includes(lowerQuery) ||
        session.transcript.toLowerCase().includes(lowerQuery) ||
        session.metadata.subject?.toLowerCase().includes(lowerQuery) ||
        session.metadata.topic?.toLowerCase().includes(lowerQuery)
    )
}
