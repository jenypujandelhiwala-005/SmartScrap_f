import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronRight, FileText, Home, User, Users } from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { getRequest } from "../Services/axiosServices";

type LocationType = {
  latitude: number;
  longitude: number;
};

const CollectorPickupsScreen = () => {
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

  const [loading, setLoading] = useState(false);
  const [pickups, setPickups] = useState<any[]>([]);
  const [collectorLocation, setCollectorLocation] = useState<LocationType | null>(null);

  const paramsLatitude =
    typeof params.latitude === "string" && params.latitude.trim() !== ""
      ? parseFloat(params.latitude)
      : NaN;

  const paramsLongitude =
    typeof params.longitude === "string" && params.longitude.trim() !== ""
      ? parseFloat(params.longitude)
      : NaN;

  const getLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        if (!isNaN(paramsLatitude) && !isNaN(paramsLongitude)) {
          setCollectorLocation({
            latitude: paramsLatitude,
            longitude: paramsLongitude,
          });
        }
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setCollectorLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    } catch (error) {
      console.log("Location error:", error);

      if (!isNaN(paramsLatitude) && !isNaN(paramsLongitude)) {
        setCollectorLocation({
          latitude: paramsLatitude,
          longitude: paramsLongitude,
        });
      }
    }
  };

  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ) => {
    const toRad = (value: number) => (value * Math.PI) / 180;
    const R = 6371;

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c).toFixed(2);
  };

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

  const fetchAcceptedPickups = async () => {
    try {
      if (!collectorId) {
        setPickups([]);
        return;
      }

      setLoading(true);

      const response = await getRequest(
        `/pickup-accepted/collector/${collectorId}`,
        false
      );

      if (response?.Status === "OK") {
        let pickupData = response.Result || [];

        const currentLocation = collectorLocation
          ? collectorLocation
          : !isNaN(paramsLatitude) && !isNaN(paramsLongitude)
          ? { latitude: paramsLatitude, longitude: paramsLongitude }
          : null;

        if (currentLocation) {
          pickupData = pickupData.map((item: any) => {
            const sellerLat = parseFloat(String(item.seller_latitude ?? ""));
            const sellerLng = parseFloat(String(item.seller_longitude ?? ""));

            if (!isNaN(sellerLat) && !isNaN(sellerLng)) {
              return {
                ...item,
                distance: calculateDistance(
                  currentLocation.latitude,
                  currentLocation.longitude,
                  sellerLat,
                  sellerLng
                ),
              };
            }

            return {
              ...item,
              distance: "--",
            };
          });

          pickupData.sort((a: any, b: any) => {
            const aDistance =
              a.distance && a.distance !== "--" ? parseFloat(a.distance) : 99999;
            const bDistance =
              b.distance && b.distance !== "--" ? parseFloat(b.distance) : 99999;
            return aDistance - bDistance;
          });
        }

        setPickups(pickupData);
      } else {
        setPickups([]);
      }
    } catch (error) {
      console.log("Error fetching accepted pickups:", error);
      setPickups([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getLocation();
  }, []);

  useEffect(() => {
    fetchAcceptedPickups();
  }, [collectorLocation, collectorId]);

  useFocusEffect(
    useCallback(() => {
      fetchAcceptedPickups();
    }, [collectorLocation, collectorId])
  );

  const handleViewDetails = (pickup: any) => {
    router.push({
      pathname: "/collector_pickup_details",
      params: {
        pickup: JSON.stringify(pickup),
        collector_id: collectorId,
        name: typeof params.name === "string" ? params.name : "",
        email: typeof params.email === "string" ? params.email : "",
        phone: typeof params.phone === "string" ? params.phone : "",
        address: typeof params.address === "string" ? params.address : "",
        area: typeof params.area === "string" ? params.area : "",
        city: typeof params.city === "string" ? params.city : "",
        latitude: collectorLocation
          ? String(collectorLocation.latitude)
          : typeof params.latitude === "string"
          ? params.latitude
          : "",
        longitude: collectorLocation
          ? String(collectorLocation.longitude)
          : typeof params.longitude === "string"
          ? params.longitude
          : "",
      },
    });
  };

  const activePickups = useMemo(() => {
    return pickups.filter((item: any) =>
      ["accepted", "scheduled"].includes(String(item.status || "").toLowerCase())
    );
  }, [pickups]);

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={["#dff5e4", "#bde8c4", "#a9ddb3"]}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Accepted Pickups</Text>
          <Text style={styles.headerSubTitle}>
            All pickups accepted for collection
          </Text>
        </View>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          {loading ? (
            <ActivityIndicator size="large" color="#1e6fd9" style={{ marginTop: 40 }} />
          ) : activePickups.length === 0 ? (
            <Text style={styles.emptyText}>No accepted pickups found</Text>
          ) : (
            activePickups.map((item: any, index: number) => (
              <View key={item.pickup_id || index} style={styles.card}>
                <View style={styles.topRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.nameText}>
                      {item.seller_name || "Seller"}
                    </Text>
                    <Text style={styles.infoText}>
                      {item.seller_email || "No email"}
                    </Text>
                    <Text style={styles.infoText}>
                      {item.seller_phone || "No phone"}
                    </Text>
                  </View>

                  <View style={styles.statusBadge}>
                    <Text style={styles.statusBadgeText}>
                      {String(item.status || "").toLowerCase() === "scheduled"
                        ? "Scheduled"
                        : "Accepted"}
                    </Text>
                  </View>
                </View>

                <View style={styles.metaRow}>
                  <View style={styles.metaBox}>
                    <Text style={styles.metaLabel}>Distance</Text>
                    <Text style={styles.metaValue}>
                      {item.distance && item.distance !== "--"
                        ? `${item.distance} km`
                        : "-- km"}
                    </Text>
                  </View>

                  <View style={styles.metaBox}>
                    <Text style={styles.metaLabel}>Pickup Slot</Text>
                    <Text style={styles.metaValue}>
                      {formatDate(item.pickupdate)}
                    </Text>
                    <Text style={styles.metaSmall}>{item.pickup_time || "Not set"}</Text>
                  </View>
                </View>

                <Text style={styles.addressText}>
                  {item.seller_address || item.address || "No address"}
                </Text>

                <TouchableOpacity
                  style={styles.viewBtn}
                  onPress={() => handleViewDetails(item)}
                >
                  <Text style={styles.viewBtnText}>View Details</Text>
                  <ChevronRight size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            ))
          )}
        </ScrollView>

        <View style={styles.bottomNav}>
          <NavItem
            icon={<Home color="#718096" size={24} />}
            label="Home"
            onPress={() =>
              router.push({
                pathname: "/collector",
                params: { ...params },
              })
            }
          />
          <NavItem
            icon={<FileText color="#718096" size={24} />}
            label="Requests"
            onPress={() =>
              router.push({
                pathname: "/collector_requests",
                params: { ...params },
              })
            }
          />
          <NavItem
            icon={<Users color="#1a365d" size={24} />}
            label="Pickups"
            active
          />
          <NavItem
            icon={<User color="#718096" size={24} />}
            label="Account"
            onPress={() =>
              router.push({
                pathname: "/collector_profile",
                params: { ...params },
              })
            }
          />
        </View>
      </SafeAreaView>
    </View>
  );
};

const NavItem = ({
  icon,
  label,
  active = false,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onPress?: () => void;
}) => (
  <TouchableOpacity style={styles.navItem} onPress={onPress}>
    {icon}
    <Text
      style={[
        styles.navLabel,
        active && { color: "#1a365d", fontWeight: "bold" },
      ]}
    >
      {label}
    </Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 26,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1a365d",
  },
  headerSubTitle: {
    marginTop: 4,
    fontSize: 13,
    color: "#4a5568",
    fontWeight: "500",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    elevation: 3,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  nameText: {
    fontSize: 17,
    fontWeight: "800",
    color: "#1a365d",
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: "#4a5568",
    marginBottom: 2,
  },
  statusBadge: {
    backgroundColor: "#e6f7ec",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  statusBadgeText: {
    color: "#2f855a",
    fontSize: 12,
    fontWeight: "800",
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  metaBox: {
    width: "48%",
    backgroundColor: "#f8fbf9",
    borderRadius: 14,
    padding: 12,
  },
  metaLabel: {
    fontSize: 12,
    color: "#718096",
    fontWeight: "700",
    marginBottom: 5,
  },
  metaValue: {
    fontSize: 14,
    color: "#1a365d",
    fontWeight: "800",
  },
  metaSmall: {
    fontSize: 12,
    color: "#4a5568",
    marginTop: 2,
  },
  addressText: {
    fontSize: 13,
    color: "#4a5568",
    marginBottom: 14,
  },
  viewBtn: {
    backgroundColor: "#1e6fd9",
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  viewBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
    marginRight: 5,
  },
  emptyText: {
    textAlign: "center",
    color: "#4a5568",
    fontSize: 15,
    marginTop: 60,
    fontWeight: "600",
  },
  bottomNav: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    height: 70,
    backgroundColor: "white",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    elevation: 20,
  },
  navItem: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: -6,
  },
  navLabel: {
    fontSize: 10,
    marginTop: 4,
    color: "#718096",
  },
});

export default CollectorPickupsScreen;