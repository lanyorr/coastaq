import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  Dimensions,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
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

interface Category {
  id: number;
  name: string;
}

interface Product {
  id: string;
  title?: string;
  name?: string;
  price: number | string;
  images?: string[];
  imageUrls?: string[];
  location?: string;
  shop?: { name: string };
  category?: { name: string } | null;
}

interface ProductsResponse {
  products: Product[];
  total: number;
  totalPages: number;
  page: number;
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await fetch(`https://${DOMAIN}/api/categories`);
      const d = await res.json();
      return Array.isArray(d) ? d : (d.categories ?? []);
    },
    staleTime: 60000,
  });

  const buildUrl = useCallback(
    (p: number, catId: number | null) => {
      let url = `https://${DOMAIN}/api/products?limit=24&page=${p}`;
      if (catId) url += `&categoryId=${catId}`;
      return url;
    },
    []
  );

  const { isLoading, refetch } = useQuery<ProductsResponse>({
    queryKey: ["products", "home", selectedCategory],
    queryFn: async () => {
      const res = await fetch(buildUrl(1, selectedCategory));
      const d: ProductsResponse = await res.json();
      setAllProducts(d.products ?? []);
      setPage(1);
      setHasMore((d.page ?? 1) < (d.totalPages ?? 1));
      return d;
    },
    staleTime: 30000,
  });

  const handleCategoryPress = (id: number | null) => {
    setSelectedCategory(id);
    setAllProducts([]);
    setPage(1);
    setHasMore(true);
  };

  const loadMore = async () => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    const nextPage = page + 1;
    try {
      const res = await fetch(buildUrl(nextPage, selectedCategory));
      const d: ProductsResponse = await res.json();
      setAllProducts((prev) => [...prev, ...(d.products ?? [])]);
      setPage(nextPage);
      setHasMore(nextPage < (d.totalPages ?? 1));
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setPage(1);
    setAllProducts([]);
    setHasMore(true);
    await refetch();
    setRefreshing(false);
  };

  const topPadding = Platform.OS === "web" ? 67 : insets.top;

  const renderHeader = () => (
    <View style={[styles.header, { paddingTop: topPadding + 8 }]}>
      <View style={styles.topRow}>
        <View>
          <Text style={styles.logoText}>Coastaq</Text>
          <Text style={styles.subGreeting}>Find what you need</Text>
        </View>
      </View>
      <Pressable
        style={styles.searchBarTouchable}
        onPress={() => router.push("/search")}
      >
        <Feather name="search" size={16} color={Colors.light.textTertiary} />
        <Text style={styles.searchPlaceholder}>Search products…</Text>
      </Pressable>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesContainer}
        style={styles.categories}
      >
        <Pressable
          style={[styles.chip, selectedCategory === null && styles.chipActive]}
          onPress={() => handleCategoryPress(null)}
        >
          <Text
            style={[
              styles.chipText,
              selectedCategory === null && styles.chipTextActive,
            ]}
          >
            All
          </Text>
        </Pressable>
        {(categories ?? []).map((cat) => (
          <Pressable
            key={cat.id}
            style={[
              styles.chip,
              selectedCategory === cat.id && styles.chipActive,
            ]}
            onPress={() => handleCategoryPress(cat.id)}
          >
            <Text
              style={[
                styles.chipText,
                selectedCategory === cat.id && styles.chipTextActive,
              ]}
            >
              {cat.name}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );

  if (isLoading && allProducts.length === 0) {
    return (
      <View style={styles.fullContainer}>
        {renderHeader()}
        <View style={styles.skeletonGrid}>
          {[...Array(8)].map((_, i) => (
            <SkeletonCard key={i} width={CARD_WIDTH} />
          ))}
        </View>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.fullContainer}
      data={allProducts}
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
        <View style={styles.empty}>
          <Feather name="box" size={48} color={Colors.light.textTertiary} />
          <Text style={styles.emptyText}>No products found</Text>
        </View>
      }
      onEndReached={loadMore}
      onEndReachedThreshold={0.3}
      scrollEnabled={!!allProducts.length}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
      showsVerticalScrollIndicator={false}
      ListFooterComponent={
        isLoadingMore ? (
          <View style={styles.loadingMore}>
            <Text style={styles.loadingMoreText}>Loading more…</Text>
          </View>
        ) : null
      }
      contentInsetAdjustmentBehavior="automatic"
    />
  );
}

const styles = StyleSheet.create({
  fullContainer: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    backgroundColor: Colors.light.background,
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingBottom: 8,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  logoText: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    color: Colors.light.primary,
    letterSpacing: -1,
  },
  subGreeting: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
    marginTop: 1,
  },
  searchBarTouchable: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.searchBg,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 8,
    marginBottom: 12,
  },
  searchPlaceholder: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textTertiary,
  },
  categories: {
    marginBottom: 12,
  },
  categoriesContainer: {
    gap: 8,
    paddingRight: 4,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.light.chip,
    borderWidth: 1,
    borderColor: Colors.light.chipBorder,
  },
  chipActive: {
    backgroundColor: Colors.light.activeChip,
    borderColor: Colors.light.activeChip,
  },
  chipText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: Colors.light.chipText,
  },
  chipTextActive: {
    color: Colors.light.activeChipText,
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
  empty: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
  },
  loadingMore: {
    alignItems: "center",
    paddingVertical: 20,
  },
  loadingMoreText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textTertiary,
  },
});
