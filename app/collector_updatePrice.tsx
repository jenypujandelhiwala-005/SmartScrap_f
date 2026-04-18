import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { BASE_URL } from "../Services/axiosServices";

export default function UpdatePricesScreen() {
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

  const [myPrices, setMyPrices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const getCleanUrl = (path: string) => {
    const base = BASE_URL.endsWith("/") ? BASE_URL.slice(0, -1) : BASE_URL;
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    return `${base}${cleanPath}`;
  };

  useEffect(() => {
    fetchMyPrices();
  }, []);

  const fetchMyPrices = async () => {
    try {
      if (!collectorId) {
        Alert.alert("Error", "Collector ID not found");
        return;
      }

      const res = await fetch(getCleanUrl(`Collector/prices/${collectorId}`));
      const data = await res.json();

      console.log("MY PRICES RESPONSE:", data);

      if (data.Status === "OK") {
        setMyPrices(data.Result || []);
      } else {
        Alert.alert("Error", data.Result || "Could not load your prices");
      }
    } catch (error) {
      console.error("Fetch Error:", error);
      Alert.alert("Error", "Server connection failed");
    } finally {
      setFetching(false);
    }
  };

  const handleUpdate = async () => {
    const hasEmptyFields = myPrices.some(
      (p) =>
        p.collector_price_per_kg === null ||
        String(p.collector_price_per_kg).trim() === ""
    );

    if (hasEmptyFields) {
      Alert.alert(
        "Validation Error",
        "Price fields cannot be empty. Please enter a valid number for all items."
      );
      return;
    }

    const invalidItems = myPrices.filter(
      (p) => parseFloat(p.collector_price_per_kg) < parseFloat(p.admin_price)
    );

    if (invalidItems.length > 0) {
      const firstError = invalidItems[0];
      Alert.alert(
        "Price Too Low",
        `Your price for "${firstError.sub_category_name}" cannot be lower than the Admin minimum (₹${firstError.admin_price}).`
      );
      return;
    }

    if (!collectorId) {
      Alert.alert("Error", "Collector ID not found");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        collector_id: collectorId,
        prices: myPrices.map((p) => ({
          price_id: p.price_id,
          price_per_kg: parseFloat(p.collector_price_per_kg),
          subcategory_name: p.sub_category_name,
        })),
      };

      const res = await fetch(getCleanUrl("Collector/setup-prices"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      console.log("UPDATE PRICES RESPONSE:", data);

      if (data.Status === "OK") {
        Alert.alert("Success", "Prices updated successfully!", [
          { text: "Done", onPress: () => router.back() },
        ]);
      } else {
        Alert.alert("Error", data.Result || "Update failed");
      }
    } catch (error) {
      console.log("UPDATE PRICES ERROR:", error);
      Alert.alert("Error", "Server connection failed");
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item, index }: { item: any; index: number }) => {
    const currentVal = String(item.collector_price_per_kg ?? "");
    const isInvalid =
      currentVal === "" ||
      parseFloat(currentVal) < parseFloat(item.admin_price);

    return (
      <View style={[styles.card, isInvalid && styles.invalidCard]}>
        <View style={styles.cardHeader}>
          <Text style={styles.catName}>
            {item.category_name} - {item.sub_category_name}
          </Text>
          {isInvalid && (
            <View style={styles.errorBadge}>
              <Text style={styles.errorText}>
                {currentVal === "" ? "REQUIRED" : "BELOW MIN"}
              </Text>
            </View>
          )}
        </View>

        <Text style={styles.adminHint}>
          Admin Minimum Price: ₹{item.admin_price}
        </Text>

        <View style={styles.inputRow}>
          <Text style={styles.label}>Your Buying Price (₹):</Text>
          <TextInput
            style={[styles.input, isInvalid && styles.inputError]}
            keyboardType="numeric"
            placeholder="0.00"
            value={currentVal}
            onChangeText={(val) => {
              const temp = [...myPrices];
              temp[index].collector_price_per_kg = val;
              setMyPrices(temp);
            }}
          />
        </View>
      </View>
    );
  };

  if (fetching) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#2e7d32" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Update My Prices</Text>
      </View>

      <FlatList
        data={myPrices}
        contentContainerStyle={styles.listContainer}
        keyExtractor={(item, index) =>
          item.price_id ? item.price_id.toString() : index.toString()
        }
        renderItem={renderItem}
      />

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.saveBtn}
          onPress={handleUpdate}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveBtnText}>Save All Changes</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f7f5" },

  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
    elevation: 2,
  },

  backBtn: { padding: 5 },

  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginLeft: 15,
    color: "#1a1a1a",
  },

  listContainer: {
    padding: 15,
    paddingBottom: 100,
  },

  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },

  invalidCard: {
    borderColor: "#ff4d4d",
    backgroundColor: "#fff9f9",
  },

  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  catName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
    marginRight: 8,
  },

  errorBadge: {
    backgroundColor: "#ff4d4d",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },

  errorText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },

  adminHint: {
    fontSize: 13,
    color: "#666",
    marginTop: 4,
  },

  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 15,
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    paddingTop: 12,
  },

  label: {
    fontWeight: "600",
    color: "#444",
    flex: 1,
    marginRight: 10,
  },

  input: {
    backgroundColor: "#f0f0f0",
    width: 90,
    padding: 10,
    borderRadius: 10,
    textAlign: "center",
    fontWeight: "bold",
    color: "#2e7d32",
    fontSize: 16,
  },

  inputError: {
    backgroundColor: "#ffebeb",
    color: "#ff4d4d",
    borderWidth: 1,
    borderColor: "#ff4d4d",
  },

  footer: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    backgroundColor: "#fff",
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 10,
  },

  saveBtn: {
    backgroundColor: "#2e7d32",
    padding: 18,
    borderRadius: 12,
    alignItems: "center",
  },

  saveBtnText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 16,
  },
});