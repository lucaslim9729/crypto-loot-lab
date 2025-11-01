import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Require authentication
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with service role key to access all users
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user is admin
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userAuthError } = await supabase.auth.getUser(token);

    if (userAuthError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid authentication" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user has admin role
    const { data: userRole } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    if (!userRole) {
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Starting lucky day email campaign...");

    // Get all user emails from auth.users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error("Error fetching users:", authError);
      throw authError;
    }

    console.log(`Found ${authUsers.users.length} users to email`);

    const emailPromises = authUsers.users.map(async (user) => {
      if (!user.email) {
        console.log(`Skipping user ${user.id} - no email`);
        return null;
      }

      try {
        const emailResponse = await resend.emails.send({
          from: "Crypto Loot Lab <onboarding@resend.dev>",
          to: [user.email],
          subject: "🎰 Today is Your Lucky Day!",
          html: `
            <!DOCTYPE html>
            <html>
              <head>
                <style>
                  body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    margin: 0;
                    padding: 40px 20px;
                  }
                  .container {
                    max-width: 600px;
                    margin: 0 auto;
                    background: white;
                    border-radius: 16px;
                    overflow: hidden;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                  }
                  .header {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    padding: 40px;
                    text-align: center;
                  }
                  .header h1 {
                    color: white;
                    margin: 0;
                    font-size: 32px;
                    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
                  }
                  .content {
                    padding: 40px;
                  }
                  .content h2 {
                    color: #333;
                    font-size: 24px;
                    margin-top: 0;
                  }
                  .content p {
                    color: #666;
                    line-height: 1.6;
                    font-size: 16px;
                  }
                  .cta-button {
                    display: inline-block;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 16px 32px;
                    text-decoration: none;
                    border-radius: 8px;
                    font-weight: bold;
                    margin: 20px 0;
                    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
                  }
                  .features {
                    background: #f8f9fa;
                    padding: 20px;
                    border-radius: 8px;
                    margin: 20px 0;
                  }
                  .feature-item {
                    margin: 10px 0;
                    color: #555;
                  }
                  .feature-item::before {
                    content: "✨ ";
                  }
                  .footer {
                    background: #f8f9fa;
                    padding: 20px;
                    text-align: center;
                    color: #999;
                    font-size: 14px;
                  }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <h1>🎰 Today is Your Lucky Day!</h1>
                  </div>
                  <div class="content">
                    <h2>Fortune Favors the Bold 🍀</h2>
                    <p>We've got an exciting feeling about today, and we wanted you to be the first to know!</p>
                    
                    <div class="features">
                      <div class="feature-item">Extra bonus on your next deposit</div>
                      <div class="feature-item">Exclusive access to premium games</div>
                      <div class="feature-item">Mystery rewards waiting for you</div>
                      <div class="feature-item">Special raffle entries available</div>
                    </div>

                    <p>Don't let this opportunity slip away. The stars are aligned, and your lucky streak is just one click away!</p>

                    <center>
                      <a href="${supabaseUrl.replace('https://crhmgsmprzcsgbypvhvz.supabase.co', 'https://crhmgsmprzcsgbypvhvz-crhmgsmprzcsgbypvhvz.lovable.app')}/dashboard" class="cta-button">
                        Claim Your Luck Now 🎁
                      </a>
                    </center>

                    <p style="margin-top: 30px; font-size: 14px; color: #999;">
                      💯 100% Anonymous | 🔒 Bank-Grade Security | 🚫 Zero Data Collection
                    </p>
                  </div>
                  <div class="footer">
                    <p>© 2025 Crypto Loot Lab. All rights reserved.</p>
                    <p>Your privacy is our priority. Play responsibly.</p>
                  </div>
                </div>
              </body>
            </html>
          `,
        });

        console.log(`Email sent to ${user.email}:`, emailResponse);
        return emailResponse;
      } catch (error) {
        console.error(`Error sending email to ${user.email}:`, error);
        return null;
      }
    });

    const results = await Promise.allSettled(emailPromises);
    const successful = results.filter(r => r.status === "fulfilled" && r.value !== null).length;
    const failed = results.length - successful;

    console.log(`Email campaign complete: ${successful} sent, ${failed} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        sent: successful,
        failed: failed,
        total: authUsers.users.length,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-lucky-day-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
