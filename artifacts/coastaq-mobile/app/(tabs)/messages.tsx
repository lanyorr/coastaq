import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
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

interface Conversation {
  id: string;
  otherUser: {
    id: string;
    name: string;
    email?: string;
    role?: string;
  } | null;
  lastMessage?: {
    content: string;
    createdAt: string;
  } | null;
  unreadCount?: number;
  product?: {
    id: string;
    title?: string;
    name?: string;
    images?: string[];
    imageUrls?: string[];
  } | null;
}

function getImageUrl(url?: string) {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  return `https://${DOMAIN}${url}`;
}

function timeAgo(dateStr: string) {
  const date = new Date(dateStr);
  const now = Date.now();
  const diff = now - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return date.toLocaleDateString();
}

function ConversationRow({ conv }: { conv: Conversation }) {
  const hasUnread = (conv.unreadCount ?? 0) > 0;
  const allProductImages = conv.product?.images ?? conv.product?.imageUrls ?? [];
  const productImage = getImageUrl(allProductImages[0]);

  return (
    <Pressable
      style={styles.convRow}
      onPress={() =>
        router.push({ pathname: "/chat/[id]", params: { id: String(conv.id) } })
      }
    >
      <View style={styles.avatarContainer}>
        {productImage ? (
          <Image
            source={{ uri: productImage }}
            style={styles.avatar}
            contentFit="cover"
          />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarInitial}>
              {(conv.otherUser?.name ?? "?")[0].toUpperCase()}
            </Text>
          </View>
        )}
      </View>
      <View style={styles.convContent}>
        <View style={styles.convTop}>
          <Text
            style={[styles.convName, hasUnread && styles.convNameBold]}
            numberOfLines={1}
          >
            {conv.otherUser?.name ?? "Unknown"}
          </Text>
          {conv.lastMessage && (
            <Text style={styles.convTime}>
              {timeAgo(conv.lastMessage.createdAt)}
            </Text>
          )}
        </View>
        <View style={styles.convBottom}>
          {conv.product && (
            <Text style={styles.productName} numberOfLines={1}>
              {conv.product.title ?? conv.product.name}
            </Text>
          )}
          {conv.lastMessage && (
            <Text
              style={[styles.lastMsg, hasUnread && styles.lastMsgBold]}
              numberOfLines={1}
            >
              {conv.lastMessage.content}
            </Text>
          )}
        </View>
      </View>
      {hasUnread && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{conv.unreadCount}</Text>
        </View>
      )}
    </Pressable>
  );
}

export default function MessagesScreen() {
  const insets = useSafeAreaInsets();
  const { token, user } = useAuth();
  const topPadding = Platform.OS === "web" ? 67 : insets.top;

  const {
    data: conversations,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery<Conversation[]>({
    queryKey: ["conversations"],
    enabled: !!token,
    refetchInterval: 30000,
    queryFn: async () => {
      const res = await fetch(
        `https://${DOMAIN}/api/messages/conversations`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) return [];
      return res.json();
    },
  });

  if (!user) {
    return (
      <View style={[styles.container, { paddingTop: topPadding }]}>
        <View style={styles.header}>
          <Text style={styles.title}>Messages</Text>
        </View>
        <View style={styles.authRequired}>
          <Feather name="message-circle" size={52} color={Colors.light.textTertiary} />
          <Text style={styles.authTitle}>Sign in to view messages</Text>
          <Text style={styles.authSub}>
            Message sellers and track your orders
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
      data={conversations ?? []}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={[
        styles.listContent,
        { paddingBottom: Platform.OS === "web" ? 100 : 100 },
      ]}
      ListHeaderComponent={
        <View style={[styles.header, { paddingTop: topPadding + 8 }]}>
          <Text style={styles.title}>Messages</Text>
        </View>
      }
      renderItem={({ item }) => <ConversationRow conv={item} />}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      ListEmptyComponent={
        !isLoading ? (
          <View style={styles.empty}>
            <Feather name="message-circle" size={48} color={Colors.light.textTertiary} />
            <Text style={styles.emptyTitle}>No messages yet</Text>
            <Text style={styles.emptySub}>
              Message sellers about products you're interested in
            </Text>
          </View>
        ) : null
      }
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
      }
      showsVerticalScrollIndicator={false}
      contentInsetAdjustmentBehavior="automatic"
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  listContent: {
    backgroundColor: Colors.light.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: Colors.light.background,
  },
  title: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    color: Colors.light.text,
    letterSpacing: -0.5,
  },
  convRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: Colors.light.card,
    gap: 12,
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: "hidden",
  },
  avatar: {
    width: 50,
    height: 50,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.light.chip,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: {
    fontSize: 20,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.primary,
  },
  convContent: {
    flex: 1,
    gap: 3,
  },
  convTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  convName: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    color: Colors.light.text,
    flex: 1,
  },
  convNameBold: {
    fontFamily: "Inter_700Bold",
  },
  convTime: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textTertiary,
  },
  convBottom: {
    gap: 2,
  },
  productName: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: Colors.light.primary,
  },
  lastMsg: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
  },
  lastMsgBold: {
    fontFamily: "Inter_500Medium",
    color: Colors.light.text,
  },
  badge: {
    backgroundColor: Colors.light.badge,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.light.border,
    marginLeft: 82,
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
  emptySub: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
    textAlign: "center",
  },
});
