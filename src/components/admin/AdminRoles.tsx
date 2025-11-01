import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Shield, ShieldCheck, UserCog } from "lucide-react";

interface UserWithRole {
  id: string;
  username: string;
  user_roles: { role: string }[];
}

export const AdminRoles = () => {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<string>("user");

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      // Fetch all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, username")
        .order("username");

      if (profilesError) throw profilesError;

      // Fetch all user roles
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) throw rolesError;

      // Combine the data
      const usersWithRoles = profiles?.map(profile => ({
        ...profile,
        user_roles: roles?.filter(r => r.user_id === profile.id).map(r => ({ role: r.role })) || []
      })) || [];

      setUsers(usersWithRoles);
    } catch (error: any) {
      toast.error("Failed to load users");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const assignRole = async () => {
    if (!selectedUser) {
      toast.error("Please select a user");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from("user_roles")
        .insert({
          user_id: selectedUser,
          role: selectedRole as "admin" | "moderator" | "user",
          granted_by: user?.id
        });

      if (error) {
        if (error.code === "23505") {
          toast.error("User already has this role");
          return;
        }
        throw error;
      }

      toast.success("Role assigned successfully");
      setSelectedUser("");
      loadUsers();
    } catch (error: any) {
      toast.error(`Failed to assign role: ${error.message}`);
    }
  };

  const removeRole = async (userId: string, role: string) => {
    if (!confirm(`Remove ${role} role from this user?`)) return;

    try {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role", role as "admin" | "moderator" | "user");

      if (error) throw error;

      toast.success("Role removed");
      loadUsers();
    } catch (error: any) {
      toast.error("Failed to remove role");
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin": return <ShieldCheck className="h-4 w-4" />;
      case "moderator": return <Shield className="h-4 w-4" />;
      default: return <UserCog className="h-4 w-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin": return "bg-red-500";
      case "moderator": return "bg-blue-500";
      default: return "bg-gray-500";
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading users...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-4 items-end">
        <div className="flex-1">
          <label className="text-sm font-medium mb-2 block">Select User</label>
          <Select value={selectedUser} onValueChange={setSelectedUser}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a user..." />
            </SelectTrigger>
            <SelectContent>
              {users.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.username}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-40">
          <label className="text-sm font-medium mb-2 block">Role</label>
          <Select value={selectedRole} onValueChange={setSelectedRole}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="user">User</SelectItem>
              <SelectItem value="moderator">Moderator</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={assignRole}>Assign Role</Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Username</TableHead>
              <TableHead>Roles</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.username}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    {user.user_roles.length > 0 ? (
                      user.user_roles.map((ur, idx) => (
                        <Badge key={idx} className={getRoleColor(ur.role)}>
                          <span className="mr-1">{getRoleIcon(ur.role)}</span>
                          {ur.role}
                        </Badge>
                      ))
                    ) : (
                      <Badge variant="outline">No roles</Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {user.user_roles.map((ur, idx) => (
                    <Button
                      key={idx}
                      size="sm"
                      variant="destructive"
                      onClick={() => removeRole(user.id, ur.role)}
                      className="mr-2"
                    >
                      Remove {ur.role}
                    </Button>
                  ))}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};