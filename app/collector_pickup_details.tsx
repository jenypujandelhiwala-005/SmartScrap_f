import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
    Alert,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import { putRequest } from "../Services/axiosServices";

const CollectorPickupDetailsScreen = () => {
  const router = useRouter();

  const params = useLocalSearchParams<{
    pickup?: string;
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

  const pickup = useMemo(() => {
    try {
      return params.pickup ? JSON.parse(params.pickup) : null;
    } catch {
      return null;
    }
  }, [params.pickup]);

  const initialWeights =
    pickup?.items?.reduce((acc: any, item: any, index: number) => {
      acc[index] = String(item.approx_weight || "");
      return acc;
    }, {}) || {};

  const [actualWeights, setActualWeights] = useState<Record<string, string>>(initialWeights);
  const [loading, setLoading] = useState(false);

  if (!pickup) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Pickup details not found</Text>
      </SafeAreaView>
    );
  }

  const sellerLat = parseFloat(String(pickup.seller_latitude || ""));
  const sellerLng = parseFloat(String(pickup.seller_longitude || ""));

  const hasValidMap = !isNaN(sellerLat) && !isNaN(sellerLng);

  const updateWeight = (index: number, value: string) => {
    setActualWeights((prev) => ({
      ...prev,
      [index]: value,
    }));
  };

  const handleCompletePickup = async () => {
    try {
      const actual_items = (pickup.items || []).map((item: any, index: number) => ({
        category_id: item.category_id || "",
        subcategory_id: item.subcategory_id || item.sub_category_id || "",
        subcategory_name:
          item.subcategory_name || item.sub_category_name || "Scrap Item",
        expected_weight: Number(item.approx_weight || 0),
        actual_weight: Number(actualWeights[index] || 0),
        price: Number(item.price || 0),
      }));

      const invalid = actual_items.some((item: any) => item.actual_weight <= 0);

      if (invalid) {
        Alert.alert("Validation", "Please enter valid actual weight for all items.");
        return;
      }

      setLoading(true);

      const response = await putRequest(
        `/pickup-direct/complete/${pickup.pickup_id}`,
        {
          actual_items,
          completed_by: "collector",
        },
        false
      );

      if (response?.Status === "OK") {
        Alert.alert("Success", "Pickup marked as completed successfully.", [
          {
            text: "OK",
            onPress: () => {
              router.replace({
                pathname: "/collector_pickups",
                params: {
                  collector_id:
                    typeof params.collector_id === "string" ? params.collector_id : "",
                  name: typeof params.name === "string" ? params.name : "",
                  email: typeof params.email === "string" ? params.email : "",
                  phone: typeof params.phone === "string" ? params.phone : "",
                  address: typeof params.address === "string" ? params.address : "",
                  area: typeof params.area === "string" ? params.area : "",
                  city: typeof params.city === "string" ? params.city : "",
                  latitude: typeof params.latitude === "string" ? params.latitude : "",
                  longitude:
                    typeof params.longitude === "string" ? params.longitude : "",
                },
              });
            },
          },
        ]);
      } else {
        Alert.alert("Error", response?.Result || "Unable to complete pickup");
      }
    } catch (error: any) {
      console.log("Complete pickup error:", error);
      Alert.alert("Error", "Something went wrong while completing pickup");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={["#dff5e4", "#bde8c4", "#a9ddb3"]}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        >
          <Text style={styles.pageTitle}>Pickup Details</Text>
          <Text style={styles.pageSubTitle}>
            Review details and complete the pickup
          </Text>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Seller Details</Text>
            <Text style={styles.mainText}>{pickup.seller_name || "Seller"}</Text>
            <Text style={styles.subText}>{pickup.seller_email || "No email"}</Text>
            <Text style={styles.subText}>{pickup.seller_phone || "No phone"}</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Pickup Slot</Text>
            <Text style={styles.mainText}>{pickup.pickupdate || "Not set"}</Text>
            <Text style={styles.subText}>{pickup.pickup_time || "Not set"}</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Pickup Address</Text>
            <Text style={styles.subText}>
              {pickup.seller_address || pickup.address || "No address"}
            </Text>

            {hasValidMap && (
              <MapView
                style={styles.map}
                initialRegion={{
                  latitude: sellerLat,
                  longitude: sellerLng,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
              >
                <Marker
                  coordinate={{ latitude: sellerLat, longitude: sellerLng }}
                  title={pickup.seller_name || "Seller Location"}
                />
              </MapView>
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Scrap Items</Text>

            {(pickup.items || []).length === 0 ? (
              <Text style={styles.subText}>No items found</Text>
            ) : (
              pickup.items.map((item: any, index: number) => (
                <View key={index} style={styles.itemCard}>
                  <Text style={styles.itemTitle}>
                    {item.subcategory_name || item.sub_category_name || "Scrap Item"}
                  </Text>

                  <Text style={styles.itemInfo}>
                    Price: ₹ {Number(item.price || 0).toFixed(2)} / kg
                  </Text>

                  <Text style={styles.itemInfo}>
                    Seller Weight: {Number(item.approx_weight || 0)} kg
                  </Text>

                  <TextInput
                    style={styles.input}
                    placeholder="Enter actual collected kg"
                    keyboardType="numeric"
                    value={actualWeights[index] || ""}
                    onChangeText={(text) => updateWeight(index, text)}
                  />
                </View>
              ))
            )}
          </View>

          <TouchableOpacity
            style={[styles.completeBtn, loading && { opacity: 0.7 }]}
            onPress={handleCompletePickup}
            disabled={loading}
          >
            <Text style={styles.completeBtnText}>
              {loading ? "Completing..." : "Pickup Completed"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  pageTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1a365d",
  },
  pageSubTitle: {
    fontSize: 13,
    color: "#4a5568",
    marginTop: 4,
    marginBottom: 16,
    fontWeight: "500",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1a365d",
    marginBottom: 10,
  },
  mainText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#2d3748",
    marginBottom: 5,
  },
  subText: {
    fontSize: 13,
    color: "#4a5568",
    marginBottom: 4,
  },
  map: {
    width: "100%",
    height: 220,
    borderRadius: 14,
    marginTop: 12,
  },
  itemCard: {
    backgroundColor: "#f8fbf9",
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1a365d",
    marginBottom: 6,
  },
  itemInfo: {
    fontSize: 13,
    color: "#4a5568",
    marginBottom: 5,
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#d9e2ec",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 8,
    fontSize: 14,
  },
  completeBtn: {
    backgroundColor: "#2f855a",
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 6,
  },
  completeBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
  },
});

export default CollectorPickupDetailsScreen;