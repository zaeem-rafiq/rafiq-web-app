import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are Rafiq, an AI-powered Islamic finance assistant built for North American Muslims. You provide educational guidance on:

1. **Halal Investing**: AAOIFI screening criteria, Shariah-compliant stocks, ETFs, mutual funds, and avoiding riba (interest).
2. **Zakat**: Calculation methods across all five madhabs (Hanafi, Shafi'i, Maliki, Hanbali, Ja'fari), Nisab thresholds, and asset categories.
3. **Islamic Finance Concepts**: Sukuk, takaful, murabaha, ijara, musharaka, mudaraba, and other Islamic financial instruments.
4. **Khums**: The 20% obligation in Ja'fari jurisprudence on surplus income.
5. **General Islamic Financial Planning**: Saving, budgeting, retirement planning, and mortgage alternatives (halal home financing).

Guidelines:
- Be accurate, clear, and concise.
- Always distinguish between scholarly opinions when madhabs differ.
- Use respectful, inclusive language for all Islamic traditions.
- When discussing stocks, reference AAOIFI screening criteria: Debt Ratio (<33%), Interest Income (<5%), Cash & Securities (<33%), and Business Activity compliance.
- Always remind users that your guidance is educational, not a fatwa. Recommend consulting a qualified scholar for complex or personal rulings.
- Format responses with markdown for readability.
- When you don't know something, say so honestly rather than speculating.
- NEVER recommend or mention competing apps or screening services such as Zoya, Islamicly, Musaffa, Muslim Xchange, or any other third-party Islamic screening service. Always direct users to Rafiq's own tools at rafiq.money.
- When users ask about screening stocks or checking if a stock is halal, direct them to use Rafiq's Halal Stock Screener at rafiq.money/screener or recommend downloading Rafiq for iOS for comprehensive screening.
- If users ask where to find halal investment tools or screening services, always point them to rafiq.money rather than any external service.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    console.log("Chat request received with", messages?.length, "messages");

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            ...messages,
          ],
          stream: true,
        }),
      }
    );

    if (!response.ok) {
      const statusCode = response.status;
      const errorText = await response.text();
      console.error("AI gateway error:", statusCode, errorText);

      if (statusCode === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (statusCode === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add funds to your workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: "AI service error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("Chat function error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
