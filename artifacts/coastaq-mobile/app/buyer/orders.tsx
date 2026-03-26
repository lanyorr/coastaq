import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import React from "react";
import {
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";

import Colors from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";

const DOMAIN = process.env.EXPO_PUBLIC_DOMAIN;

interface Order {
  id: number;
  totalAmount: string;
  status: string;
  createdAt: string;
  items?: { product: { name: string }; quantity: number; price: string }[];
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

export default function BuyerOrdersScreen() {
  const { token } = useAuth();

  const { data: orders = [], isLoading, refetch, isRefetching } = useQuery<Order[]>({
    queryKey: ["buyer-orders"],
    enabled: !!token,
    queryFn: async () => {
      const res = await fetch(`https://${DOMAIN}/api/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return [];
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>Loading orders…</Text>
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
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
      }
      ListEmptyComponent={
        <View style={styles.empty}>
          <Feather name="shopping-bag" size={48} color={Colors.light.textTertiary} />
          <Text style={styles.emptyTitle}>No orders yet</Text>
          <Text style={styles.emptySubtitle}>
            Browse products and place your first order
          </Text>
        </View>
      }
      renderItem={({ item }) => (
        <View style={styles.orderCard}>
          <View style={styles.orderTop}>
            <View>
              <Text style={styles.orderId}>Order #{item.id}</Text>
              <Text style={styles.orderDate}>{formatDate(item.createdAt)}</Text>
            </View>
            <StatusBadge status={item.status} />
          </View>
          {(item.items ?? []).map((oi, idx) => (
            <View key={idx} style={styles.orderItem}>
              <Text style={styles.itemName} numberOfLines={1}>
                {oi.product?.name ?? "Product"}
              </Text>
              <Text style={styles.itemQty}>x{oi.quantity}</Text>
              <Text style={styles.itemPrice}>
                ${parseFloat(oi.price).toFixed(2)}
              </Text>
            </View>
          ))}
          <View style={styles.orderFooter}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalAmount}>
              ${parseFloat(item.totalAmount).toFixed(2)}
            </Text>
          </View>
        </View>
      )}
      showsVerticalScrollIndicator={false}
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
    paddingTop: 16,
    gap: 12,
  },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textTertiary,
  },
  empty: {
    alignItems: "center",
    paddingTop: 80,
    gap: 12,
    paddingHorizontal: 40,
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
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.3,
  },
  orderItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 4,
  },
  itemName: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.light.text,
  },
  itemQty: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: Colors.light.textSecondary,
  },
  itemPrice: {
    fontSize: 14,
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
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    color: Colors.light.price,
  },
});
