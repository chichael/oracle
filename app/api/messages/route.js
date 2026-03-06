export const dynamic = 'force-dynamic';
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const conversationId = searchParams.get("conversationId");

  if (!conversationId) return Response.json([]);

  const { data, error } = await supabaseAdmin
    .from("messages")
    .select("id, role, content, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}
