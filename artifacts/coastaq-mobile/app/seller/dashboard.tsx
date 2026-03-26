import { Feather } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Image } from "expo-image";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React, { useState } from "react";
import {
  ActionSheetIOS,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";

const DOMAIN = process.env.EXPO_PUBLIC_DOMAIN;
type Tab = "overview" | "products" | "orders" | "settings";

interface Product {
  id: string;
  title?: string;
  name?: string;
  price: number | string;
  status: string;
  stock?: number;
  images?: string[];
  imageUrls?: string[];
  description?: string;
  condition?: string;
  location?: string;
  categoryId?: string;
}

interface Order {
  id: number;
  totalAmount: string;
  status: string;
  createdAt: string;
  buyer?: { id: string; name: string; email: string };
  items?: { product?: { title?: string; name?: string }; quantity: number; price: string }[];
}

interface Shop {
  id: string;
  name: string;
  description?: string;
  isApproved: boolean;
  subscriptionStatus?: string;
  trialEndsAt?: string;
  subscriptionCurrentPeriodEnd?: string;
}

interface SubInfo {
  status: string;
  isActive: boolean;
  trialDaysLeft: number;
  trialEndsAt?: string | null;
  subscriptionCurrentPeriodEnd?: string | null;
  planPrice: number;
}

function getImageUrl(url?: string) {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  return `https://${DOMAIN}${url}`;
}

function showAlert(title: string, msg: string) {
  if (Platform.OS === "web") window.alert(`${title}\n\n${msg}`);
  else Alert.alert(title, msg);
}

function StatusBadge({ status }: { status: string }) {
  const color =
    status === "ACTIVE" || status === "COMPLETED" || status === "APPROVED" || status === "DELIVERED"
      ? Colors.light.success
      : status === "PENDING" || status === "PAID" || status === "TRIAL"
      ? Colors.light.warning
      : status === "PROCESSING" || status === "SHIPPED"
      ? Colors.light.primary
      : Colors.light.textTertiary;

  return (
    <View style={[styles.badge, { backgroundColor: color + "20" }]}>
      <Text style={[styles.badgeText, { color }]}>{status}</Text>
    </View>
  );
}

// ── Product form modal ─────────────────────────────────────────────────────────
function ProductModal({
  visible,
  product,
  token,
  shopId,
  onClose,
  onSaved,
}: {
  visible: boolean;
  product: Product | null;
  token: string | null;
  shopId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!product;
  const [title, setTitle] = useState(product?.title ?? product?.name ?? "");
  const [price, setPrice] = useState(product ? String(product.price) : "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [location, setLocation] = useState(product?.location ?? "");
  const [condition, setCondition] = useState(product?.condition ?? "NEW");
  const [stock, setStock] = useState(product ? String(product.stock ?? 1) : "1");
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    if (visible) {
      setTitle(product?.title ?? product?.name ?? "");
      setPrice(product ? String(product.price) : "");
      setDescription(product?.description ?? "");
      setLocation(product?.location ?? "");
      setCondition(product?.condition ?? "NEW");
      setStock(product ? String(product.stock ?? 1) : "1");
    }
  }, [visible, product]);

  const handleSave = async () => {
    if (!title.trim() || !price.trim()) {
      showAlert("Missing fields", "Title and price are required.");
      return;
    }
    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      showAlert("Invalid price", "Please enter a valid price.");
      return;
    }
    setSaving(true);
    try {
      const body = {
        title: title.trim(),
        price: priceNum,
        description: description.trim(),
        location: location.trim(),
        condition,
        stock: parseInt(stock) || 1,
        shopId,
        status: "ACTIVE",
      };
      const url = isEdit
        ? `https://${DOMAIN}/api/products/${product!.id}`
        : `https://${DOMAIN}/api/products`;
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        showAlert("Error", (err as any).error ?? "Could not save product.");
        return;
      }
      onSaved();
      onClose();
    } catch {
      showAlert("Error", "Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const CONDITIONS = ["NEW", "USED", "REFURBISHED"];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <View style={modal.container}>
          <View style={modal.header}>
            <Pressable onPress={onClose} style={modal.cancelBtn}>
              <Text style={modal.cancelText}>Cancel</Text>
            </Pressable>
            <Text style={modal.title}>{isEdit ? "Edit Product" : "New Product"}</Text>
            <Pressable onPress={handleSave} disabled={saving} style={modal.saveBtn}>
              <Text style={modal.saveText}>{saving ? "Saving…" : "Save"}</Text>
            </Pressable>
          </View>
          <ScrollView style={modal.scroll} contentContainerStyle={modal.scrollContent} keyboardShouldPersistTaps="handled">
            <View style={modal.field}>
              <Text style={modal.label}>Title *</Text>
              <TextInput style={modal.input} value={title} onChangeText={setTitle} placeholder="Product title" placeholderTextColor={Colors.light.textTertiary} autoCapitalize="words" />
            </View>
            <View style={modal.field}>
              <Text style={modal.label}>Price (USD) *</Text>
              <TextInput style={modal.input} value={price} onChangeText={setPrice} placeholder="0.00" placeholderTextColor={Colors.light.textTertiary} keyboardType="decimal-pad" />
            </View>
            <View style={modal.field}>
              <Text style={modal.label}>Description</Text>
              <TextInput style={[modal.input, modal.textarea]} value={description} onChangeText={setDescription} placeholder="Describe your product…" placeholderTextColor={Colors.light.textTertiary} multiline numberOfLines={4} textAlignVertical="top" autoCapitalize="sentences" />
            </View>
            <View style={modal.field}>
              <Text style={modal.label}>Location</Text>
              <TextInput style={modal.input} value={location} onChangeText={setLocation} placeholder="e.g. Lagos, Ikeja" placeholderTextColor={Colors.light.textTertiary} autoCapitalize="words" />
            </View>
            <View style={modal.field}>
              <Text style={modal.label}>Condition</Text>
              <View style={modal.conditionRow}>
                {CONDITIONS.map((c) => (
                  <Pressable
                    key={c}
                    style={[modal.conditionChip, condition === c && modal.conditionChipActive]}
                    onPress={() => setCondition(c)}
                  >
                    <Text style={[modal.conditionChipText, condition === c && modal.conditionChipTextActive]}>{c}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
            <View style={modal.field}>
              <Text style={modal.label}>Stock quantity</Text>
              <TextInput style={modal.input} value={stock} onChangeText={setStock} keyboardType="numeric" placeholder="1" placeholderTextColor={Colors.light.textTertiary} />
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── Order detail modal ─────────────────────────────────────────────────────────
function OrderModal({ order, token, onClose, onUpdated }: {
  order: Order | null; token: string | null; onClose: () => void; onUpdated: () => void;
}) {
  const [updating, setUpdating] = useState(false);
  if (!order) return null;

  const nextStatuses = {
    PAID: ["PROCESSING"],
    PROCESSING: ["SHIPPED"],
    SHIPPED: ["DELIVERED"],
    DELIVERED: [],
    CANCELLED: [],
  } as Record<string, string[]>;

  const next = nextStatuses[order.status] ?? [];

  const updateStatus = async (status: string) => {
    setUpdating(true);
    try {
      const res = await fetch(`https://${DOMAIN}/api/orders/${order.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        showAlert("Error", "Could not update order status.");
        return;
      }
      onUpdated();
      onClose();
    } catch {
      showAlert("Error", "Network error.");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <Modal visible={!!order} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={modal.container}>
        <View style={modal.header}>
          <Pressable onPress={onClose} style={modal.cancelBtn}>
            <Text style={modal.cancelText}>Close</Text>
          </Pressable>
          <Text style={modal.title}>Order #{order.id}</Text>
          <View style={{ width: 60 }} />
        </View>
        <ScrollView style={modal.scroll} contentContainerStyle={modal.scrollContent}>
          <View style={styles.detailSection}>
            <Text style={styles.detailLabel}>Status</Text>
            <StatusBadge status={order.status} />
          </View>
          <View style={styles.detailSection}>
            <Text style={styles.detailLabel}>Buyer</Text>
            <Text style={styles.detailValue}>{order.buyer?.name ?? "Unknown"}</Text>
            {order.buyer?.email && <Text style={styles.detailSub}>{order.buyer.email}</Text>}
          </View>
          <View style={styles.detailSection}>
            <Text style={styles.detailLabel}>Items</Text>
            {(order.items ?? []).map((item, i) => (
              <View key={i} style={styles.orderItemRow}>
                <Text style={styles.orderItemName} numberOfLines={1}>
                  {item.product?.title ?? item.product?.name ?? "Product"}
                </Text>
                <Text style={styles.orderItemQty}>×{item.quantity}</Text>
                <Text style={styles.orderItemPrice}>${parseFloat(item.price).toFixed(2)}</Text>
              </View>
            ))}
          </View>
          <View style={styles.detailSection}>
            <View style={styles.rowBetween}>
              <Text style={styles.detailLabel}>Total</Text>
              <Text style={styles.orderTotalBig}>${parseFloat(order.totalAmount).toFixed(2)}</Text>
            </View>
          </View>

          {next.length > 0 && (
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Update Status</Text>
              {next.map((s) => (
                <Pressable
                  key={s}
                  style={[styles.statusUpdateBtn, updating && { opacity: 0.5 }]}
                  onPress={() => updateStatus(s)}
                  disabled={updating}
                >
                  <Feather name="arrow-right" size={16} color="#fff" />
                  <Text style={styles.statusUpdateBtnText}>Mark as {s}</Text>
                </Pressable>
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────────────────
export default function SellerDashboardScreen() {
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("overview");
  const [productModal, setProductModal] = useState<{ visible: boolean; product: Product | null }>({
    visible: false, product: null,
  });
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const topPadding = Platform.OS === "web" ? 67 : insets.top;

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

  const { data: subInfo } = useQuery<SubInfo>({
    queryKey: ["subscription-status"],
    enabled: !!token,
    queryFn: async () => {
      const res = await fetch(`https://${DOMAIN}/api/subscription/status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return null;
      return res.json();
    },
  });

  const { data: products = [], refetch: refetchProducts, isRefetching: refetchingProducts } = useQuery<Product[]>({
    queryKey: ["seller-products", shop?.id],
    enabled: !!token && !!shop?.id,
    queryFn: async () => {
      const res = await fetch(`https://${DOMAIN}/api/products?limit=100&shopId=${shop!.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const d = await res.json();
      return d.products ?? [];
    },
  });

  const { data: orders = [], refetch: refetchOrders, isRefetching: refetchingOrders } = useQuery<Order[]>({
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
    .filter((o) => ["COMPLETED", "DELIVERED", "PAID"].includes(o.status))
    .reduce((sum, o) => sum + parseFloat(o.totalAmount ?? "0"), 0);

  const deleteProduct = async (id: string) => {
    try {
      await fetch(`https://${DOMAIN}/api/products/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      qc.invalidateQueries({ queryKey: ["seller-products"] });
    } catch {
      showAlert("Error", "Could not delete product.");
    }
  };

  const confirmDelete = (product: Product) => {
    const name = product.title ?? product.name ?? "Product";
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: ["Cancel", "Delete Product"], destructiveButtonIndex: 1, cancelButtonIndex: 0, title: `Delete "${name}"?` },
        (idx) => { if (idx === 1) deleteProduct(product.id); }
      );
    } else if (Platform.OS === "web") {
      if (window.confirm(`Delete "${name}"?`)) deleteProduct(product.id);
    } else {
      Alert.alert("Delete Product", `Delete "${name}"?`, [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => deleteProduct(product.id) },
      ]);
    }
  };

  const updateShop = async (name: string, description: string) => {
    const res = await fetch(`https://${DOMAIN}/api/shops/my`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name, description }),
    });
    if (!res.ok) throw new Error("Failed to update shop");
    qc.invalidateQueries({ queryKey: ["my-shop"] });
  };

  const openSubscription = async () => {
    try {
      const res = await fetch(`https://${DOMAIN}/api/subscription/create-order`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok || !data.approvalUrl) {
        showAlert("Error", data.error ?? "Could not start subscription.");
        return;
      }
      if (Platform.OS !== "web") {
        await WebBrowser.openBrowserAsync(data.approvalUrl);
        qc.invalidateQueries({ queryKey: ["subscription-status"] });
      } else {
        window.open(data.approvalUrl, "_blank");
      }
    } catch {
      showAlert("Error", "Network error. Please try again.");
    }
  };

  // ── Overview Tab ─────────────────────────────────────────────────────────────
  const renderOverview = () => (
    <ScrollView
      style={styles.tabContent}
      contentContainerStyle={styles.tabContentInner}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refetchingProducts || refetchingOrders} onRefresh={() => { refetchProducts(); refetchOrders(); }} />}
    >
      {/* Subscription Banner */}
      {subInfo && (
        <View style={[styles.subBanner, {
          backgroundColor: subInfo.isActive
            ? subInfo.status === "TRIAL" ? "#FFFBEB" : "#ECFDF5"
            : "#FEF2F2",
        }]}>
          <Feather
            name={subInfo.isActive ? "check-circle" : "alert-triangle"}
            size={16}
            color={subInfo.isActive ? (subInfo.status === "TRIAL" ? Colors.light.warning : Colors.light.success) : "#EF4444"}
          />
          <View style={{ flex: 1 }}>
            {subInfo.status === "TRIAL" && subInfo.isActive && (
              <Text style={styles.subBannerText}>
                Free trial — {subInfo.trialDaysLeft} day{subInfo.trialDaysLeft !== 1 ? "s" : ""} remaining
              </Text>
            )}
            {subInfo.status === "ACTIVE" && (
              <Text style={styles.subBannerText}>Subscription active ✓</Text>
            )}
            {(!subInfo.isActive || subInfo.status === "EXPIRED" || subInfo.status === "CANCELLED") && (
              <>
                <Text style={[styles.subBannerText, { color: "#EF4444" }]}>Subscription expired</Text>
                <Pressable onPress={openSubscription} style={styles.subscribeBtn}>
                  <Text style={styles.subscribeBtnText}>Subscribe — $20/month</Text>
                </Pressable>
              </>
            )}
            {subInfo.status === "TRIAL" && subInfo.isActive && (
              <Pressable onPress={openSubscription} style={[styles.subscribeBtn, { marginTop: 6 }]}>
                <Text style={styles.subscribeBtnText}>Subscribe Now — $20/month</Text>
              </Pressable>
            )}
          </View>
        </View>
      )}

      {/* Shop card */}
      {shop && (
        <View style={styles.shopCard}>
          <View style={styles.shopAvatar}>
            <Text style={styles.shopAvatarText}>{(shop.name ?? "?")[0].toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.shopName}>{shop.name}</Text>
            {shop.description ? <Text style={styles.shopDesc} numberOfLines={2}>{shop.description}</Text> : null}
          </View>
          <Pressable onPress={() => setTab("settings")} style={styles.editShopBtn}>
            <Feather name="settings" size={16} color={Colors.light.textSecondary} />
          </Pressable>
        </View>
      )}

      {/* Stats */}
      <View style={styles.statsGrid}>
        {[
          { label: "Products", value: products.length, icon: "package" },
          { label: "Orders", value: orders.length, icon: "shopping-bag" },
          { label: "Revenue", value: `$${totalRevenue.toFixed(0)}`, icon: "dollar-sign" },
          { label: "Pending", value: orders.filter((o) => o.status === "PAID" || o.status === "PENDING").length, icon: "clock" },
        ].map((s) => (
          <View key={s.label} style={styles.statCard}>
            <Feather name={s.icon as any} size={18} color={Colors.light.primary} />
            <Text style={styles.statValue}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Recent orders */}
      {orders.length > 0 && (
        <View style={styles.recentSection}>
          <View style={styles.rowBetween}>
            <Text style={styles.sectionTitle}>Recent Orders</Text>
            <Pressable onPress={() => setTab("orders")}>
              <Text style={styles.seeAll}>See all</Text>
            </Pressable>
          </View>
          {orders.slice(0, 3).map((o) => (
            <Pressable key={o.id} style={styles.recentOrderRow} onPress={() => setSelectedOrder(o)}>
              <View style={{ flex: 1 }}>
                <Text style={styles.orderId}>Order #{o.id}</Text>
                <Text style={styles.orderBuyer}>{o.buyer?.name ?? "Buyer"}</Text>
              </View>
              <View style={{ alignItems: "flex-end", gap: 4 }}>
                <Text style={styles.orderTotal}>${parseFloat(o.totalAmount).toFixed(2)}</Text>
                <StatusBadge status={o.status} />
              </View>
            </Pressable>
          ))}
        </View>
      )}

      {/* Quick actions */}
      <View style={styles.quickActions}>
        <Pressable style={styles.quickActionBtn} onPress={() => setProductModal({ visible: true, product: null })}>
          <Feather name="plus-circle" size={18} color={Colors.light.primary} />
          <Text style={styles.quickActionText}>Add Product</Text>
        </Pressable>
        <Pressable style={styles.quickActionBtn} onPress={() => router.push("/seller/messages")}>
          <Feather name="message-circle" size={18} color={Colors.light.primary} />
          <Text style={styles.quickActionText}>Messages</Text>
        </Pressable>
      </View>
    </ScrollView>
  );

  // ── Products Tab ─────────────────────────────────────────────────────────────
  const renderProducts = () => (
    <View style={{ flex: 1 }}>
      <FlatList
        style={styles.tabContent}
        data={products}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={[styles.tabContentInner, { paddingBottom: 100 }]}
        refreshControl={<RefreshControl refreshing={refetchingProducts} onRefresh={refetchProducts} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Feather name="package" size={48} color={Colors.light.textTertiary} />
            <Text style={styles.emptyTitle}>No products yet</Text>
            <Text style={styles.emptySub}>Tap + to add your first listing</Text>
            <Pressable style={styles.addFirstBtn} onPress={() => setProductModal({ visible: true, product: null })}>
              <Text style={styles.addFirstBtnText}>Add First Product</Text>
            </Pressable>
          </View>
        }
        renderItem={({ item }) => {
          const imgs = item.images ?? item.imageUrls ?? [];
          const img = getImageUrl(imgs[0]);
          return (
            <View style={styles.productRow}>
              {img
                ? <Image source={{ uri: img }} style={styles.productThumb} contentFit="cover" />
                : <View style={[styles.productThumb, styles.productThumbEmpty]}>
                    <Feather name="image" size={18} color={Colors.light.textTertiary} />
                  </View>
              }
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={styles.productName} numberOfLines={2}>{item.title ?? item.name}</Text>
                <Text style={styles.productPrice}>${parseFloat(String(item.price)).toFixed(2)}</Text>
                <StatusBadge status={item.status} />
              </View>
              <View style={styles.productActions}>
                <Pressable onPress={() => setProductModal({ visible: true, product: item })} style={styles.actionIcon}>
                  <Feather name="edit-2" size={16} color={Colors.light.primary} />
                </Pressable>
                <Pressable onPress={() => confirmDelete(item)} style={styles.actionIcon}>
                  <Feather name="trash-2" size={16} color="#EF4444" />
                </Pressable>
              </View>
            </View>
          );
        }}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
      {/* FAB */}
      <Pressable
        style={styles.fab}
        onPress={() => setProductModal({ visible: true, product: null })}
      >
        <Feather name="plus" size={24} color="#fff" />
      </Pressable>
    </View>
  );

  // ── Orders Tab ───────────────────────────────────────────────────────────────
  const renderOrders = () => (
    <FlatList
      style={styles.tabContent}
      data={orders}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={styles.tabContentInner}
      refreshControl={<RefreshControl refreshing={refetchingOrders} onRefresh={refetchOrders} />}
      ListEmptyComponent={
        <View style={styles.emptyState}>
          <Feather name="shopping-bag" size={48} color={Colors.light.textTertiary} />
          <Text style={styles.emptyTitle}>No orders yet</Text>
          <Text style={styles.emptySub}>Orders from buyers will appear here</Text>
        </View>
      }
      renderItem={({ item }) => (
        <Pressable style={styles.orderRow} onPress={() => setSelectedOrder(item)}>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={styles.orderId}>Order #{item.id}</Text>
            <Text style={styles.orderBuyer}>{item.buyer?.name ?? "Buyer"}</Text>
            {(item.items ?? []).length > 0 && (
              <Text style={styles.orderItemPreview} numberOfLines={1}>
                {item.items![0].product?.title ?? item.items![0].product?.name ?? "Product"}
                {(item.items ?? []).length > 1 ? ` +${item.items!.length - 1} more` : ""}
              </Text>
            )}
            <Text style={styles.orderDate}>
              {new Date(item.createdAt).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
            </Text>
          </View>
          <View style={{ alignItems: "flex-end", gap: 6 }}>
            <Text style={styles.orderTotal}>${parseFloat(item.totalAmount).toFixed(2)}</Text>
            <StatusBadge status={item.status} />
            <Feather name="chevron-right" size={16} color={Colors.light.textTertiary} />
          </View>
        </Pressable>
      )}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
    />
  );

  // ── Settings Tab ─────────────────────────────────────────────────────────────
  const SettingsTab = () => {
    const [shopName, setShopName] = useState(shop?.name ?? "");
    const [shopDesc, setShopDesc] = useState(shop?.description ?? "");
    const [savingShop, setSavingShop] = useState(false);

    React.useEffect(() => {
      setShopName(shop?.name ?? "");
      setShopDesc(shop?.description ?? "");
    }, [shop]);

    const handleUpdateShop = async () => {
      if (!shopName.trim()) {
        showAlert("Required", "Shop name cannot be empty.");
        return;
      }
      setSavingShop(true);
      try {
        await updateShop(shopName.trim(), shopDesc.trim());
        showAlert("Saved", "Shop details updated successfully.");
      } catch {
        showAlert("Error", "Could not update shop details.");
      } finally {
        setSavingShop(false);
      }
    };

    return (
      <ScrollView style={styles.tabContent} contentContainerStyle={styles.tabContentInner} showsVerticalScrollIndicator={false}>
        <View style={styles.settingsCard}>
          <Text style={styles.sectionTitle}>Shop Details</Text>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Shop Name</Text>
            <TextInput
              style={styles.settingsInput}
              value={shopName}
              onChangeText={setShopName}
              placeholder="Shop name"
              placeholderTextColor={Colors.light.textTertiary}
              autoCapitalize="words"
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Description</Text>
            <TextInput
              style={[styles.settingsInput, styles.settingsTextarea]}
              value={shopDesc}
              onChangeText={setShopDesc}
              placeholder="Tell buyers what you sell…"
              placeholderTextColor={Colors.light.textTertiary}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              autoCapitalize="sentences"
            />
          </View>
          <Pressable
            style={[styles.saveShopBtn, savingShop && { opacity: 0.6 }]}
            onPress={handleUpdateShop}
            disabled={savingShop}
          >
            <Text style={styles.saveShopBtnText}>{savingShop ? "Saving…" : "Save Changes"}</Text>
          </Pressable>
        </View>

        {/* Subscription */}
        <View style={styles.settingsCard}>
          <Text style={styles.sectionTitle}>Subscription</Text>
          {subInfo ? (
            <>
              <View style={styles.subStatusRow}>
                <Text style={styles.fieldLabel}>Status</Text>
                <StatusBadge status={subInfo.status} />
              </View>
              {subInfo.status === "TRIAL" && subInfo.isActive && (
                <Text style={styles.subNote}>
                  Your free trial ends in {subInfo.trialDaysLeft} day{subInfo.trialDaysLeft !== 1 ? "s" : ""}.
                  Subscribe to continue selling after your trial ends.
                </Text>
              )}
              {subInfo.status === "ACTIVE" && subInfo.subscriptionCurrentPeriodEnd && (
                <Text style={styles.subNote}>
                  Renews on {new Date(subInfo.subscriptionCurrentPeriodEnd).toLocaleDateString()}
                </Text>
              )}
              {(!subInfo.isActive || ["EXPIRED", "CANCELLED"].includes(subInfo.status)) && (
                <Text style={[styles.subNote, { color: "#EF4444" }]}>
                  Your subscription is inactive. Subscribe to re-activate your listings.
                </Text>
              )}
              <Pressable style={styles.subscribeNowBtn} onPress={openSubscription}>
                <Feather name="credit-card" size={16} color="#fff" />
                <Text style={styles.subscribeNowText}>
                  {subInfo.status === "ACTIVE" ? "Manage Subscription" : "Subscribe — $20/month"}
                </Text>
              </Pressable>
            </>
          ) : (
            <Pressable style={styles.subscribeNowBtn} onPress={openSubscription}>
              <Feather name="credit-card" size={16} color="#fff" />
              <Text style={styles.subscribeNowText}>Subscribe — $20/month</Text>
            </Pressable>
          )}
        </View>

        {/* Back */}
        <Pressable style={styles.backToDashBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={16} color={Colors.light.textSecondary} />
          <Text style={styles.backToDashText}>Back</Text>
        </Pressable>
      </ScrollView>
    );
  };

  if (shopLoading) {
    return (
      <View style={[styles.container, { alignItems: "center", justifyContent: "center" }]}>
        <Text style={{ color: Colors.light.textSecondary }}>Loading dashboard…</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: topPadding }]}>
      {/* Header */}
      <View style={styles.headerBar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color={Colors.light.text} />
        </Pressable>
        <Text style={styles.headerTitle}>{shop?.name ?? "Seller Dashboard"}</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Tab bar */}
      <View style={styles.tabBar}>
        {(["overview", "products", "orders", "settings"] as Tab[]).map((t) => (
          <Pressable
            key={t}
            style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
            onPress={() => setTab(t)}
          >
            <Feather
              name={t === "overview" ? "home" : t === "products" ? "package" : t === "orders" ? "shopping-bag" : "settings"}
              size={14}
              color={tab === t ? "#fff" : Colors.light.textSecondary}
            />
            <Text style={[styles.tabBtnText, tab === t && styles.tabBtnTextActive]}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>

      {tab === "overview" && renderOverview()}
      {tab === "products" && renderProducts()}
      {tab === "orders" && renderOrders()}
      {tab === "settings" && <SettingsTab />}

      {/* Product add/edit modal */}
      <ProductModal
        visible={productModal.visible}
        product={productModal.product}
        token={token}
        shopId={shop?.id ?? ""}
        onClose={() => setProductModal({ visible: false, product: null })}
        onSaved={() => { qc.invalidateQueries({ queryKey: ["seller-products"] }); refetchProducts(); }}
      />

      {/* Order detail modal */}
      <OrderModal
        order={selectedOrder}
        token={token}
        onClose={() => setSelectedOrder(null)}
        onUpdated={() => { refetchOrders(); qc.invalidateQueries({ queryKey: ["seller-orders"] }); }}
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
  cancelBtn: { padding: 4 },
  cancelText: { fontSize: 15, fontFamily: "Inter_400Regular", color: Colors.light.textSecondary },
  title: { fontSize: 16, fontFamily: "Inter_700Bold", color: Colors.light.text },
  saveBtn: { padding: 4 },
  saveText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: Colors.light.primary },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 60, gap: 16 },
  field: { gap: 6 },
  label: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: Colors.light.text },
  input: {
    backgroundColor: Colors.light.searchBg, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 13,
    fontSize: 15, fontFamily: "Inter_400Regular", color: Colors.light.text,
    borderWidth: 1, borderColor: Colors.light.border,
  },
  textarea: { minHeight: 90, textAlignVertical: "top" },
  conditionRow: { flexDirection: "row", gap: 8 },
  conditionChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: Colors.light.searchBg, borderWidth: 1, borderColor: Colors.light.border,
  },
  conditionChipActive: { backgroundColor: Colors.light.primary, borderColor: Colors.light.primary },
  conditionChipText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: Colors.light.textSecondary },
  conditionChipTextActive: { color: "#fff" },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  headerBar: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.light.border,
    backgroundColor: Colors.light.card,
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
  tabContentInner: { paddingTop: 16, paddingBottom: 100, gap: 14 },

  subBanner: {
    flexDirection: "row", alignItems: "flex-start", gap: 10,
    borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: Colors.light.border,
  },
  subBannerText: { fontSize: 13, fontFamily: "Inter_500Medium", color: Colors.light.text },
  subscribeBtn: {
    backgroundColor: Colors.light.primary, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 6, marginTop: 6, alignSelf: "flex-start",
  },
  subscribeBtnText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#fff" },

  shopCard: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: Colors.light.card, borderRadius: 16, padding: 14,
    gap: 12, borderWidth: 1, borderColor: Colors.light.border,
  },
  shopAvatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: Colors.light.primary,
    alignItems: "center", justifyContent: "center",
  },
  shopAvatarText: { fontSize: 20, fontFamily: "Inter_700Bold", color: "#fff" },
  shopName: { fontSize: 16, fontFamily: "Inter_700Bold", color: Colors.light.text },
  shopDesc: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.light.textSecondary },
  editShopBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.light.searchBg,
    alignItems: "center", justifyContent: "center",
  },

  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  statCard: {
    flex: 1, minWidth: "45%",
    backgroundColor: Colors.light.card, borderRadius: 14, padding: 14,
    alignItems: "center", gap: 4,
    borderWidth: 1, borderColor: Colors.light.border,
  },
  statValue: { fontSize: 22, fontFamily: "Inter_700Bold", color: Colors.light.text },
  statLabel: { fontSize: 11, fontFamily: "Inter_500Medium", color: Colors.light.textSecondary },

  recentSection: {
    backgroundColor: Colors.light.card, borderRadius: 16, padding: 14,
    gap: 12, borderWidth: 1, borderColor: Colors.light.border,
  },
  sectionTitle: { fontSize: 14, fontFamily: "Inter_700Bold", color: Colors.light.text },
  seeAll: { fontSize: 13, fontFamily: "Inter_500Medium", color: Colors.light.primary },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },

  recentOrderRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingVertical: 8, gap: 8,
  },
  orderId: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: Colors.light.text },
  orderBuyer: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.light.textSecondary },
  orderItemPreview: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.light.textTertiary },
  orderDate: { fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.light.textTertiary },
  orderTotal: { fontSize: 14, fontFamily: "Inter_700Bold", color: Colors.light.text },

  quickActions: { flexDirection: "row", gap: 10 },
  quickActionBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, backgroundColor: Colors.light.primary + "15",
    borderRadius: 12, paddingVertical: 14,
    borderWidth: 1, borderColor: Colors.light.primary + "30",
  },
  quickActionText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: Colors.light.primary },

  productRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingVertical: 12, backgroundColor: Colors.light.card,
  },
  productThumb: { width: 60, height: 60, borderRadius: 10 },
  productThumbEmpty: {
    backgroundColor: Colors.light.searchBg,
    alignItems: "center", justifyContent: "center",
  },
  productName: { fontSize: 14, fontFamily: "Inter_500Medium", color: Colors.light.text },
  productPrice: { fontSize: 14, fontFamily: "Inter_700Bold", color: Colors.light.price },
  productActions: { flexDirection: "row", gap: 8 },
  actionIcon: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.light.searchBg,
    alignItems: "center", justifyContent: "center",
  },

  orderRow: {
    flexDirection: "row", alignItems: "center",
    paddingVertical: 14, gap: 12,
    backgroundColor: Colors.light.card,
  },

  emptyState: { alignItems: "center", paddingTop: 60, gap: 10 },
  emptyTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold", color: Colors.light.text },
  emptySub: { fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.light.textSecondary },
  addFirstBtn: {
    marginTop: 8, backgroundColor: Colors.light.primary,
    paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12,
  },
  addFirstBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#fff" },

  fab: {
    position: "absolute", bottom: 110, right: 20,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: Colors.light.primary,
    alignItems: "center", justifyContent: "center",
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 8, elevation: 8,
  },

  separator: { height: StyleSheet.hairlineWidth, backgroundColor: Colors.light.border },

  settingsCard: {
    backgroundColor: Colors.light.card, borderRadius: 16, padding: 16,
    gap: 14, borderWidth: 1, borderColor: Colors.light.border,
  },
  field: { gap: 6 },
  fieldLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: Colors.light.textSecondary, textTransform: "uppercase", letterSpacing: 0.5 },
  settingsInput: {
    backgroundColor: Colors.light.searchBg, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 13,
    fontSize: 15, fontFamily: "Inter_400Regular", color: Colors.light.text,
    borderWidth: 1, borderColor: Colors.light.border,
  },
  settingsTextarea: { minHeight: 80, textAlignVertical: "top" },
  saveShopBtn: {
    backgroundColor: Colors.light.primary, borderRadius: 12,
    paddingVertical: 13, alignItems: "center",
  },
  saveShopBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#fff" },
  subStatusRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  subNote: { fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.light.textSecondary, lineHeight: 20 },
  subscribeNowBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: "#003087", borderRadius: 12, paddingVertical: 13,
  },
  subscribeNowText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#fff" },
  backToDashBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingVertical: 12, justifyContent: "center",
  },
  backToDashText: { fontSize: 14, fontFamily: "Inter_500Medium", color: Colors.light.textSecondary },

  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  badgeText: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 0.3 },

  detailSection: {
    gap: 8, paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.light.border,
  },
  detailLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: Colors.light.textTertiary, textTransform: "uppercase", letterSpacing: 0.5 },
  detailValue: { fontSize: 15, fontFamily: "Inter_500Medium", color: Colors.light.text },
  detailSub: { fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.light.textSecondary },
  orderItemRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  orderItemName: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular", color: Colors.light.text },
  orderItemQty: { fontSize: 13, fontFamily: "Inter_500Medium", color: Colors.light.textSecondary },
  orderItemPrice: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: Colors.light.text },
  orderTotalBig: { fontSize: 20, fontFamily: "Inter_700Bold", color: Colors.light.price },
  statusUpdateBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: Colors.light.primary, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16,
  },
  statusUpdateBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#fff" },
});
