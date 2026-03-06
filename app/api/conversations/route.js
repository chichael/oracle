import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("conversations")
    .select("id, title, last_message, created_at, updated_at")
    .order("updated_at", { ascending: false })
    .limit(50);

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}

export async function POST(req) {
  const { title } = await req.json();
  const { data, error } = await supabaseAdmin
    .from("conversations")
    .insert({ title: title || "New Conversation" })
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}

export async function DELETE(req) {
  const { id } = await req.json();
  const { error } = await supabaseAdmin
    .from("conversations")
    .delete()
    .eq("id", id);

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ success: true });
}
