import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Alert,
  Dimensions,
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";

const { width } = Dimensions.get("window");
const DOMAIN = process.env.EXPO_PUBLIC_DOMAIN;

function getImageUrl(url?: string) {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  return `https://${DOMAIN}${url}`;
}

interface Product {
  id: string;
  title?: string;
  name?: string;
  description?: string;
  price: number | string;
  status: string;
  images?: string[];
  imageUrls?: string[];
  location?: string;
  condition?: string;
  shop?: {
    id: string;
    name: string;
    description?: string;
    userId: string;
  };
  category?: { id: number; name: string };
  createdAt?: string;
}

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { user, token } = useAuth();
  const [currentImage, setCurrentImage] = useState(0);
  const [messageSending, setMessageSending] = useState(false);

  const { data: product, isLoading } = useQuery<Product>({
    queryKey: ["product", id],
    queryFn: async () => {
      const res = await fetch(`https://${DOMAIN}/api/products/${id}`);
      if (!res.ok) throw new Error("Product not found");
      return res.json();
    },
  });

  const price = product
    ? typeof product.price === "number"
      ? product.price
      : parseFloat(product.price)
    : 0;

  const allImages = product?.images ?? product?.imageUrls ?? [];
  const images = allImages.map(getImageUrl).filter(Boolean) as string[];
  const displayName = product?.title ?? product?.name ?? "";

  const handleMessage = async () => {
    if (!user) {
      router.push("/auth/login");
      return;
    }
    if (!product?.shop) return;
    setMessageSending(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const res = await fetch(
        `https://${DOMAIN}/api/messages/conversations`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            productId: product.id,
            sellerId: product.shop.userId,
          }),
        }
      );
      if (!res.ok) throw new Error("Failed");
      const conv = await res.json();
      router.push({ pathname: "/chat/[id]", params: { id: String(conv.id ?? conv.conversationId) } });
    } catch {
      Alert.alert("Error", "Could not start conversation. Please try again.");
    } finally {
      setMessageSending(false);
    }
  };

  const handleOrder = () => {
    if (!user) {
      router.push("/auth/login");
      return;
    }
    router.push({
      pathname: "/checkout",
      params: { productId: String(product?.id), productName: displayName, price: String(product?.price) },
    });
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.imageSkeleton} />
        <View style={styles.infoSkeleton}>
          <View style={styles.skeletonLine} />
          <View style={[styles.skeletonLine, { width: "60%" }]} />
          <View style={[styles.skeletonLine, { width: "40%" }]} />
        </View>
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.errorContainer}>
        <Feather name="alert-circle" size={48} color={Colors.light.textTertiary} />
        <Text style={styles.errorText}>Product not found</Text>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const isOwnShop = user && product.shop && product.shop.userId === user?.id as any;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 120,
        }}
      >
        {images.length > 0 ? (
          <View>
            <FlatList
              data={images}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              keyExtractor={(_, i) => String(i)}
              onMomentumScrollEnd={(e) => {
                const idx = Math.round(e.nativeEvent.contentOffset.x / width);
                setCurrentImage(idx);
              }}
              renderItem={({ item }) => (
                <Image
                  source={{ uri: item }}
                  style={[styles.productImage, { width }]}
                  contentFit="cover"
                />
              )}
            />
            {images.length > 1 && (
              <View style={styles.imageDots}>
                {images.map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.dot,
                      i === currentImage && styles.dotActive,
                    ]}
                  />
                ))}
              </View>
            )}
          </View>
        ) : (
          <View style={styles.noImage}>
            <Feather name="image" size={48} color={Colors.light.textTertiary} />
          </View>
        )}

        <View style={styles.details}>
          <View style={styles.titleRow}>
            <Text style={styles.productName}>{displayName}</Text>
            <Text style={styles.productPrice}>${price.toFixed(2)}</Text>
          </View>

          {product.category && (
            <View style={styles.categoryPill}>
              <Text style={styles.categoryText}>{product.category.name}</Text>
            </View>
          )}

          {product.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.description}>{product.description}</Text>
            </View>
          )}

          {product.shop && (
            <View style={styles.shopCard}>
              <View style={styles.shopAvatar}>
                <Text style={styles.shopAvatarText}>
                  {(product.shop.name ?? "S")[0].toUpperCase()}
                </Text>
              </View>
              <View style={styles.shopInfo}>
                <Text style={styles.shopLabel}>Sold by</Text>
                <Text style={styles.shopName}>{product.shop.name}</Text>
                {product.shop.description ? (
                  <Text style={styles.shopDesc} numberOfLines={2}>
                    {product.shop.description}
                  </Text>
                ) : null}
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {!isOwnShop && (
        <View
          style={[
            styles.ctaBar,
            { paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 8 },
          ]}
        >
          <Pressable
            style={styles.messageBtn}
            onPress={handleMessage}
            disabled={messageSending}
          >
            <Feather name="message-circle" size={18} color={Colors.light.primary} />
            <Text style={styles.messageBtnText}>
              {messageSending ? "Opening…" : "Message"}
            </Text>
          </Pressable>
          <Pressable style={styles.orderBtn} onPress={handleOrder}>
            <Text style={styles.orderBtnText}>Buy Now — ${price.toFixed(2)}</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scroll: {
    flex: 1,
  },
  productImage: {
    height: 320,
    backgroundColor: Colors.light.separator,
  },
  noImage: {
    height: 280,
    backgroundColor: Colors.light.separator,
    alignItems: "center",
    justifyContent: "center",
  },
  imageDots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.light.border,
  },
  dotActive: {
    backgroundColor: Colors.light.primary,
    width: 18,
  },
  details: {
    padding: 20,
    gap: 16,
  },
  titleRow: {
    gap: 6,
  },
  productName: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: Colors.light.text,
    lineHeight: 30,
    letterSpacing: -0.5,
  },
  productPrice: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    color: Colors.light.price,
  },
  categoryPill: {
    alignSelf: "flex-start",
    backgroundColor: Colors.light.chip,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  categoryText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: Colors.light.chipText,
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.textTertiary,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  description: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
    lineHeight: 23,
  },
  shopCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  shopAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: Colors.light.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  shopAvatarText: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
  shopInfo: {
    flex: 1,
    gap: 2,
  },
  shopLabel: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textTertiary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  shopName: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.text,
  },
  shopDesc: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
  },
  ctaBar: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 12,
    backgroundColor: Colors.light.card,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  messageBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: Colors.light.chip,
    borderWidth: 1.5,
    borderColor: Colors.light.primary,
  },
  messageBtnText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.primary,
  },
  orderBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: Colors.light.primary,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  orderBtnText: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  imageSkeleton: {
    height: 320,
    backgroundColor: Colors.light.shimmer,
  },
  infoSkeleton: {
    padding: 20,
    gap: 12,
  },
  skeletonLine: {
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.light.shimmer,
    width: "100%",
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  errorText: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
  },
  backBtn: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  backBtnText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
  },
});
