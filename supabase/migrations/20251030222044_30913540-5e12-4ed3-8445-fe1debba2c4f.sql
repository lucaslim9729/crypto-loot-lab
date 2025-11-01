-- Fix security definer view by enabling security invoker mode
-- This ensures the view respects RLS policies of the querying user

DROP VIEW IF EXISTS public.user_stats;

CREATE VIEW public.user_stats 
WITH (security_invoker=on) AS
SELECT 
  p.id,
  p.username,
  p.balance,
  p.total_wagered,
  p.total_won,
  COUNT(DISTINCT gh.id) as games_played,
  (SELECT COUNT(*) FROM profiles WHERE referred_by = p.id) as referrals_count
FROM public.profiles p
LEFT JOIN public.game_history gh ON gh.user_id = p.id
GROUP BY p.id, p.username, p.balance, p.total_wagered, p.total_won;

-- Grant access
GRANT SELECT ON public.user_stats TO authenticated;

COMMENT ON VIEW public.user_stats IS 'Aggregated user statistics with security invoker mode';