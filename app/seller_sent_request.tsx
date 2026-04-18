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
    View,
} from "react-native";
import { getRequest } from "../Services/axiosServices";

export default function SellerSentRequest() {
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
    typeof params.name === "string" ? params.name : "";

  const sellerAddress =
    typeof params.address === "string" ? params.address : "";

  const sellerLatitude =
    typeof params.latitude === "string" ? Number(params.latitude) : NaN;

  const sellerLongitude =
    typeof params.longitude === "string" ? Number(params.longitude) : NaN;

  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<any[]>([]);
  const [searchText, setSearchText] = useState("");

  const toRad = (value: number) => (value * Math.PI) / 180;

  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ) => {
    if (
      isNaN(lat1) ||
      isNaN(lon1) ||
      isNaN(lat2) ||
      isNaN(lon2)
    ) {
      return null;
    }

    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const fetchRequests = async () => {
    try {
      if (!sellerId) {
        setRequests([]);
        setLoading(false);
        return;
      }

      setLoading(true);

      const response = await getRequest(`/pickup-direct/seller/${sellerId}`, false);

      if (response?.Status === "OK") {
        const formatted = (response.Result || []).map((item: any) => {
          const collectorLat = Number(item?.latitude);
          const collectorLng = Number(item?.longitude);

          const distance = calculateDistance(
            sellerLatitude,
            sellerLongitude,
            collectorLat,
            collectorLng
          );

          return {
            ...item,
            distanceText:
              distance === null ? "" : `${distance.toFixed(2)} km`,
          };
        });

        setRequests(formatted);
      } else {
        setRequests([]);
      }
    } catch (error) {
      console.log("fetchRequests error:", error);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchRequests();
    }, [sellerId])
  );

  const filteredRequests = useMemo(() => {
    const query = searchText.trim().toLowerCase();

    if (!query) return requests;

    return requests.filter((item) => {
      const collectorName = String(item?.collector_name || "").toLowerCase();
      const collectorAddress = String(
        item?.collector_address || item?.address || ""
      ).toLowerCase();
      const status = String(item?.status || "").toLowerCase();

      return (
        collectorName.includes(query) ||
        collectorAddress.includes(query) ||
        status.includes(query)
      );
    });
  }, [requests, searchText]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient colors={["#2f855a", "#379b63"]} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Pickup Requests</Text>

        <View style={styles.headerRightPlaceholder} />
      </LinearGradient>

      <View style={styles.container}>
        <TextInput
          placeholder="Search Requests..."
          placeholderTextColor="#9a9a9a"
          style={styles.searchInput}
          value={searchText}
          onChangeText={setSearchText}
        />

        {loading ? (
          <View style={styles.loaderWrap}>
            <ActivityIndicator size="large" color="#2f855a" />
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {filteredRequests.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>No Requests Found</Text>
              </View>
            ) : (
              filteredRequests.map((item, index) => {
                const statusText = item?.status || "pending";
                const normalizedStatus = String(statusText).toLowerCase();

                return (
                  <View key={index} style={styles.requestCard}>
                    <View style={styles.requestLeft}>
                      <Text style={styles.requestName}>
                        {item?.collector_name || "Collector"}
                      </Text>

                      <Text style={styles.requestAddress}>
                        {item?.collector_address ||
                          item?.address ||
                          "No address available"}
                        {item?.distanceText ? ` • ${item.distanceText}` : ""}
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
                      onPress={() =>
                        router.push({
                          pathname: "/collector_request_details",
                          params: { request: JSON.stringify(item) },
                        })
                      }
                    >
                      <Text style={styles.viewBtnText}>View</Text>
                    </TouchableOpacity>
                  </View>
                );
              })
            )}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#e9e9e9",
  },

  header: {
    paddingTop: 16,
    paddingBottom: 18,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  backBtn: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "flex-start",
  },

  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "800",
    color: "#fff",
  },

  headerRightPlaceholder: {
    width: 36,
  },

  container: {
    flex: 1,
    padding: 14,
  },

  searchInput: {
    height: 42,
    backgroundColor: "#f5f5f5",
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 14,
    color: "#222",
    marginBottom: 14,
  },

  loaderWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  scrollContent: {
    paddingBottom: 20,
  },

  requestCard: {
    backgroundColor: "#f5f5f5",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 14,
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
    color: "#1f1f1f",
    marginBottom: 4,
  },

  requestAddress: {
    fontSize: 13,
    color: "#6f6f6f",
    fontWeight: "600",
    marginBottom: 6,
  },

  requestStatus: {
    fontSize: 13,
    fontWeight: "800",
    textTransform: "capitalize",
  },

  pendingText: {
    color: "#d29a17",
  },

  acceptedText: {
    color: "#d29a17",
  },

  rejectedText: {
    color: "#d27c17",
  },

  viewBtn: {
    backgroundColor: "#2f8a57",
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },

  viewBtnText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "800",
  },

  emptyCard: {
    backgroundColor: "#f5f5f5",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyText: {
    color: "#777",
    fontSize: 14,
    fontWeight: "600",
  },
});