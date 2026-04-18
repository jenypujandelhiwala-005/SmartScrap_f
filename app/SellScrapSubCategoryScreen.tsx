import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { BASE_URL, postRequest } from "../Services/axiosServices";

export default function SellScrapSubCategoryScreen() {
  const { category_id, category_name, seller_id } = useLocalSearchParams<{
    category_id?: string;
    category_name?: string;
    seller_id?: string;
  }>();

  const [subCategories, setSubCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSellModal, setShowSellModal] = useState(false);
  const [selectedSubCategory, setSelectedSubCategory] = useState<any>(null);
  const [weight, setWeight] = useState("");
  const [sellerPrice, setSellerPrice] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    if (category_id) {
      fetchSubCategories();
    }
  }, [category_id]);

  const fetchSubCategories = async () => {
    try {
      setLoading(true);

      const response = await fetch(`${BASE_URL}/ScrapPrice/Category/${category_id}`);
      const data = await response.json();

      if (data.Status === "OK") {
        setSubCategories(data.Result || []);
      } else {
        Alert.alert("Error", data.Result || "Failed to load sub categories");
      }
    } catch (error) {
      console.log("fetchSubCategories error:", error);
      Alert.alert("Error", "Could not load sub categories");
    } finally {
      setLoading(false);
    }
  };

  const openSellModal = (item: any) => {
    setSelectedSubCategory(item);
    setWeight("");
    setSellerPrice(String(item.price_per_kg || ""));
    setShowSellModal(true);
  };

  const minPrice = Number(selectedSubCategory?.price_per_kg || 0);

  const totalPrice = useMemo(() => {
    const qty = parseFloat(weight) || 0;
    const price = parseFloat(sellerPrice) || 0;
    return (qty * price).toFixed(2);
  }, [weight, sellerPrice]);

  const handleSellScrap = async () => {
    if (!selectedSubCategory) return;

    if (!weight.trim() || !sellerPrice.trim()) {
      Alert.alert("Validation", "Please enter weight and price");
      return;
    }

    if (isNaN(Number(weight)) || Number(weight) <= 0) {
      Alert.alert("Validation", "Please enter valid weight");
      return;
    }

    if (isNaN(Number(sellerPrice)) || Number(sellerPrice) <= 0) {
      Alert.alert("Validation", "Please enter valid price");
      return;
    }

    if (Number(sellerPrice) < minPrice) {
      Alert.alert(
        "Invalid Price",
        `Price cannot be lower than admin minimum price ₹${minPrice}/kg`
      );
      return;
    }

    if (!seller_id) {
      Alert.alert("Error", "Seller ID not found. Please login again.");
      return;
    }

    try {
      setSubmitLoading(true);

      const payload = {
        seller_id: seller_id,
        category_id: category_id,
        sub_category_id: selectedSubCategory.sub_category_id,
        quantity: Number(weight),
        seller_price_per_kg: Number(sellerPrice),
      };

      console.log("SELLER STOCK PAYLOAD:", payload);

      const response = await postRequest("/seller-stock", payload, false);

      console.log("SELLER STOCK RESPONSE:", response);

      if (response?.Status === "OK") {
        Alert.alert("Success", response.Result || "Scrap added successfully");
        setShowSellModal(false);
        setWeight("");
        setSellerPrice("");
      } else {
        Alert.alert("Error", response?.Result || "Failed to add scrap");
      }
    } catch (error) {
      console.log("handleSellScrap error:", error);
      Alert.alert("Error", "Could not submit scrap");
    } finally {
      setSubmitLoading(false);
    }
  };

  const renderSubCategory = ({ item }: { item: any }) => {
    const imageUrl = item.sub_category_image
      ? `${BASE_URL}${item.sub_category_image}`
      : null;

    return (
      <TouchableOpacity
        style={styles.gridCard}
        activeOpacity={0.9}
        onPress={() => openSellModal(item)}
      >
        <View style={styles.imageWrapper}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.gridImage} />
          ) : (
            <View style={styles.noImageBox}>
              <Ionicons name="image-outline" size={28} color="#7a7a7a" />
            </View>
          )}
        </View>

        <View style={styles.cardContent}>
          <Text style={styles.subName} numberOfLines={2}>
            {item.sub_category_name}
          </Text>

          <Text style={styles.minPriceText}>₹ {item.price_per_kg}/kg</Text>

          <View style={styles.sellNowBtn}>
            <Text style={styles.sellNowText}>Sell Now</Text>
            <Ionicons name="arrow-forward" size={16} color="#2D5A48" />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={26} color="#2D4F44" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Sub Categories</Text>
        </View>

        <View style={styles.topCard}>
          <Text style={styles.topLabel}>Selected Category</Text>
          <Text style={styles.topTitle}>{category_name}</Text>
          <Text style={styles.topSub}>
            Choose one sub category to continue selling
          </Text>
        </View>

        {loading ? (
          <ActivityIndicator
            size="large"
            color="#2D624C"
            style={{ marginTop: 40 }}
          />
        ) : (
          <FlatList
            data={subCategories}
            keyExtractor={(item, index) =>
              item.price_id?.toString() || index.toString()
            }
            renderItem={renderSubCategory}
            numColumns={2}
            columnWrapperStyle={styles.row}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}

        <Modal
          visible={showSellModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowSellModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {selectedSubCategory?.sub_category_name}
                </Text>
                <TouchableOpacity onPress={() => setShowSellModal(false)}>
                  <Ionicons name="close" size={22} color="#333" />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalHint}>
                Enter scrap weight and set your selling price.
              </Text>

              <View style={styles.priceRuleBox}>
                <Text style={styles.priceRuleLabel}>Admin Minimum Price</Text>
                <Text style={styles.priceRuleValue}>₹ {minPrice}/kg</Text>
              </View>

              <TextInput
                style={styles.input}
                placeholder="Enter weight in kg"
                placeholderTextColor="#888"
                keyboardType="numeric"
                value={weight}
                onChangeText={setWeight}
              />

              <View style={styles.priceInputCard}>
                <Text style={styles.inputLabel}>Your Selling Price (₹ / kg)</Text>
                <View style={styles.priceInputRow}>
                  <Text style={styles.rupeeSymbol}>₹</Text>
                  <TextInput
                    style={styles.priceInput}
                    placeholder="Enter price"
                    placeholderTextColor="#999"
                    keyboardType="numeric"
                    value={sellerPrice}
                    onChangeText={setSellerPrice}
                  />
                </View>
              </View>

              {sellerPrice !== "" && Number(sellerPrice) < minPrice && (
                <Text style={styles.errorText}>
                  Price cannot be lower than ₹ {minPrice}/kg
                </Text>
              )}

              <View style={styles.totalBox}>
                <Text style={styles.totalLabel}>Estimated Total</Text>
                <Text style={styles.totalValue}>₹ {totalPrice}</Text>
              </View>

              <TouchableOpacity
                activeOpacity={0.9}
                style={styles.submitBtnContainer}
                onPress={handleSellScrap}
                disabled={submitLoading}
              >
                <LinearGradient
                  colors={["#4F8C73", "#2D5A48"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.submitBtn}
                >
                  {submitLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Ionicons
                        name="add-circle-outline"
                        size={22}
                        color="#FFF"
                      />
                      <Text style={styles.submitBtnText}>Continue</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F2F7F4" },
  safeArea: { flex: 1 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    position: "relative",
    height: 60,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#2D4F44",
    position: "absolute",
    left: 0,
    right: 0,
    textAlign: "center",
    zIndex: 1,
  },

  topCard: {
    backgroundColor: "#E4EDE8",
    marginHorizontal: 15,
    borderRadius: 25,
    padding: 20,
    marginBottom: 18,
  },
  topLabel: {
    fontSize: 13,
    color: "#7A8C85",
    marginBottom: 4,
  },
  topTitle: {
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
    paddingBottom: 24,
  },
  row: {
    justifyContent: "space-between",
    marginBottom: 14,
  },

  gridCard: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 4,
  },

  imageWrapper: {
    width: "100%",
    height: 120,
    backgroundColor: "#EEF4F0",
    alignItems: "center",
    justifyContent: "center",
  },
  gridImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  noImageBox: {
    width: 70,
    height: 70,
    borderRadius: 18,
    backgroundColor: "#E5ECE8",
    alignItems: "center",
    justifyContent: "center",
  },

  cardContent: {
    padding: 12,
  },
  subName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#243B33",
    minHeight: 40,
  },
  minPriceText: {
    marginTop: 6,
    color: "#4F8C73",
    fontSize: 14,
    fontWeight: "700",
  },

  sellNowBtn: {
    marginTop: 12,
    backgroundColor: "#F3F8F4",
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sellNowText: {
    color: "#2D5A48",
    fontSize: 13,
    fontWeight: "700",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 18,
  },
  modalCard: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 26,
    padding: 18,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#2D4F44",
    flex: 1,
    marginRight: 10,
  },
  modalHint: {
    marginTop: 8,
    marginBottom: 14,
    color: "#6B7B74",
    fontSize: 13,
    lineHeight: 19,
  },

  priceRuleBox: {
    backgroundColor: "#F3F8F4",
    borderWidth: 1,
    borderColor: "#E3ECE6",
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  priceRuleLabel: {
    fontSize: 13,
    color: "#7B8A82",
    marginBottom: 4,
  },
  priceRuleValue: {
    fontSize: 20,
    fontWeight: "800",
    color: "#2D4F44",
  },

  input: {
    backgroundColor: "#F9FBFA",
    borderWidth: 1.5,
    borderColor: "#EBF2EE",
    borderRadius: 15,
    paddingHorizontal: 15,
    height: 55,
    marginBottom: 12,
    fontSize: 16,
    color: "#333",
  },

  priceInputCard: {
    backgroundColor: "#F3F8F4",
    borderWidth: 1,
    borderColor: "#E3ECE6",
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 13,
    color: "#7B8A82",
    marginBottom: 6,
    fontWeight: "600",
  },
  priceInputRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  rupeeSymbol: {
    fontSize: 20,
    fontWeight: "800",
    color: "#2D4F44",
    marginRight: 6,
  },
  priceInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
    color: "#2D4F44",
    paddingVertical: 4,
  },

  errorText: {
    color: "#c62828",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 10,
  },

  totalBox: {
    backgroundColor: "#F3F8F4",
    borderWidth: 1,
    borderColor: "#E3ECE6",
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  totalLabel: {
    fontSize: 13,
    color: "#7B8A82",
    marginBottom: 4,
  },
  totalValue: {
    fontSize: 28,
    fontWeight: "800",
    color: "#2D4F44",
  },

  submitBtnContainer: {
    marginTop: 8,
  },
  submitBtn: {
    flexDirection: "row",
    height: 56,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  submitBtnText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 10,
  },
});