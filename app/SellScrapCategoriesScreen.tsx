import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { BASE_URL } from "../Services/axiosServices";

const { width } = Dimensions.get("window");

export default function SellScrapCategoriesScreen() {
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

  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);

      const response = await fetch(`${BASE_URL}/Category`);
      const data = await response.json();

      if (data.Status === "OK") {
        const activeCategories = (data.Result || []).filter(
          (item: any) => item.is_active
        );
        setCategories(activeCategories);
      } else {
        setCategories([]);
      }
    } catch (error) {
      console.log("fetchCategories error:", error);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCategory = (item: any) => {
    if (!item?.categoryid) {
      Alert.alert("Error", "Category ID not found");
      return;
    }

    if (!sellerId) {
      Alert.alert("Error", "Seller ID not found. Please login again.");
      return;
    }

    setSelectedCategoryId(item.categoryid);

    router.push({
      pathname: "/SellScrapSubCategoryScreen",
      params: {
        category_id: String(item.categoryid),
        category_name: String(item.category_name || ""),
        seller_id: String(sellerId),
        name: typeof params.name === "string" ? params.name : "",
        email: typeof params.email === "string" ? params.email : "",
        phone: typeof params.phone === "string" ? params.phone : "",
        address: typeof params.address === "string" ? params.address : "",
        latitude: typeof params.latitude === "string" ? params.latitude : "",
        longitude: typeof params.longitude === "string" ? params.longitude : "",
      },
    });
  };

  const renderItem = ({ item }: { item: any }) => {
    const isSelected = selectedCategoryId === item.categoryid;
    const imageUrl = item.image ? `${BASE_URL}${item.image}` : null;

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        style={styles.categoryCardWrap}
        onPress={() => handleSelectCategory(item)}
      >
        {isSelected ? (
          <LinearGradient
            colors={["#6DB18A", "#3E7E63", "#2D624C"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.categoryItemSelected}
          >
            <View style={styles.imageContainerSelected}>
              {imageUrl ? (
                <Image source={{ uri: imageUrl }} style={styles.categoryImage} />
              ) : (
                <MaterialCommunityIcons
                  name="image-outline"
                  size={38}
                  color="#fff"
                />
              )}
            </View>

            <Text style={styles.categoryLabelSelected} numberOfLines={2}>
              {item.category_name}
            </Text>

            <Text style={styles.tapTextSelected}>Tap to continue</Text>
          </LinearGradient>
        ) : (
          <View style={styles.categoryItem}>
            <View style={styles.imageContainer}>
              {imageUrl ? (
                <Image source={{ uri: imageUrl }} style={styles.categoryImage} />
              ) : (
                <MaterialCommunityIcons
                  name="image-outline"
                  size={38}
                  color="#5b6d64"
                />
              )}
            </View>

            <Text style={styles.categoryLabel} numberOfLines={2}>
              {item.category_name}
            </Text>

            <Text style={styles.tapText}>Tap to continue</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={26} color="#2D4F44" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Sell Scrap</Text>
        </View>

        <View style={styles.topCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.shopLabel}>SmartScrap Seller</Text>
            <Text style={styles.shopName}>Choose Scrap Category</Text>
            <Text style={styles.shopAddress}>
              Select the category you want to sell
            </Text>
          </View>

          <View style={styles.illustrationContainer}>
            <View style={styles.blob} />
            <MaterialCommunityIcons
              name="recycle-variant"
              size={56}
              color="#7BA994"
              style={styles.iconOverlay}
            />
          </View>
        </View>

        <Text style={styles.instructionText}>
          Categories shown here are added by admin. Tap one category to continue.
        </Text>

        {loading ? (
          <ActivityIndicator
            size="large"
            color="#2D624C"
            style={{ marginTop: 40 }}
          />
        ) : (
          <FlatList
            data={categories}
            keyExtractor={(item) => String(item.categoryid)}
            renderItem={renderItem}
            numColumns={2}
            contentContainerStyle={styles.listContent}
            columnWrapperStyle={styles.row}
            showsVerticalScrollIndicator={false}
          />
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F2F7F4" },
  safeArea: { flex: 1 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    position: "relative",
    height: 60,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#2D4F44",
    position: "absolute",
    left: 0,
    right: 0,
    textAlign: "center",
    zIndex: 1,
  },

  topCard: {
    backgroundColor: "#E4EDE8",
    marginHorizontal: 15,
    borderRadius: 25,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    overflow: "hidden",
  },
  shopLabel: {
    fontSize: 13,
    color: "#7A8C85",
    marginBottom: 4,
  },
  shopName: {
    fontSize: 20,
    fontWeight: "800",
    color: "#2D4F44",
  },
  shopAddress: {
    fontSize: 14,
    color: "#7A8C85",
    marginTop: 4,
  },

  illustrationContainer: {
    width: 100,
    height: 80,
    justifyContent: "center",
    alignItems: "center",
  },
  blob: {
    position: "absolute",
    width: 80,
    height: 80,
    backgroundColor: "#D5E2DB",
    borderRadius: 40,
  },
  iconOverlay: { opacity: 0.9 },

  instructionText: {
    paddingHorizontal: 25,
    marginVertical: 20,
    color: "#5C6E67",
    lineHeight: 22,
    fontSize: 16,
  },

  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 30,
  },
  row: {
    justifyContent: "space-between",
    marginBottom: 16,
  },

  categoryCardWrap: {
    width: (width - 48) / 2,
  },

  categoryItem: {
    minHeight: 185,
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#D9E6DD",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    paddingHorizontal: 14,
    paddingVertical: 18,
  },

  categoryItemSelected: {
    minHeight: 185,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#9ED5B4",
    overflow: "hidden",
    shadowColor: "#5F9F7A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 6,
    paddingHorizontal: 14,
    paddingVertical: 18,
  },

  imageContainer: {
    width: 84,
    height: 84,
    borderRadius: 22,
    backgroundColor: "#F2F6F3",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },

  imageContainerSelected: {
    width: 84,
    height: 84,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.16)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },

  categoryImage: {
    width: 52,
    height: 52,
    borderRadius: 12,
    resizeMode: "contain",
  },

  categoryLabel: {
    fontSize: 16,
    color: "#2E3E36",
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
  },

  categoryLabelSelected: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
  },

  tapText: {
    fontSize: 12,
    color: "#7A8C85",
    fontWeight: "500",
  },

  tapTextSelected: {
    fontSize: 12,
    color: "rgba(255,255,255,0.92)",
    fontWeight: "500",
  },
});