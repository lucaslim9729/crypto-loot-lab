import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Profile {
  id: string;
  username: string;
}

interface UserListProps {
  onSelectUser: (userId: string, username: string) => void;
}

export const UserList = ({ onSelectUser }: UserListProps) => {
  const [users, setUsers] = useState<Profile[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setCurrentUserId(user.id);

    const { data, error } = await supabase
      .from("profiles")
      .select("id, username")
      .neq("id", user.id)
      .order("username", { ascending: true });

    if (error) {
      console.error("Error fetching users:", error);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      });
      return;
    }

    setUsers(data || []);
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-bold mb-4">Users</h3>
      <div className="space-y-2">
        {users.length === 0 ? (
          <p className="text-sm text-muted-foreground">No other users online</p>
        ) : (
          users.map((user) => (
            <div
              key={user.id}
              className="flex items-center justify-between p-2 rounded-lg hover:bg-accent transition-colors"
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs bg-primary/20 text-primary">
                    {user.username[0]?.toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">{user.username}</span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onSelectUser(user.id, user.username)}
              >
                <MessageSquare className="h-4 w-4" />
              </Button>
            </div>
          ))
        )}
      </div>
    </Card>
  );
};
