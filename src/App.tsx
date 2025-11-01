import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Admin from "./pages/Admin";
import Deposit from "./pages/Deposit";
import Withdraw from "./pages/Withdraw";
import Referral from "./pages/Referral";
import Support from "./pages/Support";
import SupportTicketDetail from "./pages/SupportTicketDetail";
import Lottery from "./pages/games/Lottery";
import Scratch from "./pages/games/Scratch";
import Runner from "./pages/games/Runner";
import Chest from "./pages/games/Chest";
import Social from "./pages/Social";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/deposit" element={<Deposit />} />
          <Route path="/withdraw" element={<Withdraw />} />
          <Route path="/referral" element={<Referral />} />
          <Route path="/support" element={<Support />} />
          <Route path="/support/:ticketId" element={<SupportTicketDetail />} />
          <Route path="/games/lottery" element={<Lottery />} />
          <Route path="/games/scratch" element={<Scratch />} />
          <Route path="/games/runner" element={<Runner />} />
          <Route path="/games/chest" element={<Chest />} />
          <Route path="/social" element={<Social />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
