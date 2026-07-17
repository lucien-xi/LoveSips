import React, { useEffect, useRef } from 'react';
import { Animated, ScrollView, StyleSheet } from 'react-native';

// Mirrors the `.screen` container + fadeZoom entry animation.
export default function Screen({ children, contentStyle, scroll = true }) {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    a.setValue(0);
    Animated.timing(a, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);
  const opacity = a;
  const scale = a.interpolate({ inputRange: [0, 1], outputRange: [0.97, 1] });
  return (
    <Animated.View style={[styles.fill, { opacity, transform: [{ scale }] }]}>
      {scroll ? (
        <ScrollView
          style={styles.fill}
          contentContainerStyle={[styles.content, contentStyle]}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        children
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, width: '100%' },
  content: { paddingBottom: 130 },
});
