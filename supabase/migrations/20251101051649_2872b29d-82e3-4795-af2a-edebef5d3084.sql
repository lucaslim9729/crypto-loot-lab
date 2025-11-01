-- Create app role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create user_roles table for role-based access control
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert roles"
ON public.user_roles FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
ON public.user_roles FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create messages table for chat
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for messages
CREATE POLICY "Users can view non-deleted messages"
ON public.messages FOR SELECT
TO authenticated
USING (is_deleted = false OR auth.uid() = user_id);

CREATE POLICY "Users can insert their own messages"
ON public.messages FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own messages"
ON public.messages FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all messages"
ON public.messages FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create play_game RPC for atomic game balance updates
CREATE OR REPLACE FUNCTION public.play_game(
  _game_type text,
  _bet_amount numeric,
  _payout numeric,
  _result jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_balance numeric;
BEGIN
  -- Lock profile row and get balance
  SELECT balance INTO current_balance
  FROM profiles
  WHERE id = auth.uid()
  FOR UPDATE;
  
  -- Check sufficient balance
  IF current_balance IS NULL OR current_balance < _bet_amount THEN
    RAISE EXCEPTION 'Insufficient balance for bet';
  END IF;
  
  -- Update balance atomically
  UPDATE profiles
  SET 
    balance = balance - _bet_amount + _payout,
    total_wagered = total_wagered + _bet_amount,
    total_won = total_won + _payout
  WHERE id = auth.uid();
  
  -- Insert game history
  INSERT INTO game_history (user_id, game_type, bet_amount, payout, result)
  VALUES (auth.uid(), _game_type, _bet_amount, _payout, _result);
END;
$$;