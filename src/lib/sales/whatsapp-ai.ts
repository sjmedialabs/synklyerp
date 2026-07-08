type ChatMessage = { direction: string; body: string; senderType?: string };

const HUMAN_ESCALATION = /\b(pricing|quote|contract|complaint|urgent|manager|human|call me)\b/i;

export function generateChatSummary(messages: ChatMessage[]): string {
  if (messages.length === 0) return "No messages yet.";
  const recent = messages.slice(-12);
  const inbound = recent.filter((m) => m.direction === "inbound").length;
  const outbound = recent.filter((m) => m.direction === "outbound").length;
  const lastInbound = [...recent].reverse().find((m) => m.direction === "inbound");
  const topics = lastInbound?.body.slice(0, 120) ?? "General inquiry";
  return `Conversation has ${inbound} inbound and ${outbound} outbound messages. Latest lead message: "${topics}".`;
}

export function maybeAutoReply(
  messages: ChatMessage[],
  aiMode: string
): { reply: string | null; needsHuman: boolean } {
  const last = messages[messages.length - 1];
  if (!last || last.direction !== "inbound") return { reply: null, needsHuman: false };

  if (HUMAN_ESCALATION.test(last.body)) {
    return {
      reply: "Thanks for your message. A team member will follow up with you shortly.",
      needsHuman: true,
    };
  }

  if (aiMode !== "auto") return { reply: null, needsHuman: false };

  const text = last.body.toLowerCase();
  if (text.includes("hello") || text.includes("hi")) {
    return { reply: "Hello! Thanks for reaching out. How can we help you today?", needsHuman: false };
  }
  if (text.includes("price") || text.includes("cost")) {
    return {
      reply: "We'd be happy to share pricing details. Could you tell us more about your requirements?",
      needsHuman: true,
    };
  }
  return {
    reply: "Thank you for your message. We've received it and will get back to you soon.",
    needsHuman: false,
  };
}
