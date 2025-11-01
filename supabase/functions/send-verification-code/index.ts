import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VerificationRequest {
  email: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email }: VerificationRequest = await req.json();

    if (!email || !email.includes("@")) {
      return new Response(
        JSON.stringify({ error: "Invalid email address" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Rate limiting: Check codes sent to this email in last hour
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

    const { count: recentCodes } = await supabase
      .from("verification_codes")
      .select("*", { count: "exact", head: true })
      .eq("email", email)
      .gte("created_at", oneHourAgo.toISOString());

    if (recentCodes && recentCodes >= 3) {
      return new Response(
        JSON.stringify({ error: "Too many verification codes requested. Please try again later." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get IP address for additional rate limiting
    const ipAddress = req.headers.get("x-forwarded-for")?.split(",")[0] || 
                      req.headers.get("x-real-ip") || 
                      "unknown";

    // Rate limiting: Check codes sent from this IP in last hour
    const { count: ipCodes } = await supabase
      .from("verification_codes")
      .select("*", { count: "exact", head: true })
      .eq("ip_address", ipAddress)
      .gte("created_at", oneHourAgo.toISOString());

    if (ipCodes && ipCodes >= 5) {
      return new Response(
        JSON.stringify({ error: "Too many requests from your location. Please try again later." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store code in database (expires in 10 minutes)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);
    
    const { error: dbError } = await supabase
      .from("verification_codes")
      .insert({
        email,
        code,
        expires_at: expiresAt.toISOString(),
        ip_address: ipAddress,
      });

    if (dbError) {
      console.error("Database error:", dbError);
      throw new Error("Failed to store verification code");
    }

    // Send email
    const { error: emailError } = await resend.emails.send({
      from: "Crypto Gaming <onboarding@resend.dev>",
      to: [email],
      subject: "Your Verification Code",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #333; text-align: center;">Email Verification</h1>
          <p style="color: #666; font-size: 16px;">Thank you for signing up! Your verification code is:</p>
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 10px; text-align: center; margin: 30px 0;">
            <h2 style="color: white; font-size: 36px; letter-spacing: 8px; margin: 0;">${code}</h2>
          </div>
          <p style="color: #666; font-size: 14px;">This code will expire in 10 minutes.</p>
          <p style="color: #999; font-size: 12px; margin-top: 30px;">If you didn't request this code, please ignore this email.</p>
        </div>
      `,
    });

    if (emailError) {
      console.error("Email error:", emailError);
      
      // Provide specific error message for Resend domain verification
      if (emailError.message && emailError.message.includes("verify a domain")) {
        return new Response(
          JSON.stringify({ 
            error: "Email service not configured. Administrator needs to verify a domain at resend.com/domains to enable email sending to all users." 
          }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error("Failed to send verification email");
    }

    console.log(`Verification code sent to ${email}`);

    return new Response(
      JSON.stringify({ success: true, message: "Verification code sent" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in send-verification-code:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
