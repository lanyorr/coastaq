import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import Colors from "@/constants/colors";

export interface Product {
  id: string | number;
  title?: string;
  name?: string;
  price: string | number;
  images?: string[];
  imageUrls?: string[];
  location?: string;
  shop?: { name: string };
  category?: { name: string };
}

interface ProductCardProps {
  product: Product;
  width: number;
}

const DOMAIN = process.env.EXPO_PUBLIC_DOMAIN;

function getImageUrl(url?: string) {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  return `https://${DOMAIN}${url}`;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function ProductCard({ product, width }: ProductCardProps) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const allImages = product.images ?? product.imageUrls ?? [];
  const imageUrl = getImageUrl(allImages[0]);
  const displayName = product.title ?? product.name ?? "";
  const price =
    typeof product.price === "number"
      ? product.price
      : parseFloat(String(product.price));

  return (
    <AnimatedPressable
      style={[styles.card, { width }, animStyle]}
      onPressIn={() => {
        scale.value = withSpring(0.96);
      }}
      onPressOut={() => {
        scale.value = withSpring(1);
      }}
      onPress={() =>
        router.push({ pathname: "/product/[id]", params: { id: String(product.id) } })
      }
    >
      <View style={styles.imageContainer}>
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={styles.image}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Feather name="image" size={28} color={Colors.light.textTertiary} />
          </View>
        )}
      </View>
      <View style={styles.info}>
        {displayName ? (
          <Text style={styles.name} numberOfLines={2}>
            {displayName}
          </Text>
        ) : null}
        {product.shop?.name ? (
          <Text style={styles.shop} numberOfLines={1}>
            {product.shop.name}
          </Text>
        ) : null}
        {product.location ? (
          <Text style={styles.location} numberOfLines={1}>
            {product.location}
          </Text>
        ) : null}
        <Text style={styles.price}>${price.toFixed(2)}</Text>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 12,
  },
  imageContainer: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: Colors.light.separator,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imagePlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.light.separator,
  },
  info: {
    padding: 10,
    gap: 3,
  },
  name: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: Colors.light.text,
    lineHeight: 18,
  },
  shop: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textTertiary,
  },
  location: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textTertiary,
  },
  price: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: Colors.light.price,
    marginTop: 2,
  },
});
