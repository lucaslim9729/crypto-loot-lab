import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Sparkles, Trophy, Ticket, Gift, Zap } from "lucide-react";
import Footer from "@/components/Footer";
import heroImage from "@/assets/hero-winner.jpg";
import lotteryPreview from "@/assets/lottery-preview.jpg";
import scratchPreview from "@/assets/scratch-preview.jpg";
import runnerPreview from "@/assets/runner-preview.jpg";
import chestPreview from "@/assets/chest-preview.jpg";

const Index = () => {
  const navigate = useNavigate();

  const games = [
    {
      id: "lottery",
      title: "Lottery",
      description: "Scheduled draws with big prizes",
      preview: lotteryPreview,
      path: "/games/lottery",
    },
    {
      id: "scratch",
      title: "Scratch Card",
      description: "Instant win prizes",
      preview: scratchPreview,
      path: "/games/scratch",
    },
    {
      id: "runner",
      title: "Endless Runner",
      description: "Collect coins and multipliers",
      preview: runnerPreview,
      path: "/games/runner",
    },
    {
      id: "chest",
      title: "Mystery Chest",
      description: "Open chests for rewards",
      preview: chestPreview,
      path: "/games/chest",
    },
  ];

  const features = [
    { icon: Sparkles, title: "Instant Withdrawals", desc: "Cash out anytime" },
    { icon: Trophy, title: "Fair Gaming", desc: "Provably fair algorithm" },
    { icon: Ticket, title: "Mega Raffles", desc: "Win big prizes" },
    { icon: Gift, title: "Referral Bonus", desc: "Earn from friends" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section
        className="relative h-screen flex items-center justify-center overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.3), rgba(15, 23, 42, 0.6)), url(${heroImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/80" />
        <div className="container mx-auto px-4 text-center z-10 relative">
          <h1 className="text-6xl md:text-8xl font-bold mb-6 bg-gradient-primary bg-clip-text text-golden text-transparent animate-fade-in leading-tight py-5 drop-shadow-lg">
            Win Big with Crypto!
          </h1>
          <p className="text-xl md:text-2xl text-foreground mb-8 max-w-2xl mx-auto font-semibold drop-shadow-md">
            The future of online gaming. Play fair, win big, withdraw instantly.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button
              size="lg"
              className="bg-gradient-primary text-primary-foreground hover:shadow-glow-primary text-lg px-8 animate-scale-in shadow-lg hover:scale-110 transition-transform"
              onClick={() => navigate("/auth")}
            >
              <Zap className="mr-2 h-6 w-6 icon-accent" />
              Start Winning Now
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-primary border-2 text-lg px-8 hover:bg-primary/35 hover:text-primary backdrop-blur-sm"
              onClick={() => navigate("/dashboard")}
            >
              View Dashboard
            </Button>
          </div>
        </div>
      </section>

      {/* Games Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-background to-card">
        <div className="container mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-4 py-3 bg-gradient-primary bg-clip-text text-transparent">
            Choose Your Game
          </h2>
          <p className="text-center text-muted-foreground mb-12 text-lg">
            Four exciting ways to win
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {games.map((game) => (
              <Card
                key={game.id}
                className="group bg-gradient-card border-border overflow-hidden hover:scale-105 transition-all duration-300 hover:shadow-glow-primary cursor-pointer"
                onClick={() => navigate(game.path)}
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={game.preview}
                    alt={game.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent" />
                </div>
                <div className="p-6">
                  <h3 className="text-2xl font-bold text-center mb-2 text-foreground group-hover:text-primary transition-colors">
                    {game.title}
                  </h3>
                  <p className="text-center text-muted-foreground">
                    {game.description}
                  </p>
                  <div className="mt-4 text-center">
                    <span className="text-accent font-semibold group-hover:underline">
                      Play Now →
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-12 py-3 bg-gradient-primary bg-clip-text text-transparent">
            Why Choose Us
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => (
              <Card
                key={i}
                className="bg-gradient-card border-border p-6 text-center hover:scale-105 transition-all hover:shadow-glow-primary group"
              >
                <div className="relative inline-block">
                  <div className="absolute inset-0 bg-gradient-primary rounded-full blur-xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
                  <feature.icon className="h-16 w-16 mx-auto mb-4 text-primary relative z-10 icon-gradient" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-foreground">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">{feature.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-primary">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6  py-3 text-primary-foreground">
            Ready to Start Winning?
          </h2>
          <p className="text-xl mb-8 text-primary-foreground/80">
            Join thousands of players winning every day
          </p>
          <Button
            size="lg"
            className="bg-background text-foreground hover:bg-background/90 text-lg px-8"
            onClick={() => navigate("/auth")}
          >
            Create Free Account
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
