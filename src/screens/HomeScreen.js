import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions, Easing, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Rect, Defs, ClipPath, LinearGradient as SvgGrad, RadialGradient, Stop, Line, G, Circle } from 'react-native-svg';
import Screen from '../components/Screen';
import { C, FONT } from '../theme';
import { useStore } from '../store';

const { width: W } = Dimensions.get('window');
const GLASS = Math.min(W * 0.58, 230);
const TOP_Y = 30, BOTTOM_Y = 190, HEIGHT = BOTTOM_Y - TOP_Y;

export default function HomeScreen() {
  const { s, readToday, greetingText, addWater, undo, resetToday } = useStore();
  const d = readToday();
  const pct = Math.min(100, Math.round((d.amount / s.goal) * 100));
  const frac = Math.min(d.amount, s.goal) / s.goal;

  const level = useRef(new Animated.Value(frac)).current;
  const [y, setY] = useState(BOTTOM_Y - frac * HEIGHT);

  useEffect(() => {
    const id = level.addListener(({ value }) => setY(BOTTOM_Y - value * HEIGHT));
    return () => level.removeListener(id);
  }, []);
  useEffect(() => {
    Animated.timing(level, {
      toValue: frac, duration: 800, easing: Easing.bezier(0.3, 1, 0.4, 1), useNativeDriver: false,
    }).start();
  }, [frac]);

  const fillH = BOTTOM_Y - y;
  const waveD = `M 55 ${y} Q 70 ${y - 3} 85 ${y} T 115 ${y} T 145 ${y} L 145 ${y + 15} L 55 ${y + 15} Z`;
  const lit = s.streak > 0;

  return (
    <Screen contentStyle={styles.content}>
      {/* header card */}
      <LinearGradient
        colors={['rgba(168,85,247,0.10)', 'rgba(56,189,248,0.03)']}
        start={{ x: 0.15, y: 0 }} end={{ x: 0.85, y: 1 }}
        style={styles.headerCard}
      >
        <View style={styles.headerGlow} pointerEvents="none">
          {/* radial-gradient(circle, rgba(168,85,247,0.22), transparent 65%) */}
          <Svg width={200} height={200}>
            <Defs>
              <RadialGradient id="headerGlowGrad" cx="50%" cy="50%" r="50%">
                <Stop offset="0%" stopColor="#A855F7" stopOpacity={0.22} />
                <Stop offset="65%" stopColor="#A855F7" stopOpacity={0} />
              </RadialGradient>
            </Defs>
            <Circle cx={100} cy={100} r={100} fill="url(#headerGlowGrad)" />
          </Svg>
        </View>
        <View style={styles.headerTop}>
          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>{greetingText()}</Text>
            <Text style={styles.title}>Your{'\n'}Water Reminder</Text>
            <Text style={styles.sub}>Made with love, just for <Text style={{ color: C.purple }}>you</Text> 💧</Text>
          </View>
          <LinearGradient
            colors={lit ? ['#00E5FF', '#7C3AED'] : ['#312E81', '#1E1B4B']}
            start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }}
            style={[styles.streakBadge, lit && styles.streakBadgeLit]}
          >
            <Text style={styles.streakIcon}>{lit ? '🔥' : '💧'}</Text>
            <Text style={styles.streakCount}>{s.streak}</Text>
            <Text style={styles.streakUnit}>day streak</Text>
          </LinearGradient>
        </View>
      </LinearGradient>

      {/* glass */}
      <View style={[styles.glassWrap, { width: GLASS, height: GLASS }]}>
        <Svg viewBox="0 0 200 200" width={GLASS} height={GLASS}>
          <Defs>
            <ClipPath id="glassClip">
              <Path d="M 55 30 L 145 30 L 132 178 Q 130 190 118 190 L 82 190 Q 70 190 68 178 Z" />
            </ClipPath>
            <SvgGrad id="galaxyGrad" x1="0" y1="1" x2="0" y2="0">
              <Stop offset="0%" stopColor="#312E81" />
              <Stop offset="40%" stopColor="#7C3AED" />
              <Stop offset="80%" stopColor="#0EA5E9" />
              <Stop offset="100%" stopColor="#00E5FF" />
            </SvgGrad>
          </Defs>
          <Path
            d="M 55 30 L 145 30 L 132 178 Q 130 190 118 190 L 82 190 Q 70 190 68 178 Z"
            fill="rgba(255,255,255,0.01)" stroke="rgba(255,255,255,0.12)" strokeWidth={2}
          />
          <G clipPath="url(#glassClip)">
            <Rect x={55} y={y} width={90} height={fillH + 14} fill="url(#galaxyGrad)" />
            <Path d={waveD} fill="url(#galaxyGrad)" opacity={0.85} />
          </G>
          <Line x1="57" y1="30" x2="143" y2="30" stroke="rgba(255,255,255,0.25)" strokeWidth={2} strokeLinecap="round" />
          <Line x1="60" y1="34" x2="140" y2="34" stroke="rgba(255,255,255,0.05)" strokeWidth={1} strokeLinecap="round" />
        </Svg>
        <View style={styles.pctWrap} pointerEvents="none">
          <Text style={styles.pctNum}>{pct}<Text style={styles.pctPct}>%</Text></Text>
          <Text style={styles.mlLabel}>{d.amount} / {s.goal} ML</Text>
        </View>
      </View>

      {/* quick add */}
      <View style={styles.quickRow}>
        {[100, 250, 500].map((amt) => (
          <Pressable key={amt} style={({ pressed }) => [styles.glassBtn, pressed && styles.glassBtnActive]} onPress={() => addWater(amt)}>
            <Text style={styles.glassBtnAmt}>+{amt}</Text>
            <Text style={styles.glassBtnUnit}>ml</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.utilRow}>
        <Pressable onPress={undo}><Text style={styles.utilText}>↺ Undo</Text></Pressable>
        <Text style={styles.utilSep}>|</Text>
        <Pressable onPress={resetToday}><Text style={styles.utilText}>✕ Reset</Text></Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 130 },
  headerCard: { borderRadius: 26, borderWidth: 1, borderColor: C.glassBorder, paddingHorizontal: 20, paddingTop: 22, paddingBottom: 18, overflow: 'hidden' },
  headerGlow: { position: 'absolute', top: -90, right: -30, width: 200, height: 200 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 14 },
  headerText: { flex: 1, minWidth: 0 },
  eyebrow: { fontFamily: FONT.body, fontSize: 13, color: C.cyan, opacity: 0.95 },
  title: { fontFamily: FONT.playfair, fontSize: 27, lineHeight: 31, color: C.textMain, marginTop: 7 },
  sub: { marginTop: 9, fontFamily: FONT.playfairItalic, fontSize: 13, color: C.textDim },
  streakBadge: { width: 74, borderRadius: 20, paddingHorizontal: 6, paddingTop: 13, paddingBottom: 11, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(168,85,247,0.25)' },
  streakBadgeLit: { borderColor: 'rgba(0,229,255,0.4)' },
  streakIcon: { fontSize: 20, lineHeight: 22 },
  streakCount: { fontFamily: FONT.playfairBold, fontSize: 24, color: '#fff', marginTop: 4 },
  streakUnit: { fontSize: 9, letterSpacing: 0.7, textTransform: 'uppercase', color: 'rgba(255,255,255,0.85)', marginTop: 3, textAlign: 'center' },

  glassWrap: { alignSelf: 'center', marginTop: 22 },
  pctWrap: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  pctNum: { fontFamily: FONT.playfair, fontSize: 46, color: '#fff', textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 10, textShadowOffset: { width: 0, height: 2 } },
  pctPct: { fontFamily: FONT.body, fontSize: 19, opacity: 0.6 },
  mlLabel: { fontSize: 11, color: C.textDim, letterSpacing: 1.6, marginTop: 8, fontFamily: FONT.bodyMed },

  quickRow: { flexDirection: 'row', gap: 10, justifyContent: 'center', width: '100%', marginTop: 28 },
  glassBtn: { flex: 1, maxWidth: 100, paddingVertical: 14, paddingHorizontal: 8, borderRadius: 18, alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: C.glassBorder },
  glassBtnActive: { backgroundColor: 'rgba(255,255,255,0.08)', borderColor: C.glassHighlight, transform: [{ scale: 0.94 }] },
  glassBtnAmt: { fontFamily: FONT.bodySemi, fontSize: 17, color: C.textMain },
  glassBtnUnit: { fontSize: 9, letterSpacing: 1.8, textTransform: 'uppercase', color: C.purple },

  utilRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 22, marginTop: 18 },
  utilText: { fontSize: 11, letterSpacing: 0.9, textTransform: 'uppercase', color: C.textDim, fontFamily: FONT.bodyMed },
  utilSep: { color: C.textDim, opacity: 0.3 },
});
