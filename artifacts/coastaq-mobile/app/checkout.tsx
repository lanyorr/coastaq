import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";

const DOMAIN = process.env.EXPO_PUBLIC_DOMAIN;
type Step = "shipping" | "processing" | "success" | "error";

function InputField({
  icon, placeholder, value, onChangeText, keyboardType, autoCapitalize,
}: {
  icon: string; placeholder: string; value: string;
  onChangeText: (t: string) => void; keyboardType?: any; autoCapitalize?: any;
}) {
  return (
    <View style={styles.inputWrap}>
      <Feather name={icon as any} size={15} color={Colors.light.textTertiary} />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={Colors.light.textTertiary}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType ?? "default"}
        autoCapitalize={autoCapitalize ?? "none"}
      />
    </View>
  );
}

export default function CheckoutScreen() {
  const { productId, productName, price } = useLocalSearchParams<{
    productId: string; productName: string; price: string;
  }>();
  const insets = useSafeAreaInsets();
  const { token, user } = useAuth();
  const [step, setStep] = useState<Step>("shipping");
  const [errorMsg, setErrorMsg] = useState("");
  const [orderId, setOrderId] = useState<string | null>(null);

  const [shippingName, setShippingName] = useState(user?.name ?? "");
  const [shippingAddress, setShippingAddress] = useState("");
  const [shippingCity, setShippingCity] = useState("");
  const [shippingState, setShippingState] = useState("");
  const [shippingZip, setShippingZip] = useState("");

  const priceNum = parseFloat(price ?? "0");

  const showAlert = (title: string, msg: string) => {
    if (Platform.OS === "web") window.alert(`${title}\n\n${msg}`);
    else Alert.alert(title, msg);
  };

  const handlePayPal = async () => {
    if (!shippingName.trim() || !shippingAddress.trim() || !shippingCity.trim()) {
      showAlert("Missing info", "Please fill in your name, address, and city.");
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setStep("processing");
    try {
      // Step 1: Create PayPal order
      const orderRes = await fetch(`https://${DOMAIN}/api/checkout/paypal`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ productId, quantity: 1 }),
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        setErrorMsg(orderData.error ?? "Failed to create payment.");
        setStep("error");
        return;
      }
      const { approvalUrl, paypalOrderId } = orderData;
      if (!approvalUrl) {
        setErrorMsg("Could not get PayPal approval link. Please try again.");
        setStep("error");
        return;
      }

      // Step 2: Open PayPal in browser
      if (Platform.OS === "web") {
        window.open(approvalUrl, "_blank");
        setStep("shipping");
        return;
      }
      const result = await WebBrowser.openAuthSessionAsync(approvalUrl, "coastaq-mobile://");
      if (result.type !== "success") {
        setStep("shipping");
        return;
      }
      const resultUrl = (result as any).url ?? "";
      if (resultUrl.includes("paypal-cancel")) {
        setStep("shipping");
        return;
      }

      // Step 3: Capture payment
      const captureRes = await fetch(`https://${DOMAIN}/api/checkout/paypal/capture`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          paypalOrderId,
          productId,
          quantity: 1,
          shipping: {
            name: shippingName.trim(),
            address: shippingAddress.trim(),
            city: shippingCity.trim(),
            state: shippingState.trim() || "N/A",
            zip: shippingZip.trim() || "N/A",
            country: "NG",
          },
        }),
      });
      const captureData = await captureRes.json();
      if (!captureRes.ok) {
        setErrorMsg(captureData.error ?? "Payment capture failed.");
        setStep("error");
        return;
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setOrderId(captureData.orderId);
      setStep("success");
    } catch {
      setErrorMsg("Network error. Please check your connection and try again.");
      setStep("error");
    }
  };

  const topPad = Platform.OS === "web" ? 80 : insets.top + 16;

  if (step === "success") {
    return (
      <View style={[styles.centerScreen, { paddingTop: topPad }]}>
        <View style={styles.successIconWrap}>
          <Feather name="check-circle" size={72} color={Colors.light.success} />
        </View>
        <Text style={styles.bigTitle}>Order Placed!</Text>
        <Text style={styles.bigSub}>
          Order #{orderId} is confirmed. The seller will process your order shortly.
        </Text>
        <Pressable style={styles.primaryBtn} onPress={() => router.replace("/(tabs)/orders")}>
          <Text style={styles.primaryBtnText}>View My Orders</Text>
        </Pressable>
        <Pressable style={styles.ghostBtn} onPress={() => router.replace("/")}>
          <Text style={styles.ghostBtnText}>Continue Shopping</Text>
        </Pressable>
      </View>
    );
  }

  if (step === "error") {
    return (
      <View style={[styles.centerScreen, { paddingTop: topPad }]}>
        <Feather name="x-circle" size={64} color="#EF4444" />
        <Text style={styles.bigTitle}>Payment Failed</Text>
        <Text style={styles.bigSub}>{errorMsg}</Text>
        <Pressable style={styles.primaryBtn} onPress={() => setStep("shipping")}>
          <Text style={styles.primaryBtnText}>Try Again</Text>
        </Pressable>
        <Pressable style={styles.ghostBtn} onPress={() => router.back()}>
          <Text style={styles.ghostBtnText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  if (step === "processing") {
    return (
      <View style={[styles.centerScreen, { paddingTop: topPad }]}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
        <Text style={styles.bigTitle}>Processing…</Text>
        <Text style={styles.bigSub}>Complete the payment in the browser window that opened.</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: topPad, paddingBottom: insets.bottom + 40 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-left" size={20} color={Colors.light.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Checkout</Text>
          <View style={{ width: 36 }} />
        </View>

        {/* Order summary */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Order Summary</Text>
          <View style={styles.rowBetween}>
            <Text style={styles.itemName} numberOfLines={2}>{productName}</Text>
            <Text style={styles.itemPrice}>${priceNum.toFixed(2)}</Text>
          </View>
          <View style={styles.hairline} />
          <View style={styles.rowBetween}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalAmount}>${priceNum.toFixed(2)}</Text>
          </View>
        </View>

        {/* Delivery details */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Delivery Details</Text>
          <View style={styles.fields}>
            <InputField icon="user" placeholder="Full name *" value={shippingName} onChangeText={setShippingName} autoCapitalize="words" />
            <InputField icon="map-pin" placeholder="Street address *" value={shippingAddress} onChangeText={setShippingAddress} autoCapitalize="words" />
            <View style={styles.row2}>
              <View style={{ flex: 1 }}>
                <InputField icon="navigation" placeholder="City *" value={shippingCity} onChangeText={setShippingCity} autoCapitalize="words" />
              </View>
              <View style={{ flex: 1 }}>
                <InputField icon="flag" placeholder="State" value={shippingState} onChangeText={setShippingState} autoCapitalize="words" />
              </View>
            </View>
            <InputField icon="hash" placeholder="ZIP / Postal code" value={shippingZip} onChangeText={setShippingZip} keyboardType="numeric" />
          </View>
        </View>

        <Pressable style={styles.paypalBtn} onPress={handlePayPal}>
          <Feather name="credit-card" size={20} color="#fff" />
          <Text style={styles.paypalBtnText}>Pay ${priceNum.toFixed(2)} with PayPal</Text>
        </Pressable>

        <Text style={styles.secureNote}>
          🔒 Secured by PayPal · Sandbox mode (test card: 4111 1111 1111 1111)
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  content: { paddingHorizontal: 20, gap: 14 },
  centerScreen: {
    flex: 1, backgroundColor: Colors.light.background,
    alignItems: "center", justifyContent: "center",
    paddingHorizontal: 40, gap: 16,
  },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.light.searchBg,
    alignItems: "center", justifyContent: "center",
  },
  headerTitle: { fontSize: 18, fontFamily: "Inter_700Bold", color: Colors.light.text },
  card: {
    backgroundColor: Colors.light.card, borderRadius: 16,
    padding: 16, gap: 12,
    borderWidth: 1, borderColor: Colors.light.border,
  },
  sectionLabel: { fontSize: 13, fontFamily: "Inter_700Bold", color: Colors.light.text },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12 },
  itemName: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular", color: Colors.light.text },
  itemPrice: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: Colors.light.text },
  hairline: { height: StyleSheet.hairlineWidth, backgroundColor: Colors.light.border },
  totalLabel: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: Colors.light.text },
  totalAmount: { fontSize: 22, fontFamily: "Inter_700Bold", color: Colors.light.price },
  fields: { gap: 10 },
  row2: { flexDirection: "row", gap: 10 },
  inputWrap: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: Colors.light.searchBg,
    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 13,
    gap: 8, borderWidth: 1, borderColor: Colors.light.border,
  },
  input: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular", color: Colors.light.text },
  paypalBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 10, backgroundColor: "#003087", borderRadius: 14, paddingVertical: 16,
    shadowColor: "#003087", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 8, elevation: 5,
  },
  paypalBtnText: { fontSize: 17, fontFamily: "Inter_700Bold", color: "#fff" },
  secureNote: {
    textAlign: "center", fontSize: 11,
    fontFamily: "Inter_400Regular", color: Colors.light.textTertiary,
  },
  successIconWrap: { marginBottom: 8 },
  bigTitle: { fontSize: 24, fontFamily: "Inter_700Bold", color: Colors.light.text, textAlign: "center" },
  bigSub: {
    fontSize: 14, fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary, textAlign: "center", lineHeight: 22,
  },
  primaryBtn: {
    backgroundColor: Colors.light.primary, paddingHorizontal: 32,
    paddingVertical: 14, borderRadius: 12, alignItems: "center", width: "100%",
  },
  primaryBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#fff" },
  ghostBtn: { paddingVertical: 10, alignItems: "center" },
  ghostBtnText: { fontSize: 14, fontFamily: "Inter_500Medium", color: Colors.light.textSecondary },
});
