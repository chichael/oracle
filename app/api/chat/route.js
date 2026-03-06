import Anthropic from "@anthropic-ai/sdk";
import { supabaseAdmin } from "@/lib/supabase";
import { INVESTING_AGENT_SYSTEM, MEMORY_EXTRACTION_PROMPT } from "@/lib/agents";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req) {
  try {
    const { messages, conversationId } = await req.json();

    // Fetch memories for context
    const { data: memories } = await supabaseAdmin
      .from("memories")
      .select("type, content, confidence")
      .order("created_at", { ascending: false })
      .limit(30);

    // Fetch ingested knowledge snippets relevant to recent message
    const lastUserMsg = messages.filter((m) => m.role === "user").pop()?.content || "";
    const { data: knowledge } = await supabaseAdmin
      .from("knowledge")
      .select("title, content")
      .limit(5);

    // Build memory context block
    let memoryContext = "";
    if (memories && memories.length > 0) {
      const grouped = memories.reduce((acc, m) => {
        if (!acc[m.type]) acc[m.type] = [];
        acc[m.type].push(m.content);
        return acc;
      }, {});

      memoryContext = "\n\n---\n## MEMORY CONTEXT (What you know about this investor)\n";
      for (const [type, items] of Object.entries(grouped)) {
        memoryContext += `\n**${type.toUpperCase()}S:**\n`;
        items.forEach((item) => (memoryContext += `- ${item}\n`));
      }
    }

    let knowledgeContext = "";
    if (knowledge && knowledge.length > 0) {
      knowledgeContext = "\n\n---\n## INGESTED KNOWLEDGE BASE\n";
      knowledge.forEach((k) => {
        knowledgeContext += `\n**${k.title}**\n${k.content.substring(0, 500)}...\n`;
      });
    }

    const systemPrompt = INVESTING_AGENT_SYSTEM + memoryContext + knowledgeContext;

    // Stream response
    const stream = await anthropic.messages.stream({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      system: systemPrompt,
      messages: messages,
    });

    // Create a readable stream for the response
    const encoder = new TextEncoder();
    let fullResponse = "";

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            if (
              chunk.type === "content_block_delta" &&
              chunk.delta.type === "text_delta"
            ) {
              const text = chunk.delta.text;
              fullResponse += text;
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
            }
          }

          // Save assistant message to DB
          if (conversationId) {
            const userMsg = messages[messages.length - 1];
            await supabaseAdmin.from("messages").insert([
              {
                conversation_id: conversationId,
                role: "user",
                content: userMsg.content,
              },
              {
                conversation_id: conversationId,
                role: "assistant",
                content: fullResponse,
              },
            ]);

            // Update conversation updated_at
            await supabaseAdmin
              .from("conversations")
              .update({ updated_at: new Date().toISOString(), last_message: userMsg.content.substring(0, 100) })
              .eq("id", conversationId);

            // Extract memories asynchronously (don't wait)
            extractAndStoreMemories(messages, fullResponse, conversationId);
          }

          controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Chat error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

async function extractAndStoreMemories(messages, assistantResponse, conversationId) {
  try {
    const conversationText = messages
      .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
      .join("\n\n");

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `${MEMORY_EXTRACTION_PROMPT}\n\nCONVERSATION:\n${conversationText}\n\nASSISTANT RESPONSE:\n${assistantResponse}`,
        },
      ],
    });

    const text = response.content[0].text.trim();
    const memories = JSON.parse(text);

    if (Array.isArray(memories) && memories.length > 0) {
      await supabaseAdmin.from("memories").insert(
        memories.map((m) => ({
          type: m.type,
          content: m.content,
          confidence: m.confidence,
          conversation_id: conversationId,
        }))
      );
    }
  } catch (err) {
    console.error("Memory extraction failed:", err);
  }
}
