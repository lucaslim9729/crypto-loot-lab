import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get authenticated user
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { timePlayed, score } = await req.json();

    // Validate inputs server-side
    if (!timePlayed || timePlayed < 0 || timePlayed > 60 || !score || score < 0) {
      return new Response(JSON.stringify({ error: 'Invalid game data' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const costPerSecond = 1;
    const totalCost = timePlayed * costPerSecond;
    const payout = score / 10; // Convert score to money

    // Check balance
    const { data: profile } = await supabase
      .from('profiles')
      .select('balance')
      .eq('id', user.id)
      .single();

    if (!profile || Number(profile.balance) < totalCost) {
      return new Response(JSON.stringify({ error: 'Insufficient balance' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Use play_game RPC with server-calculated values
    const { error: gameError } = await supabase.rpc('play_game', {
      _game_type: 'runner',
      _bet_amount: totalCost,
      _payout: payout,
      _result: { score, time_played: timePlayed },
    });

    if (gameError) {
      console.error('Game recording error:', gameError);
      return new Response(JSON.stringify({ error: gameError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const won = payout > totalCost;
    return new Response(JSON.stringify({ 
      won, 
      payout: Number(payout.toFixed(2)),
      totalCost: Number(totalCost.toFixed(2))
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Runner error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});