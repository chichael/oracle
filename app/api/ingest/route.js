export const dynamic = 'force-dynamic';
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req) {
  try {
    const { title, content, source } = await req.json();

    if (!content || content.trim().length < 10) {
      return Response.json({ error: "Content too short" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("knowledge")
      .insert({
        title: title || "Untitled Note",
        content: content.trim(),
        source: source || "manual",
      })
      .select()
      .single();

    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ success: true, id: data.id });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("knowledge")
    .select("id, title, source, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}

export async function DELETE(req) {
  const { id } = await req.json();
  const { error } = await supabaseAdmin.from("knowledge").delete().eq("id", id);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ success: true });
}
