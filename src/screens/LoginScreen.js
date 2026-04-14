import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView,
} from 'react-native';
import { useAuth } from '../utils/AuthContext';

export default function LoginScreen({ navigation }) {
  const { login }           = useAuth();
  const [email, setEmail]   = useState('');
  const [pass,  setPass]    = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !pass) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }
    setLoading(true);
    try {
      const result = await login(email.trim(), pass);
      if (!result.success) Alert.alert('Login Failed', result.error);
    } catch (e) {
      Alert.alert('Error', 'Cannot connect to server.\nMake sure Flask is running.');
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior="padding">
      <Text style={styles.logo}>💰</Text>
      <Text style={styles.title}>IntelliBudget AI</Text>
      <Text style={styles.subtitle}>Smart Finance Tracker</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        placeholderTextColor="#94a3b8"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={pass}
        onChangeText={setPass}
        secureTextEntry
        placeholderTextColor="#94a3b8"
      />

      <TouchableOpacity style={styles.btn} onPress={handleLogin} disabled={loading}>
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.btnText}>Login</Text>
        }
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
        <Text style={styles.link}>Don't have an account? Sign up</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:  { flex:1, backgroundColor:'#f1f5f9', alignItems:'center',
                justifyContent:'center', padding:24 },
  logo:       { fontSize:60, marginBottom:8 },
  title:      { fontSize:28, fontWeight:'800', color:'#0f172a', marginBottom:4 },
  subtitle:   { fontSize:14, color:'#64748b', marginBottom:32 },
  input:      { width:'100%', backgroundColor:'#fff', borderRadius:12, padding:14,
                fontSize:15, marginBottom:14, borderWidth:1, borderColor:'#e2e8f0',
                color:'#0f172a' },
  btn:        { width:'100%', backgroundColor:'#2563eb', borderRadius:12,
                padding:16, alignItems:'center', marginTop:4 },
  btnText:    { color:'#fff', fontSize:16, fontWeight:'700' },
  link:       { color:'#2563eb', marginTop:20, fontSize:14 },
});