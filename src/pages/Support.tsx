import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, MessageSquare, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const Support = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    subject: "",
    message: "",
    priority: "normal",
  });

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from("support_tickets")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTickets(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.subject.trim() || !formData.message.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("support_tickets").insert({
        user_id: user.id,
        subject: formData.subject,
        message: formData.message,
        priority: formData.priority,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Support ticket created successfully",
      });

      setFormData({ subject: "", message: "", priority: "normal" });
      setShowCreateForm(false);
      loadTickets();
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

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="container mx-auto max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="outline"
            onClick={() => navigate("/dashboard")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>

          <Button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-gradient-primary"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Ticket
          </Button>
        </div>

        <h1 className="text-4xl font-bold mb-8 bg-gradient-primary bg-clip-text text-transparent">
          Support Center
        </h1>

        {/* Create Ticket Form */}
        {showCreateForm && (
          <Card className="bg-gradient-card border-border p-6 mb-8">
            <h2 className="text-2xl font-bold mb-4 text-foreground">Create Support Ticket</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">Subject</label>
                <Input
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Brief description of your issue"
                  maxLength={200}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">Priority</label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData({ ...formData, priority: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">Message</label>
                <Textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Describe your issue in detail..."
                  rows={6}
                  maxLength={2000}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {formData.message.length}/2000 characters
                </p>
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="bg-gradient-primary">
                  Submit Ticket
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Tickets List */}
        <Card className="bg-gradient-card border-border p-6">
          <h2 className="text-2xl font-bold mb-4 text-foreground">Your Tickets</h2>
          
          {tickets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p>No support tickets yet</p>
              <Button
                onClick={() => setShowCreateForm(true)}
                className="mt-4 bg-gradient-primary"
              >
                Create Your First Ticket
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  onClick={() => navigate(`/support/${ticket.id}`)}
                  className="p-4 bg-background/50 rounded-lg border border-border hover:border-primary transition-all cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-bold text-foreground">{ticket.subject}</h3>
                    <div className="flex gap-2">
                      <Badge className={getPriorityColor(ticket.priority)}>
                        {ticket.priority}
                      </Badge>
                      <Badge className={getStatusColor(ticket.status)}>
                        {ticket.status.replace("_", " ")}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                    {ticket.message}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Created {new Date(ticket.created_at).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Support;
