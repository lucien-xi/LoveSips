import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, View } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Circle } from 'react-native-svg';

const { width: W, height: H } = Dimensions.get('window');

// Approximates the three floating blurred nebula gradients from the CSS.
function Blob({ id, size, color, opacity, style, dx, dy, duration }) {
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(t, { toValue: 1, duration, useNativeDriver: true }),
        Animated.timing(t, { toValue: 0, duration, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);
  const translateX = t.interpolate({ inputRange: [0, 1], outputRange: [0, dx] });
  const translateY = t.interpolate({ inputRange: [0, 1], outputRange: [0, dy] });
  const scale = t.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.1, 0.95] });
  return (
    <Animated.View pointerEvents="none" style={[styles.blob, style, { width: size, height: size, transform: [{ translateX }, { translateY }, { scale }] }]}>
      <Svg width={size} height={size}>
        <Defs>
          <RadialGradient id={id} cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={color} stopOpacity={opacity} />
            <Stop offset="70%" stopColor={color} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx={size / 2} cy={size / 2} r={size / 2} fill={`url(#${id})`} />
      </Svg>
    </Animated.View>
  );
}

export default function Nebula() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Blob id="neb1" size={W * 0.9} color="#38BDF8" opacity={0.15} dx={30} dy={-50} duration={10000} style={{ top: -H * 0.08, left: -W * 0.15 }} />
      <Blob id="neb2" size={W * 1.05} color="#A855F7" opacity={0.12} dx={-25} dy={25} duration={12500} style={{ bottom: -H * 0.08, right: -W * 0.15 }} />
      <Blob id="neb3" size={W * 0.7} color="#EC4899" opacity={0.08} dx={30} dy={-40} duration={9000} style={{ top: H * 0.35, left: W * 0.25 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  blob: { position: 'absolute', borderRadius: 9999 },
});
