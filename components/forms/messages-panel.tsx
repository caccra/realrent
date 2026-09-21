"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { Button, Card, Textarea } from "@/components/ui";

type Message = {
  id: string;
  body: string;
  senderId: string;
  createdAt: string;
  sender: { name: string; role: string | null };
};

export function MessagesPanel({ leaseId }: { leaseId: string }) {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  async function fetchMessages(): Promise<Message[] | null> {
    try {
      const res = await fetch(`/api/leases/${leaseId}/messages`);
      if (!res.ok) return null;
      const body = await res.json();
      return body.messages;
    } catch {
      // Network hiccup or server temporarily unreachable — just skip this poll.
      return null;
    }
  }

  async function load() {
    const data = await fetchMessages();
    if (data) setMessages(data);
  }

  useEffect(() => {
    let ignore = false;

    fetchMessages().then((data) => {
      if (!ignore && data) setMessages(data);
    });

    const interval = setInterval(() => {
      fetchMessages().then((data) => {
        if (!ignore && data) setMessages(data);
      });
    }, 15000);

    return () => {
      ignore = true;
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leaseId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "nearest" });
  }, [messages.length]);

  async function handleSend() {
    const text = draft.trim();
    if (!text) return;
    setError(null);
    setSending(true);
    try {
      const res = await fetch(`/api/leases/${leaseId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Something went wrong");
        return;
      }
      setDraft("");
      await load();
    } finally {
      setSending(false);
    }
  }

  const userId = session?.user?.id;

  return (
    <Card>
      <h2 className="mb-3 text-base font-medium text-slate-900">Messages</h2>
      <div className="max-h-64 space-y-2 overflow-y-auto rounded-md border border-slate-100 bg-slate-50 p-3">
        {messages.length === 0 ? (
          <p className="text-sm text-slate-500">No messages yet. Say hello.</p>
        ) : (
          messages.map((m) => {
            const isOwn = m.senderId === userId;
            return (
              <div key={m.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                    isOwn ? "bg-emerald-700 text-white" : "bg-white text-slate-900 border border-slate-200"
                  }`}
                >
                  {!isOwn && <p className="mb-0.5 text-xs font-medium opacity-70">{m.sender.name}</p>}
                  <p>{m.body}</p>
                  <p className={`mt-1 text-[10px] ${isOwn ? "text-emerald-100" : "text-slate-400"}`}>
                    {new Date(m.createdAt).toLocaleString("en-UG")}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <div className="mt-3 flex gap-2">
        <Textarea
          rows={1}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Write a message…"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <Button type="button" onClick={handleSend} disabled={sending || !draft.trim()}>
          Send
        </Button>
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </Card>
  );
}
