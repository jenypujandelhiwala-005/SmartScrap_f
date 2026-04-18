import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
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
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { BASE_URL } from "../Services/axiosServices";

export default function AddCategoryScreen() {
  const [categoryName, setCategoryName] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [listLoading, setListLoading] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const pickImage = async () => {
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
        setImage(result.assets[0]);
      }
    } catch (error) {
      console.log("pickImage error:", error);
      Alert.alert("Error", "Could not open gallery");
    }
  };

  const fetchCategories = async () => {
    try {
      setListLoading(true);

      const res = await fetch(`${BASE_URL}/Category`);
      const text = await res.text();
      console.log("Fetch categories raw response:", text);

      if (!res.ok) {
        Alert.alert("Error", `Server error: ${res.status}`);
        return;
      }

      if (text.startsWith("<")) {
        Alert.alert("Backend Error", "Received HTML instead of JSON");
        return;
      }

      const data = JSON.parse(text);

      if (data.Status === "OK") {
        setCategories(data.Result || []);
      } else {
        Alert.alert("Error", data.Result || "Failed to fetch categories");
      }
    } catch (err) {
      console.log("fetchCategories error:", err);
      Alert.alert("Error", "Could not fetch categories");
    } finally {
      setListLoading(false);
    }
  };

  const addCategory = async () => {
    if (!categoryName.trim() || !description.trim()) {
      Alert.alert("Validation", "Fill all fields");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("category_name", categoryName.trim());
      formData.append("description", description.trim());

      if (image?.uri) {
        const uriParts = image.uri.split(".");
        const fileType = uriParts[uriParts.length - 1]?.toLowerCase() || "jpg";

        formData.append("image", {
          uri: image.uri,
          name: `photo.${fileType}`,
          type: `image/${fileType === "jpg" ? "jpeg" : fileType}`,
        } as any);
      }

      const res = await fetch(`${BASE_URL}/Category`, {
        method: "POST",
        body: formData,
      });

      const text = await res.text();
      console.log("Add category raw response:", text);

      if (!res.ok) {
        Alert.alert("Error", `Server error: ${res.status}`);
        return;
      }

      if (text.startsWith("<")) {
        Alert.alert("Backend Error", "Received HTML instead of JSON");
        return;
      }

      const data = JSON.parse(text);

      if (data.Status === "OK") {
        Alert.alert("Success", data.Result || "Category added successfully");
        setCategoryName("");
        setDescription("");
        setImage(null);
        fetchCategories();
      } else {
        Alert.alert("Error", data.Result || "Failed to add category");
      }
    } catch (err) {
      console.log("addCategory error:", err);
      Alert.alert("Error", "Something went wrong while adding category");
    } finally {
      setLoading(false);
    }
  };

  const deactivate = async (id: string) => {
    try {
      const res = await fetch(`${BASE_URL}/Category/${id}`, {
        method: "DELETE",
      });

      const text = await res.text();
      console.log("Deactivate raw response:", text);

      if (!res.ok) {
        Alert.alert("Error", `Server error: ${res.status}`);
        return;
      }

      if (text.startsWith("<")) {
        Alert.alert("Backend Error", "Received HTML instead of JSON");
        return;
      }

      const data = JSON.parse(text);

      if (data.Status === "OK") {
        Alert.alert("Success", data.Result || "Category deactivated successfully");
        fetchCategories();
      } else {
        Alert.alert("Error", data.Result || "Failed to deactivate category");
      }
    } catch (error) {
      console.log("deactivate error:", error);
      Alert.alert("Error", "Could not deactivate category");
    }
  };

  const renderCategoryItem = ({ item }: { item: any }) => {
    const imageUrl = item.image ? `${BASE_URL}${item.image}` : null;

    return (
      <View style={styles.item}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.img} />
        ) : (
          <View style={styles.noImageBox}>
            <Ionicons name="image-outline" size={22} color="#888" />
          </View>
        )}

        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{item.category_name}</Text>
          <Text style={styles.descriptionText}>{item.description}</Text>
          <Text
            style={[
              styles.statusText,
              { color: item.is_active ? "#2e7d32" : "#c62828" },
            ]}
          >
            {item.is_active ? "Active" : "Inactive"}
          </Text>
        </View>

        {item.is_active && (
          <TouchableOpacity onPress={() => deactivate(item.categoryid)}>
            <Ionicons name="trash" size={22} color="red" />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderHeader = () => (
    <>
      <Text style={styles.title}>Manage Categories</Text>

      <View style={styles.card}>
        <Text style={styles.section}>Add Category</Text>

        <TextInput
          placeholder="Category Name"
          value={categoryName}
          onChangeText={setCategoryName}
          style={styles.input}
          placeholderTextColor="#888"
        />

        <TextInput
          placeholder="Description"
          value={description}
          onChangeText={setDescription}
          style={[styles.input, styles.textArea]}
          multiline
          textAlignVertical="top"
          placeholderTextColor="#888"
        />

        <TouchableOpacity style={styles.pickBtn} onPress={pickImage}>
          <MaterialIcons name="image" size={20} color="#2f6db2" />
          <Text style={styles.pickBtnText}>
            {image ? "Change Image" : "Select Image"}
          </Text>
        </TouchableOpacity>

        {image?.uri && <Image source={{ uri: image.uri }} style={styles.preview} />}

        <TouchableOpacity style={styles.addBtn} onPress={addCategory}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.addBtnText}>Add Category</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.section}>All Categories</Text>
      </View>
    </>
  );

  return (
    <LinearGradient
      colors={["#dff5e4", "#a8e0b2", "#8bd39c"]}
      style={styles.container}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <FlatList
          data={categories}
          keyExtractor={(item) => item.categoryid?.toString()}
          renderItem={renderCategoryItem}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            listLoading ? (
              <ActivityIndicator style={{ marginTop: 20 }} color="#2f6db2" />
            ) : (
              <Text style={styles.emptyText}>No categories found</Text>
            )
          }
        />
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  listContainer: {
    padding: 16,
    paddingBottom: 30,
  },

  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#173321",
  },

  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 15,
    marginBottom: 15,
  },

  section: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#1f1f1f",
  },

  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    color: "#222",
    backgroundColor: "#fff",
  },

  textArea: {
    height: 80,
  },

  pickBtn: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },

  pickBtnText: {
    marginLeft: 6,
    color: "#2f6db2",
    fontWeight: "600",
  },

  preview: {
    width: "100%",
    height: 150,
    borderRadius: 10,
    marginBottom: 10,
  },

  addBtn: {
    backgroundColor: "#2f6db2",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },

  addBtnText: {
    color: "#fff",
    fontWeight: "700",
  },

  item: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 12,
  },

  img: {
    width: 60,
    height: 60,
    borderRadius: 10,
    marginRight: 10,
  },

  noImageBox: {
    width: 60,
    height: 60,
    borderRadius: 10,
    marginRight: 10,
    backgroundColor: "#eee",
    alignItems: "center",
    justifyContent: "center",
  },

  name: {
    fontWeight: "bold",
    color: "#1f1f1f",
  },

  descriptionText: {
    color: "#666",
    marginTop: 2,
  },

  statusText: {
    marginTop: 4,
    fontWeight: "600",
  },

  emptyText: {
    textAlign: "center",
    marginTop: 20,
    color: "#666",
  },
});