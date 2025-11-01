
-- Migration: 20251029175713

-- Migration: 20251028160323
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  balance DECIMAL(20, 2) DEFAULT 1000.00 NOT NULL CHECK (balance >= 0),
  total_wagered DECIMAL(20, 2) DEFAULT 0 NOT NULL,
  total_won DECIMAL(20, 2) DEFAULT 0 NOT NULL,
  referral_code TEXT UNIQUE NOT NULL,
  referred_by UUID REFERENCES public.profiles(id),
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Game history table
CREATE TABLE public.game_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  game_type TEXT NOT NULL,
  bet_amount DECIMAL(20, 2) NOT NULL,
  payout DECIMAL(20, 2) DEFAULT 0,
  result JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Deposits table
CREATE TABLE public.deposits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(20, 2) NOT NULL,
  currency TEXT DEFAULT 'USDT',
  network TEXT DEFAULT 'BEP-20',
  tx_hash TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  verification_type TEXT DEFAULT 'auto' CHECK (verification_type IN ('auto', 'manual')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Withdrawals table
CREATE TABLE public.withdrawals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(20, 2) NOT NULL,
  currency TEXT DEFAULT 'USDT',
  network TEXT DEFAULT 'BEP-20',
  wallet_address TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Raffles table
CREATE TABLE public.raffles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  ticket_price DECIMAL(20, 2) NOT NULL,
  total_tickets INTEGER NOT NULL,
  sold_tickets INTEGER DEFAULT 0,
  prizes JSONB NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  draw_date TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Raffle tickets table
CREATE TABLE public.raffle_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  raffle_id UUID REFERENCES public.raffles(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  ticket_number INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(raffle_id, ticket_number)
);

-- Support tickets table
CREATE TABLE public.support_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'closed')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Support ticket replies table
CREATE TABLE public.ticket_replies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID REFERENCES public.support_tickets(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  message TEXT NOT NULL,
  is_staff BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Announcements table
CREATE TABLE public.announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message TEXT NOT NULL,
  type TEXT DEFAULT 'win' CHECK (type IN ('win', 'promotion', 'update', 'warning')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.raffles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.raffle_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
);

-- RLS Policies for game_history
CREATE POLICY "Users can view own game history" ON public.game_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own game history" ON public.game_history FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for deposits
CREATE POLICY "Users can view own deposits" ON public.deposits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create deposits" ON public.deposits FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all deposits" ON public.deposits FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
);
CREATE POLICY "Admins can update deposits" ON public.deposits FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
);

-- RLS Policies for withdrawals
CREATE POLICY "Users can view own withdrawals" ON public.withdrawals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create withdrawals" ON public.withdrawals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all withdrawals" ON public.withdrawals FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
);
CREATE POLICY "Admins can update withdrawals" ON public.withdrawals FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
);

-- RLS Policies for raffles
CREATE POLICY "Everyone can view active raffles" ON public.raffles FOR SELECT USING (status = 'active' OR auth.uid() IS NOT NULL);
CREATE POLICY "Admins can manage raffles" ON public.raffles FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
);

-- RLS Policies for raffle_tickets
CREATE POLICY "Users can view own tickets" ON public.raffle_tickets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can buy tickets" ON public.raffle_tickets FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for support_tickets
CREATE POLICY "Users can view own tickets" ON public.support_tickets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create tickets" ON public.support_tickets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all tickets" ON public.support_tickets FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
);

-- RLS Policies for ticket_replies
CREATE POLICY "Users can view replies to own tickets" ON public.ticket_replies FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.support_tickets WHERE id = ticket_id AND user_id = auth.uid())
);
CREATE POLICY "Users can reply to own tickets" ON public.ticket_replies FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.support_tickets WHERE id = ticket_id AND user_id = auth.uid())
);

-- RLS Policies for announcements
CREATE POLICY "Everyone can view active announcements" ON public.announcements FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Admins can manage announcements" ON public.announcements FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
);

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  exists_code BOOLEAN;
BEGIN
  LOOP
    code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8));
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE referral_code = code) INTO exists_code;
    EXIT WHEN NOT exists_code;
  END LOOP;
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, referral_code)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1)),
    generate_referral_code()
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update balance after game
CREATE OR REPLACE FUNCTION update_user_balance()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles
  SET 
    balance = balance - NEW.bet_amount + NEW.payout,
    total_wagered = total_wagered + NEW.bet_amount,
    total_won = total_won + NEW.payout
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_game_played
  AFTER INSERT ON public.game_history
  FOR EACH ROW EXECUTE FUNCTION update_user_balance();


-- Migration: 20251030145929
-- =====================================================
-- MISSION 1 & 4: Fix RLS Recursion + Proper User Roles
-- =====================================================

-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  granted_by uuid REFERENCES auth.users(id),
  granted_at timestamptz DEFAULT now(),
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (prevents recursion)
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
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Migrate existing admins to user_roles table
INSERT INTO public.user_roles (user_id, role, granted_at)
SELECT id, 'admin'::app_role, created_at
FROM public.profiles
WHERE is_admin = true;

-- RLS policy for user_roles (only admins can manage roles)
CREATE POLICY "Only admins can manage roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Drop the recursive admin policies and recreate with has_role function
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all deposits" ON public.deposits;
DROP POLICY IF EXISTS "Admins can update deposits" ON public.deposits;
DROP POLICY IF EXISTS "Admins can view all withdrawals" ON public.withdrawals;
DROP POLICY IF EXISTS "Admins can update withdrawals" ON public.withdrawals;
DROP POLICY IF EXISTS "Admins can view all tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Admins can manage raffles" ON public.raffles;
DROP POLICY IF EXISTS "Admins can manage announcements" ON public.announcements;

-- Recreate policies using security definer function
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all deposits"
ON public.deposits
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update deposits"
ON public.deposits
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all withdrawals"
ON public.withdrawals
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update withdrawals"
ON public.withdrawals
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all tickets"
ON public.support_tickets
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage raffles"
ON public.raffles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage announcements"
ON public.announcements
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- =====================================================
-- MISSION 3: Game Balance Locking (Prevent Race Conditions)
-- =====================================================

-- Create atomic game play function with row locking
CREATE OR REPLACE FUNCTION public.play_game(
  _game_type text,
  _bet_amount numeric,
  _payout numeric,
  _result jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid := auth.uid();
  _game_id uuid;
  _current_balance numeric;
BEGIN
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Lock the user's profile row to prevent race conditions
  SELECT balance INTO _current_balance
  FROM profiles
  WHERE id = _user_id
  FOR UPDATE;
  
  -- Check sufficient balance
  IF _current_balance < _bet_amount THEN
    RAISE EXCEPTION 'Insufficient balance. Current: %, Required: %', _current_balance, _bet_amount;
  END IF;
  
  -- Insert game history
  INSERT INTO game_history (user_id, game_type, bet_amount, payout, result)
  VALUES (_user_id, _game_type, _bet_amount, _payout, _result)
  RETURNING id INTO _game_id;
  
  -- Update balance atomically
  UPDATE profiles
  SET 
    balance = balance - _bet_amount + _payout,
    total_wagered = total_wagered + _bet_amount,
    total_won = total_won + _payout
  WHERE id = _user_id;
  
  RETURN _game_id;
END;
$$;

-- Remove the trigger since we're using RPC now
DROP TRIGGER IF EXISTS update_balance_trigger ON public.game_history;

-- Keep the function for backward compatibility but make it no-op
CREATE OR REPLACE FUNCTION public.update_user_balance()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- This is now handled by play_game RPC
  -- Kept for any legacy direct inserts
  UPDATE public.profiles
  SET 
    balance = balance - NEW.bet_amount + NEW.payout,
    total_wagered = total_wagered + NEW.bet_amount,
    total_won = total_won + NEW.payout
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$;

-- Migration: 20251030150025
-- Fix function search_path warnings
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, referral_code)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1)),
    generate_referral_code()
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  code TEXT;
  exists_code BOOLEAN;
BEGIN
  LOOP
    code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8));
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE referral_code = code) INTO exists_code;
    EXIT WHEN NOT exists_code;
  END LOOP;
  RETURN code;
END;
$$;

-- Migration: 20251030150051
-- Fix the last function search_path warning
CREATE OR REPLACE FUNCTION public.update_user_balance()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- This is now handled by play_game RPC
  -- Kept for any legacy direct inserts
  UPDATE public.profiles
  SET 
    balance = balance - NEW.bet_amount + NEW.payout,
    total_wagered = total_wagered + NEW.bet_amount,
    total_won = total_won + NEW.payout
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$;
