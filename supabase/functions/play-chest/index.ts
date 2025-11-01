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

    const { tierName, tierPrice, maxMultiplier } = await req.json();

    // Validate inputs server-side
    const validTiers = {
      'Bronze Chest': { price: 100, maxMultiplier: 3 },
      'Silver Chest': { price: 500, maxMultiplier: 5 },
      'Gold Chest': { price: 1000, maxMultiplier: 8 },
      'Diamond Chest': { price: 5000, maxMultiplier: 15 },
    };

    const validTier = validTiers[tierName as keyof typeof validTiers];
    if (!validTier || tierPrice !== validTier.price || maxMultiplier !== validTier.maxMultiplier) {
      return new Response(JSON.stringify({ error: 'Invalid tier data' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check balance
    const { data: profile } = await supabase
      .from('profiles')
      .select('balance')
      .eq('id', user.id)
      .single();

    if (!profile || Number(profile.balance) < tierPrice) {
      return new Response(JSON.stringify({ error: 'Insufficient balance' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // SERVER determines outcome (cannot be manipulated by client)
    const won = Math.random() > 0.5; // 50% win rate
    
    let prizeAmount = 0;
    let prizeType = "Nothing";

    if (won) {
      const multiplier = 0.5 + Math.random() * maxMultiplier;
      prizeAmount = tierPrice * multiplier;
      
      // Determine prize type based on amount
      if (multiplier > maxMultiplier * 0.8) {
        prizeType = "USDT";
      } else if (multiplier > maxMultiplier * 0.5) {
        prizeType = "BTC";
      } else {
        prizeType = "Bonus Coins";
      }
    }

    // Use play_game RPC with server-determined values
    const { error: gameError } = await supabase.rpc('play_game', {
      _game_type: `chest_${tierName}`,
      _bet_amount: tierPrice,
      _payout: prizeAmount,
      _result: { chest_type: tierName, prize: won ? 'win' : 'lose', prize_type: prizeType },
    });

    if (gameError) {
      console.error('Game recording error:', gameError);
      return new Response(JSON.stringify({ error: gameError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ 
      won, 
      prizeAmount: Number(prizeAmount.toFixed(2)),
      prizeType 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Chest error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});