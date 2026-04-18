import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import { getRequest, postRequest } from "../Services/axiosServices";

const SellerDetails = () => {
  const router = useRouter();
  const mapRef = useRef<MapView>(null);

  const {
    post_id,
    seller_id,
    collector_id,
    name,
    address,
    sellerLat,
    sellerLng,
    collectorLat,
    collectorLng,
    pickup_date,
    pickup_time,
    total_amount,
    item_count,
    post_status,
  } = useLocalSearchParams<{
    post_id?: string;
    seller_id?: string;
    collector_id?: string;
    name?: string;
    address?: string;
    sellerLat?: string;
    sellerLng?: string;
    collectorLat?: string;
    collectorLng?: string;
    pickup_date?: string;
    pickup_time?: string;
    total_amount?: string;
    item_count?: string;
    post_status?: string;
  }>();

  const [items, setItems] = useState<any[]>([]);
  const [itemsLoading, setItemsLoading] = useState(true);
  const [sendingRequest, setSendingRequest] = useState(false);
  const [requestStatus, setRequestStatus] = useState<string>("");

  const parsedSellerLat = sellerLat ? parseFloat(sellerLat) : NaN;
  const parsedSellerLng = sellerLng ? parseFloat(sellerLng) : NaN;
  const parsedCollectorLat = collectorLat ? parseFloat(collectorLat) : NaN;
  const parsedCollectorLng = collectorLng ? parseFloat(collectorLng) : NaN;

  const hasValidCoords =
    !isNaN(parsedSellerLat) &&
    !isNaN(parsedSellerLng) &&
    !isNaN(parsedCollectorLat) &&
    !isNaN(parsedCollectorLng);

  const sellerLatitude = hasValidCoords ? parsedSellerLat : 21.1702;
  const sellerLongitude = hasValidCoords ? parsedSellerLng : 72.8311;
  const collectorLatitude = hasValidCoords ? parsedCollectorLat : 21.19;
  const collectorLongitude = hasValidCoords ? parsedCollectorLng : 72.81;

  const routeCoordinates = useMemo(
    () => [
      {
        latitude: collectorLatitude,
        longitude: collectorLongitude,
      },
      {
        latitude: sellerLatitude,
        longitude: sellerLongitude,
      },
    ],
    [collectorLatitude, collectorLongitude, sellerLatitude, sellerLongitude]
  );

  const formatDate = (dateValue: any) => {
    if (!dateValue) return "Not set";

    try {
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return String(dateValue);

      return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
    } catch {
      return String(dateValue);
    }
  };

  const getStatusLabel = (status: string) => {
    switch ((status || "").toLowerCase()) {
      case "pending":
        return "Pending";
      case "accepted":
        return "Accepted";
      case "rejected":
        return "Rejected";
      case "cancelled":
        return "Cancelled";
      default:
        return "Not Requested";
    }
  };

  const getStatusBg = (status: string) => {
    switch ((status || "").toLowerCase()) {
      case "pending":
        return "#FFF6E5";
      case "accepted":
        return "#E8F7EC";
      case "rejected":
        return "#FDECEC";
      case "cancelled":
        return "#EEF1F5";
      default:
        return "#EDF5EF";
    }
  };

  const getStatusColor = (status: string) => {
    switch ((status || "").toLowerCase()) {
      case "pending":
        return "#D08A00";
      case "accepted":
        return "#2F855A";
      case "rejected":
        return "#D64545";
      case "cancelled":
        return "#667085";
      default:
        return "#2F855A";
    }
  };

  const fetchPostItems = async () => {
    try {
      setItemsLoading(true);

      if (!post_id) {
        setItems([]);
        return;
      }

      /**
       * Expected backend:
       * GET /seller-public/post-items/:post_id
       * Response:
       * {
       *   Status: "OK",
       *   Result: [
       *     {
       *       sub_category_name,
       *       quantity,
       *       unit,
       *       estimated_price
       *     }
       *   ]
       * }
       */
      const response = await getRequest(`/seller-public/post-items/${post_id}`, false);

      if (response?.Status === "OK") {
        setItems(response.Result || []);
      } else {
        setItems([]);
      }
    } catch (error) {
      console.log("fetchPostItems error:", error);
      setItems([]);
    } finally {
      setItemsLoading(false);
    }
  };

  const fetchMyRequestStatus = async () => {
    try {
      if (!post_id || !collector_id) {
        setRequestStatus("");
        return;
      }

      /**
       * Expected backend:
       * GET /pickup-request/status/${post_id}/${collector_id}
       * Response:
       * {
       *   Status: "OK",
       *   Result: {
       *     request_status: "pending"
       *   }
       * }
       */
      const response = await getRequest(
        `/pickup-request/status/${post_id}/${collector_id}`,
        false
      );

      if (response?.Status === "OK") {
        setRequestStatus(response?.Result?.request_status || "");
      } else {
        setRequestStatus("");
      }
    } catch (error) {
      console.log("fetchMyRequestStatus error:", error);
      setRequestStatus("");
    }
  };

  useEffect(() => {
    fetchPostItems();
  }, [post_id]);

  useFocusEffect(
    useCallback(() => {
      fetchMyRequestStatus();
    }, [post_id, collector_id])
  );

  useEffect(() => {
    if (!hasValidCoords) {
      return;
    }

    const timer = setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.fitToCoordinates(routeCoordinates, {
          edgePadding: {
            top: 80,
            right: 80,
            bottom: 80,
            left: 80,
          },
          animated: true,
        });
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [hasValidCoords, routeCoordinates]);

  const openTransportationRoute = async () => {
    if (!hasValidCoords) {
      Alert.alert("Error", "Collector or seller coordinates are missing.");
      return;
    }

    const url =
      `https://www.google.com/maps/dir/?api=1` +
      `&origin=${collectorLatitude},${collectorLongitude}` +
      `&destination=${sellerLatitude},${sellerLongitude}` +
      `&travelmode=driving`;

    const supported = await Linking.canOpenURL(url);

    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert("Error", "Unable to open Google Maps route.");
    }
  };

  const handleSendRequest = async () => {
    try {
      if (!post_id) {
        Alert.alert("Error", "Post ID not found");
        return;
      }

      if (!seller_id) {
        Alert.alert("Error", "Seller ID not found");
        return;
      }

      if (!collector_id) {
        Alert.alert("Error", "Collector ID not found. Please login again.");
        return;
      }

      if (requestStatus === "pending") {
        Alert.alert("Info", "Your request is already pending.");
        return;
      }

      if (requestStatus === "accepted") {
        Alert.alert("Info", "Your request has already been accepted.");
        return;
      }

      if ((post_status || "").toLowerCase() === "booked") {
        Alert.alert("Unavailable", "This scrap post is already booked.");
        return;
      }

      if ((post_status || "").toLowerCase() === "completed") {
        Alert.alert("Unavailable", "This scrap post is already completed.");
        return;
      }

      setSendingRequest(true);

      /**
       * Expected backend:
       * POST /pickup-request/save
       * body:
       * {
       *   post_id,
       *   seller_id,
       *   collector_id
       * }
       */
      const response = await postRequest("/pickup-request/save", {
        post_id,
        seller_id,
        collector_id,
      });

      if (response?.Status === "OK") {
        setRequestStatus("pending");
        Alert.alert("Success", "Pickup request sent successfully.");
      } else {
        Alert.alert("Failed", response?.Result || "Unable to send request.");
      }
    } catch (error: any) {
      console.log("handleSendRequest error:", error);
      Alert.alert("Error", error?.message || "Something went wrong");
    } finally {
      setSendingRequest(false);
    }
  };

  const renderBottomButton = () => {
    if (requestStatus === "accepted") {
      return (
        <View
          style={[
            styles.requestStatusButton,
            { backgroundColor: "#2F855A" },
          ]}
        >
          <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
          <Text style={styles.requestStatusButtonText}>Request Accepted</Text>
        </View>
      );
    }

    if (requestStatus === "pending") {
      return (
        <View
          style={[
            styles.requestStatusButton,
            { backgroundColor: "#D69E2E" },
          ]}
        >
          <Ionicons name="time-outline" size={18} color="#fff" />
          <Text style={styles.requestStatusButtonText}>Request Pending</Text>
        </View>
      );
    }

    if (requestStatus === "rejected") {
      return (
        <TouchableOpacity
          style={[styles.scheduleBtn, { backgroundColor: "#1E6FD9" }]}
          onPress={handleSendRequest}
          disabled={sendingRequest}
        >
          {sendingRequest ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Ionicons name="send-outline" size={18} color="white" />
              <Text style={styles.scheduleText}>Send Request Again</Text>
            </>
          )}
        </TouchableOpacity>
      );
    }

    if (requestStatus === "cancelled") {
      return (
        <View
          style={[
            styles.requestStatusButton,
            { backgroundColor: "#667085" },
          ]}
        >
          <Ionicons name="close-circle-outline" size={18} color="#fff" />
          <Text style={styles.requestStatusButtonText}>Request Cancelled</Text>
        </View>
      );
    }

    return (
      <TouchableOpacity
        style={styles.scheduleBtn}
        onPress={handleSendRequest}
        disabled={sendingRequest}
      >
        {sendingRequest ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <>
            <Ionicons name="send-outline" size={18} color="white" />
            <Text style={styles.scheduleText}>Send Request</Text>
          </>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={["#2f855a", "#38a169"]} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>

        <Text style={styles.headerText}>Scrap Post Details</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.infoBox}>
          <View style={styles.titleRow}>
            <Text style={styles.name}>{name || "Seller Name"}</Text>

            <View
              style={[
                styles.statusChip,
                { backgroundColor: getStatusBg(requestStatus) },
              ]}
            >
              <Text
                style={[
                  styles.statusChipText,
                  { color: getStatusColor(requestStatus) },
                ]}
              >
                {getStatusLabel(requestStatus)}
              </Text>
            </View>
          </View>

          <View style={styles.row}>
            <Ionicons name="location-outline" size={18} color="#2f855a" />
            <Text style={styles.infoText}>{address || "Seller Address"}</Text>
          </View>

          <View style={styles.row}>
            <Ionicons name="calendar-outline" size={18} color="#2f855a" />
            <Text style={styles.infoText}>{formatDate(pickup_date)}</Text>
          </View>

          <View style={styles.row}>
            <Ionicons name="time-outline" size={18} color="#2f855a" />
            <Text style={styles.infoText}>{pickup_time || "Not set"}</Text>
          </View>

          <Text style={styles.smallInfo}>Seller ID: {seller_id || "N/A"}</Text>
          <Text style={styles.smallInfo}>Post ID: {post_id || "N/A"}</Text>
        </View>

        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total Items</Text>
            <Text style={styles.summaryValue}>{item_count || items.length || 0}</Text>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Overall Total</Text>
            <Text style={styles.summaryValue}>
              ₹ {Number(total_amount || 0).toFixed(2)}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Scrap Items</Text>

        <View style={styles.itemsBox}>
          {itemsLoading ? (
            <ActivityIndicator size="small" color="#2f855a" />
          ) : items.length === 0 ? (
            <Text style={styles.emptyText}>No items found for this post</Text>
          ) : (
            items.map((item, index) => (
              <View
                key={index}
                style={[
                  styles.itemRow,
                  index === items.length - 1 && { borderBottomWidth: 0 },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemName}>
                    {item.sub_category_name || "Scrap Item"}
                  </Text>
                  <Text style={styles.itemQty}>
                    Weight: {item.quantity || 0} {item.unit || "kg"}
                  </Text>
                  <Text style={styles.itemPrice}>
                    Estimated Price: ₹{" "}
                    {Number(item.estimated_price || 0).toFixed(2)}
                  </Text>
                </View>

                <Ionicons name="cube-outline" size={20} color="#7b8794" />
              </View>
            ))
          )}
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 18 }]}>
          Transportation Preview
        </Text>

        <View style={styles.mapCard}>
          <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={{
              latitude: (collectorLatitude + sellerLatitude) / 2,
              longitude: (collectorLongitude + sellerLongitude) / 2,
              latitudeDelta: 0.08,
              longitudeDelta: 0.08,
            }}
          >
            <Marker
              coordinate={{
                latitude: collectorLatitude,
                longitude: collectorLongitude,
              }}
              title="Collector Location"
              description="Collector current location"
              pinColor="green"
            />

            <Marker
              coordinate={{
                latitude: sellerLatitude,
                longitude: sellerLongitude,
              }}
              title={name ? String(name) : "Seller Location"}
              description={address ? String(address) : "Seller Address"}
              pinColor="red"
            />

            {hasValidCoords && (
              <Polyline
                coordinates={routeCoordinates}
                strokeWidth={5}
                strokeColor="#2f855a"
                lineCap="round"
                lineJoin="round"
              />
            )}
          </MapView>

          <View style={styles.routeInfoBox}>
            <View style={styles.routeRow}>
              <Ionicons
                name="navigate-circle-outline"
                size={18}
                color="#2f855a"
              />
              <Text style={styles.routeText}>
                In-app preview is straight. Tap below for real transportation
                route.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.transportBtn}
              onPress={openTransportationRoute}
            >
              <Ionicons name="navigate" size={18} color="white" />
              <Text style={styles.transportBtnText}>Open Transportation Route</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottom}>{renderBottomButton()}</View>
    </SafeAreaView>
  );
};

export default SellerDetails;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f2f4f7",
  },

  header: {
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
  },

  back: {
    position: "absolute",
    left: 15,
  },

  headerText: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
  },

  scrollContent: {
    padding: 15,
    paddingBottom: 30,
  },

  infoBox: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 15,
    marginBottom: 15,
    elevation: 2,
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  name: {
    flex: 1,
    fontSize: 18,
    fontWeight: "bold",
    color: "#1a202c",
    marginRight: 10,
  },

  statusChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 30,
  },

  statusChipText: {
    fontSize: 12,
    fontWeight: "700",
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },

  infoText: {
    marginLeft: 8,
    color: "#555",
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
  },

  smallInfo: {
    color: "#666",
    marginTop: 4,
    fontSize: 12,
  },

  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },

  summaryCard: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 14,
    elevation: 2,
  },

  summaryLabel: {
    fontSize: 13,
    color: "#718096",
    fontWeight: "600",
    marginBottom: 6,
  },

  summaryValue: {
    fontSize: 18,
    color: "#1a365d",
    fontWeight: "800",
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#1a365d",
  },

  itemsBox: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 10,
    elevation: 2,
  },

  emptyText: {
    textAlign: "center",
    color: "#666",
    paddingVertical: 10,
  },

  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },

  itemName: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#222",
  },

  itemQty: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
  },

  itemPrice: {
    fontSize: 13,
    color: "#2f855a",
    marginTop: 4,
    fontWeight: "600",
  },

  mapCard: {
    backgroundColor: "#fff",
    borderRadius: 15,
    overflow: "hidden",
    elevation: 2,
  },

  map: {
    width: "100%",
    height: 260,
  },

  routeInfoBox: {
    padding: 12,
  },

  routeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },

  routeText: {
    marginLeft: 8,
    color: "#444",
    fontSize: 13,
    flex: 1,
  },

  transportBtn: {
    backgroundColor: "#1e6fd9",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 4,
  },

  transportBtnText: {
    color: "white",
    fontWeight: "bold",
    marginLeft: 8,
  },

  bottom: {
    padding: 15,
    backgroundColor: "#fff",
  },

  scheduleBtn: {
    backgroundColor: "#2f855a",
    padding: 15,
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },

  scheduleText: {
    color: "white",
    fontWeight: "bold",
    marginLeft: 8,
  },

  requestStatusButton: {
    padding: 15,
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },

  requestStatusButtonText: {
    color: "#fff",
    fontWeight: "bold",
    marginLeft: 8,
  },
});