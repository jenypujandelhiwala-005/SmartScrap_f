import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { getRequest } from "../Services/axiosServices";

export default function SellerDashboard() {
  const router = useRouter();

  const params = useLocalSearchParams<{
    seller_id?: string;
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    latitude?: string;
    longitude?: string;
  }>();

  const sellerId =
    typeof params.seller_id === "string" ? params.seller_id : "";

  const sellerName =
    typeof params.name === "string" && params.name.trim() !== ""
      ? params.name
      : "Seller";

  const sellerAddress =
    typeof params.address === "string" && params.address.trim() !== ""
      ? params.address
      : "No address available";

  const [totalScrapSold, setTotalScrapSold] = useState("0 kg");
  const [totalEarnings, setTotalEarnings] = useState("₹0");
  const [requestCount, setRequestCount] = useState(0);
  const [requests, setRequests] = useState<any[]>([]);

  const handleProfilePress = () => {
    if (!sellerId) {
      Alert.alert("Error", "Seller ID not found. Please login again.");
      return;
    }

    router.push({
      pathname: "/seller_profile",
      params: {
        seller_id: sellerId,
        name: typeof params.name === "string" ? params.name : "",
        email: typeof params.email === "string" ? params.email : "",
        phone: typeof params.phone === "string" ? params.phone : "",
        address: typeof params.address === "string" ? params.address : "",
        latitude: typeof params.latitude === "string" ? params.latitude : "",
        longitude: typeof params.longitude === "string" ? params.longitude : "",
      },
    });
  };

  const fetchSellerSummary = async () => {
    try {
      if (!sellerId) return;

      const response = await getRequest(
        `/seller-stock-summary/${sellerId}`,
        false
      );

      if (response?.Status === "OK") {
        const result = response.Result || {};
        const totalQty = Number(result.total_scrap_sold || 0);
        const totalAmount = Number(result.total_estimated_earnings || 0);

        setTotalScrapSold(`${totalQty} kg`);
        setTotalEarnings(`₹${totalAmount.toFixed(2)}`);
      } else {
        setTotalScrapSold("0 kg");
        setTotalEarnings("₹0");
      }
    } catch (error) {
      console.log("fetchSellerSummary error:", error);
      setTotalScrapSold("0 kg");
      setTotalEarnings("₹0");
    }
  };

  // Badge count = unread collector public requests
  const fetchUnreadRequestCount = async () => {
    try {
      if (!sellerId) {
        setRequestCount(0);
        return;
      }

      const response = await getRequest(
        `/pickup-request/seller/${sellerId}`,
        false
      );

      if (response?.Status === "OK") {
        const unseenRequests = (response.Result || []).filter(
          (item: any) => item.is_read === false
        );

        setRequestCount(unseenRequests.length);
      } else {
        setRequestCount(0);
      }
    } catch (error) {
      console.log("fetchUnreadRequestCount error:", error);
      setRequestCount(0);
    }
  };

  // Dashboard Pickup-Requests section = direct seller-sent pickup requests only
  const fetchRequests = async () => {
    try {
      if (!sellerId) {
        setRequests([]);
        return;
      }

      const response = await getRequest(
        `/pickup-direct/seller/${sellerId}`,
        false
      );

      if (response?.Status === "OK") {
        setRequests(response.Result || []);
      } else {
        setRequests([]);
      }
    } catch (error) {
      console.log("fetchRequests error:", error);
      setRequests([]);
    }
  };

  const openRequestsScreen = () => {
    if (!sellerId) {
      Alert.alert("Error", "Seller ID not found. Please login again.");
      return;
    }

    router.push({
      pathname: "/seller_requests",
      params: {
        seller_id: sellerId,
        name: sellerName,
        email: typeof params.email === "string" ? params.email : "",
        phone: typeof params.phone === "string" ? params.phone : "",
        address: sellerAddress,
        latitude: typeof params.latitude === "string" ? params.latitude : "",
        longitude: typeof params.longitude === "string" ? params.longitude : "",
      },
    });
  };

  const openSentRequestsScreen = () => {
    if (!sellerId) {
      Alert.alert("Error", "Seller ID not found. Please login again.");
      return;
    }

    router.push({
      pathname: "/seller_sent_request",
      params: {
        seller_id: sellerId,
        name: sellerName,
        email: typeof params.email === "string" ? params.email : "",
        phone: typeof params.phone === "string" ? params.phone : "",
        address: sellerAddress,
        latitude: typeof params.latitude === "string" ? params.latitude : "",
        longitude: typeof params.longitude === "string" ? params.longitude : "",
      },
    });
  };

  useFocusEffect(
    useCallback(() => {
      fetchSellerSummary();
      fetchUnreadRequestCount();
      fetchRequests();
    }, [sellerId])
  );

  return (
    <LinearGradient
      colors={["#dff5e4", "#bde8c4", "#a9ddb3"]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.mainWrapper}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <LinearGradient
              colors={["#eaf8ec", "#d9f0dd", "#d6eed8"]}
              style={styles.header}
            >
              <View style={styles.headerRow}>
                <Text style={styles.headerTitle}>Home</Text>

                <View style={styles.headerRight}>
                  <Ionicons
                    name="notifications-outline"
                    size={26}
                    color="#3d5b42"
                  />
                  <Pressable onPress={handleProfilePress}>
                   
                  </Pressable>
                </View>
              </View>
            </LinearGradient>

            <View style={styles.content}>
              <Text style={styles.welcomeText}>Welcome to SmartScrap!</Text>
              <Text style={styles.shopName}>{sellerName}</Text>
              <Text style={styles.address}>{sellerAddress}</Text>

              <View style={styles.statsRow}>
                <LinearGradient
                  colors={["#c6f4c8", "#eff7df"]}
                  style={styles.statCard}
                >
                  <View style={styles.statInnerRow}>
                    <View style={styles.statIconCircle}>
                      <MaterialCommunityIcons
                        name="cash-multiple"
                        size={28}
                        color="#1f6b3c"
                      />
                    </View>
                    <View style={styles.statTextWrap}>
                      <Text style={styles.statLabel}>Total Earnings</Text>
                      <Text style={styles.statValue}>{totalEarnings}</Text>
                    </View>
                  </View>
                </LinearGradient>

                <LinearGradient
                  colors={["#dff3da", "#edf8e3"]}
                  style={styles.statCard}
                >
                  <View style={styles.statInnerRow}>
                    <View style={styles.statIconCircle}>
                      <MaterialCommunityIcons
                        name="delete-outline"
                        size={28}
                        color="#2e8b57"
                      />
                    </View>
                    <View style={styles.statTextWrap}>
                      <Text style={styles.statLabel}>Total Scrap Sold</Text>
                      <Text style={styles.statValue}>{totalScrapSold}</Text>
                    </View>
                  </View>
                </LinearGradient>
              </View>

              <View style={styles.sellScrapCard}>
                <View style={styles.sellScrapHeaderRow}>
                  <View style={styles.sellIconWrap}>
                    <MaterialCommunityIcons
                      name="recycle"
                      size={24}
                      color="#2f7d4f"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sellScrapTitle}>Sell Scrap</Text>
                    <Text style={styles.sellScrapSubtitle}>
                      Choose how you want to sell your scrap
                    </Text>
                  </View>
                </View>

                <View style={styles.sellCardsRow}>
                  <Pressable
                    android_ripple={{ color: "#cfe6d4" }}
                    style={({ pressed }) => [
                      styles.sellOptionCard,
                      pressed && styles.sellOptionCardPressed,
                    ]}
                    onPress={() =>
                      router.push({
                        pathname: "/SellerPublicSellScreen",
                        params: {
                          seller_id: sellerId,
                          name: sellerName,
                          address: sellerAddress,
                          latitude:
                            typeof params.latitude === "string"
                              ? params.latitude
                              : "",
                          longitude:
                            typeof params.longitude === "string"
                              ? params.longitude
                              : "",
                        },
                      })
                    }
                  >
                    {({ pressed }) => (
                      <LinearGradient
                        colors={
                          pressed
                            ? ["#d7ecd9", "#c3dfc9", "#b0d2b8"]
                            : ["#eef8f0", "#e6f4e9", "#dceddf"]
                        }
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.sellOptionGradient}
                      >
                        <View
                          style={[
                            styles.sellOptionIconWrap,
                            pressed && styles.sellOptionIconWrapPressed,
                          ]}
                        >
                          <MaterialCommunityIcons
                            name="earth"
                            size={24}
                            color="#2f7d4f"
                          />
                        </View>

                        <Text style={styles.sellOptionTitle}>Publicly</Text>
                        <Text style={styles.sellOptionDesc}>
                          Visible to all collectors
                        </Text>
                      </LinearGradient>
                    )}
                  </Pressable>

                  <Pressable
                    android_ripple={{ color: "#cfe6d4" }}
                    style={({ pressed }) => [
                      styles.sellOptionCard,
                      pressed && styles.sellOptionCardPressed,
                    ]}
                    onPress={() =>
                      router.push({
                        pathname: "/total_collector",
                        params: {
                          seller_id: sellerId,
                          name: sellerName,
                          address: sellerAddress,
                        },
                      })
                    }
                  >
                    {({ pressed }) => (
                      <LinearGradient
                        colors={
                          pressed
                            ? ["#d7ecd9", "#c3dfc9", "#b0d2b8"]
                            : ["#eef8f0", "#e6f4e9", "#dceddf"]
                        }
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.sellOptionGradient}
                      >
                        <View
                          style={[
                            styles.sellOptionIconWrap,
                            pressed && styles.sellOptionIconWrapPressed,
                          ]}
                        >
                          <MaterialCommunityIcons
                            name="account-search-outline"
                            size={24}
                            color="#2f7d4f"
                          />
                        </View>

                        <Text style={styles.sellOptionTitle}>
                          Specific Collector
                        </Text>
                        <Text style={styles.sellOptionDesc}>
                          Sell directly to one collector
                        </Text>
                      </LinearGradient>
                    )}
                  </Pressable>
                </View>
              </View>

              <View style={styles.requestsContainer}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Pickup-Requests</Text>
                  <TouchableOpacity onPress={openSentRequestsScreen}>
                    <Text style={styles.viewAll}>View All  ›</Text>
                  </TouchableOpacity>
                </View>

                {requests.length === 0 ? (
                  <Text style={styles.emptyText}>No Requests Found</Text>
                ) : (
                  requests.slice(0, 3).map((item, index) => {
                    const statusText = item?.status || "Pending";
                    const normalizedStatus = String(statusText).toLowerCase();

                    return (
                      <View key={index} style={styles.requestCard}>
                        <View style={styles.requestLeft}>
                          <Text style={styles.requestName}>
                            {item.collector_name || "Collector"}
                          </Text>

                          <Text style={styles.requestAddress}>
                            {item.collector_address ||
                              item.address ||
                              "No address available"}
                          </Text>

                          <Text
                            style={[
                              styles.requestStatus,
                              normalizedStatus === "accepted"
                                ? styles.acceptedText
                                : normalizedStatus === "rejected"
                                ? styles.rejectedText
                                : styles.pendingText,
                            ]}
                          >
                            {statusText}
                          </Text>
                        </View>

                        <TouchableOpacity
                          style={styles.viewBtn}
                          onPress={openSentRequestsScreen}
                        >
                          <Text style={styles.viewBtnText}>View</Text>
                        </TouchableOpacity>
                      </View>
                    );
                  })
                )}
              </View>
            </View>
          </ScrollView>

          <View style={styles.bottomNav}>
            <Pressable style={styles.navItem}>
              <Ionicons name="home" size={26} color="#58a868" />
              <Text style={styles.activeNavText}>Home</Text>
            </Pressable>

            <Pressable style={styles.navItem} onPress={openRequestsScreen}>
              <View style={styles.badgeWrapper}>
                <MaterialCommunityIcons
                  name="clipboard-text-outline"
                  size={26}
                  color="#7d7d7d"
                />
                {requestCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {requestCount > 99 ? "99+" : requestCount}
                    </Text>
                  </View>
                )}
              </View>
              <Text style={styles.navText}>Requests</Text>
            </Pressable>

            <Pressable
              style={styles.navItem}
              onPress={() =>
                router.push({
                  pathname: "/SellerCartScreen",
                  params: {
                    seller_id: sellerId,
                    name: sellerName,
                    address: sellerAddress,
                  },
                })
              }
            >
              <Ionicons name="cart-outline" size={24} color="#7d7d7d" />
              <Text style={styles.navText}>Cart</Text>
            </Pressable>

            <Pressable style={styles.navItem} onPress={handleProfilePress}>
              <Ionicons name="person-outline" size={26} color="#7d7d7d" />
              <Text style={styles.navText}>Profile</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  safeArea: {
    flex: 1,
  },

  mainWrapper: {
    flex: 1,
  },

  scrollContent: {
    paddingBottom: 110,
  },

  header: {
    paddingTop: 16,
    paddingHorizontal: 18,
    paddingBottom: 22,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#243326",
  },

  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },

  profileImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#dfeee0",
  },

  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  welcomeText: {
    fontSize: 16,
    color: "#6d6d6d",
    marginBottom: 6,
  },

  shopName: {
    fontSize: 24,
    fontWeight: "700",
    color: "#2d3a2f",
  },

  address: {
    fontSize: 14,
    color: "#7b7b7b",
    marginTop: 4,
    marginBottom: 16,
  },

  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 18,
  },

  statCard: {
    width: "48.5%",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: "#d8ecd5",
  },

  statInnerRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  statIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.35)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },

  statTextWrap: {
    flex: 1,
  },

  statLabel: {
    fontSize: 14,
    color: "#617161",
    marginBottom: 4,
  },

  statValue: {
    fontSize: 17,
    fontWeight: "700",
    color: "#213a25",
  },

  sellScrapCard: {
    backgroundColor: "#fff",
    borderRadius: 22,
    padding: 16,
    marginBottom: 14,
    shadowColor: "#b7c8b7",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.14,
    shadowRadius: 8,
    elevation: 3,
  },

  sellScrapHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },

  sellIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#eef8f0",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  sellScrapTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#29352b",
  },

  sellScrapSubtitle: {
    fontSize: 13,
    color: "#777",
    marginTop: 4,
  },

  sellCardsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },

  sellOptionCard: {
    flex: 1,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#9fb79f",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 10,
    elevation: 4,
  },

  sellOptionCardPressed: {
    transform: [{ scale: 0.985 }],
  },

  sellOptionGradient: {
    minHeight: 168,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(91, 137, 100, 0.18)",
    paddingVertical: 18,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  sellOptionIconWrap: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "rgba(255,255,255,0.48)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },

  sellOptionIconWrapPressed: {
    backgroundColor: "rgba(255,255,255,0.62)",
  },

  sellOptionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#243326",
    textAlign: "center",
    marginBottom: 8,
  },

  sellOptionDesc: {
    fontSize: 12,
    color: "#5f6d62",
    textAlign: "center",
    lineHeight: 18,
    paddingHorizontal: 4,
  },

  requestsContainer: {
    backgroundColor: "#f4f4f4",
    borderRadius: 22,
    padding: 14,
    marginTop: 4,
    marginBottom: 14,
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#28332a",
  },

  viewAll: {
    fontSize: 15,
    color: "#3f8b59",
    fontWeight: "700",
  },

  requestCard: {
    backgroundColor: "#eeeeee",
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  requestLeft: {
    flex: 1,
    paddingRight: 12,
  },

  requestName: {
    fontSize: 15,
    fontWeight: "800",
    color: "#2d2d2d",
    marginBottom: 3,
  },

  requestAddress: {
    fontSize: 13,
    color: "#7a7a7a",
    marginBottom: 4,
  },

  requestStatus: {
    fontSize: 13,
    fontWeight: "800",
    textTransform: "capitalize",
  },

  pendingText: {
    color: "#c78518",
  },

  acceptedText: {
    color: "#d08d1d",
  },

  rejectedText: {
    color: "#c36a13",
  },

  viewBtn: {
    backgroundColor: "#2f8a57",
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  viewBtnText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 13,
  },

  emptyText: {
    textAlign: "center",
    color: "#777",
    marginTop: 10,
    marginBottom: 6,
  },

  bottomNav: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 78,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e8e8e8",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingBottom: 10,
  },

  navItem: {
    alignItems: "center",
    justifyContent: "center",
  },

  navText: {
    fontSize: 13,
    color: "#7d7d7d",
    marginTop: 4,
  },

  activeNavText: {
    fontSize: 13,
    color: "#58a868",
    marginTop: 4,
    fontWeight: "700",
  },

  badgeWrapper: {
    position: "relative",
  },

  badge: {
    position: "absolute",
    top: -6,
    right: -10,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: "#e53e3e",
    alignItems: "center",
    justifyContent: "center",
  },

  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "800",
  },
});