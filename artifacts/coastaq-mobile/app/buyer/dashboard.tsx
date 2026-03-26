import { Feather } from "@expo/vector-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
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

interface Order {
  id: number;
  totalAmount: string | number;
  status: string;
  createdAt: string;
  items?: {
    product?: { title?: string; name?: string; images?: string[] };
    quantity: number;
    price: string;
  }[];
}

interface Conversation {
  id: string;
  lastMessageAt: string;
  otherUser?: { id: string; name: string } | null;
  lastMessage?: { content: string } | null;
  product?: { id: string; title?: string; name?: string } | null;
  unreadCount: number;
}

function showAlert(title: string, msg: string) {
  if (Platform.OS === "web") window.alert(`${title}\n\n${msg}`);
  else Alert.alert(title, msg);
}

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { bg: string; color: string }> = {
    PENDING:   { bg: "#FFFBEB", color: "#D97706" },
    PAID:      { bg: "#EFF6FF", color: "#2563EB" },
    PROCESSING:{ bg: "#F5F3FF", color: "#7C3AED" },
    SHIPPED:   { bg: "#F0F9FF", color: "#0284C7" },
    DELIVERED: { bg: "#ECFDF5", color: "#059669" },
    COMPLETED: { bg: "#ECFDF5", color: "#059669" },
    CANCELLED: { bg: "#FEF2F2", color: "#DC2626" },
  };
  const c = cfg[status] ?? { bg: Colors.light.searchBg, color: Colors.light.textTertiary };
  return (
    <View style={[styles.badge, { backgroundColor: c.bg }]}>
      <Text style={[styles.badgeText, { color: c.color }]}>{status}</Text>
    </View>
  );
}

// ── Delete Account Modal ───────────────────────────────────────────────────────
function DeleteAccountModal({ visible, token, onClose, onDeleted }: {
  visible: boolean; token: string | null; onClose: () => void; onDeleted: () => void;
}) {
  const [password, setPassword] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  React.useEffect(() => { if (visible) { setPassword(""); setError(""); } }, [visible]);

  const handleDelete = async () => {
    if (!password.trim()) { setError("Please enter your password to confirm."); return; }
    setDeleting(true);
    setError("");
    try {
      const res = await fetch(`https://${DOMAIN}/api/auth/me`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to delete account."); return; }
      onDeleted();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={modal.container}>
        <View style={modal.header}>
          <Pressable onPress={onClose}><Text style={modal.cancelText}>Cancel</Text></Pressable>
          <Text style={modal.title}>Delete Account</Text>
          <View style={{ width: 60 }} />
        </View>
        <View style={[modal.content, { gap: 16 }]}>
          <View style={deleteModal.warningBox}>
            <Feather name="alert-triangle" size={20} color="#DC2626" />
            <Text style={deleteModal.warningText}>
              This will permanently delete your account, order history, and all your data. This cannot be undone.
            </Text>
          </View>
          <Text style={modal.label}>Enter your password to confirm</Text>
          <TextInput
            style={modal.input}
            value={password}
            onChangeText={(t) => { setPassword(t); setError(""); }}
            placeholder="Your password"
            placeholderTextColor={Colors.light.textTertiary}
            secureTextEntry
            autoCapitalize="none"
          />
          {error ? <Text style={deleteModal.errorText}>{error}</Text> : null}
          <Pressable
            style={[deleteModal.deleteBtn, deleting && { opacity: 0.5 }]}
            onPress={handleDelete}
            disabled={deleting}
          >
            <Feather name="trash-2" size={16} color="#fff" />
            <Text style={deleteModal.deleteBtnText}>{deleting ? "Deleting…" : "Delete My Account"}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

// ── Edit Profile Modal ─────────────────────────────────────────────────────────
function EditProfileModal({ visible, currentName, token, onClose, onSaved }: {
  visible: boolean; currentName: string; token: string | null;
  onClose: () => void; onSaved: (name: string) => void;
}) {
  const [name, setName] = useState(currentName);
  const [saving, setSaving] = useState(false);

  React.useEffect(() => { if (visible) setName(currentName); }, [visible, currentName]);

  const handleSave = async () => {
    if (!name.trim()) { showAlert("Required", "Name cannot be empty."); return; }
    setSaving(true);
    try {
      const res = await fetch(`https://${DOMAIN}/api/auth/me`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: name.trim() }),
      });
      if (!res.ok) {
        showAlert("Error", "Could not update profile.");
        return;
      }
      onSaved(name.trim());
      onClose();
    } catch {
      showAlert("Error", "Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={modal.container}>
        <View style={modal.header}>
          <Pressable onPress={onClose}><Text style={modal.cancelText}>Cancel</Text></Pressable>
          <Text style={modal.title}>Edit Profile</Text>
          <Pressable onPress={handleSave} disabled={saving}>
            <Text style={modal.saveText}>{saving ? "Saving…" : "Save"}</Text>
          </Pressable>
        </View>
        <View style={modal.content}>
          <Text style={modal.label}>Full Name</Text>
          <TextInput
            style={modal.input}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            placeholder="Your name"
            placeholderTextColor={Colors.light.textTertiary}
          />
        </View>
      </View>
    </Modal>
  );
}

// ── Order Detail Modal ─────────────────────────────────────────────────────────
function OrderDetailModal({ order, onClose }: { order: Order | null; onClose: () => void }) {
  if (!order) return null;
  return (
    <Modal visible={!!order} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={modal.container}>
        <View style={modal.header}>
          <Pressable onPress={onClose}><Text style={modal.cancelText}>Close</Text></Pressable>
          <Text style={modal.title}>Order #{order.id}</Text>
          <View style={{ width: 50 }} />
        </View>
        <ScrollView contentContainerStyle={modal.detailContent}>
          <View style={modal.detailRow}>
            <Text style={modal.detailLabel}>Status</Text>
            <StatusBadge status={order.status} />
          </View>
          <View style={modal.detailRow}>
            <Text style={modal.detailLabel}>Date</Text>
            <Text style={modal.detailValue}>{new Date(order.createdAt).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })}</Text>
          </View>
          <Text style={[modal.label, { marginTop: 12, marginBottom: 8 }]}>Items</Text>
          {(order.items ?? []).map((item, i) => (
            <View key={i} style={modal.itemRow}>
              <Text style={modal.itemName} numberOfLines={2}>{item.product?.title ?? item.product?.name ?? "Product"}</Text>
              <Text style={modal.itemQty}>×{item.quantity}</Text>
              <Text style={modal.itemPrice}>${parseFloat(item.price).toFixed(2)}</Text>
            </View>
          ))}
          <View style={modal.totalRow}>
            <Text style={modal.totalLabel}>Total</Text>
            <Text style={modal.totalAmount}>${parseFloat(String(order.totalAmount)).toFixed(2)}</Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

// ── Main Buyer Dashboard ───────────────────────────────────────────────────────
type Tab = "overview" | "orders" | "messages" | "account";

export default function BuyerDashboard() {
  const insets = useSafeAreaInsets();
  const { user, token, logout, setUser } = useAuth();
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("overview");
  const [editProfileVisible, setEditProfileVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [deleteAccountVisible, setDeleteAccountVisible] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const { data: orders = [], isRefetching: refetchingOrders, refetch: refetchOrders } = useQuery<Order[]>({
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

  const { data: convs = [], isRefetching: refetchingConvs, refetch: refetchConvs } = useQuery<Conversation[]>({
    queryKey: ["buyer-convs"],
    enabled: !!token,
    queryFn: async () => {
      const res = await fetch(`https://${DOMAIN}/api/messages/conversations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return [];
      const d = await res.json();
      return Array.isArray(d) ? d : [];
    },
  });

  const activeOrders = orders.filter((o) => !["DELIVERED", "CANCELLED", "COMPLETED"].includes(o.status));
  const unreadMessages = convs.reduce((sum, c) => sum + c.unreadCount, 0);

  const handleLogout = () => {
    if (Platform.OS === "web") {
      if (!window.confirm("Sign out of Coastaq?")) return;
      logout();
      router.replace("/");
      return;
    }
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: () => { logout(); router.replace("/"); } },
    ]);
  };

  const memberSince = "Coastaq Member";

  // ── Overview ─────────────────────────────────────────────────────────────────
  const renderOverview = () => (
    <ScrollView
      style={styles.tabContent}
      contentContainerStyle={styles.tabInner}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refetchingOrders || refetchingConvs} onRefresh={() => { refetchOrders(); refetchConvs(); }} />}
    >
      {/* Profile card */}
      <View style={styles.profileCard}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{(user?.name ?? "?").charAt(0).toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.profileName}>{user?.name}</Text>
          <Text style={styles.profileEmail}>{user?.email}</Text>
          <Text style={styles.memberSince}>Member since {memberSince}</Text>
        </View>
        <Pressable onPress={() => setEditProfileVisible(true)} style={styles.editBtn}>
          <Feather name="edit-2" size={16} color={Colors.light.textSecondary} />
        </Pressable>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>{orders.length}</Text>
          <Text style={styles.statLabel}>Total Orders</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>{activeOrders.length}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>{unreadMessages}</Text>
          <Text style={styles.statLabel}>Unread</Text>
        </View>
      </View>

      {/* Active orders */}
      {activeOrders.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Active Orders</Text>
            <Pressable onPress={() => setTab("orders")}>
              <Text style={styles.seeAll}>See all</Text>
            </Pressable>
          </View>
          {activeOrders.slice(0, 3).map((o) => (
            <Pressable key={o.id} style={styles.orderPreviewRow} onPress={() => setSelectedOrder(o)}>
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={styles.orderId}>Order #{o.id}</Text>
                <Text style={styles.orderItemPreview} numberOfLines={1}>
                  {o.items?.[0]?.product?.title ?? o.items?.[0]?.product?.name ?? "Items"}
                </Text>
              </View>
              <View style={{ alignItems: "flex-end", gap: 4 }}>
                <StatusBadge status={o.status} />
              </View>
            </Pressable>
          ))}
        </View>
      )}

      {/* Recent messages */}
      {convs.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Messages</Text>
            <Pressable onPress={() => router.push("/(tabs)/messages")}>
              <Text style={styles.seeAll}>View all</Text>
            </Pressable>
          </View>
          {convs.slice(0, 3).map((c) => (
            <Pressable
              key={c.id}
              style={styles.msgRow}
              onPress={() => router.push(`/chat/${c.id}`)}
            >
              <View style={styles.msgAvatar}>
                <Text style={styles.msgAvatarText}>{(c.otherUser?.name ?? "?").charAt(0).toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={styles.msgSeller}>{c.otherUser?.name ?? "Seller"}</Text>
                <Text style={styles.msgProduct} numberOfLines={1}>
                  {c.product?.title ?? c.product?.name ?? "Product"}
                </Text>
                {c.lastMessage && (
                  <Text style={styles.msgPreview} numberOfLines={1}>{c.lastMessage.content}</Text>
                )}
              </View>
              {c.unreadCount > 0 && (
                <View style={styles.unreadDot}>
                  <Text style={styles.unreadDotText}>{c.unreadCount}</Text>
                </View>
              )}
            </Pressable>
          ))}
        </View>
      )}

      {orders.length === 0 && convs.length === 0 && (
        <View style={styles.emptyHero}>
          <Feather name="shopping-bag" size={52} color={Colors.light.textTertiary} />
          <Text style={styles.emptyTitle}>Start shopping!</Text>
          <Text style={styles.emptySub}>Browse thousands of listings from sellers across the marketplace.</Text>
          <Pressable style={styles.browseBtn} onPress={() => router.replace("/")}>
            <Text style={styles.browseBtnText}>Browse Products</Text>
          </Pressable>
        </View>
      )}
    </ScrollView>
  );

  // ── Orders Tab ───────────────────────────────────────────────────────────────
  const renderOrders = () => (
    <FlatList
      style={styles.tabContent}
      data={orders}
      keyExtractor={(o) => String(o.id)}
      contentContainerStyle={[styles.tabInner, { paddingBottom: 100 }]}
      refreshControl={<RefreshControl refreshing={refetchingOrders} onRefresh={refetchOrders} />}
      ListEmptyComponent={
        <View style={styles.emptyHero}>
          <Feather name="shopping-bag" size={48} color={Colors.light.textTertiary} />
          <Text style={styles.emptyTitle}>No orders yet</Text>
          <Text style={styles.emptySub}>Orders you place will appear here.</Text>
          <Pressable style={styles.browseBtn} onPress={() => router.replace("/")}>
            <Text style={styles.browseBtnText}>Browse Products</Text>
          </Pressable>
        </View>
      }
      renderItem={({ item }) => (
        <Pressable style={styles.orderCard} onPress={() => setSelectedOrder(item)}>
          <View style={styles.orderCardTop}>
            <View style={{ gap: 2 }}>
              <Text style={styles.orderId}>Order #{item.id}</Text>
              <Text style={styles.orderDate}>
                {new Date(item.createdAt).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
              </Text>
            </View>
            <StatusBadge status={item.status} />
          </View>
          {(item.items ?? []).slice(0, 2).map((oi, i) => (
            <Text key={i} style={styles.orderItemPreview} numberOfLines={1}>
              • {oi.product?.title ?? oi.product?.name ?? "Product"} ×{oi.quantity}
            </Text>
          ))}
          {(item.items ?? []).length > 2 && (
            <Text style={styles.orderMore}>+{item.items!.length - 2} more items</Text>
          )}
          <View style={styles.orderCardBottom}>
            <Text style={styles.orderTotalLabel}>Total</Text>
            <Text style={styles.orderTotalAmount}>${parseFloat(String(item.totalAmount)).toFixed(2)}</Text>
          </View>
        </Pressable>
      )}
      ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
    />
  );

  // ── Messages Tab ─────────────────────────────────────────────────────────────
  const renderMessages = () => (
    <FlatList
      style={styles.tabContent}
      data={convs}
      keyExtractor={(c) => c.id}
      contentContainerStyle={[styles.tabInner, { paddingBottom: 100 }]}
      refreshControl={<RefreshControl refreshing={refetchingConvs} onRefresh={refetchConvs} />}
      ListEmptyComponent={
        <View style={styles.emptyHero}>
          <Feather name="message-circle" size={48} color={Colors.light.textTertiary} />
          <Text style={styles.emptyTitle}>No messages yet</Text>
          <Text style={styles.emptySub}>Start a conversation with a seller from any product page.</Text>
        </View>
      }
      renderItem={({ item: c }) => (
        <Pressable style={styles.convRow} onPress={() => router.push(`/chat/${c.id}`)}>
          <View style={styles.msgAvatar}>
            <Text style={styles.msgAvatarText}>{(c.otherUser?.name ?? "?").charAt(0).toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={[styles.msgSeller, c.unreadCount > 0 && { fontFamily: "Inter_700Bold" }]}>
              {c.otherUser?.name ?? "Seller"}
            </Text>
            <Text style={styles.msgProduct} numberOfLines={1}>
              {c.product?.title ?? c.product?.name ?? "Product enquiry"}
            </Text>
            {c.lastMessage && (
              <Text style={styles.msgPreview} numberOfLines={1}>{c.lastMessage.content}</Text>
            )}
          </View>
          {c.unreadCount > 0 && (
            <View style={styles.unreadDot}>
              <Text style={styles.unreadDotText}>{c.unreadCount}</Text>
            </View>
          )}
        </Pressable>
      )}
      ItemSeparatorComponent={() => <View style={styles.convSep} />}
    />
  );

  // ── Account Tab ──────────────────────────────────────────────────────────────
  const renderAccount = () => (
    <ScrollView style={styles.tabContent} contentContainerStyle={styles.tabInner} showsVerticalScrollIndicator={false}>
      <View style={styles.accountCard}>
        <View style={styles.accountAvatarRow}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{(user?.name ?? "?").charAt(0).toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.accountName}>{user?.name}</Text>
            <Text style={styles.accountEmail}>{user?.email}</Text>
          </View>
          <Pressable onPress={() => setEditProfileVisible(true)} style={styles.editBtn}>
            <Feather name="edit-2" size={16} color={Colors.light.textSecondary} />
          </Pressable>
        </View>
      </View>

      <View style={styles.menuSection}>
        <Text style={styles.menuSectionTitle}>Shopping</Text>
        <Pressable style={styles.menuItem} onPress={() => setTab("orders")}>
          <Feather name="shopping-bag" size={18} color={Colors.light.primary} />
          <Text style={styles.menuLabel}>My Orders</Text>
          <Feather name="chevron-right" size={16} color={Colors.light.textTertiary} />
        </Pressable>
        <View style={styles.menuDivider} />
        <Pressable style={styles.menuItem} onPress={() => setTab("messages")}>
          <Feather name="message-circle" size={18} color={Colors.light.primary} />
          <Text style={styles.menuLabel}>My Messages</Text>
          {unreadMessages > 0 && <View style={styles.unreadDot}><Text style={styles.unreadDotText}>{unreadMessages}</Text></View>}
          <Feather name="chevron-right" size={16} color={Colors.light.textTertiary} />
        </Pressable>
      </View>

      <View style={styles.menuSection}>
        <Text style={styles.menuSectionTitle}>Account</Text>
        <Pressable style={styles.menuItem} onPress={() => setEditProfileVisible(true)}>
          <Feather name="user" size={18} color={Colors.light.primary} />
          <Text style={styles.menuLabel}>Edit Profile</Text>
          <Feather name="chevron-right" size={16} color={Colors.light.textTertiary} />
        </Pressable>
        <View style={styles.menuDivider} />
        <Pressable style={styles.menuItem} onPress={handleLogout}>
          <Feather name="log-out" size={18} color="#EF4444" />
          <Text style={[styles.menuLabel, { color: "#EF4444" }]}>Sign Out</Text>
          <Feather name="chevron-right" size={16} color={Colors.light.textTertiary} />
        </Pressable>
      </View>

      <View style={styles.menuSection}>
        <Text style={[styles.menuSectionTitle, { color: "#DC2626" }]}>Danger Zone</Text>
        <Pressable style={styles.menuItem} onPress={() => setDeleteAccountVisible(true)}>
          <Feather name="trash-2" size={18} color="#DC2626" />
          <Text style={[styles.menuLabel, { color: "#DC2626" }]}>Delete Account</Text>
          <Feather name="chevron-right" size={16} color={Colors.light.textTertiary} />
        </Pressable>
      </View>
    </ScrollView>
  );

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      {/* Header */}
      <View style={styles.headerBar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color={Colors.light.text} />
        </Pressable>
        <Text style={styles.headerTitle}>My Dashboard</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        {([
          { key: "overview", icon: "home", label: "Overview" },
          { key: "orders", icon: "shopping-bag", label: "Orders" },
          { key: "messages", icon: "message-circle", label: "Messages" },
          { key: "account", icon: "user", label: "Account" },
        ] as const).map((t) => (
          <Pressable
            key={t.key}
            style={[styles.tabBtn, tab === t.key && styles.tabBtnActive]}
            onPress={() => setTab(t.key)}
          >
            <Feather name={t.icon} size={14} color={tab === t.key ? "#fff" : Colors.light.textSecondary} />
            <Text style={[styles.tabBtnText, tab === t.key && styles.tabBtnTextActive]}>{t.label}</Text>
          </Pressable>
        ))}
      </View>

      {tab === "overview" && renderOverview()}
      {tab === "orders" && renderOrders()}
      {tab === "messages" && renderMessages()}
      {tab === "account" && renderAccount()}

      <EditProfileModal
        visible={editProfileVisible}
        currentName={user?.name ?? ""}
        token={token}
        onClose={() => setEditProfileVisible(false)}
        onSaved={(name) => {
          if (user && setUser) setUser({ ...user, name });
          qc.invalidateQueries();
        }}
      />

      <OrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />

      <DeleteAccountModal
        visible={deleteAccountVisible}
        token={token}
        onClose={() => setDeleteAccountVisible(false)}
        onDeleted={() => { logout(); router.replace("/"); }}
      />
    </View>
  );
}

const modal = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.light.border,
  },
  cancelText: { fontSize: 15, fontFamily: "Inter_400Regular", color: Colors.light.textSecondary },
  title: { fontSize: 16, fontFamily: "Inter_700Bold", color: Colors.light.text },
  saveText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: Colors.light.primary },
  content: { paddingHorizontal: 20, paddingTop: 20, gap: 8 },
  label: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: Colors.light.text },
  input: {
    backgroundColor: Colors.light.searchBg, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 13,
    fontSize: 15, fontFamily: "Inter_400Regular", color: Colors.light.text,
    borderWidth: 1, borderColor: Colors.light.border,
  },
  detailContent: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 60, gap: 16 },
  detailRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  detailLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: Colors.light.textTertiary, textTransform: "uppercase", letterSpacing: 0.5 },
  detailValue: { fontSize: 15, fontFamily: "Inter_500Medium", color: Colors.light.text },
  itemRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 4 },
  itemName: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular", color: Colors.light.text },
  itemQty: { fontSize: 13, color: Colors.light.textSecondary, fontFamily: "Inter_500Medium" },
  itemPrice: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: Colors.light.text },
  totalRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.light.border,
  },
  totalLabel: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: Colors.light.text },
  totalAmount: { fontSize: 22, fontFamily: "Inter_700Bold", color: Colors.light.price },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  headerBar: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: Colors.light.card,
    borderBottomWidth: 1, borderBottomColor: Colors.light.border,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.light.searchBg,
    alignItems: "center", justifyContent: "center",
  },
  headerTitle: { fontSize: 17, fontFamily: "Inter_700Bold", color: Colors.light.text },
  tabBar: {
    flexDirection: "row", paddingHorizontal: 12, paddingVertical: 10,
    gap: 6, backgroundColor: Colors.light.card,
    borderBottomWidth: 1, borderBottomColor: Colors.light.border,
  },
  tabBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    paddingVertical: 8, borderRadius: 10, gap: 4,
    backgroundColor: Colors.light.searchBg,
  },
  tabBtnActive: { backgroundColor: Colors.light.primary },
  tabBtnText: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: Colors.light.textSecondary },
  tabBtnTextActive: { color: "#fff" },
  tabContent: { flex: 1, paddingHorizontal: 16 },
  tabInner: { paddingTop: 16, gap: 14 },

  profileCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: Colors.light.card, borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: Colors.light.border,
  },
  avatarCircle: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: Colors.light.primary,
    alignItems: "center", justifyContent: "center",
  },
  avatarText: { fontSize: 22, fontFamily: "Inter_700Bold", color: "#fff" },
  profileName: { fontSize: 16, fontFamily: "Inter_700Bold", color: Colors.light.text },
  profileEmail: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.light.textSecondary },
  memberSince: { fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.light.textTertiary },
  editBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.light.searchBg,
    alignItems: "center", justifyContent: "center",
  },

  statsRow: { flexDirection: "row", gap: 10 },
  statCard: {
    flex: 1, backgroundColor: Colors.light.card,
    borderRadius: 14, padding: 12, alignItems: "center", gap: 4,
    borderWidth: 1, borderColor: Colors.light.border,
  },
  statNum: { fontSize: 22, fontFamily: "Inter_700Bold", color: Colors.light.primary },
  statLabel: { fontSize: 11, fontFamily: "Inter_500Medium", color: Colors.light.textSecondary },

  section: {
    backgroundColor: Colors.light.card, borderRadius: 16, padding: 14,
    gap: 10, borderWidth: 1, borderColor: Colors.light.border,
  },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sectionTitle: { fontSize: 14, fontFamily: "Inter_700Bold", color: Colors.light.text },
  seeAll: { fontSize: 13, fontFamily: "Inter_500Medium", color: Colors.light.primary },

  orderPreviewRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingVertical: 8, gap: 8,
  },
  orderId: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: Colors.light.text },
  orderItemPreview: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.light.textSecondary },
  orderAmount: { fontSize: 14, fontFamily: "Inter_700Bold", color: Colors.light.text },

  msgRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 8 },
  msgAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.light.primary + "20",
    alignItems: "center", justifyContent: "center",
  },
  msgAvatarText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: Colors.light.primary },
  msgSeller: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: Colors.light.text },
  msgProduct: { fontSize: 12, fontFamily: "Inter_500Medium", color: Colors.light.primary },
  msgPreview: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.light.textSecondary },
  unreadDot: {
    backgroundColor: Colors.light.primary, borderRadius: 10,
    minWidth: 20, height: 20, alignItems: "center", justifyContent: "center", paddingHorizontal: 4,
  },
  unreadDotText: { fontSize: 11, fontFamily: "Inter_700Bold", color: "#fff" },

  emptyHero: { alignItems: "center", paddingTop: 60, paddingHorizontal: 40, gap: 12 },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold", color: Colors.light.text },
  emptySub: { fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.light.textSecondary, textAlign: "center", lineHeight: 20 },
  browseBtn: {
    backgroundColor: Colors.light.primary, paddingHorizontal: 24,
    paddingVertical: 12, borderRadius: 12,
  },
  browseBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#fff" },

  orderCard: {
    backgroundColor: Colors.light.card, borderRadius: 14, padding: 14,
    gap: 8, borderWidth: 1, borderColor: Colors.light.border,
  },
  orderCardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 8 },
  orderDate: { fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.light.textTertiary },
  orderMore: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.light.textTertiary },
  orderCardBottom: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingTop: 8, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.light.border,
  },
  orderTotalLabel: { fontSize: 13, fontFamily: "Inter_500Medium", color: Colors.light.textSecondary },
  orderTotalAmount: { fontSize: 18, fontFamily: "Inter_700Bold", color: Colors.light.price },

  convRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10 },
  convSep: { height: StyleSheet.hairlineWidth, backgroundColor: Colors.light.border },

  accountCard: {
    backgroundColor: Colors.light.card, borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: Colors.light.border,
  },
  accountAvatarRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  accountName: { fontSize: 16, fontFamily: "Inter_700Bold", color: Colors.light.text },
  accountEmail: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.light.textSecondary },

  menuSection: {
    backgroundColor: Colors.light.card, borderRadius: 16, padding: 4,
    borderWidth: 1, borderColor: Colors.light.border, overflow: "hidden",
  },
  menuSectionTitle: {
    fontSize: 11, fontFamily: "Inter_600SemiBold",
    color: Colors.light.textTertiary, textTransform: "uppercase",
    letterSpacing: 0.8, paddingHorizontal: 12, paddingTop: 12, paddingBottom: 4,
  },
  menuItem: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 12, paddingVertical: 14,
  },
  menuLabel: { flex: 1, fontSize: 15, fontFamily: "Inter_500Medium", color: Colors.light.text },
  menuDivider: { height: StyleSheet.hairlineWidth, backgroundColor: Colors.light.border, marginLeft: 44 },

  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  badgeText: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 0.3 },
});

const deleteModal = StyleSheet.create({
  warningBox: {
    flexDirection: "row", alignItems: "flex-start", gap: 10,
    backgroundColor: "#FEF2F2", borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: "#FECACA",
  },
  warningText: {
    flex: 1, fontSize: 13, fontFamily: "Inter_400Regular",
    color: "#DC2626", lineHeight: 20,
  },
  errorText: {
    fontSize: 13, fontFamily: "Inter_500Medium",
    color: "#DC2626",
  },
  deleteBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, backgroundColor: "#DC2626",
    borderRadius: 12, paddingVertical: 14,
  },
  deleteBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#fff" },
});
