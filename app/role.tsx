import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { router } from "expo-router";
import { useFormik } from "formik";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import * as Yup from "yup";
import { postRequest } from "./../Services/axiosServices";

const RegisterSchema = Yup.object().shape({
  name: Yup.string().min(2, "Name is too short").required("Full name is required"),
  email: Yup.string().email("Invalid email").required("Email is required"),
  mobile: Yup.string()
    .matches(/^[0-9]{10}$/, "Mobile must be exactly 10 digits")
    .required("Mobile number is required"),
  password: Yup.string()
    .min(6, "Password must be at least 6 characters")
    .required("Password is required"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("password")], "Passwords must match")
    .required("Please confirm your password"),
  address: Yup.string().required("Address is required"),
});

export default function Register() {
  const [role, setRole] = useState("Seller");
  const [showMap, setShowMap] = useState(false);
  const [loadingAddr, setLoadingAddr] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [region, setRegion] = useState({
    latitude: 19.0728,
    longitude: 72.8826,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

  const [selectedLatitude, setSelectedLatitude] = useState<number>(19.0728);
  const [selectedLongitude, setSelectedLongitude] = useState<number>(72.8826);

  const formik = useFormik({
    initialValues: {
      name: "",
      email: "",
      mobile: "",
      password: "",
      confirmPassword: "",
      address: "",
      area: "",
      city: "",
    },
    validationSchema: RegisterSchema,
    onSubmit: async (values) => {
      if (!selectedLatitude || !selectedLongitude) {
        Alert.alert("Location Required", "Please select your location from map.");
        return;
      }

      setIsSubmitting(true);

      const endpoint = role === "Seller" ? "/seller/register" : "/Collector";

      const payload =
        role === "Seller"
          ? {
              name: values.name,
              email: values.email,
              phone: values.mobile,
              address: values.address,
              latitude: selectedLatitude,
              longitude: selectedLongitude,
              password: values.password,
            }
          : {
              name: values.name,
              email: values.email,
              phone: values.mobile,
              password: values.password,
              address: values.address,
              latitude: selectedLatitude,
              longitude: selectedLongitude,
              area: values.area || "",
              city: values.city || "",
            };

      try {
        const response = await postRequest(endpoint, payload, false);
        console.log("REGISTER RESPONSE:", JSON.stringify(response, null, 2));

        if (response && response.Status === "OK") {
          Alert.alert(
            "Success",
            response?.Result || `${role} registered successfully`,
            [
              {
                text: "OK",
                onPress: () => {
                  router.replace({
                    pathname: "/LoginScreenRole",
                    params: {
                      role,
                      email: values.email,
                      latitude: String(selectedLatitude),
                      longitude: String(selectedLongitude),
                      address: values.address,
                      area: values.area || "",
                      city: values.city || "",
                    },
                  });
                },
              },
            ]
          );
        } else {
          Alert.alert("Error", response?.Result || "Registration failed");
        }
      } catch (error: any) {
        console.log("REGISTER ERROR:", error?.response?.data || error);
        Alert.alert(
          "Network Error",
          error?.response?.data?.Result ||
            error?.message ||
            "Connection failed. Check your API server."
        );
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  const handleOpenMap = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        Alert.alert("Permission Denied", "Location permission is required.");
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const currentLatitude = location.coords.latitude;
      const currentLongitude = location.coords.longitude;
      
      setRegion({
        latitude: currentLatitude,
        longitude: currentLongitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });

      setSelectedLatitude(currentLatitude);
      setSelectedLongitude(currentLongitude);

      setShowMap(true);
    } catch (error) {
      Alert.alert("Error", "Unable to get current location.");
    }
  };

  const confirmLocation = async () => {
    setLoadingAddr(true);
    try {
      setSelectedLatitude(region.latitude);
      setSelectedLongitude(region.longitude);

      const response = await Location.reverseGeocodeAsync({
        latitude: region.latitude,
        longitude: region.longitude,
      });

      if (response.length > 0) {
        const item = response[0];

        const formattedAddress = [
          item.name || item.street || "",
          item.district || "",
          item.city || "",
          item.region || "",
        ]
          .filter(Boolean)
          .join(", ");

        formik.setFieldValue("address", formattedAddress);

        if (item.city) {
          formik.setFieldValue("city", item.city);
        }

        if (item.district) {
          formik.setFieldValue("area", item.district);
        } else if (item.subregion) {
          formik.setFieldValue("area", item.subregion);
        }
      }

      setShowMap(false);
    } catch (e) {
      Alert.alert("Error", "Could not fetch address.");
    } finally {
      setLoadingAddr(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <Modal visible={showMap} animationType="slide">
        <View style={{ flex: 1 }}>
          <MapView
            style={{ flex: 1 }}
            region={region}
            onRegionChangeComplete={(newRegion) => {
              setRegion(newRegion);
            }}
          >
            <Marker
              coordinate={{
                latitude: region.latitude,
                longitude: region.longitude,
              }}
              pinColor="#2E7D32"
            />
          </MapView>

          <View style={styles.mapOverlay}>
            <Text style={styles.mapTip}>Center the pin on your location</Text>

            <Text style={styles.latLngText}>
              Lat: {region.latitude.toFixed(6)} | Lng: {region.longitude.toFixed(6)}
            </Text>

            <TouchableOpacity
              style={styles.confirmBtn}
              onPress={confirmLocation}
              disabled={loadingAddr}
            >
              {loadingAddr ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.confirmBtnText}>Confirm Location</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setShowMap(false)}
            >
              <Text style={styles.cancelBtnText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={24} color="#1B5E20" />
            </TouchableOpacity>

            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Fill in details to join the community</Text>
          </View>

          <View style={styles.segmentedControl}>
            <TouchableOpacity
              style={[styles.segment, role === "Seller" && styles.activeSegment]}
              onPress={() => setRole("Seller")}
            >
              <Text
                style={[
                  styles.segmentText,
                  role === "Seller" && styles.activeSegmentText,
                ]}
              >
                Seller
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.segment, role === "Collector" && styles.activeSegment]}
              onPress={() => setRole("Collector")}
            >
              <Text
                style={[
                  styles.segmentText,
                  role === "Collector" && styles.activeSegmentText,
                ]}
              >
                Collector
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.form}>
            <View style={styles.inputWrapper}>
              <View
                style={[
                  styles.inputContainer,
                  formik.errors.name && formik.touched.name && styles.inputError,
                ]}
              >
                <Ionicons name="person-outline" size={20} color="#666" style={styles.icon} />
                <TextInput
                  placeholder="Full Name"
                  value={formik.values.name}
                  onChangeText={formik.handleChange("name")}
                  onBlur={formik.handleBlur("name")}
                  style={styles.input}
                />
              </View>
              {formik.errors.name && formik.touched.name && (
                <Text style={styles.errorText}>{formik.errors.name}</Text>
              )}
            </View>

            <View style={styles.inputWrapper}>
              <View
                style={[
                  styles.inputContainer,
                  formik.errors.email && formik.touched.email && styles.inputError,
                ]}
              >
                <Ionicons name="mail-outline" size={20} color="#666" style={styles.icon} />
                <TextInput
                  placeholder="Email"
                  value={formik.values.email}
                  onChangeText={formik.handleChange("email")}
                  onBlur={formik.handleBlur("email")}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={styles.input}
                />
              </View>
              {formik.errors.email && formik.touched.email && (
                <Text style={styles.errorText}>{formik.errors.email}</Text>
              )}
            </View>

            <View style={styles.inputWrapper}>
              <View
                style={[
                  styles.inputContainer,
                  formik.errors.mobile && formik.touched.mobile && styles.inputError,
                ]}
              >
                <Ionicons name="call-outline" size={20} color="#666" style={styles.icon} />
                <TextInput
                  placeholder="Mobile"
                  value={formik.values.mobile}
                  onChangeText={formik.handleChange("mobile")}
                  onBlur={formik.handleBlur("mobile")}
                  keyboardType="phone-pad"
                  style={styles.input}
                />
              </View>
              {formik.errors.mobile && formik.touched.mobile && (
                <Text style={styles.errorText}>{formik.errors.mobile}</Text>
              )}
            </View>

            <View style={styles.inputWrapper}>
              <View
                style={[
                  styles.inputContainer,
                  formik.errors.password && formik.touched.password && styles.inputError,
                ]}
              >
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color="#666"
                  style={styles.icon}
                />
                <TextInput
                  placeholder="Password"
                  value={formik.values.password}
                  onChangeText={formik.handleChange("password")}
                  onBlur={formik.handleBlur("password")}
                  secureTextEntry
                  style={styles.input}
                />
              </View>
              {formik.errors.password && formik.touched.password && (
                <Text style={styles.errorText}>{formik.errors.password}</Text>
              )}
            </View>

            <View style={styles.inputWrapper}>
              <View
                style={[
                  styles.inputContainer,
                  formik.errors.confirmPassword &&
                    formik.touched.confirmPassword &&
                    styles.inputError,
                ]}
              >
                <Ionicons
                  name="shield-checkmark-outline"
                  size={20}
                  color="#666"
                  style={styles.icon}
                />
                <TextInput
                  placeholder="Confirm Password"
                  value={formik.values.confirmPassword}
                  onChangeText={formik.handleChange("confirmPassword")}
                  onBlur={formik.handleBlur("confirmPassword")}
                  secureTextEntry
                  style={styles.input}
                />
              </View>
              {formik.errors.confirmPassword && formik.touched.confirmPassword && (
                <Text style={styles.errorText}>{formik.errors.confirmPassword}</Text>
              )}
            </View>

            <View style={styles.inputWrapper}>
              <View
                style={[
                  styles.inputContainer,
                  formik.errors.address && formik.touched.address && styles.inputError,
                  { height: "auto", minHeight: 60 },
                ]}
              >
                <Ionicons name="location-outline" size={20} color="#666" style={styles.icon} />
                <TextInput
                  placeholder="Address"
                  value={formik.values.address}
                  onChangeText={formik.handleChange("address")}
                  onBlur={formik.handleBlur("address")}
                  style={[styles.input, { paddingVertical: 12 }]}
                  multiline
                />
                <TouchableOpacity onPress={handleOpenMap} style={styles.mapTrigger}>
                  <Ionicons name="map" size={22} color="#2E7D32" />
                </TouchableOpacity>
              </View>
              {formik.errors.address && formik.touched.address && (
                <Text style={styles.errorText}>{formik.errors.address}</Text>
              )}

              <Text style={styles.locationPreview}>
                Selected Lat: {selectedLatitude.toFixed(6)} | Lng: {selectedLongitude.toFixed(6)}
              </Text>
            </View>

            {role === "Collector" && (
              <>
                <View style={styles.inputWrapper}>
                  <View style={styles.inputContainer}>
                    <Ionicons
                      name="business-outline"
                      size={20}
                      color="#666"
                      style={styles.icon}
                    />
                    <TextInput
                      placeholder="Area"
                      value={formik.values.area}
                      onChangeText={formik.handleChange("area")}
                      style={styles.input}
                    />
                  </View>
                </View>

                <View style={styles.inputWrapper}>
                  <View style={styles.inputContainer}>
                    <Ionicons
                      name="location-outline"
                      size={20}
                      color="#666"
                      style={styles.icon}
                    />
                    <TextInput
                      placeholder="City"
                      value={formik.values.city}
                      onChangeText={formik.handleChange("city")}
                      style={styles.input}
                    />
                  </View>
                </View>
              </>
            )}

            <TouchableOpacity
              style={styles.mainButton}
              onPress={() => formik.handleSubmit()}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.mainButtonText}>Register as {role}</Text>
                  <Ionicons name="arrow-forward" size={20} color="#fff" />
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.footerLink}
              onPress={() => router.push("/LoginScreenRole")}
            >
              <Text style={styles.footerText}>
                Already have an account? <Text style={styles.link}>Login</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FBF9" },
  scrollContent: { paddingBottom: 40 },
  header: { paddingHorizontal: 24, paddingTop: 20, marginBottom: 25 },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  title: { fontSize: 28, fontWeight: "800", color: "#1B5E20" },
  subtitle: { fontSize: 15, color: "#666", marginTop: 4 },
  segmentedControl: {
    flexDirection: "row",
    backgroundColor: "#E0EADD",
    marginHorizontal: 24,
    borderRadius: 16,
    padding: 6,
    marginBottom: 25,
  },
  segment: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 12,
  },
  activeSegment: { backgroundColor: "#fff", elevation: 2 },
  segmentText: { fontSize: 15, fontWeight: "600", color: "#777" },
  activeSegmentText: { color: "#2E7D32" },
  form: { paddingHorizontal: 24 },
  inputWrapper: { marginBottom: 18 },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    paddingHorizontal: 16,
    height: 60,
  },
  input: { flex: 1, fontSize: 16, color: "#333", fontWeight: "500" },
  icon: { marginRight: 12 },
  mapTrigger: { marginLeft: 10, padding: 5 },
  inputError: { borderColor: "#FF5252" },
  errorText: {
    color: "#FF5252",
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
    fontWeight: "600",
  },
  locationPreview: {
    marginTop: 8,
    marginLeft: 4,
    color: "#2E7D32",
    fontSize: 12,
    fontWeight: "600",
  },
  latLngText: {
    fontSize: 13,
    color: "#2E7D32",
    marginBottom: 14,
    fontWeight: "600",
  },
  mainButton: {
    backgroundColor: "#2E7D32",
    flexDirection: "row",
    height: 60,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    gap: 10,
    elevation: 4,
    shadowColor: "#2E7D32",
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  mainButtonText: { color: "#fff", fontSize: 18, fontWeight: "700" },
  footerLink: { marginTop: 20, alignItems: "center" },
  footerText: { fontSize: 14, color: "#666" },
  link: { color: "#2E7D32", fontWeight: "700" },
  mapOverlay: {
    position: "absolute",
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 10,
  },
  mapTip: {
    fontSize: 14,
    color: "#666",
    marginBottom: 15,
    textAlign: "center",
  },
  confirmBtn: {
    backgroundColor: "#2E7D32",
    width: "100%",
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  confirmBtnText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  cancelBtn: { marginTop: 12 },
  cancelBtnText: { color: "#888", fontWeight: "600" },
});