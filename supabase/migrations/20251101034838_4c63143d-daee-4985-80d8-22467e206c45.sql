-- Create messages table for global chat
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  edited_at timestamptz,
  is_deleted boolean DEFAULT false
);

-- Add indexes for performance
CREATE INDEX idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX idx_messages_user_id ON public.messages(user_id);

-- Enable Row Level Security
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Everyone can read non-deleted messages
CREATE POLICY "Everyone can read messages"
ON public.messages
FOR SELECT
USING (NOT is_deleted AND auth.uid() IS NOT NULL);

-- Users can insert their own messages
CREATE POLICY "Users can send messages"
ON public.messages
FOR INSERT
WITH CHECK (auth.uid() = user_id AND auth.uid() IS NOT NULL);

-- Users can update/delete their own messages
CREATE POLICY "Users can edit own messages"
ON public.messages
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Admins can delete any message
CREATE POLICY "Admins can delete any message"
ON public.messages
FOR UPDATE
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;