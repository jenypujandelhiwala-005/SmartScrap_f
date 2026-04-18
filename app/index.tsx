import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function HomeScreen() {
  return (
    <LinearGradient
      colors={["#dff5e4", "#a8e0b2", "#8bd39c"]}
      style={styles.container}
    >
      <View style={styles.card}>

        <Image
          source={require("../assets/images/logo.png")}
          style={styles.logo}
        />

        <Text style={styles.title}>ScrapSmart</Text>
        <Text style={styles.subtitle}>Turn Scrap into Cash</Text>

        <Text style={styles.welcome}>Welcome</Text>

        <TouchableOpacity
          style={styles.loginBtn}
          onPress={() => router.push("/LoginScreenRole")}
        >
          <Text style={styles.loginText}>Login</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.registerBtn}
          onPress={() => router.push("/role")}
        >
          <Text style={styles.registerText}>Register</Text>
        </TouchableOpacity>

      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  card: {
    width: "85%",
    backgroundColor: "#ffffff",
    padding: 30,
    borderRadius: 25,
    alignItems: "center",
    elevation: 10,
  },

  logo: {
    width: 150,
    height: 120,
    backgroundColor: "#ffffff",
    resizeMode: "contain",
    marginBottom: 10,
  },

  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#222",
  },

  subtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 25,
  },

  welcome: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 20,
    color: "#333",
  },

  loginBtn: {
    width: "100%",
    backgroundColor: "#2f2f35",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 12,
  },

  loginText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },

  registerBtn: {
    width: "100%",
    backgroundColor: "#cfd2d6",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },

  registerText: {
    color: "#333",
    fontSize: 16,
    fontWeight: "600",
  },
});