/**
 * ProfileScreen.js
 * Feature 1 — Custom User Categories
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ScrollView, Modal, FlatList,
} from 'react-native';
import api from '../utils/api';
import { useAuth } from '../utils/AuthContext';

// Default categories — always visible, cannot be deleted
const DEFAULT_CATEGORIES = [
  { name: 'Food',        icon: '🍔', color: '#f97316' },
  { name: 'Transport',   icon: '🚗', color: '#3b82f6' },
  { name: 'Shopping',    icon: '🛍️', color: '#ec4899' },
  { name: 'Health',      icon: '💊', color: '#10b981' },
  { name: 'Education',   icon: '📚', color: '#8b5cf6' },
  { name: 'Bills',       icon: '🏠', color: '#f59e0b' },
  { name: 'Other',       icon: '📦', color: '#6b7280' },
];

const EMOJI_CHOICES = ['🏷️','🎮','🐾','✈️','🎵','🏋️','🍕','🎁','💼','🌿',
                       '🏖️','🎓','🛒','💡','🔧','🎨','📱','🚀','⚽','🎯'];
const COLOR_CHOICES = ['#6366f1','#f97316','#10b981','#ec4899','#3b82f6',
                       '#f59e0b','#8b5cf6','#06b6d4','#ef4444','#84cc16'];

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  // Salary
  const [salary,      setSalary]      = useState(String(user?.salary || ''));

  // Budget
  const [budgetCat,   setBudgetCat]   = useState('');
  const [budgetLimit, setBudgetLimit] = useState('');
  const [budgets,     setBudgets]     = useState([]);

  // Custom categories
  const [customCats,  setCustomCats]  = useState([]);
  const [showCatModal,setShowCatModal]= useState(false);
  const [newCatName,  setNewCatName]  = useState('');
  const [newCatIcon,  setNewCatIcon]  = useState('🏷️');
  const [newCatColor, setNewCatColor] = useState('#6366f1');

  // ── Load budgets and custom categories ───────────────────────────────────
  const loadBudgets = useCallback(async () => {
    try {
      const res = await api.get('/api/budgets');
      setBudgets(res.data.budgets || []);
    } catch (_) {}
  }, []);

  const loadCategories = useCallback(async () => {
    try {
      const res  = await api.get('/api/categories');
      const defaultNames = new Set(DEFAULT_CATEGORIES.map(c => c.name));
      const custom = (res.data.categories || []).filter(
        c => !defaultNames.has(c.name)
      );
      setCustomCats(custom);
    } catch (_) {}
  }, []);

  useEffect(() => {
    loadBudgets();
    loadCategories();
  }, []);

  // ── Salary update ─────────────────────────────────────────────────────────
  const updateSalary = async () => {
    if (!salary) { Alert.alert('Error', 'Enter salary amount'); return; }
    try {
      const res = await api.post('/api/salary/update', { salary: parseFloat(salary) });
      if (res.data.success) Alert.alert('✅ Success', 'Salary updated!');
      else Alert.alert('Error', res.data.error);
    } catch { Alert.alert('Error', 'Could not update salary.'); }
  };

  // ── Add budget ────────────────────────────────────────────────────────────
  const addBudget = async () => {
    if (!budgetCat || !budgetLimit) {
      Alert.alert('Error', 'Fill in category and limit amount');
      return;
    }
    try {
      const res = await api.post('/api/budgets/add', {
        category:     budgetCat.trim(),
        limit_amount: parseFloat(budgetLimit),
      });
      if (res.data.success) {
        Alert.alert('✅ Success', `Budget for ${budgetCat} added!`);
        setBudgetCat('');
        setBudgetLimit('');
        loadBudgets();
      } else {
        Alert.alert('Error', res.data.error);
      }
    } catch { Alert.alert('Error', 'Could not add budget.'); }
  };

  // ── Feature 1 — Create custom category ───────────────────────────────────
  const createCategory = async () => {
    if (!newCatName.trim()) {
      Alert.alert('Error', 'Enter a category name');
      return;
    }
    try {
      const res = await api.post('/api/categories', {
        name:  newCatName.trim(),
        icon:  newCatIcon,
        color: newCatColor,
      });
      if (res.data.success) {
        setShowCatModal(false);
        setNewCatName('');
        setNewCatIcon('🏷️');
        setNewCatColor('#6366f1');
        loadCategories();
        Alert.alert('✅ Created', `Category "${newCatName}" added!`);
      } else {
        Alert.alert('Error', res.data.error);
      }
    } catch { Alert.alert('Error', 'Could not create category.'); }
  };

  // ── Feature 1 — Delete custom category ───────────────────────────────────
  const deleteCategory = (cat) => {
    Alert.alert(
      'Delete Category',
      `Delete "${cat.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/api/categories/${cat.id}`);
              loadCategories();
            } catch { Alert.alert('Error', 'Could not delete.'); }
          },
        },
      ]
    );
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <ScrollView style={styles.container}>

      {/* Profile Card */}
      <View style={styles.profileCard}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>
            {user?.username?.[0]?.toUpperCase() || '?'}
          </Text>
        </View>
        <Text style={styles.profileName}>{user?.username}</Text>
        <Text style={styles.profileEmail}>{user?.email}</Text>
      </View>

      {/* ── Salary ─────────────────────────────────────────────────── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>💵 Monthly Salary</Text>
        <TextInput
          style={styles.input}
          value={salary}
          onChangeText={setSalary}
          keyboardType="numeric"
          placeholder="Enter monthly salary"
          placeholderTextColor="#94a3b8"
        />
        <TouchableOpacity style={styles.btn} onPress={updateSalary}>
          <Text style={styles.btnText}>Update Salary</Text>
        </TouchableOpacity>
      </View>

      {/* ── Budget ─────────────────────────────────────────────────── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📊 Add Budget Limit</Text>
        <TextInput
          style={styles.input}
          value={budgetCat}
          onChangeText={setBudgetCat}
          placeholder="Category (e.g. Food)"
          placeholderTextColor="#94a3b8"
        />
        <TextInput
          style={styles.input}
          value={budgetLimit}
          onChangeText={setBudgetLimit}
          keyboardType="numeric"
          placeholder="Limit Amount (Rs.)"
          placeholderTextColor="#94a3b8"
        />
        <TouchableOpacity style={styles.btn} onPress={addBudget}>
          <Text style={styles.btnText}>Add Budget</Text>
        </TouchableOpacity>

        {budgets.length > 0 && (
          <View style={{ marginTop: 14 }}>
            <Text style={styles.subTitle}>Current Budgets</Text>
            {budgets.map(b => (
              <View key={b.id} style={styles.budgetRow}>
                <Text style={styles.budgetCat}>{b.category}</Text>
                <Text style={styles.budgetAmt}>Rs.{b.limit_amount.toFixed(2)}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* ── Feature 1 — Custom Categories ──────────────────────────── */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>🏷️ Custom Categories</Text>
          <TouchableOpacity
            style={styles.addCatBtn}
            onPress={() => setShowCatModal(true)}
          >
            <Text style={styles.addCatBtnText}>+ Add</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.hint}>
          Default categories (always available):
        </Text>
        <View style={styles.chipsRow}>
          {DEFAULT_CATEGORIES.map(c => (
            <View key={c.name} style={[styles.chip, { borderColor: c.color }]}>
              <Text style={styles.chipText}>{c.icon} {c.name}</Text>
            </View>
          ))}
        </View>

        {customCats.length > 0 && (
          <>
            <Text style={[styles.hint, { marginTop: 12 }]}>
              Your custom categories:
            </Text>
            <View style={styles.chipsRow}>
              {customCats.map(c => (
                <TouchableOpacity
                  key={c.id}
                  style={[styles.chip, styles.chipCustom, { borderColor: c.color }]}
                  onLongPress={() => deleteCategory(c)}
                >
                  <Text style={styles.chipText}>{c.icon} {c.name}</Text>
                  <Text style={styles.chipDel}>  ✕</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.hint}>Long-press a custom category to delete it.</Text>
          </>
        )}
      </View>

      {/* ── Logout ─────────────────────────────────────────────────── */}
      <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
        <Text style={styles.logoutText}>🚪 Logout</Text>
      </TouchableOpacity>

      {/* ── Feature 1 — Add Category Modal ─────────────────────────── */}
      <Modal
        visible={showCatModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCatModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>🏷️ New Category</Text>

            <Text style={styles.modalLabel}>Category Name</Text>
            <TextInput
              style={styles.modalInput}
              value={newCatName}
              onChangeText={setNewCatName}
              placeholder="e.g. Gaming, Pets, Gym"
              placeholderTextColor="#94a3b8"
            />

            <Text style={styles.modalLabel}>Choose Icon</Text>
            <View style={styles.emojiGrid}>
              {EMOJI_CHOICES.map(e => (
                <TouchableOpacity
                  key={e}
                  style={[styles.emojiBtn,
                    newCatIcon === e && styles.emojiBtnSelected]}
                  onPress={() => setNewCatIcon(e)}
                >
                  <Text style={styles.emojiText}>{e}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.modalLabel}>Choose Colour</Text>
            <View style={styles.colorGrid}>
              {COLOR_CHOICES.map(c => (
                <TouchableOpacity
                  key={c}
                  style={[styles.colorDot, { backgroundColor: c },
                    newCatColor === c && styles.colorDotSelected]}
                  onPress={() => setNewCatColor(c)}
                />
              ))}
            </View>

            {/* Preview */}
            <View style={[styles.chip, { borderColor: newCatColor,
              alignSelf: 'center', marginVertical: 10 }]}>
              <Text style={styles.chipText}>
                {newCatIcon} {newCatName || 'Preview'}
              </Text>
            </View>

            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: '#f1f5f9' }]}
                onPress={() => setShowCatModal(false)}
              >
                <Text style={{ color: '#64748b', fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalBtn} onPress={createCategory}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#f1f5f9' },
  profileCard:    { backgroundColor: '#2563eb', alignItems: 'center', padding: 36 },
  avatarCircle:   { width: 72, height: 72, borderRadius: 36,
                    backgroundColor: '#1d4ed8', alignItems: 'center',
                    justifyContent: 'center' },
  avatarText:     { fontSize: 32, color: '#fff', fontWeight: '800' },
  profileName:    { fontSize: 22, fontWeight: '800', color: '#fff', marginTop: 12 },
  profileEmail:   { fontSize: 14, color: '#bfdbfe', marginTop: 4 },

  section:        { backgroundColor: '#fff', margin: 16, borderRadius: 14,
                    padding: 16, elevation: 2 },
  sectionHeader:  { flexDirection: 'row', justifyContent: 'space-between',
                    alignItems: 'center', marginBottom: 12 },
  sectionTitle:   { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  subTitle:       { fontSize: 13, fontWeight: '600', color: '#475569',
                    marginBottom: 8 },
  hint:           { fontSize: 11, color: '#94a3b8', marginBottom: 8 },
  input:          { backgroundColor: '#f8fafc', borderRadius: 10, padding: 12,
                    fontSize: 14, marginBottom: 10, borderWidth: 1,
                    borderColor: '#e2e8f0', color: '#0f172a' },
  btn:            { backgroundColor: '#2563eb', borderRadius: 10,
                    padding: 14, alignItems: 'center' },
  btnText:        { color: '#fff', fontWeight: '700', fontSize: 15 },

  budgetRow:      { flexDirection: 'row', justifyContent: 'space-between',
                    paddingVertical: 8, borderBottomWidth: 1,
                    borderBottomColor: '#f1f5f9' },
  budgetCat:      { fontSize: 14, color: '#334155', fontWeight: '600' },
  budgetAmt:      { fontSize: 14, color: '#2563eb', fontWeight: '700' },

  addCatBtn:      { backgroundColor: '#2563eb', borderRadius: 20,
                    paddingHorizontal: 14, paddingVertical: 6 },
  addCatBtnText:  { color: '#fff', fontWeight: '700', fontSize: 13 },

  chipsRow:       { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip:           { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12,
                    paddingVertical: 6, borderRadius: 20, borderWidth: 1.5,
                    borderColor: '#e2e8f0', backgroundColor: '#f8fafc' },
  chipCustom:     { backgroundColor: '#f0f4ff' },
  chipText:       { fontSize: 13, color: '#334155', fontWeight: '500' },
  chipDel:        { fontSize: 11, color: '#dc2626', fontWeight: '700' },

  logoutBtn:      { margin: 16, backgroundColor: '#fee2e2', borderRadius: 14,
                    padding: 16, alignItems: 'center', marginBottom: 40 },
  logoutText:     { color: '#dc2626', fontWeight: '700', fontSize: 15 },

  modalOverlay:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
                    justifyContent: 'flex-end' },
  modalBox:       { backgroundColor: '#fff', borderRadius: 20, padding: 24,
                    margin: 16, marginBottom: 32 },
  modalTitle:     { fontSize: 17, fontWeight: '800', color: '#0f172a',
                    marginBottom: 16, textAlign: 'center' },
  modalLabel:     { fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 8 },
  modalInput:     { backgroundColor: '#f8fafc', borderRadius: 10, padding: 12,
                    fontSize: 15, borderWidth: 1, borderColor: '#e2e8f0',
                    color: '#0f172a', marginBottom: 14 },
  emojiGrid:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  emojiBtn:       { width: 40, height: 40, borderRadius: 10, backgroundColor: '#f1f5f9',
                    alignItems: 'center', justifyContent: 'center' },
  emojiBtnSelected:{ backgroundColor: '#dbeafe', borderWidth: 2, borderColor: '#2563eb' },
  emojiText:      { fontSize: 20 },
  colorGrid:      { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 4 },
  colorDot:       { width: 32, height: 32, borderRadius: 16 },
  colorDotSelected:{ borderWidth: 3, borderColor: '#0f172a' },
  modalBtns:      { flexDirection: 'row', gap: 10, marginTop: 8 },
  modalBtn:       { flex: 1, backgroundColor: '#2563eb', borderRadius: 10,
                    padding: 14, alignItems: 'center' },
});
