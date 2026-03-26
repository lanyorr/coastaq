import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";

const DOMAIN = process.env.EXPO_PUBLIC_DOMAIN;

interface Product {
  id: string;
  title?: string;
  name?: string;
  price: number | string;
  status: string;
  images?: string[];
  imageUrls?: string[];
}

interface Order {
  id: number;
  totalAmount: string;
  status: string;
  createdAt: string;
  buyer?: { name: string };
  items?: { product: { name: string } }[];
}

interface Shop {
  id: number;
  name: string;
  description?: string;
  isApproved: boolean;
}

type Tab = "overview" | "products" | "orders";

function getImageUrl(url?: string) {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  return `https://${DOMAIN}${url}`;
}

function StatusBadge({ status }: { status: string }) {
  const color =
    status === "ACTIVE" || status === "COMPLETED" || status === "APPROVED"
      ? Colors.light.success
      : status === "PENDING"
      ? Colors.light.warning
      : Colors.light.textTertiary;

  return (
    <View style={[styles.badge, { backgroundColor: color + "20" }]}>
      <Text style={[styles.badgeText, { color }]}>{status}</Text>
    </View>
  );
}

export default function SellerDashboardScreen() {
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const [tab, setTab] = useState<Tab>("overview");

  const { data: shop, isLoading: shopLoading } = useQuery<Shop>({
    queryKey: ["my-shop"],
    enabled: !!token,
    queryFn: async () => {
      const res = await fetch(`https://${DOMAIN}/api/shops/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return null;
      return res.json();
    },
  });

  const { data: products = [], refetch: refetchProducts, isRefetching: isRefetchingProducts } = useQuery<Product[]>({
    queryKey: ["seller-products"],
    enabled: !!token,
    queryFn: async () => {
      const res = await fetch(`https://${DOMAIN}/api/products?limit=50&shopId=${shop?.id ?? ""}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const d = await res.json();
      return d.products ?? [];
    },
  });

  const { data: orders = [], refetch: refetchOrders, isRefetching: isRefetchingOrders } = useQuery<Order[]>({
    queryKey: ["seller-orders"],
    enabled: !!token,
    queryFn: async () => {
      const res = await fetch(`https://${DOMAIN}/api/orders/seller`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return [];
      return res.json();
    },
  });

  const totalRevenue = orders
    .filter((o) => o.status === "COMPLETED")
    .reduce((sum, o) => sum + parseFloat(o.totalAmount ?? "0"), 0);

  const topPadding = Platform.OS === "web" ? 67 : insets.top;

  const renderOverview = () => (
    <ScrollView
      style={styles.tabContent}
      contentContainerStyle={{ paddingBottom: Platform.OS === "web" ? 100 : 100 }}
      showsVerticalScrollIndicator={false}
    >
      {shop && (
        <View style={styles.shopCard}>
          <View style={styles.shopAvatar}>
            <Text style={styles.shopAvatarText}>{shop.name[0].toUpperCase()}</Text>
          </View>
          <View style={styles.shopInfo}>
            <Text style={styles.shopName}>{shop.name}</Text>
            {shop.description ? (
              <Text style={styles.shopDesc} numberOfLines={2}>
                {shop.description}
              </Text>
            ) : null}
            <StatusBadge status={shop.isApproved ? "APPROVED" : "PENDING"} />
          </View>
        </View>
      )}

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{products.length}</Text>
          <Text style={styles.statLabel}>Products</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{orders.length}</Text>
          <Text style={styles.statLabel}>Orders</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>${totalRevenue.toFixed(0)}</Text>
          <Text style={styles.statLabel}>Revenue</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>
            {orders.filter((o) => o.status === "PENDING").length}
          </Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
      </View>

      {!shop?.isApproved && (
        <View style={styles.pendingBanner}>
          <Feather name="clock" size={16} color={Colors.light.warning} />
          <Text style={styles.pendingText}>
            Your shop is pending admin approval. You'll be notified when approved.
          </Text>
        </View>
      )}
    </ScrollView>
  );

  const renderProducts = () => (
    <FlatList
      style={styles.tabContent}
      data={products}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={{ paddingBottom: Platform.OS === "web" ? 100 : 100 }}
      refreshControl={
        <RefreshControl refreshing={isRefetchingProducts} onRefresh={refetchProducts} />
      }
      ListEmptyComponent={
        <View style={styles.emptyState}>
          <Feather name="package" size={40} color={Colors.light.textTertiary} />
          <Text style={styles.emptyTitle}>No products yet</Text>
        </View>
      }
      renderItem={({ item }) => {
        const productImages = item.images ?? item.imageUrls ?? [];
        const img = getImageUrl(productImages[0]);
        return (
          <View style={styles.productRow}>
            {img ? (
              <Image source={{ uri: img }} style={styles.productThumb} contentFit="cover" />
            ) : (
              <View style={[styles.productThumb, styles.productThumbPlaceholder]}>
                <Feather name="image" size={20} color={Colors.light.textTertiary} />
              </View>
            )}
            <View style={styles.productInfo}>
              <Text style={styles.productName} numberOfLines={2}>
                {item.title ?? item.name}
              </Text>
              <Text style={styles.productPrice}>
                ${parseFloat(String(item.price)).toFixed(2)}
              </Text>
            </View>
            <StatusBadge status={item.status} />
          </View>
        );
      }}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
    />
  );

  const renderOrders = () => (
    <FlatList
      style={styles.tabContent}
      data={orders}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={{ paddingBottom: Platform.OS === "web" ? 100 : 100 }}
      refreshControl={
        <RefreshControl refreshing={isRefetchingOrders} onRefresh={refetchOrders} />
      }
      ListEmptyComponent={
        <View style={styles.emptyState}>
          <Feather name="shopping-bag" size={40} color={Colors.light.textTertiary} />
          <Text style={styles.emptyTitle}>No orders yet</Text>
        </View>
      }
      renderItem={({ item }) => (
        <View style={styles.orderRow}>
          <View style={styles.orderInfo}>
            <Text style={styles.orderId}>Order #{item.id}</Text>
            <Text style={styles.orderBuyer}>{item.buyer?.name ?? "Unknown"}</Text>
            {item.items?.[0]?.product && (
              <Text style={styles.orderProduct} numberOfLines={1}>
                {item.items[0].product.name}
                {(item.items.length ?? 0) > 1 ? ` +${item.items.length - 1} more` : ""}
              </Text>
            )}
          </View>
          <View style={styles.orderRight}>
            <Text style={styles.orderTotal}>
              ${parseFloat(item.totalAmount).toFixed(2)}
            </Text>
            <StatusBadge status={item.status} />
          </View>
        </View>
      )}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
    />
  );

  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        {(["overview", "products", "orders"] as Tab[]).map((t) => (
          <Pressable
            key={t}
            style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabBtnText, tab === t && styles.tabBtnTextActive]}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>

      {tab === "overview" && renderOverview()}
      {tab === "products" && renderProducts()}
      {tab === "orders" && renderOrders()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  tabBar: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    backgroundColor: Colors.light.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: "center",
    backgroundColor: Colors.light.searchBg,
  },
  tabBtnActive: {
    backgroundColor: Colors.light.primary,
  },
  tabBtnText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.textSecondary,
  },
  tabBtnTextActive: {
    color: "#fff",
  },
  tabContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  shopCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  shopAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.light.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  shopAvatarText: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
  shopInfo: {
    flex: 1,
    gap: 4,
  },
  shopName: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    color: Colors.light.text,
  },
  shopDesc: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: Colors.light.card,
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  statValue: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    color: Colors.light.primary,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: Colors.light.textSecondary,
  },
  pendingBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#FFFBEB",
    borderRadius: 12,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.light.warning + "40",
  },
  pendingText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.light.text,
    lineHeight: 20,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    color: Colors.light.textSecondary,
  },
  productRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    backgroundColor: Colors.light.card,
  },
  productThumb: {
    width: 56,
    height: 56,
    borderRadius: 10,
    backgroundColor: Colors.light.separator,
  },
  productThumbPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  productInfo: {
    flex: 1,
    gap: 4,
  },
  productName: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: Colors.light.text,
  },
  productPrice: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    color: Colors.light.price,
  },
  orderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    backgroundColor: Colors.light.card,
  },
  orderInfo: {
    flex: 1,
    gap: 3,
  },
  orderId: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.text,
  },
  orderBuyer: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
  },
  orderProduct: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textTertiary,
  },
  orderRight: {
    alignItems: "flex-end",
    gap: 6,
  },
  orderTotal: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: Colors.light.text,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.3,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.light.border,
  },
});
