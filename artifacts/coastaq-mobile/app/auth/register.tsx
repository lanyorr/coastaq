import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
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

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [shopName, setShopName] = useState("");
  const [shopDescription, setShopDescription] = useState("");
  const [role, setRole] = useState<"BUYER" | "SELLER">("BUYER");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const showAlert = (title: string, msg: string) => {
    if (Platform.OS === "web") {
      window.alert(`${title}\n\n${msg}`);
    } else {
      Alert.alert(title, msg);
    }
  };

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password) {
      showAlert("Missing fields", "Please fill in all fields.");
      return;
    }
    if (password.length < 6) {
      showAlert("Weak password", "Password must be at least 6 characters.");
      return;
    }
    if (role === "SELLER" && !shopName.trim()) {
      showAlert("Shop name required", "Please enter a name for your shop.");
      return;
    }
    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const body: Record<string, string> = {
        name: name.trim(),
        email: email.trim(),
        password,
        role,
      };
      if (role === "SELLER") {
        body.shopName = shopName.trim();
        if (shopDescription.trim()) body.shopDescription = shopDescription.trim();
      }
      const res = await fetch(`https://${DOMAIN}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        showAlert("Registration Failed", data.error ?? "Please try again.");
        return;
      }
      await login(data.token, data.user);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (role === "BUYER") {
        router.replace("/buyer/onboarding");
      } else if (router.canGoBack()) {
        router.back();
      } else {
        router.replace("/(tabs)");
      }
    } catch {
      showAlert("Error", "Could not connect. Please try again.");
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
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 40 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logoArea}>
          <Text style={styles.logo}>Coastaq</Text>
          <Text style={styles.tagline}>Create your account</Text>
        </View>

        <View style={styles.form}>
          {/* Role toggle */}
          <View style={styles.roleToggle}>
            <Pressable
              style={[styles.roleBtn, role === "BUYER" && styles.roleBtnActive]}
              onPress={() => setRole("BUYER")}
            >
              <Feather
                name="shopping-bag"
                size={16}
                color={role === "BUYER" ? "#fff" : Colors.light.textSecondary}
              />
              <Text
                style={[
                  styles.roleBtnText,
                  role === "BUYER" && styles.roleBtnTextActive,
                ]}
              >
                Buy
              </Text>
            </Pressable>
            <Pressable
              style={[styles.roleBtn, role === "SELLER" && styles.roleBtnActive]}
              onPress={() => setRole("SELLER")}
            >
              <Feather
                name="tag"
                size={16}
                color={role === "SELLER" ? "#fff" : Colors.light.textSecondary}
              />
              <Text
                style={[
                  styles.roleBtnText,
                  role === "SELLER" && styles.roleBtnTextActive,
                ]}
              >
                Sell
              </Text>
            </Pressable>
          </View>

          {/* Name */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Full Name</Text>
            <View style={styles.inputWrap}>
              <Feather name="user" size={16} color={Colors.light.textTertiary} />
              <TextInput
                style={styles.input}
                placeholder="Your name"
                placeholderTextColor={Colors.light.textTertiary}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                returnKeyType="next"
              />
            </View>
          </View>

          {/* Email */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputWrap}>
              <Feather name="mail" size={16} color={Colors.light.textTertiary} />
              <TextInput
                style={styles.input}
                placeholder="you@example.com"
                placeholderTextColor={Colors.light.textTertiary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
              />
            </View>
          </View>

          {/* Password */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrap}>
              <Feather name="lock" size={16} color={Colors.light.textTertiary} />
              <TextInput
                style={styles.input}
                placeholder="At least 6 characters"
                placeholderTextColor={Colors.light.textTertiary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                returnKeyType={role === "SELLER" ? "next" : "done"}
                onSubmitEditing={role === "SELLER" ? undefined : handleRegister}
              />
              <Pressable onPress={() => setShowPassword(!showPassword)}>
                <Feather
                  name={showPassword ? "eye-off" : "eye"}
                  size={16}
                  color={Colors.light.textTertiary}
                />
              </Pressable>
            </View>
          </View>

          {/* Seller-only shop fields */}
          {role === "SELLER" && (
            <View style={styles.shopSection}>
              <View style={styles.shopSectionHeader}>
                <Feather name="store" size={15} color={Colors.light.primary} />
                <Text style={styles.shopSectionTitle}>Your Shop</Text>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>
                  Shop Name <Text style={styles.required}>*</Text>
                </Text>
                <View style={styles.inputWrap}>
                  <Feather name="shopping-bag" size={16} color={Colors.light.textTertiary} />
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Lagos Tech Hub"
                    placeholderTextColor={Colors.light.textTertiary}
                    value={shopName}
                    onChangeText={setShopName}
                    autoCapitalize="words"
                    returnKeyType="next"
                  />
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>
                  Shop Description{" "}
                  <Text style={styles.optional}>(optional)</Text>
                </Text>
                <View style={[styles.inputWrap, styles.textareaWrap]}>
                  <TextInput
                    style={[styles.input, styles.textarea]}
                    placeholder="Tell buyers what you sell…"
                    placeholderTextColor={Colors.light.textTertiary}
                    value={shopDescription}
                    onChangeText={setShopDescription}
                    multiline
                    numberOfLines={3}
                    returnKeyType="done"
                    onSubmitEditing={handleRegister}
                  />
                </View>
              </View>
            </View>
          )}

          <Pressable
            style={[styles.submitBtn, isLoading && styles.submitBtnDisabled]}
            onPress={handleRegister}
            disabled={isLoading}
          >
            <Text style={styles.submitBtnText}>
              {isLoading
                ? "Creating account…"
                : role === "SELLER"
                ? "Create Seller Account"
                : "Create Account"}
            </Text>
          </Pressable>

          <Pressable
            style={styles.secondaryBtn}
            onPress={() => router.replace("/auth/login")}
          >
            <Text style={styles.secondaryBtnText}>
              Already have an account?{" "}
              <Text style={styles.secondaryBtnLink}>Sign in</Text>
            </Text>
          </Pressable>
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
    paddingHorizontal: 28,
    gap: 28,
  },
  logoArea: {
    alignItems: "center",
    gap: 6,
  },
  logo: {
    fontSize: 32,
    fontFamily: "Inter_700Bold",
    color: Colors.light.primary,
    letterSpacing: -1,
  },
  tagline: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
  },
  form: {
    gap: 16,
  },
  roleToggle: {
    flexDirection: "row",
    backgroundColor: Colors.light.searchBg,
    borderRadius: 14,
    padding: 4,
    gap: 4,
  },
  roleBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  roleBtnActive: {
    backgroundColor: Colors.light.primary,
  },
  roleBtnText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.textSecondary,
  },
  roleBtnTextActive: {
    color: "#fff",
  },
  fieldGroup: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.text,
    paddingHorizontal: 2,
  },
  required: {
    color: "#EF4444",
  },
  optional: {
    fontFamily: "Inter_400Regular",
    color: Colors.light.textTertiary,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.searchBg,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  textareaWrap: {
    alignItems: "flex-start",
    paddingTop: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: Colors.light.text,
  },
  textarea: {
    minHeight: 64,
    textAlignVertical: "top",
  },
  shopSection: {
    gap: 14,
    padding: 16,
    backgroundColor: Colors.light.primary + "08",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.light.primary + "20",
  },
  shopSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  shopSectionTitle: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    color: Colors.light.primary,
  },
  submitBtn: {
    backgroundColor: Colors.light.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 4,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
  },
  secondaryBtn: {
    alignItems: "center",
    paddingVertical: 8,
  },
  secondaryBtnText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
  },
  secondaryBtnLink: {
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.primary,
  },
});
