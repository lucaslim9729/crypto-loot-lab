import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { DollarSign, TrendingUp, TrendingDown } from "lucide-react";

interface Profile {
  balance: number;
  total_wagered: number;
  total_won: number;
}

export const UserBalance = () => {
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    fetchProfile();

    const channel = supabase
      .channel("profile-changes")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
        },
        () => {
          fetchProfile();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("profiles")
      .select("balance, total_wagered, total_won")
      .eq("id", user.id)
      .single();

    if (data) setProfile(data);
  };

  if (!profile) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <Card className="bg-gradient-card border-border p-6 hover:scale-105 transition-all hover:shadow-glow-accent group">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Balance</p>
            <p className="text-2xl font-bold text-foreground">
              ${profile.balance.toFixed(2)}
            </p>
          </div>
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-gold rounded-full blur-xl opacity-30 group-hover:opacity-50 transition-opacity"></div>
            <DollarSign className="h-14 w-14 text-accent relative z-10 icon-accent" />
          </div>
        </div>
      </Card>

      <Card className="bg-gradient-card border-border p-6 hover:scale-105 transition-all group">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Total Wagered</p>
            <p className="text-2xl font-bold text-foreground">
              ${profile.total_wagered.toFixed(2)}
            </p>
          </div>
          <div className="relative">
            <div className="absolute inset-0 bg-destructive rounded-full blur-xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
            <TrendingDown className="h-14 w-14 text-destructive relative z-10 group-hover:scale-110 transition-transform" />
          </div>
        </div>
      </Card>

      <Card className="bg-gradient-card border-border p-6 hover:scale-105 transition-all hover:shadow-glow-primary group">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Total Won</p>
            <p className="text-3xl font-bold text-foreground">
              ${profile.total_won.toFixed(2)}
            </p>
          </div>
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-primary rounded-full blur-xl opacity-30 group-hover:opacity-50 transition-opacity"></div>
            <TrendingUp className="h-14 w-14 text-primary relative z-10 icon-gradient" />
          </div>
        </div>
      </Card>      
    </div>
  );
};
