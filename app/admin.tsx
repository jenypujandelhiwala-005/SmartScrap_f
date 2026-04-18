import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { BASE_URL, getRequest, postRequest } from "../Services/axiosServices";

export default function AdminDashboard() {
  const router = useRouter();

  const [collectorCount, setCollectorCount] = useState<number>(0);
  const [sellerCount, setSellerCount] = useState<number>(0);
  const [loadingCounts, setLoadingCounts] = useState<boolean>(true);

  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [email, setEmail] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [description, setDescription] = useState("");
  const [categoryImage, setCategoryImage] = useState<any>(null);
  const [categoryLoading, setCategoryLoading] = useState(false);

  const complaintCount = 9;
  const lowRatingsCount = 5;
  const pendingComplaintsCount = 4;

  useEffect(() => {
    fetchDashboardCounts();
  }, []);

  const fetchDashboardCounts = async () => {
  try {
    setLoadingCounts(true);

    const [collectorResponse, sellerResponse] = await Promise.all([
      getRequest("/Admin/Collectors", false),
      getRequest("/seller/list", false),
    ]);

    if (collectorResponse?.Status === "OK") {
      setCollectorCount((collectorResponse.Result || []).length);
    } else {
      setCollectorCount(0);
    }

    if (sellerResponse?.Status === "OK") {
      setSellerCount((sellerResponse.Data || []).length);
    } else {
      setSellerCount(0);
    }

    console.log("collectorResponse:", collectorResponse);
    console.log("sellerResponse:", sellerResponse);
  } catch (error) {
    console.log("fetchDashboardCounts error:", error);
    setCollectorCount(0);
    setSellerCount(0);
  } finally {
    setLoadingCounts(false);
  }
};

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: () => {
          router.replace("/LoginScreenRole");
        },
      },
    ]);
  };

  const closePasswordModal = () => {
    setShowChangePasswordModal(false);
    setEmail("");
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setShowOldPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  };

  const closeCategoryModal = () => {
    setShowCategoryModal(false);
    setCategoryName("");
    setDescription("");
    setCategoryImage(null);
  };

  const handleChangePassword = async () => {
    if (!email || !oldPassword || !newPassword || !confirmPassword) {
      Alert.alert("Error", "Please fill all fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "New password and confirm password do not match");
      return;
    }

    if (newPassword.length < 4) {
      Alert.alert("Error", "New password must be at least 4 characters");
      return;
    }

    try {
      setPasswordLoading(true);

      const payload = {
        email,
        oldPassword,
        newPassword,
      };

      const response = await postRequest("/Admin/ChangePassword", payload, false);

      if (response?.Status === "OK") {
        Alert.alert(
          "Success",
          response?.Result || "Password changed successfully"
        );
        closePasswordModal();
      } else {
        Alert.alert("Error", response?.Result || "Failed to change password");
      }
    } catch (error) {
      console.log("change password error:", error);
      Alert.alert("Error", "Something went wrong while changing password");
    } finally {
      setPasswordLoading(false);
    }
  };

  const pickCategoryImage = async () => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert("Permission required", "Please allow gallery access");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      });

      if (!result.canceled) {
        setCategoryImage(result.assets[0]);
      }
    } catch (error) {
      console.log("pickCategoryImage error:", error);
      Alert.alert("Error", "Unable to open gallery");
    }
  };

  const handleAddCategory = async () => {
    if (!categoryName.trim() || !description.trim()) {
      Alert.alert("Error", "Please fill all fields");
      return;
    }

    try {
      setCategoryLoading(true);

      const formData = new FormData();
      formData.append("category_name", categoryName.trim());
      formData.append("description", description.trim());

      if (categoryImage?.uri) {
        const uriParts = categoryImage.uri.split(".");
        const fileType =
          uriParts[uriParts.length - 1]?.toLowerCase() || "jpg";

        formData.append("image", {
          uri: categoryImage.uri,
          name: `category.${fileType}`,
          type: `image/${fileType === "jpg" ? "jpeg" : fileType}`,
        } as any);
      }

      const response = await fetch(`${BASE_URL}/Category`, {
        method: "POST",
        body: formData,
      });

      const text = await response.text();
      console.log("Add category raw response:", text);

      if (!response.ok) {
        Alert.alert("Error", `Server error: ${response.status}`);
        return;
      }

      if (text.startsWith("<")) {
        Alert.alert("Backend Error", "Received HTML instead of JSON");
        return;
      }

      const data = JSON.parse(text);

      if (data?.Status === "OK") {
        Alert.alert("Success", data?.Result || "Category added successfully");
        closeCategoryModal();
      } else {
        Alert.alert("Error", data?.Result || "Failed to add category");
      }
    } catch (error) {
      console.log("handleAddCategory error:", error);
      Alert.alert("Error", "Something went wrong while adding category");
    } finally {
      setCategoryLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={["#dff5e4", "#a8e0b2", "#8bd39c"]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContainer}
        >
          <View style={styles.headerCard}>
            <View style={styles.headerTopRow}>
              <View>
                <Text style={styles.welcomeText}>Welcome Back</Text>
                <Text style={styles.adminText}>Admin</Text>
              </View>

              <TouchableOpacity
                style={styles.adminBadge}
                activeOpacity={0.85}
                onPress={fetchDashboardCounts}
              >
                <MaterialCommunityIcons
                  name="shield-account"
                  size={22}
                  color="#2e7d32"
                />
              </TouchableOpacity>
            </View>

            <Text style={styles.subText}>
              Monitor platform activity, manage users and configure scrap pricing
              quickly.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Overview</Text>

            <View style={styles.statsRow}>
              <View style={styles.statsCard}>
                <View
                  style={[
                    styles.statsIconWrap,
                    { backgroundColor: "#EAF8ED" },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="truck-delivery-outline"
                    size={24}
                    color="#2e7d32"
                  />
                </View>

                {loadingCounts ? (
                  <ActivityIndicator size="small" color="#2e7d32" />
                ) : (
                  <Text style={styles.statsCount}>{collectorCount}</Text>
                )}

                <Text style={styles.statsLabel}>Collectors</Text>
              </View>

              <View style={styles.statsCard}>
                <View
                  style={[
                    styles.statsIconWrap,
                    { backgroundColor: "#EEF4FF" },
                  ]}
                >
                  <Ionicons name="people-outline" size={24} color="#1565c0" />
                </View>

                {loadingCounts ? (
                  <ActivityIndicator size="small" color="#1565c0" />
                ) : (
                  <Text style={styles.statsCount}>{sellerCount}</Text>
                )}

                <Text style={styles.statsLabel}>Sellers</Text>
              </View>

              <View style={styles.statsCard}>
                <View
                  style={[
                    styles.statsIconWrap,
                    { backgroundColor: "#FFF1F0" },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="alert-circle-outline"
                    size={24}
                    color="#d32f2f"
                  />
                </View>
                <Text style={styles.statsCount}>{complaintCount}</Text>
                <Text style={styles.statsLabel}>Complaints</Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>

            <View style={styles.actionGrid}>
              <TouchableOpacity
                style={styles.actionGridCard}
                activeOpacity={0.85}
                onPress={() => router.push("/ListCollector")}
              >
                <View
                  style={[
                    styles.actionGridIcon,
                    { backgroundColor: "#EAF8ED" },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="account-group-outline"
                    size={26}
                    color="#2e7d32"
                  />
                </View>
                <Text style={styles.actionGridTitle}>Manage Collector</Text>
                <Text style={styles.actionGridSub}>
                  View and manage collectors
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionGridCard}
                activeOpacity={0.85}
                onPress={() => router.push("/SellerList")}
              >
                <View
                  style={[
                    styles.actionGridIcon,
                    { backgroundColor: "#EEF4FF" },
                  ]}
                >
                  <Ionicons name="person-outline" size={24} color="#1565c0" />
                </View>

                <Text style={styles.actionGridTitle}>Manage Seller</Text>
                <Text style={styles.actionGridSub}>
                  View and manage seller accounts
                </Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.actionGrid, { marginTop: 14 }]}>
              <TouchableOpacity
                style={styles.actionGridCard}
                activeOpacity={0.85}
                onPress={() => setShowCategoryModal(true)}
              >
                <View
                  style={[
                    styles.actionGridIcon,
                    { backgroundColor: "#EAF8ED" },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="shape-outline"
                    size={26}
                    color="#2e7d32"
                  />
                </View>
                <Text style={styles.actionGridTitle}>Add Category</Text>
                <Text style={styles.actionGridSub}>
                  Create scrap categories with image
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionGridCard}
                activeOpacity={0.85}
                onPress={() => router.push("/ManageCategoryScreen")}
              >
                <View
                  style={[
                    styles.actionGridIcon,
                    { backgroundColor: "#FFF8E7" },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="view-list-outline"
                    size={26}
                    color="#c98900"
                  />
                </View>
                <Text style={styles.actionGridTitle}>View Category</Text>
                <Text style={styles.actionGridSub}>
                  Check category records and status
                </Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.actionGrid, { marginTop: 14 }]}>
              <TouchableOpacity
                style={styles.actionGridCard}
                activeOpacity={0.85}
                onPress={() => router.push("/ManageScrapPriceScreen")}
              >
                <View
                  style={[
                    styles.actionGridIcon,
                    { backgroundColor: "#EEF4FF" },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="currency-inr"
                    size={26}
                    color="#1565c0"
                  />
                </View>
                <Text style={styles.actionGridTitle}>Set Price</Text>
                <Text style={styles.actionGridSub}>
                  Add sub-category and set price per kg
                </Text>
              </TouchableOpacity>

              <View style={[styles.actionGridCard, styles.transparentCard]} />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Reports</Text>

            <TouchableOpacity style={styles.reportCard} activeOpacity={0.85}>
              <View style={styles.reportLeft}>
                <View
                  style={[
                    styles.reportIconWrap,
                    { backgroundColor: "#FFF7E8" },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="star-half-full"
                    size={22}
                    color="#f9a825"
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.reportTitle}>Low Ratings</Text>
                  <Text style={styles.reportSubtitle}>
                    Users with poor ratings need attention
                  </Text>
                </View>
              </View>

              <View style={styles.rightSide}>
                <View style={styles.yellowBadge}>
                  <Text style={styles.yellowBadgeText}>{lowRatingsCount}</Text>
                </View>
                <Feather name="chevron-right" size={20} color="#777" />
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.reportCard} activeOpacity={0.85}>
              <View style={styles.reportLeft}>
                <View
                  style={[
                    styles.reportIconWrap,
                    { backgroundColor: "#FFF1F0" },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="file-document-alert-outline"
                    size={22}
                    color="#d32f2f"
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.reportTitle}>Pending Complaints</Text>
                  <Text style={styles.reportSubtitle}>
                    Complaints waiting for resolution
                  </Text>
                </View>
              </View>

              <View style={styles.rightSide}>
                <View style={styles.redBadge}>
                  <Text style={styles.redBadgeText}>
                    {pendingComplaintsCount}
                  </Text>
                </View>
                <Feather name="chevron-right" size={20} color="#777" />
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account</Text>

            <TouchableOpacity
              style={styles.accountCard}
              activeOpacity={0.85}
              onPress={() => setShowChangePasswordModal(true)}
            >
              <View style={styles.accountLeft}>
                <View
                  style={[
                    styles.accountIconWrap,
                    { backgroundColor: "#EEF4FF" },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="lock-reset"
                    size={22}
                    color="#1565c0"
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.accountTitle}>Change Password</Text>
                  <Text style={styles.accountSubtitle}>
                    Update your admin account password
                  </Text>
                </View>
              </View>

              <Feather name="chevron-right" size={20} color="#777" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.accountCard}
              activeOpacity={0.85}
              onPress={handleLogout}
            >
              <View style={styles.accountLeft}>
                <View
                  style={[
                    styles.accountIconWrap,
                    { backgroundColor: "#FFF1F0" },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="logout"
                    size={22}
                    color="#d32f2f"
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.accountTitle}>Logout</Text>
                  <Text style={styles.accountSubtitle}>
                    Sign out from admin dashboard
                  </Text>
                </View>
              </View>

              <Feather name="chevron-right" size={20} color="#777" />
            </TouchableOpacity>
          </View>
        </ScrollView>

        <Modal
          visible={showChangePasswordModal}
          transparent
          animationType="fade"
          onRequestClose={closePasswordModal}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Change Password</Text>
                <TouchableOpacity onPress={closePasswordModal}>
                  <Ionicons name="close" size={22} color="#333" />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalSubtitle}>
                Update your admin account password
              </Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Admin Email</Text>
                <View style={styles.inputWrapper}>
                  <MaterialCommunityIcons
                    name="email-outline"
                    size={20}
                    color="#5f7a66"
                    style={styles.leftIcon}
                  />
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Enter admin email"
                    placeholderTextColor="#8a8a8a"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    value={email}
                    onChangeText={setEmail}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Old Password</Text>
                <View style={styles.inputWrapper}>
                  <MaterialCommunityIcons
                    name="lock-outline"
                    size={20}
                    color="#5f7a66"
                    style={styles.leftIcon}
                  />
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Enter old password"
                    placeholderTextColor="#8a8a8a"
                    secureTextEntry={!showOldPassword}
                    value={oldPassword}
                    onChangeText={setOldPassword}
                  />
                  <TouchableOpacity
                    onPress={() => setShowOldPassword(!showOldPassword)}
                  >
                    <Ionicons
                      name={showOldPassword ? "eye-off-outline" : "eye-outline"}
                      size={20}
                      color="#5f7a66"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>New Password</Text>
                <View style={styles.inputWrapper}>
                  <MaterialCommunityIcons
                    name="lock-check-outline"
                    size={20}
                    color="#5f7a66"
                    style={styles.leftIcon}
                  />
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Enter new password"
                    placeholderTextColor="#8a8a8a"
                    secureTextEntry={!showNewPassword}
                    value={newPassword}
                    onChangeText={setNewPassword}
                  />
                  <TouchableOpacity
                    onPress={() => setShowNewPassword(!showNewPassword)}
                  >
                    <Ionicons
                      name={showNewPassword ? "eye-off-outline" : "eye-outline"}
                      size={20}
                      color="#5f7a66"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Confirm Password</Text>
                <View style={styles.inputWrapper}>
                  <MaterialCommunityIcons
                    name="shield-check-outline"
                    size={20}
                    color="#5f7a66"
                    style={styles.leftIcon}
                  />
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Confirm new password"
                    placeholderTextColor="#8a8a8a"
                    secureTextEntry={!showConfirmPassword}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                  />
                  <TouchableOpacity
                    onPress={() =>
                      setShowConfirmPassword(!showConfirmPassword)
                    }
                  >
                    <Ionicons
                      name={
                        showConfirmPassword
                          ? "eye-off-outline"
                          : "eye-outline"
                      }
                      size={20}
                      color="#5f7a66"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={styles.changeButton}
                activeOpacity={0.85}
                onPress={handleChangePassword}
                disabled={passwordLoading}
              >
                {passwordLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <MaterialCommunityIcons
                      name="lock-reset"
                      size={20}
                      color="#fff"
                    />
                    <Text style={styles.changeButtonText}>Change Password</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <Modal
          visible={showCategoryModal}
          transparent
          animationType="fade"
          onRequestClose={closeCategoryModal}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add Category</Text>
                <TouchableOpacity onPress={closeCategoryModal}>
                  <Ionicons name="close" size={22} color="#333" />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalSubtitle}>
                Create new scrap category with image
              </Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Category Name</Text>
                <View style={styles.inputWrapper}>
                  <MaterialCommunityIcons
                    name="shape-outline"
                    size={20}
                    color="#5f7a66"
                    style={styles.leftIcon}
                  />
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Enter category name"
                    placeholderTextColor="#8a8a8a"
                    value={categoryName}
                    onChangeText={setCategoryName}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Description</Text>
                <View style={styles.textAreaWrapper}>
                  <TextInput
                    style={styles.textArea}
                    placeholder="Enter category description"
                    placeholderTextColor="#8a8a8a"
                    multiline
                    textAlignVertical="top"
                    value={description}
                    onChangeText={setDescription}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Category Image</Text>
                <TouchableOpacity
                  style={styles.imagePickerButton}
                  activeOpacity={0.85}
                  onPress={pickCategoryImage}
                >
                  <MaterialCommunityIcons
                    name="image-plus"
                    size={20}
                    color="#2e7d32"
                  />
                  <Text style={styles.imagePickerText}>
                    {categoryImage ? "Change Image" : "Select Image"}
                  </Text>
                </TouchableOpacity>
              </View>

              {categoryImage?.uri && (
                <Image
                  source={{ uri: categoryImage.uri }}
                  style={styles.previewImage}
                />
              )}

              <TouchableOpacity
                style={styles.changeButton}
                activeOpacity={0.85}
                onPress={handleAddCategory}
                disabled={categoryLoading}
              >
                {categoryLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <MaterialCommunityIcons
                      name="check-circle-outline"
                      size={20}
                      color="#fff"
                    />
                    <Text style={styles.changeButtonText}>Add Category</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
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
  },
  scrollContainer: {
    padding: 18,
    paddingBottom: 30,
  },

  headerCard: {
    backgroundColor: "rgba(255,255,255,0.35)",
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.45)",
  },
  headerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  welcomeText: {
    fontSize: 17,
    color: "#335c3d",
    fontWeight: "500",
  },
  adminText: {
    fontSize: 32,
    fontWeight: "800",
    color: "#163020",
    marginTop: 2,
  },
  subText: {
    marginTop: 10,
    fontSize: 14,
    color: "#42634d",
    lineHeight: 21,
    width: "92%",
  },
  adminBadge: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },

  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: "#173321",
    marginBottom: 14,
  },

  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statsCard: {
    backgroundColor: "#fff",
    width: "31%",
    borderRadius: 22,
    paddingVertical: 18,
    paddingHorizontal: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    minHeight: 130,
    justifyContent: "center",
  },
  statsIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  statsCount: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1f1f1f",
  },
  statsLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 5,
    textAlign: "center",
  },

  actionGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  actionGridCard: {
    backgroundColor: "#fff",
    width: "48%",
    borderRadius: 22,
    padding: 18,
    minHeight: 160,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  transparentCard: {
    opacity: 0,
  },
  actionGridIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  actionGridTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1f1f1f",
    marginBottom: 8,
  },
  actionGridSub: {
    fontSize: 13,
    color: "#777",
    lineHeight: 19,
  },

  reportCard: {
    backgroundColor: "#fff",
    borderRadius: 22,
    padding: 16,
    marginBottom: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  reportLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  reportIconWrap: {
    width: 50,
    height: 50,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#222",
    marginBottom: 3,
  },
  reportSubtitle: {
    fontSize: 12,
    color: "#777",
    lineHeight: 18,
  },
  rightSide: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 12,
  },

  yellowBadge: {
    minWidth: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#FFF4D6",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 10,
    marginRight: 6,
  },
  yellowBadgeText: {
    color: "#c98900",
    fontSize: 14,
    fontWeight: "800",
  },

  redBadge: {
    minWidth: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#FDECEA",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 10,
    marginRight: 6,
  },
  redBadgeText: {
    color: "#c62828",
    fontSize: 14,
    fontWeight: "800",
  },

  accountCard: {
    backgroundColor: "#fff",
    borderRadius: 22,
    padding: 16,
    marginBottom: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  accountLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  accountIconWrap: {
    width: 50,
    height: 50,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  accountTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#222",
  },
  accountSubtitle: {
    fontSize: 12,
    color: "#777",
    marginTop: 3,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  modalCard: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 18,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#163020",
  },
  modalSubtitle: {
    marginTop: 6,
    marginBottom: 16,
    fontSize: 13,
    color: "#446152",
  },

  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    color: "#355442",
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fbf8",
    borderWidth: 1,
    borderColor: "#d8e8db",
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 54,
  },
  leftIcon: {
    marginRight: 10,
  },
  modalInput: {
    flex: 1,
    color: "#1f1f1f",
    fontSize: 15,
  },
  textAreaWrapper: {
    backgroundColor: "#f8fbf8",
    borderWidth: 1,
    borderColor: "#d8e8db",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 96,
  },
  textArea: {
    color: "#1f1f1f",
    fontSize: 15,
    minHeight: 70,
  },
  imagePickerButton: {
    height: 52,
    borderRadius: 16,
    backgroundColor: "#edf8ef",
    borderWidth: 1,
    borderColor: "#cfe7d3",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  imagePickerText: {
    marginLeft: 8,
    fontSize: 15,
    fontWeight: "700",
    color: "#2e7d32",
  },
  previewImage: {
    width: "100%",
    height: 170,
    borderRadius: 16,
    marginBottom: 16,
  },
  changeButton: {
    marginTop: 8,
    backgroundColor: "#2e7d32",
    height: 54,
    borderRadius: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  changeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
    marginLeft: 8,
  },
});