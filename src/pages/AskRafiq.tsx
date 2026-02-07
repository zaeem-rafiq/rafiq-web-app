import { useState, useRef, useEffect } from "react";
import { Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { httpsCallable, functions } from "@/lib/firebase";
import rafiqLogo from "@/assets/rafiq-logo.png";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

const suggestedQuestions = [
  "Is AAPL halal?",
  "How do I calculate zakat?",
  "What's the difference between zakat and sadaqah?",
  "Can I invest in index funds?",
];

const askRafiq = httpsCallable(functions, "askRafiqWeb");

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-4 py-3">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="h-2 w-2 rounded-full bg-primary"
          style={{ animation: `pulse-dot 1.4s ease-in-out ${i * 0.2}s infinite` }}
        />
      ))}
    </div>
  );
}

export default function AskRafiq() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const send = async (text: string) => {
    if (!text.trim() || isLoading) return;
    const userMsg: Msg = { role: "user", content: text.trim() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    try {
      const conversationHistory = updatedMessages.map(({ role, content }) => ({ role, content }));
      const result = await askRafiq({ message: text.trim(), conversationHistory });
      const response = (result.data as { response: string }).response;
      setMessages((prev) => [...prev, { role: "assistant", content: response }]);
    } catch (e) {
      console.error("Chat error:", e);
      toast({ title: "Error", description: "Could not reach Rafiq. Please try again.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex h-[calc(100vh-4rem)] flex-col">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-8">
        <div className="container mx-auto max-w-2xl space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center gap-5 py-16 text-center">
              <img src={rafiqLogo} alt="Rafiq" className="h-16 w-auto" />
              <h2 className="font-heading text-2xl font-bold text-foreground">Ask Rafiq</h2>
              <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
                Your AI-powered Islamic finance assistant. Ask about halal investing, zakat, and more.
              </p>
            </div>
          )}

          <AnimatePresence initial={false}>
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-5 py-3.5 text-sm leading-relaxed sm:max-w-[70%] ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "border border-border/50 bg-card text-foreground shadow-sm"
                  }`}
                >
                  {msg.role === "assistant" ? (
                    <div className="prose prose-sm max-w-none dark:prose-invert [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    msg.content
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
            <div className="flex justify-start">
              <div className="rounded-2xl border border-border/50 bg-card shadow-sm">
                <TypingIndicator />
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Bottom input area */}
      <div className="border-t border-border/40 bg-card/80 px-4 pb-4 pt-3 backdrop-blur">
        <div className="container mx-auto max-w-2xl">
          {/* Suggested questions */}
          {messages.length === 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {suggestedQuestions.map((q) => (
                <button
                  key={q}
                  onClick={() => send(q)}
                  className="rounded-full border border-border/50 bg-card px-4 py-2 font-ui text-xs font-medium text-muted-foreground shadow-sm transition-colors hover:border-primary/30 hover:text-foreground"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex gap-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about Islamic finance..."
              disabled={isLoading}
              className="flex-1 rounded-2xl border border-border/50 bg-card px-5 py-3.5 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50"
            />
            <Button
              type="submit"
              size="icon"
              disabled={isLoading || !input.trim()}
              className="h-12 w-12 shrink-0 rounded-2xl"
            >
              <Send size={18} />
            </Button>
          </form>

          <p className="mt-3 text-center text-[10px] text-muted-foreground">
            Rafiq provides educational guidance, not fatwas. Consult a qualified scholar for complex rulings.
          </p>
        </div>
      </div>
    </main>
  );
}
