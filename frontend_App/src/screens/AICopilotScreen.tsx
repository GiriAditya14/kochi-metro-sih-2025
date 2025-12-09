import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { chatWithCopilot } from '../lib/api';
import { colors } from '../lib/utils';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const suggestedQueries = [
  "Why is TS-205 assigned to IBL?",
  "Which trains have branding SLA at risk?",
  "Show me overdue maintenance jobs",
  "What if 3 trains become unavailable?",
];

export default function AICopilotScreen() {
  const navigation = useNavigation();
  const scrollViewRef = useRef<ScrollView>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Hello! I'm your KMRL Copilot. I can help you with:

• Train assignments - Why was a train assigned to SERVICE/STANDBY/IBL?
• Branding SLA - Check which trains need more exposure
• Maintenance alerts - View pending job cards
• What-if scenarios - Simulate different situations

How can I help you today?`,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getMockResponse = (query: string): string => {
    const q = query.toLowerCase();
    if (q.includes('205') || q.includes('ibl')) {
      return `TS-205 is currently assigned to SERVICE because:

• All fitness certificates are valid (528+ hours remaining)
• No pending safety-critical maintenance jobs
• Excellent health score of 95%
• Branding contract with Federal Bank requires peak hour exposure

The train is in optimal condition for revenue service.`;
    }
    if (q.includes('branding') || q.includes('sla')) {
      return `Trains with branding SLA at risk:

1. **TS-206** - Kalyan Jewellers (Gold)
   • Weekly target: 50h, Current: 32h (36% deficit)
   • Urgency score: 72%
   • Recommendation: Prioritize for peak hours

2. **TS-201** - Muthoot Finance (Gold)
   • Weekly target: 50h, Current: 45h (10% deficit)
   • On track but needs monitoring`;
    }
    if (q.includes('maintenance') || q.includes('job')) {
      return `Overdue/Critical maintenance jobs:

1. **WO-2025-001** - TS-203
   • Brake pad replacement (Safety Critical)
   • Priority: 2, Due: Dec 10
   
2. **WO-2025-004** - TS-208
   • Traction motor overhaul (Safety Critical)
   • Priority: 1, In Progress

Action: TS-203 should remain in IBL until brake inspection is complete.`;
    }
    if (q.includes('unavailable') || q.includes('what if')) {
      return `If 3 trains become unavailable:

• Service capacity drops from 18 to 15 trains
• Standby reduced to 0 (no backup)
• Peak hour frequency may need adjustment
• Branding SLA penalties likely for Gold contracts

Recommendation: Expedite maintenance on IBL trains to maintain buffer.`;
    }
    return `I can help you with:

• **Train assignments** - "Why is TS-205 assigned to IBL?"
• **Branding SLA** - "Which trains have branding at risk?"
• **Maintenance** - "Show overdue maintenance jobs"
• **Scenarios** - "What if 3 trains become unavailable?"

What would you like to know?`;
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const response = await chatWithCopilot(userMessage, {});
      setMessages((prev) => [...prev, { role: 'assistant', content: response.data.response }]);
    } catch (err) {
      const mockResponse = getMockResponse(userMessage);
      setMessages((prev) => [...prev, { role: 'assistant', content: mockResponse }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestion = (query: string) => {
    setInput(query);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={100}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <View style={styles.headerIcon}>
            <Text style={styles.headerIconText}>✨</Text>
          </View>
          <View>
            <Text style={styles.headerTitle}>AI Copilot</Text>
            <Text style={styles.headerSubtitle}>Powered by Gemini</Text>
          </View>
        </View>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
      >
        {messages.map((msg, idx) => (
          <View
            key={idx}
            style={[
              styles.messageRow,
              msg.role === 'user' ? styles.messageRowUser : styles.messageRowAssistant,
            ]}
          >
            <View
              style={[
                styles.messageAvatar,
                msg.role === 'user' ? styles.avatarUser : styles.avatarAssistant,
              ]}
            >
              <Text style={styles.avatarText}>{msg.role === 'user' ? '👤' : '🤖'}</Text>
            </View>
            <View
              style={[
                styles.messageBubble,
                msg.role === 'user' ? styles.bubbleUser : styles.bubbleAssistant,
              ]}
            >
              <Text style={styles.messageText}>{msg.content}</Text>
            </View>
          </View>
        ))}

        {loading && (
          <View style={[styles.messageRow, styles.messageRowAssistant]}>
            <View style={[styles.messageAvatar, styles.avatarAssistant]}>
              <Text style={styles.avatarText}>🤖</Text>
            </View>
            <View style={[styles.messageBubble, styles.bubbleAssistant]}>
              <View style={styles.loadingRow}>
                <ActivityIndicator size="small" color={colors.primary[400]} />
                <Text style={styles.loadingText}>Thinking...</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Suggested Queries */}
      {messages.length <= 2 && (
        <View style={styles.suggestionsContainer}>
          <Text style={styles.suggestionsLabel}>Try asking:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {suggestedQueries.map((query, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.suggestionBtn}
                onPress={() => handleSuggestion(query)}
              >
                <Text style={styles.suggestionText}>{query}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={input}
          onChangeText={setInput}
          placeholder="Ask about trains, plans, or scenarios..."
          placeholderTextColor={colors.text.muted}
          multiline
          maxLength={500}
          editable={!loading}
          onSubmitEditing={handleSend}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!input.trim() || loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.sendBtnText}>➤</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.slate[800],
    gap: 12,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  backIcon: {
    fontSize: 20,
    color: colors.text.secondary,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primary[600],
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerIconText: {
    fontSize: 18,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  headerSubtitle: {
    fontSize: 11,
    color: colors.text.muted,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },
  messageRowUser: {
    flexDirection: 'row-reverse',
  },
  messageRowAssistant: {
    flexDirection: 'row',
  },
  messageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarUser: {
    backgroundColor: colors.orange[500] + '30',
  },
  avatarAssistant: {
    backgroundColor: colors.primary[500] + '30',
  },
  avatarText: {
    fontSize: 14,
  },
  messageBubble: {
    flex: 1,
    maxWidth: '80%',
    padding: 12,
    borderRadius: 12,
  },
  bubbleUser: {
    backgroundColor: colors.orange[500] + '20',
    borderWidth: 1,
    borderColor: colors.orange[500] + '30',
  },
  bubbleAssistant: {
    backgroundColor: colors.slate[800],
    borderWidth: 1,
    borderColor: colors.slate[700],
  },
  messageText: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
    color: colors.text.muted,
  },
  suggestionsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  suggestionsLabel: {
    fontSize: 11,
    color: colors.text.muted,
    marginBottom: 8,
  },
  suggestionBtn: {
    backgroundColor: colors.slate[800],
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.slate[700],
  },
  suggestionText: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.slate[800],
    gap: 8,
  },
  textInput: {
    flex: 1,
    backgroundColor: colors.slate[800],
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: colors.text.primary,
    fontSize: 14,
    maxHeight: 100,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.primary[600],
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.5,
  },
  sendBtnText: {
    fontSize: 18,
    color: '#fff',
  },
});
