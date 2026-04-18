import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo } from "react";
import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

type RequestItem = {
  subcategory_name?: string;
  sub_category_name?: string;
  category_name?: string;
  approx_weight?: number | string;
  total_amount?: number | string;
  price?: number | string;
};

type RequestData = {
  collector_name?: string;
  collector_address?: string;
  address?: string;
  status?: string;
  request_status?: string;
  pickupdate?: string;
  pickup_date?: string;
  pickup_time?: string;
  total_amount?: number | string;
  items?: RequestItem[];
};

export default function CollectorRequestDetails() {
  const router = useRouter();
  const params = useLocalSearchParams<{ request?: string }>();

  const requestData: RequestData = useMemo(() => {
    try {
      if (typeof params.request === "string") {
        return JSON.parse(params.request);
      }
      return {};
    } catch (error) {
      console.log("Request parse error:", error);
      return {};
    }
  }, [params.request]);

  const statusText =
    requestData.status || requestData.request_status || "Pending";

  const normalizedStatus = String(statusText).toLowerCase();

  const requestDate = requestData.pickupdate || requestData.pickup_date || "-";
  const requestTime = requestData.pickup_time || "-";
  const totalAmount = Number(requestData.total_amount || 0);

  const items = Array.isArray(requestData.items) ? requestData.items : [];

  const getStatusStyle = () => {
    if (normalizedStatus === "accepted") return styles.acceptedText;
    if (normalizedStatus === "rejected") return styles.rejectedText;
    return styles.pendingText;
  };

  const getItemTitle = (item: RequestItem) => {
    if (item.category_name && item.sub_category_name) {
      return `${item.category_name} - ${item.sub_category_name}`;
    }
    if (item.category_name && item.subcategory_name) {
      return `${item.category_name} - ${item.subcategory_name}`;
    }
    return (
      item.subcategory_name ||
      item.sub_category_name ||
      item.category_name ||
      "Scrap Item"
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient colors={["#2f855a", "#2f855a"]} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Request Details</Text>

        <View style={styles.headerRightSpace} />
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Collector Info</Text>

          <View style={styles.infoBlock}>
            <Text style={styles.label}>Name</Text>
            <Text style={styles.valueBold}>
              {requestData.collector_name || "Collector"}
            </Text>
          </View>

          <View style={styles.infoBlock}>
            <Text style={styles.label}>Address</Text>
            <Text style={styles.valueBold}>
              {requestData.collector_address ||
                requestData.address ||
                "No address available"}
            </Text>
          </View>

          <View style={styles.infoBlock}>
            <Text style={styles.label}>Status</Text>
            <Text style={[styles.statusText, getStatusStyle()]}>
              {statusText}
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Pickup Info</Text>

          <View style={styles.rowBetween}>
            <Text style={styles.label}>Date</Text>
            <Text style={styles.rightValue}>{requestDate}</Text>
          </View>

          <View style={styles.rowBetween}>
            <Text style={styles.label}>Time</Text>
            <Text style={styles.rightValue}>{requestTime}</Text>
          </View>

          <View style={styles.rowBetween}>
            <Text style={styles.label}>Total Amount</Text>
            <Text style={styles.rightValue}>₹{totalAmount}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Items</Text>

          {items.length === 0 ? (
            <Text style={styles.emptyText}>No items available</Text>
          ) : (
            items.map((item, index) => {
              const qty = Number(item.approx_weight || 0);
              const amount =
                Number(item.total_amount || 0) ||
                Number(item.price || 0) * qty;

              return (
                <View
                  key={index}
                  style={[
                    styles.itemRow,
                    index === items.length - 1 && styles.lastItemRow,
                  ]}
                >
                  <View style={styles.itemLeft}>
                    <Text style={styles.itemTitle}>{getItemTitle(item)}</Text>
                    <Text style={styles.itemQty}>Qty: {qty} kg</Text>
                  </View>

                  <Text style={styles.itemAmount}>₹{amount}</Text>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#bfe3c4",
  },

  header: {
    height: 86,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },

  backBtn: {
    width: 36,
    alignItems: "flex-start",
    justifyContent: "center",
  },

  headerTitle: {
    flex: 1,
    textAlign: "center",
    color: "#fff",
    fontSize: 26,
    fontWeight: "800",
  },

  headerRightSpace: {
    width: 36,
  },

  scrollContent: {
    padding: 12,
    paddingBottom: 30,
  },

  card: {
    backgroundColor: "#f2f2f2",
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#2f855a",
    marginBottom: 12,
  },

  infoBlock: {
    marginBottom: 10,
  },

  label: {
    fontSize: 14,
    color: "#777",
    fontWeight: "600",
    marginBottom: 2,
  },

  valueBold: {
    fontSize: 16,
    color: "#222",
    fontWeight: "800",
  },

  statusText: {
    fontSize: 16,
    fontWeight: "800",
    textTransform: "capitalize",
  },

  pendingText: {
    color: "#c98514",
  },

  acceptedText: {
    color: "#2f855a",
  },

  rejectedText: {
    color: "#d06c1b",
  },

  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },

  rightValue: {
    fontSize: 16,
    color: "#222",
    fontWeight: "800",
  },

  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#dddddd",
  },

  lastItemRow: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },

  itemLeft: {
    flex: 1,
    paddingRight: 10,
  },

  itemTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#222",
    marginBottom: 2,
  },

  itemQty: {
    fontSize: 14,
    color: "#777",
    fontWeight: "500",
  },

  itemAmount: {
    fontSize: 16,
    color: "#2f855a",
    fontWeight: "800",
  },

  emptyText: {
    color: "#777",
    fontSize: 14,
    textAlign: "center",
    paddingVertical: 10,
  },
});