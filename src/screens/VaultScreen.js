import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Screen from '../components/Screen';
import { C, FONT } from '../theme';
import { useStore } from '../store';
import { HeartIcon, StarIcon } from '../components/icons';
import { todayStr } from '../store';

export default function VaultScreen() {
  const { s, setShopOpen, setShopPanel } = useStore();

  const openShop = () => { setShopPanel('shop'); setShopOpen(true); };

  return (
    <View style={{ flex: 1 }}>
      <Screen contentStyle={{ paddingBottom: 130 }}>
        <View style={styles.head}>
          <HeartIcon size={22} color={C.purple} style={{ opacity: 0.85, marginBottom: 10 }} />
          <Text style={styles.h1}>A Constellation for You</Text>
          <Text style={styles.p}>A new star lights up every time she crosses 25%, 50%, 75%, and 100% of her water goal.</Text>

          <View style={styles.heartsBalance}>
            <Text style={{ fontSize: 14 }}>❤️</Text>
            <Text style={styles.heartsCount}>{s.hearts}</Text>
          </View>
          {s.goldenTickets > 0 && (
            <View style={styles.ticketsBalance}>
              <Text style={{ fontSize: 14 }}>🎫</Text>
              <Text style={styles.ticketsCount}>{s.goldenTickets}</Text>
            </View>
          )}
        </View>

        <View style={styles.list}>
          {s.vault.length === 0 ? (
            <Text style={styles.empty}>Her constellation is still dark.{'\n'}The first star lights up at 25% of her goal.</Text>
          ) : (
            s.vault.map((entry, i) => {
              const isToday = entry.date === todayStr();
              const dateLabel = isToday
                ? 'Today'
                : new Date(entry.date + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
              return (
                <LinearGradient
                  key={i}
                  colors={['rgba(168,85,247,0.10)', 'rgba(56,189,248,0.05)']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={styles.card}
                >
                  <View style={styles.cardRow}>
                    <StarIcon size={15} color="#00E5FF" style={{ marginTop: 2 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.tag}>{dateLabel} · {entry.milestone}%</Text>
                      <Text style={styles.note}>"{entry.note}"</Text>
                    </View>
                  </View>
                </LinearGradient>
              );
            })
          )}
        </View>
      </Screen>

      <Pressable style={styles.floatBtn} onPress={openShop}>
        <LinearGradient colors={['#A855F7', '#EC4899']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.floatBtnGrad}>
          <Text style={{ fontSize: 22 }}>🛍️</Text>
        </LinearGradient>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  head: { paddingTop: 38, paddingHorizontal: 24, paddingBottom: 22, alignItems: 'center' },
  h1: { fontFamily: FONT.playfairItalic, fontSize: 23, color: 'rgba(255,255,255,0.9)', textAlign: 'center' },
  p: { fontSize: 11, color: C.textDim, marginTop: 8, lineHeight: 18, letterSpacing: 0.2, maxWidth: 280, textAlign: 'center' },
  heartsBalance: { position: 'absolute', top: 34, right: 22, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(236,72,153,0.12)', borderWidth: 1, borderColor: 'rgba(236,72,153,0.3)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  heartsCount: { fontFamily: FONT.bodyBold, fontSize: 14, color: C.pink },
  ticketsBalance: { position: 'absolute', top: 34, left: 22, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(251,191,36,0.12)', borderWidth: 1, borderColor: 'rgba(251,191,36,0.35)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  ticketsCount: { fontFamily: FONT.bodyBold, fontSize: 14, color: C.gold },
  list: { paddingHorizontal: 22, paddingBottom: 10, gap: 13 },
  card: { borderRadius: 18, padding: 18, borderWidth: 1, borderColor: 'rgba(168,85,247,0.3)', overflow: 'hidden' },
  cardRow: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  tag: { fontSize: 9, letterSpacing: 1.6, textTransform: 'uppercase', color: C.purple, fontFamily: FONT.bodySemi, marginBottom: 6 },
  note: { fontFamily: FONT.playfairItalic, fontSize: 14.5, lineHeight: 22, color: 'rgba(255,255,255,0.95)' },
  empty: { textAlign: 'center', color: C.textDim, fontSize: 12.5, paddingVertical: 50, paddingHorizontal: 30, lineHeight: 21, fontFamily: FONT.body },
  floatBtn: { position: 'absolute', bottom: 102, right: 22, zIndex: 45, width: 52, height: 52, borderRadius: 26, shadowColor: '#A855F7', shadowOpacity: 0.45, shadowRadius: 24, shadowOffset: { width: 0, height: 8 } },
  floatBtnGrad: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
});
