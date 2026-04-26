/**
 * ChatbotScreen.js
 * Feature 4 — Automatic Date Detection (handled by Flask)
 * Feature 5 — Voice Input
 *
 * Quick Buttons:
 *   📋 Expenses → rich card showing all expenses this month
 *   📊 Summary  → each category with progress bar vs budget limit
 *   ⚠️ Budget   → only categories that are warned / exceeded
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, KeyboardAvoidingView, ActivityIndicator,
  Platform, Alert, Animated,
} from 'react-native';
import api from '../utils/api';

// Colour palette for category dots
const CAT_COLORS = [
  '#3b82f6','#f97316','#10b981','#ec4899',
  '#8b5cf6','#f59e0b','#06b6d4','#ef4444',
];

// ── Helpers ───────────────────────────────────────────────────────────────────
const todayStr = () => new Date().toISOString().split('T')[0];
const monthStartStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
};

export default function ChatbotScreen() {
  const [messages,  setMessages]  = useState([
    {
      id: '0', type: 'text', sender: 'bot',
      text:
        "Hello! I'm your IntelliBudget assistant 👋\n\n" +
        "Try:\n" +
        "• 'Add 500 to Food yesterday'\n" +
        "• 'Spent 200 on transport 3 days ago'\n" +
        "• 'Show my expenses'\n" +
        "• 'Am I over budget?'",
    },
  ]);
  const [input,     setInput]     = useState('');
  const [loading,   setLoading]   = useState(false);
  const [voiceMode, setVoiceMode] = useState('idle');
  const flatRef  = useRef();
  const inputRef = useRef();
  const pulse    = useRef(new Animated.Value(1)).current;

  let SpeechRecognition = null;
  try { SpeechRecognition = require('expo-speech-recognition'); } catch (_) {}

  // Pulse animation for voice indicator
  useEffect(() => {
    if (voiceMode === 'listening') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.35, duration: 600, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1.00, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulse.setValue(1);
    }
  }, [voiceMode]);

  const scrollToEnd = () =>
    setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 200);

  // ── Add a message to the list ─────────────────────────────────────────────
  const pushMsg = (msg) => setMessages(prev => [...prev, msg]);

  const pushUserMsg = (text) =>
    pushMsg({ id: Date.now().toString(), type: 'text', sender: 'user', text });

  const pushError = (text) =>
    pushMsg({ id: (Date.now() + 1).toString(), type: 'text', sender: 'bot',
              text: `❌ ${text}` });

  // ── Send typed message to chatbot ─────────────────────────────────────────
  const sendMessageText = async (text) => {
    if (!text.trim()) return;
    pushUserMsg(text);
    setLoading(true);
    try {
      const res     = await api.post('/api/chatbot', { message: text });
      const botText = (res.data.response || '').replace(/<br\s*\/?>/gi, '\n');
      pushMsg({ id: (Date.now() + 1).toString(), type: 'text', sender: 'bot',
                text: botText });
    } catch {
      pushError('Cannot reach server. Make sure Flask is running.');
    }
    setLoading(false);
    scrollToEnd();
  };

  const handleSend = () => {
    const t = input.trim();
    if (!t) return;
    setInput('');
    sendMessageText(t);
  };

  // ── QUICK BUTTON 1 — Expenses ─────────────────────────────────────────────
  const handleExpensesQuick = async () => {
    pushUserMsg('📋 Show my expenses this month');
    setLoading(true);
    try {
      const from = monthStartStr();
      const to   = todayStr();
      const res  = await api.get(`/api/expenses/filter?from_date=${from}&to_date=${to}`);
      pushMsg({
        id: (Date.now() + 1).toString(),
        type: 'expenses',
        sender: 'bot',
        expenses: res.data.expenses || [],
        total:    res.data.total    || 0,
        from, to,
      });
    } catch {
      pushError('Could not load expenses.');
    }
    setLoading(false);
    scrollToEnd();
  };

  // ── QUICK BUTTON 2 — Summary (categories vs budget) ──────────────────────
  const handleSummaryQuick = async () => {
    pushUserMsg('📊 Show budget summary');
    setLoading(true);
    try {
      const res = await api.get('/api/all-budgets-status');
      pushMsg({
        id: (Date.now() + 1).toString(),
        type: 'summary',
        sender: 'bot',
        budgets: res.data.budgets || {},
      });
    } catch {
      pushError('Could not load budget summary.');
    }
    setLoading(false);
    scrollToEnd();
  };

  // ── QUICK BUTTON 3 — Budget warnings ─────────────────────────────────────
  const handleBudgetQuick = async () => {
    pushUserMsg('⚠️ Am I over budget?');
    setLoading(true);
    try {
      const res = await api.get('/api/budget-warnings');
      pushMsg({
        id: (Date.now() + 1).toString(),
        type: 'warnings',
        sender: 'bot',
        warnings: res.data.warnings || [],
      });
    } catch {
      pushError('Could not load budget warnings.');
    }
    setLoading(false);
    scrollToEnd();
  };

  // ── Voice ─────────────────────────────────────────────────────────────────
  const handleVoice = async () => {
    if (SpeechRecognition?.ExpoSpeechRecognitionModule) {
      const mod = SpeechRecognition.ExpoSpeechRecognitionModule;
      if (voiceMode === 'listening') { mod.stop(); setVoiceMode('idle'); return; }
      try {
        const { granted } = await mod.requestPermissionsAsync();
        if (!granted) { Alert.alert('Permission Denied', 'Microphone required.'); return; }
        setVoiceMode('listening');
        setInput('');
        mod.start({ lang: 'en-IN', interimResults: true, continuous: false });
      } catch (e) { setVoiceMode('idle'); Alert.alert('Voice Error', e.message); }
      return;
    }
    // Expo Go fallback
    Alert.alert(
      '🎙️ Voice Input',
      '1. Tap OK to focus the text box\n' +
      '2. Tap the 🎙️ key on your keyboard\n' +
      '3. Speak your message\n' +
      '4. Tap Send',
      [
        { text: 'OK', onPress: () => setTimeout(() => inputRef.current?.focus(), 300) },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  // ── Render a single message ───────────────────────────────────────────────
  const renderMessage = ({ item }) => {

    // User bubble
    if (item.sender === 'user') {
      return (
        <View style={s.userWrap}>
          <View style={s.userBubble}>
            <Text style={s.userText}>{item.text}</Text>
          </View>
        </View>
      );
    }

    // Bot: plain text
    if (item.type === 'text') {
      return (
        <View style={s.botWrap}>
          <View style={s.botBubble}>
            <Text style={s.botText}>{item.text}</Text>
          </View>
        </View>
      );
    }

    // ── Bot: Expenses card ────────────────────────────────────────────────
    if (item.type === 'expenses') {
      const { expenses, total, from, to } = item;
      return (
        <View style={s.botWrap}>
          <View style={[s.card, { borderLeftColor: '#2563eb' }]}>
            <Text style={s.cardTitle}>📋 Expenses This Month</Text>
            <Text style={s.cardSub}>{from} → {to}</Text>

            {expenses.length === 0 ? (
              <Text style={s.empty}>No expenses recorded this month.</Text>
            ) : (
              <>
                {expenses.map((e, i) => (
                  <View key={e.id} style={s.expRow}>
                    <View style={[s.expDot,
                      { backgroundColor: CAT_COLORS[i % CAT_COLORS.length] }]}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={s.expCat}>{e.category}</Text>
                      {!!e.description && (
                        <Text style={s.expDesc} numberOfLines={1}>{e.description}</Text>
                      )}
                      <Text style={s.expDate}>{e.date}</Text>
                    </View>
                    <Text style={s.expAmt}>Rs.{Number(e.amount).toFixed(2)}</Text>
                  </View>
                ))}
                <View style={s.totalRow}>
                  <Text style={s.totalLabel}>Total</Text>
                  <Text style={s.totalAmt}>Rs.{total.toFixed(2)}</Text>
                </View>
              </>
            )}
          </View>
        </View>
      );
    }

    // ── Bot: Budget Summary card ──────────────────────────────────────────
    if (item.type === 'summary') {
      const entries = Object.entries(item.budgets);

      if (entries.length === 0) {
        return (
          <View style={s.botWrap}>
            <View style={s.botBubble}>
              <Text style={s.botText}>
                📊 No budgets set yet.{'\n'}
                Go to Profile → Add Budget Limit to get started.
              </Text>
            </View>
          </View>
        );
      }

      // Sort: exceeded → full → warning → ok
      const ORDER = { exceeded: 0, fully_used: 1, warning: 2, ok: 3, no_budget: 4 };
      const sorted = entries.sort(
        (a, b) => (ORDER[a[1].status] ?? 5) - (ORDER[b[1].status] ?? 5)
          || (b[1].percentage_used || 0) - (a[1].percentage_used || 0)
      );

      return (
        <View style={s.botWrap}>
          <View style={[s.card, { borderLeftColor: '#8b5cf6' }]}>
            <Text style={s.cardTitle}>📊 Budget Summary</Text>
            <Text style={s.cardSub}>How close each category is to its limit</Text>

            {sorted.map(([cat, b]) => {
              const pct   = Math.min(b.percentage_used || 0, 100);
              const color = b.status === 'exceeded'   ? '#ef4444'
                          : b.status === 'fully_used' ? '#f97316'
                          : b.status === 'warning'    ? '#f59e0b'
                          : '#10b981';
              const tag   = b.status === 'exceeded'   ? '🔴 Over budget'
                          : b.status === 'fully_used' ? '🟠 Fully used'
                          : b.status === 'warning'    ? '🟡 Near limit'
                          : b.status === 'ok'         ? '🟢 OK'
                          : '⚪ No budget';
              return (
                <View key={cat} style={s.budgetItem}>
                  {/* Category name + status tag */}
                  <View style={s.budgetHeader}>
                    <Text style={s.budgetCat}>{cat}</Text>
                    <Text style={[s.budgetTag, { color }]}>{tag}</Text>
                  </View>

                  {/* Progress bar */}
                  <View style={s.progressBg}>
                    <View style={[s.progressFill,
                      { width: `${pct}%`, backgroundColor: color }]}
                    />
                  </View>

                  {/* Amounts */}
                  <View style={s.budgetAmts}>
                    <Text style={s.budgetSpent}>
                      Spent: Rs.{(b.spent || 0).toFixed(2)}
                    </Text>
                    {b.limit != null && (
                      <Text style={s.budgetLimit}>
                        Limit: Rs.{b.limit.toFixed(2)}
                      </Text>
                    )}
                    <Text style={[s.budgetPct, { color }]}>
                      {b.percentage_used || 0}%
                    </Text>
                  </View>

                  {/* Over-budget note */}
                  {b.status === 'exceeded' && (
                    <Text style={s.overNote}>
                      ⚠️ Over by Rs.{(b.exceeded_by || 0).toFixed(2)}
                    </Text>
                  )}
                </View>
              );
            })}
          </View>
        </View>
      );
    }

    // ── Bot: Warnings card ────────────────────────────────────────────────
    if (item.type === 'warnings') {
      const { warnings } = item;
      return (
        <View style={s.botWrap}>
          <View style={[s.card,
            { borderLeftColor: warnings.length === 0 ? '#10b981' : '#ef4444' }]}>
            <Text style={s.cardTitle}>⚠️ Budget Warnings</Text>

            {warnings.length === 0 ? (
              <View style={s.allGood}>
                <Text style={{ fontSize: 36 }}>✅</Text>
                <Text style={s.allGoodText}>
                  All budgets are within safe limits!
                </Text>
              </View>
            ) : (
              warnings.map((w, i) => (
                <View key={i} style={s.warnItem}>
                  <Text style={s.warnCat}>{w.category}</Text>
                  <Text style={s.warnMsg}>{w.message}</Text>
                </View>
              ))
            )}
          </View>
        </View>
      );
    }

    return null;
  };

  // ── Main UI ───────────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={s.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      <FlatList
        ref={flatRef}
        data={messages}
        keyExtractor={m => m.id}
        contentContainerStyle={s.list}
        renderItem={renderMessage}
      />

      {loading && (
        <View style={s.typingRow}>
          <ActivityIndicator size="small" color="#64748b" />
          <Text style={s.typingText}>  Fetching…</Text>
        </View>
      )}

      {voiceMode === 'listening' && (
        <View style={s.voiceBar}>
          <Animated.View style={[s.voiceDot, { transform: [{ scale: pulse }] }]} />
          <Text style={s.voiceBarText}>Listening… tap ⏹️ to stop</Text>
        </View>
      )}

      {/* Quick buttons */}
      <View style={s.quickRow}>
        <TouchableOpacity style={s.quickBtn} onPress={handleExpensesQuick}>
          <Text style={s.quickText}>📋 Expenses</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.quickBtn} onPress={handleSummaryQuick}>
          <Text style={s.quickText}>📊 Summary</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.quickBtn} onPress={handleBudgetQuick}>
          <Text style={s.quickText}>⚠️ Budget</Text>
        </TouchableOpacity>
      </View>

      {/* Input */}
      <View style={s.inputRow}>
        <TextInput
          ref={inputRef}
          style={s.input}
          value={input}
          onChangeText={setInput}
          placeholder={voiceMode === 'listening' ? 'Listening…' : 'Type or 🎙️ speak…'}
          placeholderTextColor="#94a3b8"
          onSubmitEditing={handleSend}
          returnKeyType="send"
        />
        <TouchableOpacity
          style={[s.voiceBtn, voiceMode === 'listening' && s.voiceBtnActive]}
          onPress={handleVoice}
        >
          <Text style={s.voiceBtnText}>
            {voiceMode === 'listening' ? '⏹️' : '🎙️'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.sendBtn} onPress={handleSend}>
          <Text style={s.sendText}>Send</Text>
        </TouchableOpacity>
      </View>

      <Text style={s.tip}>
        💡 Tap 🎙️ then use keyboard mic, or type "Add 500 to Food yesterday"
      </Text>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#f1f5f9' },
  list:         { padding: 12, paddingBottom: 8 },

  // Bubbles
  userWrap:     { alignItems: 'flex-end', marginBottom: 10 },
  userBubble:   { backgroundColor: '#2563eb', padding: 12, borderRadius: 16,
                  borderBottomRightRadius: 4, maxWidth: '80%' },
  userText:     { color: '#fff', fontSize: 14, lineHeight: 20 },

  botWrap:      { alignItems: 'flex-start', marginBottom: 10 },
  botBubble:    { backgroundColor: '#fff', padding: 12, borderRadius: 16,
                  borderBottomLeftRadius: 4, maxWidth: '88%', elevation: 1 },
  botText:      { color: '#0f172a', fontSize: 14, lineHeight: 20 },

  // Rich card
  card:         { backgroundColor: '#fff', borderRadius: 16, padding: 14,
                  borderLeftWidth: 4, elevation: 2, maxWidth: '95%' },
  cardTitle:    { fontSize: 15, fontWeight: '800', color: '#0f172a', marginBottom: 2 },
  cardSub:      { fontSize: 11, color: '#94a3b8', marginBottom: 12 },
  empty:        { color: '#94a3b8', textAlign: 'center', paddingVertical: 16 },

  // Expense rows
  expRow:       { flexDirection: 'row', alignItems: 'center', gap: 8,
                  paddingVertical: 8, borderBottomWidth: 1,
                  borderBottomColor: '#f1f5f9' },
  expDot:       { width: 10, height: 10, borderRadius: 5 },
  expCat:       { fontSize: 13, fontWeight: '700', color: '#0f172a' },
  expDesc:      { fontSize: 11, color: '#64748b', marginTop: 1 },
  expDate:      { fontSize: 10, color: '#94a3b8', marginTop: 1 },
  expAmt:       { fontSize: 14, fontWeight: '700', color: '#dc2626' },
  totalRow:     { flexDirection: 'row', justifyContent: 'space-between',
                  marginTop: 10, paddingTop: 10,
                  borderTopWidth: 1.5, borderTopColor: '#e2e8f0' },
  totalLabel:   { fontSize: 14, fontWeight: '800', color: '#0f172a' },
  totalAmt:     { fontSize: 14, fontWeight: '800', color: '#dc2626' },

  // Budget summary
  budgetItem:   { marginBottom: 14 },
  budgetHeader: { flexDirection: 'row', justifyContent: 'space-between',
                  alignItems: 'center', marginBottom: 6 },
  budgetCat:    { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  budgetTag:    { fontSize: 11, fontWeight: '700' },
  progressBg:   { height: 12, backgroundColor: '#f1f5f9', borderRadius: 8,
                  overflow: 'hidden', marginBottom: 6 },
  progressFill: { height: '100%', borderRadius: 8 },
  budgetAmts:   { flexDirection: 'row', gap: 8 },
  budgetSpent:  { fontSize: 11, color: '#475569', flex: 1 },
  budgetLimit:  { fontSize: 11, color: '#475569' },
  budgetPct:    { fontSize: 11, fontWeight: '700' },
  overNote:     { fontSize: 11, color: '#ef4444', fontWeight: '600', marginTop: 4 },

  // All good
  allGood:      { flexDirection: 'row', alignItems: 'center', gap: 12,
                  paddingVertical: 8 },
  allGoodText:  { fontSize: 14, color: '#16a34a', fontWeight: '600', flex: 1,
                  lineHeight: 20 },

  // Warning items
  warnItem:     { backgroundColor: '#fef2f2', borderRadius: 10, padding: 10,
                  marginBottom: 8, borderLeftWidth: 3, borderLeftColor: '#ef4444' },
  warnCat:      { fontSize: 13, fontWeight: '700', color: '#0f172a', marginBottom: 3 },
  warnMsg:      { fontSize: 12, color: '#475569', lineHeight: 17 },

  // Typing
  typingRow:    { flexDirection: 'row', alignItems: 'center',
                  paddingHorizontal: 16, paddingBottom: 4 },
  typingText:   { color: '#64748b', fontSize: 13 },

  // Voice bar
  voiceBar:     { flexDirection: 'row', alignItems: 'center', gap: 10,
                  backgroundColor: '#fef2f2', borderTopWidth: 1,
                  borderTopColor: '#fecaca', paddingVertical: 10,
                  paddingHorizontal: 16 },
  voiceDot:     { width: 14, height: 14, borderRadius: 7, backgroundColor: '#dc2626' },
  voiceBarText: { color: '#dc2626', fontWeight: '600', fontSize: 14 },

  // Quick buttons
  quickRow:     { flexDirection: 'row', paddingHorizontal: 12,
                  paddingBottom: 8, gap: 6 },
  quickBtn:     { flex: 1, backgroundColor: '#fff', borderRadius: 20,
                  padding: 8, alignItems: 'center', borderWidth: 1,
                  borderColor: '#e2e8f0' },
  quickText:    { fontSize: 11, color: '#334155', fontWeight: '600' },

  // Input
  inputRow:     { flexDirection: 'row', paddingHorizontal: 12, paddingTop: 8,
                  paddingBottom: 4, backgroundColor: '#fff', borderTopWidth: 1,
                  borderTopColor: '#e2e8f0', gap: 8 },
  input:        { flex: 1, backgroundColor: '#f8fafc', borderRadius: 24,
                  paddingHorizontal: 16, paddingVertical: 10, fontSize: 14,
                  borderWidth: 1, borderColor: '#e2e8f0', color: '#0f172a' },
  voiceBtn:     { backgroundColor: '#f1f5f9', borderRadius: 24, width: 44,
                  alignItems: 'center', justifyContent: 'center',
                  borderWidth: 1, borderColor: '#e2e8f0' },
  voiceBtnActive:{ backgroundColor: '#fee2e2', borderColor: '#fecaca' },
  voiceBtnText: { fontSize: 20 },
  sendBtn:      { backgroundColor: '#2563eb', borderRadius: 24,
                  paddingHorizontal: 18, justifyContent: 'center' },
  sendText:     { color: '#fff', fontWeight: '700', fontSize: 14 },
  tip:          { fontSize: 10, color: '#94a3b8', textAlign: 'center',
                  paddingHorizontal: 16, paddingBottom: 8, backgroundColor: '#fff' },
});
