import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Send, Trash2, Loader2, MessageSquare, Check, X } from "lucide-react";
import { toast } from "sonner";
import { useCoachChat, type ChatMessage } from "@/hooks/use-coach-chat";

const QUICK_PROMPTS = [
  "How did I do today?",
  "Make tomorrow easier",
  "I missed my workout",
  "I don't like this meal",
  "Give me a high-protein snack",
  "Change my workout",
  "What should I focus on today?",
  "Explain my progress",
];

export function CoachChat() {
  const chat = useCoachChat();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [chat.messages.length, chat.sending]);

  const submit = async (text: string) => {
    if (!text.trim() || chat.sending) return;
    setInput("");
    await chat.sendMessage(text);
  };

  return (
    <section className="rounded-2xl border border-border bg-card overflow-hidden">
      <header className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <MessageSquare className="h-3.5 w-3.5" /> Chat with AI Coach
        </div>
        {chat.messages.length > 0 && (
          <button
            onClick={async () => {
              if (confirm("Clear all chat history?")) {
                await chat.clearChat();
                toast.success("Chat cleared");
              }
            }}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <Trash2 className="h-3.5 w-3.5" /> Clear
          </button>
        )}
      </header>

      <div ref={scrollRef} className="max-h-[480px] overflow-y-auto px-4 py-4 space-y-3">
        {chat.loading ? (
          <div className="text-sm text-muted-foreground">Loading…</div>
        ) : chat.messages.length === 0 ? (
          <div className="rounded-xl bg-secondary/40 p-4 text-sm text-muted-foreground">
            Hi! I'm your AI Coach. Ask me anything about your workouts, meals, or progress — or pick
            a quick prompt below.
          </div>
        ) : (
          chat.messages.map((m) => (
            <MessageBubble
              key={m.id}
              message={m}
              onConfirm={(idx) => chat.confirmAction(m.id, idx).then(() => toast.success("Done"))}
              onCancel={(idx) => chat.cancelAction(m.id, idx)}
            />
          ))
        )}
        {chat.sending && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Coach is thinking…
          </div>
        )}
        {chat.error && (
          <div className="rounded-lg bg-destructive/10 p-2 text-xs text-destructive">
            {chat.error}
          </div>
        )}
      </div>

      <div className="border-t border-border px-4 py-3 space-y-3">
        <div className="flex flex-wrap gap-1.5">
          {QUICK_PROMPTS.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => submit(q)}
              disabled={chat.sending}
              className="rounded-full border border-border bg-background px-3 py-1 text-xs hover:bg-secondary disabled:opacity-50"
            >
              {q}
            </button>
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit(input);
          }}
          className="flex items-end gap-2"
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit(input);
              }
            }}
            placeholder="Ask your coach…"
            rows={1}
            className="flex-1 resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            disabled={chat.sending}
          />
          <button
            type="submit"
            disabled={chat.sending || !input.trim()}
            className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-primary-foreground disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </section>
  );
}

function MessageBubble({
  message,
  onConfirm,
  onCancel,
}: {
  message: ChatMessage;
  onConfirm: (idx: number) => void;
  onCancel: (idx: number) => void;
}) {
  const isUser = message.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[85%] space-y-2 ${isUser ? "items-end" : "items-start"}`}>
        <div
          className={`rounded-2xl px-3.5 py-2 text-sm ${
            isUser ? "bg-primary text-primary-foreground" : "bg-secondary/60 text-foreground"
          }`}
        >
          {message.content}
        </div>
        {!isUser && message.actions.length > 0 && (
          <div className="space-y-2">
            {message.actions.map((a, idx) => (
              <ActionCard
                key={idx}
                state={a}
                onConfirm={() => onConfirm(idx)}
                onCancel={() => onCancel(idx)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ActionCard({
  state,
  onConfirm,
  onCancel,
}: {
  state: { action: import("@/lib/ai/chat.functions").CoachAction; status: string };
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const a = state.action;
  const isPending = state.status === "pending";
  return (
    <div className="rounded-xl border border-border bg-background p-3">
      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Suggested action
      </div>
      <div className="mt-1 text-sm font-semibold">{a.title}</div>
      {a.description && <div className="text-xs text-muted-foreground">{a.description}</div>}
      {a.target_date && (
        <div className="mt-1 text-[10px] uppercase text-muted-foreground">For {a.target_date}</div>
      )}
      {isPending ? (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <button
            onClick={onConfirm}
            className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground"
          >
            <Check className="h-3 w-3" /> Confirm
          </button>
          <button
            onClick={onCancel}
            className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-3 py-1 text-xs font-semibold hover:bg-secondary"
          >
            <X className="h-3 w-3" /> Cancel
          </button>
          {a.type === "open_link" && a.link && (
            <Link to={a.link} className="text-xs font-semibold text-primary hover:underline">
              Open →
            </Link>
          )}
        </div>
      ) : (
        <div className="mt-2 text-xs text-muted-foreground">
          {state.status === "applied" ? "✓ Applied" : "Cancelled"}
        </div>
      )}
    </div>
  );
}
