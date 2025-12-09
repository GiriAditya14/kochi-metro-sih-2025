import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { chatWithCopilot } from '../services/api';

const WELCOME_MESSAGE = `Hello! I'm your KMRL Copilot. I can help you with:

• **Train assignments** - Why was a train assigned to SERVICE/STANDBY/IBL?
• **Branding SLA** - Check which trains need more exposure
• **Maintenance alerts** - View pending job cards
• **What-if scenarios** - Simulate different situations

How can I help you today?`;

const SUGGESTED_QUERIES = [
  "Why is TS-205 assigned to IBL?",
  "Which trains have branding SLA at risk?",
  "Show me overdue maintenance jobs",
  "What if 3 trains become unavailable?"
];

function MessageBubble({ message, colors }) {
  const isUser = message.role === 'user';
  
  const formatContent = (content) => {
    return content
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\n/g, '\n');
  };

  return (
    <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.assistantBubble, { backgroundColor: isUser ? colors.primary + '20' : colors.card, borderColor: isUser ? colors.primary + '30' : colors.border }]}>
      <View style={[styles.avatar, { backgroundColor: isUser ? colors.warning + '20' : colors.primary + '20' }]}>
        <Ionicons name={isUser ? 'person' : 'sparkles'} size={16} color={isUser ? colors.warning : colors.primary} />
      </View>
      <View style={styles.messageContent}>
        <Text style={[styles.messageText, { color: colors.text }]}>{formatContent(message.content)}</Text>
      </View>
    </View>
  );
}

export default function CopilotScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [messages, setMessages] = useState([{ role: 'assistant', content: WELCOME_MESSAGE }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef(null);


  const handleSend = async () => {
    if (!input.trim() || loading) return;
    
    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const response = await chatWithCopilot(userMessage, {});
      setMessages(prev => [...prev, { role: 'assistant', content: response.data.response }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'I apologize, but I encountered an error. Please try again or check if the backend is running.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestion = (query) => {
    setInput(query);
  };

  useEffect(() => {
    if (flatListRef.current && messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages]);

  return (
    <KeyboardAvoidingView style={[styles.container, { backgroundColor: colors.background }]} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={90}>
      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(_, index) => index.toString()}
        renderItem={({ item }) => <MessageBubble message={item} colors={colors} />}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      {/* Loading indicator */}
      {loading && (
        <View style={[styles.loadingContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>{t('copilot.thinking')}</Text>
        </View>
      )}

      {/* Suggestions */}
      {messages.length <= 2 && (
        <View style={styles.suggestionsContainer}>
          <Text style={[styles.suggestionsLabel, { color: colors.textTertiary }]}>Try asking:</Text>
          <View style={styles.suggestions}>
            {SUGGESTED_QUERIES.map((query, idx) => (
              <TouchableOpacity
                key={idx}
                style={[styles.suggestionChip, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => handleSuggestion(query)}
              >
                <Text style={[styles.suggestionText, { color: colors.textSecondary }]} numberOfLines={1}>{query}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Input */}
      <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <TextInput
          style={[styles.input, { color: colors.text, backgroundColor: colors.background }]}
          value={input}
          onChangeText={setInput}
          placeholder={t('copilot.placeholder')}
          placeholderTextColor={colors.textTertiary}
          multiline
          maxLength={500}
          editable={!loading}
        />
        <TouchableOpacity
          style={[styles.sendButton, { backgroundColor: input.trim() && !loading ? colors.primary : colors.border }]}
          onPress={handleSend}
          disabled={!input.trim() || loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="send" size={18} color="#fff" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  messagesList: { padding: 16, paddingBottom: 8 },
  messageBubble: { flexDirection: 'row', marginBottom: 12, padding: 12, borderRadius: 12, borderWidth: 1 },
  userBubble: { marginLeft: 32 },
  assistantBubble: { marginRight: 32 },
  avatar: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  messageContent: { flex: 1, marginLeft: 12 },
  messageText: { fontSize: 14, lineHeight: 20 },
  loadingContainer: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 8, padding: 12, borderRadius: 12, borderWidth: 1, gap: 8 },
  loadingText: { fontSize: 13 },
  suggestionsContainer: { paddingHorizontal: 16, marginBottom: 8 },
  suggestionsLabel: { fontSize: 12, marginBottom: 8 },
  suggestions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  suggestionChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, borderWidth: 1, maxWidth: '48%' },
  suggestionText: { fontSize: 12 },
  inputContainer: { flexDirection: 'row', alignItems: 'flex-end', padding: 12, borderTopWidth: 1, gap: 8 },
  input: { flex: 1, maxHeight: 100, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, fontSize: 14 },
  sendButton: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
});
