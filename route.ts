import { OpenAI } from "openai";
import { NextResponse } from "next/server";
import { Buffer } from "node:buffer";

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.API_KEY,
});

// FinOps Model Configuration (Hard Requirements)
const MODELS = {
    STT: "gpt-4o-mini-transcribe", // $0.003/min
    LLM: "gpt-5-nano",             // $0.05/1M tokens (Input)
    TTS: "gpt-4o-mini-tts",        // $0.015/min
};

// System Prompt with Action Logic
const SYSTEM_PROMPT = `
You are Persona, a futuristic AI Virtual Receptionist for a high-tech office. 
Your demeanor is professional, concise, and helpful.
Answer briefly (max 2 sentences).

IMPORTANT: If the user asks for directions (e.g., "Where is the meeting room?", "Where is the bathroom?"), 
append the tag {{SHOW_MAP}} to the end of your response.
If the user asks to speak to a human, append {{CALL_HUMAN}}.
`;

export async function POST(req: Request) {
    try {
        // 1. Parse FormData to get the audio blob
        const formData = await req.formData();
        const audioFile = formData.get("audio") as File;

        if (!audioFile) {
            return NextResponse.json(
                { error: "No audio file provided" },
                { status: 400 }
            );
        }

        const language = formData.get("language") as string || "en";

        // --- STEP 1: "EARS" (STT) ---
        // Cost Optimization: Using mini-transcribe instead of Whisper Large
        const transcription = await openai.audio.transcriptions.create({
            file: audioFile,
            model: MODELS.STT,
            language: language,
        });

        const userText = transcription.text;
        console.log(`[FinOps] User said: ${userText}`);

        // --- STEP 2: "BRAIN" (LLM) ---
        // Cost Optimization: Using gpt-5-nano. High intelligence, lowest text cost.
        const completion = await openai.chat.completions.create({
            model: MODELS.LLM,
            messages: [
                { role: "system", content: SYSTEM_PROMPT },
                // In a real production app, you might pass `history` from the client here
                { role: "user", content: userText },
            ],
            max_tokens: 150, // Prevent cost runaways on long hallucinations
            temperature: 0.7,
        });

        const rawAiResponse = completion.choices[0].message.content || "";

        // Parse Actions: Extract tags like {{SHOW_MAP}} so the TTS doesn't say them
        let action = "IDLE";
        let textToSpeak = rawAiResponse;

        if (rawAiResponse.includes("{{SHOW_MAP}}")) {
            action = "SHOW_MAP";
            textToSpeak = rawAiResponse.replace("{{SHOW_MAP}}", "").trim();
        } else if (rawAiResponse.includes("{{CALL_HUMAN}}")) {
            action = "CALL_HUMAN";
            textToSpeak = rawAiResponse.replace("{{CALL_HUMAN}}", "").trim();
        }

        console.log(`[FinOps] AI Response: ${textToSpeak} | Action: ${action}`);

        // --- STEP 3: "VOICE" (TTS) ---
        // Cost Optimization: Using mini-tts for lower latency and price than TTS-1
        const mp3Response = await openai.audio.speech.create({
            model: MODELS.TTS,
            voice: "shimmer", // 'shimmer' has a clear, slightly feminine robotic tone suitable for kiosks
            input: textToSpeak,
            response_format: "mp3", // MP3 is compressed, saving bandwidth vs PCM
        });

        // Convert raw binary stream to Buffer -> Base64 for easy frontend playback
        const arrayBuffer = await mp3Response.arrayBuffer();
        const audioBase64 = Buffer.from(arrayBuffer).toString("base64");

        // Return the orchestrated result
        return NextResponse.json({
            user_text: userText,
            ai_text: textToSpeak,
            audio_base64: audioBase64,
            action: action,
        });

    } catch (error: any) {
        console.error("[Orchestration Error]:", error);

        // Graceful error handling
        return NextResponse.json(
            {
                error: "Conversation processing failed",
                details: error.message
            },
            { status: 500 }
        );
    }
}