import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { BASE_URL } from "../Services/axiosServices";

export default function SetupPricesScreen() {
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

  const [scrapPrices, setScrapPrices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  const collectorId =
    typeof params.collector_id === "string" ? params.collector_id : null;

  useEffect(() => {
    loadInitialData();
  }, []);

  const getCleanUrl = (path: string | null) => {
    if (!path) return null;
    const base = BASE_URL.endsWith("/") ? BASE_URL.slice(0, -1) : BASE_URL;
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    return `${base}${cleanPath}`;
  };

  const loadInitialData = async () => {
    try {
      setPageLoading(true);

      const res = await fetch(getCleanUrl("ScrapPrice")!);
      const data = await res.json();

      if (data.Status === "OK") {
        const initializedPrices = (data.Result || []).map((item: any) => ({
          ...item,
          myPrice: String(item.price_per_kg),
        }));
        setScrapPrices(initializedPrices);
      }
    } catch (error) {
      Alert.alert("Error", "Could not load master prices");
    } finally {
      setPageLoading(false);
    }
  };

  const handlePriceChange = (text: string, index: number) => {
    const updatedPrices = [...scrapPrices];
    updatedPrices[index].myPrice = text;
    setScrapPrices(updatedPrices);
  };

  const savePrices = async () => {
    if (!collectorId) {
      Alert.alert("Error", "Collector ID not found");
      return;
    }

    const isInvalid = scrapPrices.some(
      (p) => parseFloat(p.myPrice) < parseFloat(p.price_per_kg)
    );

    if (isInvalid) {
      Alert.alert(
        "Validation Error",
        "Your price cannot be lower than the base price set by Admin."
      );
      return;
    }

    try {
      setLoading(true);

      const payload = {
        collector_id: collectorId,
        prices: scrapPrices.map((p) => ({
          price_id: p.price_id,
          price_per_kg: p.myPrice,
        })),
      };

      const res = await fetch(getCleanUrl("Collector/setup-prices")!, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.Status === "OK") {
        Alert.alert("Success", "Your profile is ready!");
        router.replace({
          pathname: "/collector",
          params: {
            collector_id: params.collector_id || "",
            name: params.name || "",
            email: params.email || "",
            phone: params.phone || "",
            address: params.address || "",
            area: params.area || "",
            city: params.city || "",
            latitude: params.latitude || "",
            longitude: params.longitude || "",
          },
        });
      } else {
        Alert.alert("Error", data.Result || "Failed to save prices");
      }
    } catch (error) {
      Alert.alert("Error", "Server connection failed");
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item, index }: { item: any; index: number }) => {
    const subImg = getCleanUrl(item.sub_category_image);

    return (
      <View style={styles.priceCard}>
        <View style={styles.priceTopRow}>
          {subImg ? (
            <Image source={{ uri: subImg }} style={styles.subImage} />
          ) : (
            <View style={styles.subNoImage}>
              <Ionicons name="image-outline" size={22} color="#888" />
            </View>
          )}

          <View style={{ flex: 1 }}>
            <Text style={styles.priceCategoryName}>{item.category_name}</Text>
            <Text style={styles.subCategoryName}>{item.sub_category_name}</Text>
            <Text style={styles.adminPriceLabel}>
              Admin Price: ₹ {item.price_per_kg}/kg
            </Text>
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Set Your Price (₹):</Text>
          <TextInput
            style={styles.myPriceInput}
            keyboardType="numeric"
            value={item.myPrice}
            onChangeText={(text) => handlePriceChange(text, index)}
          />
        </View>
      </View>
    );
  };

  if (pageLoading) {
    return (
      <View style={styles.centerWrap}>
        <ActivityIndicator size="large" color="#2e7d32" />
      </View>
    );
  }

  return (
    <LinearGradient colors={["#dff5e4", "#a8e0b2", "#8bd39c"]} style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.headerCard}>
          <Text style={styles.title}>Welcome!</Text>
          <Text style={styles.subtitle}>
            Please set your buying prices. You can increase them to attract more sellers, but they cannot be lower than the Admin's base price.
          </Text>
        </View>

        <FlatList
          data={scrapPrices}
          renderItem={renderItem}
          keyExtractor={(item) => item.price_id.toString()}
          contentContainerStyle={styles.listContent}
        />

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={savePrices}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Confirm & Start Working</Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#dff5e4",
  },
  headerCard: {
    backgroundColor: "rgba(255,255,255,0.5)",
    margin: 16,
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#fff",
  },
  title: { fontSize: 24, fontWeight: "800", color: "#173321" },
  subtitle: { fontSize: 13, color: "#42634d", marginTop: 5, lineHeight: 18 },
  listContent: { paddingHorizontal: 16, paddingBottom: 100 },
  priceCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 15,
    marginBottom: 15,
    elevation: 3,
  },
  priceTopRow: { flexDirection: "row", alignItems: "center" },
  subImage: { width: 60, height: 60, borderRadius: 12, marginRight: 15 },
  subNoImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
    marginRight: 15,
    backgroundColor: "#eee",
    justifyContent: "center",
    alignItems: "center",
  },
  priceCategoryName: {
    fontSize: 11,
    color: "#2f6db2",
    fontWeight: "700",
    textTransform: "uppercase",
  },
  subCategoryName: { fontSize: 18, fontWeight: "800", color: "#222" },
  adminPriceLabel: { fontSize: 12, color: "#666", marginTop: 2 },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  inputLabel: { flex: 1, fontWeight: "700", color: "#444" },
  myPriceInput: {
    width: 100,
    height: 40,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "bold",
    color: "#2e7d32",
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: "#fff",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
  },
  saveButton: {
    backgroundColor: "#2e7d32",
    height: 55,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  saveButtonText: { color: "#fff", fontSize: 16, fontWeight: "800" },
});