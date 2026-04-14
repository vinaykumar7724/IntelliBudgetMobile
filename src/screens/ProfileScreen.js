import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ScrollView,
} from 'react-native';
import api from '../utils/api';
import { useAuth } from '../utils/AuthContext';

export default function ProfileScreen() {
  const { user, logout }    = useAuth();
  const [salary, setSalary] = useState(String(user?.salary || ''));
  const [category, setCat]  = useState('');
  const [limit, setLimit]   = useState('');

  const updateSalary = async () => {
    try {
      await api.post('/api/auth/login',
        { email: user.email, monthly_salary: parseFloat(salary) });
      Alert.alert('Success', 'Salary updated!');
    } catch {
      Alert.alert('Error', 'Could not update salary.');
    }
  };

  const addBudget = async () => {
    if (!category || !limit) {
      Alert.alert('Error', 'Fill in category and amount');
      return;
    }
    try {
      const res = await api.post('/api/add-expense', {
        amount: 0, category, description: '__budget__',
      });
      Alert.alert('Success', `Budget for ${category} set!`);
      setCat(''); setLimit('');
    } catch {
      Alert.alert('Error', 'Could not add budget.');
    }
  };

  return (
    <ScrollView style={styles.container}>

      {/* Profile Card */}
      <View style={styles.card}>
        <Text style={styles.avatar}>
          {user?.username?.[0]?.toUpperCase() || '?'}
        </Text>
        <Text style={styles.name}>{user?.username}</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      {/* Salary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>💵 Monthly Salary</Text>
        <TextInput
          style={styles.input}
          value={salary}
          onChangeText={setSalary}
          keyboardType="numeric"
          placeholder="Enter salary amount"
          placeholderTextColor="#94a3b8"
        />
        <TouchableOpacity style={styles.btn} onPress={updateSalary}>
          <Text style={styles.btnText}>Update Salary</Text>
        </TouchableOpacity>
      </View>

      {/* Add Budget */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📊 Add Budget Limit</Text>
        <TextInput
          style={styles.input}
          value={category}
          onChangeText={setCat}
          placeholder="Category (e.g. Food)"
          placeholderTextColor="#94a3b8"
        />
        <TextInput
          style={styles.input}
          value={limit}
          onChangeText={setLimit}
          keyboardType="numeric"
          placeholder="Limit Amount"
          placeholderTextColor="#94a3b8"
        />
        <TouchableOpacity style={styles.btn} onPress={addBudget}>
          <Text style={styles.btnText}>Add Budget</Text>
        </TouchableOpacity>
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
        <Text style={styles.logoutText}>🚪 Logout</Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:    { flex:1, backgroundColor:'#f1f5f9' },
  card:         { backgroundColor:'#2563eb', alignItems:'center', padding:32 },
  avatar:       { width:72, height:72, borderRadius:36, backgroundColor:'#1d4ed8',
                  textAlign:'center', lineHeight:72, fontSize:32,
                  color:'#fff', fontWeight:'800', overflow:'hidden' },
  name:         { fontSize:22, fontWeight:'800', color:'#fff', marginTop:12 },
  email:        { fontSize:14, color:'#bfdbfe', marginTop:4 },
  section:      { backgroundColor:'#fff', margin:16, borderRadius:14,
                  padding:16, elevation:2 },
  sectionTitle: { fontSize:15, fontWeight:'700', color:'#0f172a', marginBottom:12 },
  input:        { backgroundColor:'#f8fafc', borderRadius:10, padding:12,
                  fontSize:14, marginBottom:10, borderWidth:1,
                  borderColor:'#e2e8f0', color:'#0f172a' },
  btn:          { backgroundColor:'#2563eb', borderRadius:10, padding:14,
                  alignItems:'center' },
  btnText:      { color:'#fff', fontWeight:'700', fontSize:15 },
  logoutBtn:    { margin:16, backgroundColor:'#fee2e2', borderRadius:14,
                  padding:16, alignItems:'center' },
  logoutText:   { color:'#dc2626', fontWeight:'700', fontSize:15 },
});