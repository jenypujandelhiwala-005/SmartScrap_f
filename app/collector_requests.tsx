import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { FileText, Home, User, Users } from "lucide-react-native";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { BASE_URL, getRequest } from "../Services/axiosServices";

type FilterType = "all" | "pending" | "accepted" | "rejected" | "completed";

const CollectorRequestsScreen = () => {
  const router = useRouter();

  const params = useLocalSearchParams<{
    collector_id?: string;
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    area?: string;
    city?: string;
    latitude?: string;
    longitude?: string;
  }>();

  const collectorId =
    typeof params.collector_id === "string" ? params.collector_id : "";

  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState<any[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<FilterType>("all");

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

  const getNormalizedStatus = (item: any) => {
    return String(item.status || item.request_status || "pending").toLowerCase();
  };

  const getStatusLabel = (item: any) => {
    const status = getNormalizedStatus(item);

    switch (status) {
      case "pending":
        return "Pending";
      case "accepted":
        return "Accepted";
      case "rejected":
        return "Rejected";
      case "completed":
        return "Completed";
      default:
        return "Pending";
    }
  };

  const getStatusColors = (status: string) => {
    switch ((status || "").toLowerCase()) {
      case "pending":
        return { bg: "#FFF4D8", text: "#B7791F" };
      case "accepted":
        return { bg: "#E6F7EC", text: "#2F855A" };
      case "rejected":
        return { bg: "#FDECEC", text: "#C53030" };
      case "completed":
        return { bg: "#E6FFFA", text: "#2C7A7B" };
      default:
        return { bg: "#EDF5EF", text: "#2F855A" };
    }
  };

  const fetchCollectorRequests = async () => {
    try {
      if (!collectorId) {
        setRequests([]);
        return;
      }

      setLoading(true);

      const response = await getRequest(
        `/pickup-request/collector/${collectorId}`,
        false
      );

      if (response?.Status === "OK") {
        setRequests(response.Result || []);
      } else {
        setRequests([]);
      }
    } catch (error) {
      console.log("fetchCollectorRequests error:", error);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const markCollectorRequestsAsSeen = async () => {
    try {
      if (!collectorId) return;

      await fetch(`${BASE_URL}/pickup-request/collector-seen/${collectorId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
      });
    } catch (error) {
      console.log("markCollectorRequestsAsSeen error:", error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        await fetchCollectorRequests();
        await markCollectorRequestsAsSeen();
      };

      loadData();
    }, [collectorId])
  );

  const filteredRequests = useMemo(() => {
    if (selectedFilter === "all") return requests;

    return requests.filter(
      (item: any) => getNormalizedStatus(item) === selectedFilter
    );
  }, [requests, selectedFilter]);

  const countByStatus = (status: FilterType) => {
    if (status === "all") return requests.length;

    return requests.filter(
      (item: any) => getNormalizedStatus(item) === status
    ).length;
  };

  const openRequestDetails = (item: any) => {
    router.push({
      pathname: "/seller_details",
      params: {
        post_id: String(item.post_id || ""),
        seller_id: String(item.seller_id || ""),
        collector_id: collectorId,
        name: String(item.seller_name || "Seller"),
        address: String(item.address || ""),
        sellerLat: String(item.latitude || item.seller_latitude || ""),
        sellerLng: String(item.longitude || item.seller_longitude || ""),
        collectorLat: typeof params.latitude === "string" ? params.latitude : "",
        collectorLng: typeof params.longitude === "string" ? params.longitude : "",
        pickup_date: String(item.pickup_date || item.pickupdate || ""),
        pickup_time: String(item.pickup_time || item.time_slot || ""),
        total_amount: String(item.total_amount || 0),
        item_count: String(
          Array.isArray(item.items) ? item.items.length : Number(item.item_count || 0)
        ),
        post_status: String(item.post_status || item.status || ""),
      },
    });
  };

  const handleHomePress = () => {
    router.push({
      pathname: "/collector",
      params: {
        collector_id: collectorId,
        name: typeof params.name === "string" ? params.name : "",
        email: typeof params.email === "string" ? params.email : "",
        phone: typeof params.phone === "string" ? params.phone : "",
        address: typeof params.address === "string" ? params.address : "",
        area: typeof params.area === "string" ? params.area : "",
        city: typeof params.city === "string" ? params.city : "",
        latitude: typeof params.latitude === "string" ? params.latitude : "",
        longitude: typeof params.longitude === "string" ? params.longitude : "",
      },
    });
  };

  const handlePostsPress = () => {
    router.push({
      pathname: "/total_sellers",
      params: {
        collector_id: collectorId,
        collectorLat:
          typeof params.latitude === "string" ? params.latitude : "",
        collectorLng:
          typeof params.longitude === "string" ? params.longitude : "",
      },
    });
  };

  const handleAccountPress = () => {
    try {
      if (!collectorId) {
        Alert.alert("Error", "Collector ID not found. Please login again.");
        return;
      }

      router.push({
        pathname: "/collector_profile",
        params: {
          collector_id: collectorId,
          name: typeof params.name === "string" ? params.name : "",
          email: typeof params.email === "string" ? params.email : "",
          phone: typeof params.phone === "string" ? params.phone : "",
          address: typeof params.address === "string" ? params.address : "",
          area: typeof params.area === "string" ? params.area : "",
          city: typeof params.city === "string" ? params.city : "",
          latitude: typeof params.latitude === "string" ? params.latitude : "",
          longitude: typeof params.longitude === "string" ? params.longitude : "",
        },
      });
    } catch (error) {
      console.log("Account navigation error:", error);
      Alert.alert("Error", "Unable to open profile");
    }
  };

  const FILTERS: { key: FilterType; label: string }[] = [
    { key: "all", label: "All" },
    { key: "pending", label: "Pending" },
    { key: "accepted", label: "Accepted" },
    { key: "rejected", label: "Rejected" },
    { key: "completed", label: "Completed" },
  ];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#dff5e4", "#bde8c4", "#a9ddb3"]}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Requests</Text>
          <Text style={styles.headerSubTitle}>
            Track all pickup requests sent by you
          </Text>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
        >
          <View style={styles.summaryCard}>
            <View style={styles.summaryBox}>
              <Text style={styles.summaryLabel}>Total Requests</Text>
              <Text style={styles.summaryValue}>{requests.length}</Text>
            </View>

            <View style={styles.summaryDivider} />

            <View style={styles.summaryBox}>
              <Text style={styles.summaryLabel}>Pending</Text>
              <Text style={styles.summaryValue}>
                {countByStatus("pending")}
              </Text>
            </View>

            <View style={styles.summaryDivider} />

            <View style={styles.summaryBox}>
              <Text style={styles.summaryLabel}>Accepted</Text>
              <Text style={styles.summaryValue}>
                {countByStatus("accepted")}
              </Text>
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
                  style={[
                    styles.filterChip,
                    active && styles.filterChipActive,
                  ]}
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
              <ActivityIndicator size="large" color="#2F855A" />
            ) : filteredRequests.length === 0 ? (
              <View style={styles.emptyCard}>
                <FileText size={34} color="#7A8A82" />
                <Text style={styles.emptyTitle}>No requests found</Text>
                <Text style={styles.emptySubTitle}>
                  Your request history will appear here.
                </Text>
              </View>
            ) : (
              filteredRequests.map((item: any, index: number) => {
                const normalizedStatus = getNormalizedStatus(item);
                const statusStyle = getStatusColors(normalizedStatus);

                return (
                  <View
                    key={item.request_id || item.pickup_id || index}
                    style={styles.requestCard}
                  >
                    <View style={styles.requestTopRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.sellerName}>
                          {item.seller_name || "Seller"}
                        </Text>
                        <Text style={styles.requestSubText}>
                          {item.address || "No address"}
                        </Text>
                      </View>

                      <View
                        style={[
                          styles.statusBadge,
                          { backgroundColor: statusStyle.bg },
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusBadgeText,
                            { color: statusStyle.text },
                          ]}
                        >
                          {getStatusLabel(item)}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.metaGrid}>
                      <View style={styles.metaCard}>
                        <Text style={styles.metaLabel}>Items</Text>
                        <Text style={styles.metaValue}>
                          {Array.isArray(item.items)
                            ? item.items.length
                            : Number(item.item_count || 0)}
                        </Text>
                      </View>

                      <View style={styles.metaCard}>
                        <Text style={styles.metaLabel}>Total</Text>
                        <Text style={styles.metaValue}>
                          ₹ {Number(item.total_amount || 0).toFixed(2)}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.slotCard}>
                      <Text style={styles.slotTitle}>Pickup Slot</Text>
                      <Text style={styles.slotValue}>
                        {formatDate(item.pickup_date || item.pickupdate)}
                      </Text>
                      <Text style={styles.slotValue}>
                        {item.pickup_time || item.time_slot || "Not set"}
                      </Text>
                    </View>

                    <Text style={styles.requestDate}>
                      Requested on: {formatDate(item.created_at)}
                    </Text>

                    <TouchableOpacity
                      style={styles.viewButton}
                      onPress={() => openRequestDetails(item)}
                    >
                      <Text style={styles.viewButtonText}>View Details</Text>
                    </TouchableOpacity>
                  </View>
                );
              })
            )}
          </View>
        </ScrollView>

        <View style={styles.bottomNav}>
          <NavItem
            icon={<Home color="#718096" size={24} />}
            label="Home"
            onPress={handleHomePress}
          />
          <NavItem
            icon={<FileText color="#1a365d" size={24} />}
            label="Requests"
            active
          />
          <NavItem
            icon={<Users color="#718096" size={24} />}
            label="Posts"
            onPress={handlePostsPress}
          />
          <NavItem
            icon={<User color="#718096" size={24} />}
            label="Account"
            onPress={handleAccountPress}
          />
        </View>
      </SafeAreaView>
    </View>
  );
};

const NavItem = ({
  icon,
  label,
  active = false,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onPress?: () => void;
}) => (
  <TouchableOpacity style={styles.navItem} onPress={onPress}>
    {icon}
    <Text
      style={[
        styles.navLabel,
        active && { color: "#1a365d", fontWeight: "bold" },
      ]}
    >
      {label}
    </Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  header: {
    paddingHorizontal: 20,
    paddingTop: 26,
    marginBottom: 16,
  },

  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1a365d",
  },

  headerSubTitle: {
    fontSize: 13,
    color: "#4a5568",
    marginTop: 4,
    fontWeight: "500",
  },

  summaryCard: {
    backgroundColor: "white",
    marginHorizontal: 20,
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
    paddingHorizontal: 20,
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
    color: "white",
  },

  listWrap: {
    paddingHorizontal: 20,
    paddingTop: 6,
  },

  emptyCard: {
    backgroundColor: "white",
    borderRadius: 20,
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: "center",
    elevation: 2,
  },

  emptyTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: "#2d3748",
    marginTop: 12,
  },

  emptySubTitle: {
    fontSize: 13,
    color: "#718096",
    marginTop: 6,
    textAlign: "center",
  },

  requestCard: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 15,
    marginBottom: 14,
    elevation: 2,
  },

  requestTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  sellerName: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1a365d",
  },

  requestSubText: {
    fontSize: 12,
    color: "#718096",
    marginTop: 3,
  },

  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginLeft: 10,
  },

  statusBadgeText: {
    fontSize: 11,
    fontWeight: "800",
  },

  metaGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  metaCard: {
    width: "48%",
    backgroundColor: "#f8fbf9",
    borderRadius: 14,
    padding: 12,
  },

  metaLabel: {
    fontSize: 11,
    color: "#718096",
    fontWeight: "600",
    marginBottom: 4,
  },

  metaValue: {
    fontSize: 14,
    color: "#1a365d",
    fontWeight: "800",
  },

  slotCard: {
    backgroundColor: "#f8fbf9",
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },

  slotTitle: {
    fontSize: 12,
    color: "#718096",
    fontWeight: "700",
    marginBottom: 4,
  },

  slotValue: {
    fontSize: 13,
    color: "#2d3748",
    fontWeight: "600",
    marginBottom: 2,
  },

  requestDate: {
    fontSize: 12,
    color: "#718096",
    marginBottom: 12,
    fontWeight: "500",
  },

  viewButton: {
    backgroundColor: "#1e6fd9",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },

  viewButtonText: {
    color: "white",
    fontWeight: "800",
    fontSize: 14,
  },

  bottomNav: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    height: 70,
    backgroundColor: "white",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    elevation: 20,
  },

  navItem: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: -6,
  },

  navLabel: {
    fontSize: 10,
    marginTop: 4,
    color: "#718096",
  },
});

export default CollectorRequestsScreen;