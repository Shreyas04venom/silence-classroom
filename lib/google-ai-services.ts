import { GoogleGenerativeAI } from "@google/generative-ai"

// Initialize Gemini with key rotation
const keys = (process.env.GEMINI_API_KEY || "").split(",").map((k) => k.trim()).filter((k) => k.length > 0)

if (keys.length === 0) {
  console.warn("No GEMINI_API_KEY configured")
}

export interface GeneratedContent {
  explanation: string
  imagePrompt: string
  detailedIllustrationSVG: string // Detailed educational diagram with labels
  animationCode: string // Advanced HTML/Canvas animation
  signLanguageSVG: string // SVG code for sign language
  visualTranscript: string
}

export async function generateEducationalContent(
  topic: string,
  chapter: string,
  standard: string,
  subject: string,
): Promise<GeneratedContent> {
  // Build context string — handle empty values from VIC mode gracefully
  const contextParts = []
  if (standard) contextParts.push(`Standard ${standard}`)
  if (subject) contextParts.push(`Subject: ${subject}`)
  if (chapter) contextParts.push(`Chapter: ${chapter}`)
  const contextStr = contextParts.length > 0 ? ` (${contextParts.join(", ")})` : ""

  const prompt = `You are an expert scientific educator and SVG artist creating visual content for deaf students.
Generate ONLY valid JSON (no markdown, no code blocks). All SVG fields MUST contain REAL, VISIBLE, DRAWN SVG —
NOT empty tags and NOT text descriptions of what you would draw.

CRITICAL RULES:
- detailedIllustrationSVG: Draw a REAL educational diagram with colored shapes, arrows, and text labels.
  Use <rect>, <circle>, <path>, <line>, <text>, <polygon> elements. Min 600 chars.
  The diagram MUST illustrate "${topic}" specifically — show the actual parts, processes, or concepts involved.
  TEXT OVERLAP PREVENTION: Ensure all <text> elements are spaced far apart. Use text-shadow or white backgrounds for labels to ensure readability. Place labels strategically so they NEVER overlap with lines or other shapes.
- signLanguageSVG: Create a UNIQUE visual sign language guide SPECIFICALLY for "${topic}".
  It MUST show how to sign THIS EXACT TOPIC — not a generic hand gesture.
  Include multiple hand positions showing the signing process step by step.
  NUMBERS & LABELS: Ensure step numbers and hand labels are clearly separated and don't overlap with the hand drawings.
- Do NOT return empty SVG like <svg></svg>. Do NOT return text descriptions.
- animationCode: Create a REAL interactive HTML animation with Canvas or CSS animations showing "${topic}".
  VISUAL CLARITY: Ensure any moving labels have a fixed position or enough padding to NEVER overlap with the animated subject. Use high contrast colors.

=== DETAILED ILLUSTRATION SVG ===
Create a professional educational diagram for "${topic}" with:
- Proper title showing "${topic}" at the top (centered, font-size 24px)
- Multiple colored shapes representing the key parts/concepts (use rounded corners, rx="8")
- Labeled arrows showing flow/relationships (use marker-end for clear arrows)
- At least 5-8 distinct visual elements with text labels
- VISUAL ACCURACY: Place labels next to elements, not on top of them. Use a small white <rect> behind text if it's over a busy background.
- Professional color scheme (blues, greens, oranges — not plain primary colors)
- Min viewBox: 0 0 800 500

=== SIGN LANGUAGE SVG — CRITICAL: MUST BE SPECIFIC TO "${topic}" ===
Create a step-by-step ASL (American Sign Language) guide showing how to sign "${topic}".
The SVG MUST include:
1. Title: "How to Sign: ${topic}" at the top
2. 3-4 numbered steps, each showing a DIFFERENT hand position/movement
3. Each step has: a hand illustration (using ellipses for palm, rects for fingers), 
   a step number circle, and a descriptive label (e.g., "Step 1: Open palm facing forward")
4. Arrows between steps showing the signing sequence
5. NO OVERLAP: Ensure hand positions are in a clean grid (e.g., Column 1, Column 2, etc.) so they don't overlap.
6. At the bottom: the word "${topic}" with a description of the complete sign

Structure (viewBox 0 0 700 400):
- Background: warm gradient (#fef3c7 to #fde68a)
- Title bar at top with topic name
- 3-4 columns, each with a numbered step showing a unique hand position
- Flow arrows between steps
- Bottom summary bar

=== ANIMATION CODE ===
Create a self-contained HTML animation for "${topic}" using Canvas or CSS:
- Must be a complete working HTML snippet (can include <style>, <canvas>, <script>)
- Show the educational concept visually with smooth animations
- LABEL PLACEMENT: If using labels in animation, place them in a dedicated 'sidebar' area or at the bottom to avoid overlapping with the moving parts.
- Include a title, moving/transforming elements, color transitions
- Should run in a loop and be visually engaging
- Use requestAnimationFrame for smooth 60fps animation
- Must be at least 2000 characters of real animation code (not a placeholder div!)

Generate for topic: "${topic}"${contextStr}

Return ONLY this JSON object:
{
  "explanation": "3-4 detailed paragraphs explaining ${topic} for deaf students with vivid visual descriptions. Include step-by-step breakdown, real-world examples, and key takeaways.",
  "imagePrompt": "Professional educational diagram of ${topic} with labeled parts, arrows, and color coding.",
  "detailedIllustrationSVG": "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 500'>COMPLETE REAL DRAWN DIAGRAM for ${topic} with multiple shapes, colors, labels, arrows showing the actual concept</svg>",
  "animationCode": "<div>COMPLETE WORKING HTML/CSS/JS ANIMATION showing ${topic} with Canvas or CSS animations, at least 2000 chars</div>",
  "signLanguageSVG": "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 700 400'>STEP-BY-STEP ASL SIGN GUIDE specifically for ${topic} with 3-4 different hand positions, numbered steps, and flow arrows</svg>",
  "visualTranscript": "0:00 - Title '${topic}' appears with visual emphasis\\n0:03 - [First key visual element appears]\\n0:06 - [Second visual element with description]\\n0:09 - [Process/relationship shown]\\n0:12 - [Key concept highlighted]\\n0:15 - Summary visual with key takeaways"
}`

  let lastError: any

  console.log(`[GenerateContent] Starting with ${keys.length} API keys`)

  // Models to try in order (most likely to work first)
  const modelsToTry = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-2.5-pro", "gemini-2.0-flash-001"]

  // Try each key in rotation
  for (let keyIndex = 0; keyIndex < keys.length; keyIndex++) {
    const key = keys[keyIndex]
    
    // Try each model with this key
    for (const modelName of modelsToTry) {
      try {
        console.log(`[GenerateContent] Trying key ${keyIndex + 1}/${keys.length}, model: ${modelName}`)
        
        const genAI = new GoogleGenerativeAI(key)
        console.log(`[GenerateContent] Model instance created for: ${modelName}`)
        
        const model = genAI.getGenerativeModel({ model: modelName })
        console.log(`[GenerateContent] Sending prompt to ${modelName}...`)
        
        const result = await model.generateContent(prompt)
        console.log(`[GenerateContent] Got result from ${modelName}, extracting text...`)
        
        const responseText = result.response.text()

        // Parse JSON from response
        let content: GeneratedContent
        try {
          console.log(`[GenerateContent] Parsing JSON response from ${modelName}...`)
          content = JSON.parse(responseText)
          console.log(`[GenerateContent] ✓ Success with ${modelName}! Generated content for topic: ${topic}`)
          return content
        } catch {
          console.log(`[GenerateContent] Direct JSON parse failed, trying regex extraction...`)
          const jsonMatch = responseText.match(/\`\`\`json\n?([\s\S]*?)\n?\`\`\`/) || responseText.match(/({[\s\S]*})/)
          if (!jsonMatch) {
            throw new Error("Could not parse JSON response from model")
          }
          content = JSON.parse(jsonMatch[1])
          console.log(`[GenerateContent] ✓ Success with regex from ${modelName}! Generated content for topic: ${topic}`)
          return content
        }
      } catch (error: any) {
        console.warn(`[GenerateContent] Key ${keyIndex + 1}/${keys.length} with model ${modelName} failed:`, error.message?.substring(0, 100))
        lastError = error
        
        // If it's a 404 or model not found, try next model
        if (error.message?.includes("404") || error.message?.includes("not found")) {
          console.log(`[GenerateContent] Model ${modelName} not found, trying next model...`)
          continue
        }
        
        // If it's a quota error, try next key entirely
        if (error.message?.includes("429") || error.message?.includes("quota")) {
          console.warn(`[GenerateContent] Quota exceeded for this key, trying next key...`)
          break
        }
        
        continue // Try next model
      }
    }
  }

  console.error("All Gemini API keys and models failed or exhausted.")
  throw lastError || new Error("Failed to generate content with any available API key or model")
}
