import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
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

const DOMAIN = process.env.EXPO_PUBLIC_DOMAIN;

export default function CheckoutScreen() {
  const { productId, productName, price } = useLocalSearchParams<{
    productId: string;
    productName: string;
    price: string;
  }>();
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const priceNum = parseFloat(price ?? "0");

  const handlePayPal = async () => {
    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const cartRes = await fetch(`https://${DOMAIN}/api/cart`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productId: parseInt(productId!), quantity: 1 }),
      });

      if (!cartRes.ok) {
        const err = await cartRes.json().catch(() => ({}));
        Alert.alert("Error", err.error ?? "Could not add to cart.");
        return;
      }

      const paypalRes = await fetch(`https://${DOMAIN}/api/checkout/paypal`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!paypalRes.ok) {
        const err = await paypalRes.json().catch(() => ({}));
        Alert.alert("Error", err.error ?? "Could not create PayPal order.");
        return;
      }

      const data = await paypalRes.json();
      Alert.alert(
        "Order Created",
        `PayPal order #${data.orderId ?? data.id} created.\n\nIn a production app, you'd be redirected to PayPal to complete payment.\n\nFor sandbox testing, use:\nCard: 4111 1111 1111 1111`,
        [
          { text: "Close", onPress: () => router.back() },
        ]
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      Alert.alert("Error", "Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.orderSummary}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.productName} numberOfLines={2}>
              {productName}
            </Text>
            <Text style={styles.productPrice}>${priceNum.toFixed(2)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalPrice}>${priceNum.toFixed(2)}</Text>
          </View>
        </View>

        <View style={styles.paymentSection}>
          <Text style={styles.sectionTitle}>Payment</Text>
          <Pressable
            style={[styles.paypalBtn, isLoading && styles.paypalBtnDisabled]}
            onPress={handlePayPal}
            disabled={isLoading}
          >
            <View style={styles.paypalBtnInner}>
              <Text style={styles.paypalBtnTitle}>
                {isLoading ? "Processing…" : "Pay with PayPal"}
              </Text>
              <Text style={styles.paypalBtnSub}>
                ${priceNum.toFixed(2)} via PayPal Sandbox
              </Text>
            </View>
            <Feather name="arrow-right" size={20} color="#003087" />
          </Pressable>

          <View style={styles.sandboxNote}>
            <Feather name="info" size={14} color={Colors.light.textTertiary} />
            <Text style={styles.sandboxNoteText}>
              Sandbox mode — use card 4111 1111 1111 1111 for testing
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.textTertiary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  orderSummary: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  productName: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    color: Colors.light.text,
  },
  productPrice: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.text,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.light.border,
  },
  totalLabel: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: Colors.light.text,
  },
  totalPrice: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    color: Colors.light.primary,
  },
  paymentSection: {
    gap: 12,
  },
  paypalBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFC439",
    borderRadius: 14,
    padding: 16,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  paypalBtnDisabled: {
    opacity: 0.6,
  },
  paypalBtnInner: {
    flex: 1,
    gap: 2,
  },
  paypalBtnTitle: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: "#003087",
  },
  paypalBtnSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "#003087",
    opacity: 0.7,
  },
  sandboxNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    paddingHorizontal: 4,
  },
  sandboxNoteText: {
    flex: 1,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textTertiary,
    lineHeight: 18,
  },
});
