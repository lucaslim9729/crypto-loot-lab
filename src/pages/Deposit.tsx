import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, Copy, Shield, Clock, AlertCircle, Wallet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";

// MISSION 2: Cryptocurrency address validation
const isTronAddress = (addr: string) => /^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(addr);
const isBscAddress = (addr: string) => /^0x[a-fA-F0-9]{40}$/.test(addr);

// MISSION 6: Comprehensive numeric validation
const depositSchema = z.object({
  amount: z.number()
    .positive("Amount must be positive")
    .finite("Amount must be a valid number")
    .min(10, "Minimum deposit is $10")
    .max(1000000, "Maximum deposit is $1,000,000")
    .transform(val => Math.round(val * 100) / 100),
  txHash: z.string()
    .trim()
    .min(32, "Transaction hash must be at least 32 characters")
    .max(128, "Transaction hash is too long"),
  network: z.enum(["TRC-20", "BEP-20"]),
});

const Deposit = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [balance, setBalance] = useState<number>(0);
  const [amount, setAmount] = useState("");
  const [txHash, setTxHash] = useState("");
  const [selectedNetwork, setSelectedNetwork] = useState("TRC-20");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const networks = {
    "TRC-20": {
      name: "USDT (TRC-20)",
      address: "TRXSampleWalletAddress123456789ABCDEF",
      fee: "0%",
      minDeposit: 10,
      processingTime: "1-3 minutes",
      network: "Tron",
    },
    "BEP-20": {
      name: "USDT (BEP-20)",
      address: "0xBSCSampleWalletAddress123456789ABCDEF",
      fee: "0%",
      minDeposit: 10,
      processingTime: "1-5 minutes",
      network: "Binance Smart Chain",
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
      .select("balance")
      .eq("id", user.id)
      .single();

    if (profileData) setBalance(profileData.balance);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Address copied to clipboard!");
  };

  const handleQuickAmount = (value: number) => {
    setAmount(value.toString());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate transaction hash format based on network
    if (selectedNetwork === "TRC-20" && !isTronAddress(txHash.trim())) {
      toast.error("Invalid Tron (TRC-20) transaction hash format. Must start with 'T' and be 34 characters.");
      return;
    }

    if (selectedNetwork === "BEP-20" && !isBscAddress(txHash.trim())) {
      toast.error("Invalid BSC (BEP-20) transaction hash format. Must start with '0x' and be 42 characters.");
      return;
    }

    // Validate with zod schema
    const validation = depositSchema.safeParse({
      amount: parseFloat(amount),
      txHash: txHash,
      network: selectedNetwork,
    });

    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    const { amount: validatedAmount, txHash: validatedTxHash } = validation.data;

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from("deposits").insert({
        user_id: user.id,
        amount: validatedAmount,
        currency: "USDT",
        network: selectedNetwork,
        tx_hash: validatedTxHash,
        status: "pending",
        verification_type: "manual",
      });

      if (error) throw error;

      toast.success("Deposit request submitted! Verification in progress...");
      setAmount("");
      setTxHash("");
      
      setTimeout(() => {
        navigate("/dashboard");
      }, 2000);
    } catch (error) {
      console.error("Deposit error:", error);
      toast.error("Failed to submit deposit request");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return null;

  const selectedNetworkData = networks[selectedNetwork as keyof typeof networks];

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
            Deposit Crypto
          </h1>
          <p className="text-muted-foreground text-lg">
            Fast and secure deposits to start playing
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <Card className="bg-gradient-card border-border">
            <CardHeader>
              <CardTitle className="text-2xl">Select Payment Method</CardTitle>
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
                          <p className="text-sm font-medium text-accent">{network.fee} Fee</p>
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

              {/* Important Information */}
              <div className="mt-6 bg-accent/10 border border-accent/20 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-6 w-6 text-accent mt-0.5 icon-accent" />
                  <div>
                    <h4 className="font-bold text-foreground mb-2">Important Information</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Send only {selectedNetworkData.name} to this address</li>
                      <li>• Minimum deposit: ${selectedNetworkData.minDeposit}</li>
                      <li>• Processing time: {selectedNetworkData.processingTime}</li>
                      <li>• Copy transaction hash after sending</li>
                      <li>• Funds will be credited after verification</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Deposit Form */}
          <Card className="bg-gradient-card border-border">
            <CardHeader>
              <CardTitle className="text-2xl">Deposit Details</CardTitle>
              <CardDescription>Enter amount and transaction details</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Wallet Address */}
                <div>
                  <Label className="text-base font-semibold">Deposit Address</Label>
                  <div className="mt-2 bg-secondary/20 p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-2 font-mono break-all">
                      {selectedNetworkData.address}
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(selectedNetworkData.address)}
                      className="w-full"
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      Copy Address
                    </Button>
                  </div>
                </div>

                {/* Amount */}
                <div>
                  <Label htmlFor="amount" className="text-base font-semibold">
                    Deposit Amount (USD)
                  </Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder={`Min $${selectedNetworkData.minDeposit}`}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    min={selectedNetworkData.minDeposit}
                    step="0.01"
                    className="mt-2 text-lg"
                    required
                  />
                  <div className="grid grid-cols-4 gap-2 mt-3">
                    {[10, 50, 100, 500].map((value) => (
                      <Button
                        key={value}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuickAmount(value)}
                        className="text-sm"
                      >
                        ${value}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Transaction Hash */}
                <div>
                  <Label htmlFor="txHash" className="text-base font-semibold">
                    Transaction Hash
                  </Label>
                  <Input
                    id="txHash"
                    type="text"
                    placeholder="Enter transaction hash from your wallet"
                    value={txHash}
                    onChange={(e) => setTxHash(e.target.value)}
                    className="mt-2"
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Required for manual verification
                  </p>
                </div>

                {/* Security Notice */}
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="h-6 w-6 text-primary icon-gradient" />
                    <h4 className="font-bold text-foreground">Secure Transaction</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    All deposits are encrypted and verified. Your funds are safe and will be credited after confirmation.
                  </p>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full h-12 text-lg bg-gradient-primary hover:shadow-glow-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Submitting..." : "Submit Deposit Request"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Deposit;
