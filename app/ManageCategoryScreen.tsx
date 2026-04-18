import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { BASE_URL } from "../Services/axiosServices";

export default function ManageCategoryScreen() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);

      const res = await fetch(`${BASE_URL}/Category`);
      const text = await res.text();
      console.log("Fetch categories raw response:", text);

      if (!res.ok) {
        Alert.alert("Error", `Server error: ${res.status}`);
        return;
      }

      if (text.startsWith("<")) {
        Alert.alert("Backend Error", "Invalid response from server");
        return;
      }

      const data = JSON.parse(text);

      if (data.Status === "OK") {
        setCategories(data.Result || []);
      } else {
        Alert.alert("Error", data.Result || "Failed to fetch categories");
      }
    } catch (error) {
      console.log("fetchCategories error:", error);
      Alert.alert("Error", "Could not fetch categories");
    } finally {
      setLoading(false);
    }
  };

  const deactivateCategory = async (categoryid: string) => {
    try {
      setActionLoadingId(categoryid);

      const res = await fetch(`${BASE_URL}/Category/${categoryid}`, {
        method: "DELETE",
      });

      const text = await res.text();
      console.log("Deactivate category raw response:", text);

      if (!res.ok) {
        Alert.alert("Error", `Server error: ${res.status}`);
        return;
      }

      if (text.startsWith("<")) {
        Alert.alert("Backend Error", "Invalid response from server");
        return;
      }

      const data = JSON.parse(text);

      if (data.Status === "OK") {
        Alert.alert("Success", data.Result || "Category deactivated");
        fetchCategories();
      } else {
        Alert.alert("Error", data.Result || "Failed to deactivate category");
      }
    } catch (error) {
      console.log("deactivateCategory error:", error);
      Alert.alert("Error", "Could not deactivate category");
    } finally {
      setActionLoadingId(null);
    }
  };

  const activateCategory = async (item: any) => {
    try {
      setActionLoadingId(item.categoryid);

      const formData = new FormData();
      formData.append("category_name", item.category_name);
      formData.append("description", item.description);

      const res = await fetch(`${BASE_URL}/Category`, {
        method: "POST",
        body: formData,
      });

      const text = await res.text();
      console.log("Activate category raw response:", text);

      if (!res.ok) {
        Alert.alert("Error", `Server error: ${res.status}`);
        return;
      }

      if (text.startsWith("<")) {
        Alert.alert("Backend Error", "Invalid response from server");
        return;
      }

      const data = JSON.parse(text);

      if (data.Status === "OK") {
        Alert.alert("Success", data.Result || "Category activated");
        fetchCategories();
      } else {
        Alert.alert("Error", data.Result || "Failed to activate category");
      }
    } catch (error) {
      console.log("activateCategory error:", error);
      Alert.alert("Error", "Could not activate category");
    } finally {
      setActionLoadingId(null);
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    const imageUrl = item.image ? `${BASE_URL}${item.image}` : null;
    const isProcessing = actionLoadingId === item.categoryid;

    return (
      <View style={styles.card}>
        <View style={styles.topRow}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.image} />
          ) : (
            <View style={styles.noImageBox}>
              <Ionicons name="image-outline" size={24} color="#888" />
            </View>
          )}

          <View style={styles.details}>
            <Text style={styles.categoryName}>{item.category_name}</Text>
            <Text style={styles.categoryId}>{item.categoryid}</Text>
            <Text style={styles.description}>{item.description}</Text>

            <View
              style={[
                styles.statusBadge,
                item.is_active ? styles.activeBadge : styles.inactiveBadge,
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  item.is_active ? styles.activeText : styles.inactiveText,
                ]}
              >
                {item.is_active ? "Active" : "Inactive"}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.buttonRow}>
          {item.is_active ? (
            <TouchableOpacity
              style={styles.deactivateButton}
              activeOpacity={0.85}
              disabled={isProcessing}
              onPress={() => deactivateCategory(item.categoryid)}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color="#c62828" />
              ) : (
                <Text style={styles.deactivateButtonText}>Deactivate</Text>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.activateButton}
              activeOpacity={0.85}
              disabled={isProcessing}
              onPress={() => activateCategory(item)}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color="#2e7d32" />
              ) : (
                <Text style={styles.activateButtonText}>Activate</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <LinearGradient
      colors={["#dff5e4", "#a8e0b2", "#8bd39c"]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.headerCard}>
          <Text style={styles.title}>Manage Categories</Text>
          <Text style={styles.subtitle}>
            View, deactivate, and reactivate scrap categories
          </Text>
        </View>

        {loading ? (
          <View style={styles.loaderWrap}>
            <ActivityIndicator size="large" color="#2f6db2" />
          </View>
        ) : (
          <FlatList
            data={categories}
            keyExtractor={(item) => item.categoryid?.toString()}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyWrap}>
                <Ionicons name="folder-open-outline" size={40} color="#6b7a70" />
                <Text style={styles.emptyText}>No categories found</Text>
              </View>
            }
          />
        )}
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
    padding: 16,
  },

  headerCard: {
    backgroundColor: "rgba(255,255,255,0.35)",
    borderRadius: 22,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.45)",
  },

  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#173321",
  },

  subtitle: {
    marginTop: 6,
    fontSize: 13,
    color: "#42634d",
    lineHeight: 19,
  },

  listContent: {
    paddingBottom: 24,
  },

  loaderWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },

  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  image: {
    width: 76,
    height: 76,
    borderRadius: 14,
    marginRight: 12,
  },

  noImageBox: {
    width: 76,
    height: 76,
    borderRadius: 14,
    marginRight: 12,
    backgroundColor: "#eef1ef",
    justifyContent: "center",
    alignItems: "center",
  },

  details: {
    flex: 1,
  },

  categoryName: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1f1f1f",
  },

  categoryId: {
    fontSize: 11,
    color: "#7a7a7a",
    marginTop: 2,
  },

  description: {
    fontSize: 13,
    color: "#666",
    marginTop: 6,
    lineHeight: 18,
  },

  statusBadge: {
    alignSelf: "flex-start",
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },

  activeBadge: {
    backgroundColor: "#e6f4ea",
  },

  inactiveBadge: {
    backgroundColor: "#fdecea",
  },

  statusText: {
    fontSize: 12,
    fontWeight: "700",
  },

  activeText: {
    color: "#2e7d32",
  },

  inactiveText: {
    color: "#c62828",
  },

  buttonRow: {
    marginTop: 14,
    alignItems: "flex-end",
  },

  deactivateButton: {
    minWidth: 110,
    backgroundColor: "#ffe5e5",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  deactivateButtonText: {
    color: "#c62828",
    fontWeight: "700",
  },

  activateButton: {
    minWidth: 110,
    backgroundColor: "#e6f4ea",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  activateButtonText: {
    color: "#2e7d32",
    fontWeight: "700",
  },

  emptyWrap: {
    marginTop: 50,
    alignItems: "center",
  },

  emptyText: {
    marginTop: 10,
    fontSize: 15,
    color: "#666",
    fontWeight: "600",
  },
});