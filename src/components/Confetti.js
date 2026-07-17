import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, Easing, StyleSheet, View } from 'react-native';

const { width: W, height: H } = Dimensions.get('window');
const COLORS = ['#00E5FF', '#A855F7', '#7C3AED', '#F8F9FA'];
const COUNT = 46;

function Piece({ left, size, color, radius, duration, delay, rotateEnd }) {
  const p = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(p, { toValue: 1, duration, delay, easing: Easing.in(Easing.ease), useNativeDriver: true }).start();
  }, []);
  const translateY = p.interpolate({ inputRange: [0, 1], outputRange: [-20, H + 20] });
  const rotate = p.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${rotateEnd}deg`] });
  const opacity = p.interpolate({ inputRange: [0, 0.85, 1], outputRange: [1, 1, 0] });
  return (
    <Animated.View
      style={{ position: 'absolute', top: 0, left, width: size, height: size * 1.4, backgroundColor: color, borderRadius: radius, opacity, transform: [{ translateY }, { rotate }] }}
    />
  );
}

// Mounted fresh (via key) each time confetti should fire.
export default function Confetti() {
  const pieces = useRef(
    Array.from({ length: COUNT }, () => {
      const size = 6 + Math.random() * 6;
      return {
        left: Math.random() * W,
        size,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        radius: Math.random() > 0.5 ? size : 2,
        duration: 2200 + Math.random() * 1400,
        delay: Math.random() * 300,
        rotateEnd: 360 + Math.random() * 360,
      };
    })
  ).current;
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { zIndex: 120 }]}>
      {pieces.map((p, i) => <Piece key={i} {...p} />)}
    </View>
  );
}
