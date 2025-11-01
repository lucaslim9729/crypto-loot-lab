import { Shield, Lock, Eye } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-card/50 backdrop-blur-sm border-t border-border mt-20">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-center justify-center gap-6 mb-6">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Shield className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium">100% Anonymous</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Lock className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium">Bank-Grade Security</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Eye className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium">Zero Data Collection</span>
          </div>
        </div>
        <p className="text-center text-sm text-muted-foreground max-w-2xl mx-auto">
          Your privacy is our priority. Play with complete anonymity using cryptocurrency. 
          We never collect personal data, track your activity, or share information with third parties. 
          All transactions are secured with end-to-end encryption.
        </p>
        <p className="text-center text-xs text-muted-foreground mt-4">
          © 2025 Crypto Loot Lab. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
