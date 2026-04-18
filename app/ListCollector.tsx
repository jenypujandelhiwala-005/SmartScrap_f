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
import { getRequest, putRequest } from "../Services/axiosServices";

type CollectorStatus = "active" | "pending" | "block";

interface Collector {
  collector_id: string;
  name: string;
  email: string;
  phone: string;
  status: CollectorStatus;
}

export default function CollectorList() {
  const router = useRouter();

  const [collectors, setCollectors] = useState<Collector[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  useEffect(() => {
    fetchCollectors();
  }, []);

  const fetchCollectors = async (): Promise<void> => {
    try {
      setLoading(true);

      const response = await getRequest("/Admin/Collectors", false);
      console.log("Collectors response:", response);

      if (response?.Status === "OK") {
        setCollectors((response.Result || []) as Collector[]);
      } else {
        Alert.alert("Error", response?.Result || "Failed to load collectors");
      }
    } catch (error) {
      console.log("fetchCollectors error:", error);
      Alert.alert("Error", "Something went wrong while fetching collectors");
    } finally {
      setLoading(false);
    }
  };

  const updateCollectorStatus = async (
    collectorId: string,
    newStatus: "active" | "block"
  ): Promise<void> => {
    try {
      setActionLoadingId(collectorId);

      const payload = {
        collector_id: collectorId,
        status: newStatus,
      };

      const response = await putRequest(
        "/Admin/Collector/Status",
        payload,
        false
      );

      console.log("Update status response:", response);

      if (response?.Status === "OK") {
        Alert.alert(
          "Success",
          response.Result ||
            `Collector ${newStatus === "block" ? "blocked" : "activated"} successfully`
        );

        setCollectors((prev) =>
          prev.map((item) =>
            item.collector_id === collectorId
              ? { ...item, status: newStatus }
              : item
          )
        );
      } else {
        Alert.alert(
          "Error",
          response?.Result || "Failed to update collector status"
        );
      }
    } catch (error) {
      console.log("updateCollectorStatus error:", error);
      Alert.alert("Error", "Something went wrong while updating collector status");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleBlock = (collectorId: string): void => {
    Alert.alert(
      "Block Collector",
      "Are you sure you want to block this collector?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Block",
          style: "destructive",
          onPress: () => updateCollectorStatus(collectorId, "block"),
        },
      ]
    );
  };

  const handleActivate = (collectorId: string): void => {
    Alert.alert(
      "Activate Collector",
      "Do you want to activate this collector again?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Activate",
          onPress: () => updateCollectorStatus(collectorId, "active"),
        },
      ]
    );
  };

  const getStatusStyle = (status: CollectorStatus) => {
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

  const renderCollectorCard: ListRenderItem<Collector> = ({ item }) => {
    const statusObj = getStatusStyle(item.status);
    const isActionLoading = actionLoadingId === item.collector_id;

    return (
      <View style={styles.card}>
        <View style={styles.cardTopRow}>
          <View style={styles.profileIconWrap}>
            <MaterialCommunityIcons
              name="account-outline"
              size={26}
              color="#2e7d32"
            />
          </View>

          <View style={styles.nameWrap}>
            <Text style={styles.collectorName}>{item.name || "No Name"}</Text>
            <Text style={styles.collectorId}>
              ID: {item.collector_id || "N/A"}
            </Text>
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
              onPress={() => handleBlock(item.collector_id)}
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
              onPress={() => handleActivate(item.collector_id)}
              disabled={isActionLoading}
              activeOpacity={0.85}
            >
              {isActionLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
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
            <Text style={styles.headerTitle}>Collector List</Text>
            <Text style={styles.headerSubtitle}>
              View, block and activate collectors
            </Text>
          </View>

          <TouchableOpacity
            style={styles.refreshButton}
            onPress={fetchCollectors}
            activeOpacity={0.85}
          >
            <Ionicons name="refresh" size={20} color="#2e7d32" />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loaderWrap}>
            <ActivityIndicator size="large" color="#2e7d32" />
            <Text style={styles.loaderText}>Loading collectors...</Text>
          </View>
        ) : (
          <FlatList
            data={collectors}
            renderItem={renderCollectorCard}
            keyExtractor={(item, index) =>
              item.collector_id?.toString() || index.toString()
            }
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyWrap}>
                <MaterialCommunityIcons
                  name="account-group-outline"
                  size={64}
                  color="#5f8f6a"
                />
                <Text style={styles.emptyTitle}>No Collectors Found</Text>
                <Text style={styles.emptySubtitle}>
                  Collector data will appear here
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
    backgroundColor: "#EAF8ED",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  nameWrap: {
    flex: 1,
  },
  collectorName: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1f1f1f",
  },
  collectorId: {
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