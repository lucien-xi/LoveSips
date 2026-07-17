import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import {
  PlayfairDisplay_600SemiBold,
  PlayfairDisplay_500Medium_Italic,
  PlayfairDisplay_700Bold,
} from '@expo-google-fonts/playfair-display';
import {
  Outfit_300Light,
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
  Outfit_700Bold,
} from '@expo-google-fonts/outfit';

import { C } from './src/theme';
import { StoreProvider, useStore } from './src/store';
import { haptic } from './src/haptics';
import Nebula from './src/components/Nebula';
import BottomNav from './src/components/BottomNav';
import Overlays from './src/components/Overlays';
import ShopSheet from './src/components/ShopSheet';
import HomeScreen from './src/screens/HomeScreen';
import VaultScreen from './src/screens/VaultScreen';
import OrbitScreen from './src/screens/OrbitScreen';
import SettingsScreen from './src/screens/SettingsScreen';

function Root() {
  const { ready, navRef, setVaultBadge, s } = useStore();
  const [screen, setScreen] = useState('home');

  const goToScreen = (name) => {
    setScreen(name);
    if (name === 'vault') setVaultBadge(false);
  };
  navRef.current = goToScreen;

  // in-app reminder timer (ported from scheduleReminders — vibrates while below goal)
  useEffect(() => {
    if (!ready || !s.remindersOn) return;
    const id = setInterval(() => {
      const now = new Date();
      const key = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const d = s.days[key];
      if (d && d.amount >= s.goal) return;
      haptic('medium');
    }, s.interval * 60 * 1000);
    return () => clearInterval(id);
  }, [ready, s.remindersOn, s.interval, s.goal]);

  if (!ready) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={C.cyan} />
      </View>
    );
  }

  return (
    <View style={styles.app}>
      <Nebula />
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.screenHost}>
          {screen === 'home' && <HomeScreen />}
          {screen === 'vault' && <VaultScreen />}
          {screen === 'orbit' && <OrbitScreen />}
          {screen === 'settings' && <SettingsScreen />}
        </View>
      </SafeAreaView>
      <BottomNav current={screen} onNavigate={goToScreen} />
      <ShopSheet />
      <Overlays />
      <StatusBar style="light" />
    </View>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    PlayfairDisplay_600SemiBold,
    PlayfairDisplay_500Medium_Italic,
    PlayfairDisplay_700Bold,
    Outfit_300Light,
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={C.cyan} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StoreProvider>
        <Root />
      </StoreProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  app: { flex: 1, backgroundColor: C.spaceBg },
  safe: { flex: 1, width: '100%', maxWidth: 480, alignSelf: 'center' },
  screenHost: { flex: 1 },
  loading: { flex: 1, backgroundColor: C.spaceBg, alignItems: 'center', justifyContent: 'center' },
});
