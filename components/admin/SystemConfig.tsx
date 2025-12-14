import React, { useState } from 'react';

const DEFAULT_PROMPT = `You are Propulso. Answer briefly.
Tags: {{SHOW_MAP}}, {{CALL_HUMAN}}.`;

export default function SystemConfig() {
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);

  return (
    <div className="h-full flex flex-col">
       <textarea 
         value={prompt}
         onChange={(e) => setPrompt(e.target.value)}
         className="w-full h-32 bg-transparent resize-none outline-none text-slate-600 text-sm font-medium placeholder:text-slate-300"
         placeholder="Enter system prompt instructions..."
       />
       <div className="mt-auto pt-4 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-400 uppercase">Tokens: 45</span>
          <span className="text-xs font-bold text-emerald-500">Valid</span>
       </div>
    </div>
  );
}