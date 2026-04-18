import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
    ActivityIndicator,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { getRequest } from "../Services/axiosServices";

type RequestItem = {
  pickup_id?: string;
  seller_id?: string;
  collector_id?: string;
  seller_name?: string;
  seller_address?: string;
  address?: string;
  status?: string;
  total_amount?: number;
  pickupdate?: string;
  pickup_time?: string;
  collector_seen?: boolean;
  created_at?: string;
  updated_at?: string;
};

export default function CollectorSeeSellerAllRequests() {
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

  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");

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

  const getStatusColor = (status: string) => {
    const normalized = String(status || "").toLowerCase();

    if (normalized === "accepted" || normalized === "scheduled") {
      return "#D08D1D";
    }

    if (normalized === "rejected") {
      return "#C53030";
    }

    return "#D69E2E";
  };

  const fetchRequests = async () => {
    try {
      if (!collectorId) {
        setRequests([]);
        return;
      }

      setLoading(true);

      const response = await getRequest(
        `/pickup-direct/collector/${collectorId}`,
        false
      );

      if (response?.Status === "OK") {
        setRequests(response.Result || []);
      } else {
        setRequests([]);
      }
    } catch (error) {
      console.log("fetch collector requests error:", error);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchRequests();
    }, [collectorId])
  );

  const filteredRequests = useMemo(() => {
    const query = searchText.trim().toLowerCase();

    if (!query) return requests;

    return requests.filter((item) => {
      const sellerName = String(item.seller_name || "").toLowerCase();
      const address = String(
        item.seller_address || item.address || ""
      ).toLowerCase();
      const status = String(item.status || "").toLowerCase();

      return (
        sellerName.includes(query) ||
        address.includes(query) ||
        status.includes(query)
      );
    });
  }, [requests, searchText]);

  const handleBack = () => {
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

  const handleView = (item: RequestItem) => {
    router.push({
      pathname: "/pickupDetails_collector",
      params: {
        pickup: JSON.stringify(item),
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

  return (
    <LinearGradient
      colors={["#17844c", "#2d9b62", "#45ae78"]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Pickup Requests</Text>
          </View>

          <View style={styles.headerRightSpace} />
        </View>

        <View style={styles.body}>
          <View style={styles.searchBox}>
            <Ionicons name="search-outline" size={18} color="#9AA0A6" />
            <TextInput
              value={searchText}
              onChangeText={setSearchText}
              placeholder="Search Requests..."
              placeholderTextColor="#9AA0A6"
              style={styles.searchInput}
            />
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {loading ? (
              <View style={styles.loaderWrap}>
                <ActivityIndicator size="large" color="#2F855A" />
              </View>
            ) : filteredRequests.length === 0 ? (
              <View style={styles.emptyWrap}>
                <Text style={styles.emptyTitle}>No requests found</Text>
                <Text style={styles.emptySub}>
                  Pickup requests will appear here.
                </Text>
              </View>
            ) : (
              filteredRequests.map((item, index) => {
                const sellerName = item.seller_name || "Seller";
                const address =
                  item.seller_address || item.address || "No address";
                const status = item.status || "pending";

                return (
                  <View
                    key={item.pickup_id || `${sellerName}-${index}`}
                    style={styles.requestCard}
                  >
                    <View style={styles.cardTopRow}>
                      <View style={styles.cardLeft}>
                        <Text style={styles.nameText}>{sellerName}</Text>
                        <Text style={styles.addressText} numberOfLines={1}>
                          {address}
                        </Text>

                        {!!item.pickupdate && (
                          <Text style={styles.metaText}>
                            {formatDate(item.pickupdate)}
                            {item.pickup_time ? ` • ${item.pickup_time}` : ""}
                          </Text>
                        )}

                        {!!item.total_amount && (
                          <Text style={styles.metaText}>
                            ₹ {Number(item.total_amount || 0).toFixed(2)}
                          </Text>
                        )}

                        <Text
                          style={[
                            styles.statusText,
                            { color: getStatusColor(status) },
                          ]}
                        >
                          {status}
                        </Text>
                      </View>

                      <TouchableOpacity
                        style={styles.viewButton}
                        onPress={() => handleView(item)}
                      >
                        <Text style={styles.viewButtonText}>View</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>
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
    height: 72,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
  },

  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },

  headerCenter: {
    flex: 1,
    alignItems: "center",
  },

  headerTitle: {
    fontSize: 21,
    fontWeight: "800",
    color: "#fff",
  },

  headerRightSpace: {
    width: 38,
  },

  body: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingTop: 14,
    paddingHorizontal: 10,
  },

  searchBox: {
    height: 46,
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },

  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: "#1F2937",
  },

  scrollContent: {
    paddingBottom: 110,
  },

  loaderWrap: {
    paddingTop: 30,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyWrap: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    marginTop: 10,
  },

  emptyTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#2D3748",
    marginBottom: 6,
  },

  emptySub: {
    fontSize: 13,
    color: "#718096",
    textAlign: "center",
  },

  requestCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 12,
    elevation: 2,
  },

  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  cardLeft: {
    flex: 1,
    paddingRight: 12,
  },

  nameText: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1F2937",
    marginBottom: 3,
  },

  addressText: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 3,
    fontWeight: "500",
  },

  metaText: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 2,
  },

  statusText: {
    fontSize: 15,
    fontWeight: "800",
    textTransform: "capitalize",
    marginTop: 2,
  },

  viewButton: {
    backgroundColor: "#2F8A57",
    minWidth: 72,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  viewButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
  },
});