import { OpenAI } from "openai";
import { NextResponse } from "next/server";
import { Buffer } from "node:buffer";
import { createClient } from '@supabase/supabase-js';

const openai = new OpenAI({
  apiKey: process.env.API_KEY,
});

// Initialize Supabase Admin Client (Bypass RLS for server-side logging)
// Initialize Supabase Admin Client (Bypass RLS for server-side logging)
const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY! || process.env.VITE_SUPABASE_ANON_KEY!
);

// ✅ FIXED: Using REAL OpenAI model names
const MODELS = {
  STT: "whisper-1",        // ✅ Real OpenAI Whisper model
  LLM: "gpt-4o-mini",      // ✅ Real GPT-4o-mini model (fast & cheap)
  TTS: "tts-1",            // ✅ Real TTS model
};

const SYSTEM_PROMPT = `
You are Propulso, a futuristic AI Virtual Receptionist. 
Answer briefly (max 2 sentences).
IMPORTANT: If user asks for directions, append {{SHOW_MAP}}.
If user asks for a human, append {{CALL_HUMAN}}.
`;

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get("audio") as File;

    if (!audioFile) {
      return NextResponse.json({ error: "No audio file" }, { status: 400 });
    }

    // 1. STT
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: MODELS.STT,
    });
    const userText = transcription.text;

    // 2. LLM
    const completion = await openai.chat.completions.create({
      model: MODELS.LLM,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userText },
      ],
      max_tokens: 150,
    });
    const rawAiResponse = completion.choices[0].message.content || "";

    let action = "IDLE";
    let textToSpeak = rawAiResponse;

    if (rawAiResponse.includes("{{SHOW_MAP}}")) {
      action = "SHOW_MAP";
      textToSpeak = rawAiResponse.replace("{{SHOW_MAP}}", "").trim();
    } else if (rawAiResponse.includes("{{CALL_HUMAN}}")) {
      action = "CALL_HUMAN";
      textToSpeak = rawAiResponse.replace("{{CALL_HUMAN}}", "").trim();
    }

    /* 
    // --- DB LOGGING (Disabled to avoid duplication with Frontend which tracks full latency) ---
    // We don't await this to avoid slowing down the response to the user
    const startTime = new Date();
    const logEntry = {
      start_time: startTime.toISOString(),
      user_query: userText,
      department: "General", // Placeholder
      status: action === 'CALL_HUMAN' ? 'escalated' : 'resolved',
      duration: "5s", // Placeholder
      metadata: {
        latency: 0, // Placeholder
        confidence: 0.99,
        model: MODELS.LLM,
        tokensUsed: 150 // Placeholder
      },
      messages: [
        { role: 'user', text: userText, timestamp: startTime.toLocaleTimeString() },
        { role: 'ai', text: textToSpeak, timestamp: new Date().toLocaleTimeString() }
      ]
    };

    supabaseAdmin.from('logs').insert(logEntry).then(({ error }) => {
      if (error) console.error("Supabase Log Error:", error);
    });
    // --------------------------
    */

    // 3. TTS
    const mp3Response = await openai.audio.speech.create({
      model: MODELS.TTS,
      voice: "shimmer",
      input: textToSpeak,
      response_format: "mp3",
    });

    const arrayBuffer = await mp3Response.arrayBuffer();
    const audioBase64 = Buffer.from(arrayBuffer).toString("base64");

    return NextResponse.json({
      user_text: userText,
      ai_text: textToSpeak,
      audio_base64: audioBase64,
      action: action,
    });

  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}