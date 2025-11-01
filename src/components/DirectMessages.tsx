import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Send, Trash2 } from "lucide-react";

interface DirectMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
}

interface DirectMessagesProps {
  otherUserId: string;
  otherUsername: string;
}

export const DirectMessages = ({ otherUserId, otherUsername }: DirectMessagesProps) => {
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    checkUser();
    fetchMessages();
    subscribeToMessages();
  }, [otherUserId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
    }
  };

  const fetchMessages = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("direct_messages")
      .select("*")
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching messages:", error);
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive",
      });
      return;
    }

    setMessages(data || []);

    // Mark messages as read
    await supabase
      .from("direct_messages")
      .update({ is_read: true })
      .eq("receiver_id", user.id)
      .eq("sender_id", otherUserId)
      .eq("is_read", false);
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel("direct-messages-channel")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "direct_messages",
        },
        async (payload) => {
          const newMsg = payload.new as DirectMessage;
          
          // Only add if it's related to this conversation
          if (
            (newMsg.sender_id === otherUserId && newMsg.receiver_id === currentUserId) ||
            (newMsg.sender_id === currentUserId && newMsg.receiver_id === otherUserId)
          ) {
            setMessages((current) => [...current, newMsg]);
            
            // Mark as read if we're the receiver
            if (newMsg.receiver_id === currentUserId) {
              await supabase
                .from("direct_messages")
                .update({ is_read: true })
                .eq("id", newMsg.id);
            }
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
    if (!newMessage.trim() || loading || !currentUserId) return;

    setLoading(true);
    const messageContent = newMessage.trim();
    setNewMessage("");

    const { error } = await supabase.from("direct_messages").insert({
      sender_id: currentUserId,
      receiver_id: otherUserId,
      content: messageContent,
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
        <h2 className="text-xl font-bold">Chat with {otherUsername}</h2>
      </div>

      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((message) => {
            const isOwn = message.sender_id === currentUserId;
            return (
              <div
                key={message.id}
                className={`flex gap-3 ${isOwn ? "flex-row-reverse" : ""}`}
              >
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className="text-xs bg-primary/20 text-primary">
                    {isOwn ? "You" : otherUsername[0]?.toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
                <div className={`flex flex-col ${isOwn ? "items-end" : ""}`}>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {isOwn ? "You" : otherUsername}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatTime(message.created_at)}
                    </span>
                  </div>
                  <div
                    className={`mt-1 px-3 py-2 rounded-lg max-w-md break-words ${
                      isOwn
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary"
                    }`}
                  >
                    {message.content}
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
