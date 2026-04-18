import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    ListRenderItem,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { getRequest, postRequest } from "../Services/axiosServices";

type SellerStatus = "active" | "pending" | "block";

interface Seller {
  seller_id: string;
  name: string;
  email: string;
  phone: string;
  status: SellerStatus;
}

export default function SellerList() {
  const router = useRouter();

  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  useEffect(() => {
    fetchSellers();
  }, []);

  const fetchSellers = async (): Promise<void> => {
  try {
    setLoading(true);

    const response = await getRequest("/seller/list", false);
    console.log("Seller list response:", response);

    if (response?.Status === "OK") {
      setSellers((response.Data || []) as Seller[]);
    } else {
      Alert.alert("Error", response?.Result || "Failed to load sellers");
    }
  } catch (error) {
    console.log("fetchSellers error:", error);
    Alert.alert("Error", "Something went wrong while fetching sellers");
  } finally {
    setLoading(false);
  }
};
  const blockSeller = async (sellerId: string): Promise<void> => {
    try {
      setActionLoadingId(sellerId);

      const payload = {
        seller_id: sellerId,
      };

      const response = await postRequest("/admin/block-seller", payload, false);
      console.log("Block seller response:", response);

      if (response?.Status === "OK" || response?.success === true) {
        Alert.alert("Success", response?.Result || response?.message || "Seller blocked successfully");

        setSellers((prev) =>
          prev.map((item) =>
            item.seller_id === sellerId ? { ...item, status: "block" } : item
          )
        );
      } else {
        Alert.alert("Error", response?.Result || response?.message || "Failed to block seller");
      }
    } catch (error) {
      console.log("blockSeller error:", error);
      Alert.alert("Error", "Something went wrong while blocking seller");
    } finally {
      setActionLoadingId(null);
    }
  };

  const activateSeller = async (sellerId: string): Promise<void> => {
    try {
      setActionLoadingId(sellerId);

      const payload = {
        seller_id: sellerId,
      };

      const response = await postRequest("/admin/activate-seller", payload, false);
      console.log("Activate seller response:", response);

      if (response?.Status === "OK" || response?.success === true) {
        Alert.alert("Success", response?.Result || response?.message || "Seller activated successfully");

        setSellers((prev) =>
          prev.map((item) =>
            item.seller_id === sellerId ? { ...item, status: "active" } : item
          )
        );
      } else {
        Alert.alert("Error", response?.Result || response?.message || "Failed to activate seller");
      }
    } catch (error) {
      console.log("activateSeller error:", error);
      Alert.alert("Error", "Something went wrong while activating seller");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleBlock = (sellerId: string): void => {
    Alert.alert(
      "Block Seller",
      "Are you sure you want to block this seller?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Block",
          style: "destructive",
          onPress: () => blockSeller(sellerId),
        },
      ]
    );
  };

  const handleActivate = (sellerId: string): void => {
    Alert.alert(
      "Activate Seller",
      "Do you want to activate this seller again?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Activate",
          onPress: () => activateSeller(sellerId),
        },
      ]
    );
  };

  const getStatusStyle = (status: SellerStatus) => {
    switch (status) {
      case "active":
        return {
          bg: "#E8F7EE",
          text: "#2e7d32",
          label: "Active",
        };
      case "pending":
        return {
          bg: "#FFF4D6",
          text: "#c98900",
          label: "Pending",
        };
      case "block":
        return {
          bg: "#FDECEA",
          text: "#c62828",
          label: "Blocked",
        };
      default:
        return {
          bg: "#ECEFF1",
          text: "#607d8b",
          label: "Unknown",
        };
    }
  };

  const renderSellerCard: ListRenderItem<Seller> = ({ item }) => {
    const statusObj = getStatusStyle(item.status);
    const isActionLoading = actionLoadingId === item.seller_id;

    return (
      <View style={styles.card}>
        <View style={styles.cardTopRow}>
          <View style={styles.profileIconWrap}>
            <MaterialCommunityIcons
              name="account-outline"
              size={26}
              color="#1565c0"
            />
          </View>

          <View style={styles.nameWrap}>
            <Text style={styles.sellerName}>{item.name || "No Name"}</Text>
            <Text style={styles.sellerId}>ID: {item.seller_id || "N/A"}</Text>
          </View>

          <View style={[styles.statusBadge, { backgroundColor: statusObj.bg }]}>
            <Text style={[styles.statusText, { color: statusObj.text }]}>
              {statusObj.label}
            </Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="mail-outline" size={16} color="#666" />
          <Text style={styles.infoText}>{item.email || "No Email"}</Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="call-outline" size={16} color="#666" />
          <Text style={styles.infoText}>{item.phone || "No Phone"}</Text>
        </View>

        <View style={styles.actionRow}>
          {item.status === "active" && (
            <TouchableOpacity
              style={styles.blockButton}
              onPress={() => handleBlock(item.seller_id)}
              disabled={isActionLoading}
              activeOpacity={0.85}
            >
              {isActionLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <MaterialCommunityIcons
                    name="block-helper"
                    size={18}
                    color="#fff"
                  />
                  <Text style={styles.buttonText}>Block</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {item.status === "block" && (
            <TouchableOpacity
              style={styles.activateButton}
              onPress={() => handleActivate(item.seller_id)}
              disabled={isActionLoading}
              activeOpacity={0.85}
            >
              {isActionLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={18}
                    color="#fff"
                  />
                  <Text style={styles.buttonText}>Activate</Text>
                </>
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
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.85}
          >
            <Ionicons name="chevron-back" size={22} color="#163020" />
          </TouchableOpacity>

          <View style={styles.headerTextWrap}>
            <Text style={styles.headerTitle}>Seller List</Text>
            <Text style={styles.headerSubtitle}>
              View, block and activate sellers
            </Text>
          </View>

          <TouchableOpacity
            style={styles.refreshButton}
            onPress={fetchSellers}
            activeOpacity={0.85}
          >
            <Ionicons name="refresh" size={20} color="#2e7d32" />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loaderWrap}>
            <ActivityIndicator size="large" color="#2e7d32" />
            <Text style={styles.loaderText}>Loading sellers...</Text>
          </View>
        ) : (
          <FlatList
            data={sellers}
            renderItem={renderSellerCard}
            keyExtractor={(item, index) =>
              item.seller_id?.toString() || index.toString()
            }
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyWrap}>
                <MaterialCommunityIcons
                  name="account-multiple-outline"
                  size={64}
                  color="#5f8f6a"
                />
                <Text style={styles.emptyTitle}>No Sellers Found</Text>
                <Text style={styles.emptySubtitle}>
                  Seller data will appear here
                </Text>
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
    paddingHorizontal: 16,
    paddingTop: 10,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  headerTextWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#163020",
  },
  headerSubtitle: {
    marginTop: 3,
    fontSize: 13,
    color: "#446152",
  },
  refreshButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 12,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },

  listContent: {
    paddingBottom: 24,
  },

  card: {
    backgroundColor: "#ffffff",
    borderRadius: 22,
    padding: 16,
    marginBottom: 14,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  profileIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "#EEF4FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  nameWrap: {
    flex: 1,
  },
  sellerName: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1f1f1f",
  },
  sellerId: {
    fontSize: 12,
    color: "#777",
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  infoText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#555",
    flex: 1,
  },

  actionRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 8,
  },
  blockButton: {
    minWidth: 112,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#c62828",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 14,
  },
  activateButton: {
    minWidth: 112,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#2e7d32",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 14,
  },
  buttonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
    marginLeft: 8,
  },

  loaderWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loaderText: {
    marginTop: 10,
    fontSize: 15,
    color: "#2f4f3a",
  },

  emptyWrap: {
    marginTop: 90,
    alignItems: "center",
  },
  emptyTitle: {
    marginTop: 14,
    fontSize: 18,
    fontWeight: "700",
    color: "#1f3527",
  },
  emptySubtitle: {
    marginTop: 6,
    fontSize: 14,
    color: "#5f7a66",
  },
});