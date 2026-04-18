import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { getRequest, postRequest } from "../Services/axiosServices";

interface Profile {
  seller_id?: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  latitude?: string | number;
  longitude?: string | number;
}

const SellerProfileScreen = () => {
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

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);

  const [editLoading, setEditLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editLatitude, setEditLatitude] = useState("");
  const [editLongitude, setEditLongitude] = useState("");

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const sellerId =
    typeof params.seller_id === "string" ? params.seller_id : "";

  const fetchProfile = async () => {
    try {
      setLoading(true);

      if (!sellerId) {
        Alert.alert("Error", "Seller ID not found. Please login again.");
        return;
      }

      const res = await getRequest(`/seller/profile/${sellerId}`, false);
      console.log("SELLER PROFILE RESPONSE:", JSON.stringify(res, null, 2));

      if (res?.Status === "OK" && res?.Data) {
        const seller = res.Data;

        setProfile({
          seller_id: seller.seller_id || sellerId,
          name: seller.name || "",
          email: seller.email || "",
          phone: seller.phone || "",
          address: seller.address || "",
          latitude: seller.latitude || "",
          longitude: seller.longitude || "",
        });
      } else {
        const fallbackProfile: Profile = {
          seller_id: sellerId,
          name: typeof params.name === "string" ? params.name : "",
          email: typeof params.email === "string" ? params.email : "",
          phone: typeof params.phone === "string" ? params.phone : "",
          address: typeof params.address === "string" ? params.address : "",
          latitude: typeof params.latitude === "string" ? params.latitude : "",
          longitude: typeof params.longitude === "string" ? params.longitude : "",
        };

        if (
          fallbackProfile.name ||
          fallbackProfile.email ||
          fallbackProfile.phone ||
          fallbackProfile.address
        ) {
          setProfile(fallbackProfile);
        } else {
          Alert.alert("Error", res?.Result || "Failed to fetch seller profile");
        }
      }
    } catch (err) {
      console.log("Profile Error:", err);

      const fallbackProfile: Profile = {
        seller_id: sellerId,
        name: typeof params.name === "string" ? params.name : "",
        email: typeof params.email === "string" ? params.email : "",
        phone: typeof params.phone === "string" ? params.phone : "",
        address: typeof params.address === "string" ? params.address : "",
        latitude: typeof params.latitude === "string" ? params.latitude : "",
        longitude: typeof params.longitude === "string" ? params.longitude : "",
      };

      if (
        fallbackProfile.name ||
        fallbackProfile.email ||
        fallbackProfile.phone ||
        fallbackProfile.address
      ) {
        setProfile(fallbackProfile);
      } else {
        Alert.alert("Error", "Something went wrong while fetching profile");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Yes",
        onPress: () => {
          router.replace("/");
        },
      },
    ]);
  };

  const openEditModal = () => {
    if (!profile) {
      Alert.alert("Error", "Profile data not found");
      return;
    }

    setEditName(profile.name || "");
    setEditPhone(profile.phone || "");
    setEditAddress(profile.address || "");
    setEditLatitude(String(profile.latitude || ""));
    setEditLongitude(String(profile.longitude || ""));
    setEditModalVisible(true);
  };

  const openPasswordModal = () => {
    if (!profile?.email) {
      Alert.alert("Error", "Email not found");
      return;
    }

    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordModalVisible(true);
  };

  const handleUpdateProfile = async () => {
    try {
      if (!profile?.email) {
        Alert.alert("Error", "Seller email not found");
        return;
      }

      if (!editName || !editPhone || !editAddress) {
        Alert.alert("Error", "Please fill all required fields");
        return;
      }

      setEditLoading(true);

      const payload = {
        email: profile.email,
        name: editName,
        phone: editPhone,
        address: editAddress,
        latitude: editLatitude,
        longitude: editLongitude,
      };

      const response = await postRequest("/seller/change-profile", payload, false);
      console.log("UPDATE SELLER PROFILE RESPONSE:", response);

      if (response?.Status === "OK") {
        setProfile({
          ...profile,
          name: editName,
          phone: editPhone,
          address: editAddress,
          latitude: editLatitude,
          longitude: editLongitude,
        });
        setEditModalVisible(false);
        Alert.alert("Success", response?.Result || "Profile updated successfully");
      } else {
        Alert.alert("Error", response?.Result || "Failed to update profile");
      }
    } catch (error) {
      console.log("Update seller profile error:", error);
      Alert.alert("Error", "Something went wrong while updating profile");
    } finally {
      setEditLoading(false);
    }
  };

  const handleChangePassword = async () => {
    try {
      if (!profile?.email) {
        Alert.alert("Error", "Seller email not found");
        return;
      }

      if (!oldPassword || !newPassword || !confirmPassword) {
        Alert.alert("Error", "Please fill all password fields");
        return;
      }

      if (newPassword !== confirmPassword) {
        Alert.alert("Error", "New password and confirm password do not match");
        return;
      }

      setPasswordLoading(true);

      const payload = {
        email: profile.email,
        oldPassword: oldPassword,
        newPassword: newPassword,
      };

      const response = await postRequest("/seller/change-password", payload, false);
      console.log("CHANGE SELLER PASSWORD RESPONSE:", response);

      if (response?.Status === "OK") {
        setPasswordModalVisible(false);
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
        Alert.alert("Success", response?.Result || "Password changed successfully");
      } else {
        Alert.alert("Error", response?.Result || "Failed to change password");
      }
    } catch (error) {
      console.log("Change seller password error:", error);
      Alert.alert("Error", "Something went wrong while changing password");
    } finally {
      setPasswordLoading(false);
    }
  };

  if (loading) {
    return (
      <ActivityIndicator
        size="large"
        color="#2f855a"
        style={{ flex: 1 }}
      />
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f2f4f7" }}>
      <LinearGradient colors={["#2f855a", "#38a169"]} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>

        <Text style={styles.headerText}>My Profile</Text>
      </LinearGradient>

      <View style={styles.container}>
        <View style={styles.card}>
          <View style={styles.row}>
            <Ionicons name="person-outline" size={20} color="#2f855a" />
            <View style={styles.info}>
              <Text style={styles.label}>Name</Text>
              <Text style={styles.nameValue}>{profile?.name || "-"}</Text>
            </View>
          </View>

          <View style={styles.row}>
            <Ionicons name="mail-outline" size={20} color="#2f855a" />
            <View style={styles.info}>
              <Text style={styles.label}>Email</Text>
              <Text style={styles.value}>{profile?.email || "-"}</Text>
            </View>
          </View>

          <View style={styles.row}>
            <Ionicons name="call-outline" size={20} color="#2f855a" />
            <View style={styles.info}>
              <Text style={styles.label}>Phone</Text>
              <Text style={styles.value}>{profile?.phone || "-"}</Text>
            </View>
          </View>

          <View style={[styles.row, { borderBottomWidth: 0 }]}>
            <Ionicons name="location-outline" size={20} color="#2f855a" />
            <View style={styles.info}>
              <Text style={styles.label}>Address</Text>
              <Text style={styles.value}>{profile?.address || "-"}</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.primaryBtn} onPress={openEditModal}>
          <Ionicons name="create-outline" size={16} color="#fff" />
          <Text style={styles.btnText}> Update Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryBtn} onPress={openPasswordModal}>
          <Ionicons name="lock-closed-outline" size={16} color="#fff" />
          <Text style={styles.btnText}> Change Password</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={18} color="#fff" />
          <Text style={styles.btnText}> Logout</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={editModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Update Profile</Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              <TextInput
                style={styles.input}
                placeholder="Name"
                value={editName}
                onChangeText={setEditName}
              />

              <TextInput
                style={styles.input}
                placeholder="Phone"
                value={editPhone}
                onChangeText={setEditPhone}
                keyboardType="phone-pad"
              />

              <TextInput
                style={styles.input}
                placeholder="Address"
                value={editAddress}
                onChangeText={setEditAddress}
              />

              <TextInput
                style={styles.input}
                placeholder="Latitude"
                value={editLatitude}
                onChangeText={setEditLatitude}
                keyboardType="numeric"
              />

              <TextInput
                style={styles.input}
                placeholder="Longitude"
                value={editLongitude}
                onChangeText={setEditLongitude}
                keyboardType="numeric"
              />
            </ScrollView>

            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleUpdateProfile}
                disabled={editLoading}
              >
                <Text style={styles.saveBtnText}>
                  {editLoading ? "Saving..." : "Save"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={passwordModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPasswordModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Change Password</Text>

            <TextInput
              style={styles.input}
              placeholder="Old Password"
              value={oldPassword}
              onChangeText={setOldPassword}
              secureTextEntry
            />

            <TextInput
              style={styles.input}
              placeholder="New Password"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
            />

            <TextInput
              style={styles.input}
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />

            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setPasswordModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleChangePassword}
                disabled={passwordLoading}
              >
                <Text style={styles.saveBtnText}>
                  {passwordLoading ? "Updating..." : "Update"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

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

  container: {
    padding: 20,
    alignItems: "center",
  },

  card: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
    elevation: 2,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderColor: "#ddd",
  },

  info: {
    marginLeft: 10,
    flex: 1,
  },

  label: {
    fontSize: 12,
    color: "#777",
  },

  value: {
    fontSize: 14,
    fontWeight: "bold",
  },

  nameValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1b4332",
  },

  primaryBtn: {
    flexDirection: "row",
    backgroundColor: "#2f855a",
    padding: 12,
    borderRadius: 10,
    width: "100%",
    justifyContent: "center",
    marginBottom: 10,
  },

  secondaryBtn: {
    flexDirection: "row",
    backgroundColor: "#4a5568",
    padding: 12,
    borderRadius: 10,
    width: "100%",
    justifyContent: "center",
    marginBottom: 10,
  },

  logoutBtn: {
    flexDirection: "row",
    backgroundColor: "#e53e3e",
    padding: 12,
    borderRadius: 10,
    width: "100%",
    justifyContent: "center",
  },

  btnText: {
    color: "#fff",
    fontWeight: "bold",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  modalCard: {
    width: "100%",
    maxHeight: "85%",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    elevation: 10,
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2d3748",
    textAlign: "center",
    marginBottom: 18,
  },

  input: {
    height: 48,
    borderWidth: 1,
    borderColor: "#d2d6dc",
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: "#f9fafb",
    marginBottom: 12,
    color: "#2d3748",
  },

  modalButtonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },

  cancelBtn: {
    flex: 1,
    backgroundColor: "#e2e8f0",
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: "center",
    marginRight: 8,
  },

  cancelBtnText: {
    color: "#2d3748",
    fontWeight: "bold",
    fontSize: 15,
  },

  saveBtn: {
    flex: 1,
    backgroundColor: "#2f855a",
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: "center",
    marginLeft: 8,
  },

  saveBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
  },
});

export default SellerProfileScreen;