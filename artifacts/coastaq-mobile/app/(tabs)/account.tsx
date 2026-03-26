import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React from "react";
import {
  Alert,
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

function MenuItem({
  icon,
  label,
  onPress,
  danger,
  rightText,
}: {
  icon: string;
  label: string;
  onPress: () => void;
  danger?: boolean;
  rightText?: string;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
      onPress={onPress}
    >
      <View style={[styles.menuIcon, danger && styles.menuIconDanger]}>
        <Feather
          name={icon as any}
          size={18}
          color={danger ? Colors.light.error : Colors.light.primary}
        />
      </View>
      <Text style={[styles.menuLabel, danger && styles.menuLabelDanger]}>
        {label}
      </Text>
      <View style={styles.menuRight}>
        {rightText && (
          <Text style={styles.menuRightText}>{rightText}</Text>
        )}
        <Feather
          name="chevron-right"
          size={16}
          color={Colors.light.textTertiary}
        />
      </View>
    </Pressable>
  );
}

function MenuSection({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      {title && <Text style={styles.sectionTitle}>{title}</Text>}
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}

export default function AccountScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const topPadding = Platform.OS === "web" ? 67 : insets.top;

  const handleLogout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (Platform.OS === "web") {
      if (window.confirm("Are you sure you want to sign out?")) {
        logout();
      }
      return;
    }
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await logout();
        },
      },
    ]);
  };

  if (!user) {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.guestContent,
          { paddingTop: topPadding + 16, paddingBottom: Platform.OS === "web" ? 100 : 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.guestHero}>
          <View style={styles.guestAvatarBig}>
            <Feather name="user" size={40} color={Colors.light.primary} />
          </View>
          <Text style={styles.guestTitle}>Welcome to Coastaq</Text>
          <Text style={styles.guestSub}>
            Sign in to buy, sell, and message sellers
          </Text>
          <View style={styles.authBtns}>
            <Pressable
              style={styles.loginBtnPrimary}
              onPress={() => router.push("/auth/login")}
            >
              <Text style={styles.loginBtnPrimaryText}>Sign In</Text>
            </Pressable>
            <Pressable
              style={styles.loginBtnSecondary}
              onPress={() => router.push("/auth/register")}
            >
              <Text style={styles.loginBtnSecondaryText}>Create Account</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    );
  }

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingTop: topPadding + 16, paddingBottom: Platform.OS === "web" ? 100 : 100 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.profileCard}>
        <View style={styles.avatarLarge}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{user.name}</Text>
          <Text style={styles.profileEmail}>{user.email}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{user.role}</Text>
          </View>
        </View>
      </View>

      {user.role === "SELLER" && (
        <MenuSection title="Selling">
          <MenuItem
            icon="bar-chart-2"
            label="Seller Dashboard"
            onPress={() => router.push("/seller/dashboard")}
          />
          <View style={styles.itemDivider} />
          <MenuItem
            icon="package"
            label="My Products"
            onPress={() => router.push("/seller/dashboard")}
          />
          <View style={styles.itemDivider} />
          <MenuItem
            icon="shopping-bag"
            label="Orders Received"
            onPress={() => router.push("/seller/dashboard")}
          />
        </MenuSection>
      )}

      <MenuSection title="Buying">
        <MenuItem
          icon="shopping-bag"
          label="My Orders"
          onPress={() => router.push("/buyer/orders")}
        />
      </MenuSection>

      <MenuSection title="Account">
        <MenuItem
          icon="log-out"
          label="Sign Out"
          onPress={handleLogout}
          danger
        />
      </MenuSection>

      <Text style={styles.version}>Coastaq Mobile v1.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  content: {
    paddingHorizontal: 20,
    gap: 20,
  },
  guestContent: {
    paddingHorizontal: 20,
    flex: 1,
    justifyContent: "center",
  },
  guestHero: {
    alignItems: "center",
    gap: 12,
  },
  guestAvatarBig: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: Colors.light.chip,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  guestTitle: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    color: Colors.light.text,
    letterSpacing: -0.5,
  },
  guestSub: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
  authBtns: {
    marginTop: 16,
    gap: 12,
    width: "100%",
  },
  loginBtnPrimary: {
    backgroundColor: Colors.light.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  loginBtnPrimaryText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
  },
  loginBtnSecondary: {
    backgroundColor: Colors.light.chip,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.light.chipBorder,
  },
  loginBtnSecondaryText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.primary,
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.card,
    borderRadius: 18,
    padding: 20,
    gap: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  avatarLarge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.light.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
  profileInfo: {
    flex: 1,
    gap: 4,
  },
  profileName: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: Colors.light.text,
  },
  profileEmail: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
  },
  roleBadge: {
    alignSelf: "flex-start",
    backgroundColor: Colors.light.chip,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
    marginTop: 4,
  },
  roleText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.primary,
    letterSpacing: 0.5,
  },
  section: {
    gap: 6,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.textTertiary,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    paddingHorizontal: 4,
  },
  sectionCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  menuItemPressed: {
    backgroundColor: Colors.light.separator,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.light.chip,
    alignItems: "center",
    justifyContent: "center",
  },
  menuIconDanger: {
    backgroundColor: "#FEF2F2",
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    color: Colors.light.text,
  },
  menuLabelDanger: {
    color: Colors.light.error,
  },
  menuRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  menuRightText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textTertiary,
  },
  itemDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.light.border,
    marginLeft: 64,
  },
  version: {
    textAlign: "center",
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textTertiary,
    paddingBottom: 8,
  },
});
