import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    console.log("Fetching metal prices...");

    // Using a free metals API (no key required)
    const response = await fetch(
      "https://api.metalpriceapi.com/v1/latest?api_key=demo&base=USD&currencies=XAU,XAG"
    );

    if (response.ok) {
      const data = await response.json();
      // XAU is gold price per troy ounce, XAG is silver price per troy ounce
      // 1 troy ounce = 31.1035 grams
      const goldPerOz = data.rates?.USDXAU ? 1 / data.rates.USDXAU : null;
      const silverPerOz = data.rates?.USDXAG ? 1 / data.rates.USDXAG : null;

      if (goldPerOz && silverPerOz) {
        const result = {
          goldPerGram: Math.round((goldPerOz / 31.1035) * 100) / 100,
          silverPerGram: Math.round((silverPerOz / 31.1035) * 100) / 100,
          goldPerOz: Math.round(goldPerOz * 100) / 100,
          silverPerOz: Math.round(silverPerOz * 100) / 100,
          source: "metalpriceapi",
          timestamp: new Date().toISOString(),
        };
        console.log("Metal prices fetched:", result);
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Fallback: try alternative free API
    console.log("Primary API failed, trying fallback...");
    const fallbackResp = await fetch("https://api.gold-api.com/price/XAU");
    if (fallbackResp.ok) {
      const goldData = await fallbackResp.json();
      const goldPerOz = goldData.price || 2650;
      
      const silverResp = await fetch("https://api.gold-api.com/price/XAG");
      const silverData = silverResp.ok ? await silverResp.json() : { price: 31 };
      const silverPerOz = silverData.price || 31;

      const result = {
        goldPerGram: Math.round((goldPerOz / 31.1035) * 100) / 100,
        silverPerGram: Math.round((silverPerOz / 31.1035) * 100) / 100,
        goldPerOz: Math.round(goldPerOz * 100) / 100,
        silverPerOz: Math.round(silverPerOz * 100) / 100,
        source: "gold-api-fallback",
        timestamp: new Date().toISOString(),
      };
      console.log("Fallback metal prices:", result);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Ultimate fallback with approximate market prices
    console.log("All APIs failed, using hardcoded fallback prices");
    const fallback = {
      goldPerGram: 85.2,
      silverPerGram: 1.0,
      goldPerOz: 2650,
      silverPerOz: 31,
      source: "fallback",
      timestamp: new Date().toISOString(),
    };
    return new Response(JSON.stringify(fallback), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Metal prices error:", e);
    // Return fallback on any error
    const fallback = {
      goldPerGram: 85.2,
      silverPerGram: 1.0,
      goldPerOz: 2650,
      silverPerOz: 31,
      source: "error-fallback",
      timestamp: new Date().toISOString(),
    };
    return new Response(JSON.stringify(fallback), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
