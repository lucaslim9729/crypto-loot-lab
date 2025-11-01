import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Copy, ArrowLeft, Users, DollarSign } from "lucide-react";

const Referral = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [referralCode, setReferralCode] = useState("");
  const [referralLink, setReferralLink] = useState("");
  const [referredUsers, setReferredUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReferralData();
  }, []);

  const loadReferralData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      // Get user's referral code
      const { data: profile } = await supabase
        .from("profiles")
        .select("referral_code")
        .eq("id", user.id)
        .single();

      if (profile?.referral_code) {
        setReferralCode(profile.referral_code);
        setReferralLink(`${window.location.origin}/auth?ref=${profile.referral_code}`);
      }

      // Get referred users
      const { data: referred } = await supabase
        .from("profiles")
        .select("username, created_at, total_wagered")
        .eq("referred_by", user.id)
        .order("created_at", { ascending: false });

      setReferredUsers(referred || []);
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

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    });
  };

  const totalEarnings = referredUsers.reduce((sum, user) => {
    return sum + Number(user.total_wagered) * 0.05; // 5% commission
  }, 0);

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
        <Button
          variant="outline"
          onClick={() => navigate("/dashboard")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <h1 className="text-4xl font-bold mb-8 bg-gradient-primary bg-clip-text text-transparent">
          Referral Program
        </h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="bg-gradient-card border-border p-6 hover:scale-105 transition-all hover:shadow-glow-primary group">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-primary rounded-full blur-xl opacity-40 group-hover:opacity-60 transition-opacity"></div>
                <Users className="h-14 w-14 text-primary relative z-10 icon-gradient" />
              </div>
              <div>
                <p className="text-muted-foreground">Total Referrals</p>
                <p className="text-3xl font-bold text-foreground">{referredUsers.length}</p>
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-card border-border p-6 hover:scale-105 transition-all hover:shadow-glow-accent group">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-gold rounded-full blur-xl opacity-40 group-hover:opacity-60 transition-opacity"></div>
                <DollarSign className="h-14 w-14 text-accent relative z-10 icon-accent" />
              </div>
              <div>
                <p className="text-muted-foreground">Total Earnings (5%)</p>
                <p className="text-3xl font-bold text-foreground">${totalEarnings.toFixed(2)}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Referral Code Section */}
        <Card className="bg-gradient-card border-border p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4 text-foreground">Your Referral Code</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-foreground">Referral Code</label>
              <div className="flex gap-2">
                <Input
                  value={referralCode}
                  readOnly
                  className="font-mono text-lg"
                />
                <Button
                  onClick={() => copyToClipboard(referralCode, "Referral code")}
                  className="bg-gradient-primary"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-foreground">Referral Link</label>
              <div className="flex gap-2">
                <Input
                  value={referralLink}
                  readOnly
                  className="font-mono"
                />
                <Button
                  onClick={() => copyToClipboard(referralLink, "Referral link")}
                  className="bg-gradient-primary"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-primary/10 rounded-lg">
            <p className="text-sm text-foreground">
              <strong>How it works:</strong> Share your referral code or link with friends. 
              You'll earn 5% commission on their total wagered amount!
            </p>
          </div>
        </Card>

        {/* Referred Users List */}
        <Card className="bg-gradient-card border-border p-6">
          <h2 className="text-2xl font-bold mb-4 text-foreground">Your Referrals</h2>
          
          {referredUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p>No referrals yet. Start sharing your code to earn!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {referredUsers.map((user, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-4 bg-background/50 rounded-lg border border-border"
                >
                  <div>
                    <p className="font-medium text-foreground">{user.username}</p>
                    <p className="text-sm text-muted-foreground">
                      Joined {new Date(user.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Total Wagered</p>
                    <p className="font-bold text-foreground">${Number(user.total_wagered).toFixed(2)}</p>
                    <p className="text-sm text-primary">
                      Your Earnings: ${(Number(user.total_wagered) * 0.05).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Referral;
