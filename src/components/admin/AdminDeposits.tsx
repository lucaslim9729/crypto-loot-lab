import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { Check, X } from "lucide-react";

interface Deposit {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  network: string;
  tx_hash: string | null;
  status: string;
  created_at: string;
  profiles: {
    username: string;
  };
}

export const AdminDeposits = () => {
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDeposits();
  }, []);

  const loadDeposits = async () => {
    try {
      const { data, error } = await supabase
        .from("deposits")
        .select("*, profiles(username)")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setDeposits(data || []);
    } catch (error: any) {
      toast.error("Failed to load deposits");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const updateDepositStatus = async (depositId: string, status: string) => {
    try {
      const deposit = deposits.find(d => d.id === depositId);
      if (!deposit) return;

      // If approved, update user balance first
      if (status === "approved") {
        // Get current balance
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("balance")
          .eq("id", deposit.user_id)
          .single();

        if (profileError) throw profileError;

        // Update balance
        const { error: balanceError } = await supabase
          .from("profiles")
          .update({
            balance: Number(profile.balance) + Number(deposit.amount)
          })
          .eq("id", deposit.user_id);

        if (balanceError) throw balanceError;
      }

      // Update deposit status
      const { error } = await supabase
        .from("deposits")
        .update({ status })
        .eq("id", depositId);

      if (error) throw error;

      toast.success(`Deposit ${status}`);
      loadDeposits();
    } catch (error: any) {
      toast.error(`Failed to update deposit: ${error.message}`);
      console.error(error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "bg-green-500";
      case "pending": return "bg-yellow-500";
      case "rejected": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading deposits...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Network</TableHead>
              <TableHead>TX Hash</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {deposits.map((deposit) => (
              <TableRow key={deposit.id}>
                <TableCell className="font-medium">{deposit.profiles.username}</TableCell>
                <TableCell>
                  {Number(deposit.amount).toFixed(2)} {deposit.currency}
                </TableCell>
                <TableCell>{deposit.network}</TableCell>
                <TableCell>
                  {deposit.tx_hash ? (
                    <code className="text-xs bg-muted px-2 py-1 rounded truncate block max-w-[150px]">
                      {deposit.tx_hash}
                    </code>
                  ) : (
                    <span className="text-muted-foreground">N/A</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge className={getStatusColor(deposit.status)}>
                    {deposit.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDistanceToNow(new Date(deposit.created_at), { addSuffix: true })}
                </TableCell>
                <TableCell>
                  {deposit.status === "pending" && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => updateDepositStatus(deposit.id, "approved")}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => updateDepositStatus(deposit.id, "rejected")}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {deposits.length === 0 && (
        <p className="text-center text-muted-foreground py-8">No deposits found</p>
      )}
    </div>
  );
};