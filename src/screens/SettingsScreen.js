import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Modal, Animated } from 'react-native';
import { useRef, useEffect } from 'react';
import Screen from '../components/Screen';
import { C, FONT } from '../theme';
import { useStore } from '../store';

const GOALS = [1500, 2000, 2500, 3000, 3500, 4000];
const INTERVALS = [
  { v: 60, label: '1 hour' },
  { v: 90, label: '1.5 hours' },
  { v: 120, label: '2 hours' },
  { v: 180, label: '3 hours' },
];

function Toggle({ on, onPress }) {
  const x = useRef(new Animated.Value(on ? 18 : 0)).current;
  useEffect(() => { Animated.timing(x, { toValue: on ? 18 : 0, duration: 200, useNativeDriver: true }).start(); }, [on]);
  return (
    <Pressable onPress={onPress} style={[styles.toggle, on && styles.toggleOn]}>
      <Animated.View style={[styles.knob, { transform: [{ translateX: x }] }]} />
    </Pressable>
  );
}

export default function SettingsScreen() {
  const { s, setName, setGoal, toggleReminders, setInterval_, resetAll } = useStore();
  const [name, setLocalName] = useState(s.name || '');
  const [intervalOpen, setIntervalOpen] = useState(false);
  const currentInterval = INTERVALS.find((i) => i.v === s.interval) || INTERVALS[2];

  return (
    <Screen>
      <View style={styles.head}>
        <Text style={styles.h1}>Settings</Text>
      </View>
      <View style={styles.body}>
        <Text style={[styles.fieldLabel, { marginTop: 0 }]}>Her name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={(v) => { setLocalName(v); setName(v.trim()); }}
          placeholder="What do you call her?"
          placeholderTextColor={C.textDim}
          maxLength={20}
        />

        <Text style={styles.fieldLabel}>Daily goal</Text>
        <View style={styles.goalGrid}>
          {GOALS.map((g) => {
            const sel = g === s.goal;
            return (
              <Pressable key={g} style={[styles.goalChip, sel && styles.goalChipSel]} onPress={() => setGoal(g)}>
                <Text style={[styles.goalChipTxt, sel && styles.goalChipTxtSel]}>{g} ml</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.fieldLabel}>Reminders</Text>
        <View style={styles.reminderRow}>
          <Text style={styles.reminderTxt}>In-app reminders</Text>
          <Toggle on={s.remindersOn} onPress={toggleReminders} />
        </View>
        <View style={[styles.reminderRow, { borderBottomWidth: 0 }]}>
          <Text style={styles.reminderTxt}>Remind every</Text>
          <Pressable style={styles.selectBtn} onPress={() => setIntervalOpen(true)}>
            <Text style={styles.selectTxt}>{currentInterval.label} ▾</Text>
          </Pressable>
        </View>

        <Text style={styles.fieldLabel}>Your love notes</Text>
        <Text style={styles.noteHint}>
          She unlocks one of 16 messages per milestone (25/50/75/100%) — never the same one twice in a row. Edit the list in the code under <Text style={{ color: C.purple }}>REWARD_MESSAGES</Text> to make them yours.
        </Text>

        <Pressable style={styles.resetBtn} onPress={resetAll}>
          <Text style={styles.resetTxt}>Reset app data</Text>
        </Pressable>
      </View>

      <Modal visible={intervalOpen} transparent animationType="fade" onRequestClose={() => setIntervalOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setIntervalOpen(false)}>
          <View style={styles.dropdown}>
            {INTERVALS.map((i) => (
              <Pressable key={i.v} style={styles.dropItem} onPress={() => { setInterval_(i.v); setIntervalOpen(false); }}>
                <Text style={[styles.dropTxt, i.v === s.interval && { color: C.cyan }]}>{i.label}</Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { paddingTop: 38, paddingHorizontal: 24, paddingBottom: 6 },
  h1: { fontFamily: FONT.playfairItalic, fontSize: 23, color: 'rgba(255,255,255,0.9)' },
  body: { paddingHorizontal: 24, paddingBottom: 30 },
  fieldLabel: { fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', color: C.textDim, marginBottom: 12, marginTop: 30 },
  input: { width: '100%', backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: C.glassBorder, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, color: C.textMain, fontFamily: FONT.body, fontSize: 14 },
  goalGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  goalChip: { width: '47%', flexGrow: 1, paddingVertical: 13, borderRadius: 14, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.02)', borderWidth: 1, borderColor: C.glassBorder },
  goalChipSel: { backgroundColor: 'rgba(56,189,248,0.15)', borderColor: C.cyan },
  goalChipTxt: { fontSize: 13, color: C.textDim, fontFamily: FONT.body },
  goalChipTxtSel: { color: C.cyan, fontFamily: FONT.bodySemi },
  reminderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: C.glassBorder },
  reminderTxt: { fontSize: 13.5, color: C.textMain, fontFamily: FONT.body },
  toggle: { width: 44, height: 26, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center' },
  toggleOn: { backgroundColor: C.violet },
  knob: { position: 'absolute', left: 3, width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff' },
  selectBtn: { backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: C.glassBorder, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 9 },
  selectTxt: { color: C.textMain, fontFamily: FONT.body, fontSize: 14 },
  noteHint: { fontSize: 11.5, color: C.textDim, lineHeight: 20, marginTop: 0, fontFamily: FONT.body },
  resetBtn: { marginTop: 36, paddingVertical: 15, borderRadius: 14, backgroundColor: 'rgba(239,68,68,0.08)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)', alignItems: 'center' },
  resetTxt: { color: C.red, fontSize: 10, letterSpacing: 1.8, textTransform: 'uppercase', fontFamily: FONT.bodySemi },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: 40 },
  dropdown: { backgroundColor: '#101620', borderWidth: 1, borderColor: C.glassBorder, borderRadius: 16, width: 200, overflow: 'hidden' },
  dropItem: { paddingVertical: 14, paddingHorizontal: 18, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  dropTxt: { color: C.textMain, fontFamily: FONT.body, fontSize: 14 },
});
