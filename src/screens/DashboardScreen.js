import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  RefreshControl, ActivityIndicator, Alert,
} from 'react-native';
import api from '../utils/api';
import { useAuth } from '../utils/AuthContext';

export default function DashboardScreen() {
  const { user }              = useAuth();
  const [data,     setData]   = useState(null);
  const [loading,  setLoading]= useState(true);
  const [refresh,  setRefresh]= useState(false);

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await api.get('/api/dashboard');
      setData(res.data);
    } catch (e) {
      Alert.alert('Error', 'Could not load dashboard data.');
    } finally {
      setLoading(false);
      setRefresh(false);
    }
  }, []);

  useEffect(() => { fetchDashboard(); }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading dashboard…</Text>
      </View>
    );
  }

  const breakdown = data?.breakdown || {};

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refresh}
          onRefresh={() => { setRefresh(true); fetchDashboard(); }} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.welcome}>Hello, {user?.username} 👋</Text>
        <Text style={styles.month}>This Month's Summary</Text>
      </View>

      {/* KPI Cards */}
      <View style={styles.cardRow}>
        <View style={[styles.card, { flex:1, marginRight:8 }]}>
          <Text style={styles.cardLabel}>Total Spent</Text>
          <Text style={[styles.cardValue, { color:'#dc2626' }]}>
            Rs.{data?.total?.toFixed(2) || '0.00'}
          </Text>
        </View>
        <View style={[styles.card, { flex:1 }]}>
          <Text style={styles.cardLabel}>Remaining</Text>
          <Text style={[styles.cardValue,
            { color: (data?.remaining ?? 0) >= 0 ? '#16a34a' : '#dc2626' }]}>
            Rs.{data?.remaining?.toFixed(2) || '0.00'}
          </Text>
        </View>
      </View>

      {/* Category Breakdown */}
      {Object.keys(breakdown).length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📂 Category Breakdown</Text>
          {Object.entries(breakdown)
            .sort((a, b) => b[1] - a[1])
            .map(([cat, amt]) => {
              const pct = data.total > 0
                ? Math.round(amt / data.total * 100) : 0;
              return (
                <View key={cat} style={styles.catRow}>
                  <Text style={styles.catName}>{cat}</Text>
                  <View style={styles.barBg}>
                    <View style={[styles.barFill, { width: `${pct}%` }]} />
                  </View>
                  <Text style={styles.catAmt}>Rs.{amt.toFixed(2)}</Text>
                </View>
              );
            })}
        </View>
      )}

      {/* Recent Expenses */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🧾 Recent Expenses</Text>
        {data?.expenses?.length === 0
          ? <Text style={styles.empty}>No expenses this month</Text>
          : data?.expenses?.slice(0, 10).map(e => (
            <View key={e.id} style={styles.expRow}>
              <View style={{ flex:1 }}>
                <Text style={styles.expCat}>{e.category}</Text>
                <Text style={styles.expDesc}>{e.description || '—'}</Text>
                <Text style={styles.expDate}>{e.date}</Text>
              </View>
              <Text style={styles.expAmt}>Rs.{e.amount.toFixed(2)}</Text>
            </View>
          ))
        }
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:   { flex:1, backgroundColor:'#f1f5f9' },
  center:      { flex:1, alignItems:'center', justifyContent:'center' },
  loadingText: { marginTop:12, color:'#64748b' },
  header:      { backgroundColor:'#2563eb', padding:24, paddingTop:48 },
  welcome:     { fontSize:22, fontWeight:'800', color:'#fff' },
  month:       { fontSize:13, color:'#bfdbfe', marginTop:4 },
  cardRow:     { flexDirection:'row', padding:16, paddingBottom:0 },
  card:        { backgroundColor:'#fff', borderRadius:14, padding:16,
                 elevation:2, shadowColor:'#000', shadowOpacity:.06,
                 shadowOffset:{ width:0, height:2 } },
  cardLabel:   { fontSize:12, color:'#64748b', fontWeight:'600',
                 textTransform:'uppercase' },
  cardValue:   { fontSize:24, fontWeight:'800', marginTop:4 },
  section:     { backgroundColor:'#fff', margin:16, borderRadius:14,
                 padding:16, elevation:2, shadowColor:'#000',
                 shadowOpacity:.06, shadowOffset:{ width:0, height:2 } },
  sectionTitle:{ fontSize:15, fontWeight:'700', color:'#0f172a', marginBottom:12 },
  catRow:      { flexDirection:'row', alignItems:'center', marginBottom:10 },
  catName:     { width:80, fontSize:13, color:'#334155' },
  barBg:       { flex:1, height:8, backgroundColor:'#e2e8f0',
                 borderRadius:4, marginHorizontal:8, overflow:'hidden' },
  barFill:     { height:'100%', backgroundColor:'#2563eb', borderRadius:4 },
  catAmt:      { fontSize:12, color:'#64748b', width:75, textAlign:'right' },
  expRow:      { flexDirection:'row', alignItems:'center', paddingVertical:10,
                 borderBottomWidth:1, borderBottomColor:'#f1f5f9' },
  expCat:      { fontSize:14, fontWeight:'700', color:'#0f172a' },
  expDesc:     { fontSize:12, color:'#64748b', marginTop:2 },
  expDate:     { fontSize:11, color:'#94a3b8', marginTop:2 },
  expAmt:      { fontSize:15, fontWeight:'700', color:'#dc2626' },
  empty:       { color:'#94a3b8', textAlign:'center', padding:20 },
});