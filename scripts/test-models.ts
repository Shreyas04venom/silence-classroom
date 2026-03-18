import { GoogleGenerativeAI } from "@google/generative-ai"

// Get key from arguments or environment
const key = process.argv[2] || process.env.GEMINI_API_KEY?.split(',')[0] || "";

if (!key) {
    console.error("Please provide an API KEY");
    process.exit(1);
}

async function listModels() {
    const genAI = new GoogleGenerativeAI(key);

    // Extended list of potential models
    const models = [
        "gemini-1.5-flash",
        "gemini-1.5-flash-latest",
        "gemini-1.5-flash-001",
        "gemini-1.5-flash-002",
        "gemini-pro",
        "gemini-1.0-pro",
        "gemini-1.5-pro",
        "gemini-2.0-flash-exp"
    ];

    console.log(`Testing models with key: ${key.substring(0, 5)}...`);

    for (const modelName of models) {
        try {
            console.log(`Running test for: ${modelName}`);
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Hello?");
            console.log(`SUCCESS: ${modelName}`);
            return;
        } catch (e: any) {
            if (e.message.includes("404") || e.message.includes("not found")) {
                console.log(`FAILED (404 Not Found): ${modelName}`);
            } else if (e.message.includes("429")) {
                console.log(`FAILED (429 Quota): ${modelName}`);
            } else {
                console.log(`FAILED (Other): ${modelName} - ${e.message.split('\n')[0]}`);
            }
        }
    }
}

listModels();
