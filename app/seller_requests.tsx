import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { BASE_URL, getRequest } from "../Services/axiosServices";

type FilterType = "all" | "pending" | "accepted" | "rejected";

export default function SellerRequestsScreen() {
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

  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<FilterType>("all");

  const FILTERS: { key: FilterType; label: string }[] = [
    { key: "all", label: "All" },
    { key: "pending", label: "Pending" },
    { key: "accepted", label: "Accepted" },
    { key: "rejected", label: "Rejected" },
  ];

  const formatDate = (dateValue: any) => {
    if (!dateValue) return "Not set";

    try {
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return String(dateValue);

      return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return String(dateValue);
    }
  };

  const getStatusStyles = (status: string) => {
    switch ((status || "").toLowerCase()) {
      case "pending":
        return {
          bg: "#FFF4D8",
          text: "#B7791F",
        };
      case "accepted":
        return {
          bg: "#E6F7EC",
          text: "#2F855A",
        };
      case "rejected":
        return {
          bg: "#FDECEC",
          text: "#C53030",
        };
      default:
        return {
          bg: "#EDF5EF",
          text: "#2F855A",
        };
    }
  };

  const fetchSellerRequests = async () => {
    try {
      if (!sellerId) {
        setRequests([]);
        return;
      }

      setLoading(true);

      const response = await getRequest(`/pickup-request/seller/${sellerId}`, false);

      if (response?.Status === "OK") {
        setRequests(response.Result || []);
      } else {
        setRequests([]);
      }
    } catch (error) {
      console.log("fetchSellerRequests error:", error);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const markRequestsAsRead = async () => {
    try {
      if (!sellerId) return;

      await fetch(`${BASE_URL}/pickup-request/mark-read/${sellerId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
      });
    } catch (error) {
      console.log("markRequestsAsRead error:", error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchSellerRequests();
      markRequestsAsRead();
    }, [sellerId])
  );

  const handleAcceptRequest = async (requestId: string) => {
    try {
      if (!requestId) return;

      setActionLoadingId(requestId);

      const response = await fetch(
        `${BASE_URL}/pickup-request/accept/${requestId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (data?.Status === "OK") {
        Alert.alert("Success", "Request accepted successfully.");
        fetchSellerRequests();
      } else {
        Alert.alert("Failed", data?.Result || "Unable to accept request.");
      }
    } catch (error) {
      console.log("handleAcceptRequest error:", error);
      Alert.alert("Error", "Something went wrong while accepting request.");
    } finally {
      setActionLoadingId("");
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      if (!requestId) return;

      setActionLoadingId(requestId);

      const response = await fetch(
        `${BASE_URL}/pickup-request/reject/${requestId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (data?.Status === "OK") {
        Alert.alert("Success", "Request rejected successfully.");
        fetchSellerRequests();
      } else {
        Alert.alert("Failed", data?.Result || "Unable to reject request.");
      }
    } catch (error) {
      console.log("handleRejectRequest error:", error);
      Alert.alert("Error", "Something went wrong while rejecting request.");
    } finally {
      setActionLoadingId("");
    }
  };

  const filteredRequests = useMemo(() => {
    if (selectedFilter === "all") return requests;

    return requests.filter(
      (item: any) =>
        String(item.request_status || "").toLowerCase() === selectedFilter
    );
  }, [requests, selectedFilter]);

  const countByStatus = (status: FilterType) => {
    if (status === "all") return requests.length;

    return requests.filter(
      (item: any) =>
        String(item.request_status || "").toLowerCase() === status
    ).length;
  };

  const handleHomePress = () => {
    router.push({
      pathname: "/seller",
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

  const handleCartPress = () => {
    router.push({
      pathname: "/SellerCartScreen",
      params: {
        seller_id: sellerId,
        name: sellerName,
        address: sellerAddress,
      },
    });
  };

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

  return (
    <LinearGradient
      colors={["#dff5e4", "#bde8c4", "#a9ddb3"]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={handleHomePress}>
            <Ionicons name="arrow-back" size={22} color="#244233" />
          </TouchableOpacity>

          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Collector Requests</Text>
            <Text style={styles.headerSubTitle}>
              Review and manage incoming pickup requests
            </Text>
          </View>

          <TouchableOpacity onPress={handleProfilePress}>
           
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
        >
          <View style={styles.summaryCard}>
            <View style={styles.summaryBox}>
              <Text style={styles.summaryLabel}>Total</Text>
              <Text style={styles.summaryValue}>{requests.length}</Text>
            </View>

            <View style={styles.summaryDivider} />

            <View style={styles.summaryBox}>
              <Text style={styles.summaryLabel}>Pending</Text>
              <Text style={styles.summaryValue}>{countByStatus("pending")}</Text>
            </View>

            <View style={styles.summaryDivider} />

            <View style={styles.summaryBox}>
              <Text style={styles.summaryLabel}>Accepted</Text>
              <Text style={styles.summaryValue}>{countByStatus("accepted")}</Text>
            </View>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterWrap}
          >
            {FILTERS.map((filter) => {
              const active = selectedFilter === filter.key;

              return (
                <TouchableOpacity
                  key={filter.key}
                  style={[styles.filterChip, active && styles.filterChipActive]}
                  onPress={() => setSelectedFilter(filter.key)}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      active && styles.filterChipTextActive,
                    ]}
                  >
                    {filter.label} ({countByStatus(filter.key)})
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={styles.listWrap}>
            {loading ? (
              <View style={styles.loadingWrap}>
                <ActivityIndicator size="large" color="#2F855A" />
              </View>
            ) : filteredRequests.length === 0 ? (
              <View style={styles.emptyCard}>
                <MaterialCommunityIcons
                  name="account-clock-outline"
                  size={38}
                  color="#79907c"
                />
                <Text style={styles.emptyTitle}>No requests found</Text>
                <Text style={styles.emptySub}>
                  Incoming collector requests will appear here.
                </Text>
              </View>
            ) : (
              filteredRequests.map((item: any, index: number) => {
                const status = String(item.request_status || "pending").toLowerCase();
                const statusStyle = getStatusStyles(status);
                const isPending = status === "pending";
                const isAccepted = status === "accepted";
                const isRejected = status === "rejected";
                const isLoading = actionLoadingId === item.request_id;

                return (
                  <View key={item.request_id || index} style={styles.requestCard}>
                    <Text style={styles.requestDate}>
                      Requested on {formatDate(item.created_at)}
                    </Text>

                    <View style={styles.requestTopRow}>
                      <View style={styles.personRow}>
                      
                        <View style={styles.personTextWrap}>
                          <Text style={styles.personName}>
                            {item.collector_name || "Collector"}
                          </Text>
                          <Text style={styles.personSub}>
                            {item.collector_phone || item.collector_id || "Collector"}
                          </Text>
                        </View>
                      </View>

                      <View
                        style={[
                          styles.statusBadge,
                          { backgroundColor: statusStyle.bg },
                        ]}
                      >
                        <Text
                          style={[styles.statusText, { color: statusStyle.text }]}
                        >
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.requestInfoBox}>
                      <Text style={styles.requestInfoLabel}>Scrap</Text>
                      <Text style={styles.requestInfoValue}>
                        {item.scrap_names || "Mixed Scrap"}
                      </Text>
                    </View>

                    <View style={styles.requestInfoGrid}>
                      <View style={styles.requestInfoMini}>
                        <Text style={styles.requestInfoLabel}>Amount</Text>
                        <Text style={styles.requestInfoValue}>
                          ₹ {Number(item.total_amount || 0).toFixed(2)}
                        </Text>
                      </View>

                      <View style={styles.requestInfoMini}>
                        <Text style={styles.requestInfoLabel}>Items</Text>
                        <Text style={styles.requestInfoValue}>
                          {item.item_count || 0}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.requestInfoBox}>
                      <Text style={styles.requestInfoLabel}>Pickup Slot</Text>
                      <Text style={styles.requestInfoValue}>
                        {formatDate(item.pickup_date)} •{" "}
                        {item.pickup_time || "Not set"}
                      </Text>
                    </View>

                    <View style={styles.requestInfoBox}>
                      <Text style={styles.requestInfoLabel}>Collector Address</Text>
                      <Text style={styles.requestInfoValue}>
                        {item.collector_address ||
                          item.address ||
                          "No address available"}
                      </Text>
                    </View>

                    {isPending ? (
                      <View style={styles.actionButtonsRow}>
                        <TouchableOpacity
                          style={[styles.actionBtn, styles.rejectBtn]}
                          onPress={() =>
                            handleRejectRequest(String(item.request_id || ""))
                          }
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <ActivityIndicator color="#c63b3b" size="small" />
                          ) : (
                            <Text style={styles.rejectBtnText}>Reject</Text>
                          )}
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.actionBtn, styles.acceptBtn]}
                          onPress={() =>
                            handleAcceptRequest(String(item.request_id || ""))
                          }
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <ActivityIndicator color="#fff" size="small" />
                          ) : (
                            <Text style={styles.acceptBtnText}>Accept</Text>
                          )}
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <View style={styles.finalStatusWrap}>
                        <Text style={styles.finalStatusText}>
                          {isAccepted
                            ? "This request has been accepted."
                            : isRejected
                            ? "This request has been rejected."
                            : "Status updated."}
                        </Text>
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </View>
        </ScrollView>

        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navItem} onPress={handleHomePress}>
            <Ionicons name="home-outline" size={26} color="#7d7d7d" />
            <Text style={styles.navText}>Home</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem}>
            <MaterialCommunityIcons
              name="clipboard-text-outline"
              size={26}
              color="#58a868"
            />
            <Text style={styles.activeNavText}>Requests</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem} onPress={handleCartPress}>
            <Ionicons name="cart-outline" size={24} color="#7d7d7d" />
            <Text style={styles.navText}>Cart</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem} onPress={handleProfilePress}>
            <Ionicons name="person-outline" size={26} color="#7d7d7d" />
            <Text style={styles.navText}>Profile</Text>
          </TouchableOpacity>
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

  header: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 16,
    flexDirection: "row",
    alignItems: "center",
  },

  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#244233",
  },

  headerSubTitle: {
    fontSize: 13,
    color: "#5f6f64",
    marginTop: 3,
  },

  profileImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginLeft: 12,
    backgroundColor: "#dfeee0",
  },

  summaryCard: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    elevation: 2,
    marginBottom: 16,
  },

  summaryBox: {
    flex: 1,
    alignItems: "center",
  },

  summaryDivider: {
    width: 1,
    height: 34,
    backgroundColor: "#e2e8f0",
  },

  summaryLabel: {
    fontSize: 12,
    color: "#718096",
    fontWeight: "600",
    marginBottom: 4,
  },

  summaryValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1a365d",
  },

  filterWrap: {
    paddingHorizontal: 16,
    paddingBottom: 10,
  },

  filterChip: {
    backgroundColor: "#ffffff",
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },

  filterChipActive: {
    backgroundColor: "#1a365d",
    borderColor: "#1a365d",
  },

  filterChipText: {
    color: "#4a5568",
    fontSize: 13,
    fontWeight: "700",
  },

  filterChipTextActive: {
    color: "#fff",
  },

  listWrap: {
    paddingHorizontal: 16,
    paddingBottom: 10,
  },

  loadingWrap: {
    paddingVertical: 30,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 20,
    marginBottom: 14,
    alignItems: "center",
    shadowColor: "#b7c8b7",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.14,
    shadowRadius: 8,
    elevation: 3,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2c352e",
    marginTop: 12,
    marginBottom: 6,
  },

  emptySub: {
    fontSize: 13,
    color: "#7b7b7b",
    textAlign: "center",
    lineHeight: 20,
  },

  requestCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,
    shadowColor: "#b7c8b7",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.14,
    shadowRadius: 8,
    elevation: 3,
  },

  requestDate: {
    fontSize: 13,
    color: "#7a7a7a",
    marginBottom: 10,
    fontWeight: "600",
  },

  requestTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  personRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 10,
  },

  personTextWrap: {
    flex: 1,
  },

  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    marginRight: 10,
  },

  personName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2c352e",
  },

  personSub: {
    fontSize: 12,
    color: "#8b8b8b",
    marginTop: 2,
  },

  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },

  statusText: {
    fontSize: 13,
    fontWeight: "600",
  },

  requestInfoBox: {
    backgroundColor: "#f8fbf9",
    borderRadius: 14,
    padding: 12,
    marginTop: 12,
  },

  requestInfoGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },

  requestInfoMini: {
    width: "48.5%",
    backgroundColor: "#f8fbf9",
    borderRadius: 14,
    padding: 12,
  },

  requestInfoLabel: {
    fontSize: 12,
    color: "#718096",
    marginBottom: 5,
    fontWeight: "600",
  },

  requestInfoValue: {
    fontSize: 14,
    color: "#29352b",
    fontWeight: "700",
  },

  actionButtonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 14,
  },

  actionBtn: {
    width: "48.5%",
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  rejectBtn: {
    backgroundColor: "#fcecec",
    borderWidth: 1,
    borderColor: "#f3c6c6",
  },

  rejectBtnText: {
    color: "#c63b3b",
    fontWeight: "700",
    fontSize: 15,
  },

  acceptBtn: {
    backgroundColor: "#2f9b4e",
  },

  acceptBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },

  finalStatusWrap: {
    marginTop: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: "#f7faf8",
  },

  finalStatusText: {
    fontSize: 13,
    color: "#667085",
    fontWeight: "600",
    textAlign: "center",
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
});