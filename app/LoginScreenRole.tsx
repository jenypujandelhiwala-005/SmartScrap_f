import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { postRequest } from "../Services/axiosServices";

export default function LoginRoleScreen() {
  const router = useRouter();

  const [selectedRole, setSelectedRole] = useState("Seller");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setLoading(true);

    let endpoint = "";
    if (selectedRole === "Seller") endpoint = "/seller/login";
    else if (selectedRole === "Collector") endpoint = "/Collector/Login";
    else endpoint = "/Admin/Login";

    const payload = { email, password };

    try {
      const response = await postRequest(endpoint, payload, false);
      console.log("LOGIN RESPONSE:", JSON.stringify(response, null, 2));

      if (response && response.Status === "OK") {
        Alert.alert("Success", `Welcome back, ${selectedRole}!`);

        if (selectedRole === "Seller") {
          const seller = response?.Data;

          if (!seller?.seller_id) {
            Alert.alert("Error", "seller_id not received from login response");
            return;
          }

          router.replace({
            pathname: "/seller",
            params: {
              seller_id: seller.seller_id || "",
              name: seller.name || "",
              email: seller.email || "",
              phone: seller.phone || "",
              address: seller.address || "",
              latitude: String(seller.latitude || ""),
              longitude: String(seller.longitude || ""),
            },
          });
        } else if (selectedRole === "Collector") {
          const collector = response?.Result?.collector;
          const needsSetup = response?.Result?.needs_setup;

          if (!collector?.collector_id) {
            Alert.alert("Error", "collector_id not received from login response");
            return;
          }

          if (needsSetup) {
            router.replace({
              pathname: "/collector_prices",
              params: {
                collector_id: collector.collector_id || "",
                name: collector.name || "",
                email: collector.email || "",
                phone: collector.phone || "",
                address: collector.address || "",
                area: collector.area || "",
                city: collector.city || "",
                latitude: String(collector.latitude || ""),
                longitude: String(collector.longitude || ""),
              },
            });
          } else {
            router.replace({
              pathname: "/collector",
              params: {
                collector_id: collector.collector_id || "",
                name: collector.name || "",
                email: collector.email || "",
                phone: collector.phone || "",
                address: collector.address || "",
                area: collector.area || "",
                city: collector.city || "",
                latitude: String(collector.latitude || ""),
                longitude: String(collector.longitude || ""),
              },
            });
          }
        } else {
          router.replace("/admin");
        }
      } else {
        const errorMsg =
          typeof response?.Result === "string"
            ? response.Result
            : "Login failed";

        Alert.alert("Login Error", errorMsg);
      }
    } catch (error: any) {
      console.log("LOGIN ERROR:", error?.response?.data || error);
      const catchMsg =
        error?.response?.data?.Result || error?.message || "Server Error";
      Alert.alert("Error", catchMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    if (!email) {
      Alert.alert(
        "Required",
        "Please enter your email address first to reset password."
      );
      return;
    }

    Alert.alert(
      "Reset Password",
      `Do you want to send a temporary password to ${email}?`,
      [
        {
          text: "No",
          onPress: () => console.log("Cancel Pressed"),
          style: "cancel",
        },
        {
          text: "Yes",
          onPress: () => executeForgotPassword(),
        },
      ]
    );
  };

  const executeForgotPassword = async () => {
    setLoading(true);

    let endpoint = "";
    if (selectedRole === "Seller") endpoint = "/seller/forgot-password";
    else if (selectedRole === "Collector") endpoint = "/Collector/ForgotPassword";
    else endpoint = "/Admin/ForgotPassword";

    try {
      const response = await postRequest(endpoint, { email }, false);

      if (response && response.Status === "OK") {
        Alert.alert(
          "Success",
          response?.Result || "A temporary password has been sent to your email."
        );
      } else {
        Alert.alert("Error", response?.Result || "Failed to reset password.");
      }
    } catch (error: any) {
      console.log("FORGOT PASSWORD ERROR:", error?.response?.data || error);
      const catchMsg =
        error?.response?.data?.Result || error?.message || "Server Error";
      Alert.alert("Error", catchMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.mainCard}>
        <Text style={styles.heading}>Login As</Text>

        <View style={styles.roleRow}>
          {["Seller", "Collector", "Admin"].map((role) => (
            <TouchableOpacity
              key={role}
              style={[
                styles.roleCard,
                selectedRole === role && styles.activeRoleCard,
              ]}
              onPress={() => setSelectedRole(role)}
            >
              <MaterialCommunityIcons
                name={
                  role === "Seller"
                    ? "cart-outline"
                    : role === "Collector"
                    ? "truck-outline"
                    : "shield-account-outline"
                }
                size={32}
                color={selectedRole === role ? "#ffffff" : "#4ea45c"}
              />
              <Text
                style={[
                  styles.roleText,
                  selectedRole === role && styles.activeRoleText,
                ]}
              >
                {role}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.formCard}>
          <Text style={styles.formTitle}>{selectedRole} Login</Text>

          <View style={styles.inputBox}>
            <MaterialCommunityIcons
              name="email-outline"
              size={22}
              color="#8b969c"
              style={styles.leftIcon}
            />
            <TextInput
              placeholder={`Enter ${selectedRole.toLowerCase()} email`}
              placeholderTextColor="#8a8f94"
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputBox}>
            <MaterialCommunityIcons
              name="lock-outline"
              size={22}
              color="#8b969c"
              style={styles.leftIcon}
            />
            <TextInput
              placeholder="Enter password"
              placeholderTextColor="#8a8f94"
              secureTextEntry={!isPasswordVisible}
              style={styles.input}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity
              onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            >
              <Ionicons
                name={isPasswordVisible ? "eye-off-outline" : "eye-outline"}
                size={22}
                color="#8b969c"
                style={styles.rightIcon}
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={handleForgotPassword}
            style={styles.forgotPasswordLink}
          >
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.loginButton}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginButtonText}>Login as {selectedRole}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push("/role")}
            style={styles.registerContainer}
          >
            <Text style={styles.registerText}>
              Don't have an account?{" "}
              <Text style={styles.registerLink}>Register</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#b8e9bc",
    justifyContent: "center",
    alignItems: "center",
  },
  mainCard: {
    width: "86%",
    backgroundColor: "#f7f7f7",
    borderRadius: 32,
    paddingTop: 34,
    paddingBottom: 34,
    paddingHorizontal: 18,
    shadowColor: "#76d08b",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 25,
    elevation: 18,
  },
  heading: {
    textAlign: "center",
    fontSize: 24,
    fontWeight: "700",
    color: "#2f3138",
    marginBottom: 24,
  },
  roleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  roleCard: {
    width: "31%",
    height: 92,
    backgroundColor: "#f7f9f7",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#b8e1be",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#7bc98d",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 4,
  },
  activeRoleCard: {
    backgroundColor: "#2f313b",
    borderColor: "#65c776",
    shadowColor: "#51b86a",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 10,
  },
  roleText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: "500",
    color: "#30323a",
  },
  activeRoleText: {
    color: "#ffffff",
  },
  formCard: {
    marginTop: 8,
    backgroundColor: "#f3f4f3",
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 22,
    shadowColor: "#bac7bc",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 7,
    elevation: 4,
  },
  formTitle: {
    textAlign: "center",
    fontSize: 22,
    fontWeight: "700",
    color: "#30323a",
    marginBottom: 18,
  },
  inputBox: {
    backgroundColor: "#e9eaeb",
    borderRadius: 12,
    minHeight: 42,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    marginBottom: 14,
  },
  leftIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#30323a",
  },
  rightIcon: {
    marginLeft: 8,
  },
  forgotPasswordLink: {
    alignSelf: "center",
    marginBottom: 15,
    marginTop: -5,
    marginRight: 5,
  },
  forgotPasswordText: {
    color: "#4ea45c",
    fontSize: 15,
    fontWeight: "700",
  },
  loginButton: {
    marginTop: 6,
    backgroundColor: "#2f313b",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  loginButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  registerContainer: {
    marginTop: 18,
    alignItems: "center",
  },
  registerText: {
    fontSize: 14,
    color: "#30323a",
  },
  registerLink: {
    color: "#4ea45c",
    fontWeight: "700",
  },
});