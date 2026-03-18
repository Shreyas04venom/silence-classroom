import { NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")

export async function POST(req: NextRequest) {
    try {
        const { text } = await req.json()

        if (!text || text.trim().length === 0) {
            return NextResponse.json(
                { isEducational: false, confidence: 1, reason: "Empty content" },
                { status: 400 }
            )
        }

        // Check if API key is available
        if (!process.env.GEMINI_API_KEY) {
            // Return as educational if no API key (development mode)
            return NextResponse.json({
                isEducational: true,
                confidence: 0.5,
                reason: "API key not configured - assuming educational",
            })
        }

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })

        const prompt = `Analyze the following text and determine if it is educational content suitable for a classroom setting.

Educational content includes:
- Science topics (biology, chemistry, physics, etc.)
- Mathematics concepts and problems
- Historical events and figures
- Geographical information
- Language and literature
- Academic explanations and demonstrations

Non-educational content includes:
- Personal conversations or gossip
- Entertainment topics (movies, games, sports as casual discussion)
- Shopping or commercial activities
- Non-academic personal activities

Text to analyze: "${text}"

Respond in JSON format:
{
  "isEducational": true/false,
  "confidence": 0.0-1.0,
  "reason": "brief explanation",
  "suggestedTopic": "if educational, suggest the academic topic/subject"
}

Be precise and only mark as educational if the content has clear academic or learning value.`

        const result = await model.generateContent(prompt)
        const response = result.response.text()

        // Extract JSON from response
        const jsonMatch = response.match(/\{[\s\S]*\}/)
        if (!jsonMatch) {
            // Assume educational if parsing fails
            return NextResponse.json({
                isEducational: true,
                confidence: 0.5,
                reason: "Could not parse AI response - assuming educational",
            })
        }

        const validation = JSON.parse(jsonMatch[0])

        return NextResponse.json(validation)
    } catch (error: any) {
        // Log error for debugging but don't expose to client
        console.error("Content validation error:", error?.message || error)

        // Return as educational by default when API fails
        return NextResponse.json({
            isEducational: true,
            confidence: 0.5,
            reason: "Validation service unavailable - assuming educational",
        })
    }
}
