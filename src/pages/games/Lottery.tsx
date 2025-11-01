import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Ticket } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Lottery = () => {
  const navigate = useNavigate();
  const [ticketCount, setTicketCount] = useState(1);
  const [isDrawing, setIsDrawing] = useState(false);
  const ticketPrice = 10;

  const handleBuyTickets = async () => {
    setIsDrawing(true);
    
    try {
      // Call secure edge function - server determines outcome
      const { data: { session } } = await supabase.auth.getSession();
      const response = await supabase.functions.invoke('play-lottery', {
        body: { ticketCount },
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to play lottery');
      }

      const { won, payout } = response.data;

      // Simulate drawing animation
      setTimeout(() => {
        if (won) {
          toast.success(`🎉 You won $${payout.toFixed(2)}!`);
        } else {
          toast.error("Better luck next time!");
        }
        setIsDrawing(false);
      }, 3000);
    } catch (error: any) {
      toast.error(error.message || 'Failed to play lottery');
      setIsDrawing(false);
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
            <div className="w-32 h-32 mx-auto mb-6 bg-gradient-primary rounded-full flex items-center justify-center">
              <Ticket className="h-16 w-16 text-primary-foreground" />
            </div>
            <h1 className="text-4xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
              Lottery Game
            </h1>
            <p className="text-xl text-muted-foreground">
              Buy tickets and win big prizes!
            </p>
          </div>

          {isDrawing ? (
            <div className="text-center py-12">
              <div className="inline-block">
                <div className="w-32 h-32 border-8 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
              <p className="text-2xl font-bold mt-8 text-foreground">Drawing...</p>
              <p className="text-muted-foreground mt-2">Good luck!</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-secondary/20 p-6 rounded-lg">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg text-muted-foreground">Ticket Price:</span>
                  <span className="text-2xl font-bold text-accent">${ticketPrice}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-lg text-muted-foreground">Number of Tickets:</span>
                  <Input
                    type="number"
                    min="1"
                    max="100"
                    value={ticketCount}
                    onChange={(e) => setTicketCount(parseInt(e.target.value) || 1)}
                    className="w-32 text-center text-xl font-bold"
                  />
                </div>
                <div className="border-t border-border mt-4 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-bold text-foreground">Total Cost:</span>
                    <span className="text-3xl font-bold text-accent">
                      ${(ticketPrice * ticketCount).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <Button
                className="w-full h-16 text-xl bg-gradient-primary hover:shadow-glow-primary"
                onClick={handleBuyTickets}
              >
                <Ticket className="mr-2 h-6 w-6" />
                Buy Tickets & Draw
              </Button>

              <div className="bg-secondary/20 p-6 rounded-lg">
                <h3 className="text-lg font-bold mb-3 text-foreground">How to Play:</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Choose how many tickets you want to buy</li>
                  <li>• Each ticket costs $10</li>
                  <li>• Click "Buy Tickets & Draw" to participate</li>
                  <li>• Win 2x-5x your total bet amount!</li>
                  <li>• 30% win rate for fair gameplay</li>
                </ul>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Lottery;