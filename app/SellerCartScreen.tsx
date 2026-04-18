import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { BASE_URL, getRequest } from "../Services/axiosServices";

export default function SellerCartScreen() {
  const router = useRouter();

  const params = useLocalSearchParams<{
    seller_id?: string;
    name?: string;
    address?: string;
  }>();

  const sellerId =
    typeof params.seller_id === "string" ? params.seller_id : "";

  const sellerName =
    typeof params.name === "string" && params.name.trim() !== ""
      ? params.name
      : "Seller";

  const [cartItems, setCartItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalAmount, setTotalAmount] = useState(0);

  const fetchCartItems = async () => {
    try {
      if (!sellerId) return;

      setLoading(true);

      const response = await getRequest(`/seller-stock/${sellerId}`, false);

      if (response?.Status === "OK") {
        const items = response.Result || [];
        setCartItems(items);

        const total = items.reduce(
          (sum: number, item: any) => sum + Number(item.estimated_price || 0),
          0
        );
        setTotalAmount(total);
      } else {
        setCartItems([]);
        setTotalAmount(0);
      }
    } catch (error) {
      console.log("fetchCartItems error:", error);
      setCartItems([]);
      setTotalAmount(0);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchCartItems();
    }, [sellerId])
  );

  const renderItem = ({ item }: { item: any }) => {
    const imageUrl = item.sub_category_image
      ? `${BASE_URL}${item.sub_category_image}`
      : null;

    return (
      <View style={styles.cartCard}>
        <View style={styles.imageBox}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.itemImage} />
          ) : (
            <View style={styles.noImageBox}>
              <Ionicons name="image-outline" size={26} color="#7a7a7a" />
            </View>
          )}
        </View>

        <View style={styles.itemContent}>
          <Text style={styles.itemName} numberOfLines={2}>
            {item.sub_category_name || "Sub Category"}
          </Text>

          <Text style={styles.itemWeight}>
            Weight: {item.quantity} {item.unit || "kg"}
          </Text>

          <Text style={styles.itemPrice}>
            Estimated Price: ₹ {Number(item.estimated_price || 0).toFixed(2)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <LinearGradient
      colors={["#dff5e4", "#bde8c4", "#a9ddb3"]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#244233" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>My Cart</Text>

          <View style={{ width: 40 }} />
        </View>

        <View style={styles.topCard}>
          <Text style={styles.topLabel}>Seller</Text>
          <Text style={styles.topName}>{sellerName}</Text>
          <Text style={styles.topSub}>View all sold scrap items here</Text>
        </View>

        {loading ? (
          <ActivityIndicator
            size="large"
            color="#2D624C"
            style={{ marginTop: 40 }}
          />
        ) : cartItems.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyTitle}>Your cart is empty</Text>
            <Text style={styles.emptySub}>
              Sell scrap to see items here
            </Text>
          </View>
        ) : (
          <FlatList
            data={cartItems}
            keyExtractor={(item, index) =>
              item.stock_id?.toString() || index.toString()
            }
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}

        <View style={styles.bottomBox}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Estimated Price</Text>
            <Text style={styles.totalValue}>₹ {totalAmount.toFixed(2)}</Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() =>
              router.push({
                pathname: "/SellScrapCategoriesScreen",
                params: {
                  seller_id: sellerId,
                  name: sellerName,
                  address: typeof params.address === "string" ? params.address : "",
                },
              })
            }
          >
            <LinearGradient
              colors={["#4F8C73", "#2D5A48"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.sellBtn}
            >
              <Ionicons name="add-circle-outline" size={22} color="#fff" />
              <Text style={styles.sellBtnText}>Sell Scrap</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
  },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },

  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#244233",
  },

  topCard: {
    backgroundColor: "#E4EDE8",
    marginHorizontal: 15,
    borderRadius: 24,
    padding: 18,
    marginBottom: 14,
  },

  topLabel: {
    fontSize: 13,
    color: "#7A8C85",
    marginBottom: 4,
  },

  topName: {
    fontSize: 22,
    fontWeight: "800",
    color: "#2D4F44",
  },

  topSub: {
    fontSize: 14,
    color: "#7A8C85",
    marginTop: 4,
  },

  listContent: {
    paddingHorizontal: 15,
    paddingBottom: 140,
  },

  cartCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 12,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 3,
  },

  imageBox: {
    width: 90,
    height: 90,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#EEF4F0",
    marginRight: 12,
  },

  itemImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },

  noImageBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  itemContent: {
    flex: 1,
    justifyContent: "center",
  },

  itemName: {
    fontSize: 16,
    fontWeight: "800",
    color: "#243B33",
    marginBottom: 8,
  },

  itemWeight: {
    fontSize: 14,
    color: "#617161",
    marginBottom: 6,
    fontWeight: "600",
  },

  itemPrice: {
    fontSize: 15,
    color: "#2D5A48",
    fontWeight: "800",
  },

  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
  },

  emptyTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#2D4F44",
    marginBottom: 8,
  },

  emptySub: {
    fontSize: 15,
    color: "#6B7B74",
    textAlign: "center",
  },

  bottomBox: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 18,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: -3 },
    shadowRadius: 10,
    elevation: 10,
  },

  totalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },

  totalLabel: {
    fontSize: 15,
    color: "#617161",
    fontWeight: "700",
  },

  totalValue: {
    fontSize: 22,
    color: "#244233",
    fontWeight: "900",
  },

  sellBtn: {
    height: 56,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },

  sellBtnText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
    marginLeft: 10,
  },
});