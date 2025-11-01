import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Play, Square } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Runner = () => {
  const navigate = useNavigate();
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [multiplier, setMultiplier] = useState(1);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const costPerSecond = 1;

  useEffect(() => {
    if (isPlaying && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
        setScore((prev) => prev + (10 * multiplier));
        
        // Random multiplier boosts
        if (Math.random() > 0.9) {
          setMultiplier((prev) => Math.min(prev + 0.5, 5));
          toast.success(`Multiplier boost! ${multiplier.toFixed(1)}x`);
        }

        // Random traps (lose multiplier)
        if (Math.random() > 0.95) {
          setMultiplier(1);
          toast.error("Hit a trap! Multiplier reset");
        }
      }, 1000);

      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    } else if (timeLeft === 0) {
      handleExit();
    }
  }, [isPlaying, timeLeft, multiplier]);

  const handleStart = () => {
    setIsPlaying(true);
    setScore(0);
    setTimeLeft(60);
    setMultiplier(1);
    toast.success("Game started! Collect coins and avoid traps!");
  };

  const handleExit = async () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsPlaying(false);

    const timePlayed = 60 - timeLeft;
    const totalCost = timePlayed * costPerSecond;
    const payout = score / 10; // Convert score to money

    await recordGame(totalCost, payout);

    if (payout > totalCost) {
      toast.success(`🎉 You won $${(payout - totalCost).toFixed(2)}!`);
    } else {
      toast.error(`You lost $${(totalCost - payout).toFixed(2)}`);
    }

    setScore(0);
    setTimeLeft(60);
  };

  const recordGame = async (bet: number, payout: number) => {
    const { error } = await supabase.rpc("play_game", {
      _game_type: "runner",
      _bet_amount: bet,
      _payout: payout,
      _result: { score, time_played: 60 - timeLeft },
    });
    if (error) throw error;
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
          <h1 className="text-4xl font-bold mb-4 text-center bg-gradient-primary bg-clip-text text-transparent">
            Endless Runner
          </h1>
          <p className="text-xl text-muted-foreground text-center mb-8">
            Collect coins and multipliers, avoid traps!
          </p>

          <div className="grid grid-cols-3 gap-4 mb-8">
            <Card className="bg-secondary/20 p-4 text-center">
              <p className="text-sm text-muted-foreground mb-1">Score</p>
              <p className="text-3xl font-bold text-accent">{score}</p>
            </Card>
            <Card className="bg-secondary/20 p-4 text-center">
              <p className="text-sm text-muted-foreground mb-1">Time Left</p>
              <p className="text-3xl font-bold text-foreground">{timeLeft}s</p>
            </Card>
            <Card className="bg-secondary/20 p-4 text-center">
              <p className="text-sm text-muted-foreground mb-1">Multiplier</p>
              <p className="text-3xl font-bold text-primary">{multiplier.toFixed(1)}x</p>
            </Card>
          </div>

          {/* Game Canvas */}
          <div className="relative bg-gradient-to-b from-purple-900/20 to-blue-900/20 rounded-lg p-8 mb-6 min-h-[300px] overflow-hidden border-2 border-primary/20">
            {isPlaying ? (
              <div className="text-center">
                <div className="text-6xl animate-bounce mb-4">🏃</div>
                <div className="flex justify-center gap-4 mb-4">
                  <div className="text-4xl animate-float">🪙</div>
                  <div className="text-4xl animate-float delay-75">🪙</div>
                  <div className="text-4xl animate-float delay-150">⚡</div>
                </div>
                <p className="text-xl text-muted-foreground">
                  Collecting coins... Multiplier: {multiplier.toFixed(1)}x
                </p>
              </div>
            ) : (
              <div className="text-center">
                <div className="text-6xl mb-4">🎮</div>
                <p className="text-xl text-muted-foreground">
                  Click Start to begin your run!
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-4">
            {!isPlaying ? (
              <Button
                className="flex-1 h-16 text-xl bg-gradient-primary hover:shadow-glow-primary"
                onClick={handleStart}
              >
                <Play className="mr-2 h-6 w-6" />
                Start Game
              </Button>
            ) : (
              <Button
                className="flex-1 h-16 text-xl bg-gradient-gold hover:shadow-glow-accent"
                onClick={handleExit}
              >
                <Square className="mr-2 h-6 w-6" />
                Exit & Cash Out
              </Button>
            )}
          </div>

          <div className="bg-secondary/20 p-6 rounded-lg mt-6">
            <h3 className="text-lg font-bold mb-3 text-foreground">How to Play:</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li>• Costs $1 per second played</li>
              <li>• Collect coins to earn points (10 points/sec)</li>
              <li>• Multipliers boost your earnings up to 5x</li>
              <li>• Traps reset your multiplier to 1x</li>
              <li>• Exit anytime to cash out your score</li>
              <li>• Points convert to dollars ($1 = 10 points)</li>
            </ul>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Runner;