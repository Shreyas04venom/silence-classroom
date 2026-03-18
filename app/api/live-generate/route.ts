import { NextRequest } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

// Initialize with API key rotation
const allKeys = (process.env.GEMINI_API_KEY || "").split(",").map((k) => k.trim()).filter((k) => k.length > 0)

// Filter out invalid keys (must be 39 characters for Gemini API keys)
const keys = allKeys.filter((k) => k.length === 39)

if (allKeys.length !== keys.length) {
    console.warn(`⚠️ Filtered out ${allKeys.length - keys.length} invalid API keys (wrong length)`)
}

if (keys.length === 0) {
    console.warn("❌ No valid GEMINI_API_KEY configured")
} else {
    console.log(`🔑 Loaded ${keys.length} valid API keys for rotation`)
}

// Track which key we're currently using (global state for rotation)
let currentKeyIndex = 0

// Fast model selection with fallback AND key rotation
async function getModel() {
    if (keys.length === 0) {
        throw new Error("No API key configured")
    }

    const modelsToTry = [
        "gemini-2.0-flash",        // Fast and available (PRIMARY)
        "gemini-2.5-flash",        // Latest flash
        "gemini-2.5-pro",          // Pro version (fallback)
    ]

    let lastError: any = null
    let keysTriedCount = 0

    // Try each key in rotation
    while (keysTriedCount < keys.length) {
        const apiKey = keys[currentKeyIndex]
        console.log(`🔄 Trying API key #${currentKeyIndex + 1}/${keys.length}`)

        const genAI = new GoogleGenerativeAI(apiKey)

        // Try each model with this key
        for (const modelName of modelsToTry) {
            try {
                const model = genAI.getGenerativeModel({
                    model: modelName,
                    generationConfig: {
                        temperature: 0.7,
                        topP: 0.8,
                        topK: 40,
                    }
                })

                console.log(`✅ Using model: ${modelName} with key #${currentKeyIndex + 1}`)
                return model
            } catch (e: any) {
                // If it's a quota error, try next key
                if (e.message?.includes("429") || e.message?.includes("quota")) {
                    console.warn(`⚠️ Quota exceeded for key #${currentKeyIndex + 1}, model ${modelName}`)
                    lastError = e
                    break // Break model loop, try next key
                }
                // If model not found, try next model with same key
                console.warn(`❌ Model ${modelName} not available with key #${currentKeyIndex + 1}`)
                continue
            }
        }

        // Move to next key
        currentKeyIndex = (currentKeyIndex + 1) % keys.length
        keysTriedCount++
    }

    // If all keys failed, throw with helpful message
    if (lastError?.message?.includes("429") || lastError?.message?.includes("quota")) {
        throw new Error("ALL_KEYS_QUOTA_EXCEEDED")
    }

    throw lastError || new Error("No models available with any key")
}

export async function POST(req: NextRequest) {
    const encoder = new TextEncoder()

    const stream = new ReadableStream({
        async start(controller) {
            try {
                const { text, contentType } = await req.json()

                if (!text || text.trim().length === 0) {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: "Empty content" })}\n\n`))
                    controller.close()
                    return
                }

                let model
                try {
                    model = await getModel()
                } catch (e: any) {
                    if (e.message === "ALL_KEYS_QUOTA_EXCEEDED") {
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                            error: "All API keys exhausted. Please wait 1 minute for quota reset."
                        })}\n\n`))
                    } else {
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                            error: "No AI models available: " + e.message
                        })}\n\n`))
                    }
                    controller.close()
                    return
                }

                // Generate based on content type with timeout
                const timeout = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error("Generation timeout")), 30000) // Increased to 30 seconds
                )

                const generation = (async () => {
                    if (contentType === "explanation") {
                        await generateExplanation(model, text, controller, encoder)
                    } else if (contentType === "translation") {
                        await generateTranslation(model, text, controller, encoder)
                    } else if (contentType === "image") {
                        await generateImagePrompt(model, text, controller, encoder)
                    } else if (contentType === "animation") {
                        await generateAnimation(model, text, controller, encoder)
                    } else if (contentType === "accessibility") {
                        await generateAccessibility(model, text, controller, encoder)
                    }
                })()

                await Promise.race([generation, timeout])
                controller.close()
            } catch (error: any) {
                console.error("Live generation error:", error.message)

                // Handle quota errors with friendly message
                if (error.message?.includes("429") || error.message?.includes("quota")) {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                        error: "API quota limit reached. Please wait 1-2 minutes before trying again."
                    })}\n\n`))
                } else {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                        error: error.message || "Generation failed"
                    })}\n\n`))
                }
                controller.close()
            }
        },
    })

    return new Response(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    })
}

// Helper function to check if an error is retryable (quota or invalid key)
function isRetryableError(error: any): boolean {
    if (!error) return false

    // Convert entire error object to string
    const errorStr = JSON.stringify(error).toLowerCase()
    const messageStr = (error.message || '').toLowerCase()
    const errorCode = error.status || error.code || 0

    // Check for quota errors
    const isQuota = (
        errorCode === 429 ||
        errorCode === '429' ||
        messageStr.includes('429') ||
        messageStr.includes('quota') ||
        messageStr.includes('rate limit') ||
        errorStr.includes('429') ||
        errorStr.includes('quota') ||
        errorStr.includes('rate limit')
    )

    // Check for invalid API key errors (should skip to next key)
    const isInvalidKey = (
        errorCode === 400 ||
        messageStr.includes('api key not valid') ||
        messageStr.includes('api_key_invalid') ||
        errorStr.includes('api key not valid') ||
        errorStr.includes('api_key_invalid')
    )

    if (isQuota) {
        console.log(`🔴 QUOTA ERROR - rotating to next key`)
    }
    if (isInvalidKey) {
        console.log(`🔴 INVALID KEY ERROR - rotating to next key`)
    }

    return isQuota || isInvalidKey
}

// Helper function to retry generation with automatic key rotation  
async function retryWithKeyRotation(
    generateFn: (model: any) => Promise<any>,
    maxRetries: number = keys.length
): Promise<any> {
    let lastError: any = null

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            const model = await getModel() // Gets next available key
            return await generateFn(model)
        } catch (error: any) {
            console.warn(`⚠️ Attempt ${attempt + 1}/${maxRetries} failed`)
            lastError = error

            // If it's a quota or invalid key error, try next key
            if (isRetryableError(error)) {
                console.log(`🔄 Retryable error! Forcing key rotation (attempt ${attempt + 1}/${maxRetries})...`)
                // FORCE move to next key
                currentKeyIndex = (currentKeyIndex + 1) % keys.length
                await new Promise(resolve => setTimeout(resolve, 300)) // Small delay
                continue // Try next iteration with next key
            }

            // For other errors, throw immediately
            console.error(`❌ Non-quota error, not retrying:`, error.message?.substring(0, 100))
            throw error
        }
    }

    // All retries failed
    console.error(`❌ All ${maxRetries} retry attempts exhausted`)
    throw lastError
}

async function generateExplanation(model: any, text: string, controller: any, encoder: TextEncoder) {
    const prompt = `You are an expert educator creating VISUAL explanations for deaf/hard of hearing students.

Based on this educational concept: "${text}"

Provide an exceptionally clear, detailed breakdown with:
- ✅ Scientific accuracy and proper terminology  
- 📊 Numbered step-by-step visual breakdown (1, 2, 3...)
- 👁️ Vivid visual descriptions (colors, shapes, movements, sizes, positions)
- 🌍 Real-world applications and relatable examples
- 🔄 Cause-and-effect relationships shown clearly
- ⏱️ Timing/sequence information if applicable
- 📐 Spatial relationships and positioning
- 💡 Key concepts highlighted with easy-to-visualize metaphors

STRUCTURE:
**Title:** Clear, descriptive concept name
**Overview:** One sentence what students will learn
**Step-by-step:** Each major stage numbered with vivid visual descriptions that could be drawn/animated
**Key Points:** 3-5 essential takeaways in bullets
**Real Example:** How this applies in real life

Requirements:
- Use CLEAR, SIMPLE language (8th grade reading level)
- NO sound references - 100% VISUAL communication
- Make it ENGAGING and MEMORABLE
- Each section should be drawable/animatable
- Include visual intensity indicators (what's bright? what's moving? what's central?)

Target length: 3-4 paragraphs of high-quality visual explanation.`

    // Use retry wrapper with automatic key rotation
    await retryWithKeyRotation(async (model) => {
        const result = await model.generateContent(prompt)
        const response = result.response.text()

        controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "explanation", content: response })}\n\n`)
        )
    })
}

async function generateTranslation(model: any, text: string, controller: any, encoder: TextEncoder) {
    // Only generate key languages (Hindi and Spanish) for speed
    // Users can request more languages if needed
    const languages = ["hi", "es"]
    const languageNames: Record<string, string> = {
        hi: "Hindi",
        es: "Spanish",
    }

    for (const lang of languages) {
        const prompt = `Translate the following educational text to ${languageNames[lang]}. Maintain scientific/academic terminology:

"${text}"

Respond with ONLY the translation, no explanations.`

        await retryWithKeyRotation(async (model) => {
            const result = await model.generateContent(prompt)
            const translation = result.response.text().trim()

            controller.enqueue(
                encoder.encode(
                    `data: ${JSON.stringify({ type: "translation", language: lang, content: translation })}\n\n`
                )
            )
        })
    }
}

async function generateImagePrompt(model: any, text: string, controller: any, encoder: TextEncoder) {
    const prompt = `Based on this educational concept: "${text}"

Generate a PROFESSIONAL, REALISTIC-STYLE educational diagram for DEAF STUDENTS using modern design. Style like TED-Ed, National Geographic, or professional educational platforms.

=== CRITICAL VISUAL REQUIREMENTS ===

✅ **PROFESSIONAL MODERN STYLE** (NOT childish):
   - Semi-realistic but still illustrated (blend of realism + infographic)
   - Contemporary color palette (modern, sophisticated)
   - Professional typography with clear hierarchy
   - Similar to: National Geographic, TED-Ed, Khan Academy Pro, BBC Learning
   - High production value appearance
   - Clean, modern aesthetic

✅ **FOR DEAF STUDENTS - COMPLETE VISUAL COMMUNICATION**:
   - ZERO text labels relying on symbols alone - all labeled in clear text
   - Sign language hand positions shown beautifully as illustrations
   - Color coding and visual differentiation for different concepts
   - Animated arrows, flow indicators, and directional cues
   - Spatial relationships shown clearly

✅ **NUMBERED PROCESS FLOW** (If applicable):
   - Professional numbered circles (①②③) connected by smooth arrows
   - Each step with: visual element + clear label + description
   - Hierarchical information from most important to supporting
   - Color progression showing cause-and-effect

✅ **VISUAL HIERARCHY**:
   - Bold, prominent title (professional capitalization)
   - Large, clear main visual elements
   - Supporting details in appropriate scale
   - Dark text on light or high-contrast backgrounds
   - Professional spacing and composition

✅ **PROFESSIONAL DESIGN ELEMENTS**:
   - Modern gradient backgrounds or solid professional colors
   - Subtle shadows for depth perception
   - Professional border or frame design
   - Icons that are sophisticated, not cartoonish
   - Data visualization if numbers are involved

✅ **ACCESIBILITY FEATURES**:
   - High contrast ratios (WCAG AA minimum)
   - Large, readable text (sans-serif fonts)
   - Clear visual separation between concepts
   - Color-blind friendly palette
   - No information conveyed by color alone

=== DELIVERY ==
Provide ONLY the detailed image prompt matching professional educational standards. Make it real, sophisticated, and suitable for formal educational use.`

    await retryWithKeyRotation(async (model) => {
        const result = await model.generateContent(prompt)
        const imagePrompt = result.response.text().trim()

        controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "imagePrompt", content: imagePrompt })}\n\n`)
        )
    })
}

async function generateAnimation(model: any, text: string, controller: any, encoder: TextEncoder) {
    const prompt = `Based on this educational concept: "${text}"

Create a complete, PROFESSIONAL 3D ANIMATED HTML5 Canvas visualization for DEAF STUDENTS.

=== ANIMATION STYLE ===
✨ Modern blend of: realistic + illustrated + educational (like TED-Ed, Kurzgesagt level quality)
✨ Professional design with sophisticated color gradients and effects
✨ Scientific accuracy with engaging visual storytelling

=== CRITICAL REQUIREMENTS ===

1. **PROFESSIONAL 3D RENDERING**:
   - Implement proper 3D perspective using canvas transforms
   - Objects rotate/move smoothly in 3D space with correct depth sorting
   - Use realistic lighting: shadows, highlights, ambient occlusion style effects
   - Smooth gradient fills for depth illusion
   - Parallax layering for multi-depth appearance
   - Blur/opacity transitions for depth fade effects

2. **SMOOTH 60FPS PERFORMANCE**:
   - Use requestAnimationFrame with delta-time calculations
   - Implement easing: easeInQuad, easeOutCubic, easeInOutCirc, elastic, bounce
   - Double-buffering for flicker-free rendering
   - Math.sin/cos for smooth cyclic motions
   - Velocity and acceleration physics for natural movement

3. **PROCESS VISUALIZATION**:
   - Break concept into 5-8 clear stages (numbered 1, 2, 3...)
   - Each stage: smooth transition, visual transformation, clear purpose
   - Timeline: each stage 3-5 seconds, then loop
   - Use color shifts to show state changes
   - Particle effects for emphasis (not excessive)
   - Glow/blur effects for important elements

4. **100% VISUAL COMMUNICATION** (NO AUDIO):
   - Live counter/progress indicator (Stage X of Y)
   - Text labels appearing at exactly when needed
   - Animation tells the COMPLETE story visually
   - Use size/color/position to emphasize importance
   - Visual flow arrows or connections between stages
   - Pulsing or highlighting to direct attention

5. **PROFESSIONAL UI OVERLAY**:
   - Bottom control panel: Stage name, progress bar, current time
   - Top: Descriptive title in large, bold text
   - Semi-transparent dark background for text readability
   - Play/Pause controls (simple, modern design)
   - Optional: speed adjustment (0.5x, 1x, 1.5x, 2x)

6. **TECHNICAL STRUCTURE**:
   - Single HTML file with embedded CSS and JavaScript
   - Canvas element: 1200x700 (or appropriate aspect ratio)
   - Pure Canvas 2D API (no libraries)
   - Clean object-oriented code with Stage/Particle/Animation classes
   - Error handling for timer/animation edge cases

7. **PROFESSIONAL ELEMENTS FOR EACH STAGE**:
   - Stage title fades in
   - Main visual object animates (rotate, move, scale, morph)
   - Supporting elements (arrows, labels, particles) appear
   - Stage completes with smooth transition to next
   - Clear visual difference between stages

8. **VISUAL EFFECTS TOOLKIT**:
   - Gradient fills for smooth color transitions
   - Shadow effects: ctx.shadowBlur, ctx.shadowOffset
   - Glow effects: drawing same shape multiple times with increasing blur
   - Particle systems: small objects following path with fade
   - Rotation with proper anchor points
   - Wave distortion using Math.sin
   - Smooth morphing between shapes

9. **EXAMPLE CODE STRUCTURE** (Pseudo-code):
   - Class Stage { constructor, update(), draw(), complete() }
   - Class Particle { x, y, vx, vy, life, draw() }
   - Main loop: clear canvas, update all stages, draw all objects, advance time
   - Easing function: function easeInOutCubic(t) { return t < 0.5 ? 4*t*t*t : 1-Math.pow(-2*t+2,3)/2 }

=== QUALITY STANDARDS ===
✅ Professional animation quality (production-ready)
✅ Smooth, fluid motion (no stuttering or jumping)
✅ Scientifically accurate visualization
✅ Fully accessible to deaf students (100% visual, no audio)
✅ Beautiful, modern aesthetic
✅ Self-contained, working HTML file
✅ Looping perfectly with no glitches on loop boundary

Provide ONLY the complete HTML file. It should be ready to open in any browser and play immediately.`


    await retryWithKeyRotation(async (model) => {
        const result = await model.generateContent(prompt)
        let animationCode = result.response.text().trim()

        // Remove markdown code blocks with proper backtick escaping
        animationCode = animationCode.replace(/\`\`\`(html|javascript|js)?\n?/gi, "").replace(/\`\`\`\n?/g, "")

        // Validate output contains HTML/Canvas
        if (!animationCode.includes("<canvas") && !animationCode.includes("<html")) {
            console.warn("⚠️ Animation response might be missing HTML structure, wrapping...")
            animationCode = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Animation</title></head><body><canvas id="canvas" style="display:block;margin:20px auto;border:2px solid #333;"></canvas><script>${animationCode}</script></body></html>`
        }

        controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "animation", content: animationCode })}\n\n`)
        )
    })
}

async function generateAccessibility(model: any, text: string, controller: any, encoder: TextEncoder) {
    // Generate visual transcript with better requirements
    const transcriptPrompt = `Create a VISUAL TRANSCRIPT with precise timestamps for this educational content:

"${text}"

=== FORMAT REQUIREMENTS ===
Time - Visual Description (describe what to SHOW and DO, not what to SAY)

Example:
0:00 - Title appears: "PHOTOSYNTHESIS PROCESS"  
0:02 - Green plant illustration shown with bright sun rays
0:04 - Arrow animation shows energy flow direction
0:08 - Color transformation shows glucose being created
0:12 - Oxygen particles release (animation)

REQUIREMENTS:
- Describe only VISUAL elements (animations, colors, text appearing, transformations)
- Include timing for every 2-4 seconds
- Keep descriptions SHORT and actionable (what an animator would see)
- NO audio descriptions
- Focus on: movements, color changes, new elements appearing, visual emphasis

Provide the transcript in this format only. Each line: TIME - VISUAL DESCRIPTION`

    await retryWithKeyRotation(async (model) => {
        const transcriptResult = await model.generateContent(transcriptPrompt)
        const visualTranscript = transcriptResult.response.text().trim()

        controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "visualTranscript", content: visualTranscript })}\n\n`)
        )
    })

    // Generate sign language description with robust JSON parsing
    const signPrompt = `For this educational concept: "${text}"

Identify the KEY SIGNS needed in American Sign Language (ASL) to communicate this.

=== RESPONSE FORMAT (MUST BE VALID JSON) ===
Return ONLY a valid JSON array with NO other text:

[
  {"time": 0, "sign": "PHOTOSYNTHESIS", "hand_position": "both hands open palms facing each other", "movement": "hands move together then apart upward showing growth"},
  {"time": 3, "sign": "PLANT", "hand_position": "closed fist with palm up", "movement": "fingers open and spread upward like growing plant"},
  {"time": 6, "sign": "SUN", "hand_position": "both hands forming O shape", "movement": "circle motion around head"}
]

=== SIGN REQUIREMENTS ===
✅ Use REAL American Sign Language (ASL) signs only
✅ 6-10 key signs covering the main concept
✅ Each entry: time (seconds), sign name (capitals), hand_position (describe), movement (describe action)
✅ Times: allow 2-3 seconds per sign minimum
✅ Movements: clear, actionable descriptions for signing
✅ Signs flow logically through the concept

Return ONLY the JSON array. No markdown, no explanation, no extra text.`

    await retryWithKeyRotation(async (model) => {
        try {
            const signResult = await model.generateContent(signPrompt)
            let signData = signResult.response.text().trim()

            // Try to extract JSON - handle various markdown formats
            let jsonContent = signData
            
            // Remove markdown code blocks if present
            jsonContent = jsonContent.replace(/^\`\`\`json\s*\n?/i, "").replace(/^\`\`\`\s*\n?/, "").replace(/\n?\`\`\`\s*$/g, "")
            
            // Extract JSON array
            const jsonMatch = jsonContent.match(/\[\s*\{[\s\S]*?\}\s*\]/m)
            if (jsonMatch) {
                jsonContent = jsonMatch[0]
            }

            // Validate and parse JSON
            const parsed = JSON.parse(jsonContent)
            if (!Array.isArray(parsed)) {
                throw new Error("Response is not a JSON array")
            }

            controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type: "signLanguage", content: JSON.stringify(parsed) })}\n\n`)
            )
        } catch (error: any) {
            console.warn("⚠️ Sign language parsing error:", error.message)
            // Send fallback error response
            const fallback = [{ time: 0, sign: "Unable to parse sign data", hand_position: "N/A", movement: "Please try again" }]
            controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type: "signLanguage", content: JSON.stringify(fallback), error: error.message })}\n\n`)
            )
        }
    })
}
