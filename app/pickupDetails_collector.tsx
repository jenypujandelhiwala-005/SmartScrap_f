import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { putRequest } from "../Services/axiosServices";

const PickupDetailsCollector = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [actionStatus, setActionStatus] = useState<string | null>(null);

  const pickup = useMemo(() => {
    try {
      return params.pickup ? JSON.parse(params.pickup as string) : null;
    } catch (error) {
      console.log("Pickup parse error:", error);
      return null;
    }
  }, [params.pickup]);

  useEffect(() => {
    if (pickup?.status) {
      setActionStatus(String(pickup.status).toLowerCase());
    }
  }, [pickup]);

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

  const handleAction = async (status: "accepted" | "rejected") => {
    try {
      if (!pickup?.pickup_id) {
        Alert.alert("Error", "Pickup ID not found");
        return;
      }

      const endpoint =
        status === "accepted"
          ? `/pickup-direct/accept/${pickup.pickup_id}`
          : `/pickup-direct/reject/${pickup.pickup_id}`;

      console.log("API CALL:", endpoint);
      console.log("PICKUP DATA:", pickup);

      const data = await putRequest(endpoint, {}, false);

      console.log("API RESPONSE:", data);

      if (data?.Status === "OK") {
        setActionStatus(status);
        Alert.alert("Success", `Pickup ${status} successfully`);
      } else {
        Alert.alert(
          "Error",
          data?.Result || data?.Message || "Failed to update pickup status"
        );
      }
    } catch (err) {
      console.log("pickup status update error:", err);
      Alert.alert("Error", "Server error");
    }
  };

  const confirmAction = (status: "accepted" | "rejected") => {
    Alert.alert(
      "Confirm Action",
      `Are you sure you want to ${status} this pickup?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Yes", onPress: () => handleAction(status) },
      ]
    );
  };

  if (!pickup) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.emptyText}>No Pickup Data Found</Text>
      </SafeAreaView>
    );
  }

  const sellerAddress = pickup.seller_address || pickup.address || "No address";
  const pickupDate = pickup.pickup_date || pickup.pickupdate || "Not set";
  const pickupTime = pickup.time_slot || pickup.pickup_time || "Not set";

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={["#dff5e4", "#bde8c4", "#a9ddb3"]}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView contentContainerStyle={styles.content}>
        <LinearGradient
          colors={["#2f855a", "#38a169"]}
          style={styles.header}
        >
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerText}>Pickup Details</Text>
        </LinearGradient>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Seller Info</Text>

          <Text style={styles.label}>Name</Text>
          <Text style={styles.value}>{pickup.seller_name || "Seller"}</Text>

          <Text style={styles.label}>Address</Text>
          <Text style={styles.value}>{sellerAddress}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Pickup Info</Text>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Date</Text>
            <Text style={styles.value}>{formatDate(pickupDate)}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Time Slot</Text>
            <Text style={styles.value}>{pickupTime}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Total Amount</Text>
            <Text style={styles.value}>
              ₹ {Number(pickup.total_amount || 0).toFixed(2)}
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Items</Text>

          <View style={styles.itemsHeader}>
            <Text style={[styles.itemText, { fontWeight: "700", flex: 1 }]}>
              Item
            </Text>
            <Text
              style={[
                styles.itemText,
                { fontWeight: "700", width: 70, textAlign: "center" },
              ]}
            >
              Qty
            </Text>
            <Text
              style={[
                styles.itemText,
                { fontWeight: "700", width: 90, textAlign: "right" },
              ]}
            >
              Amount
            </Text>
          </View>

          {pickup.items && pickup.items.length > 0 ? (
            pickup.items.map((item: any, i: number) => {
              const itemName = item.subcategory_name
                ? `${item.category_name || "Scrap"} - ${item.subcategory_name}`
                : `${item.category_name || "Scrap"} - ${
                    item.sub_category_name || "Item"
                  }`;

              return (
                <View
                  key={i}
                  style={[
                    styles.itemRow,
                    { backgroundColor: i % 2 === 0 ? "#f9fafc" : "#ffffff" },
                  ]}
                >
                  <Text style={[styles.itemText, { flex: 1 }]}>
                    {itemName}
                  </Text>
                  <Text
                    style={[
                      styles.itemText,
                      { width: 70, textAlign: "center" },
                    ]}
                  >
                    {Number(item.approx_weight || 0)} kg
                  </Text>
                  <Text
                    style={[
                      styles.itemText,
                      { width: 90, textAlign: "right" },
                    ]}
                  >
                    ₹ {Number(item.total_amount || 0).toFixed(2)}
                  </Text>
                </View>
              );
            })
          ) : (
            <Text style={styles.emptyText}>No Items Found</Text>
          )}
        </View>
      </ScrollView>

      <View style={styles.buttonContainer}>
        {actionStatus === "pending" || actionStatus === null ? (
          <>
            <TouchableOpacity
              style={styles.acceptBtn}
              onPress={() => confirmAction("accepted")}
            >
              <Text style={styles.btnText}>Accept</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.declineBtn}
              onPress={() => confirmAction("rejected")}
            >
              <Text style={styles.btnText}>Decline</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.statusBox}>
            <Text
              style={[
                styles.statusText,
                actionStatus === "accepted"
                  ? { color: "#16a34a" }
                  : actionStatus === "rejected"
                  ? { color: "#dc2626" }
                  : { color: "#b7791f" },
              ]}
            >
              {actionStatus.toUpperCase()}
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

export default PickupDetailsCollector;

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  content: { padding: 20, paddingBottom: 100 },

  header: {
    marginBottom: 20,
    padding: 15,
    borderRadius: 12,
    position: "relative",
  },

  backBtn: {
    position: "absolute",
    left: 12,
    top: 12,
    zIndex: 2,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },

  backBtnText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    marginTop: -2,
  },

  statusBox: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f1f5f9",
  },

  statusText: {
    fontSize: 18,
    fontWeight: "700",
  },

  headerText: {
    fontSize: 22,
    fontWeight: "700",
    color: "#fff",
    textAlign: "center",
  },

  card: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
    color: "#2f855a",
  },

  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#555",
  },

  value: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 5,
    color: "#222",
  },

  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
    gap: 12,
  },

  itemsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderColor: "#ddd",
    marginBottom: 8,
  },

  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 5,
    borderRadius: 8,
    alignItems: "center",
  },

  itemText: {
    fontSize: 14,
    color: "#333",
  },

  emptyText: {
    fontSize: 16,
    color: "#888",
    textAlign: "center",
    marginTop: 10,
  },

  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 15,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderColor: "#ddd",
  },

  acceptBtn: {
    flex: 1,
    backgroundColor: "#16a34a",
    padding: 15,
    borderRadius: 10,
    marginRight: 10,
    alignItems: "center",
  },

  declineBtn: {
    flex: 1,
    backgroundColor: "#dc2626",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },

  btnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});