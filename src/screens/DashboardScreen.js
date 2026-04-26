/**
 * DashboardScreen.js
 * Feature 2 — Date Range Filter
 * Feature 3 — PDF Report
 * Charts     — Pie chart + Bar chart for category breakdown
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, RefreshControl,
  ActivityIndicator, Alert, TouchableOpacity, Linking,
  TextInput, Modal, Dimensions,
} from 'react-native';
import api, { BASE_URL } from '../utils/api';
import { useAuth } from '../utils/AuthContext';

const SCREEN_W = Dimensions.get('window').width;
const CHART_W  = SCREEN_W - 64; // padding on both sides

// Colour palette for categories
const COLORS = [
  '#3b82f6','#f97316','#10b981','#ec4899',
  '#8b5cf6','#f59e0b','#06b6d4','#ef4444',
  '#84cc16','#6366f1',
];

// Helper — YYYY-MM-DD string from Date
const toDateStr = (d) => d.toISOString().split('T')[0];
const monthStart = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1);
};

// ── Simple SVG-free Pie Chart (pure RN View arcs aren't easy, so we use
//    a segmented horizontal bar as "donut" alternative that always works) ──────
function DonutLegend({ breakdown, total }) {
  const entries = Object.entries(breakdown).sort((a, b) => b[1] - a[1]);
  if (entries.length === 0) return null;

  return (
    <View>
      {/* Segmented bar acting as pie */}
      <View style={pieStyles.bar}>
        {entries.map(([cat, amt], i) => {
          const pct = total > 0 ? (amt / total) * 100 : 0;
          return (
            <View
              key={cat}
              style={[
                pieStyles.segment,
                {
                  flex: pct,
                  backgroundColor: COLORS[i % COLORS.length],
                },
              ]}
            />
          );
        })}
      </View>

      {/* Legend */}
      <View style={pieStyles.legend}>
        {entries.map(([cat, amt], i) => {
          const pct = total > 0 ? ((amt / total) * 100).toFixed(1) : '0.0';
          return (
            <View key={cat} style={pieStyles.legendItem}>
              <View
                style={[
                  pieStyles.dot,
                  { backgroundColor: COLORS[i % COLORS.length] },
                ]}
              />
              <Text style={pieStyles.legendLabel}>{cat}</Text>
              <Text style={pieStyles.legendPct}>{pct}%</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const pieStyles = StyleSheet.create({
  bar:         { flexDirection: 'row', height: 28, borderRadius: 14,
                 overflow: 'hidden', marginBottom: 16 },
  segment:     { height: '100%' },
  legend:      { gap: 8 },
  legendItem:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot:         { width: 12, height: 12, borderRadius: 6 },
  legendLabel: { flex: 1, fontSize: 13, color: '#334155', fontWeight: '500' },
  legendPct:   { fontSize: 13, color: '#64748b', fontWeight: '600' },
});

// ── Simple Bar Chart (pure RN, no library needed) ─────────────────────────────
function BarChart({ breakdown, total }) {
  const entries = Object.entries(breakdown).sort((a, b) => b[1] - a[1]);
  if (entries.length === 0) return null;

  const maxVal = entries[0][1];

  return (
    <View style={barStyles.container}>
      {entries.map(([cat, amt], i) => {
        const barW = maxVal > 0 ? (amt / maxVal) * (CHART_W - 90) : 0;
        return (
          <View key={cat} style={barStyles.row}>
            <Text style={barStyles.label} numberOfLines={1}>{cat}</Text>
            <View style={barStyles.barBg}>
              <View
                style={[
                  barStyles.barFill,
                  {
                    width: barW,
                    backgroundColor: COLORS[i % COLORS.length],
                  },
                ]}
              />
            </View>
            <Text style={barStyles.value}>Rs.{amt.toFixed(0)}</Text>
          </View>
        );
      })}
    </View>
  );
}

const barStyles = StyleSheet.create({
  container: { gap: 10 },
  row:       { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label:     { width: 72, fontSize: 12, color: '#334155',
               fontWeight: '600', textAlign: 'right' },
  barBg:     { flex: 1, height: 20, backgroundColor: '#f1f5f9',
               borderRadius: 10, overflow: 'hidden' },
  barFill:   { height: '100%', borderRadius: 10 },
  value:     { width: 64, fontSize: 11, color: '#64748b',
               textAlign: 'right', fontWeight: '500' },
});

// ═════════════════════════════════════════════════════════════════════════════
export default function DashboardScreen() {
  const { user } = useAuth();

  const [data,       setData]       = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fromDate,   setFromDate]   = useState(toDateStr(monthStart()));
  const [toDate,     setToDate]     = useState(toDateStr(new Date()));
  const [filterMode, setFilterMode] = useState('month');
  const [showFilter, setShowFilter] = useState(false);
  const [tempFrom,   setTempFrom]   = useState(toDateStr(monthStart()));
  const [tempTo,     setTempTo]     = useState(toDateStr(new Date()));

  // ── Fetch ───────────────────────────────────────────────────────────────
  const fetchData = useCallback(async (from, to) => {
    try {
      const res = await api.get(
        `/api/expenses/filter?from_date=${from}&to_date=${to}`
      );
      setData(res.data);
    } catch (e) {
      Alert.alert('Error', 'Could not load data.\nCheck Flask is running.');
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

  // ── Apply filter ────────────────────────────────────────────────────────
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

  const resetFilter = () => {
    const from = toDateStr(monthStart());
    const to   = toDateStr(new Date());
    setFromDate(from); setToDate(to);
    setTempFrom(from); setTempTo(to);
    setFilterMode('month');
    setShowFilter(false);
    setLoading(true);
    fetchData(from, to);
  };

  // ── PDF download ────────────────────────────────────────────────────────
  const downloadPDF = async () => {
    const url = `${BASE_URL}/export/pdf?from_date=${fromDate}&to_date=${toDate}`;
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('Error', 'Failed to open PDF.');
    }
  };

  // ── Loading ─────────────────────────────────────────────────────────────
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
  const hasData   = Object.keys(breakdown).length > 0;

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

      {/* ── Date Filter Bar ─────────────────────────────────────────── */}
      <View style={styles.filterBar}>
        <TouchableOpacity
          style={[styles.filterBtn,
            filterMode === 'month' && styles.filterBtnActive]}
          onPress={resetFilter}
        >
          <Text style={[styles.filterBtnText,
            filterMode === 'month' && styles.filterBtnTextActive]}>
            📅 This Month
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterBtn,
            filterMode === 'range' && styles.filterBtnActive]}
          onPress={() => setShowFilter(true)}
        >
          <Text style={[styles.filterBtnText,
            filterMode === 'range' && styles.filterBtnTextActive]}>
            🗓️ Custom Range
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.pdfBtn} onPress={downloadPDF}>
          <Text style={styles.pdfBtnText}>📄 PDF</Text>
        </TouchableOpacity>
      </View>

      {/* ── Date Range Modal ────────────────────────────────────────── */}
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
            />

            <Text style={styles.modalLabel}>To Date (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.modalInput}
              value={tempTo}
              onChangeText={setTempTo}
              placeholder="2026-12-31"
              placeholderTextColor="#94a3b8"
            />

            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: '#f1f5f9' }]}
                onPress={() => setShowFilter(false)}
              >
                <Text style={{ color: '#64748b', fontWeight: '600' }}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalBtn} onPress={applyFilter}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── KPI Cards ───────────────────────────────────────────────── */}
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

      {/* ── Pie Chart (Segmented bar + legend) ──────────────────────── */}
      {hasData && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🥧 Expenses by Category</Text>
          <DonutLegend breakdown={breakdown} total={total} />
        </View>
      )}

      {/* ── Bar Chart ───────────────────────────────────────────────── */}
      {hasData && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Category Bar Chart</Text>
          <BarChart breakdown={breakdown} total={total} />
        </View>
      )}

      {/* ── Expense List ─────────────────────────────────────────────── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🧾 Recent Expenses</Text>
        {expenses.length === 0 ? (
          <Text style={styles.empty}>No expenses in selected period.</Text>
        ) : (
          expenses.slice(0, 15).map((e, idx) => (
            <View key={e.id} style={[
              styles.expRow,
              { borderLeftColor: COLORS[idx % COLORS.length] },
            ]}>
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
  container:           { flex: 1, backgroundColor: '#f1f5f9' },
  center:              { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText:         { marginTop: 12, color: '#64748b' },

  header:              { backgroundColor: '#2563eb', padding: 24, paddingTop: 48 },
  welcome:             { fontSize: 22, fontWeight: '800', color: '#fff' },
  period:              { fontSize: 13, color: '#bfdbfe', marginTop: 4 },

  filterBar:           { flexDirection: 'row', padding: 12, gap: 8,
                         backgroundColor: '#fff', borderBottomWidth: 1,
                         borderBottomColor: '#e2e8f0' },
  filterBtn:           { flex: 1, paddingVertical: 8, paddingHorizontal: 6,
                         borderRadius: 20, backgroundColor: '#f1f5f9',
                         alignItems: 'center', borderWidth: 1,
                         borderColor: '#e2e8f0' },
  filterBtnActive:     { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  filterBtnText:       { fontSize: 11, fontWeight: '600', color: '#64748b' },
  filterBtnTextActive: { color: '#fff' },
  pdfBtn:              { paddingVertical: 8, paddingHorizontal: 14,
                         borderRadius: 20, backgroundColor: '#dc2626',
                         alignItems: 'center', justifyContent: 'center' },
  pdfBtnText:          { fontSize: 12, fontWeight: '700', color: '#fff' },

  modalOverlay:        { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
                         justifyContent: 'flex-end' },
  modalBox:            { backgroundColor: '#fff', borderRadius: 20,
                         padding: 24, margin: 16, marginBottom: 32 },
  modalTitle:          { fontSize: 17, fontWeight: '800', color: '#0f172a',
                         marginBottom: 16, textAlign: 'center' },
  modalLabel:          { fontSize: 13, fontWeight: '600', color: '#475569',
                         marginBottom: 6 },
  modalInput:          { backgroundColor: '#f8fafc', borderRadius: 10,
                         padding: 12, fontSize: 15, borderWidth: 1,
                         borderColor: '#e2e8f0', color: '#0f172a',
                         marginBottom: 14 },
  modalBtns:           { flexDirection: 'row', gap: 10, marginTop: 4 },
  modalBtn:            { flex: 1, backgroundColor: '#2563eb', borderRadius: 10,
                         padding: 14, alignItems: 'center' },

  cardRow:             { flexDirection: 'row', padding: 16, paddingBottom: 0 },
  card:                { flex: 1, backgroundColor: '#fff', borderRadius: 14,
                         padding: 16, elevation: 2 },
  cardLabel:           { fontSize: 12, color: '#64748b', fontWeight: '600',
                         textTransform: 'uppercase' },
  cardValue:           { fontSize: 22, fontWeight: '800', marginTop: 4 },

  section:             { backgroundColor: '#fff', margin: 16, borderRadius: 14,
                         padding: 16, elevation: 2 },
  sectionTitle:        { fontSize: 15, fontWeight: '700', color: '#0f172a',
                         marginBottom: 14 },

  expRow:              { flexDirection: 'row', alignItems: 'center',
                         paddingVertical: 10, borderBottomWidth: 1,
                         borderBottomColor: '#f1f5f9', borderLeftWidth: 3,
                         paddingLeft: 10, marginBottom: 2 },
  expCat:              { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  expDesc:             { fontSize: 12, color: '#64748b', marginTop: 2 },
  expDate:             { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  expAmt:              { fontSize: 15, fontWeight: '700', color: '#dc2626' },
  empty:               { color: '#94a3b8', textAlign: 'center', padding: 20 },
});
