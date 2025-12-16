
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with Service Role Key for backend administration
// This allows us to bypass RLS policies to ensure we can update any record
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { message } = body;

        if (message?.type === 'end-of-call-report') {
            const { call } = message;

            // 1. Extract our custom internal ID from metadata
            // We passed this as `metadata.conversation_id` or `metadata.my_db_id`
            // Vapi might nest it in `call.metadata` or just return it as `metadata`
            const conversationId = call?.metadata?.conversation_id || call?.metadata?.my_db_id;

            if (!conversationId) {
                console.warn('[Webhook] No conversation_id found in metadata. Skipping update.');
                return NextResponse.json({ message: 'No conversation_id provided' }, { status: 200 });
            }

            console.log(`[Webhook] Processing end-of-call for ID: ${conversationId}`);

            // 2. Extract metrics
            const tokens = (call.usage?.totalTokens || call.cost?.totalTokens || 0);
            const cost = (call.cost?.totalCost || 0);

            // Latency might be in analysis or monitor
            const latency = (call.monitor?.latency?.average || call.analysis?.latency || 0);

            // 3. Update Supabase
            const { error } = await supabase
                .from('conversations')
                .update({
                    tokens_used: tokens,
                    cost: cost,
                    latency: latency,
                    // We can also update formatted analysis if Vapi provides it
                    // e.g. resolution_status: call.analysis.successEvaluation ? 'resolved' : 'unresolved'
                })
                .eq('id', conversationId);

            if (error) {
                console.error('[Webhook] Database update failed:', error);
                return NextResponse.json({ error: error.message }, { status: 500 });
            }

            console.log('[Webhook] Successfully updated conversation metrics.');
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ message: 'Ignored message type' }, { status: 200 });
    } catch (error: any) {
        console.error('[Webhook] Error processing request:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
