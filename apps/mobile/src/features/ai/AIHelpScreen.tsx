import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { theme } from '@shared/theme/theme';
import { GroqClient } from '@core/ai/GroqClient';
import { SmsFallback } from '@core/ai/SmsFallback';
import { useLocation } from '@shared/hooks/useLocation';

interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
}

export default function AIHelpScreen() {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { id: '0', role: 'ai', content: 'Describe your emergency or ask for advice (e.g. "How to treat a burn", "Engine smoking").' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const { location } = useLocation();

  const handleSend = async () => {
    if (!query.trim()) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: query.trim() };
    setMessages(prev => [...prev, userMsg]);
    setQuery('');
    setIsLoading(true);

    try {
      const response = await GroqClient.ask(userMsg.content);
      const aiMsg: Message = { id: (Date.now() + 1).toString(), role: 'ai', content: response };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err: any) {
      const errorMsg: Message = { 
        id: (Date.now() + 1).toString(), 
        role: 'ai', 
        content: `${err.message || 'Error occurred.'}\n\nWould you like to try SMS fallback?` 
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSmsFallback = () => {
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
    const textToFailover = lastUserMsg ? lastUserMsg.content : 'Help';
    SmsFallback.triggerSmsFallback(textToFailover, location);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>AI Assist</Text>
      
      <ScrollView style={styles.chatArea} contentContainerStyle={{ padding: theme.spacing.md }}>
        {messages.map(m => (
          <View key={m.id} style={[styles.bubble, m.role === 'user' ? styles.userBubble : styles.aiBubble]}>
            <Text style={styles.bubbleText}>{m.content}</Text>
          </View>
        ))}
        {isLoading && (
          <View style={[styles.bubble, styles.aiBubble]}>
            <ActivityIndicator size="small" color={theme.colors.text.primary} />
          </View>
        )}
      </ScrollView>

      <View style={styles.inputArea}>
        <TextInput
          style={styles.input}
          value={query}
          onChangeText={setQuery}
          placeholder="Ask for help..."
          placeholderTextColor={theme.colors.text.disabled}
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleSend} disabled={isLoading}>
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.smsButton} onPress={handleSmsFallback}>
        <Text style={styles.smsButtonText}>Use SMS Fallback (Free)</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingTop: 60,
  },
  title: {
    ...theme.typography.screenTitle,
    color: theme.colors.text.primary,
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  chatArea: {
    flex: 1,
  },
  bubble: {
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    marginBottom: theme.spacing.sm,
    maxWidth: '85%',
  },
  userBubble: {
    backgroundColor: theme.colors.policeBlue,
    alignSelf: 'flex-end',
    borderBottomRightRadius: 0,
  },
  aiBubble: {
    backgroundColor: theme.colors.surfaceElevated,
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 0,
    borderColor: theme.colors.border,
    borderWidth: 1,
  },
  bubbleText: {
    color: theme.colors.text.primary,
    fontSize: 16,
    lineHeight: 22,
  },
  inputArea: {
    flexDirection: 'row',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  input: {
    flex: 1,
    backgroundColor: theme.colors.background,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.radius.sm,
    paddingHorizontal: theme.spacing.md,
    color: theme.colors.text.primary,
    marginRight: theme.spacing.sm,
  },
  sendButton: {
    backgroundColor: theme.colors.policeBlue,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.sm,
  },
  sendButtonText: {
    color: theme.colors.text.primary,
    fontWeight: '700',
  },
  smsButton: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
  },
  smsButtonText: {
    color: theme.colors.text.secondary,
    textDecorationLine: 'underline',
  }
});
