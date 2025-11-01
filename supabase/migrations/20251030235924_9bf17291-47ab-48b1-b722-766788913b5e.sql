-- Drop the user_stats view entirely to prevent data exposure
DROP VIEW IF EXISTS public.user_stats CASCADE;

-- Create a security definer function for safe stats access instead
CREATE OR REPLACE FUNCTION public.get_user_stats(_user_id uuid DEFAULT NULL)
RETURNS TABLE (
  id uuid,
  username text,
  balance numeric,
  total_wagered numeric,
  total_won numeric,
  games_played bigint,
  referrals_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If user_id is provided, check permissions
  IF _user_id IS NOT NULL THEN
    -- Users can only see their own stats unless they're admin
    IF auth.uid() != _user_id AND NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
      RAISE EXCEPTION 'Insufficient permissions';
    END IF;
    
    RETURN QUERY
    SELECT 
      p.id,
      p.username,
      p.balance,
      p.total_wagered,
      p.total_won,
      COUNT(DISTINCT gh.id) as games_played,
      COUNT(DISTINCT pr.id) as referrals_count
    FROM public.profiles p
    LEFT JOIN public.game_history gh ON gh.user_id = p.id
    LEFT JOIN public.profiles pr ON pr.referred_by = p.id
    WHERE p.id = _user_id
    GROUP BY p.id, p.username, p.balance, p.total_wagered, p.total_won;
  ELSE
    -- No user_id provided, only admins can see all stats
    IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
      RAISE EXCEPTION 'Admin access required';
    END IF;
    
    RETURN QUERY
    SELECT 
      p.id,
      p.username,
      p.balance,
      p.total_wagered,
      p.total_won,
      COUNT(DISTINCT gh.id) as games_played,
      COUNT(DISTINCT pr.id) as referrals_count
    FROM public.profiles p
    LEFT JOIN public.game_history gh ON gh.user_id = p.id
    LEFT JOIN public.profiles pr ON pr.referred_by = p.id
    GROUP BY p.id, p.username, p.balance, p.total_wagered, p.total_won;
  END IF;
END;
$$;