import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AnnouncementTicker } from "@/components/AnnouncementTicker";
import { UserBalance } from "@/components/UserBalance";
import { LogOut, Wallet, Users, LifeBuoy, Gift, TrendingUp, TrendingDown, Shield, MessageCircle } from "lucide-react";
import Footer from "@/components/Footer";
import { toast } from "sonner";
import lotteryPreview from "@/assets/lottery-preview.jpg";
import scratchPreview from "@/assets/scratch-preview.jpg";
import runnerPreview from "@/assets/runner-preview.jpg";
import chestPreview from "@/assets/chest-preview.jpg";

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      navigate("/auth");
      return;
    }

    setUser(user);

    const { data: profileData } = await supabase
      .from("profiles" as any)
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileData) setProfile(profileData);

    // Check admin status
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin");

    setIsAdmin(roles && roles.length > 0);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
    navigate("/");
  };

  const games = [
    { 
      title: "Lottery Game", 
      image: lotteryPreview, 
      path: "/games/lottery",
      description: "Pick your lucky numbers"
    },
    { 
      title: "Scratch Card", 
      image: scratchPreview, 
      path: "/games/scratch",
      description: "Instant win prizes"
    },
    { 
      title: "Endless Runner", 
      image: runnerPreview, 
      path: "/games/runner",
      description: "Run for rewards"
    },
    { 
      title: "Mystery Chest", 
      image: chestPreview, 
      path: "/games/chest",
      description: "Unlock treasures"
    },
  ];

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <AnnouncementTicker />

      {/* Header */}
      <header className="bg-card border-b border-border px-6 py-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Crypto Gaming
          </h1>
          <div className="flex items-center gap-4">
            {profile && (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-4 py-2 bg-gradient-primary rounded-lg">
                  <Wallet className="h-4 w-4 text-primary-foreground" />
                  <div className="flex flex-col">
                    {/* <span className="text-xs text-primary-foreground/80">Balance</span> */}
                    <span className="font-bold text-primary-foreground">
                      ${profile.balance?.toFixed(2) || '0.00'}
                    </span>
                  </div>
                </div>
                {/* <div className="flex items-center gap-2 px-4 py-2 bg-gradient-card border border-border rounded-lg">
                  <TrendingDown className="h-4 w-4 text-destructive" />
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">Wagered</span>
                    <span className="font-semibold text-foreground">
                      ${profile.total_wagered?.toFixed(2) || '0.00'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-gradient-card border border-border rounded-lg">
                  <TrendingUp className="h-4 w-4 text-accent" />
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">Won</span>
                    <span className="font-semibold text-foreground">
                      ${profile.total_won?.toFixed(2) || '0.00'}
                    </span>
                  </div>
                </div> */}
              </div>
            )}
            <span className="text-muted-foreground">
              {profile?.username || user.email}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <UserBalance />

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {isAdmin && (
            <Button
              className="h-20 bg-gradient-gold hover:shadow-glow-primary group"
              onClick={() => navigate("/admin")}
            >
              <Shield className="mr-2 h-8 w-8 icon-accent group-hover:scale-110 transition-transform" />
              Admin Panel
            </Button>
          )}
          <Button
            variant="outline"
            className="h-20 group hover:text-lg hover:border-primary hover:bg-primary/25 hover:text-primary"
            // className="h-20 bg-gradient-primary hover:shadow-glow-primary group"
            onClick={() => navigate("/deposit")}
          >
            <Wallet className="mr-2 h-8 w-8 text-primary icon-gradient group-hover:scale-150 transition-transform" />
            Deposit
          </Button>
          <Button
            variant="outline"
            className="h-20 group hover:text-lg hover:border-primary hover:bg-primary/25 hover:text-primary"
            onClick={() => navigate("/withdraw")}
          >
            <Wallet className="mr-2 h-8 w-8 text-primary icon-gradient group-hover:scale-150 transition-transform" />
            Withdraw
          </Button>
          <Button
            variant="outline"
            className="h-20 group hover:text-lg hover:border-primary hover:bg-primary/25 hover:text-primary"
            onClick={() => navigate("/referral")}
          >
            <Users className="mr-2 h-8 w-8 text-primary icon-gradient group-hover:scale-150 transition-transform" />
            Referrals
          </Button>
          <Button
            variant="outline"
            className="h-20 group hover:text-lg hover:border-primary hover:bg-primary/25 hover:text-primary"
            onClick={() => navigate("/social")}
          >
            <MessageCircle className="mr-2 h-8 w-8 text-primary icon-gradient group-hover:scale-150 transition-transform" />
            Social
          </Button>
          <Button
            variant="outline"
            className="h-20 group hover:text-lg hover:border-primary hover:bg-primary/25 hover:text-primary"
            onClick={() => navigate("/support")}
          >
            <LifeBuoy className="mr-2 h-8 w-8 text-primary icon-gradient group-hover:scale-150 transition-transform" />
            Support
          </Button>
        </div>

        {/* Games Grid */}
        <h2 className="text-4xl font-bold mb-8 bg-gradient-primary bg-clip-text text-transparent text-center">
          Choose Your Game
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {games.map((game) => (
            <Card
              key={game.title}
              className="group relative overflow-hidden bg-card border-border hover:scale-[1.02] transition-all duration-500 hover:shadow-glow-primary cursor-pointer"
              onClick={() => navigate(game.path)}
            >
              <div className="relative h-64 overflow-hidden">
                <img
                  src={game.image}
                  alt={game.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent opacity-90 group-hover:opacity-70 transition-opacity duration-300" />
              </div>
              <div className="p-6 relative">
                <h3 className="text-2xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors duration-300">
                  {game.title}
                </h3>
                <p className="text-muted-foreground mb-4">{game.description}</p>
                <div className="flex items-center text-primary font-semibold group-hover:translate-x-2 transition-transform duration-300">
                  Play Now
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Referral Card */}
        {profile && (
          <Card className="relative overflow-hidden bg-gradient-gold p-8 text-primary-foreground shadow-glow-accent group">
            <div className="flex items-center gap-6">
              <div className="bg-primary-foreground/20 p-4 rounded-2xl backdrop-blur-sm relative">
                <div className="absolute inset-0 bg-primary-foreground/30 rounded-2xl blur-lg group-hover:blur-xl transition-all"></div>
                <Gift className="h-16 w-16 relative z-10 group-hover:scale-110 transition-transform" />
              </div>
              <div className="flex-1">
                <h3 className="text-3xl font-bold mb-3">Invite Friends & Earn!</h3>
                <p className="text-4xl font-mono font-bold tracking-wider mb-3 bg-primary-foreground/20 px-4 py-2 rounded-lg inline-block">
                  {profile.referral_code}
                </p>
                <p className="text-lg opacity-95">
                  Share this code and earn bonuses when friends sign up!
                </p>
              </div>
            </div>
            <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-primary-foreground/10 rounded-full blur-2xl" />
            <div className="absolute -left-8 -top-8 w-32 h-32 bg-primary-foreground/10 rounded-full blur-2xl" />
          </Card>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default Dashboard;
