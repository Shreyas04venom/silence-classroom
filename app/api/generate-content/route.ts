import { type NextRequest, NextResponse } from "next/server"
import { generateEducationalContent } from "@/lib/google-ai-services"

export const maxDuration = 60;

// Map of topic keywords to pre-generated educational PNG images
const PRE_GENERATED_IMAGES: Record<string, string> = {
  // std-7 science: human-body
  "digestive": "/content/std-7/science/human-body/digestive-system/image-1-digestive-journey.png",
  "digestion": "/content/std-7/science/human-body/digestive-system/image-1-digestive-journey.png",
  "skeletal": "/content/std-7/science/human-body/skeletal-system/image-1-skeletal-system.png",
  "skeleton": "/content/std-7/science/human-body/skeletal-system/image-1-skeletal-system.png",
  "bones": "/content/std-7/science/human-body/skeletal-system/image-1-skeletal-system.png",
  // std-6 science: basic-life-processes
  "nutrition in animals": "/content/std-6/science/basic-life-processes/nutrition-in-animals/image-1-nutrition-in-animals.png",
  "animal nutrition": "/content/std-6/science/basic-life-processes/nutrition-in-animals/image-1-nutrition-in-animals.png",
  "nutrition animals": "/content/std-6/science/basic-life-processes/nutrition-in-animals/image-1-nutrition-in-animals.png",
  "respiration": "/content/std-6/science/basic-life-processes/respiration/image-1-respiration.png",
  "breathing": "/content/std-6/science/basic-life-processes/respiration/image-1-respiration.png",
  // std-6 science: living-organisms
  "structure of animals": "/content/std-6/science/living-organisms/structure-of-animals/image-1-structure-of-animals.png",
  "animal structure": "/content/std-6/science/living-organisms/structure-of-animals/image-1-structure-of-animals.png",
  "structure of plants": "/content/std-6/science/living-organisms/structure-of-plants/image-1-structure-of-plants.png",
  "plant structure": "/content/std-6/science/living-organisms/structure-of-plants/image-1-structure-of-plants.png",
  // std-6 mathematics
  "natural numbers": "/content/std-6/mathematics/numbers/natural-numbers/image-1-natural-numbers.png",
  "natural number": "/content/std-6/mathematics/numbers/natural-numbers/image-1-natural-numbers.png",
  "whole numbers": "/content/std-6/mathematics/numbers/whole-numbers/image-1-whole-numbers.png",
  "whole number": "/content/std-6/mathematics/numbers/whole-numbers/image-1-whole-numbers.png",
  // std-7 mathematics
  "equations": "/content/std-7/mathematics/algebra/equations/image-1-equations.png",
  "equation": "/content/std-7/mathematics/algebra/equations/image-1-equations.png",
  "variables": "/content/std-7/mathematics/algebra/variables/image-1-variables.png",
  "variable": "/content/std-7/mathematics/algebra/variables/image-1-variables.png",
  "algebra": "/content/std-7/mathematics/algebra/equations/image-1-equations.png",
  // std-7 science: life-processes
  "photosynthesis": "/content/std-7/science/life-processes/photosynthesis/image-1-photosynthesis.png",
  // std-6 science: nutrition-in-plants (has existing images)
  "nutrition in plants": "/content/std-6/science/basic-life-processes/nutrition-in-plants/image-1-photosynthesis-process.png",
  "plant nutrition": "/content/std-6/science/basic-life-processes/nutrition-in-plants/image-1-photosynthesis-process.png",
  // std-8 mathematics
  "triangles": "/content/std-8/mathematics/geometry/triangles/image-1-triangles.png",
  "triangle": "/content/std-8/mathematics/geometry/triangles/image-1-triangles.png",
  "geometry": "/content/std-8/mathematics/geometry/triangles/image-1-triangles.png",
  // std-8 science: ecology
  "food chain": "/content/std-8/science/ecology/food-chain/image-1-food-chain.png",
  "food web": "/content/std-8/science/ecology/food-chain/image-1-food-chain.png",
  "ecology": "/content/std-8/science/ecology/food-chain/image-1-food-chain.png",
  // std-8 science: life-processes-in-living-organisms
  "circulatory": "/content/std-8/science/life-processes-in-living-organisms/circulatory-system/image-1-circulatory-system.png",
  "blood circulation": "/content/std-8/science/life-processes-in-living-organisms/circulatory-system/image-1-circulatory-system.png",
  "heart": "/content/std-8/science/life-processes-in-living-organisms/circulatory-system/image-1-circulatory-system.png",
}

// Map of topic keywords to pre-generated HTML animation files
const PRE_GENERATED_ANIMATIONS: Record<string, string> = {
  // std-8 science: life-processes-in-living-organisms
  "nervous system":          "/content/std-8/science/life-processes-in-living-organisms/nervous-system/animation-nervous-system.html",
  "nervous":                 "/content/std-8/science/life-processes-in-living-organisms/nervous-system/animation-nervous-system.html",
  "circulatory system":      "/content/std-8/science/life-processes-in-living-organisms/circulatory-system/animation-circulation.html",
  "blood circulation":       "/content/std-8/science/life-processes-in-living-organisms/circulatory-system/animation-circulation.html",
  "heart":                   "/content/std-8/science/life-processes-in-living-organisms/circulatory-system/animation-circulation.html",
  "human digestive system":  "/content/std-8/science/life-processes-in-living-organisms/human-digestive-system/animation-human-digestive-system.html",
  // std-8 science: ecology
  "food chain":              "/content/std-8/science/ecology/food-chain/animation-food-chain.html",
  "food web":                "/content/std-8/science/ecology/food-chain/animation-food-chain.html",
  "ecosystems":              "/content/std-8/science/ecology/ecosystems/animation-ecosystems.html",
  "ecosystem":               "/content/std-8/science/ecology/ecosystems/animation-ecosystems.html",
  // std-8 mathematics
  "triangles":               "/content/std-8/mathematics/geometry/triangles/animation-triangle-types.html",
  "triangle":                "/content/std-8/mathematics/geometry/triangles/animation-triangle-types.html",
  "quadrilaterals":          "/content/std-8/mathematics/geometry/quadrilaterals/animation-quadrilaterals.html",
  "quadrilateral":           "/content/std-8/mathematics/geometry/quadrilaterals/animation-quadrilaterals.html",
  // std-7 science: life-processes
  "photosynthesis":          "/content/std-7/science/life-processes/photosynthesis/animation-photosynthesis.html",
  "reproduction in plants":  "/content/std-7/science/life-processes/reproduction-plants/animation-reproduction-plants.html",
  "reproduction in animals": "/content/std-7/science/life-processes/reproduction-animals/animation-reproduction-animals.html",
  // std-7 science: human-body
  "digestive system":        "/content/std-7/science/human-body/digestive-system/animation-digestive-journey.html",
  "skeletal system":         "/content/std-7/science/human-body/skeletal-system/animation-skeleton.html",
  "skeleton":                "/content/std-7/science/human-body/skeletal-system/animation-skeleton.html",
  "skeletal":                "/content/std-7/science/human-body/skeletal-system/animation-skeleton.html",
  // std-7 mathematics
  "variables":               "/content/std-7/mathematics/algebra/variables/animation-variables.html",
  "variable":                "/content/std-7/mathematics/algebra/variables/animation-variables.html",
  "equations":               "/content/std-7/mathematics/algebra/equations/animation-equations-balance.html",
  "equation":                "/content/std-7/mathematics/algebra/equations/animation-equations-balance.html",
  // std-6 science: basic-life-processes
  "nutrition in plants":     "/content/std-6/science/basic-life-processes/nutrition-in-plants/animation-photosynthesis.html",
  "plant nutrition":         "/content/std-6/science/basic-life-processes/nutrition-in-plants/animation-photosynthesis.html",
  "nutrition in animals":    "/content/std-6/science/basic-life-processes/nutrition-in-animals/animation-nutrition-in-animals.html",
  "animal nutrition":        "/content/std-6/science/basic-life-processes/nutrition-in-animals/animation-nutrition-in-animals.html",
  "respiration":             "/content/std-6/science/basic-life-processes/respiration/animation-breathing-cycle.html",
  "breathing":               "/content/std-6/science/basic-life-processes/respiration/animation-breathing-cycle.html",
  // std-6 science: living-organisms
  "structure of animals":    "/content/std-6/science/living-organisms/structure-of-animals/animation-animal-cell.html",
  "animal structure":        "/content/std-6/science/living-organisms/structure-of-animals/animation-animal-cell.html",
  "structure of plants":     "/content/std-6/science/living-organisms/structure-of-plants/animation-plant-anatomy.html",
  "plant structure":         "/content/std-6/science/living-organisms/structure-of-plants/animation-plant-anatomy.html",
  // std-6 mathematics
  "natural numbers":         "/content/std-6/mathematics/numbers/natural-numbers/animation-number-line.html",
  "natural number":          "/content/std-6/mathematics/numbers/natural-numbers/animation-number-line.html",
  "whole numbers":           "/content/std-6/mathematics/numbers/whole-numbers/animation-whole-numbers.html",
  "whole number":            "/content/std-6/mathematics/numbers/whole-numbers/animation-whole-numbers.html",
}

function getPreGeneratedAnimationUrl(topic: string, chapter?: string, subject?: string): string | null {
  const normalized = (topic + " " + (chapter || "") + " " + (subject || "")).toLowerCase()

  // Check multi-word keys first (more specific)
  const multiWordKeys = Object.keys(PRE_GENERATED_ANIMATIONS).filter(k => k.includes(" ")).sort((a, b) => b.length - a.length)
  for (const key of multiWordKeys) {
    if (normalized.includes(key)) return PRE_GENERATED_ANIMATIONS[key]
  }

  // Then single word keys
  const singleWordKeys = Object.keys(PRE_GENERATED_ANIMATIONS).filter(k => !k.includes(" "))
  for (const key of singleWordKeys) {
    if (normalized.includes(key)) return PRE_GENERATED_ANIMATIONS[key]
  }

  return null
}

function getPreGeneratedImageUrl(topic: string, chapter?: string, subject?: string): string | null {
  const normalized = (topic + " " + (chapter || "") + " " + (subject || "")).toLowerCase()
  
  // Check multi-word keys first (more specific)
  const multiWordKeys = Object.keys(PRE_GENERATED_IMAGES).filter(k => k.includes(" ")).sort((a, b) => b.length - a.length)
  for (const key of multiWordKeys) {
    if (normalized.includes(key)) return PRE_GENERATED_IMAGES[key]
  }
  
  // Then single word keys
  const singleWordKeys = Object.keys(PRE_GENERATED_IMAGES).filter(k => !k.includes(" "))
  for (const key of singleWordKeys) {
    if (normalized.includes(key)) return PRE_GENERATED_IMAGES[key]
  }
  
  return null
}

export async function POST(request: NextRequest) {
  try {
    const { topic, chapter, standard, subject } = await request.json()

    if (!topic) {
      return NextResponse.json({ error: "Topic is required" }, { status: 400 })
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "Gemini API key not configured" }, { status: 500 })
    }

    console.log("[Generate Content] Starting - Topic:", topic)

    const content = await generateEducationalContent(topic, chapter, standard, subject)

    console.log("[Generate Content] Success - Generated content")

    // Try to use a pre-generated high-quality PNG image first
    const preGeneratedImageUrl = getPreGeneratedImageUrl(topic, chapter, subject)
    const imageUrl = preGeneratedImageUrl
      ? preGeneratedImageUrl
      : `/api/generate-image?prompt=${encodeURIComponent(content.imagePrompt)}&topic=${encodeURIComponent(topic)}`

    console.log("[Generate Content] Image URL:", imageUrl, preGeneratedImageUrl ? "(pre-generated)" : "(dynamic)")

    // Try to use a pre-generated HTML animation file
    const preGeneratedAnimationUrl = getPreGeneratedAnimationUrl(topic, chapter, subject)
    console.log("[Generate Content] Animation URL:", preGeneratedAnimationUrl || "(using AI-inline fallback)")

    return NextResponse.json({
      explanation: content.explanation,
      imageUrl,
      // When we have a pre-generated high-quality PNG, don't show the AI SVG illustration
      // The demo-learn page prefers SVG when available, so we null it out to show our PNG instead
      detailedIllustrationSVG: preGeneratedImageUrl ? null : content.detailedIllustrationSVG,
      // When we have a pre-built HTML animation, use its URL; otherwise fall back to AI-inline code
      animationUrl: preGeneratedAnimationUrl || null,
      animationCode: preGeneratedAnimationUrl ? null : content.animationCode,
      signLanguageSVG: content.signLanguageSVG,
      visualTranscript: content.visualTranscript,
      imagePrompt: content.imagePrompt,
    })
  } catch (error) {
    console.error("[Generate Content] Error:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to generate content"
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 },
    )
  }
}

