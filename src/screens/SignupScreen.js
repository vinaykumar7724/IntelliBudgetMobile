import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView,
} from 'react-native';
import { useAuth } from '../utils/AuthContext';

export default function SignupScreen({ navigation }) {
  const { signup }              = useAuth();
  const [username, setUsername] = useState('');
  const [email,    setEmail]    = useState('');
  const [pass,     setPass]     = useState('');
  const [loading,  setLoading]  = useState(false);

  const handleSignup = async () => {
    if (!username || !email || !pass) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }
    setLoading(true);
    try {
      const result = await signup(username.trim(), email.trim(), pass);
      if (result.success) {
        Alert.alert('Success', 'Account created! Please login.',
          [{ text: 'OK', onPress: () => navigation.navigate('Login') }]);
      } else {
        Alert.alert('Error', result.error);
      }
    } catch (e) {
      Alert.alert('Error', 'Cannot connect to server.');
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior="padding">
      <Text style={styles.logo}>💰</Text>
      <Text style={styles.title}>Create Account</Text>

      <TextInput style={styles.input} placeholder="Username"
        value={username} onChangeText={setUsername}
        placeholderTextColor="#94a3b8" />
      <TextInput style={styles.input} placeholder="Email"
        value={email} onChangeText={setEmail}
        keyboardType="email-address" autoCapitalize="none"
        placeholderTextColor="#94a3b8" />
      <TextInput style={styles.input} placeholder="Password (min 6 chars)"
        value={pass} onChangeText={setPass}
        secureTextEntry placeholderTextColor="#94a3b8" />

      <TouchableOpacity style={styles.btn} onPress={handleSignup} disabled={loading}>
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.btnText}>Sign Up</Text>
        }
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.link}>Already have an account? Login</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, backgroundColor:'#f1f5f9', alignItems:'center',
               justifyContent:'center', padding:24 },
  logo:      { fontSize:60, marginBottom:8 },
  title:     { fontSize:28, fontWeight:'800', color:'#0f172a', marginBottom:24 },
  input:     { width:'100%', backgroundColor:'#fff', borderRadius:12, padding:14,
               fontSize:15, marginBottom:14, borderWidth:1, borderColor:'#e2e8f0',
               color:'#0f172a' },
  btn:       { width:'100%', backgroundColor:'#2563eb', borderRadius:12,
               padding:16, alignItems:'center', marginTop:4 },
  btnText:   { color:'#fff', fontSize:16, fontWeight:'700' },
  link:      { color:'#2563eb', marginTop:20, fontSize:14 },
});