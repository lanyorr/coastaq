import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";

export default function BuyerOnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const topPadding = Platform.OS === "web" ? 67 : insets.top + 20;
  const bottomPadding = Platform.OS === "web" ? 40 : insets.bottom + 24;

  const firstName = user?.name?.split(" ")[0] ?? "there";

  return (
    <View style={[styles.container, { paddingTop: topPadding, paddingBottom: bottomPadding }]}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() ?? "👋"}
          </Text>
        </View>
        <Text style={styles.greeting}>Welcome, {firstName}!</Text>
        <Text style={styles.sub}>Your account is ready. What would you like to do first?</Text>
      </View>

      <View style={styles.cards}>
        <Pressable
          style={({ pressed }) => [styles.card, styles.cardPrimary, pressed && { opacity: 0.85 }]}
          onPress={() => router.replace("/buyer/dashboard")}
        >
          <View style={styles.cardIconWrap}>
            <Feather name="grid" size={28} color="#fff" />
          </View>
          <Text style={styles.cardTitle}>My Dashboard</Text>
          <Text style={styles.cardDesc}>View your orders, messages, and account details</Text>
          <View style={styles.cardArrow}>
            <Feather name="arrow-right" size={18} color="rgba(255,255,255,0.8)" />
          </View>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.card, styles.cardSecondary, pressed && { opacity: 0.85 }]}
          onPress={() => router.replace("/(tabs)")}
        >
          <View style={[styles.cardIconWrap, styles.cardIconWrapSecondary]}>
            <Feather name="shopping-bag" size={28} color={Colors.light.primary} />
          </View>
          <Text style={[styles.cardTitle, styles.cardTitleSecondary]}>Browse Marketplace</Text>
          <Text style={[styles.cardDesc, styles.cardDescSecondary]}>
            Explore products from sellers across Coastaq
          </Text>
          <View style={styles.cardArrow}>
            <Feather name="arrow-right" size={18} color={Colors.light.textTertiary} />
          </View>
        </Pressable>
      </View>

      <View style={styles.features}>
        <Text style={styles.featuresTitle}>You can also</Text>
        <View style={styles.featuresList}>
          {[
            { icon: "message-circle", text: "Message sellers directly" },
            { icon: "package", text: "Track your orders" },
            { icon: "search", text: "Search by category or keyword" },
          ].map((f) => (
            <View key={f.text} style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Feather name={f.icon as any} size={15} color={Colors.light.primary} />
              </View>
              <Text style={styles.featureText}>{f.text}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
    paddingHorizontal: 24,
    gap: 32,
  },
  header: {
    alignItems: "center",
    gap: 10,
    paddingTop: 12,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.light.primary + "18",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  avatarText: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    color: Colors.light.primary,
  },
  greeting: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    color: Colors.light.text,
    letterSpacing: -0.5,
  },
  sub: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
  cards: {
    gap: 14,
  },
  card: {
    borderRadius: 20,
    padding: 22,
    gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  cardPrimary: {
    backgroundColor: Colors.light.primary,
  },
  cardSecondary: {
    backgroundColor: Colors.light.background,
    borderWidth: 1.5,
    borderColor: Colors.light.border,
  },
  cardIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  cardIconWrapSecondary: {
    backgroundColor: Colors.light.primary + "12",
  },
  cardTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: "#fff",
    letterSpacing: -0.3,
  },
  cardTitleSecondary: {
    color: Colors.light.text,
  },
  cardDesc: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.8)",
    lineHeight: 20,
  },
  cardDescSecondary: {
    color: Colors.light.textSecondary,
  },
  cardArrow: {
    position: "absolute",
    top: 22,
    right: 22,
  },
  features: {
    gap: 14,
  },
  featuresTitle: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.textTertiary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  featuresList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  featureIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: Colors.light.primary + "10",
    alignItems: "center",
    justifyContent: "center",
  },
  featureText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: Colors.light.text,
  },
});
