import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface User {
  id: string;
  username: string;
  balance: number;
  total_wagered: number;
  total_won: number;
  referral_code: string;
  created_at: string;
}

export const AdminUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error: any) {
      toast.error("Failed to load users");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading users...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Username</TableHead>
              <TableHead>Balance</TableHead>
              <TableHead>Wagered</TableHead>
              <TableHead>Won</TableHead>
              <TableHead>Referral Code</TableHead>
              <TableHead>Joined</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.username}</TableCell>
                <TableCell>
                  <Badge variant="secondary">${Number(user.balance).toFixed(2)}</Badge>
                </TableCell>
                <TableCell>${Number(user.total_wagered).toFixed(2)}</TableCell>
                <TableCell>${Number(user.total_won).toFixed(2)}</TableCell>
                <TableCell>
                  <code className="text-xs bg-muted px-2 py-1 rounded">{user.referral_code}</code>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {users.length === 0 && (
        <p className="text-center text-muted-foreground py-8">No users found</p>
      )}
    </div>
  );
};