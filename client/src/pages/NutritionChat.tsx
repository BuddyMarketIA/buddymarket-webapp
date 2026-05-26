import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/contexts/AuthContext";
import { Send, Bot, User, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Streamdown } from "streamdown";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

export default function NutritionChat() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: suggestions } = trpc.nutritionChat.getSuggestions.useQuery(undefined, {
    enabled: !!user,
  });

  const sendMessage = trpc.nutritionChat.sendMessage.useMutation({
    onSuccess: (data) => {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: data.reply,
        timestamp: data.timestamp,
      }]);
      setIsLoading(false);
    },
    onError: () => {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Lo siento, hubo un error al procesar tu pregunta. ¿Puedes intentarlo de nuevo?",
        timestamp: Date.now(),
      }]);
      setIsLoading(false);
    },
  });

  const handleSend = (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText || isLoading) return;

    const userMessage: Message = {
      role: "user",
      content: messageText,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    sendMessage.mutate({
      message: messageText,
      conversationHistory: messages.slice(-10).map(m => ({
        role: m.role,
        content: m.content,
      })),
    });
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!user) {
    return (
      <div className="container max-w-lg mx-auto py-12 text-center">
        <Bot className="w-12 h-12 mx-auto text-orange-500 mb-4" />
        <h1 className="text-2xl font-bold mb-2">BuddyNutri</h1>
        <p className="text-muted-foreground">Inicia sesión para hablar con tu nutricionista IA</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] max-w-2xl mx-auto">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold">BuddyNutri</h1>
            <p className="text-xs text-muted-foreground">Tu nutricionista IA personalizado</p>
          </div>
          <div className="ml-auto flex items-center gap-1 text-xs text-green-500">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Online
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <Sparkles className="w-10 h-10 mx-auto text-orange-400 mb-4" />
            <h2 className="font-semibold text-lg mb-2">¡Hola! Soy BuddyNutri</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Tu nutricionista IA que conoce tu perfil, alergias, objetivos y analíticas.
              Pregúntame lo que quieras sobre nutrición.
            </p>

            {/* Suggested questions */}
            {suggestions?.suggestions && suggestions.suggestions.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-medium">Preguntas sugeridas:</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {suggestions.suggestions.map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSend(q)}
                      className="text-xs px-3 py-2 rounded-full border border-orange-200 text-orange-700 hover:bg-orange-50 transition-colors dark:border-orange-800 dark:text-orange-300 dark:hover:bg-orange-950/30"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "assistant" && (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-white" />
              </div>
            )}
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
              msg.role === "user"
                ? "bg-orange-500 text-white rounded-br-md"
                : "bg-muted rounded-bl-md"
            }`}>
              {msg.role === "assistant" ? (
                <div className="text-sm prose prose-sm dark:prose-invert max-w-none">
                  <Streamdown>{msg.content}</Streamdown>
                </div>
              ) : (
                <p className="text-sm">{msg.content}</p>
              )}
            </div>
            {msg.role === "user" && (
              <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Pregunta sobre nutrición..."
            className="flex-1 px-4 py-3 rounded-full border bg-background focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
            disabled={isLoading}
          />
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || isLoading}
            className="rounded-full w-11 h-11 bg-orange-500 hover:bg-orange-600"
          >
            <Send className="w-4 h-4 text-white" />
          </Button>
        </form>
        <p className="text-xs text-muted-foreground text-center mt-2">
          BuddyNutri conoce tu perfil, alergias y analíticas para respuestas personalizadas
        </p>
      </div>
    </div>
  );
}
