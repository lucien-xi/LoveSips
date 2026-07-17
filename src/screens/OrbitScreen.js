import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Modal, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Screen from '../components/Screen';
import { C, FONT } from '../theme';
import { useStore, getPastDateStr, todayStr, dateKey } from '../store';
import { DropIcon, CalendarIcon, LockIcon } from '../components/icons';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function AchRow({ a, pop }) {
  const scale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (!pop) return;
    Animated.sequence([
      Animated.timing(scale, { toValue: 1.04, duration: 300, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 550, useNativeDriver: true }),
    ]).start();
  }, [pop]);
  return (
    <Animated.View style={[styles.achRow, a.earned && styles.achRowEarned, { transform: [{ scale }] }]}>
      <View style={[styles.achIcon, a.earned && styles.achIconEarned]}>
        {a.earned ? <Text style={{ fontSize: 18 }}>{a.icon}</Text> : <LockIcon size={16} color={C.textDim} />}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.achTitle, a.earned && styles.achTitleEarned]}>{a.title}</Text>
        <Text style={styles.achDesc}>{a.desc}</Text>
      </View>
    </Animated.View>
  );
}

function CalendarModal({ visible, onClose, wasGoalHit }) {
  const now = new Date();
  const [y, setY] = useState(now.getFullYear());
  const [m, setM] = useState(now.getMonth());
  useEffect(() => { if (visible) { setY(now.getFullYear()); setM(now.getMonth()); } }, [visible]);

  const firstDay = new Date(y, m, 1).getDay();
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const t = todayStr();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) cells.push(day);

  const prev = () => { let nm = m - 1, ny = y; if (nm < 0) { nm = 11; ny--; } setM(nm); setY(ny); };
  const next = () => { let nm = m + 1, ny = y; if (nm > 11) { nm = 0; ny++; } setM(nm); setY(ny); };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.calCard} onPress={() => {}}>
          <View style={styles.calHead}>
            <Pressable style={styles.calNav} onPress={prev}><Text style={styles.calNavTxt}>‹</Text></Pressable>
            <Text style={styles.calTitle}>{MONTHS[m]} {y}</Text>
            <Pressable style={styles.calNav} onPress={next}><Text style={styles.calNavTxt}>›</Text></Pressable>
          </View>
          <View style={styles.calWeekdays}>
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((w, i) => <Text key={i} style={styles.calWeekday}>{w}</Text>)}
          </View>
          <View style={styles.calGrid}>
            {cells.map((day, i) => {
              if (day == null) return <View key={i} style={styles.calDayWrap} />;
              const key = `${y}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const hit = wasGoalHit(key);
              const isToday = key === t;
              return (
                <View key={i} style={styles.calDayWrap}>
                  {hit ? (
                    <LinearGradient colors={['#00E5FF', '#7C3AED']} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={[styles.calDay, isToday && styles.calToday]}>
                      <Text style={styles.calDayHitTxt}>{day}</Text>
                    </LinearGradient>
                  ) : (
                    <View style={[styles.calDay, styles.calDayIdle, isToday && styles.calToday]}>
                      <Text style={styles.calDayTxt}>{day}</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
          <Pressable style={styles.calClose} onPress={onClose}><Text style={styles.calCloseTxt}>Close</Text></Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export default function OrbitScreen() {
  const { s, wasGoalHit, computeAchievements } = useStore();
  const [calOpen, setCalOpen] = useState(false);
  const [ach, setAch] = useState({ list: [], newlyUnlocked: [] });

  useEffect(() => { setAch(computeAchievements()); }, []);

  // chart
  let maxVal = s.goal;
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const dStr = getPastDateStr(i);
    const amt = (s.days[dStr] && s.days[dStr].amount) || 0;
    if (amt > maxVal) maxVal = amt;
    const dObj = new Date(); dObj.setDate(dObj.getDate() - i);
    days.push({ label: dObj.toLocaleDateString('en-US', { weekday: 'short' }).charAt(0), amount: amt, hit: amt >= s.goal });
  }

  const dayKeys = Object.keys(s.days);
  const allAmounts = dayKeys.map((k) => s.days[k].amount);
  const totalWater = allAmounts.reduce((a, b) => a + b, 0);
  const avgWater = allAmounts.length ? Math.round(totalWater / allAmounts.length) : 0;
  let weekHits = 0;
  for (let i = 0; i < 7; i++) if (wasGoalHit(getPastDateStr(i))) weekHits++;
  let totalGlasses = 0;
  dayKeys.forEach((k) => { const acts = s.days[k].actions; if (acts) totalGlasses += acts.length; });
  const currentActive = (s.lastCompletedDate === todayStr() || s.lastCompletedDate === getPastDateStr(1)) ? s.streak : 0;

  const stats = [
    { label: 'Total Intake', val: (totalWater / 1000).toFixed(1), unit: 'L' },
    { label: 'Daily Avg', val: avgWater, unit: 'ml' },
    { label: 'This Week', val: Math.round((weekHits / 7) * 100), unit: '%' },
    { label: 'Total Glasses', val: totalGlasses, unit: 'cups' },
    { label: 'Longest Streak', val: s.longestStreak, unit: 'days' },
    { label: 'Current Streak', val: currentActive, unit: 'days' },
  ];

  return (
    <Screen>
      <View style={styles.head}>
        <Pressable style={styles.calBtn} onPress={() => setCalOpen(true)}><CalendarIcon size={18} color={C.cyan} /></Pressable>
        <DropIcon size={22} color={C.purple} style={{ opacity: 0.85, marginBottom: 10 }} />
        <Text style={styles.h1}>Your Orbit</Text>
      </View>

      <View style={styles.chartWrap}>
        <View style={styles.chartBars}>
          {days.map((day, i) => {
            const pct = Math.min(100, (day.amount / (maxVal * 1.1)) * 100);
            return (
              <View key={i} style={styles.chartCol}>
                <View style={styles.chartTrack}>
                  {day.hit ? (
                    <LinearGradient colors={['#00E5FF', '#7C3AED']} style={[styles.chartFill, { height: `${pct}%` }]} />
                  ) : (
                    <View style={[styles.chartFill, { height: `${pct}%`, backgroundColor: 'rgba(168,85,247,0.3)' }]} />
                  )}
                </View>
                <Text style={[styles.chartLabel, day.hit && { color: C.cyan }]}>{day.label}</Text>
              </View>
            );
          })}
        </View>
      </View>

      <View style={styles.statGrid}>
        {stats.map((st, i) => (
          <View key={i} style={styles.statCard}>
            <Text style={styles.statLabel}>{st.label}</Text>
            <Text style={styles.statVal}>{st.val} <Text style={styles.statUnit}>{st.unit}</Text></Text>
          </View>
        ))}
      </View>

      <View style={styles.achSection}>
        <Text style={styles.achSectionTitle}>Achievements</Text>
        {ach.list.map((a) => <AchRow key={a.id} a={a} pop={ach.newlyUnlocked.includes(a.id)} />)}
      </View>

      <CalendarModal visible={calOpen} onClose={() => setCalOpen(false)} wasGoalHit={wasGoalHit} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { paddingTop: 38, paddingHorizontal: 24, paddingBottom: 22, alignItems: 'center' },
  calBtn: { position: 'absolute', top: 34, right: 22, width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: C.glassBorder, alignItems: 'center', justifyContent: 'center' },
  h1: { fontFamily: FONT.playfairItalic, fontSize: 23, color: 'rgba(255,255,255,0.9)' },

  chartWrap: { paddingHorizontal: 24, marginBottom: 30 },
  chartBars: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 150, paddingTop: 14, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: C.glassBorder },
  chartCol: { alignItems: 'center', gap: 8, width: '13%' },
  chartTrack: { width: '100%', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 20, height: 120, justifyContent: 'flex-end', overflow: 'hidden' },
  chartFill: { width: '100%', borderRadius: 20 },
  chartLabel: { fontSize: 10, fontFamily: FONT.bodyMed, color: C.textDim },

  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, paddingHorizontal: 24, marginBottom: 34 },
  statCard: { width: '46%', flexGrow: 1, backgroundColor: 'rgba(255,255,255,0.02)', borderWidth: 1, borderColor: C.glassBorder, borderRadius: 18, padding: 16, alignItems: 'center' },
  statLabel: { fontSize: 9, letterSpacing: 1.4, textTransform: 'uppercase', color: C.textDim, marginBottom: 6 },
  statVal: { fontFamily: FONT.playfair, fontSize: 21, color: 'rgba(255,255,255,0.92)' },
  statUnit: { fontSize: 11, color: C.textDim, fontFamily: FONT.body },

  achSection: { paddingHorizontal: 24, paddingBottom: 30 },
  achSectionTitle: { fontSize: 10.5, letterSpacing: 1.8, textTransform: 'uppercase', color: C.textDim, marginBottom: 14 },
  achRow: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: 18, borderWidth: 1, borderColor: C.glassBorder, backgroundColor: 'rgba(255,255,255,0.01)', marginBottom: 11 },
  achRowEarned: { backgroundColor: 'rgba(56,189,248,0.06)', borderColor: 'rgba(56,189,248,0.22)' },
  achIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.05)' },
  achIconEarned: { backgroundColor: C.cyan },
  achTitle: { fontSize: 13.5, fontFamily: FONT.bodyMed, color: C.textDim },
  achTitleEarned: { color: 'rgba(255,255,255,0.92)' },
  achDesc: { fontSize: 10.5, color: C.textDim, marginTop: 3 },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', alignItems: 'center', justifyContent: 'center', padding: 22 },
  calCard: { width: '100%', maxWidth: 340, backgroundColor: '#101620', borderWidth: 1, borderColor: C.glassBorder, borderRadius: 24, paddingHorizontal: 20, paddingTop: 22, paddingBottom: 24 },
  calHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  calNav: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' },
  calNavTxt: { color: C.textMain, fontSize: 20 },
  calTitle: { fontFamily: FONT.playfairItalic, fontSize: 16, color: 'rgba(255,255,255,0.92)' },
  calWeekdays: { flexDirection: 'row', marginBottom: 6 },
  calWeekday: { flex: 1, textAlign: 'center', fontSize: 9, letterSpacing: 0.8, textTransform: 'uppercase', color: C.textDim },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calDayWrap: { width: `${100 / 7}%`, aspectRatio: 1, padding: 2.5 },
  calDay: { flex: 1, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  calDayIdle: { backgroundColor: 'rgba(255,255,255,0.02)' },
  calToday: { borderWidth: 1, borderColor: C.cyan },
  calDayTxt: { fontSize: 11.5, color: C.textDim },
  calDayHitTxt: { fontSize: 11.5, color: '#fff', fontFamily: FONT.bodySemi },
  calClose: { marginTop: 18, paddingVertical: 12, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: C.glassBorder, alignItems: 'center' },
  calCloseTxt: { fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: C.textDim, fontFamily: FONT.bodySemi },
});
