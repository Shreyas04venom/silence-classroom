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
  const prompt = `You are an expert scientific educator and SVG artist creating visual content for deaf students.
Generate ONLY valid JSON (no markdown, no code blocks). All SVG fields MUST contain REAL, VISIBLE, DRAWN SVG —
NOT empty tags and NOT text descriptions of what you would draw.

CRITICAL RULES:
- detailedIllustrationSVG: Draw a REAL educational diagram with colored shapes, arrows, and text labels.
  Use <rect>, <circle>, <path>, <line>, <text>, <polygon> elements. Min 600 chars.
- signLanguageSVG: Draw a REAL hand/gesture using SVG ellipses and rects for palm and fingers.
  Include the topic name as a label. Show the concept with an emoji and colored boxes.
- Do NOT return empty SVG like <svg></svg>. Do NOT return text descriptions.
- animationCode: Simple self-contained HTML with inline CSS animation.

For detailedIllustrationSVG, follow this structure:
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="800" height="500">
  <rect width="800" height="500" fill="#f0f9ff"/>
  <text x="400" y="40" text-anchor="middle" font-size="24" font-weight="bold" fill="#1e3a5f">TOPIC_TITLE</text>
  <rect x="50" y="70" width="180" height="90" rx="12" fill="#4fc3f7" stroke="#0288d1" stroke-width="2"/>
  <text x="140" y="120" text-anchor="middle" font-size="15" fill="white">Part Name</text>
  <line x1="230" y1="115" x2="320" y2="115" stroke="#333" stroke-width="2" marker-end="url(#arrow)"/>
  <defs><marker id="arrow" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto"><polygon points="0 0, 10 3.5, 0 7" fill="#333"/></marker></defs>
</svg>

For signLanguageSVG, draw a hand gesture:
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 340" width="280" height="340">
  <rect width="280" height="340" fill="#fef3c7" rx="16"/>
  <text x="140" y="28" text-anchor="middle" font-size="13" font-weight="bold" fill="#92400e">TOPIC_TITLE</text>
  <ellipse cx="140" cy="210" rx="52" ry="65" fill="#fde68a" stroke="#d97706" stroke-width="2"/>
  <rect x="82" y="125" width="20" height="65" rx="10" fill="#fde68a" stroke="#d97706" stroke-width="2"/>
  <rect x="106" y="105" width="20" height="80" rx="10" fill="#fde68a" stroke="#d97706" stroke-width="2"/>
  <rect x="130" y="100" width="20" height="85" rx="10" fill="#fde68a" stroke="#d97706" stroke-width="2"/>
  <rect x="154" y="110" width="20" height="75" rx="10" fill="#fde68a" stroke="#d97706" stroke-width="2"/>
  <ellipse cx="74" cy="182" rx="15" ry="28" fill="#fde68a" stroke="#d97706" stroke-width="2" transform="rotate(-25 74 182)"/>
  <rect x="60" y="290" width="160" height="36" rx="8" fill="#fbbf24"/>
  <text x="140" y="313" text-anchor="middle" font-size="12" fill="#78350f">👋 Sign: TOPIC_TITLE</text>
</svg>

Generate for topic: "${topic}" (Standard ${standard}, Subject: ${subject}, Chapter: ${chapter})

Return ONLY this JSON object:
{
  "explanation": "2-3 clear paragraphs explaining ${topic} for deaf students with visual descriptions.",
  "imagePrompt": "Educational diagram of ${topic} with labeled parts.",
  "detailedIllustrationSVG": "<svg xmlns=...>COMPLETE REAL DRAWN DIAGRAM for ${topic} with colors, labels, arrows</svg>",
  "animationCode": "<div style='padding:20px;background:#1a1a2e;color:white;border-radius:12px;font-family:sans-serif'><h2 style='color:#4fc3f7'>${topic}</h2><p>Key concept animation here</p></div>",
  "signLanguageSVG": "<svg xmlns=...>COMPLETE REAL HAND GESTURE DRAWING with label for ${topic}</svg>",
  "visualTranscript": "Step 1: [what student sees first]\nStep 2: [next visual element]\nStep 3: [key concept shown visually]"
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
