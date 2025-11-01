import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Send, Trash2 } from "lucide-react";

interface Message {
  id: string;
  user_id: string;
  message: string;
  created_at: string;
  profiles: {
    username: string;
  };
}

export const Chat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    checkUser();
    fetchMessages();
    subscribeToMessages();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
      
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      
      setIsAdmin(roles?.some(r => r.role === "admin") || false);
    }
  };

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from("messages")
      .select("id, user_id, message, created_at")
      .eq("is_deleted", false)
      .order("created_at", { ascending: true })
      .limit(100);

    if (error) {
      console.error("Error fetching messages:", error);
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive",
      });
      return;
    }

    // Fetch profiles separately
    if (data && data.length > 0) {
      const userIds = [...new Set(data.map(m => m.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username")
        .in("id", userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p.username]) || []);
      
      const messagesWithProfiles = data.map(msg => ({
        ...msg,
        profiles: { username: profileMap.get(msg.user_id) || "Unknown" }
      }));

      setMessages(messagesWithProfiles);
    }
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel("messages-channel")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        async (payload) => {
          // Fetch the profile data for the new message
          const { data } = await supabase
            .from("profiles")
            .select("username")
            .eq("id", payload.new.user_id)
            .single();

          const newMsg = {
            ...payload.new,
            profiles: { username: data?.username || "Unknown" },
          } as Message;

          setMessages((current) => [...current, newMsg]);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          if (payload.new.is_deleted) {
            setMessages((current) =>
              current.filter((msg) => msg.id !== payload.new.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || loading) return;

    setLoading(true);
    const messageContent = newMessage.trim();
    setNewMessage("");

    const { error } = await supabase.from("messages").insert({
      user_id: currentUserId,
      message: messageContent,
    });

    if (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
      setNewMessage(messageContent);
    }

    setLoading(false);
  };

  const deleteMessage = async (messageId: string) => {
    const { error } = await supabase
      .from("messages")
      .update({ is_deleted: true })
      .eq("id", messageId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete message",
        variant: "destructive",
      });
    }
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="flex flex-col h-[600px] bg-card rounded-lg border shadow-sm">
      <div className="p-4 border-b">
        <h2 className="text-xl font-bold">Global Chat</h2>
        <p className="text-sm text-muted-foreground">
          Chat with other players
        </p>
      </div>

      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((message) => {
            const isOwn = message.user_id === currentUserId;
            return (
              <div
                key={message.id}
                className={`flex gap-3 ${isOwn ? "flex-row-reverse" : ""}`}
              >
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className="text-xs bg-primary/20 text-primary">
                    {message.profiles?.username?.[0]?.toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
                <div className={`flex flex-col ${isOwn ? "items-end" : ""}`}>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {message.profiles?.username || "Unknown"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatTime(message.created_at)}
                    </span>
                  </div>
                  <div className="group relative">
                    <div
                      className={`mt-1 px-3 py-2 rounded-lg max-w-md break-words ${
                        isOwn
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary"
                      }`}
                    >
                      {message.message}
                    </div>
                    {(isOwn || isAdmin) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute -right-8 top-1/2 -translate-y-1/2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => deleteMessage(message.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      <form onSubmit={sendMessage} className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            maxLength={500}
            disabled={loading}
            className="flex-1"
          />
          <Button type="submit" disabled={!newMessage.trim() || loading}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
};
