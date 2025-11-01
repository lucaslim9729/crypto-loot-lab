-- Create process_withdrawal RPC to handle atomic withdrawal approvals
CREATE OR REPLACE FUNCTION public.process_withdrawal(
  _withdrawal_id uuid,
  _user_id uuid,
  _amount numeric
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
  WHERE id = _user_id
  FOR UPDATE;
  
  -- Check sufficient balance
  IF current_balance IS NULL OR current_balance < _amount THEN
    RAISE EXCEPTION 'Insufficient balance for withdrawal';
  END IF;
  
  -- Deduct balance
  UPDATE profiles
  SET balance = balance - _amount
  WHERE id = _user_id;
  
  -- Update withdrawal status in same transaction
  UPDATE withdrawals
  SET status = 'completed'
  WHERE id = _withdrawal_id;
END;
$$;