import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Chat } from "@/components/Chat";
import { DirectMessages } from "@/components/DirectMessages";
import { UserList } from "@/components/UserList";
import { ArrowLeft, MessageCircle, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Social = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUsername, setSelectedUsername] = useState<string>("");

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }
    setUser(user);
  };

  const handleSelectUser = (userId: string, username: string) => {
    setSelectedUserId(userId);
    setSelectedUsername(username);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate("/dashboard")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Social Hub
              </h1>
              <p className="text-muted-foreground">
                Connect with other players
              </p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="global" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="global" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Global Chat
            </TabsTrigger>
            <TabsTrigger value="dm" className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              Direct Messages
            </TabsTrigger>
          </TabsList>

          <TabsContent value="global" className="mt-6">
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <Chat />
              </div>

              <div className="space-y-6">
                <Card className="p-6">
                  <h3 className="text-lg font-bold mb-4">Leaderboard</h3>
                  <p className="text-sm text-muted-foreground">
                    Top players will be displayed here...
                  </p>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="dm" className="mt-6">
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                {selectedUserId ? (
                  <DirectMessages
                    otherUserId={selectedUserId}
                    otherUsername={selectedUsername}
                  />
                ) : (
                  <Card className="p-6 h-[600px] flex items-center justify-center">
                    <p className="text-muted-foreground">
                      Select a user from the list to start chatting
                    </p>
                  </Card>
                )}
              </div>

              <div className="space-y-6">
                <UserList onSelectUser={handleSelectUser} />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Social;
