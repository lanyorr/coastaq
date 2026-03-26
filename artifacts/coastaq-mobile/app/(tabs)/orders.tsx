import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import React from "react";
import {
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";

const DOMAIN = process.env.EXPO_PUBLIC_DOMAIN;

interface OrderItem {
  product?: { title?: string; name?: string };
  quantity: number;
  price: number | string;
}

interface Order {
  id: string | number;
  totalAmount: string | number;
  status: string;
  createdAt: string;
  buyer?: { name: string };
  items?: OrderItem[];
}

function StatusBadge({ status }: { status: string }) {
  const color =
    status === "COMPLETED" || status === "DELIVERED"
      ? Colors.light.success
      : status === "PENDING" || status === "PROCESSING"
      ? Colors.light.warning
      : Colors.light.textTertiary;

  return (
    <View style={[styles.badge, { backgroundColor: color + "20" }]}>
      <Text style={[styles.badgeText, { color }]}>{status}</Text>
    </View>
  );
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function OrdersScreen() {
  const insets = useSafeAreaInsets();
  const { user, token } = useAuth();
  const topPadding = Platform.OS === "web" ? 67 : insets.top;

  const isSeller = user?.role === "SELLER";

  const { data: orders = [], isLoading, refetch, isRefetching } = useQuery<Order[]>({
    queryKey: ["orders-tab", isSeller],
    enabled: !!token,
    queryFn: async () => {
      const url = isSeller
        ? `https://${DOMAIN}/api/orders/seller`
        : `https://${DOMAIN}/api/orders`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return [];
      return res.json();
    },
  });

  if (!user) {
    return (
      <View style={[styles.container, { paddingTop: topPadding }]}>
        <View style={styles.header}>
          <Text style={styles.title}>Orders</Text>
        </View>
        <View style={styles.authRequired}>
          <Feather name="shopping-bag" size={52} color={Colors.light.textTertiary} />
          <Text style={styles.authTitle}>Sign in to view orders</Text>
          <Text style={styles.authSub}>
            Track your purchases and sales in one place
          </Text>
          <Pressable
            style={styles.loginBtn}
            onPress={() => router.push("/auth/login")}
          >
            <Text style={styles.loginBtnText}>Sign In</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      data={orders}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={[
        styles.listContent,
        { paddingBottom: Platform.OS === "web" ? 100 : 100 },
      ]}
      ListHeaderComponent={
        <View style={[styles.header, { paddingTop: topPadding + 8 }]}>
          <Text style={styles.title}>
            {isSeller ? "Sales" : "Orders"}
          </Text>
          {orders.length > 0 && (
            <Text style={styles.subtitle}>
              {orders.length} {orders.length === 1 ? "order" : "orders"}
            </Text>
          )}
        </View>
      }
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
      }
      showsVerticalScrollIndicator={false}
      contentInsetAdjustmentBehavior="automatic"
      ListEmptyComponent={
        !isLoading ? (
          <View style={styles.empty}>
            <Feather name="shopping-bag" size={48} color={Colors.light.textTertiary} />
            <Text style={styles.emptyTitle}>
              {isSeller ? "No sales yet" : "No orders yet"}
            </Text>
            <Text style={styles.emptySubtitle}>
              {isSeller
                ? "Orders from buyers will appear here"
                : "Browse products and place your first order"}
            </Text>
            {!isSeller && (
              <Pressable
                style={styles.browseBtn}
                onPress={() => router.push("/")}
              >
                <Text style={styles.browseBtnText}>Browse Products</Text>
              </Pressable>
            )}
          </View>
        ) : null
      }
      renderItem={({ item }) => (
        <View style={styles.orderCard}>
          <View style={styles.orderTop}>
            <View style={styles.orderMeta}>
              <Text style={styles.orderId}>Order #{item.id}</Text>
              <Text style={styles.orderDate}>{formatDate(item.createdAt)}</Text>
              {isSeller && item.buyer && (
                <Text style={styles.orderBuyer}>
                  from {item.buyer.name}
                </Text>
              )}
            </View>
            <StatusBadge status={item.status} />
          </View>

          {(item.items ?? []).length > 0 && (
            <View style={styles.itemsList}>
              {(item.items ?? []).map((oi, idx) => (
                <View key={idx} style={styles.orderItem}>
                  <View style={styles.itemDot} />
                  <Text style={styles.itemName} numberOfLines={1}>
                    {oi.product?.title ?? oi.product?.name ?? "Product"}
                  </Text>
                  <Text style={styles.itemQty}>×{oi.quantity}</Text>
                  <Text style={styles.itemPrice}>
                    ${parseFloat(String(oi.price)).toFixed(2)}
                  </Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.orderFooter}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalAmount}>
              ${parseFloat(String(item.totalAmount)).toFixed(2)}
            </Text>
          </View>
        </View>
      )}
      ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  listContent: {
    paddingHorizontal: 16,
    backgroundColor: Colors.light.background,
  },
  header: {
    paddingBottom: 12,
    gap: 2,
  },
  title: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    color: Colors.light.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
  },
  authRequired: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    gap: 12,
  },
  authTitle: {
    fontSize: 20,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.text,
  },
  authSub: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
    textAlign: "center",
    lineHeight: 21,
  },
  loginBtn: {
    marginTop: 8,
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  loginBtnText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
  },
  empty: {
    alignItems: "center",
    paddingTop: 80,
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.text,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
    textAlign: "center",
    lineHeight: 21,
  },
  browseBtn: {
    marginTop: 8,
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  browseBtnText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
  },
  orderCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  orderTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
  },
  orderMeta: {
    gap: 2,
    flex: 1,
  },
  orderId: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: Colors.light.text,
  },
  orderDate: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textTertiary,
  },
  orderBuyer: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: Colors.light.textSecondary,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    flexShrink: 0,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.3,
  },
  itemsList: {
    gap: 6,
    paddingVertical: 4,
  },
  orderItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  itemDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.light.textTertiary,
  },
  itemName: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.light.text,
  },
  itemQty: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: Colors.light.textTertiary,
  },
  itemPrice: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.text,
  },
  orderFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.light.border,
  },
  totalLabel: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: Colors.light.textSecondary,
  },
  totalAmount: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: Colors.light.price,
  },
});
