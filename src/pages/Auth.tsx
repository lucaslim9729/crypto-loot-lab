import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { z } from "zod";

// MISSION 5: Strong authentication validation with zod
const loginSchema = z.object({
  email: z.string().trim().email("Invalid email address").max(255, "Email must be less than 255 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const signupSchema = z.object({
  username: z.string()
    .trim()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username must be less than 20 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  email: z.string()
    .trim()
    .email("Invalid email address")
    .max(255, "Email must be less than 255 characters"),
  password: z.string()
    .min(12, "Password must be at least 12 characters")
    .regex(/[A-Z]/, "Password must contain an uppercase letter")
    .regex(/[a-z]/, "Password must contain a lowercase letter")
    .regex(/[0-9]/, "Password must contain a number")
    .regex(/[^A-Za-z0-9]/, "Password must contain a special character"),
});

const Auth = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [showVerification, setShowVerification] = useState(false);
  const [pendingSignupData, setPendingSignupData] = useState<{
    email: string;
    password: string;
    username: string;
  } | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = loginSchema.safeParse({ email, password });
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }
    
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: validation.data.email,
        password: validation.data.password,
      });

      if (error) throw error;

      toast.success("Welcome back!");
      navigate("/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Failed to login");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = signupSchema.safeParse({ username, email, password });
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }
    
    setLoading(true);

    try {
      // Send verification code
      const { data, error } = await supabase.functions.invoke("send-verification-code", {
        body: { email: validation.data.email },
      });

      if (error) {
        console.error("Edge function error:", error);
        throw new Error("Failed to send verification code. Please contact support.");
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      // Store signup data for later use
      setPendingSignupData({
        email: validation.data.email,
        password: validation.data.password,
        username: validation.data.username,
      });

      setShowVerification(true);
      toast.success("Verification code sent to your email!");
    } catch (error: any) {
      console.error("Signup error:", error);
      toast.error(error.message || "Failed to send verification code");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!pendingSignupData) {
      toast.error("No pending signup data");
      return;
    }

    if (verificationCode.length !== 6) {
      toast.error("Please enter a 6-digit code");
      return;
    }

    setLoading(true);

    try {
      // Verify code via secure edge function
      const { data: verifyResult, error: verifyError } = await supabase.functions.invoke(
        "verify-code",
        {
          body: {
            email: pendingSignupData.email,
            code: verificationCode,
          },
        }
      );

      if (verifyError || !verifyResult?.valid) {
        toast.error(verifyResult?.error || "Invalid or expired verification code");
        setLoading(false);
        return;
      }

      // Create the account
      const { error: signUpError } = await supabase.auth.signUp({
        email: pendingSignupData.email,
        password: pendingSignupData.password,
        options: {
          data: { username: pendingSignupData.username },
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (signUpError) throw signUpError;

      toast.success("Account created! Logging you in...");
      navigate("/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Failed to verify code");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md p-8 bg-gradient-card border-border">
        <h1 className="text-3xl font-bold text-center mb-2 bg-gradient-primary bg-clip-text text-transparent">
          Crypto Gaming
        </h1>
        <p className="text-center text-muted-foreground mb-6">
          Win big with blockchain gaming
        </p>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="login-password">Password</Label>
                <Input
                  id="login-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-primary hover:shadow-glow-primary"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  "Login"
                )}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="signup">
            {!showVerification ? (
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-username">Username</Label>
                  <Input
                    id="signup-username"
                    type="text"
                    placeholder="Choose a username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password (12+ chars with uppercase, lowercase, number, special char)</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="Create a strong password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-primary hover:shadow-glow-primary"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending code...
                    </>
                  ) : (
                    "Send Verification Code"
                  )}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerifyCode} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="verification-code">Verification Code</Label>
                  <Input
                    id="verification-code"
                    type="text"
                    placeholder="Enter 6-digit code"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    maxLength={6}
                    required
                    className="text-center text-2xl tracking-widest"
                  />
                  <p className="text-sm text-muted-foreground">
                    Enter the 6-digit code sent to {pendingSignupData?.email}
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-primary hover:shadow-glow-primary"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    "Verify & Create Account"
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setShowVerification(false);
                    setVerificationCode("");
                  }}
                >
                  Back
                </Button>
              </form>
            )}
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default Auth;