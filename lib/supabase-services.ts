import { VICSession } from "./session-storage"
import { createClient } from "./supabase/client"

/**
 * Uploads a text-based blob (SVG or HTML) or standard file to the Supabase Lessons-Media bucket.
 */
async function uploadMediaToBucket(
    supabase: any,
    fileName: string,
    content: string,
    contentType: string
): Promise<string | null> {
    try {
        const fileBlob = new Blob([content], { type: contentType })
        const filePath = `${Date.now()}_${fileName}`

        const { data, error } = await supabase.storage
            .from("Lessons-Media")
            .upload(filePath, fileBlob, {
                cacheControl: "3600",
                upsert: false,
            })

        if (error) {
            console.error(`Error uploading ${fileName}:`, error)
            return null
        }

        const { data: publicUrlData } = supabase.storage
            .from("Lessons-Media")
            .getPublicUrl(filePath)

        return publicUrlData.publicUrl
    } catch (err) {
        console.error(`Exception uploading ${fileName}:`, err)
        return null
    }
}

/**
 * Saves a local VICSession to the Supabase database.
 * Creates a record in the 'Lessons' table and associated records in 'Media'.
 */
export async function saveSessionToSupabase(session: VICSession): Promise<boolean> {
    const supabase = createClient()

    try {
        // Generate a UUID client-side to avoid needing .select() returns from Supabase insert
        const lessonId = crypto.randomUUID()

        // 1. Insert into Lessons table
        const { error: lessonError } = await supabase
            .from("Lessons")
            .insert({
                id: lessonId,
                subject: session.metadata.subject || "General",
                standard: session.metadata.standard || "General",
                topic: session.metadata.topic || session.title,
                explanation: session.explanation || session.transcript,
                transcript: session.transcript,
            })

        if (lessonError) {
            console.error("Failed to insert into Lessons table:", lessonError.message || lessonError)
            if (lessonError.code === '42501') {
                console.error("Row Level Security (RLS) blocked the insert. Please enable insert policies on your Supabase Lessons table.")
                alert("Supabase Error: Row Level Security (RLS) is blocking inserts. Please check your Supabase Table Policies.")
            }
            return false
        }

        // 2. Process and Upload Media
        const mediaPromises: Promise<any>[] = []

        // A helper function to insert a URL into the Media table
        const insertMediaRecord = async (type: string, url: string) => {
            return supabase.from("Media").insert({
                lesson_id: lessonId,
                type: type,
                url: url,
            })
        }

        // SVG Diagram (upload as file)
        if (session.detailedIllustrationSVG) {
            const promise = uploadMediaToBucket(
                supabase,
                "diagram.svg",
                session.detailedIllustrationSVG,
                "image/svg+xml"
            ).then((url) => {
                if (url) return insertMediaRecord("diagram", url)
            })
            mediaPromises.push(promise)
        }

        // Sign Language SVG (upload as file)
        if (session.signLanguageSVG) {
            const promise = uploadMediaToBucket(
                supabase,
                "sign_language.svg",
                session.signLanguageSVG,
                "image/svg+xml"
            ).then((url) => {
                if (url) return insertMediaRecord("sign_language", url)
            })
            mediaPromises.push(promise)
        }

        // Animation Code (upload as HTML file)
        if (session.animationCode) {
            const htmlContent = session.animationCode.includes("<html>")
                ? session.animationCode
                : `<html><head><style>body { margin: 0; overflow: hidden; display: flex; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif; }</style></head><body>${session.animationCode}</body></html>`

            const promise = uploadMediaToBucket(
                supabase,
                "animation.html",
                htmlContent,
                "text/html"
            ).then((url) => {
                if (url) return insertMediaRecord("animation", url)
            })
            mediaPromises.push(promise)
        }

        // Pre-existing external Image URL
        if (session.imageUrl) {
            mediaPromises.push(insertMediaRecord("image_url", session.imageUrl))
        }

        // Pre-existing external Animation URL
        if (session.animationUrl) {
            mediaPromises.push(insertMediaRecord("animation_url", session.animationUrl))
        }

        // Older generated array-based properties
        if (session.images && session.images.length > 0) {
            session.images.forEach((img) => {
                if (img !== session.imageUrl) {
                    mediaPromises.push(insertMediaRecord("image", img))
                }
            })
        }

        // Wait for all media to be uploaded and linked
        await Promise.all(mediaPromises)

        return true
    } catch (error) {
        console.error("Unexpected error saving session to Supabase:", error)
        return false
    }
}
