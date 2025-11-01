-- Allow admins to update support tickets (change status, priority)
CREATE POLICY "Admins can update tickets"
ON public.support_tickets
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to insert replies to any ticket
CREATE POLICY "Admins can reply to any ticket"
ON public.ticket_replies
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to view all ticket replies
CREATE POLICY "Admins can view all replies"
ON public.ticket_replies
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));