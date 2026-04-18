import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Bell,
  ChevronRight,
  FileText,
  Home,
  MessageSquare,
  Smartphone,
  User,
  Users,
  Weight,
} from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { getRequest } from "../Services/axiosServices";

interface StatCardProps {
  label: string;
  value: string;
  color: string;
  icon: React.ReactNode;
}

interface SellerPostCardProps {
  name: string;
  address: string;
  distance: string;
  itemCount: string;
  totalAmount: string;
  pickupDate: string;
  pickupTime: string;
  status: string;
  onPress?: () => void;
}

interface PickupRequestCardProps {
  name: string;
  address: string;
  onView?: () => void;
  isLast?: boolean;
}

type LocationType = {
  latitude: number;
  longitude: number;
};

const DashboardUI = () => {
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

  const [sellerPosts, setSellerPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [collectorLocation, setCollectorLocation] = useState<LocationType | null>(
    null
  );
  const [allRequests, setAllRequests] = useState<any[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [unseenDecisionCount, setUnseenDecisionCount] = useState(0);

  const collectorId =
    typeof params.collector_id === "string" ? params.collector_id : "";

  const collectorName =
    typeof params.name === "string" && params.name.trim() !== ""
      ? params.name
      : "Collector";

  const paramsLatitude =
    typeof params.latitude === "string" && params.latitude.trim() !== ""
      ? parseFloat(params.latitude)
      : NaN;

  const paramsLongitude =
    typeof params.longitude === "string" && params.longitude.trim() !== ""
      ? parseFloat(params.longitude)
      : NaN;

  const getNormalizedStatus = (item: any) =>
    String(item.status || item.request_status || "").toLowerCase();

  const getLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        if (!isNaN(paramsLatitude) && !isNaN(paramsLongitude)) {
          setCollectorLocation({
            latitude: paramsLatitude,
            longitude: paramsLongitude,
          });
        } else {
          Alert.alert("Permission denied", "Location permission is required");
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

  const fetchSellerPosts = async () => {
    try {
      setLoading(true);

      const response = await getRequest("/seller-public/posts", false);

      if (response?.Status === "OK") {
        let postData = (response.Result || response.Data || []).filter(
          (post: any) => String(post.status || "").toLowerCase() === "posted"
        );

        const activeCollectorLocation = collectorLocation
          ? collectorLocation
          : !isNaN(paramsLatitude) && !isNaN(paramsLongitude)
          ? {
              latitude: paramsLatitude,
              longitude: paramsLongitude,
            }
          : null;

        if (activeCollectorLocation) {
          postData = postData.map((post: any) => {
            const lat = parseFloat(String(post.latitude ?? ""));
            const lon = parseFloat(String(post.longitude ?? ""));

            if (!isNaN(lat) && !isNaN(lon)) {
              const distance = calculateDistance(
                activeCollectorLocation.latitude,
                activeCollectorLocation.longitude,
                lat,
                lon
              );

              return { ...post, distance };
            }

            return { ...post, distance: "--" };
          });

          postData.sort((a: any, b: any) => {
            const aDistance =
              a.distance && a.distance !== "--" ? parseFloat(a.distance) : 99999;
            const bDistance =
              b.distance && b.distance !== "--" ? parseFloat(b.distance) : 99999;
            return aDistance - bDistance;
          });
        }

        setSellerPosts(postData);
      } else {
        setSellerPosts([]);
      }
    } catch (error) {
      console.log("Error fetching public seller posts:", error);
      setSellerPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchRequests = async () => {
    try {
      if (!collectorId) {
        setAllRequests([]);
        setUnseenDecisionCount(0);
        return;
      }

      setRequestsLoading(true);

      const requestsResponse = await getRequest(
        `/pickup-direct/collector/${collectorId}`,
        false
      );

      if (requestsResponse?.Status === "OK") {
        setAllRequests(requestsResponse.Result || []);
      } else {
        setAllRequests([]);
      }

      const unseenCount = (requestsResponse?.Result || []).filter(
        (item: any) =>
          String(item.status || "").toLowerCase() !== "pending" &&
          item.collector_seen === false
      ).length;

      setUnseenDecisionCount(unseenCount);
    } catch (error) {
      console.log("Error fetching collector direct requests:", error);
      setAllRequests([]);
      setUnseenDecisionCount(0);
    } finally {
      setRequestsLoading(false);
    }
  };

  const pendingRequests = useMemo(() => {
    return allRequests.filter(
      (item: any) => getNormalizedStatus(item) === "pending"
    );
  }, [allRequests]);

  const handleSellerPostPress = (post: any) => {
    const sellerLatitude = String(post.latitude ?? "");
    const sellerLongitude = String(post.longitude ?? "");

    const finalCollectorLat = collectorLocation
      ? String(collectorLocation.latitude)
      : !isNaN(paramsLatitude)
      ? String(paramsLatitude)
      : "";

    const finalCollectorLng = collectorLocation
      ? String(collectorLocation.longitude)
      : !isNaN(paramsLongitude)
      ? String(paramsLongitude)
      : "";

    router.push({
      pathname: "/seller_details",
      params: {
        post_id: post.post_id || "",
        seller_id: post.seller_id || "",
        name: post.seller_name || post.name || "Seller",
        address: post.address || "No address",
        sellerLat: sellerLatitude,
        sellerLng: sellerLongitude,
        collectorLat: finalCollectorLat,
        collectorLng: finalCollectorLng,
        pickup_date: post.pickup_date ? String(post.pickup_date) : "",
        pickup_time: post.pickup_time ? String(post.pickup_time) : "",
        total_amount: String(post.total_amount ?? 0),
        item_count: String(post.item_count ?? 0),
        post_status: post.status || "posted",
        collector_id: collectorId,
      },
    });
  };

  const handleViewAll = () => {
    const finalCollectorLat = collectorLocation
      ? String(collectorLocation.latitude)
      : !isNaN(paramsLatitude)
      ? String(paramsLatitude)
      : "";

    const finalCollectorLng = collectorLocation
      ? String(collectorLocation.longitude)
      : !isNaN(paramsLongitude)
      ? String(paramsLongitude)
      : "";

    router.push({
      pathname: "/total_sellers",
      params: {
        collector_id: collectorId,
        collectorLat: finalCollectorLat,
        collectorLng: finalCollectorLng,
      },
    });
  };
  //complete pickup method
  const handlePickupsPress = () => {
  if (!collectorId) {
    Alert.alert("Error", "Collector ID not found. Please login again.");
    return;
  }

  router.push({
    pathname: "/collector_pickups",
    params: {
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
  // bottom nav Requests -> collector_requests
  const handleRequestsPress = () => {
    if (!collectorId) {
      Alert.alert("Error", "Collector ID not found. Please login again.");
      return;
    }

    router.push({
      pathname: "/collector_requests",
      params: {
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

  // Pickup Requests View All -> collector_see_seller_all_requests
  const handlePickupViewAllPress = () => {
    if (!collectorId) {
      Alert.alert("Error", "Collector ID not found. Please login again.");
      return;
    }

    router.push({
      pathname: "/collector_see_seller_all_requests",
      params: {
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

  const handleAccountPress = () => {
    try {
      if (!collectorId) {
        Alert.alert("Error", "Collector ID not found. Please login again.");
        return;
      }

      router.push({
        pathname: "/collector_profile",
        params: {
          collector_id: collectorId,
          name: typeof params.name === "string" ? params.name : "",
          email: typeof params.email === "string" ? params.email : "",
          phone: typeof params.phone === "string" ? params.phone : "",
          address: typeof params.address === "string" ? params.address : "",
          area: typeof params.area === "string" ? params.area : "",
          city: typeof params.city === "string" ? params.city : "",
          latitude: typeof params.latitude === "string" ? params.latitude : "",
          longitude: typeof params.longitude === "string" ? params.longitude : "",
        },
      });
    } catch (error) {
      console.log("Account navigation error:", error);
      Alert.alert("Error", "Unable to open profile");
    }
  };

  const handlePickupRequestView = (item: any) => {
    router.push({
      pathname: "/pickupDetails_collector",
      params: {
        pickup: JSON.stringify(item),
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

  useEffect(() => {
    getLocation();
  }, []);

  useEffect(() => {
    fetchRequests();

    const interval = setInterval(() => {
      fetchRequests();
    }, 3000);

    return () => clearInterval(interval);
  }, [collectorId]);

  useEffect(() => {
    if (collectorLocation) {
      fetchSellerPosts();
    }
  }, [collectorLocation]);

  useFocusEffect(
    useCallback(() => {
      fetchSellerPosts();
      fetchRequests();
    }, [collectorLocation, paramsLatitude, paramsLongitude, collectorId])
  );

  const totalAvailableWeight = sellerPosts.reduce((sum: number, post: any) => {
    return sum + Number(post.total_weight || 0);
  }, 0);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#dff5e4", "#bde8c4", "#a9ddb3"]}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <View style={styles.userInfo}>
            <View>
              <Text style={styles.dashboardText}>Collector Dashboard</Text>
              <Text style={styles.welcomeText}>Welcome, {collectorName}</Text>
            </View>
          </View>

          <View style={styles.headerIcons}>
            <Bell color="#1a365d" size={22} />
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 130 }}
        >
          <View style={styles.statsGrid}>
            <StatCard
              label="Total Pickups"
              value="24"
              color="#e0eaff"
              icon={<Smartphone size={18} color="#4a90e2" />}
            />
            <StatCard
              label="Available Kg"
              value={`${totalAvailableWeight.toFixed(1)} kg`}
              color="#fff4e6"
              icon={<Weight size={18} color="#f6ad55" />}
            />
            <StatCard
              label="Live Posts"
              value={loading ? "..." : sellerPosts.length.toString()}
              color="#e6fffa"
              icon={<Users size={18} color="#38b2ac" />}
            />
            <StatCard
              label="Pending Requests"
              value={requestsLoading ? "..." : pendingRequests.length.toString()}
              color="#f0fff4"
              icon={<MessageSquare size={18} color="#48bb78" />}
            />
          </View>

          <View style={styles.whiteSection}>
            <View style={styles.sectionHeader}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text style={styles.sectionTitleInternal}>Available Scrap Posts</Text>
              </View>
              <TouchableOpacity onPress={handleViewAll}>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.nearbyContainer}>
              {loading ? (
                <Text style={styles.emptyText}>Loading scrap posts...</Text>
              ) : sellerPosts.length === 0 ? (
                <Text style={styles.emptyText}>No public scrap posts available</Text>
              ) : (
                sellerPosts.slice(0, 3).map((post: any, index) => (
                  <SellerPostCard
                    key={index}
                    name={post.seller_name || post.name || "Seller"}
                    address={post.address || "No address"}
                    distance={
                      post.distance && post.distance !== "--"
                        ? `${post.distance} km away`
                        : "-- km away"
                    }
                    itemCount={String(post.item_count ?? 0)}
                    totalAmount={`₹ ${Number(post.total_amount || 0).toFixed(2)}`}
                    pickupDate={formatDate(post.pickup_date)}
                    pickupTime={post.pickup_time || "Not set"}
                    status={post.status || "posted"}
                    onPress={() => handleSellerPostPress(post)}
                  />
                ))
              )}
            </View>
          </View>

          <View style={styles.pickupRequestContainer}>
            <View style={styles.pickupHeaderRow}>
              <Text style={styles.pickupMainTitle}>Pickup Requests</Text>

              <TouchableOpacity onPress={handlePickupViewAllPress}>
                <Text style={styles.pickupViewAll}>View All</Text>
              </TouchableOpacity>
            </View>

            {requestsLoading ? (
              <Text style={styles.emptyRequestText}>Loading requests...</Text>
            ) : pendingRequests.length === 0 ? (
              <Text style={styles.emptyRequestText}>No pending requests</Text>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.pickupCardsRow}>
                  {pendingRequests.slice(0, 6).map((item: any, i) => (
                    <PickupRequestCard
                      key={item.pickup_id || i}
                      name={item.seller_name || "Seller"}
                      address={item.seller_address || item.address || "No address"}
                      onView={() => handlePickupRequestView(item)}
                      isLast={i === pendingRequests.slice(0, 6).length - 1}
                    />
                  ))}
                </View>
              </ScrollView>
            )}
          </View>
        </ScrollView>

        <View style={styles.bottomNav}>
          <NavItem
            icon={<Home color="#1a365d" size={24} />}
            label="Home"
            active
          />
          <NavItem
            icon={
              <View style={styles.navIconWrap}>
                <FileText color="#718096" size={24} />
                {unseenDecisionCount > 0 && (
                  <View style={styles.navBadge}>
                    <Text style={styles.navBadgeText}>
                      {unseenDecisionCount > 99 ? "99+" : unseenDecisionCount}
                    </Text>
                  </View>
                )}
              </View>
            }
            label="Requests"
            onPress={handleRequestsPress}
          />
        
          <NavItem
            icon={<Users color="#718096" size={24} />}
            label="Pickups"
            onPress={handlePickupsPress}
          />
          <NavItem
            icon={<User color="#718096" size={24} />}
            label="Account"
            onPress={handleAccountPress}
          />
        </View>
      </SafeAreaView>
    </View>
  );
};

const StatCard = ({ label, value, color, icon }: StatCardProps) => (
  <View style={styles.card}>
    <View style={[styles.cardIconBox, { backgroundColor: color }]}>{icon}</View>
    <View>
      <Text style={styles.cardLabel}>{label}</Text>
      <Text style={styles.cardValue}>{value}</Text>
    </View>
  </View>
);

const SellerPostCard = ({
  name,
  address,
  distance,
  itemCount,
  totalAmount,
  pickupDate,
  pickupTime,
  status,
  onPress,
}: SellerPostCardProps) => (
  <View style={styles.sellerPostCard}>
    <View style={styles.sellerTopRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.sellerName}>{name}</Text>
        <Text style={styles.sellerSubText}>
          {address} • {distance}
        </Text>
      </View>

      <View style={styles.statusBadge}>
        <Text style={styles.statusBadgeText}>
          {status === "posted"
            ? "Live"
            : status === "booked"
            ? "Booked"
            : status === "completed"
            ? "Done"
            : status}
        </Text>
      </View>
    </View>

    <View style={styles.postMetaGrid}>
      <View style={styles.metaBox}>
        <Text style={styles.metaLabel}>Items</Text>
        <Text style={styles.metaValue}>{itemCount}</Text>
      </View>

      <View style={styles.metaBox}>
        <Text style={styles.metaLabel}>Total</Text>
        <Text style={styles.metaValue}>{totalAmount}</Text>
      </View>
    </View>

    <View style={styles.slotCard}>
      <Text style={styles.slotTitle}>Pickup Slot</Text>
      <Text style={styles.slotText}>{pickupDate}</Text>
      <Text style={styles.slotText}>{pickupTime}</Text>
    </View>

    <TouchableOpacity style={styles.viewButton} onPress={onPress}>
      <Text style={styles.viewButtonText}>View Details</Text>
      <ChevronRight size={16} color="white" />
    </TouchableOpacity>
  </View>
);

const PickupRequestCard = ({
  name,
  address,
  onView,
  isLast = false,
}: PickupRequestCardProps) => (
  <View style={styles.pickupMiniCardWrap}>
    <View style={styles.pickupMiniCard}>
      <Text style={styles.pickupMiniName} numberOfLines={1}>
        {name}
      </Text>

      <Text style={styles.pickupMiniAddress} numberOfLines={2}>
        {address}
      </Text>

      <TouchableOpacity style={styles.pickupMiniBtn} onPress={onView}>
        <Text style={styles.pickupMiniBtnText}>View Details</Text>
      </TouchableOpacity>
    </View>

    {!isLast && <View style={styles.pickupDivider} />}
  </View>
);

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
  container: { flex: 1 },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 30,
    marginBottom: 15,
  },

  userInfo: {
    flexDirection: "row",
    alignItems: "center",
  },

  dashboardText: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1a365d",
  },

  welcomeText: {
    fontSize: 13,
    color: "#4a5568",
    marginTop: 3,
    fontWeight: "500",
  },

  headerIcons: {
    flexDirection: "row",
  },

  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 10,
    marginBottom: 10,
  },

  card: {
    backgroundColor: "white",
    width: "45%",
    margin: "2.5%",
    padding: 15,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    elevation: 3,
  },

  cardIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },

  cardLabel: {
    fontSize: 11,
    color: "#718096",
    fontWeight: "600",
  },

  cardValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2d3748",
  },

  whiteSection: {
    backgroundColor: "white",
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 15,
    paddingTop: 10,
    marginBottom: 20,
    elevation: 2,
  },

  nearbyContainer: {
    paddingTop: 5,
  },

  sellerPostCard: {
    backgroundColor: "#f8fbf9",
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#e6efe9",
  },

  sellerTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  sellerName: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#2d3748",
  },

  sellerSubText: {
    fontSize: 12,
    color: "#718096",
    marginTop: 3,
  },

  statusBadge: {
    backgroundColor: "#e6f7ec",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    marginLeft: 10,
  },

  statusBadgeText: {
    color: "#2f855a",
    fontSize: 11,
    fontWeight: "700",
  },

  postMetaGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  metaBox: {
    width: "48%",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 10,
  },

  metaLabel: {
    fontSize: 11,
    color: "#718096",
    marginBottom: 4,
    fontWeight: "600",
  },

  metaValue: {
    fontSize: 14,
    color: "#1a365d",
    fontWeight: "800",
  },

  slotCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
  },

  slotTitle: {
    fontSize: 12,
    color: "#718096",
    fontWeight: "700",
    marginBottom: 4,
  },

  slotText: {
    fontSize: 13,
    color: "#2d3748",
    fontWeight: "600",
    marginBottom: 2,
  },

  viewButton: {
    backgroundColor: "#1e6fd9",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 10,
  },

  viewButtonText: {
    color: "white",
    fontWeight: "bold",
    marginRight: 4,
  },

  pickupRequestContainer: {
    backgroundColor: "#f5f5f5",
    marginHorizontal: 20,
    borderRadius: 32,
    paddingVertical: 22,
    paddingHorizontal: 18,
    marginBottom: 20,
    elevation: 2,
  },

  pickupHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },

  pickupMainTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1a365d",
  },

  pickupViewAll: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1e6fd9",
  },

  pickupCardsRow: {
    flexDirection: "row",
    alignItems: "stretch",
  },

  pickupMiniCardWrap: {
    flexDirection: "row",
    alignItems: "stretch",
  },

  pickupMiniCard: {
    width: 255,
    paddingRight: 18,
    justifyContent: "space-between",
  },

  pickupDivider: {
    width: 2,
    backgroundColor: "#e4e4e4",
    marginHorizontal: 8,
    borderRadius: 2,
  },

  pickupMiniName: {
    fontSize: 24,
    fontWeight: "800",
    color: "#2f3b52",
    marginBottom: 6,
  },

  pickupMiniAddress: {
    fontSize: 18,
    fontWeight: "600",
    color: "#666666",
    marginBottom: 24,
  },

  pickupMiniBtn: {
    backgroundColor: "#388f5d",
    height: 62,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },

  pickupMiniBtnText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "800",
  },

  navIconWrap: {
    position: "relative",
  },

  navBadge: {
    position: "absolute",
    top: -6,
    right: -10,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#d64545",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },

  navBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "800",
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },

  sectionTitleInternal: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1a365d",
  },

  viewAllText: {
    color: "#1e6fd9",
    fontSize: 13,
    fontWeight: "600",
  },

  requestCard: {
    width: 220,
    backgroundColor: "#f8fbf9",
    borderRadius: 14,
    padding: 14,
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#e6efe9",
  },

  requestHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },

  requestName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#2d3748",
    marginBottom: 4,
  },

  requestAddress: {
    fontSize: 12,
    color: "#718096",
  },

  requestViewBtn: {
    marginTop: 10,
    backgroundColor: "#2f855a",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },

  requestViewBtnText: {
    color: "#fff",
    fontWeight: "700",
  },

  emptyText: {
    textAlign: "center",
    color: "#718096",
    paddingVertical: 18,
  },

  emptyRequestText: {
    color: "#718096",
    paddingVertical: 18,
    paddingHorizontal: 4,
    fontSize: 15,
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

export default DashboardUI;