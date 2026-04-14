import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, KeyboardAvoidingView, ActivityIndicator, Platform,
} from 'react-native';
import api from '../utils/api';

export default function ChatbotScreen() {
  const [messages, setMessages] = useState([
    { id:'1', text:"Hello! I'm your IntelliBudget assistant 👋\nTry: 'Add 500 to Food'",
      sender:'bot' }
  ]);
  const [input,   setInput]   = useState('');
  const [loading, setLoading] = useState(false);
  const flatRef = useRef();

  const sendMessage = async () => {
    const text = input.trim();
    if (!text) return;

    const userMsg = { id: Date.now().toString(), text, sender: 'user' };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.post('/api/chatbot', { message: text });
      const botText = res.data.response.replace(/<br>/g, '\n');
      const botMsg  = { id: (Date.now()+1).toString(), text: botText, sender:'bot' };
      setMessages(prev => [...prev, botMsg]);
    } catch (e) {
      setMessages(prev => [...prev, {
        id: (Date.now()+1).toString(),
        text: '❌ Cannot reach server. Make sure Flask is running.',
        sender: 'bot',
      }]);
    }
    setLoading(false);
    setTimeout(() => flatRef.current?.scrollToEnd({ animated:true }), 100);
  };

  const quickSend = (text) => {
    setInput(text);
    setTimeout(sendMessage, 100);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      {/* Messages */}
      <FlatList
        ref={flatRef}
        data={messages}
        keyExtractor={m => m.id}
        contentContainerStyle={styles.messageList}
        renderItem={({ item }) => (
          <View style={[styles.bubble,
            item.sender === 'user' ? styles.userBubble : styles.botBubble]}>
            <Text style={[styles.bubbleText,
              item.sender === 'user' ? styles.userText : styles.botText]}>
              {item.text}
            </Text>
          </View>
        )}
      />

      {/* Loading indicator */}
      {loading && (
        <View style={styles.typingRow}>
          <ActivityIndicator size="small" color="#64748b" />
          <Text style={styles.typingText}>  Bot is thinking…</Text>
        </View>
      )}

      {/* Quick buttons */}
      <View style={styles.quickRow}>
        <TouchableOpacity style={styles.quickBtn}
          onPress={() => quickSend('Show my expenses')}>
          <Text style={styles.quickText}>📋 Expenses</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickBtn}
          onPress={() => quickSend('Show spending summary')}>
          <Text style={styles.quickText}>📊 Summary</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickBtn}
          onPress={() => quickSend('Am I over budget?')}>
          <Text style={styles.quickText}>⚠️ Budget</Text>
        </TouchableOpacity>
      </View>

      {/* Input */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Type a message…"
          placeholderTextColor="#94a3b8"
          onSubmitEditing={sendMessage}
          returnKeyType="send"
        />
        <TouchableOpacity style={styles.sendBtn} onPress={sendMessage}>
          <Text style={styles.sendText}>Send</Text>
        </TouchableOpacity>
      </View>

    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:   { flex:1, backgroundColor:'#f1f5f9' },
  messageList: { padding:16, paddingBottom:8 },
  bubble:      { maxWidth:'80%', padding:12, borderRadius:16, marginBottom:10 },
  userBubble:  { alignSelf:'flex-end', backgroundColor:'#2563eb',
                 borderBottomRightRadius:4 },
  botBubble:   { alignSelf:'flex-start', backgroundColor:'#fff',
                 borderBottomLeftRadius:4, elevation:1 },
  bubbleText:  { fontSize:14, lineHeight:20 },
  userText:    { color:'#fff' },
  botText:     { color:'#0f172a' },
  typingRow:   { flexDirection:'row', alignItems:'center', paddingHorizontal:16,
                 paddingBottom:4 },
  typingText:  { color:'#64748b', fontSize:13 },
  quickRow:    { flexDirection:'row', paddingHorizontal:12, paddingBottom:8,
                 gap:8 },
  quickBtn:    { flex:1, backgroundColor:'#fff', borderRadius:20, padding:8,
                 alignItems:'center', borderWidth:1, borderColor:'#e2e8f0' },
  quickText:   { fontSize:11, color:'#334155', fontWeight:'600' },
  inputRow:    { flexDirection:'row', padding:12, backgroundColor:'#fff',
                 borderTopWidth:1, borderTopColor:'#e2e8f0', gap:10 },
  input:       { flex:1, backgroundColor:'#f8fafc', borderRadius:24,
                 paddingHorizontal:16, paddingVertical:10, fontSize:14,
                 borderWidth:1, borderColor:'#e2e8f0', color:'#0f172a' },
  sendBtn:     { backgroundColor:'#2563eb', borderRadius:24,
                 paddingHorizontal:20, justifyContent:'center' },
  sendText:    { color:'#fff', fontWeight:'700', fontSize:14 },
});