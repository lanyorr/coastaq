import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import React, { useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ProductCard } from "@/components/ProductCard";
import { SkeletonCard } from "@/components/SkeletonCard";
import Colors from "@/constants/colors";

const { width } = Dimensions.get("window");
const COLUMN_GAP = 12;
const HORIZONTAL_PADDING = 16;
const CARD_WIDTH = (width - HORIZONTAL_PADDING * 2 - COLUMN_GAP) / 2;
const DOMAIN = process.env.EXPO_PUBLIC_DOMAIN;

interface Product {
  id: string;
  title?: string;
  name?: string;
  price: number | string;
  images?: string[];
  imageUrls?: string[];
  location?: string;
  shop?: { name: string };
}

interface ProductsResponse {
  products: Product[];
  total: number;
  totalPages: number;
}

const SORT_OPTIONS = [
  { label: "Newest", value: "newest" },
  { label: "Price: Low", value: "price_asc" },
  { label: "Price: High", value: "price_desc" },
];

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [sort, setSort] = useState("newest");
  const inputRef = useRef<TextInput>(null);
  const topPadding = Platform.OS === "web" ? 67 : insets.top;

  const { data, isLoading } = useQuery<ProductsResponse>({
    queryKey: ["search", submittedQuery, sort],
    enabled: submittedQuery.length > 0,
    queryFn: async () => {
      let url = `https://${DOMAIN}/api/products?limit=24&search=${encodeURIComponent(submittedQuery)}`;
      if (sort === "price_asc") url += "&sortBy=price&sortDir=asc";
      if (sort === "price_desc") url += "&sortBy=price&sortDir=desc";
      const res = await fetch(url);
      return res.json();
    },
    staleTime: 30000,
  });

  const handleSubmit = () => {
    setSubmittedQuery(query.trim());
  };

  const handleClear = () => {
    setQuery("");
    setSubmittedQuery("");
    inputRef.current?.focus();
  };

  const products = data?.products ?? [];

  const renderHeader = () => (
    <View style={[styles.header, { paddingTop: topPadding + 8 }]}>
      <View style={styles.searchRow}>
        <View style={styles.searchInputContainer}>
          <Feather name="search" size={16} color={Colors.light.textTertiary} />
          <TextInput
            ref={inputRef}
            style={styles.searchInput}
            placeholder="Search products…"
            placeholderTextColor={Colors.light.textTertiary}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSubmit}
            returnKeyType="search"
            autoFocus={false}
            clearButtonMode="while-editing"
          />
          {query.length > 0 && Platform.OS !== "ios" && (
            <Pressable onPress={handleClear}>
              <Feather name="x" size={16} color={Colors.light.textTertiary} />
            </Pressable>
          )}
        </View>
        {query.length > 0 && (
          <Pressable style={styles.searchBtn} onPress={handleSubmit}>
            <Text style={styles.searchBtnText}>Search</Text>
          </Pressable>
        )}
      </View>
      {submittedQuery.length > 0 && (
        <View style={styles.sortRow}>
          {SORT_OPTIONS.map((opt) => (
            <Pressable
              key={opt.value}
              style={[styles.sortChip, sort === opt.value && styles.sortChipActive]}
              onPress={() => setSort(opt.value)}
            >
              <Text
                style={[
                  styles.sortChipText,
                  sort === opt.value && styles.sortChipTextActive,
                ]}
              >
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
      {submittedQuery.length > 0 && data && (
        <Text style={styles.resultsCount}>
          {data.total ?? products.length} result{(data.total ?? products.length) !== 1 ? "s" : ""} for "{submittedQuery}"
        </Text>
      )}
    </View>
  );

  if (submittedQuery.length === 0) {
    return (
      <View style={styles.container}>
        {renderHeader()}
        <View style={styles.emptyState}>
          <Feather name="search" size={52} color={Colors.light.textTertiary} />
          <Text style={styles.emptyTitle}>Search Coastaq</Text>
          <Text style={styles.emptySubtitle}>Find products from verified sellers</Text>
        </View>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.container}>
        {renderHeader()}
        <View style={styles.skeletonGrid}>
          {[...Array(6)].map((_, i) => (
            <SkeletonCard key={i} width={CARD_WIDTH} />
          ))}
        </View>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      data={products}
      keyExtractor={(item) => String(item.id)}
      numColumns={2}
      columnWrapperStyle={styles.row}
      contentContainerStyle={[
        styles.listContent,
        { paddingBottom: Platform.OS === "web" ? 100 : 100 },
      ]}
      ListHeaderComponent={renderHeader}
      renderItem={({ item }) => <ProductCard product={item} width={CARD_WIDTH} />}
      ListEmptyComponent={
        <View style={styles.emptyState}>
          <Feather name="frown" size={48} color={Colors.light.textTertiary} />
          <Text style={styles.emptyTitle}>No results</Text>
          <Text style={styles.emptySubtitle}>
            Try a different search term
          </Text>
        </View>
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
  header: {
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingBottom: 8,
    backgroundColor: Colors.light.background,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.searchBg,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: Colors.light.text,
  },
  searchBtn: {
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  searchBtnText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
  },
  sortRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
  },
  sortChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: Colors.light.chip,
    borderWidth: 1,
    borderColor: Colors.light.chipBorder,
  },
  sortChipActive: {
    backgroundColor: Colors.light.activeChip,
    borderColor: Colors.light.activeChip,
  },
  sortChipText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: Colors.light.chipText,
  },
  sortChipTextActive: {
    color: "#fff",
  },
  resultsCount: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
    marginBottom: 8,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.text,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
    textAlign: "center",
  },
  skeletonGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: HORIZONTAL_PADDING,
    gap: COLUMN_GAP,
  },
  listContent: {
    paddingHorizontal: HORIZONTAL_PADDING,
    backgroundColor: Colors.light.background,
  },
  row: {
    gap: COLUMN_GAP,
  },
});
