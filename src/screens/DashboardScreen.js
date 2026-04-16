/**
 * DashboardScreen.js
 * Feature 2 — Date Range Filter (From–To Date)
 * Feature 3 — PDF Expense Report download
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, RefreshControl,
  ActivityIndicator, Alert, TouchableOpacity, Linking,
  TextInput, Modal, Platform,
} from 'react-native';
import api, { BASE_URL } from '../utils/api';
import { useAuth } from '../utils/AuthContext';

// Helper — format date object → YYYY-MM-DD string
const toDateStr = (d) => d.toISOString().split('T')[0];

// Helper — get first day of current month
const monthStart = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1);
};

export default function DashboardScreen() {
  const { user } = useAuth();

  // ── State ────────────────────────────────────────────────────────────────
  const [data,        setData]        = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const [fromDate,    setFromDate]    = useState(toDateStr(monthStart()));
  const [toDate,      setToDate]      = useState(toDateStr(new Date()));
  const [filterMode,  setFilterMode]  = useState('month');   // 'month' | 'range'
  const [showFilter,  setShowFilter]  = useState(false);
  const [tempFrom,    setTempFrom]    = useState(toDateStr(monthStart()));
  const [tempTo,      setTempTo]      = useState(toDateStr(new Date()));

  // ── Fetch dashboard data ──────────────────────────────────────────────────
  const fetchData = useCallback(async (from, to) => {
    try {
      const res = await api.get(
        `/api/expenses/filter?from_date=${from}&to_date=${to}`
      );
      setData(res.data);
    } catch (e) {
      Alert.alert('Error', 'Could not load dashboard.\nCheck Flask is running.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(fromDate, toDate); }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData(fromDate, toDate);
  };

  // ── Apply date range filter ───────────────────────────────────────────────
  const applyFilter = () => {
    if (tempFrom > tempTo) {
      Alert.alert('Invalid Range', '"From" date must be before "To" date.');
      return;
    }
    setFromDate(tempFrom);
    setToDate(tempTo);
    setFilterMode('range');
    setShowFilter(false);
    setLoading(true);
    fetchData(tempFrom, tempTo);
  };

  // Reset to current month
  const resetFilter = () => {
    const from = toDateStr(monthStart());
    const to   = toDateStr(new Date());
    setFromDate(from);
    setToDate(to);
    setTempFrom(from);
    setTempTo(to);
    setFilterMode('month');
    setShowFilter(false);
    setLoading(true);
    fetchData(from, to);
  };

  // ── Feature 3 — Open PDF in browser ──────────────────────────────────────
  const downloadPDF = async () => {
    const url = `${BASE_URL}/export/pdf?from_date=${fromDate}&to_date=${toDate}`;
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Cannot open PDF link.');
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to open PDF: ' + e.message);
    }
  };

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading…</Text>
      </View>
    );
  }

  const breakdown = data?.breakdown || {};
  const total     = data?.total     || 0;
  const expenses  = data?.expenses  || [];

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.welcome}>Hello, {user?.username} 👋</Text>
        <Text style={styles.period}>
          {filterMode === 'range'
            ? `${fromDate}  →  ${toDate}`
            : 'This Month'}
        </Text>
      </View>

      {/* ── Feature 2 — Date Filter Bar ─────────────────────────────── */}
      <View style={styles.filterBar}>
        <TouchableOpacity
          style={[styles.filterBtn, filterMode === 'month' && styles.filterBtnActive]}
          onPress={resetFilter}
        >
          <Text style={[styles.filterBtnText,
            filterMode === 'month' && styles.filterBtnTextActive]}>
            📅 This Month
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterBtn, filterMode === 'range' && styles.filterBtnActive]}
          onPress={() => setShowFilter(true)}
        >
          <Text style={[styles.filterBtnText,
            filterMode === 'range' && styles.filterBtnTextActive]}>
            🗓️ Custom Range
          </Text>
        </TouchableOpacity>

        {/* Feature 3 — PDF button */}
        <TouchableOpacity style={styles.pdfBtn} onPress={downloadPDF}>
          <Text style={styles.pdfBtnText}>📄 PDF</Text>
        </TouchableOpacity>
      </View>

      {/* ── Feature 2 — Date Range Picker Modal ─────────────────────── */}
      <Modal
        visible={showFilter}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFilter(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>📅 Select Date Range</Text>

            <Text style={styles.modalLabel}>From Date (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.modalInput}
              value={tempFrom}
              onChangeText={setTempFrom}
              placeholder="2026-01-01"
              placeholderTextColor="#94a3b8"
              keyboardType="numeric"
            />

            <Text style={styles.modalLabel}>To Date (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.modalInput}
              value={tempTo}
              onChangeText={setTempTo}
              placeholder="2026-12-31"
              placeholderTextColor="#94a3b8"
              keyboardType="numeric"
            />

            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: '#f1f5f9' }]}
                onPress={() => setShowFilter(false)}
              >
                <Text style={{ color: '#64748b', fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalBtn} onPress={applyFilter}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* KPI Cards */}
      <View style={styles.cardRow}>
        <View style={[styles.card, { marginRight: 8 }]}>
          <Text style={styles.cardLabel}>Total Spent</Text>
          <Text style={[styles.cardValue, { color: '#dc2626' }]}>
            Rs.{total.toFixed(2)}
          </Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Transactions</Text>
          <Text style={[styles.cardValue, { color: '#2563eb' }]}>
            {expenses.length}
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
              const pct = total > 0 ? Math.round(amt / total * 100) : 0;
              return (
                <View key={cat} style={styles.catRow}>
                  <Text style={styles.catName}>{cat}</Text>
                  <View style={styles.barBg}>
                    <View style={[styles.barFill, { width: `${pct}%` }]} />
                  </View>
                  <Text style={styles.catAmt}>Rs.{amt.toFixed(0)}</Text>
                </View>
              );
            })}
        </View>
      )}

      {/* Expense List */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🧾 Expenses</Text>
        {expenses.length === 0 ? (
          <Text style={styles.empty}>No expenses in selected period.</Text>
        ) : (
          expenses.slice(0, 15).map(e => (
            <View key={e.id} style={styles.expRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.expCat}>{e.category}</Text>
                {!!e.description && (
                  <Text style={styles.expDesc}>{e.description}</Text>
                )}
                <Text style={styles.expDate}>{e.date}</Text>
              </View>
              <Text style={styles.expAmt}>Rs.{e.amount.toFixed(2)}</Text>
            </View>
          ))
        )}
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: '#f1f5f9' },
  center:           { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText:      { marginTop: 12, color: '#64748b' },

  header:           { backgroundColor: '#2563eb', padding: 24, paddingTop: 48 },
  welcome:          { fontSize: 22, fontWeight: '800', color: '#fff' },
  period:           { fontSize: 13, color: '#bfdbfe', marginTop: 4 },

  filterBar:        { flexDirection: 'row', padding: 12, gap: 8,
                      backgroundColor: '#fff', borderBottomWidth: 1,
                      borderBottomColor: '#e2e8f0' },
  filterBtn:        { flex: 1, paddingVertical: 8, paddingHorizontal: 10,
                      borderRadius: 20, backgroundColor: '#f1f5f9',
                      alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  filterBtnActive:  { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  filterBtnText:    { fontSize: 12, fontWeight: '600', color: '#64748b' },
  filterBtnTextActive: { color: '#fff' },
  pdfBtn:           { paddingVertical: 8, paddingHorizontal: 14,
                      borderRadius: 20, backgroundColor: '#dc2626',
                      alignItems: 'center', justifyContent: 'center' },
  pdfBtnText:       { fontSize: 12, fontWeight: '700', color: '#fff' },

  modalOverlay:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
                      justifyContent: 'flex-end' },
  modalBox:         { backgroundColor: '#fff', borderRadius: 20, padding: 24,
                      margin: 16, marginBottom: 32 },
  modalTitle:       { fontSize: 17, fontWeight: '800', color: '#0f172a',
                      marginBottom: 16, textAlign: 'center' },
  modalLabel:       { fontSize: 13, fontWeight: '600', color: '#475569',
                      marginBottom: 6 },
  modalInput:       { backgroundColor: '#f8fafc', borderRadius: 10, padding: 12,
                      fontSize: 15, borderWidth: 1, borderColor: '#e2e8f0',
                      color: '#0f172a', marginBottom: 14 },
  modalBtns:        { flexDirection: 'row', gap: 10, marginTop: 4 },
  modalBtn:         { flex: 1, backgroundColor: '#2563eb', borderRadius: 10,
                      padding: 14, alignItems: 'center' },

  cardRow:          { flexDirection: 'row', padding: 16, paddingBottom: 0 },
  card:             { flex: 1, backgroundColor: '#fff', borderRadius: 14,
                      padding: 16, elevation: 2 },
  cardLabel:        { fontSize: 12, color: '#64748b', fontWeight: '600',
                      textTransform: 'uppercase' },
  cardValue:        { fontSize: 22, fontWeight: '800', marginTop: 4 },

  section:          { backgroundColor: '#fff', margin: 16, borderRadius: 14,
                      padding: 16, elevation: 2 },
  sectionTitle:     { fontSize: 15, fontWeight: '700', color: '#0f172a',
                      marginBottom: 12 },

  catRow:           { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  catName:          { width: 80, fontSize: 12, color: '#334155', fontWeight: '600' },
  barBg:            { flex: 1, height: 8, backgroundColor: '#e2e8f0',
                      borderRadius: 4, marginHorizontal: 8, overflow: 'hidden' },
  barFill:          { height: '100%', backgroundColor: '#2563eb', borderRadius: 4 },
  catAmt:           { fontSize: 12, color: '#64748b', width: 72, textAlign: 'right' },

  expRow:           { flexDirection: 'row', alignItems: 'center', paddingVertical: 10,
                      borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  expCat:           { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  expDesc:          { fontSize: 12, color: '#64748b', marginTop: 2 },
  expDate:          { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  expAmt:           { fontSize: 15, fontWeight: '700', color: '#dc2626' },
  empty:            { color: '#94a3b8', textAlign: 'center', padding: 20 },
});
