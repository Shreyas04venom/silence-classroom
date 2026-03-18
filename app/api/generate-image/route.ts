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

    console.log("[Image Generation] Starting - Topic:", topic)

    // Use Imagen 4.0 API for real image generation
    const enhancedPrompt = `Generate a high-quality, photorealistic educational image for a classroom setting about: ${topic}. 
    The image should be clear, professional, and suitable for teaching deaf students. 
    ${prompt}`

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    
    // Try Imagen 4.0 for image generation
    try {
      const model = genAI.getGenerativeModel({ model: "imagen-4.0-generate-001" })
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: enhancedPrompt }] }],
      })

      const imageData = result.response.candidates?.[0]?.content?.parts?.[0]
      if (!imageData || !("inlineData" in imageData)) {
        throw new Error("No image data in response")
      }

      const base64Image = imageData.inlineData.data
      const imageBuffer = Buffer.from(base64Image, "base64")

      console.log("[Image Generation] ✓ Success - Generated real image for:", topic)
      
      return new NextResponse(imageBuffer, {
        headers: {
          "Content-Type": "image/jpeg",
          "Cache-Control": "public, max-age=86400",
        },
      })
    } catch (imagenError: any) {
      console.warn("[Image Generation] Imagen API failed:", imagenError.message)
      
      // Fallback to Gemini Vision with SVG generation
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })
      const svgPrompt = `Create an SVG educational diagram for: ${topic}. 
      Return ONLY valid SVG code starting with <svg> and ending with </svg>.
      Make it colorful, educational, and suitable for deaf students learning.
      Include labels and visual explanations.`
      
      const svgResult = await model.generateContent(svgPrompt)
      const svgText = svgResult.response.text()
      
      // Extract SVG from response (might be wrapped in markdown)
      const svgMatch = svgText.match(/<svg[\s\S]*?<\/svg>/)
      const svg = svgMatch ? svgMatch[0] : svgText

      return new NextResponse(svg, {
        headers: {
          "Content-Type": "image/svg+xml",
          "Cache-Control": "public, max-age=86400",
        },
      })
    }
  } catch (error) {
    console.error("[Image Generation] Error:", error)
    return NextResponse.json({ error: "Failed to generate image" }, { status: 500 })
  }
}

function generateAdvancedEducationalSVG(topic: string, prompt: string): string {
  const normalizedTopic = topic.toLowerCase()

  // Route to specialized diagram generators
  if (normalizedTopic.includes("digestive") || normalizedTopic.includes("digestion")) {
    return generateDigestiveSystemDiagram()
  } else if (normalizedTopic.includes("photosynthesis") || normalizedTopic.includes("plant")) {
    return generatePhotosynthesisDiagram()
  } else if (normalizedTopic.includes("cell") || normalizedTopic.includes("biology")) {
    return generateCellDiagram()
  } else if (normalizedTopic.includes("water") || normalizedTopic.includes("cycle")) {
    return generateWaterCycleDiagram()
  } else if (normalizedTopic.includes("nervous") || normalizedTopic.includes("brain")) {
    return generateNervousSystemDiagram()
  } else if (normalizedTopic.includes("heart") || normalizedTopic.includes("circulatory")) {
    return generateCirculatorySystemDiagram()
  } else if (normalizedTopic.includes("respiration") || normalizedTopic.includes("lung")) {
    return generateRespiratorySystemDiagram()
  } else {
    // Generic advanced diagram
    return generateGenericAdvancedDiagram(topic, prompt)
  }
}

function generateDigestiveSystemDiagram(): string {
  return `
    <svg width="1000" height="800" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 800">
      <defs>
        <linearGradient id="skinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#f4c5a0;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#e8b896;stop-opacity:1" />
        </linearGradient>
        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="2" dy="2" stdDeviation="3" flood-opacity="0.3"/>
        </filter>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      <!-- Background -->
      <rect width="1000" height="800" fill="#f8f9fa"/>

      <!-- Title -->
      <rect x="0" y="0" width="1000" height="70" fill="#2c3e50"/>
      <text x="500" y="45" font-size="42" font-weight="bold" text-anchor="middle" fill="white" font-family="Arial, sans-serif">
        DIGESTIVE SYSTEM JOURNEY
      </text>
      <text x="500" y="65" font-size="14" text-anchor="middle" fill="#ecf0f1" font-family="Arial, sans-serif">
        FOR DEAF STUDENTS • Understanding How We Process Food
      </text>

      <!-- Main body outline -->
      <path d="M 300 150 Q 320 200 320 300 L 320 550 Q 320 600 300 650 L 300 680 L 400 680 L 400 650 Q 380 600 380 550 L 380 300 Q 380 200 400 150 Z" 
            fill="url(#skinGrad)" stroke="#d4a574" stroke-width="2" filter="url(#shadow)"/>

      <!-- 1) MOUTH -->
      <circle cx="350" cy="160" r="45" fill="#f08080" stroke="#c85555" stroke-width="2"/>
      <path d="M 330 160 Q 350 180 370 160" fill="none" stroke="#8b4545" stroke-width="2" stroke-linecap="round"/>
      <text x="350" y="130" font-size="18" font-weight="bold" text-anchor="middle" fill="#2c3e50" font-family="Arial, sans-serif">① MOUTH</text>
      <text x="350" y="148" font-size="12" text-anchor="middle" fill="#555" font-family="Arial, sans-serif">(CHEWING)</text>
      <text x="280" y="165" font-size="24" filter="url(#glow)">✌️</text>
      <text x="420" y="165" font-size="32">🍔</text>

      <!-- Arrow 1 -->
      <path d="M 350 210 Q 350 240 350 280" stroke="#3498db" stroke-width="3" fill="none" marker-end="url(#arrowblue)"/>

      <!-- 2) ESOPHAGUS -->
      <path d="M 340 290 Q 345 350 330 410" stroke="#d4a574" stroke-width="25" fill="none" stroke-linecap="round"/>
      <text x="380" y="310" font-size="16" font-weight="bold" fill="#2c3e50" font-family="Arial, sans-serif">② ESOPHAGUS</text>
      <text x="380" y="328" font-size="11" fill="#555" font-family="Arial, sans-serif">(FOOD PIPE)</text>
      <text x="410" y="350" font-size="22" filter="url(#glow)">👆</text>

      <!-- Arrow 2 -->
      <path d="M 330 420 Q 340 460 370 500" stroke="#3498db" stroke-width="3" fill="none" marker-end="url(#arrowblue)"/>

      <!-- 3) STOMACH -->
      <ellipse cx="350" cy="520" rx="55" ry="65" fill="#c988c9" stroke="#9d5fa0" stroke-width="2" filter="url(#shadow)"/>
      <path d="M 330 490 Q 350 510 370 495 M 330 520 Q 350 540 370 525 M 330 550 Q 350 560 370 555" 
            stroke="#f4a460" stroke-width="1.5" opacity="0.7" fill="none"/>
      <text x="450" y="490" font-size="16" font-weight="bold" fill="#2c3e50" font-family="Arial, sans-serif">③ STOMACH</text>
      <text x="450" y="508" font-size="11" fill="#555" font-family="Arial, sans-serif">(ACID BREAKING FOOD)</text>
      <text x="470" y="530" font-size="22" filter="url(#glow)">🤚</text>

      <!-- Arrow 3 -->
      <path d="M 350 590 Q 350 620 350 650" stroke="#3498db" stroke-width="3" fill="none" marker-end="url(#arrowblue)"/>

      <!-- 4) SMALL INTESTINE -->
      <path d="M 330 660 Q 300 680 280 700 Q 270 710 280 720 Q 300 730 330 720 Q 360 700 370 680" 
            stroke="#e89b3c" stroke-width="28" fill="none" stroke-linecap="round"/>
      <text x="280" y="760" font-size="14" font-weight="bold" fill="#2c3e50" font-family="Arial, sans-serif">④ SMALL INTESTINE</text>
      <text x="305" y="778" font-size="10" fill="#555" font-family="Arial, sans-serif">(NUTRIENT ABSORPTION)</text>
      <text x="420" y="710" font-size="22" filter="url(#glow)">🖐️</text>
      <text x="200" y="690" font-size="16">⚡✨</text>

      <!-- 5) LARGE INTESTINE -->
      <path d="M 370 680 Q 390 700 400 720 Q 405 735 390 740 Q 370 745 360 730 Q 350 710 360 690" 
            stroke="#d87093" stroke-width="32" fill="none" stroke-linecap="round"/>
      <text x="430" y="760" font-size="14" font-weight="bold" fill="#2c3e50" font-family="Arial, sans-serif">⑤ LARGE INTESTINE</text>
      <text x="515" y="710" font-size="22" filter="url(#glow)">👋</text>

      <!-- 6) RECTUM -->
      <circle cx="380" cy="740" r="12" fill="#a0522d" stroke="#6b3410" stroke-width="1.5"/>
      <text x="420" y="750" font-size="12" font-weight="bold" fill="#2c3e50" font-family="Arial, sans-serif">⑥ RECTUM</text>
      <text x="450" y="750" font-size="20" filter="url(#glow)">✋</text>

      <!-- 7) WASTE REMOVAL -->
      <text x="250" y="750" font-size="12" font-weight="bold" fill="#2c3e50" font-family="Arial, sans-serif">⑦ WASTE</text>
      <text x="250" y="765" font-size="11" fill="#2c3e50" font-family="Arial, sans-serif">REMOVAL</text>
      <text x="280" y="750" font-size="28">💩</text>

      <!-- Process Flow Timeline -->
      <rect x="50" y="700" width="900" height="60" fill="#ecf0f1" stroke="#bdc3c7" stroke-width="1" rx="8"/>
      <text x="60" y="725" font-size="12" font-weight="bold" fill="#2c3e50" font-family="Arial, sans-serif">COMPLETE DIGESTIVE JOURNEY:</text>
      <text x="60" y="745" font-size="11" fill="#555" font-family="Arial, sans-serif">
        Input (Mouth) → Transport (Esophagus) → Breaking Down (Stomach) → Absorption (Small Intestine) → Water Removal (Large Intestine) → Output (Elimination)
      </text>

      <!-- Arrow marker definition -->
      <defs>
        <marker id="arrowblue" markerWidth="10" markerHeight="10" refX="5" refY="5" orient="auto">
          <path d="M 0 0 L 10 5 L 0 10 Z" fill="#3498db"/>
        </marker>
      </defs>
    </svg>
  `
}

function generatePhotosynthesisDiagram(): string {
  return `
    <svg width="1000" height="800" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 800">
      <defs>
        <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#87ceeb;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#b0e0e6;stop-opacity:1" />
        </linearGradient>
        <filter id="shadow2" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="2" dy="2" stdDeviation="3" flood-opacity="0.3"/>
        </filter>
      </defs>

      <rect width="1000" height="800" fill="url(#skyGrad)"/>

      <!-- Title -->
      <rect x="0" y="0" width="1000" height="70" fill="#1b5e20"/>
      <text x="500" y="45" font-size="42" font-weight="bold" text-anchor="middle" fill="white" font-family="Arial, sans-serif">
        PHOTOSYNTHESIS PROCESS
      </text>
      <text x="500" y="65" font-size="14" text-anchor="middle" fill="#c8e6c9" font-family="Arial, sans-serif">
        HOW PLANTS MAKE FOOD FROM SUNLIGHT
      </text>

      <!-- Sun -->
      <circle cx="900" cy="100" r="50" fill="#ffd700" filter="url(#shadow2)"/>
      <line x1="900" y1="30" x2="900" y2="0" stroke="#ffd700" stroke-width="3"/>
      <line x1="950" y1="50" x2="975" y2="25" stroke="#ffd700" stroke-width="3"/>
      <line x1="970" y1="100" x2="1000" y2="100" stroke="#ffd700" stroke-width="3"/>
      <text x="920" y="75" font-size="28">☀️</text>

      <!-- Arrows from sun -->
      <path d="M 850 150 Q 600 300 450 400" stroke="#ffd700" stroke-width="4" fill="none" stroke-dasharray="10,5" opacity="0.6"/>
      <text x="700" y="280" font-size="12" font-weight="bold" fill="#f57f17">Light Energy</text>

      <!-- Plant -->
      <g filter="url(#shadow2)">
        <!-- Stem -->
        <line x1="400" y1="500" x2="400" y2="700" stroke="#558b2f" stroke-width="8"/>
        
        <!-- Leaves -->
        <ellipse cx="350" cy="350" rx="80" ry="120" fill="#7cb342" stroke="#558b2f" stroke-width="2"/>
        <ellipse cx="450" cy="300" rx="85" ry="100" fill="#8bc34a" stroke="#558b2f" stroke-width="2"/>
        <ellipse cx="380" cy="450" rx="75" ry="110" fill="#9ccc65" stroke="#558b2f" stroke-width="2"/>
        
        <!-- Leaf veins -->
        <path d="M 350 350 Q 350 300 350 250" stroke="#558b2f" stroke-width="1" fill="none" opacity="0.5"/>
        <path d="M 450 300 Q 450 250 450 200" stroke="#558b2f" stroke-width="1" fill="none" opacity="0.5"/>
      </g>

      <!-- Water from roots -->
      <circle cx="400" cy="720" r="8" fill="#4fc3f7"/>
      <path d="M 400 710 Q 390 550 370 400" stroke="#4fc3f7" stroke-width="3" fill="none" stroke-dasharray="8,4"/>
      <text x="300" y="600" font-size="11" font-weight="bold" fill="#0277bd">Water (H₂O)</text>
      <text x="420" y="750" font-size="20">💧</text>

      <!-- CO2 from air -->
      <circle cx="250" cy="250" r="6" fill="#90caf9"/>
      <path d="M 280 280 Q 310 320 350 370" stroke="#90caf9" stroke-width="3" fill="none" stroke-dasharray="8,4"/>
      <text x="200" y="300" font-size="11" font-weight="bold" fill="#0277bd">CO₂ from Air</text>
      <text x="220" y="240" font-size="18">💨</text>

      <!-- Process boxes -->
      <rect x="100" y="550" width="280" height="180" fill="#c8e6c9" stroke="#558b2f" stroke-width="2" rx="8"/>
      <text x="240" y="575" font-size="16" font-weight="bold" text-anchor="middle" fill="#1b5e20">PHOTOSYNTHESIS</text>
      <text x="240" y="595" font-size="12" text-anchor="middle" fill="#2e7d32">Light + Water + CO₂</text>
      <text x="240" y="615" font-size="11" text-anchor="middle" fill="#558b2f">↓</text>
      <text x="240" y="635" font-size="12" text-anchor="middle" fill="#2e7d32" font-weight="bold">GLUCOSE (Food)</text>
      <text x="240" y="655" font-size="12" text-anchor="middle" fill="#2e7d32">+ Oxygen</text>
      <text x="240" y="680" font-size="24" text-anchor="middle">⚡🍃</text>
      <text x="170" y="725" font-size="11" fill="#1b5e20" font-family="Arial, sans-serif">Sign: Hands move up</text>
      <text x="170" y="740" font-size="11" fill="#1b5e20" font-family="Arial, sans-serif">showing growth 🖐️</text>

      <!-- Outputs -->
      <rect x="550" y="550" width="130" height="180" fill="#fff9c4" stroke="#f57f17" stroke-width="2" rx="8"/>
      <text x="615" y="575" font-size="14" font-weight="bold" text-anchor="middle" fill="#f57f17">GLUCOSE</text>
      <text x="615" y="595" font-size="10" text-anchor="middle" fill="#f57f17">(Plant Food)</text>
      <text x="615" y="630" font-size="28" text-anchor="middle">🌟</text>
      <text x="615" y="700" font-size="12" text-anchor="middle" fill="#f57f17">Energy!</text>

      <rect x="750" y="550" width="130" height="180" fill="#e0f2f1" stroke="#00796b" stroke-width="2" rx="8"/>
      <text x="815" y="575" font-size="14" font-weight="bold" text-anchor="middle" fill="#00796b">OXYGEN</text>
      <text x="815" y="595" font-size="10" text-anchor="middle" fill="#00796b">(We Breathe)</text>
      <text x="815" y="630" font-size="28" text-anchor="middle">💨</text>
      <text x="815" y="700" font-size="12" text-anchor="middle" fill="#00796b">Fresh Air!</text>

      <!-- Info box -->
      <rect x="50" y="100" width="300" height="200" fill="rgba(255,255,255,0.9)" stroke="#558b2f" stroke-width="2" rx="8"/>
      <text x="200" y="125" font-size="14" font-weight="bold" text-anchor="middle" fill="#1b5e20">KEY FACTS</text>
      <text x="70" y="155" font-size="11" fill="#2e7d32">✓ Plants make their own food</text>
      <text x="70" y="175" font-size="11" fill="#2e7d32">✓ Need: Light, Water, CO₂</text>
      <text x="70" y="195" font-size="11" fill="#2e7d32">✓ Produce: Glucose + Oxygen</text>
      <text x="70" y="215" font-size="11" fill="#2e7d32">✓ Happens in LEAVES</text>
      <text x="70" y="235" font-size="11" fill="#2e7d32">✓ Green color = Chlorophyll</text>
      <text x="70" y="255" font-size="11" fill="#2e7d32">✓ Powers ALL life on Earth</text>
    </svg>
  `
}

function generateCellDiagram(): string {
  return `
    <svg width="1000" height="800" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 800">
      <defs>
        <radialGradient id="cellGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" style="stop-color:#fff3e0;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#ffe0b2;stop-opacity:1" />
        </radialGradient>
        <filter id="glow2">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      <rect width="1000" height="800" fill="#f5f5f5"/>

      <!-- Title -->
      <rect x="0" y="0" width="1000" height="70" fill="#6a1b9a"/>
      <text x="500" y="45" font-size="42" font-weight="bold" text-anchor="middle" fill="white" font-family="Arial, sans-serif">
        CELL STRUCTURE
      </text>
      <text x="500" y="65" font-size="14" text-anchor="middle" fill="#e1bee7" font-family="Arial, sans-serif">
        THE BASIC UNIT OF LIFE • BUILDING BLOCKS OF ORGANISMS
      </text>

      <!-- Large Cell Membrane (Circle) -->
      <circle cx="500" cy="420" r="250" fill="url(#cellGrad)" stroke="#d32f2f" stroke-width="3"/>

      <!-- Nucleus -->
      <circle cx="500" cy="420" r="100" fill="#ffccbc" stroke="#bf360c" stroke-width="2" filter="url(#glow2)"/>
      <text x="500" y="365" font-size="16" font-weight="bold" text-anchor="middle" fill="#4e342e">Nucleus</text>
      <text x="500" y="385" font-size="10" text-anchor="middle" fill="#5d4037">(Control Center)</text>
      <text x="500" y="440" font-size="10" text-anchor="middle" fill="#5d4037">Contains DNA</text>
      <text x="500" y="465" font-size="20" text-anchor="middle" filter="url(#glow2)">✌️</text>

      <!-- Nucleolus inside nucleus -->
      <circle cx="500" cy="420" r="25" fill="#d7ccc8" stroke="#6d4c41" stroke-width="1"/>

      <!-- Mitochondria -->
      <ellipse cx="350" cy="300" rx="45" ry="60" fill="#c5cae9" stroke="#3f51b5" stroke-width="2"/>
      <path d="M 330 260 L 370 260 M 330 300 L 370 300 M 330 340 L 370 340" stroke="#3f51b5" stroke-width="1" opacity="0.5"/>
      <text x="350" y="305" font-size="11" font-weight="bold" text-anchor="middle" fill="#1a237e">Mitochondria</text>
      <text x="350" y="380" font-size="10" font-weight="bold" text-anchor="middle" fill="#3f51b5">(Power Plant)</text>
      <text x="350" y="395" font-size="9" text-anchor="middle" fill="#3f51b5">Produces Energy</text>
      <text x="280" y="320" font-size="20" fill="#ff6f00">⚡</text>

      <!-- Ribosome -->
      <circle cx="650" cy="320" r="20" fill="#a5d6a7" stroke="#2e7d32" stroke-width="2"/>
      <text x="650" y="325" font-size="11" font-weight="bold" text-anchor="middle" fill="#1b5e20">Rib</text>
      <text x="650" y="360" font-size="10" font-weight="bold" text-anchor="middle" fill="#2e7d32">Ribosome</text>
      <text x="650" y="375" font-size="9" text-anchor="middle" fill="#2e7d32">Protein Factory</text>
      <text x="720" y="330" font-size="18">🔧</text>

      <!-- Golgi Apparatus -->
      <path d="M 350 550 Q 360 570 350 590 Q 340 570 350 550" stroke="#f48fb1" stroke-width="2" fill="none"/>
      <path d="M 360 540 Q 370 560 360 580 Q 350 560 360 540" stroke="#f48fb1" stroke-width="2" fill="none"/>
      <path d="M 370 550 Q 380 570 370 590 Q 360 570 370 550" stroke="#f48fb1" stroke-width="2" fill="none"/>
      <text x="360" y="610" font-size="10" font-weight="bold" text-anchor="middle" fill="#880e4f">Golgi</text>
      <text x="360" y="623" font-size="9" text-anchor="middle" fill="#880e4f">Packages</text>
      <text x="360" y="636" font-size="9" text-anchor="middle" fill="#880e4f">Proteins</text>
      <text x="280" y="580" font-size="18">📦</text>

      <!-- Endoplasmic Reticulum -->
      <path d="M 550 300 Q 600 320 550 340 Q 500 320 550 300" stroke="#f9a825" stroke-width="2" fill="none" stroke-dasharray="5,3"/>
      <text x="550" y="270" font-size="10" font-weight="bold" text-anchor="middle" fill="#f57f17">Endoplasmic</text>
      <text x="550" y="283" font-size="10" font-weight="bold" text-anchor="middle" fill="#f57f17">Reticulum</text>
      <text x="550" y="296" font-size="9" text-anchor="middle" fill="#f57f17">Protein Highway</text>
      <text x="640" y="320" font-size="16">🛣️</text>

      <!-- Chloroplast (if plant cell) -->
      <circle cx="650" cy="550" r="40" fill="#c8e6c9" stroke="#2e7d32" stroke-width="2"/>
      <ellipse cx="650" cy="540" rx="25" ry="15" fill="#81c784" opacity="0.6"/>
      <text x="650" y="555" font-size="11" font-weight="bold" text-anchor="middle" fill="#1b5e20">Chloroplast</text>
      <text x="750" y="555" font-size="16">🌿</text>
      <text x="650" y="600" font-size="9" text-anchor="middle" fill="#2e7d32">(Photosynthesis)</text>

      <!-- Cell Membrane -->
      <text x="650" y="690" font-size="11" font-weight="bold" fill="#d32f2f">Cell Membrane</text>
      <text x="650" y="703" font-size="9" fill="#d32f2f">Controls what enters/exits</text>

      <!-- Comparison box -->
      <rect x="50" y="600" width="900" height="150" fill="#eceff1" stroke="#37474f" stroke-width="2" rx="8"/>
      <text x="500" y="625" font-size="14" font-weight="bold" text-anchor="middle" fill="#263238">ANIMAL VS PLANT CELLS</text>
      
      <text x="150" y="655" font-size="12" font-weight="bold" fill="#0277bd">ANIMAL CELLS:</text>
      <text x="150" y="673" font-size="10" fill="#01579b">• Have Mitochondria (energy)</text>
      <text x="150" y="688" font-size="10" fill="#01579b">• No Chloroplasts</text>
      <text x="150" y="703" font-size="10" fill="#01579b">• Smaller & Rounder</text>
      <text x="150" y="718" font-size="10" fill="#01579b">• Round nucleus</text>

      <text x="550" y="655" font-size="12" font-weight="bold" fill="#1b5e20">PLANT CELLS:</text>
      <text x="550" y="673" font-size="10" fill="#33691e">• Have Chloroplasts (food maker)</text>
      <text x="550" y="688" font-size="10" fill="#33691e">• Cell Wall (rigid)</text>
      <text x="550" y="703" font-size="10" fill="#33691e">• Larger & Square</text>
      <text x="550" y="718" font-size="10" fill="#33691e">• Vacuole (storage)</text>
    </svg>
  `
}

function generateWaterCycleDiagram(): string {
  return `
    <svg width="1000" height="800" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 800">
      <defs>
        <linearGradient id="skyGrad2" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#1e3a8a;stop-opacity:1" />
          <stop offset="50%" style="stop-color:#3b82f6;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#87ceeb;stop-opacity:1" />
        </linearGradient>
        <linearGradient id="oceanGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#0369a1;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#164e63;stop-opacity:1" />
        </linearGradient>
      </defs>

      <rect width="1000" height="800" fill="url(#skyGrad2)"/>

      <!-- Title -->
      <rect x="0" y="0" width="1000" height="70" fill="#0c4a6e"/>
      <text x="500" y="45" font-size="42" font-weight="bold" text-anchor="middle" fill="white" font-family="Arial, sans-serif">
        WATER CYCLE
      </text>
      <text x="500" y="65" font-size="14" text-anchor="middle" fill="#bfdbfe" font-family="Arial, sans-serif">
        CONTINUOUS MOVEMENT OF WATER ON EARTH
      </text>

      <!-- Ocean/Water body -->
      <rect x="0" y="550" width="1000" height="250" fill="url(#oceanGrad)"/>
      <text x="80" y="670" font-size="20" font-weight="bold" fill="#e0f2fe">OCEAN</text>
      
      <!-- Sun -->
      <circle cx="900" cy="100" r="50" fill="#fcd34d"/>
      <text x="900" y="115" font-size="32" text-anchor="middle">☀️</text>

      <!-- Evaporation arrows -->
      <defs>
        <marker id="arrowSteam" markerWidth="10" markerHeight="10" refX="5" refY="5" orient="auto">
          <path d="M 0 0 L 10 5 L 0 10 Z" fill="#ff6b6b"/>
        </marker>
      </defs>

      <path d="M 200 500 Q 210 400 220 300" stroke="#ff6b6b" stroke-width="3" fill="none" marker-end="url(#arrowSteam)" stroke-dasharray="8,4"/>
      <path d="M 400 520 Q 420 380 430 250" stroke="#ff6b6b" stroke-width="3" fill="none" marker-end="url(#arrowSteam)" stroke-dasharray="8,4"/>
      <path d="M 600 510 Q 620 370 630 200" stroke="#ff6b6b" stroke-width="3" fill="none" marker-end="url(#arrowSteam)" stroke-dasharray="8,4"/>
      
      <text x="150" y="400" font-size="12" font-weight="bold" fill="#fca5a5">① EVAPORATION</text>
      <text x="150" y="420" font-size="10" fill="#fee2e2">Water from ocean</text>
      <text x="150" y="435" font-size="10" fill="#fee2e2">turns to vapor</text>
      <text x="50" y="460" font-size="24">💨</text>

      <!-- Condensation -->
      <ellipse cx="300" cy="150" rx="80" ry="60" fill="#cbd5e1" stroke="#1e293b" stroke-width="2"/>
      <ellipse cx="300" cy="140" rx="75" ry="50" fill="#ecf0f1" stroke="#334155" stroke-width="1" opacity="0.8"/>
      <text x="300" y="155" font-size="12" font-weight="bold" text-anchor="middle" fill="#1e293b">② CONDENSATION</text>
      <text x="300" y="195" font-size="10" text-anchor="middle" fill="#1e293b">Water vapor forms</text>
      <text x="300" y="210" font-size="10" text-anchor="middle" fill="#1e293b">clouds</text>
      <text x="380" y="150" font-size="22">☁️</text>

      <!-- Precipitation -->
      <path d="M 350 220 L 340 280 M 370 220 L 360 280 M 390 220 L 380 280" stroke="#60a5fa" stroke-width="3" stroke-linecap="round"/>
      <circle cx="340" cy="290" r="4" fill="#60a5fa"/>
      <circle cx="360" cy="290" r="4" fill="#60a5fa"/>
      <circle cx="380" cy="290" r="4" fill="#60a5fa"/>
      <text x="400" y="255" font-size="12" font-weight="bold" fill="#e0f2fe">③ PRECIPITATION</text>
      <text x="400" y="275" font-size="10" fill="#e0f2fe">Rain/Snow falls</text>
      <text x="480" y="260" font-size="22">🌧️</text>

      <!-- Mountain/Land -->
      <path d="M 0 500 L 200 350 L 400 500 Z" fill="#6b4423" stroke="#44290c" stroke-width="2"/>
      <path d="M 300 500 L 550 300 L 800 500 Z" fill="#8b6f47" stroke="#5a4a2f" stroke-width="2"/>
      <path d="M 700 500 L 850 400 L 900 500 Z" fill="#5d4e37" stroke="#3d2e1f" stroke-width="2"/>

      <!-- Collection/Runoff -->
      <path d="M 550 450 Q 500 480 420 510" stroke="#3b82f6" stroke-width="4" fill="none" marker-end="url(#arrowCollection)"/>
      <defs>
        <marker id="arrowCollection" markerWidth="10" markerHeight="10" refX="5" refY="5" orient="auto">
          <path d="M 0 0 L 10 5 L 0 10 Z" fill="#3b82f6"/>
        </marker>
      </defs>
      <text x="480" y="460" font-size="12" font-weight="bold" fill="#e0f2fe">④ COLLECTION</text>
      <text x="480" y="478" font-size="10" fill="#e0f2fe">Water flows back</text>
      <text x="480" y="493" font-size="10" fill="#e0f2fe">to ocean</text>
      <text x="560" y="480" font-size="20">💧</text>

      <!-- Trees/Plants (Transpiration) -->
      <g id="tree1">
        <line x1="150" y1="500" x2="150" y2="420" stroke="#654321" stroke-width="4"/>
        <circle cx="150" cy="380" r="60" fill="#22c55e"/>
        <circle cx="120" cy="350" r="45" fill="#16a34a"/>
      </g>
      <g id="tree2">
        <line x1="700" y1="500" x2="700" y2="400" stroke="#654321" stroke-width="4"/>
        <circle cx="700" cy="350" r="55" fill="#22c55e"/>
        <circle cx="730" cy="320" r="40" fill="#16a34a"/>
      </g>

      <!-- Transpiration arrows -->
      <path d="M 150 350 Q 160 300 170 200" stroke="#90ee90" stroke-width="2" fill="none" stroke-dasharray="5,5" opacity="0.7"/>
      <path d="M 700 320 Q 710 260 720 150" stroke="#90ee90" stroke-width="2" fill="none" stroke-dasharray="5,5" opacity="0.7"/>
      <text x="190" y="280" font-size="10" font-weight="bold" fill="#86efac">Transpiration</text>
      <text x="760" y="220" font-size="10" font-weight="bold" fill="#86efac">Transpiration</text>
      <text x="140" y="320" font-size="18">🌿</text>

      <!-- Cycle arrow connecting everything -->
      <text x="500" y="100" font-size="11" font-weight="bold" fill="#fbbf24" text-anchor="middle">
        ⟲ CONTINUOUS CYCLE ⟲
      </text>

      <!-- Info box -->
      <rect x="50" y="720" width="900" height="60" fill="rgba(0,0,0,0.3)" stroke="#e0f2fe" stroke-width="2" rx="8"/>
      <text x="500" y="745" font-size="11" font-weight="bold" text-anchor="middle" fill="#e0f2fe">
        The water cycle continuously recycles water through evaporation, condensation, precipitation, and collection.
      </text>
      <text x="500" y="765" font-size="10" text-anchor="middle" fill="#bfdbfe">
        No water is created or destroyed—it just changes form and moves!
      </text>
    </svg>
  `
}

function generateNervousSystemDiagram(): string {
  return `
    <svg width="1000" height="800" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 800">
      <rect width="1000" height="800" fill="#f3f4f6"/>

      <!-- Title -->
      <rect x="0" y="0" width="1000" height="70" fill="#1f2937"/>
      <text x="500" y="45" font-size="42" font-weight="bold" text-anchor="middle" fill="white" font-family="Arial, sans-serif">
        NERVOUS SYSTEM
      </text>
      <text x="500" y="65" font-size="14" text-anchor="middle" fill="#d1d5db" font-family="Arial, sans-serif">
        COMMUNICATION NETWORK OF YOUR BODY
      </text>

      <!-- Brain -->
      <ellipse cx="500" cy="150" rx="70" ry="80" fill="#e0e7ff" stroke="#4f46e5" stroke-width="2"/>
      <path d="M 480 100 Q 490 90 500 85 Q 510 90 520 100" fill="#c7d2fe" stroke="#4f46e5" stroke-width="1"/>
      <circle cx="500" cy="150" r="15" fill="#a5b4fc" stroke="#4f46e5" stroke-width="1"/>
      <text x="500" y="160" font-size="11" font-weight="bold" text-anchor="middle" fill="#1e1b4b">Brain</text>
      <text x="500" y="240" font-size="10" font-weight="bold" text-anchor="middle" fill="#4f46e5">Control Center</text>
      <text x="430" y="150" font-size="20">🧠</text>

      <!-- Spinal Cord -->
      <rect x="485" y="230" width="30" height="200" fill="#fecaca" stroke="#dc2626" stroke-width="2" rx="5"/>
      <line x1="495" y1="240" x2="495" y2="420" stroke="#991b1b" stroke-width="1" opacity="0.3"/>
      <text x="550" y="330" font-size="10" font-weight="bold" fill="#dc2626">Spinal Cord</text>
      <text x="550" y="345" font-size="9" fill="#991b1b">Information Highway</text>

      <!-- Nerves branching out -->
      <path d="M 485 260 Q 400 280 340 290" stroke="#fbbd08" stroke-width="3" fill="none"/>
      <path d="M 515 260 Q 600 280 660 290" stroke="#fbbd08" stroke-width="3" fill="none"/>
      <path d="M 485 330 Q 380 350 300 360" stroke="#fbbd08" stroke-width="3" fill="none"/>
      <path d="M 515 330 Q 620 350 700 360" stroke="#fbbd08" stroke-width="3" fill="none"/>
      <path d="M 485 420 Q 380 480 300 550" stroke="#fbbd08" stroke-width="3" fill="none"/>
      <path d="M 515 420 Q 620 480 700 550" stroke="#fbbd08" stroke-width="3" fill="none"/>

      <!-- Peripheral Nervous System labels -->
      <text x="300" y="310" font-size="11" font-weight="bold" fill="#fb923c">SNS</text>
      <text x="700" y="310" font-size="11" font-weight="bold" fill="#fb923c">SNS</text>
      <text x="250" y="380" font-size="10" fill="#ea580c">Somatic</text>

      <!-- Body parts with receptors -->
      <!-- Eye -->
      <circle cx="300" cy="280" r="20" fill="#fed7aa" stroke="#9333ea" stroke-width="2"/>
      <circle cx="300" cy="280" r="12" fill="#9333ea"/>
      <text x="340" y="285" font-size="10" font-weight="bold" fill="#4f46e5">Eyes See</text>
      <text x="300" y="330" font-size="16">👁️</text>

      <!-- Ear -->
      <path d="M 660 280 Q 675 290 680 310 Q 675 300 660 295" fill="#fed7aa" stroke="#9333ea" stroke-width="2"/>
      <text x="690" y="285" font-size="10" font-weight="bold" fill="#4f46e5">Ears Hear</text>
      <text x="670" y="330" font-size="16">👂</text>

      <!-- Muscle -->
      <rect x="280" y="500" width="40" height="80" fill="#fed7aa" stroke="#9333ea" stroke-width="2" rx="5"/>
      <text x="240" y="545" font-size="10" font-weight="bold" fill="#4f46e5">Muscles</text>
      <text x="240" y="560" font-size="9" fill="#6b21a8">Move</text>
      <text x="280" y="605" font-size="18">💪</text>

      <!-- Heart/Organs -->
      <circle cx="700" cy="520" r="25" fill="#fed7aa" stroke="#9333ea" stroke-width="2"/>
      <path d="M 700 495 L 710 510 L 700 525 L 690 510 Z" fill="#9333ea"/>
      <text x="740" y="530" font-size="10" font-weight="bold" fill="#4f46e5">Organs</text>
      <text x="700" y="575" font-size="18">❤️</text>

      <!-- Information flow -->
      <g opacity="0.7">
        <text x="500" y="460" font-size="11" font-weight="bold" fill="#059669" text-anchor="middle">SIGNAL FLOW:</text>
        <text x="500" y="480" font-size="10" text-anchor="middle" fill="#047857">
          SENSORY → BRAIN → MOTOR → RESPONSE
        </text>
        <path d="M 400 490 L 600 490" stroke="#059669" stroke-width="2" marker-end="url(#greenArrow)"/>
        <defs>
          <marker id="greenArrow" markerWidth="10" markerHeight="10" refX="5" refY="5" orient="auto">
            <path d="M 0 0 L 10 5 L 0 10 Z" fill="#059669"/>
          </marker>
        </defs>
      </g>

      <!-- System divisions box -->
      <rect x="50" y="650" width="900" height="120" fill="#f0f9ff" stroke="#0369a1" stroke-width="2" rx="8"/>
      <text x="500" y="675" font-size="13" font-weight="bold" text-anchor="middle" fill="#0c4a6e">DIVISIONS OF NERVOUS SYSTEM</text>
      
      <rect x="80" y="695" width="250" height="60" fill="#e0f2fe" stroke="#0369a1" stroke-width="1" rx="4"/>
      <text x="215" y="715" font-size="11" font-weight="bold" text-anchor="middle" fill="#0c4a6e">CENTRAL (CNS)</text>
      <text x="215" y="733" font-size="9" text-anchor="middle" fill="#075985">Brain + Spinal Cord</text>
      <text x="215" y="748" font-size="9" text-anchor="middle" fill="#075985">Controls everything</text>
      <text x="180" y="720" font-size="14">🧠</text>

      <rect x="370" y="695" width="250" height="60" fill="#e0f2fe" stroke="#0369a1" stroke-width="1" rx="4"/>
      <text x="495" y="715" font-size="11" font-weight="bold" text-anchor="middle" fill="#0c4a6e">PERIPHERAL (PNS)</text>
      <text x="495" y="733" font-size="9" text-anchor="middle" fill="#075985">Nerves throughout body</text>
      <text x="495" y="748" font-size="9" text-anchor="middle" fill="#075985">Transmits signals</text>
      <text x="460" y="720" font-size="14">🔗</text>

      <rect x="660" y="695" width="250" height="60" fill="#e0f2fe" stroke="#0369a1" stroke-width="1" rx="4"/>
      <text x="785" y="715" font-size="11" font-weight="bold" text-anchor="middle" fill="#0c4a6e">AUTONOMIC</text>
      <text x="785" y="733" font-size="9" text-anchor="middle" fill="#075985">Automatic functions</text>
      <text x="785" y="748" font-size="9" text-anchor="middle" fill="#075985">Breathing, heartbeat</text>
      <text x="750" y="720" font-size="14">⚙️</text>
    </svg>
  `
}

function generateCirculatorySystemDiagram(): string {
  return `
    <svg width="1000" height="800" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 800">
      <rect width="1000" height="800" fill="#fff1f2"/>

      <!-- Title -->
      <rect x="0" y="0" width="1000" height="70" fill="#831843"/>
      <text x="500" y="45" font-size="42" font-weight="bold" text-anchor="middle" fill="white" font-family="Arial, sans-serif">
        CIRCULATORY SYSTEM
      </text>
      <text x="500" y="65" font-size="14" text-anchor="middle" fill="#fbcfe8" font-family="Arial, sans-serif">
        BLOOD FLOW & OXYGEN DELIVERY THROUGHOUT BODY
      </text>

      <!-- Heart -->
      <path d="M 500 150 C 480 130 450 130 450 160 L 450 220 Q 450 260 500 280 Q 550 260 550 220 L 550 160 C 550 130 520 130 500 150 Z" 
            fill="#dc2626" stroke="#7f1d1d" stroke-width="2"/>
      <text x="500" y="215" font-size="11" font-weight="bold" text-anchor="middle" fill="white">HEART</text>
      <text x="500" y="280" font-size="10" font-weight="bold" text-anchor="middle" fill="#dc2626">Pumps Blood</text>
      <text x="600" y="200" font-size="28">❤️</text>

      <!-- Arteries going out (red) -->
      <path d="M 480 290 Q 420 350 380 420" stroke="#ef4444" stroke-width="8" fill="none" stroke-linecap="round"/>
      <path d="M 520 290 Q 580 350 620 420" stroke="#ef4444" stroke-width="8" fill="none" stroke-linecap="round"/>

      <!-- Veins coming back (blue) -->
      <path d="M 500 290 Q 450 360 420 450" stroke="#3b82f6" stroke-width="8" fill="none" stroke-linecap="round"/>
      <path d="M 500 290 Q 550 360 580 450" stroke="#3b82f6" stroke-width="8" fill="none" stroke-linecap="round"/>

      <!-- Lungs -->
      <ellipse cx="320" cy="250" rx="45" ry="70" fill="#e0f2fe" stroke="#0369a1" stroke-width="2"/>
      <ellipse cx="680" cy="250" rx="45" ry="70" fill="#e0f2fe" stroke="#0369a1" stroke-width="2"/>
      <text x="320" y="250" font-size="11" font-weight="bold" text-anchor="middle" fill="#0c4a6e">LEFT</text>
      <text x="320" y="265" font-size="11" font-weight="bold" text-anchor="middle" fill="#0c4a6e">LUNG</text>
      <text x="680" y="250" font-size="11" font-weight="bold" text-anchor="middle" fill="#0c4a6e">RIGHT</text>
      <text x="680" y="265" font-size="11" font-weight="bold" text-anchor="middle" fill="#0c4a6e">LUNG</text>

      <!-- Exchange labels -->
      <text x="300" y="350" font-size="9" font-weight="bold" fill="#0c4a6e">CO₂ Released</text>
      <text x="300" y="365" font-size="9" font-weight="bold" fill="#0c4a6e">O₂ Picked Up</text>
      <text x="690" y="350" font-size="9" font-weight="bold" fill="#0c4a6e">CO₂ Released</text>
      <text x="690" y="365" font-size="9" font-weight="bold" fill="#0c4a6e">O₂ Picked Up</text>

      <!-- Body tissues/organs receiving oxygenated blood -->
      <!-- Brain -->
      <circle cx="200" cy="420" r="25" fill="#fecaca" stroke="#dc2626" stroke-width="2"/>
      <text x="200" y="425" font-size="10" font-weight="bold" text-anchor="middle" fill="#7f1d1d">Brain</text>
      <text x="200" y="480" font-size="14">🧠</text>

      <!-- Arm -->
      <rect x="140" y="500" width="30" height="80" fill="#fecaca" stroke="#dc2626" stroke-width="2" rx="5"/>
      <text x="155" y="555" font-size="9" font-weight="bold" text-anchor="middle" fill="#7f1d1d">Arm</text>
      <text x="140" y="610" font-size="14">💪</text>

      <!-- Leg -->
      <rect x="260" y="500" width="30" height="120" fill="#fecaca" stroke="#dc2626" stroke-width="2" rx="5"/>
      <text x="275" y="565" font-size="9" font-weight="bold" text-anchor="middle" fill="#7f1d1d">Leg</text>
      <text x="280" y="640" font-size="14">🦵</text>

      <!-- Arm on right -->
      <rect x="830" y="500" width="30" height="80" fill="#fecaca" stroke="#dc2626" stroke-width="2" rx="5"/>
      <text x="845" y="555" font-size="9" font-weight="bold" text-anchor="middle" fill="#7f1d1d">Arm</text>
      <text x="860" y="610" font-size="14">💪</text>

      <!-- Leg on right -->
      <rect x="710" y="500" width="30" height="120" fill="#fecaca" stroke="#dc2626" stroke-width="2" rx="5"/>
      <text x="725" y="565" font-size="9" font-weight="bold" text-anchor="middle" fill="#7f1d1d">Leg</text>
      <text x="730" y="640" font-size="14">🦵</text>

      <!-- Oxygen/Blood cells -->
      <circle cx="100" cy="350" r="6" fill="#ef4444" opacity="0.8"/>
      <circle cx="120" cy="360" r="6" fill="#ef4444" opacity="0.8"/>
      <circle cx="140" cy="340" r="6" fill="#ef4444" opacity="0.8"/>
      <text x="150" y="355" font-size="9" font-weight="bold" fill="#dc2626">Oxygenated</text>
      <text x="150" y="368" font-size="9" fill="#991b1b">(Red Blood)</text>

      <circle cx="900" cy="500" r="6" fill="#3b82f6" opacity="0.8"/>
      <circle cx="920" cy="510" r="6" fill="#3b82f6" opacity="0.8"/>
      <circle cx="940" cy="495" r="6" fill="#3b82f6" opacity="0.8"/>
      <text x="650" y="515" font-size="9" font-weight="bold" fill="#1e40af">Deoxygenated</text>
      <text x="650" y="528" font-size="9" fill="#1e3a8a">(Blue Blood)</text>

      <!-- Process steps -->
      <rect x="50" y="680" width="900" height="100" fill="#fce7f3" stroke="#831843" stroke-width="2" rx="8"/>
      <text x="500" y="705" font-size="12" font-weight="bold" text-anchor="middle" fill="#831843">BLOOD CIRCULATION PROCESS</text>
      <text x="500" y="728" font-size="10" text-anchor="middle" fill="#9d174d">
        ① Heart pumps oxygenated blood → ② Blood travels through arteries → ③ Oxygen delivered to body organs
      </text>
      <text x="500" y="748" font-size="10" text-anchor="middle" fill="#9d174d">
        ④ Organs use oxygen, make CO₂ waste → ⑤ Blood returns through veins → ⑥ Returns to heart → ⑦ Goes to lungs for O₂
      </text>
    </svg>
  `
}

function generateRespiratorySystemDiagram(): string {
  return `
    <svg width="1000" height="800" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 800">
      <rect width="1000" height="800" fill="#ecfdf5"/>

      <!-- Title -->
      <rect x="0" y="0" width="1000" height="70" fill="#065f46"/>
      <text x="500" y="45" font-size="42" font-weight="bold" text-anchor="middle" fill="white" font-family="Arial, sans-serif">
        RESPIRATORY SYSTEM
      </text>
      <text x="500" y="65" font-size="14" text-anchor="middle" fill="#a7f3d0" font-family="Arial, sans-serif">
        BREATHING & GAS EXCHANGE FOR ENERGY
      </text>

      <!-- Nose/Nasal cavity -->
      <ellipse cx="500" cy="120" rx="30" ry="25" fill="#d1fae5" stroke="#059669" stroke-width="2"/>
      <text x="500" y="125" font-size="10" font-weight="bold" text-anchor="middle" fill="#065f46">NOSE</text>
      <text x="500" y="180" font-size="9" font-weight="bold" text-anchor="middle" fill="#059669">Filters Air</text>
      <text x="570" y="125" font-size="18">👃</text>

      <!-- Trachea (Windpipe) -->
      <path d="M 480 150 L 480 280 M 520 150 L 520 280" stroke="#6ee7b7" stroke-width="12" fill="none" stroke-linecap="round"/>
      <circle cx="500" cy="160" r="4" fill="#059669" opacity="0.3"/>
      <circle cx="500" cy="175" r="4" fill="#059669" opacity="0.3"/>
      <circle cx="500" cy="190" r="4" fill="#059669" opacity="0.3"/>
      <circle cx="500" cy="205" r="4" fill="#059669" opacity="0.3"/>
      <circle cx="500" cy="220" r="4" fill="#059669" opacity="0.3"/>
      <circle cx="500" cy="235" r="4" fill="#059669" opacity="0.3"/>
      <circle cx="500" cy="250" r="4" fill="#059669" opacity="0.3"/>
      <circle cx="500" cy="265" r="4" fill="#059669" opacity="0.3"/>
      <text x="550" y="215" font-size="10" font-weight="bold" fill="#059669">TRACHEA</text>
      <text x="550" y="230" font-size="9" fill="#047857">(Windpipe)</text>

      <!-- Bronchi split -->
      <path d="M 480 280 Q 420 320 380 400" stroke="#6ee7b7" stroke-width="10" fill="none" stroke-linecap="round"/>
      <path d="M 520 280 Q 580 320 620 400" stroke="#6ee7b7" stroke-width="10" fill="none" stroke-linecap="round"/>

      <!-- Left lung -->
      <ellipse cx="350" cy="480" rx="70" ry="100" fill="#a7f3d0" stroke="#059669" stroke-width="2"/>
      <ellipse cx="350" cy="470" rx="65" ry="90" fill="#ccfbf1" stroke="#10b981" stroke-width="1" opacity="0.6"/>
      <text x="350" y="480" font-size="12" font-weight="bold" text-anchor="middle" fill="#065f46">LEFT LUNG</text>
      <text x="350" y="500" font-size="9" text-anchor="middle" fill="#047857">Smaller (heart)</text>
      <text x="280" y="480" font-size="24">🫁</text>

      <!-- Right lung -->
      <ellipse cx="650" cy="480" rx="75" ry="100" fill="#a7f3d0" stroke="#059669" stroke-width="2"/>
      <ellipse cx="650" cy="470" rx="70" ry="90" fill="#ccfbf1" stroke="#10b981" stroke-width="1" opacity="0.6"/>
      <text x="650" y="480" font-size="12" font-weight="bold" text-anchor="middle" fill="#065f46">RIGHT LUNG</text>
      <text x="650" y="500" font-size="9" text-anchor="middle" fill="#047857">Larger</text>
      <text x="720" y="480" font-size="24">🫁</text>

      <!-- Diaphragm -->
      <path d="M 250 580 Q 500 650 750 580" stroke="#10b981" stroke-width="4" fill="none" stroke-linecap="round"/>
      <text x="500" y="620" font-size="11" font-weight="bold" text-anchor="middle" fill="#065f46">DIAPHRAGM (muscle)</text>
      <text x="500" y="640" font-size="10" text-anchor="middle" fill="#047857">Contracts↓ to pull air in, Relaxes↑ to push air out</text>
      <text x="200" y="600" font-size="16">⬆️⬇️</text>

      <!-- Gas exchange detail -->
      <g id="gasExchange">
        <rect x="320" y="280" width="160" height="100" fill="#ecfdf5" stroke="#059669" stroke-width="2" rx="6"/>
        <text x="400" y="300" font-size="11" font-weight="bold" text-anchor="middle" fill="#065f46">GAS EXCHANGE</text>
        <text x="400" y="320" font-size="9" text-anchor="middle" fill="#047857">IN ALVEOLI</text>
        
        <!-- Oxygen in -->
        <text x="330" y="340" font-size="9" font-weight="bold" fill="#10b981">O₂ IN:</text>
        <text x="330" y="355" font-size="8" fill="#047857">From air</text>
        
        <!-- CO2 out -->
        <text x="420" y="340" font-size="9" font-weight="bold" fill="#dc2626">CO₂ OUT:</text>
        <text x="420" y="355" font-size="8" fill="#991b1b">Waste gas</text>
      </g>

      <!-- Oxygen arrows to bloodstream -->
      <path d="M 350 290 Q 300 350 250 400" stroke="#10b981" stroke-width="3" fill="none" marker-end="url(#greenArrow2)" stroke-dasharray="5,5"/>
      <defs>
        <marker id="greenArrow2" markerWidth="10" markerHeight="10" refX="5" refY="5" orient="auto">
          <path d="M 0 0 L 10 5 L 0 10 Z" fill="#10b981"/>
        </marker>
      </defs>
      <text x="280" y="340" font-size="9" fill="#047857">Blood picks</text>
      <text x="280" y="353" font-size="9" fill="#047857">up O₂</text>

      <!-- CO2 coming back -->
      <path d="M 650 290 Q 700 350 750 400" stroke="#dc2626" stroke-width="3" fill="none" marker-end="url(#redArrow2)" stroke-dasharray="5,5"/>
      <defs>
        <marker id="redArrow2" markerWidth="10" markerHeight="10" refX="5" refY="5" orient="auto">
          <path d="M 0 0 L 10 5 L 0 10 Z" fill="#dc2626"/>
        </marker>
      </defs>
      <text x="730" y="340" font-size="9" fill="#991b1b">Blood drops</text>
      <text x="730" y="353" font-size="9" fill="#991b1b">off CO₂</text>

      <!-- Breathing process -->
      <rect x="50" y="700" width="900" height="70" fill="#d1fae5" stroke="#059669" stroke-width="2" rx="8"/>
      <text x="500" y="725" font-size="11" font-weight="bold" text-anchor="middle" fill="#065f46">BREATHING CYCLE</text>
      <text x="500" y="750" font-size="9" text-anchor="middle" fill="#047857">
        INHALATION: Diaphragm contracts↓ → Volume↑ → Pressure↓ → Air rushes in
      </text>
    </svg>
  `
}

function generateGenericAdvancedDiagram(topic: string, prompt: string): string {
  return `
    <svg width="1000" height="800" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 800">
      <defs>
        <linearGradient id="genericGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#f3e8ff;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#ede9fe;stop-opacity:1" />
        </linearGradient>
      </defs>

      <rect width="1000" height="800" fill="url(#genericGrad)"/>

      <!-- Title -->
      <rect x="0" y="0" width="1000" height="100" fill="#6d28d9"/>
      <text x="500" y="50" font-size="44" font-weight="bold" text-anchor="middle" fill="white" font-family="Arial, sans-serif">
        ${topic.toUpperCase()}
      </text>
      <text x="500" y="80" font-size="14" text-anchor="middle" fill="#e9d5ff" font-family="Arial, sans-serif">
        PREMIUM EDUCATIONAL DIAGRAM FOR DEAF STUDENTS
      </text>

      <!-- Central concept circle -->
      <circle cx="500" cy="350" r="150" fill="#ddd6fe" stroke="#7c3aed" stroke-width="3"/>
      <text x="500" y="330" font-size="20" font-weight="bold" text-anchor="middle" fill="#4c1d95" font-family="Arial, sans-serif">
        ${topic}
      </text>
      <text x="500" y="370" font-size="12" text-anchor="middle" fill="#6b21a8" font-family="Arial, sans-serif">
        KEY CONCEPT
      </text>
      <text x="500" y="420" font-size="28" text-anchor="middle">🎓</text>

      <!-- Educational elements radiating out -->
      <g id="elements">
        <!-- Element 1 -->
        <circle cx="200" cy="150" r="50" fill="#fcd34d" stroke="#b45309" stroke-width="2"/>
        <text x="200" y="150" font-size="11" font-weight="bold" text-anchor="middle" fill="#78350f">Definition</text>
        <text x="200" y="165" font-size="9" text-anchor="middle" fill="#92400e">What it is</text>
        <text x="200" y="220" font-size="18">📖</text>

        <!-- Element 2 -->
        <circle cx="800" cy="150" r="50" fill="#86efac" stroke="#166534" stroke-width="2"/>
        <text x="800" y="150" font-size="11" font-weight="bold" text-anchor="middle" fill="#15803d">Function</text>
        <text x="800" y="165" font-size="9" text-anchor="middle" fill="#22c55e">What it does</text>
        <text x="800" y="220" font-size="18">⚙️</text>

        <!-- Element 3 -->
        <circle cx="200" cy="650" r="50" fill="#93c5fd" stroke="#1e40af" stroke-width="2"/>
        <text x="200" y="650" font-size="11" font-weight="bold" text-anchor="middle" fill="#1e3a8a">Methods</text>
        <text x="200" y="665" font-size="9" text-anchor="middle" fill="#3b82f6">How it works</text>
        <text x="200" y="720" font-size="18">🔬</text>

        <!-- Element 4 -->
        <circle cx="800" cy="650" r="50" fill="#f472b6" stroke="#831843" stroke-width="2"/>
        <text x="800" y="650" font-size="11" font-weight="bold" text-anchor="middle" fill="#500724">Examples</text>
        <text x="800" y="665" font-size="9" text-anchor="middle" fill="#ec4899">Real world</text>
        <text x="800" y="720" font-size="18">🌍</text>
      </g>

      <!-- Connecting lines -->
      <line x1="350" y1="250" x2="470" y2="320" stroke="#a78bfa" stroke-width="2" stroke-dasharray="5,5"/>
      <line x1="650" y1="250" x2="530" y2="320" stroke="#a78bfa" stroke-width="2" stroke-dasharray="5,5"/>
      <line x1="350" y1="550" x2="470" y2="380" stroke="#a78bfa" stroke-width="2" stroke-dasharray="5,5"/>
      <line x1="650" y1="550" x2="530" y2="380" stroke="#a78bfa" stroke-width="2" stroke-dasharray="5,5"/>

      <!-- Sign Language note -->
      <rect x="50" y="720" width="900" height="60" fill="#f3e8ff" stroke="#7c3aed" stroke-width="2" rx="8"/>
      <text x="500" y="745" font-size="11" font-weight="bold" text-anchor="middle" fill="#6d28d9">
        ✋ VISUAL LEARNING FOR DEAF STUDENTS ✋ • Designed with sign language integration • All concepts shown visually
      </text>
      <text x="500" y="765" font-size="10" text-anchor="middle" fill="#7c3aed">
        Hand gestures correspond to each concept for sign language communication
      </text>
    </svg>
  `
}
