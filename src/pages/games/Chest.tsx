import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Gift } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Chest = () => {
  const navigate = useNavigate();
  const [isOpening, setIsOpening] = useState(false);
  const [opened, setOpened] = useState(false);
  const [prize, setPrize] = useState<{ amount: number; type: string } | null>(null);

  const chestTiers = [
    { name: "Bronze Chest", price: 100, maxMultiplier: 3 },
    { name: "Silver Chest", price: 500, maxMultiplier: 5 },
    { name: "Gold Chest", price: 1000, maxMultiplier: 8 },
    { name: "Diamond Chest", price: 5000, maxMultiplier: 15 },
  ];

  const handleOpenChest = async (tier: typeof chestTiers[0]) => {
    setIsOpening(true);
    setOpened(false);

    try {
      // Call secure edge function - server determines outcome
      const { data: { session } } = await supabase.auth.getSession();
      const response = await supabase.functions.invoke('play-chest', {
        body: { 
          tierName: tier.name,
          tierPrice: tier.price,
          maxMultiplier: tier.maxMultiplier
        },
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to open chest');
      }

      const { won, prizeAmount, prizeType } = response.data;

      // Simulate chest opening animation
      setTimeout(() => {
        setPrize({ amount: prizeAmount, type: prizeType });
        setOpened(true);
        setIsOpening(false);

        if (won) {
          toast.success(`🎉 You won ${prizeType}: $${prizeAmount.toFixed(2)}!`);
        } else {
          toast.error("Empty chest! Try again!");
        }
      }, 3000);
    } catch (error: any) {
      toast.error(error.message || 'Failed to open chest');
      setIsOpening(false);
      setOpened(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="container mx-auto max-w-6xl">
        <Button
          variant="ghost"
          onClick={() => navigate("/dashboard")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-gold bg-clip-text text-transparent">
            Mystery Chest
          </h1>
          <p className="text-xl text-muted-foreground">
            Open chests to win USDT, BTC, or Bonus Coins!
          </p>
        </div>

        {isOpening || opened ? (
          <Card className="bg-gradient-card border-border p-12 mb-8">
            <div className="text-center">
              {isOpening ? (
                <div>
                  <div className="text-8xl mb-6 animate-bounce">📦</div>
                  <p className="text-3xl font-bold text-foreground mb-2">Opening...</p>
                  <p className="text-muted-foreground">Revealing your prize...</p>
                </div>
              ) : (
                <div>
                  <div className="text-8xl mb-6">
                    {prize && prize.amount > 0 ? "🎉" : "📭"}
                  </div>
                  <p className="text-4xl font-bold mb-4 text-foreground">
                    {prize && prize.amount > 0 
                      ? `${prize.type}: $${prize.amount.toFixed(2)}` 
                      : "Empty Chest"}
                  </p>
                  <Button
                    className="mt-6 bg-gradient-primary hover:shadow-glow-primary"
                    onClick={() => {
                      setOpened(false);
                      setPrize(null);
                    }}
                  >
                    Try Again
                  </Button>
                </div>
              )}
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {chestTiers.map((tier, index) => (
              <Card
                key={tier.name}
                className={`bg-gradient-card border-2 p-6 hover:scale-105 transition-all duration-300 ${
                  index === 0 ? "border-orange-500" :
                  index === 1 ? "border-gray-400" :
                  index === 2 ? "border-yellow-500" :
                  "border-blue-400"
                }`}
              >
                <div className="text-center">
                  <div className="text-6xl mb-4">
                    {index === 0 ? "🟤" : index === 1 ? "⚪" : index === 2 ? "🟡" : "💎"}
                  </div>
                  <h3 className="text-2xl font-bold mb-2 text-foreground">
                    {tier.name}
                  </h3>
                  <p className="text-3xl font-bold text-accent mb-4">
                    ${tier.price}
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Win up to {tier.maxMultiplier}x
                  </p>
                  <Button
                    className="w-full bg-gradient-primary hover:shadow-glow-primary"
                    onClick={() => handleOpenChest(tier)}
                  >
                    <Gift className="mr-2 h-4 w-4" />
                    Open
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        <Card className="bg-secondary/20 p-6">
          <h3 className="text-lg font-bold mb-3 text-foreground">How to Play:</h3>
          <ul className="space-y-2 text-muted-foreground">
            <li>• Choose a chest tier to open</li>
            <li>• Higher tier chests cost more but have better rewards</li>
            <li>• 50% chance to win on each chest</li>
            <li>• Prizes include USDT, BTC, or Bonus Coins</li>
            <li>• Bigger chests = bigger multipliers!</li>
          </ul>
        </Card>
      </div>
    </div>
  );
};

export default Chest;