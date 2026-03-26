import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import Colors from "@/constants/colors";

function SkeletonBox({
  width,
  height,
  borderRadius = 8,
  opacity,
}: {
  width: number | string;
  height: number;
  borderRadius?: number;
  opacity: Animated.SharedValue<number>;
}) {
  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          width: width as number,
          height,
          borderRadius,
          backgroundColor: Colors.light.shimmer,
        },
        animStyle,
      ]}
    />
  );
}

interface SkeletonCardProps {
  width: number;
}

export function SkeletonCard({ width }: SkeletonCardProps) {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.4, { duration: 800 }),
      -1,
      true
    );
  }, []);

  return (
    <View style={[styles.card, { width }]}>
      <View style={styles.imagePlaceholder}>
        <SkeletonBox width="100%" height={width} borderRadius={0} opacity={opacity} />
      </View>
      <View style={styles.info}>
        <SkeletonBox width="80%" height={12} opacity={opacity} />
        <SkeletonBox width="50%" height={10} opacity={opacity} />
        <SkeletonBox width="40%" height={14} opacity={opacity} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 12,
  },
  imagePlaceholder: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: Colors.light.shimmer,
  },
  info: {
    padding: 10,
    gap: 6,
  },
});
