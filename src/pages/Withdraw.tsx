import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, Shield, Clock, AlertCircle, Wallet, TrendingUp, Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";

// MISSION 2: Cryptocurrency address validation
const isTronAddress = (addr: string) => /^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(addr);
const isBscAddress = (addr: string) => /^0x[a-fA-F0-9]{40}$/.test(addr);

// MISSION 6: Comprehensive numeric validation for withdrawals
const withdrawSchema = z.object({
  amount: z.number()
    .positive("Amount must be positive")
    .finite("Amount must be a valid number")
    .min(10, "Minimum withdrawal is $10")
    .max(1000000, "Maximum withdrawal is $1,000,000")
    .transform(val => Math.round(val * 100) / 100),
  walletAddress: z.string()
    .trim()
    .min(34, "Wallet address is too short")
    .max(42, "Wallet address is too long"),
  network: z.enum(["TRC-20", "BEP-20"]),
});

const Withdraw = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [balance, setBalance] = useState<number>(0);
  const [totalWagered, setTotalWagered] = useState<number>(0);
  const [totalWon, setTotalWon] = useState<number>(0);
  const [amount, setAmount] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [selectedNetwork, setSelectedNetwork] = useState("TRC-20");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const networks = {
    "TRC-20": {
      name: "USDT (TRC-20)",
      fee: 2,
      minWithdraw: 20,
      processingTime: "1-6 hours",
      network: "Tron",
      addressExample: "TRX...",
    },
    "BEP-20": {
      name: "USDT (BEP-20)",
      fee: 3,
      minWithdraw: 20,
      processingTime: "1-6 hours",
      network: "Binance Smart Chain",
      addressExample: "0x...",
    },
  };

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
      .from("profiles")
      .select("balance, total_wagered, total_won")
      .eq("id", user.id)
      .single();

    if (profileData) {
      setBalance(profileData.balance);
      setTotalWagered(profileData.total_wagered);
      setTotalWon(profileData.total_won);
    }
  };

  const handleQuickAmount = (value: number | "MAX") => {
    if (value === "MAX") {
      const selectedNetworkData = networks[selectedNetwork as keyof typeof networks];
      const maxAmount = Math.max(0, balance - selectedNetworkData.fee);
      setAmount(maxAmount > 0 ? maxAmount.toFixed(2) : "");
    } else {
      setAmount(value.toString());
    }
  };

  const selectedNetworkData = networks[selectedNetwork as keyof typeof networks];
  const withdrawAmount = parseFloat(amount) || 0;
  const receiveAmount = Math.max(0, withdrawAmount - selectedNetworkData.fee);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate wallet address format based on network
    if (selectedNetwork === "TRC-20" && !isTronAddress(walletAddress.trim())) {
      toast.error("Invalid Tron (TRC-20) wallet address. Must start with 'T' and be 34 characters.");
      return;
    }

    if (selectedNetwork === "BEP-20" && !isBscAddress(walletAddress.trim())) {
      toast.error("Invalid BSC (BEP-20) wallet address. Must start with '0x' and be 42 characters.");
      return;
    }

    // Validate with zod schema
    const validation = withdrawSchema.safeParse({
      amount: parseFloat(amount),
      walletAddress: walletAddress,
      network: selectedNetwork,
    });

    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    const { amount: validatedAmount, walletAddress: validatedAddress } = validation.data;

    if (validatedAmount > balance) {
      toast.error(`Insufficient balance. You have $${balance.toFixed(2)}`);
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from("withdrawals").insert({
        user_id: user.id,
        amount: validatedAmount,
        currency: "USDT",
        network: selectedNetwork,
        wallet_address: validatedAddress,
        status: "pending",
      });

      if (error) throw error;

      toast.success("Withdrawal request submitted!");
      setAmount("");
      setWalletAddress("");
      
      setTimeout(() => {
        navigate("/dashboard");
      }, 2000);
    } catch (error) {
      console.error("Withdrawal error:", error);
      toast.error("Failed to submit withdrawal request");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border px-6 py-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Crypto Gaming
          </h1>
          <div className="flex items-center gap-4">
            <Wallet className="h-5 w-5 text-muted-foreground" />
            <span className="text-lg font-bold text-foreground">
              ${balance.toFixed(2)}
            </span>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8 max-w-6xl">
        <Button
          variant="ghost"
          onClick={() => navigate("/dashboard")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-primary bg-clip-text text-transparent">
            Withdraw Crypto
          </h1>
          <p className="text-muted-foreground text-lg">
            Fast and secure withdrawals to your wallet
          </p>
        </div>

        {/* Account Summary */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Card className="bg-gradient-card border-border hover:scale-105 transition-all group">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-primary rounded-full blur-lg opacity-30 group-hover:opacity-50 transition-opacity"></div>
                  <Wallet className="h-10 w-10 text-primary relative z-10 icon-gradient" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Available Balance</p>
                  <p className="text-2xl font-bold text-foreground">${balance.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-card border-border hover:scale-105 transition-all group">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-gold rounded-full blur-lg opacity-30 group-hover:opacity-50 transition-opacity"></div>
                  <TrendingUp className="h-10 w-10 text-accent relative z-10 icon-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Wagered</p>
                  <p className="text-2xl font-bold text-foreground">${totalWagered.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-border hover:scale-105 transition-all group">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-primary rounded-full blur-lg opacity-30 group-hover:opacity-50 transition-opacity"></div>
                  <Trophy className="h-10 w-10 text-primary relative z-10 icon-gradient" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Won</p>
                  <p className="text-2xl font-bold text-foreground">${totalWon.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Payment Methods */}
          <Card className="bg-gradient-card border-border">
            <CardHeader>
              <CardTitle className="text-2xl">Select Withdrawal Method</CardTitle>
              <CardDescription>Choose your preferred cryptocurrency</CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup value={selectedNetwork} onValueChange={setSelectedNetwork}>
                {Object.entries(networks).map(([key, network]) => (
                  <div
                    key={key}
                    className="flex items-center space-x-3 bg-secondary/20 p-4 rounded-lg mb-3 cursor-pointer hover:bg-secondary/30 transition-colors"
                  >
                    <RadioGroupItem value={key} id={key} />
                    <Label htmlFor={key} className="flex-1 cursor-pointer">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-foreground">{network.name}</p>
                          <p className="text-sm text-muted-foreground">{network.network}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-accent">${network.fee} Fee</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {network.processingTime}
                          </p>
                        </div>
                      </div>
                    </Label>
                  </div>
                ))}
              </RadioGroup>

              {/* Security Features */}
              <div className="mt-6 space-y-4">
                <div className="flex items-center gap-3 text-sm">
                  <Shield className="h-6 w-6 text-primary icon-gradient" />
                  <span className="text-muted-foreground">Multi-signature wallets</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Clock className="h-6 w-6 text-primary icon-gradient" />
                  <span className="text-muted-foreground">Fast processing times</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Shield className="h-6 w-6 text-primary icon-gradient" />
                  <span className="text-muted-foreground">24/7 Support</span>
                </div>
              </div>

              {/* Important Information */}
              <div className="mt-6 bg-accent/10 border border-accent/20 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-accent mt-0.5" />
                  <div>
                    <h4 className="font-bold text-foreground mb-2">Important Information</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Double-check wallet address before submitting</li>
                      <li>• Minimum withdrawal: ${selectedNetworkData.minWithdraw}</li>
                      <li>• Processing time: {selectedNetworkData.processingTime}</li>
                      <li>• Withdrawals are manually reviewed for security</li>
                      <li>• Transactions are irreversible once processed</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Withdrawal Form */}
          <Card className="bg-gradient-card border-border">
            <CardHeader>
              <CardTitle className="text-2xl">Withdrawal Details</CardTitle>
              <CardDescription>Enter amount and wallet address</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Amount */}
                <div>
                  <Label htmlFor="amount" className="text-base font-semibold">
                    Withdrawal Amount (USD)
                  </Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder={`Min $${selectedNetworkData.minWithdraw}`}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    min={selectedNetworkData.minWithdraw}
                    max={balance}
                    step="0.01"
                    className="mt-2 text-lg"
                    required
                  />
                  <div className="grid grid-cols-4 gap-2 mt-3">
                    {([20, 100, 500, "MAX"] as const).map((value) => (
                      <Button
                        key={value}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuickAmount(value as number | "MAX")}
                        className="text-sm"
                      >
                        {value === "MAX" ? "MAX" : `$${value}`}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Wallet Address */}
                <div>
                  <Label htmlFor="walletAddress" className="text-base font-semibold">
                    {selectedNetworkData.network} Wallet Address
                  </Label>
                  <Input
                    id="walletAddress"
                    type="text"
                    placeholder={`Enter ${selectedNetworkData.addressExample} address`}
                    value={walletAddress}
                    onChange={(e) => setWalletAddress(e.target.value)}
                    className="mt-2"
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Make sure the address matches the selected network
                  </p>
                </div>

                {/* Transaction Summary */}
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                  <h4 className="font-bold text-foreground mb-3">Transaction Summary</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Withdrawal Amount:</span>
                      <span className="font-bold text-foreground">${withdrawAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Network Fee:</span>
                      <span className="font-bold text-accent">-${selectedNetworkData.fee.toFixed(2)}</span>
                    </div>
                    <div className="h-px bg-border my-2"></div>
                    <div className="flex justify-between">
                      <span className="text-foreground font-semibold">You Will Receive:</span>
                      <span className="font-bold text-primary text-lg">${receiveAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Security Notice */}
                <div className="bg-accent/10 border border-accent/20 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-5 w-5 text-accent" />
                    <h4 className="font-bold text-foreground">Security Notice</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Please verify your wallet address carefully. Cryptocurrency transactions are irreversible and sending to an incorrect address will result in permanent loss of funds.
                  </p>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full h-12 text-lg bg-gradient-primary hover:shadow-glow-primary"
                  disabled={isSubmitting || withdrawAmount > balance}
                >
                  {isSubmitting ? "Submitting..." : "Submit Withdrawal Request"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Withdraw;