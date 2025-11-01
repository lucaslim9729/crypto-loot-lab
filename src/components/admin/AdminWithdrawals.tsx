import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { Check, X } from "lucide-react";

interface Withdrawal {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  network: string;
  wallet_address: string;
  status: string;
  created_at: string;
  profiles: {
    username: string;
  };
}

export const AdminWithdrawals = () => {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWithdrawals();
  }, []);

  const loadWithdrawals = async () => {
    try {
      const { data, error } = await supabase
        .from("withdrawals")
        .select("*, profiles(username)")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setWithdrawals(data || []);
    } catch (error: any) {
      toast.error("Failed to load withdrawals");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const updateWithdrawalStatus = async (withdrawalId: string, status: string) => {
    try {
      // Find withdrawal details from local state
      const withdrawal = withdrawals.find(w => w.id === withdrawalId);
      if (!withdrawal) {
        toast.error("Withdrawal not found");
        return;
      }

      // If completing withdrawal, deduct balance first
      if (status === "completed") {
        // Get current balance with row locking to prevent race conditions
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("balance")
          .eq("id", withdrawal.user_id)
          .single();

        if (profileError) throw profileError;

        // Check sufficient balance
        if (!profile || Number(profile.balance) < Number(withdrawal.amount)) {
          toast.error("User has insufficient balance for this withdrawal");
          return;
        }

        // Deduct balance atomically
        const { error: balanceError } = await supabase
          .from("profiles")
          .update({ balance: Number(profile.balance) - Number(withdrawal.amount) })
          .eq("id", withdrawal.user_id);

        if (balanceError) throw balanceError;
      }

      // Update withdrawal status
      const { error } = await supabase
        .from("withdrawals")
        .update({ status })
        .eq("id", withdrawalId);

      if (error) throw error;

      toast.success(`Withdrawal ${status}`);
      loadWithdrawals();
    } catch (error: any) {
      toast.error(`Failed to update withdrawal: ${error.message}`);
      console.error(error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-500";
      case "pending": return "bg-yellow-500";
      case "rejected": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading withdrawals...</div>;
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
              <TableHead>Wallet Address</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {withdrawals.map((withdrawal) => (
              <TableRow key={withdrawal.id}>
                <TableCell className="font-medium">{withdrawal.profiles.username}</TableCell>
                <TableCell>
                  {Number(withdrawal.amount).toFixed(2)} {withdrawal.currency}
                </TableCell>
                <TableCell>{withdrawal.network}</TableCell>
                <TableCell>
                  <code className="text-xs bg-muted px-2 py-1 rounded truncate block max-w-[200px]">
                    {withdrawal.wallet_address}
                  </code>
                </TableCell>
                <TableCell>
                  <Badge className={getStatusColor(withdrawal.status)}>
                    {withdrawal.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDistanceToNow(new Date(withdrawal.created_at), { addSuffix: true })}
                </TableCell>
                <TableCell>
                  {withdrawal.status === "pending" && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => updateWithdrawalStatus(withdrawal.id, "completed")}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => updateWithdrawalStatus(withdrawal.id, "rejected")}
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
      {withdrawals.length === 0 && (
        <p className="text-center text-muted-foreground py-8">No withdrawals found</p>
      )}
    </div>
  );
};