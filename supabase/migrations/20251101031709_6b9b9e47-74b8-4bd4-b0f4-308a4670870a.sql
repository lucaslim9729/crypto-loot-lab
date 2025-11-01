-- Fix verification codes RLS policy - prevent client-side reads
DROP POLICY IF EXISTS "Users can read verification codes for their email" ON public.verification_codes;
DROP POLICY IF EXISTS "Anyone can insert verification codes" ON public.verification_codes;

-- Nobody can read codes from client
CREATE POLICY "Service role only can read codes"
  ON public.verification_codes
  FOR SELECT
  USING (false);

-- Allow inserts from edge function (service role)
CREATE POLICY "Service role can insert codes"
  ON public.verification_codes
  FOR INSERT
  WITH CHECK (true);

-- Allow updates from edge function (service role)
CREATE POLICY "Service role can update codes"
  ON public.verification_codes
  FOR UPDATE
  USING (true);

-- Add rate limiting columns
ALTER TABLE public.verification_codes 
ADD COLUMN IF NOT EXISTS ip_address text;

-- Create index for rate limiting queries
CREATE INDEX IF NOT EXISTS idx_verification_codes_email_created 
  ON public.verification_codes(email, created_at);
  
CREATE INDEX IF NOT EXISTS idx_verification_codes_ip_created 
  ON public.verification_codes(ip_address, created_at);