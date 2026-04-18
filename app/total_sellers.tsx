import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
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
import { getRequest } from "../Services/axiosServices";

interface SellerPost {
  post_id?: string;
  seller_id?: string;
  name?: string;
  seller_name?: string;
  address?: string;
  latitude?: number | string;
  longitude?: number | string;
  distance?: string;
  pickup_date?: string;
  pickup_time?: string;
  total_amount?: number | string;
  item_count?: number | string;
  status?: string;
}

type LocationType = {
  latitude: number;
  longitude: number;
};

const SellersScreen = () => {
  const router = useRouter();

  const params = useLocalSearchParams<{
    collector_id?: string;
    collectorLat?: string;
    collectorLng?: string;
  }>();

  const [sellers, setSellers] = useState<SellerPost[]>([]);
  const [search, setSearch] = useState("");
  const [collectorLocation, setCollectorLocation] =
    useState<LocationType | null>(null);
  const [loading, setLoading] = useState(true);

  const getLocation = async () => {
    try {
      if (params.collectorLat && params.collectorLng) {
        setCollectorLocation({
          latitude: parseFloat(params.collectorLat),
          longitude: parseFloat(params.collectorLng),
        });
        return;
      }

      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        Alert.alert("Permission denied");
        return;
      }

      const location = await Location.getCurrentPositionAsync({});

      setCollectorLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    } catch (err) {
      console.log("Location error:", err);
    }
  };

  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ) => {
    const toRad = (v: number) => (v * Math.PI) / 180;
    const R = 6371;

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) ** 2;

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c).toFixed(2);
  };

  const fetchSellers = async () => {
    try {
      setLoading(true);

      const res = await getRequest("/seller-public/posts", false);

      if (res?.Status === "OK") {
        let data = (res.Result || res.Data || []).filter(
          (item: any) => String(item.status || "").toLowerCase() === "posted"
        );

        if (collectorLocation) {
          data = data.map((seller: any) => {
            const lat = parseFloat(String(seller.latitude));
            const lon = parseFloat(String(seller.longitude));

            if (!isNaN(lat) && !isNaN(lon)) {
              const distance = calculateDistance(
                collectorLocation.latitude,
                collectorLocation.longitude,
                lat,
                lon
              );
              return { ...seller, distance };
            }

            return { ...seller, distance: "--" };
          });

          data.sort((a: any, b: any) => {
            const da =
              a.distance && a.distance !== "--"
                ? parseFloat(a.distance)
                : 99999;
            const db =
              b.distance && b.distance !== "--"
                ? parseFloat(b.distance)
                : 99999;
            return da - db;
          });
        }

        setSellers(data);
      } else {
        setSellers([]);
        Alert.alert("Error", res?.Result || "Failed to load posts");
      }
    } catch (err) {
      console.log("Fetch error:", err);
      Alert.alert("Error", "Network error");
      setSellers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getLocation();
  }, []);

  useEffect(() => {
    if (collectorLocation) {
      fetchSellers();
    }
  }, [collectorLocation]);

  const filtered = sellers.filter((s) => {
    const sellerName = s.name || s.seller_name || "";
    const sellerAddress = s.address || "";
    return (
      sellerName.toLowerCase().includes(search.toLowerCase()) ||
      sellerAddress.toLowerCase().includes(search.toLowerCase())
    );
  });

  const renderItem = ({ item }: { item: SellerPost }) => {
    const name = item.name || item.seller_name || "Seller";
    const address = item.address || "No address";

    return (
      <View style={styles.card}>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.address}>
            {address} • {item.distance ? `${item.distance} km` : "--"}
          </Text>

          <Text style={styles.metaText}>
            Items: {item.item_count ?? 0} | Total: ₹
            {Number(item.total_amount || 0).toFixed(2)}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() =>
            router.push({
              pathname: "/seller_details",
              params: {
                post_id: item.post_id || "",
                seller_id: item.seller_id || "",
                collector_id:
                  typeof params.collector_id === "string"
                    ? params.collector_id
                    : "",
                name,
                address,
                sellerLat: String(item.latitude ?? ""),
                sellerLng: String(item.longitude ?? ""),
                collectorLat: String(collectorLocation?.latitude ?? ""),
                collectorLng: String(collectorLocation?.longitude ?? ""),
                pickup_date: item.pickup_date ? String(item.pickup_date) : "",
                pickup_time: item.pickup_time ? String(item.pickup_time) : "",
                total_amount: String(item.total_amount ?? 0),
                item_count: String(item.item_count ?? 0),
                post_status: item.status || "posted",
              },
            })
          }
          style={styles.button}
        >
          <Text style={styles.buttonText}>View Details</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f2f4f7" }}>
      <LinearGradient
        colors={["#2f855a", "#38a169"]}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>

        <Text style={styles.headerText}>Public Scrap Posts</Text>
      </LinearGradient>

      <View style={styles.searchBox}>
        <TextInput
          placeholder="Search seller or address..."
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {loading ? (
        <ActivityIndicator size="large" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item, index) =>
            `${item.post_id || item.seller_id || item.seller_name}-${index}`
          }
          renderItem={renderItem}
          contentContainerStyle={{ padding: 15 }}
          ListEmptyComponent={
            <Text style={{ textAlign: "center", color: "#666", marginTop: 20 }}>
              No public scrap posts available
            </Text>
          }
        />
      )}
    </SafeAreaView>
  );
};

export default SellersScreen;

const styles = StyleSheet.create({
  header: {
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
  },

  headerText: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
  },

  back: {
    position: "absolute",
    left: 15,
  },

  searchBox: {
    margin: 15,
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 10,
  },

  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 15,
    marginBottom: 12,
    alignItems: "center",
    elevation: 2,
  },

  name: {
    fontSize: 16,
    fontWeight: "bold",
  },

  address: {
    fontSize: 13,
    color: "#555",
    marginVertical: 4,
  },

  metaText: {
    fontSize: 12,
    color: "#2f855a",
    fontWeight: "600",
  },

  button: {
    backgroundColor: "#2f855a",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },

  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 12,
  },
});