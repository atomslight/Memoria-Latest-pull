import React, { useCallback, useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAuthStore } from '../../stores/authStore';
import { generateAPIUrl } from '../../utils/generateAPIUrl';
import { MessageBubble } from '../../components/chat/MessageBubble';
import { PhotoCardRow } from '../../components/chat/PhotoCardRow';
import { ToolStatusIndicator } from '../../components/chat/ToolStatusIndicator';
import { ChatInput } from '../../components/chat/ChatInput';
import { ConversationDrawer } from '../../components/chat/ConversationDrawer';
import { COLORS, TYPOGRAPHY, SPACING } from '../../constants';
import apiClient from '../../utils/api';

interface Conversation {
  id: string;
  title: string;
  updatedAt: string;
}

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  parts: Array<
    | { type: 'text'; text: string }
    | { type: 'tool-invocation'; toolInvocation?: unknown }
  >;
};

export default function ChatScreen() {
  const token = useAuthStore((s) => s.token);
  const flatListRef = useRef<FlatList>(null);
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<'idle' | 'streaming' | 'error'>('idle');
  const [error, setError] = useState<unknown>(null);

  // Greeting animation
  const logoScale = useRef(new Animated.Value(0.6)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTranslateY = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(logoScale, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(logoOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start(() => {
      Animated.parallel([
        Animated.timing(textOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(textTranslateY, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]).start();
    });
  }, [logoScale, logoOpacity, textOpacity, textTranslateY]);

  const sendMessage = useCallback(
    async ({ text }: { text: string }) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      const userMsg: ChatMessage = {
        id: `${Date.now()}-u`,
        role: 'user',
        parts: [{ type: 'text', text: trimmed }],
      };
      setMessages((prev) => [...prev, userMsg]);

      // No auth token while auth is bypassed → keep UI functional without crashing.
      if (!token) {
        const assistantMsg: ChatMessage = {
          id: `${Date.now()}-a`,
          role: 'assistant',
          parts: [
            {
              type: 'text',
              text:
                'AI chat is disabled while auth is bypassed (no token). Re-enable auth or use a signed-in session to chat.',
            },
          ],
        };
        setMessages((prev) => [...prev, assistantMsg]);
        return;
      }

      setStatus('streaming');
      setError(null);

      try {
        const res = await fetch(generateAPIUrl('/api/v1/ai/chat'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            text: trimmed,
            ...(conversationId ? { conversationId } : {}),
          }),
        });

        const contentType = res.headers.get('content-type') ?? '';
        let replyText = '';

        if (contentType.includes('application/json')) {
          const json: any = await res.json();
          replyText =
            json?.text ??
            json?.message ??
            json?.reply ??
            (typeof json === 'string' ? json : JSON.stringify(json));
        } else {
          replyText = await res.text();
        }

        if (!res.ok) {
          throw new Error(replyText || `Request failed (${res.status})`);
        }

        const assistantMsg: ChatMessage = {
          id: `${Date.now()}-a`,
          role: 'assistant',
          parts: [{ type: 'text', text: replyText || 'OK' }],
        };
        setMessages((prev) => [...prev, assistantMsg]);
        setStatus('idle');
      } catch (err) {
        console.error('Chat error:', err);
        setError(err);
        setStatus('error');
        Alert.alert('Error', 'Chat failed. Please try again.');
      }
    },
    [token, conversationId]
  );

  const isStreaming = status === 'streaming';

  const handleSend = useCallback((text: string) => {
    sendMessage({ text });
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  }, [sendMessage]);

  const loadConversations = useCallback(async () => {
    try {
      const res = await apiClient.get('/api/v1/ai/conversations');
      setConversations(res.data.conversations ?? []);
    } catch (e) {
      console.error('Failed to load conversations:', e);
    }
  }, []);

  const handleOpenDrawer = useCallback(async () => {
    await loadConversations();
    setDrawerVisible(true);
  }, [loadConversations]);

  const handleSelectConversation = useCallback((id: string) => {
    setConversationId(id);
    setDrawerVisible(false);
  }, []);

  const handleNewChat = useCallback(() => {
    setConversationId(undefined);
    setDrawerVisible(false);
  }, []);

  const handleDeleteConversation = useCallback(async (id: string) => {
    try {
      await apiClient.delete(`/api/v1/ai/conversations/${id}`);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (conversationId === id) setConversationId(undefined);
    } catch (e) {
      console.error('Failed to delete conversation:', e);
    }
  }, [conversationId]);

  const renderMessage = useCallback(({ item }: { item: (typeof messages)[0] }) => (
    <View>
      {item.parts.map((part, i) => {
        if (part.type === 'text') {
          return (
            <MessageBubble
              key={i}
              text={part.text}
              role={item.role as 'user' | 'assistant'}
              isStreaming={isStreaming && item.role === 'assistant'}
            />
          );
        }
        if (part.type === 'tool-invocation') {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const inv = part as any;
          if (inv.toolInvocation?.toolName !== 'searchPhotos') return null;
          if (inv.toolInvocation?.state === 'result') {
            const photos = (inv.toolInvocation.result as { photos: { photoId: string; thumbnailUrl: string; caption: string | null; capturedAt: string }[] })?.photos ?? [];
            return <PhotoCardRow key={i} photos={photos} />;
          }
          return <ToolStatusIndicator key={i} label="Searching your memories..." />;
        }
        return null;
      })}
    </View>
  ), [isStreaming]);

  // Get time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleOpenDrawer}
          style={styles.headerIconButton}
          accessibilityRole="button"
          accessibilityLabel="Conversation history"
        >
          <Ionicons name="menu-outline" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Memoria</Text>

        <TouchableOpacity
          onPress={handleNewChat}
          style={styles.headerIconButton}
          accessibilityRole="button"
          accessibilityLabel="New conversation"
        >
          <Ionicons name="create-outline" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Messages or empty state */}
      {messages.length === 0 ? (
        <View style={styles.emptyState}>
          <Animated.View
            style={[
              styles.logoContainer,
              {
                opacity: logoOpacity,
                transform: [{ scale: logoScale }],
              },
            ]}
          >
            <View style={styles.logoCircle}>
              <Ionicons name="sparkles" size={28} color={COLORS.black} />
            </View>
          </Animated.View>

          <Animated.View
            style={{
              opacity: textOpacity,
              transform: [{ translateY: textTranslateY }],
              alignItems: 'center',
            }}
          >
            <Text style={styles.greetingText}>
              {getGreeting()}
            </Text>
            <Text style={styles.greetingSubtext}>
              What memories would you like to explore?
            </Text>
          </Animated.View>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Input */}
      <ChatInput onSend={handleSend} isStreaming={isStreaming} />

      {/* Conversation drawer */}
      <ConversationDrawer
        visible={drawerVisible}
        conversations={conversations}
        onSelect={handleSelectConversation}
        onNew={handleNewChat}
        onDelete={handleDeleteConversation}
        onClose={() => setDrawerVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  headerIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...TYPOGRAPHY.body1,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  // ── Empty state ──
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
    gap: SPACING.lg,
  },
  logoContainer: {
    marginBottom: SPACING.sm,
  },
  logoCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.brandYellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  greetingText: {
    ...TYPOGRAPHY.h2,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  greetingSubtext: {
    ...TYPOGRAPHY.body1,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
  // ── Messages ──
  messageList: {
    paddingVertical: SPACING.md,
    flexGrow: 1,
  },
});
