import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  Modal,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { BASE_URL, getRequest, postRequest } from "../Services/axiosServices";

const { width } = Dimensions.get("window");

type TabType = "sell" | "cart";

const SLOT_OPTIONS = [
  "09:00 AM - 11:00 AM",
  "11:00 AM - 01:00 PM",
  "02:00 PM - 04:00 PM",
  "04:00 PM - 06:00 PM",
];

export default function SellerPublicSellScreen() {
  const router = useRouter();

  const params = useLocalSearchParams<{
    seller_id?: string;
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    latitude?: string;
    longitude?: string;
    initialTab?: string;
  }>();

  const sellerId =
    typeof params.seller_id === "string" ? params.seller_id : "";

  const [activeTab, setActiveTab] = useState<TabType>(
    params.initialTab === "cart" ? "cart" : "sell"
  );

  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [loadingCategories, setLoadingCategories] = useState(true);

  const [cartItems, setCartItems] = useState<any[]>([]);
  const [loadingCart, setLoadingCart] = useState(true);
  const [totalAmount, setTotalAmount] = useState(0);

  const [publishModalVisible, setPublishModalVisible] = useState(false);
  const [pickupDate, setPickupDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [note, setNote] = useState("");
  const [publishing, setPublishing] = useState(false);

  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchCartItems();
    }, [sellerId])
  );

  useEffect(() => {
    if (activeTab === "cart") {
      fetchCartItems();
    }
  }, [activeTab]);

  const totalItems = useMemo(() => cartItems.length, [cartItems]);

  const formatPickupDate = (date: Date | null) => {
    if (!date) return "";
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const toBackendDate = (date: Date | null) => {
    if (!date) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);

      const response = await fetch(`${BASE_URL}/Category`);
      const data = await response.json();

      if (data.Status === "OK") {
        const activeCategories = (data.Result || []).filter(
          (item: any) => item.is_active
        );
        setCategories(activeCategories);
      } else {
        setCategories([]);
      }
    } catch (error) {
      console.log("fetchCategories error:", error);
      setCategories([]);
    } finally {
      setLoadingCategories(false);
    }
  };

  const fetchCartItems = async () => {
    try {
      if (!sellerId) {
        setCartItems([]);
        setTotalAmount(0);
        return;
      }

      setLoadingCart(true);

      const response = await getRequest(`/seller-stock/${sellerId}`, false);

      if (response?.Status === "OK") {
        const items = (response.Result || []).filter(
          (item: any) =>
            item.public_posted !== true &&
            (item.cart_status === "cart" ||
              item.cart_status === "draft" ||
              !item.cart_status)
        );

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
      setLoadingCart(false);
    }
  };

  const handleSelectCategory = (item: any) => {
    if (!item?.categoryid) {
      Alert.alert("Error", "Category ID not found");
      return;
    }

    if (!sellerId) {
      Alert.alert("Error", "Seller ID not found. Please login again.");
      return;
    }

    setSelectedCategoryId(item.categoryid);

    router.push({
      pathname: "/SellScrapSubCategoryScreen",
      params: {
        category_id: String(item.categoryid),
        category_name: String(item.category_name || ""),
        seller_id: String(sellerId),
        name: typeof params.name === "string" ? params.name : "",
        email: typeof params.email === "string" ? params.email : "",
        phone: typeof params.phone === "string" ? params.phone : "",
        address: typeof params.address === "string" ? params.address : "",
        latitude: typeof params.latitude === "string" ? params.latitude : "",
        longitude: typeof params.longitude === "string" ? params.longitude : "",
      },
    });
  };

  const openPublishModal = () => {
    if (!cartItems.length) {
      Alert.alert("Cart Empty", "Please add scrap items before selling.");
      return;
    }
    setPublishModalVisible(true);
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);

    if (event?.type === "dismissed") return;
    if (!selectedDate) return;

    const today = new Date();
    const todayOnly = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );
    const pickedOnly = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate()
    );

    if (pickedOnly < todayOnly) {
      Alert.alert("Invalid Date", "Please select today or a future date.");
      return;
    }

    setPickupDate(selectedDate);
  };

  const handlePublishScrap = async () => {
    try {
      if (!sellerId) {
        Alert.alert("Error", "Seller ID not found.");
        return;
      }

      if (!pickupDate) {
        Alert.alert("Validation", "Please select pickup date.");
        return;
      }

      if (!selectedSlot.trim()) {
        Alert.alert("Validation", "Please select a pickup time slot.");
        return;
      }

      setPublishing(true);

      const response = await postRequest("/seller-public/create", {
        seller_id: sellerId,
        pickup_date: toBackendDate(pickupDate),
        pickup_time: selectedSlot,
        note: note,
      });

      if (response?.Status === "OK") {
        Alert.alert("Success", "Your scrap has been published successfully.");
        setPublishModalVisible(false);
        setPickupDate(null);
        setSelectedSlot("");
        setNote("");
        fetchCartItems();
      } else {
        Alert.alert(
          "Failed",
          response?.Result || "Unable to publish scrap post."
        );
      }
    } catch (error) {
      console.log("handlePublishScrap error:", error);
      Alert.alert("Error", "Something went wrong while publishing.");
    } finally {
      setPublishing(false);
    }
  };

  const renderCategoryItem = ({ item }: { item: any }) => {
    const isSelected = selectedCategoryId === item.categoryid;
    const imageUrl = item.image ? `${BASE_URL}${item.image}` : null;

    return (
      <Pressable
        android_ripple={{ color: "#dcebe1" }}
        style={styles.categoryCardWrap}
        onPress={() => handleSelectCategory(item)}
      >
        {isSelected ? (
          <LinearGradient
            colors={["#6DB18A", "#3E7E63", "#2D624C"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.categoryItemSelected}
          >
            <View style={styles.imageContainerSelected}>
              {imageUrl ? (
                <Image source={{ uri: imageUrl }} style={styles.categoryImage} />
              ) : (
                <MaterialCommunityIcons
                  name="image-outline"
                  size={38}
                  color="#fff"
                />
              )}
            </View>

            <Text style={styles.categoryLabelSelected} numberOfLines={2}>
              {item.category_name}
            </Text>

            <Text style={styles.tapTextSelected}>Tap to continue</Text>
          </LinearGradient>
        ) : (
          <View style={styles.categoryItem}>
            <View style={styles.imageContainer}>
              {imageUrl ? (
                <Image source={{ uri: imageUrl }} style={styles.categoryImage} />
              ) : (
                <MaterialCommunityIcons
                  name="image-outline"
                  size={38}
                  color="#5b6d64"
                />
              )}
            </View>

            <Text style={styles.categoryLabel} numberOfLines={2}>
              {item.category_name}
            </Text>

            <Text style={styles.tapText}>Tap to continue</Text>
          </View>
        )}
      </Pressable>
    );
  };

  const renderCartItem = ({ item }: { item: any }) => {
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
          <View style={styles.cartTitleRow}>
            <Text style={styles.itemName} numberOfLines={2}>
              {item.sub_category_name || "Sub Category"}
            </Text>

            <View style={styles.statusChip}>
              <Text style={styles.statusChipText}>In Cart</Text>
            </View>
          </View>

          <Text style={styles.itemWeight}>
            Weight: {item.quantity} {item.unit || "kg"}
          </Text>

          <Text style={styles.itemPrice}>
            Estimated Price: ₹ {Number(item.estimated_price || 0).toFixed(2)}
          </Text>

          <Text style={styles.itemMode}>
            Mode: Draft / Not visible to collectors
          </Text>
        </View>
      </View>
    );
  };

  const renderSellTab = () => {
    if (loadingCategories) {
      return (
        <ActivityIndicator
          size="large"
          color="#2D624C"
          style={{ marginTop: 40 }}
        />
      );
    }

    return (
      <>
        <LinearGradient
          colors={["#f2fbf4", "#e7f5eb", "#dceee1"]}
          style={styles.moduleCard}
        >
          <View style={styles.moduleTextWrap}>
            <Text style={styles.moduleLabel}>Public Scrap Listing</Text>
            <Text style={styles.moduleTitle}>Choose Scrap Category</Text>
            <Text style={styles.moduleSubTitle}>
              Add scrap items to cart first. Collectors cannot see them until you
              publish the full cart.
            </Text>
          </View>

          <View style={styles.moduleIconWrap}>
            <MaterialCommunityIcons
              name="recycle-variant"
              size={54}
              color="#6B9C81"
            />
          </View>
        </LinearGradient>

        <View style={styles.tipRow}>
          <Ionicons
            name="information-circle-outline"
            size={18}
            color="#547563"
          />
          <Text style={styles.tipText}>
            Categories shown here are added by admin.
          </Text>
        </View>

        <FlatList
          data={categories}
          keyExtractor={(item) => String(item.categoryid)}
          renderItem={renderCategoryItem}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.row}
          showsVerticalScrollIndicator={false}
        />
      </>
    );
  };

  const renderCartTab = () => {
    if (loadingCart) {
      return (
        <ActivityIndicator
          size="large"
          color="#2D624C"
          style={{ marginTop: 40 }}
        />
      );
    }

    if (cartItems.length === 0) {
      return (
        <View style={styles.emptyWrap}>
          <View style={styles.emptyIconCircle}>
            <MaterialCommunityIcons
              name="cart-outline"
              size={42}
              color="#6E927B"
            />
          </View>

          <Text style={styles.emptyTitle}>No scrap in cart yet</Text>
          <Text style={styles.emptySub}>
            Add scrap from the Sell Scrap tab. It will stay private until you
            publish it.
          </Text>

          <Pressable
            style={styles.emptyActionBtn}
            onPress={() => setActiveTab("sell")}
          >
            <Text style={styles.emptyActionBtnText}>Go to Sell Scrap</Text>
          </Pressable>
        </View>
      );
    }

    return (
      <FlatList
        data={cartItems}
        keyExtractor={(item, index) =>
          item.stock_id?.toString() || index.toString()
        }
        renderItem={renderCartItem}
        contentContainerStyle={styles.cartListContent}
        showsVerticalScrollIndicator={false}
      />
    );
  };

  return (
    <LinearGradient
      colors={["#f5fbf6", "#eaf5ed", "#dfeee5"]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#244233" />
          </Pressable>

          <Text style={styles.headerTitle}>Sell Scrap Publicly</Text>

          <View style={styles.headerRightPlaceholder} />
        </View>

        <View style={styles.contentArea}>
          {activeTab === "sell" ? renderSellTab() : renderCartTab()}
        </View>

        {activeTab === "cart" && cartItems.length > 0 && (
          <View style={styles.bottomSummaryBox}>
            <View style={styles.totalRow}>
              <View>
                <Text style={styles.totalLabel}>Total Estimated Price</Text>
                <Text style={styles.totalSubLabel}>
                  {totalItems} item(s) in cart
                </Text>
              </View>
              <Text style={styles.totalValue}>₹ {totalAmount.toFixed(2)}</Text>
            </View>

            <Pressable style={styles.publishBtn} onPress={openPublishModal}>
              <Ionicons name="cloud-upload-outline" size={18} color="#fff" />
              <Text style={styles.publishBtnText}>Sell Scrap</Text>
            </Pressable>
          </View>
        )}

        <View style={styles.bottomTabBar}>
          <Pressable
            style={[
              styles.bottomTabButton,
              activeTab === "sell" && styles.bottomTabButtonActive,
            ]}
            onPress={() => setActiveTab("sell")}
          >
            <Ionicons
              name="add-circle-outline"
              size={22}
              color={activeTab === "sell" ? "#fff" : "#466454"}
            />
            <Text
              style={[
                styles.bottomTabText,
                activeTab === "sell" && styles.bottomTabTextActive,
              ]}
            >
              Sell Scrap
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.bottomTabButton,
              activeTab === "cart" && styles.bottomTabButtonActive,
            ]}
            onPress={() => setActiveTab("cart")}
          >
            <Ionicons
              name="cart-outline"
              size={22}
              color={activeTab === "cart" ? "#fff" : "#466454"}
            />
            <Text
              style={[
                styles.bottomTabText,
                activeTab === "cart" && styles.bottomTabTextActive,
              ]}
            >
              Cart
            </Text>
          </Pressable>
        </View>

        <Modal
          visible={publishModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => {
            setPublishModalVisible(false);
            setShowDatePicker(false);
          }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Publish Scrap Post</Text>
              <Text style={styles.modalSubtitle}>
                Set pickup date and time slot. After publishing, collectors will be
                able to view this post.
              </Text>

              <Text style={styles.inputLabel}>Pickup Date</Text>
              <Pressable
                style={styles.datePickerButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Ionicons name="calendar-outline" size={18} color="#496458" />
                <Text
                  style={[
                    styles.datePickerText,
                    !pickupDate && styles.datePickerPlaceholder,
                  ]}
                >
                  {pickupDate
                    ? formatPickupDate(pickupDate)
                    : "Select pickup date"}
                </Text>
              </Pressable>

              {showDatePicker && (
                <DateTimePicker
                  value={pickupDate || new Date()}
                  mode="date"
                  display="default"
                  minimumDate={new Date()}
                  onChange={handleDateChange}
                />
              )}

              <Text style={styles.inputLabel}>Select Time Slot</Text>
              <View style={styles.slotWrap}>
                {SLOT_OPTIONS.map((slot) => {
                  const selected = selectedSlot === slot;
                  return (
                    <Pressable
                      key={slot}
                      onPress={() => setSelectedSlot(slot)}
                      style={[
                        styles.slotChip,
                        selected && styles.slotChipSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.slotChipText,
                          selected && styles.slotChipTextSelected,
                        ]}
                      >
                        {slot}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={styles.inputLabel}>Optional Note</Text>
              <TextInput
                style={[styles.input, styles.noteInput]}
                placeholder="Any note for collectors..."
                placeholderTextColor="#8a988f"
                multiline
                value={note}
                onChangeText={setNote}
              />

              <View style={styles.modalButtonRow}>
                <Pressable
                  style={styles.cancelBtn}
                  onPress={() => {
                    setPublishModalVisible(false);
                    setShowDatePicker(false);
                  }}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </Pressable>

                <Pressable
                  style={styles.confirmBtn}
                  onPress={handlePublishScrap}
                  disabled={publishing}
                >
                  {publishing ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.confirmBtnText}>Publish</Text>
                  )}
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },

  header: {
    height: 66,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingTop: 6,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#9bb4a0",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },

  headerTitle: {
    fontSize: 21,
    fontWeight: "800",
    color: "#244233",
  },

  headerRightPlaceholder: {
    width: 42,
  },

  contentArea: {
    flex: 1,
  },

  moduleCard: {
    marginHorizontal: 16,
    borderRadius: 28,
    padding: 20,
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#a5b9aa",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 10,
    elevation: 4,
  },

  moduleTextWrap: {
    flex: 1,
    paddingRight: 12,
  },

  moduleLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6f8d79",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  moduleTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#234134",
    marginBottom: 6,
  },

  moduleSubTitle: {
    fontSize: 14,
    color: "#6b7e73",
    lineHeight: 21,
  },

  moduleIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "rgba(255,255,255,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },

  tipRow: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 14,
  },

  tipText: {
    marginLeft: 6,
    fontSize: 14,
    color: "#547563",
    fontWeight: "500",
  },

  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 120,
  },

  row: {
    justifyContent: "space-between",
    marginBottom: 16,
  },

  categoryCardWrap: {
    width: (width - 48) / 2,
  },

  categoryItem: {
    minHeight: 190,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#DCE9E0",
    shadowColor: "#a8b8ad",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    paddingHorizontal: 14,
    paddingVertical: 18,
  },

  categoryItemSelected: {
    minHeight: 190,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    shadowColor: "#5F9F7A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 6,
    paddingHorizontal: 14,
    paddingVertical: 18,
  },

  imageContainer: {
    width: 86,
    height: 86,
    borderRadius: 24,
    backgroundColor: "#F3F8F5",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },

  imageContainerSelected: {
    width: 86,
    height: 86,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.16)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },

  categoryImage: {
    width: 54,
    height: 54,
    borderRadius: 12,
    resizeMode: "contain",
  },

  categoryLabel: {
    fontSize: 16,
    color: "#2E3E36",
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
  },

  categoryLabelSelected: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
  },

  tapText: {
    fontSize: 12,
    color: "#7A8C85",
    fontWeight: "600",
  },

  tapTextSelected: {
    fontSize: 12,
    color: "rgba(255,255,255,0.92)",
    fontWeight: "600",
  },

  cartListContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 230,
  },

  cartCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 22,
    padding: 12,
    marginBottom: 14,
    shadowColor: "#aab8ae",
    shadowOpacity: 0.09,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 3,
  },

  imageBox: {
    width: 92,
    height: 92,
    borderRadius: 18,
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

  cartTitleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 8,
  },

  itemName: {
    flex: 1,
    fontSize: 16,
    fontWeight: "800",
    color: "#243B33",
    marginRight: 10,
  },

  statusChip: {
    backgroundColor: "#E8F3EB",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },

  statusChipText: {
    color: "#35684E",
    fontSize: 11,
    fontWeight: "700",
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
    marginBottom: 4,
  },

  itemMode: {
    fontSize: 13,
    color: "#73837B",
    fontWeight: "600",
  },

  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
    paddingBottom: 100,
  },

  emptyIconCircle: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: "#e8f2eb",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },

  emptyTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#2D4F44",
    marginBottom: 8,
    textAlign: "center",
  },

  emptySub: {
    fontSize: 15,
    color: "#6B7B74",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 20,
  },

  emptyActionBtn: {
    height: 50,
    paddingHorizontal: 20,
    borderRadius: 16,
    backgroundColor: "#3E7E63",
    alignItems: "center",
    justifyContent: "center",
  },

  emptyActionBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
  },

  bottomSummaryBox: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 88,
    backgroundColor: "#ffffff",
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 16,
    shadowColor: "#9fb0a4",
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 10,
    elevation: 6,
  },

  totalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  totalLabel: {
    fontSize: 15,
    color: "#617161",
    fontWeight: "700",
  },

  totalSubLabel: {
    fontSize: 12,
    color: "#91a196",
    marginTop: 2,
    fontWeight: "600",
  },

  totalValue: {
    fontSize: 22,
    color: "#244233",
    fontWeight: "900",
  },

  publishBtn: {
    marginTop: 14,
    height: 52,
    borderRadius: 16,
    backgroundColor: "#2F855A",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },

  publishBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
  },

  bottomTabBar: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 18,
    height: 64,
    backgroundColor: "#ffffff",
    borderRadius: 22,
    flexDirection: "row",
    alignItems: "center",
    padding: 6,
    shadowColor: "#a0b1a5",
    shadowOpacity: 0.14,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 8,
  },

  bottomTabButton: {
    flex: 1,
    height: "100%",
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },

  bottomTabButtonActive: {
    backgroundColor: "#3E7E63",
  },

  bottomTabText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#466454",
    marginTop: 2,
  },

  bottomTabTextActive: {
    color: "#fff",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(17,24,20,0.45)",
    justifyContent: "flex-end",
  },

  modalCard: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    padding: 20,
    maxHeight: "88%",
  },

  modalTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#244233",
    marginBottom: 6,
  },

  modalSubtitle: {
    fontSize: 14,
    color: "#6d7d73",
    lineHeight: 21,
    marginBottom: 18,
  },

  inputLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#244233",
    marginBottom: 8,
    marginTop: 8,
  },

  input: {
    borderWidth: 1,
    borderColor: "#d7e4db",
    backgroundColor: "#f8fbf9",
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 50,
    color: "#253c34",
    fontSize: 14,
  },

  datePickerButton: {
    borderWidth: 1,
    borderColor: "#d7e4db",
    backgroundColor: "#f8fbf9",
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 50,
    flexDirection: "row",
    alignItems: "center",
  },

  datePickerText: {
    marginLeft: 10,
    fontSize: 14,
    color: "#253c34",
    fontWeight: "600",
  },

  datePickerPlaceholder: {
    color: "#8a988f",
    fontWeight: "500",
  },

  noteInput: {
    height: 100,
    paddingTop: 14,
    textAlignVertical: "top",
  },

  slotWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 6,
  },

  slotChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "#eef4f0",
    marginRight: 10,
    marginBottom: 10,
  },

  slotChipSelected: {
    backgroundColor: "#2F855A",
  },

  slotChipText: {
    color: "#496458",
    fontSize: 13,
    fontWeight: "700",
  },

  slotChipTextSelected: {
    color: "#fff",
  },

  modalButtonRow: {
    flexDirection: "row",
    marginTop: 20,
  },

  cancelBtn: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    backgroundColor: "#eef3f0",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },

  cancelBtnText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#496458",
  },

  confirmBtn: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    backgroundColor: "#2F855A",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },

  confirmBtnText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#fff",
  },
});