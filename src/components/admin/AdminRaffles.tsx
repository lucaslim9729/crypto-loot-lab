import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

interface Raffle {
  id: string;
  title: string;
  description: string;
  ticket_price: number;
  total_tickets: number;
  sold_tickets: number;
  status: string;
  draw_date: string;
  prizes: any;
}

export const AdminRaffles = () => {
  const [raffles, setRaffles] = useState<Raffle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    ticket_price: "",
    total_tickets: "",
    draw_date: "",
    prizes: ""
  });

  useEffect(() => {
    loadRaffles();
  }, []);

  const loadRaffles = async () => {
    try {
      const { data, error } = await supabase
        .from("raffles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRaffles(data || []);
    } catch (error: any) {
      toast.error("Failed to load raffles");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { error } = await supabase
        .from("raffles")
        .insert({
          title: formData.title,
          description: formData.description,
          ticket_price: parseFloat(formData.ticket_price),
          total_tickets: parseInt(formData.total_tickets),
          draw_date: new Date(formData.draw_date).toISOString(),
          prizes: JSON.parse(formData.prizes || "[]"),
          status: "active"
        });

      if (error) throw error;

      toast.success("Raffle created successfully");
      setShowForm(false);
      setFormData({ title: "", description: "", ticket_price: "", total_tickets: "", draw_date: "", prizes: "" });
      loadRaffles();
    } catch (error: any) {
      toast.error(`Failed to create raffle: ${error.message}`);
    }
  };

  const deleteRaffle = async (id: string) => {
    if (!confirm("Are you sure you want to delete this raffle?")) return;

    try {
      const { error } = await supabase
        .from("raffles")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Raffle deleted");
      loadRaffles();
    } catch (error: any) {
      toast.error("Failed to delete raffle");
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading raffles...</div>;
  }

  return (
    <div className="space-y-6">
      <Button onClick={() => setShowForm(!showForm)}>
        <Plus className="h-4 w-4 mr-2" />
        {showForm ? "Cancel" : "Create Raffle"}
      </Button>

      {showForm && (
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="ticket_price">Ticket Price</Label>
                  <Input
                    id="ticket_price"
                    type="number"
                    step="0.01"
                    value={formData.ticket_price}
                    onChange={(e) => setFormData({ ...formData, ticket_price: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="total_tickets">Total Tickets</Label>
                  <Input
                    id="total_tickets"
                    type="number"
                    value={formData.total_tickets}
                    onChange={(e) => setFormData({ ...formData, total_tickets: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="draw_date">Draw Date</Label>
                <Input
                  id="draw_date"
                  type="datetime-local"
                  value={formData.draw_date}
                  onChange={(e) => setFormData({ ...formData, draw_date: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="prizes">Prizes (JSON array)</Label>
                <Textarea
                  id="prizes"
                  placeholder='[{"place": 1, "amount": 1000}]'
                  value={formData.prizes}
                  onChange={(e) => setFormData({ ...formData, prizes: e.target.value })}
                />
              </div>
              <Button type="submit">Create Raffle</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {raffles.map((raffle) => (
          <Card key={raffle.id}>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold">{raffle.title}</h3>
                  <p className="text-muted-foreground">{raffle.description}</p>
                  <div className="flex gap-2">
                    <Badge>{raffle.status}</Badge>
                    <Badge variant="secondary">
                      {raffle.sold_tickets}/{raffle.total_tickets} sold
                    </Badge>
                    <Badge variant="outline">${Number(raffle.ticket_price).toFixed(2)}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Draw: {new Date(raffle.draw_date).toLocaleString()}
                  </p>
                </div>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => deleteRaffle(raffle.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {raffles.length === 0 && (
        <p className="text-center text-muted-foreground py-8">No raffles found</p>
      )}
    </div>
  );
};