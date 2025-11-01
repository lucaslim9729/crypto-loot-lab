import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

interface Announcement {
  id: string;
  message: string;
  type: string;
  is_active: boolean;
  created_at: string;
}

export const AdminAnnouncements = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    message: "",
    type: "win"
  });

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    try {
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAnnouncements(data || []);
    } catch (error: any) {
      toast.error("Failed to load announcements");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { error } = await supabase
        .from("announcements")
        .insert({
          message: formData.message,
          type: formData.type,
          is_active: true
        });

      if (error) throw error;

      toast.success("Announcement created");
      setShowForm(false);
      setFormData({ message: "", type: "win" });
      loadAnnouncements();
    } catch (error: any) {
      toast.error(`Failed to create announcement: ${error.message}`);
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("announcements")
        .update({ is_active: !currentStatus })
        .eq("id", id);

      if (error) throw error;

      toast.success("Status updated");
      loadAnnouncements();
    } catch (error: any) {
      toast.error("Failed to update status");
    }
  };

  const deleteAnnouncement = async (id: string) => {
    if (!confirm("Delete this announcement?")) return;

    try {
      const { error } = await supabase
        .from("announcements")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Announcement deleted");
      loadAnnouncements();
    } catch (error: any) {
      toast.error("Failed to delete announcement");
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading announcements...</div>;
  }

  return (
    <div className="space-y-6">
      <Button onClick={() => setShowForm(!showForm)}>
        <Plus className="h-4 w-4 mr-2" />
        {showForm ? "Cancel" : "Create Announcement"}
      </Button>

      {showForm && (
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="message">Message</Label>
                <Input
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Player123 won $1000 on Mega Raffle!"
                  required
                />
              </div>
              <div>
                <Label htmlFor="type">Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="win">Win</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="promo">Promo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit">Create</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {announcements.map((announcement) => (
          <Card key={announcement.id}>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant={announcement.type === "win" ? "default" : "secondary"}>
                      {announcement.type}
                    </Badge>
                    {announcement.is_active && <Badge variant="outline">Active</Badge>}
                  </div>
                  <p>{announcement.message}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(announcement.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={announcement.is_active}
                    onCheckedChange={() => toggleActive(announcement.id, announcement.is_active)}
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => deleteAnnouncement(announcement.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {announcements.length === 0 && (
        <p className="text-center text-muted-foreground py-8">No announcements found</p>
      )}
    </div>
  );
};