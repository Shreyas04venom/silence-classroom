import { type NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

export async function GET(request: NextRequest) {
  try {
    const prompt = request.nextUrl.searchParams.get("prompt")
    const topic = request.nextUrl.searchParams.get("topic")

    if (!prompt || !topic) {
      return NextResponse.json({ error: "Missing prompt or topic" }, { status: 400 })
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "API key not configured" }, { status: 500 })
    }

    console.log("[Video Generation] Starting - Topic:", topic)

    // Use Veo 3.1 API for real video generation
    const enhancedPrompt = `Generate an educational video about: ${topic}. 
    The video should be clear, engaging, and suitable for teaching deaf students.
    Include visual demonstrations and on-screen text explanations.
    Duration: 15-30 seconds.
    ${prompt}`

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    
    try {
      // Try Veo 3.1 for video generation
      const model = genAI.getGenerativeModel({ model: "veo-3.1-generate-preview" })
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: enhancedPrompt }] }],
      })

      const videoData = result.response.candidates?.[0]?.content?.parts?.[0]
      if (!videoData || !("inlineData" in videoData)) {
        throw new Error("No video data in response")
      }

      const base64Video = videoData.inlineData.data
      const videoBuffer = Buffer.from(base64Video, "base64")

      console.log("[Video Generation] ✓ Success - Generated real video for:", topic)
      
      return new NextResponse(videoBuffer, {
        headers: {
          "Content-Type": "video/mp4",
          "Cache-Control": "public, max-age=86400",
          "Content-Disposition": `inline; filename="${topic.replace(/\s+/g, "_")}.mp4"`,
        },
      })
    } catch (veoError: any) {
      console.warn("[Video Generation] Veo API failed:", veoError.message)
      
      // Fallback: Generate animated HTML/Canvas visualization
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })
      const animationPrompt = `Create JavaScript code for an animated educational visualization about: ${topic}.
      Return valid JavaScript/Canvas code that creates a 3-5 second animation loop.
      Make it visually educational and suitable for deaf students.`
      
      const animResult = await model.generateContent(animationPrompt)
      const animCode = animResult.response.text()

      // Return an HTML page with the animation
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${topic} - Educational Animation</title>
          <style>
            body { margin: 0; padding: 0; background: #000; font-family: Arial, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
            .container { width: 100%; height: 100vh; position: relative; background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); }
            canvas { display: block; width: 100%; height: 100%; }
            .title { position: absolute; top: 20px; left: 20px; color: white; font-size: 24px; font-weight: bold; background: rgba(0,0,0,0.5); padding: 10px 20px; border-radius: 5px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="title">${topic}</div>
            <canvas id="canvas"></canvas>
          </div>
          <script>
            const canvas = document.getElementById('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            let animationFrame = 0;
            function animate() {
              animationFrame++;
              ${animCode}
              requestAnimationFrame(animate);
            }
            animate();
            window.addEventListener('resize', () => {
              canvas.width = window.innerWidth;
              canvas.height = window.innerHeight;
            });
          </script>
        </body>
        </html>
      `

      return new NextResponse(html, {
        headers: {
          "Content-Type": "text/html",
          "Cache-Control": "public, max-age=3600",
        },
      })
    }
  } catch (error) {
    console.error("[Video Generation] Error:", error)
    return NextResponse.json({ error: "Failed to generate video" }, { status: 500 })
  }
}
