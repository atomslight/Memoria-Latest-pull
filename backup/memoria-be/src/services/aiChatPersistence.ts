import { prisma } from '../config/database';

/**
 * Persist user + assistant messages after an AI chat turn (called from the AI service via internal API).
 */
export async function persistChatMessages(
  userId: string,
  conversationId: string | undefined,
  userMessages: Array<{ role?: string; parts?: unknown }>,
  assistantMessages: unknown[]
): Promise<void> {
  try {
    let convId = conversationId;

    if (!convId) {
      const firstUserMsg = userMessages.find((m) => m.role === 'user');
      const parts = firstUserMsg?.parts;
      let textFromParts: string | undefined;
      if (Array.isArray(parts)) {
        const textPart = parts.find(
          (p: { type?: string; text?: string }) => p?.type === 'text',
        ) as { text?: string } | undefined;
        textFromParts = textPart?.text;
      }
      const title = textFromParts?.slice(0, 60) ?? 'New Conversation';

      const conv = await prisma.conversation.create({
        data: { userId, title },
      });
      convId = conv.id;
    }

    const lastUser = userMessages[userMessages.length - 1];
    if (lastUser?.role === 'user' && lastUser.parts) {
      await prisma.message.create({
        data: {
          conversationId: convId,
          role: 'user',
          parts: lastUser.parts as object,
        },
      });
    }

    for (const msg of assistantMessages as Array<{ role: string; content: unknown }>) {
      if (msg.role === 'assistant') {
        await prisma.message.create({
          data: {
            conversationId: convId,
            role: 'assistant',
            parts: msg.content as object,
          },
        });
      }
    }

    await prisma.conversation.update({
      where: { id: convId },
      data: { updatedAt: new Date() },
    });
  } catch (err) {
    console.error('persistChatMessages error:', err);
  }
}
