import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { C } from '../theme';
import { NavHome, NavHeart, NavBars, NavGear } from './icons';
import { useStore } from '../store';

const ITEMS = [
  { key: 'home', Icon: NavHome },
  { key: 'vault', Icon: NavHeart },
  { key: 'orbit', Icon: NavBars },
  { key: 'settings', Icon: NavGear },
];

export default function BottomNav({ current, onNavigate }) {
  const { vaultBadge } = useStore();
  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <LinearGradient
        colors={['rgba(0,229,255,0.6)', 'rgba(124,58,237,0.3)', 'rgba(168,85,247,0.6)']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        style={styles.pill}
      >
        <View style={styles.inner}>
          {ITEMS.map(({ key, Icon }) => {
            const active = current === key;
            const color = active ? C.cyan : 'rgba(255,255,255,0.55)';
            return (
              <Pressable key={key} style={styles.btn} onPress={() => onNavigate(key)} hitSlop={6}>
                <Icon color={color} />
                {active && <View style={styles.underline} />}
                {key === 'vault' && vaultBadge && <View style={styles.badge} />}
              </Pressable>
            );
          })}
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', bottom: 22, left: 0, right: 0, paddingHorizontal: 22, alignItems: 'center' },
  pill: {
    maxWidth: 340, width: '100%', padding: 1.5, borderRadius: 40,
    shadowColor: '#000', shadowOpacity: 0.7, shadowRadius: 40, shadowOffset: { width: 0, height: 15 },
  },
  inner: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 13, paddingHorizontal: 30, backgroundColor: 'rgba(8,8,12,0.95)', borderRadius: 40,
  },
  btn: { position: 'relative', alignItems: 'center', justifyContent: 'center', width: 46, height: 42 },
  underline: {
    position: 'absolute', bottom: -1, width: 24, height: 3, borderRadius: 2, backgroundColor: C.cyan,
    shadowColor: C.cyan, shadowOpacity: 1, shadowRadius: 6,
  },
  badge: {
    position: 'absolute', top: 0, right: 6, width: 9, height: 9, backgroundColor: C.purple, borderRadius: 5,
    borderWidth: 2, borderColor: '#08080C',
  },
});
