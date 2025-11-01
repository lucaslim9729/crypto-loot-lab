import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Scratch = () => {
  const navigate = useNavigate();
  const [isScratching, setIsScratching] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [prize, setPrize] = useState(0);
  const cardPrice = 20;

  const handleBuyCard = async () => {
    setIsScratching(true);
    setRevealed(false);

    try {
      // Call secure edge function - server determines outcome
      const { data: { session } } = await supabase.auth.getSession();
      const response = await supabase.functions.invoke('play-scratch', {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to play scratch card');
      }

      const { won, payout } = response.data;

      // Simulate scratch animation
      setTimeout(() => {
        setPrize(payout);
        setRevealed(true);
        setIsScratching(false);

        if (won) {
          toast.success(`🎉 You won $${payout.toFixed(2)}!`);
        } else {
          toast.error("Try again!");
        }
      }, 2000);
    } catch (error: any) {
      toast.error(error.message || 'Failed to play scratch card');
      setIsScratching(false);
      setRevealed(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="container mx-auto max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => navigate("/dashboard")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <Card className="bg-gradient-card border-border p-8">
          <div className="text-center mb-8">
            <div className="w-32 h-32 mx-auto mb-6 bg-gradient-gold rounded-full flex items-center justify-center">
              <Sparkles className="h-16 w-16 text-primary-foreground" />
            </div>
            <h1 className="text-4xl font-bold mb-4 bg-gradient-gold bg-clip-text text-transparent">
              Scratch Card
            </h1>
            <p className="text-xl text-muted-foreground">
              Instant win prizes up to 5.5x!
            </p>
          </div>

          <div className="space-y-6">
            <div className="bg-secondary/20 p-6 rounded-lg text-center">
              <p className="text-lg text-muted-foreground mb-2">Card Price</p>
              <p className="text-4xl font-bold text-accent">${cardPrice}</p>
            </div>

            {isScratching || revealed ? (
              <div className="min-h-[300px] flex items-center justify-center">
                <Card className={`w-full max-w-md p-12 text-center ${
                  isScratching 
                    ? "bg-gradient-to-br from-zinc-400 to-zinc-600 animate-pulse" 
                    : prize > 0 
                      ? "bg-gradient-gold" 
                      : "bg-gradient-card"
                }`}>
                  {isScratching ? (
                    <div>
                      <div className="text-4xl font-bold text-white mb-4">
                        Scratching...
                      </div>
                      <div className="text-white/80">Revealing your prize...</div>
                    </div>
                  ) : (
                    <div>
                      <div className="text-6xl mb-4">
                        {prize > 0 ? "🎉" : "😔"}
                      </div>
                      <div className="text-3xl font-bold mb-2">
                        {prize > 0 ? `$${prize.toFixed(2)}` : "Better Luck Next Time"}
                      </div>
                      <Button
                        className="mt-6 bg-gradient-primary hover:shadow-glow-primary"
                        onClick={() => {
                          setRevealed(false);
                          setPrize(0);
                        }}
                      >
                        Play Again
                      </Button>
                    </div>
                  )}
                </Card>
              </div>
            ) : (
              <Button
                className="w-full h-16 text-xl bg-gradient-primary hover:shadow-glow-primary"
                onClick={handleBuyCard}
              >
                <Sparkles className="mr-2 h-6 w-6" />
                Buy Scratch Card - ${cardPrice}
              </Button>
            )}

            <div className="bg-secondary/20 p-6 rounded-lg">
              <h3 className="text-lg font-bold mb-3 text-foreground">How to Play:</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li>• Purchase a scratch card for ${cardPrice}</li>
                <li>• Click to reveal your prize instantly</li>
                <li>• Win 1.5x-5.5x your bet amount!</li>
                <li>• 40% win rate</li>
                <li>• Play as many times as you want!</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Scratch;