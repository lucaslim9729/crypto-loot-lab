import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VerifyRequest {
  email: string;
  code: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, code }: VerifyRequest = await req.json();

    if (!email || !code) {
      return new Response(
        JSON.stringify({ valid: false, error: "Email and code are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Rate limiting: Check failed attempts in last 5 minutes
    const fiveMinutesAgo = new Date();
    fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);

    const { count: failedAttempts } = await supabase
      .from("verification_codes")
      .select("*", { count: "exact", head: true })
      .eq("email", email)
      .gte("created_at", fiveMinutesAgo.toISOString());

    if (failedAttempts && failedAttempts > 5) {
      return new Response(
        JSON.stringify({ valid: false, error: "Too many attempts. Please try again later." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify code using service role (bypasses RLS)
    const { data: verificationCode, error: fetchError } = await supabase
      .from("verification_codes")
      .select("*")
      .eq("email", email)
      .eq("code", code)
      .eq("used", false)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (fetchError || !verificationCode) {
      console.log("Verification failed for email:", email);
      return new Response(
        JSON.stringify({ valid: false, error: "Invalid or expired code" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Mark code as used
    const { error: updateError } = await supabase
      .from("verification_codes")
      .update({ used: true })
      .eq("id", verificationCode.id);

    if (updateError) {
      console.error("Error marking code as used:", updateError);
      throw new Error("Failed to mark code as used");
    }

    console.log(`Code verified successfully for email: ${email}`);

    return new Response(
      JSON.stringify({ valid: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in verify-code:", error);
    return new Response(
      JSON.stringify({ valid: false, error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
