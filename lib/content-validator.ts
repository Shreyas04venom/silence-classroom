/**
 * Educational Content Validator
 * Validates if speech content is educational using AI
 */

export interface ValidationResult {
    isEducational: boolean
    confidence: number
    reason?: string
    suggestedTopic?: string
}

const EDUCATIONAL_KEYWORDS = [
    // Science
    "photosynthesis", "cell", "atom", "molecule", "energy", "force", "gravity", "ecosystem",
    "biology", "chemistry", "physics", "experiment", "hypothesis", "theory", "organism",
    "digestion", "respiration", "circulation", "nervous system", "plant", "animal",

    // Math
    "equation", "algebra", "geometry", "triangle", "circle", "addition", "subtraction",
    "multiplication", "division", "fraction", "decimal", "percentage", "variable", "graph",

    // General Educational
    "learn", "study", "understand", "explain", "definition", "example", "concept",
    "process", "system", "function", "structure", "diagram", "illustration", "demonstration",

    // Academic Subjects
    "science", "mathematics", "history", "geography", "language", "literature", "art",
]

const NON_EDUCATIONAL_PATTERNS = [
    /\b(movie|film|game|sport|football|cricket|entertainment)\b/i,
    /\b(party|celebration|vacation|holiday|trip)\b/i,
    /\b(shopping|buying|selling|market)\b/i,
    /\b(gossip|rumor|drama)\b/i,
]

export function validateContentLocally(text: string): ValidationResult {
    const lowerText = text.toLowerCase()

    // Check for non-educational patterns
    for (const pattern of NON_EDUCATIONAL_PATTERNS) {
        if (pattern.test(lowerText)) {
            return {
                isEducational: false,
                confidence: 0.8,
                reason: "Content appears to be non-educational (entertainment, personal activities, etc.)",
            }
        }
    }

    // Check for educational keywords
    let keywordCount = 0
    for (const keyword of EDUCATIONAL_KEYWORDS) {
        if (lowerText.includes(keyword)) {
            keywordCount++
        }
    }

    // Calculate confidence based on keyword density
    const words = text.split(/\s+/).length
    const density = keywordCount / Math.max(words, 1)

    if (keywordCount >= 2 || density > 0.1) {
        return {
            isEducational: true,
            confidence: Math.min(0.7 + density, 0.95),
        }
    }

    // Ambiguous content
    if (keywordCount === 1) {
        return {
            isEducational: true,
            confidence: 0.5,
            reason: "Content may be educational but needs more context",
        }
    }

    return {
        isEducational: false,
        confidence: 0.6,
        reason: "Content does not appear to be educational",
    }
}

export async function validateContentWithAI(text: string): Promise<ValidationResult> {
    try {
        const response = await fetch("/api/validate-content", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text }),
        })

        if (!response.ok) {
            // Silently fall back to local validation
            return validateContentLocally(text)
        }

        return await response.json()
    } catch (error) {
        // Don't log errors - just fall back to local validation
        return validateContentLocally(text)
    }
}
