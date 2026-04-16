/**
 * ChatbotScreen.js
 * Feature 4 — Automatic Date Detection (handled by Flask backend)
 * Feature 5 — Voice Commands using expo-speech-recognition
 */

import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, KeyboardAvoidingView, ActivityIndicator,
  Platform, Alert,
} from 'react-native';
import api from '../utils/api';

// ── Voice recognition (expo-speech-recognition) ──────────────────────────────
let ExpoSpeechRecognitionModule = null;
let useSpeechRecognitionEvent   = null;
try {
  const mod = require('expo-speech-recognition');
  ExpoSpeechRecognitionModule  = mod.ExpoSpeechRecognitionModule;
  useSpeechRecognitionEvent    = mod.useSpeechRecognitionEvent;
} catch (_) {
  // Library not installed — voice button will show "unavailable"
}

export default function ChatbotScreen() {
  const [messages, setMessages] = useState([
    {
      id: '1',
      text:
        "Hello! I'm your IntelliBudget assistant 👋\n\n" +
        "Try saying:\n" +
        "• 'Add 500 to Food yesterday'\n" +
        "• 'Spent 200 on transport 3 days ago'\n" +
        "• 'Show my expenses'\n" +
        "• 'Am I over budget?'",
      sender: 'bot',
    },
  ]);
  const [input,      setInput]      = useState('');
  const [loading,    setLoading]    = useState(false);
  const [recording,  setRecording]  = useState(false);
  const flatRef = useRef();

  // ── Voice recognition events ──────────────────────────────────────────────
  if (useSpeechRecognitionEvent) {
    useSpeechRecognitionEvent('result', (event) => {
      const transcript = event.results?.[0]?.transcript || '';
      if (transcript) setInput(transcript);
    });

    useSpeechRecognitionEvent('end', () => {
      setRecording(false);
      // Auto-send after voice input ends
      setTimeout(() => {
        setInput(prev => {
          if (prev.trim()) {
            sendMessageText(prev.trim());
            return '';
          }
          return prev;
        });
      }, 500);
    });

    useSpeechRecognitionEvent('error', (event) => {
      setRecording(false);
      Alert.alert('Voice Error', event.message || 'Could not recognise speech.');
    });
  }

  // ── Start / Stop voice recording ──────────────────────────────────────────
  const toggleVoice = async () => {
    if (!ExpoSpeechRecognitionModule) {
      Alert.alert(
        'Voice Not Available',
        'Install expo-speech-recognition:\n\nnpx expo install expo-speech-recognition\n\nThen rebuild the app.',
      );
      return;
    }

    if (recording) {
      ExpoSpeechRecognitionModule.stop();
      setRecording(false);
    } else {
      const { granted } = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!granted) {
        Alert.alert('Permission Denied', 'Microphone permission is required for voice input.');
        return;
      }
      setInput('');
      ExpoSpeechRecognitionModule.start({
        lang:              'en-IN',
        interimResults:    true,
        maxAlternatives:   1,
        continuous:        false,
      });
      setRecording(true);
    }
  };

  // ── Send message to Flask chatbot ─────────────────────────────────────────
  const sendMessageText = async (text) => {
    if (!text.trim()) return;

    const userMsg = { id: Date.now().toString(), text, sender: 'user' };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const res     = await api.post('/api/chatbot', { message: text });
      const botText = (res.data.response || '').replace(/<br\s*\/?>/gi, '\n');
      setMessages(prev => [
        ...prev,
        { id: (Date.now() + 1).toString(), text: botText, sender: 'bot' },
      ]);
    } catch (e) {
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          text: '❌ Cannot reach server.\nMake sure Flask is running and IP is correct.',
          sender: 'bot',
        },
      ]);
    }
    setLoading(false);
    setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    setInput('');
    sendMessageText(text);
  };

  const quickSend = (text) => sendMessageText(text);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      {/* Message list */}
      <FlatList
        ref={flatRef}
        data={messages}
        keyExtractor={m => m.id}
        contentContainerStyle={styles.messageList}
        renderItem={({ item }) => (
          <View style={[
            styles.bubble,
            item.sender === 'user' ? styles.userBubble : styles.botBubble,
          ]}>
            <Text style={[
              styles.bubbleText,
              item.sender === 'user' ? styles.userText : styles.botText,
            ]}>
              {item.text}
            </Text>
          </View>
        )}
      />

      {/* Typing indicator */}
      {loading && (
        <View style={styles.typingRow}>
          <ActivityIndicator size="small" color="#64748b" />
          <Text style={styles.typingText}>  Bot is thinking…</Text>
        </View>
      )}

      {/* Voice status bar */}
      {recording && (
        <View style={styles.voiceBar}>
          <Text style={styles.voiceBarText}>🔴  Listening… speak now</Text>
        </View>
      )}

      {/* Quick action buttons */}
      <View style={styles.quickRow}>
        <TouchableOpacity style={styles.quickBtn} onPress={() => quickSend('Show my expenses')}>
          <Text style={styles.quickText}>📋 Expenses</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickBtn} onPress={() => quickSend('Show spending summary')}>
          <Text style={styles.quickText}>📊 Summary</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickBtn} onPress={() => quickSend('Am I over budget?')}>
          <Text style={styles.quickText}>⚠️ Budget</Text>
        </TouchableOpacity>
      </View>

      {/* Input row */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder={recording ? 'Listening…' : 'Type or 🎙️ speak…'}
          placeholderTextColor="#94a3b8"
          onSubmitEditing={handleSend}
          returnKeyType="send"
          editable={!recording}
        />

        {/* Feature 5 — Voice button */}
        <TouchableOpacity
          style={[styles.voiceBtn, recording && styles.voiceBtnActive]}
          onPress={toggleVoice}
        >
          <Text style={styles.voiceBtnText}>{recording ? '⏹️' : '🎙️'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.sendBtn} onPress={handleSend}>
          <Text style={styles.sendText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#f1f5f9' },
  messageList:    { padding: 16, paddingBottom: 8 },
  bubble:         { maxWidth: '82%', padding: 12, borderRadius: 16, marginBottom: 10 },
  userBubble:     { alignSelf: 'flex-end', backgroundColor: '#2563eb',
                    borderBottomRightRadius: 4 },
  botBubble:      { alignSelf: 'flex-start', backgroundColor: '#fff',
                    borderBottomLeftRadius: 4, elevation: 1 },
  bubbleText:     { fontSize: 14, lineHeight: 21 },
  userText:       { color: '#fff' },
  botText:        { color: '#0f172a' },
  typingRow:      { flexDirection: 'row', alignItems: 'center',
                    paddingHorizontal: 16, paddingBottom: 4 },
  typingText:     { color: '#64748b', fontSize: 13 },
  voiceBar:       { backgroundColor: '#fef2f2', borderTopWidth: 1,
                    borderTopColor: '#fecaca', paddingVertical: 8,
                    paddingHorizontal: 16, alignItems: 'center' },
  voiceBarText:   { color: '#dc2626', fontWeight: '600', fontSize: 14 },
  quickRow:       { flexDirection: 'row', paddingHorizontal: 12,
                    paddingBottom: 8, gap: 6 },
  quickBtn:       { flex: 1, backgroundColor: '#fff', borderRadius: 20,
                    padding: 8, alignItems: 'center', borderWidth: 1,
                    borderColor: '#e2e8f0' },
  quickText:      { fontSize: 11, color: '#334155', fontWeight: '600' },
  inputRow:       { flexDirection: 'row', padding: 12, backgroundColor: '#fff',
                    borderTopWidth: 1, borderTopColor: '#e2e8f0', gap: 8 },
  input:          { flex: 1, backgroundColor: '#f8fafc', borderRadius: 24,
                    paddingHorizontal: 16, paddingVertical: 10, fontSize: 14,
                    borderWidth: 1, borderColor: '#e2e8f0', color: '#0f172a' },
  voiceBtn:       { backgroundColor: '#f1f5f9', borderRadius: 24, width: 44,
                    alignItems: 'center', justifyContent: 'center',
                    borderWidth: 1, borderColor: '#e2e8f0' },
  voiceBtnActive: { backgroundColor: '#fee2e2', borderColor: '#fecaca' },
  voiceBtnText:   { fontSize: 20 },
  sendBtn:        { backgroundColor: '#2563eb', borderRadius: 24,
                    paddingHorizontal: 18, justifyContent: 'center' },
  sendText:       { color: '#fff', fontWeight: '700', fontSize: 14 },
});
