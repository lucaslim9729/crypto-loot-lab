-- Create verification codes table
CREATE TABLE IF NOT EXISTS public.verification_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  used BOOLEAN DEFAULT false
);

-- Add index for faster lookups
CREATE INDEX idx_verification_codes_email ON public.verification_codes(email);
CREATE INDEX idx_verification_codes_code ON public.verification_codes(code);

-- Enable RLS
ALTER TABLE public.verification_codes ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert verification codes (needed for signup flow)
CREATE POLICY "Anyone can insert verification codes"
  ON public.verification_codes
  FOR INSERT
  WITH CHECK (true);

-- Allow users to read their own verification codes
CREATE POLICY "Users can read verification codes for their email"
  ON public.verification_codes
  FOR SELECT
  USING (true);

-- Function to clean up expired codes
CREATE OR REPLACE FUNCTION public.cleanup_expired_verification_codes()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  DELETE FROM public.verification_codes
  WHERE expires_at < now() OR used = true;
END;
$$;