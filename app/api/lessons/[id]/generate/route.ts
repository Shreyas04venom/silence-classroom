import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { generateText } from "ai"

// Rate limiting map (in production, use Redis)
const rateLimitMap = new Map<string, number>()
const RATE_LIMIT_WINDOW = 10000 // 10 seconds

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: lessonId } = await params
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Rate limiting
    const lastRequest = rateLimitMap.get(user.id)
    if (lastRequest && Date.now() - lastRequest < RATE_LIMIT_WINDOW) {
      return NextResponse.json({ error: "Please wait before generating again" }, { status: 429 })
    }
    rateLimitMap.set(user.id, Date.now())

    // Get request body
    const body = await request.json()
    const { lessonText, title, topic, transcribedText, autoSplitConcepts } = body

    // Use transcribed text if available
    const textToProcess = transcribedText || lessonText
    if (!textToProcess) {
      return NextResponse.json({ error: "Lesson text is required" }, { status: 400 })
    }

    // Step 1: Extract keywords and summary using AI
    let keywords: string[] = []
    let summary = ""

    try {
      const { text } = await generateText({
        model: "openai/gpt-4o-mini",
        system: `You are an assistant that extracts short visual keywords and produces a short summary for deaf/hard-of-hearing students. ALWAYS RESPOND WITH VALID JSON ONLY, no markdown.`,
        prompt: `Given the lesson text below, extract 4 concise visual keywords suitable for image/video search and create a short 1–2 sentence summary appropriate for a classroom display. Output exactly:
{"keywords": ["k1","k2","k3","k4"], "summary": "Short summary..."}

LessonText: <<<${textToProcess}>>>`,
      })

      // Parse JSON response
      const parsed = JSON.parse(text.replace(/\`\`\`json?\n?|\n?\`\`\`/g, "").trim())
      keywords = parsed.keywords || []
      summary = parsed.summary || ""
    } catch (aiError) {
      console.error("AI extraction error:", aiError)
      // Fallback: extract simple keywords from text
      const words = textToProcess.split(/\s+/)
      keywords = words
        .filter((w: string) => w.length > 4)
        .slice(0, 4)
        .map((w: string) => w.toLowerCase().replace(/[^a-z]/g, ""))
      summary = textToProcess.slice(0, 200) + "..."
    }

    // Step 2: Update or create lesson
    let lesson
    if (lessonId && lessonId !== "new") {
      // Update existing lesson
      const { data, error } = await supabase
        .from("lessons")
        .update({
          title,
          topic,
          lesson_text: textToProcess,
          summary,
          keywords,
          updated_at: new Date().toISOString(),
        })
        .eq("id", lessonId)
        .eq("teacher_id", user.id)
        .select()
        .single()

      if (error) throw error
      lesson = data
    } else {
      // Create new lesson
      const { data, error } = await supabase
        .from("lessons")
        .insert({
          subject_id: body.subjectId,
          teacher_id: user.id,
          title,
          topic,
          lesson_text: textToProcess,
          summary,
          keywords,
        })
        .select()
        .single()

      if (error) throw error
      lesson = data
    }

    // Step 3: Fetch media for each keyword
    const mediaResources: Array<{
      media_type: string
      source: string
      url: string
      thumbnail_url?: string
      title?: string
      meta: Record<string, unknown>
    }> = []

    for (const keyword of keywords) {
      // Check cache first
      const { data: cached } = await supabase
        .from("api_cache")
        .select("response")
        .eq("api_type", "media")
        .eq("cache_key", keyword)
        .single()

      if (cached?.response) {
        const cachedMedia = cached.response as Array<(typeof mediaResources)[0]>
        mediaResources.push(...cachedMedia)
        continue
      }

      // Fetch images from Pixabay (free API)
      const keywordMedia: typeof mediaResources = []

      try {
        // Using placeholder images as fallback since we need API keys
        // In production, replace with actual Pixabay/Unsplash API calls
        const placeholderImages = [
          {
            media_type: "image" as const,
            source: "placeholder",
            url: `/placeholder.svg?height=400&width=600&query=${encodeURIComponent(keyword + " educational")}`,
            thumbnail_url: `/placeholder.svg?height=150&width=200&query=${encodeURIComponent(keyword)}`,
            title: `${keyword} - Educational Image`,
            meta: { keyword },
          },
          {
            media_type: "image" as const,
            source: "placeholder",
            url: `/placeholder.svg?height=400&width=600&query=${encodeURIComponent(keyword + " diagram")}`,
            thumbnail_url: `/placeholder.svg?height=150&width=200&query=${encodeURIComponent(keyword + " icon")}`,
            title: `${keyword} - Diagram`,
            meta: { keyword },
          },
        ]
        keywordMedia.push(...placeholderImages)

        // Fetch YouTube videos if API key is available
        if (process.env.YOUTUBE_API_KEY) {
          const ytResponse = await fetch(
            `https://www.googleapis.com/youtube/v3/search?` +
              `part=snippet&q=${encodeURIComponent(keyword + " education animation")}&` +
              `type=video&videoDuration=short&maxResults=2&` +
              `key=${process.env.YOUTUBE_API_KEY}`,
          )

          if (ytResponse.ok) {
            const ytData = await ytResponse.json()
            for (const item of ytData.items || []) {
              keywordMedia.push({
                media_type: "video",
                source: "youtube",
                url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
                thumbnail_url: item.snippet.thumbnails?.medium?.url,
                title: item.snippet.title,
                meta: {
                  youtubeId: item.id.videoId,
                  channelTitle: item.snippet.channelTitle,
                },
              })
            }
          }
        }
      } catch (fetchError) {
        console.error(`Error fetching media for ${keyword}:`, fetchError)
      }

      // Cache the results
      if (keywordMedia.length > 0) {
        await supabase.from("api_cache").upsert({
          api_type: "media",
          cache_key: keyword,
          response: keywordMedia,
          ttl_seconds: 86400, // 24 hours
        })
        mediaResources.push(...keywordMedia)
      }
    }

    // Step 4: Create concepts if auto-split enabled
    if (autoSplitConcepts && keywords.length > 0) {
      const concepts = keywords.map((keyword, index) => ({
        lesson_id: lesson.id,
        index,
        title: keyword.charAt(0).toUpperCase() + keyword.slice(1),
        notes: `Section about ${keyword}`,
      }))

      await supabase.from("concepts").insert(concepts)
    }

    // Step 5: Store media resources
    if (mediaResources.length > 0) {
      const mediaToInsert = mediaResources.map((m) => ({
        lesson_id: lesson.id,
        teacher_id: user.id,
        media_type: m.media_type,
        source: m.source,
        url: m.url,
        thumbnail_url: m.thumbnail_url,
        title: m.title,
        meta: m.meta,
      }))

      await supabase.from("media_resources").insert(mediaToInsert)
    }

    // Return response
    return NextResponse.json({
      lessonId: lesson.id,
      summary,
      keywords,
      mediaResources,
      message: "Lesson generated successfully",
    })
  } catch (error) {
    console.error("Generate error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate lesson" },
      { status: 500 },
    )
  }
}
