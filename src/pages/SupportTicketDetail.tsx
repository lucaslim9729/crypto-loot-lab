import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const SupportTicketDetail = () => {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [ticket, setTicket] = useState<any>(null);
  const [replies, setReplies] = useState<any[]>([]);
  const [newReply, setNewReply] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTicketData();
  }, [ticketId]);

  const loadTicketData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      // Load ticket
      const { data: ticketData, error: ticketError } = await supabase
        .from("support_tickets")
        .select("*")
        .eq("id", ticketId)
        .eq("user_id", user.id)
        .single();

      if (ticketError) throw ticketError;
      setTicket(ticketData);

      // Load replies
      const { data: repliesData, error: repliesError } = await supabase
        .from("ticket_replies")
        .select("*")
        .eq("ticket_id", ticketId)
        .order("created_at", { ascending: true });

      if (repliesError) throw repliesError;
      setReplies(repliesData || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      navigate("/support");
    } finally {
      setLoading(false);
    }
  };

  const handleSendReply = async () => {
    if (!newReply.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a message",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("ticket_replies").insert({
        ticket_id: ticketId,
        user_id: user.id,
        message: newReply,
        is_staff: false,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Reply sent successfully",
      });

      setNewReply("");
      loadTicketData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open": return "bg-blue-500";
      case "in_progress": return "bg-yellow-500";
      case "resolved": return "bg-green-500";
      case "closed": return "bg-gray-500";
      default: return "bg-gray-500";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "low": return "bg-gray-500";
      case "normal": return "bg-blue-500";
      case "high": return "bg-orange-500";
      case "urgent": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-foreground">Loading...</div>
      </div>
    );
  }

  if (!ticket) return null;

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="container mx-auto max-w-4xl">
        <Button
          variant="outline"
          onClick={() => navigate("/support")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Support
        </Button>

        {/* Ticket Header */}
        <Card className="bg-gradient-card border-border p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">{ticket.subject}</h1>
              <p className="text-sm text-muted-foreground">
                Created {new Date(ticket.created_at).toLocaleString()}
              </p>
            </div>
            <div className="flex gap-2">
              <Badge className={getPriorityColor(ticket.priority)}>
                {ticket.priority}
              </Badge>
              <Badge className={getStatusColor(ticket.status)}>
                {ticket.status.replace("_", " ")}
              </Badge>
            </div>
          </div>

          <div className="p-4 bg-background/50 rounded-lg border border-border">
            <p className="text-foreground whitespace-pre-wrap">{ticket.message}</p>
          </div>
        </Card>

        {/* Replies */}
        {replies.length > 0 && (
          <Card className="bg-gradient-card border-border p-6 mb-6">
            <h2 className="text-xl font-bold mb-4 text-foreground">Conversation</h2>
            <div className="space-y-4">
              {replies.map((reply) => (
                <div
                  key={reply.id}
                  className={`p-4 rounded-lg ${
                    reply.is_staff
                      ? "bg-primary/10 border-l-4 border-primary"
                      : "bg-background/50 border border-border"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={reply.is_staff ? "default" : "outline"}>
                      {reply.is_staff ? "Support Team" : "You"}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(reply.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-foreground whitespace-pre-wrap">{reply.message}</p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Reply Form */}
        {ticket.status !== "closed" && (
          <Card className="bg-gradient-card border-border p-6">
            <h2 className="text-xl font-bold mb-4 text-foreground">Add Reply</h2>
            <div className="space-y-4">
              <Textarea
                value={newReply}
                onChange={(e) => setNewReply(e.target.value)}
                placeholder="Type your reply..."
                rows={4}
                maxLength={2000}
              />
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  {newReply.length}/2000 characters
                </p>
                <Button
                  onClick={handleSendReply}
                  className="bg-gradient-primary"
                  disabled={!newReply.trim()}
                >
                  <Send className="mr-2 h-4 w-4" />
                  Send Reply
                </Button>
              </div>
            </div>
          </Card>
        )}

        {ticket.status === "closed" && (
          <Card className="bg-gradient-card border-border p-6">
            <p className="text-center text-muted-foreground">
              This ticket has been closed. Please create a new ticket if you need further assistance.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SupportTicketDetail;
