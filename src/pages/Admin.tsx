import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, Users, CreditCard, Wallet, Ticket, MessageSquare, Trophy, UserCog } from "lucide-react";
import { AdminUsers } from "@/components/admin/AdminUsers";
import { AdminDeposits } from "@/components/admin/AdminDeposits";
import { AdminWithdrawals } from "@/components/admin/AdminWithdrawals";
import { AdminRaffles } from "@/components/admin/AdminRaffles";
import { AdminAnnouncements } from "@/components/admin/AdminAnnouncements";
import { AdminSupport } from "@/components/admin/AdminSupport";
import { AdminRoles } from "@/components/admin/AdminRoles";

const Admin = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/auth");
        return;
      }

      // Check if user has admin role
      const { data: roles, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin");

      if (error) throw error;

      if (!roles || roles.length === 0) {
        toast.error("Access denied. Admin privileges required.");
        navigate("/dashboard");
        return;
      }

      setIsAdmin(true);
    } catch (error: any) {
      console.error("Error checking admin access:", error);
      toast.error("Failed to verify admin access");
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate("/dashboard")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Admin Panel</h1>
              <p className="text-muted-foreground">Manage your platform</p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-7 lg:w-auto">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Users</span>
            </TabsTrigger>
            <TabsTrigger value="deposits" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              <span className="hidden sm:inline">Deposits</span>
            </TabsTrigger>
            <TabsTrigger value="withdrawals" className="flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              <span className="hidden sm:inline">Withdrawals</span>
            </TabsTrigger>
            <TabsTrigger value="raffles" className="flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              <span className="hidden sm:inline">Raffles</span>
            </TabsTrigger>
            <TabsTrigger value="announcements" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Announcements</span>
            </TabsTrigger>
            <TabsTrigger value="support" className="flex items-center gap-2">
              <Ticket className="h-4 w-4" />
              <span className="hidden sm:inline">Support</span>
            </TabsTrigger>
            <TabsTrigger value="roles" className="flex items-center gap-2">
              <UserCog className="h-4 w-4" />
              <span className="hidden sm:inline">Roles</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>View and manage all registered users</CardDescription>
              </CardHeader>
              <CardContent>
                <AdminUsers />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="deposits">
            <Card>
              <CardHeader>
                <CardTitle>Deposit Management</CardTitle>
                <CardDescription>Review and approve deposit requests</CardDescription>
              </CardHeader>
              <CardContent>
                <AdminDeposits />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="withdrawals">
            <Card>
              <CardHeader>
                <CardTitle>Withdrawal Management</CardTitle>
                <CardDescription>Process withdrawal requests</CardDescription>
              </CardHeader>
              <CardContent>
                <AdminWithdrawals />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="raffles">
            <Card>
              <CardHeader>
                <CardTitle>Raffle Management</CardTitle>
                <CardDescription>Create and manage raffles</CardDescription>
              </CardHeader>
              <CardContent>
                <AdminRaffles />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="announcements">
            <Card>
              <CardHeader>
                <CardTitle>Announcement Management</CardTitle>
                <CardDescription>Create and manage platform announcements</CardDescription>
              </CardHeader>
              <CardContent>
                <AdminAnnouncements />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="support">
            <Card>
              <CardHeader>
                <CardTitle>Support Ticket Management</CardTitle>
                <CardDescription>View and respond to user support tickets</CardDescription>
              </CardHeader>
              <CardContent>
                <AdminSupport />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="roles">
            <Card>
              <CardHeader>
                <CardTitle>User Role Management</CardTitle>
                <CardDescription>Assign and manage user roles</CardDescription>
              </CardHeader>
              <CardContent>
                <AdminRoles />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;