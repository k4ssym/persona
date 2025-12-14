module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/node:buffer [external] (node:buffer, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:buffer", () => require("node:buffer"));

module.exports = mod;
}),
"[project]/Desktop/xxx/app/api/conversation/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "POST",
    ()=>POST
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$xxx$2f$node_modules$2f$openai$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/Desktop/xxx/node_modules/openai/index.mjs [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$xxx$2f$node_modules$2f$openai$2f$client$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/xxx/node_modules/openai/client.mjs [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$xxx$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/xxx/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$buffer__$5b$external$5d$__$28$node$3a$buffer$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/node:buffer [external] (node:buffer, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$xxx$2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$esm$2f$wrapper$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/xxx/node_modules/@supabase/supabase-js/dist/esm/wrapper.mjs [app-route] (ecmascript)");
;
;
;
;
const openai = new __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$xxx$2f$node_modules$2f$openai$2f$client$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["OpenAI"]({
    apiKey: process.env.API_KEY
});
// Initialize Supabase Admin Client (Bypass RLS for server-side logging)
// Initialize Supabase Admin Client (Bypass RLS for server-side logging)
const supabaseAdmin = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$xxx$2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$esm$2f$wrapper$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createClient"])(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY);
// ✅ FIXED: Using REAL OpenAI model names
const MODELS = {
    STT: "whisper-1",
    LLM: "gpt-4o-mini",
    TTS: "tts-1"
};
const SYSTEM_PROMPT = `
You are Propulso, a futuristic AI Virtual Receptionist. 
Answer briefly (max 2 sentences).
IMPORTANT: If user asks for directions, append {{SHOW_MAP}}.
If user asks for a human, append {{CALL_HUMAN}}.
`;
async function POST(req) {
    try {
        const formData = await req.formData();
        const audioFile = formData.get("audio");
        if (!audioFile) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$xxx$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: "No audio file"
            }, {
                status: 400
            });
        }
        // 1. STT
        const transcription = await openai.audio.transcriptions.create({
            file: audioFile,
            model: MODELS.STT
        });
        const userText = transcription.text;
        // 2. LLM
        const completion = await openai.chat.completions.create({
            model: MODELS.LLM,
            messages: [
                {
                    role: "system",
                    content: SYSTEM_PROMPT
                },
                {
                    role: "user",
                    content: userText
                }
            ],
            max_tokens: 150
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
    */ // 3. TTS
        const mp3Response = await openai.audio.speech.create({
            model: MODELS.TTS,
            voice: "shimmer",
            input: textToSpeak,
            response_format: "mp3"
        });
        const arrayBuffer = await mp3Response.arrayBuffer();
        const audioBase64 = __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$buffer__$5b$external$5d$__$28$node$3a$buffer$2c$__cjs$29$__["Buffer"].from(arrayBuffer).toString("base64");
        return __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$xxx$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            user_text: userText,
            ai_text: textToSpeak,
            audio_base64: audioBase64,
            action: action
        });
    } catch (error) {
        console.error(error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$xxx$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: error.message
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__b15c151e._.js.map