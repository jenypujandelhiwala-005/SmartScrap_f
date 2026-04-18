import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
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
import { BASE_URL } from "../Services/axiosServices";

export default function ManageScrapPriceScreen() {
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [subCategoryName, setSubCategoryName] = useState("");
  const [pricePerKg, setPricePerKg] = useState("");
  const [subCategoryImage, setSubCategoryImage] = useState<any>(null);

  const [scrapPrices, setScrapPrices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [editSubCategoryName, setEditSubCategoryName] = useState("");
  const [editPricePerKg, setEditPricePerKg] = useState("");
  const [editImage, setEditImage] = useState<any>(null);
  const [editLoading, setEditLoading] = useState(false);

  useEffect(() => {
    loadPageData();
  }, []);

  const parseJsonResponse = async (res: Response) => {
    const text = await res.text();
    console.log("RAW RESPONSE:", text);

    if (!res.ok) {
      throw new Error(`Server error: ${res.status}`);
    }

    if (text.startsWith("<")) {
      throw new Error("Server returned HTML instead of JSON");
    }

    return JSON.parse(text);
  };

  const loadPageData = async () => {
    try {
      setPageLoading(true);
      await Promise.all([fetchCategories(), fetchScrapPrices()]);
    } finally {
      setPageLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${BASE_URL}/Category`);
      const data = await parseJsonResponse(res);

      if (data.Status === "OK") {
        const activeCategories = (data.Result || []).filter(
          (item: any) => item.is_active
        );
        setCategories(activeCategories);
      } else {
        Alert.alert("Error", data.Result || "Failed to load categories");
      }
    } catch (error: any) {
      console.log("fetchCategories error:", error);
      Alert.alert("Error", error.message || "Could not load categories");
    }
  };

  const fetchScrapPrices = async () => {
    try {
      const res = await fetch(`${BASE_URL}/ScrapPrice`);
      const data = await parseJsonResponse(res);

      if (data.Status === "OK") {
        setScrapPrices(data.Result || []);
      } else {
        Alert.alert("Error", data.Result || "Failed to load scrap prices");
      }
    } catch (error: any) {
      console.log("fetchScrapPrices error:", error);
      Alert.alert("Error", error.message || "Could not load scrap prices");
    }
  };

  const pickSubCategoryImage = async (forEdit = false) => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert("Permission required", "Please allow gallery access");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        if (forEdit) {
          setEditImage(result.assets[0]);
        } else {
          setSubCategoryImage(result.assets[0]);
        }
      }
    } catch (error) {
      console.log("pickSubCategoryImage error:", error);
      Alert.alert("Error", "Could not open gallery");
    }
  };

  const addScrapPrice = async () => {
    if (!selectedCategory) {
      Alert.alert("Validation", "Please select a category");
      return;
    }

    if (!subCategoryName.trim() || !pricePerKg.trim()) {
      Alert.alert("Validation", "Please fill all fields");
      return;
    }

    if (isNaN(Number(pricePerKg))) {
      Alert.alert("Validation", "Enter valid price per kg");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("category_id", selectedCategory.categoryid);
      formData.append("sub_category_name", subCategoryName.trim());
      formData.append("price_per_kg", pricePerKg);

      if (subCategoryImage?.uri) {
        const uriParts = subCategoryImage.uri.split(".");
        const fileType = uriParts[uriParts.length - 1]?.toLowerCase() || "jpg";

        formData.append("sub_category_image", {
          uri: subCategoryImage.uri,
          name: `subcategory.${fileType}`,
          type: `image/${fileType === "jpg" ? "jpeg" : fileType}`,
        } as any);
      }

      const res = await fetch(`${BASE_URL}/ScrapPrice`, {
        method: "POST",
        body: formData,
      });

      const data = await parseJsonResponse(res);

      if (data.Status === "OK") {
        Alert.alert("Success", data.Result || "Added successfully");
        setSelectedCategory(null);
        setSubCategoryName("");
        setPricePerKg("");
        setSubCategoryImage(null);
        fetchScrapPrices();
      } else {
        Alert.alert("Error", data.Result || "Failed to add");
      }
    } catch (error: any) {
      console.log("addScrapPrice error:", error);
      Alert.alert("Error", error.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (item: any) => {
    setEditItem(item);
    setEditSubCategoryName(item.sub_category_name || "");
    setEditPricePerKg(String(item.price_per_kg || ""));
    setEditImage(null);
    setShowEditModal(true);
  };

  const updateScrapPrice = async () => {
    if (!editItem) return;

    if (!editSubCategoryName.trim() || !editPricePerKg.trim()) {
      Alert.alert("Validation", "Please fill all fields");
      return;
    }

    if (isNaN(Number(editPricePerKg))) {
      Alert.alert("Validation", "Enter valid price per kg");
      return;
    }

    try {
      setEditLoading(true);

      const formData = new FormData();
      formData.append("sub_category_name", editSubCategoryName.trim());
      formData.append("price_per_kg", editPricePerKg);
      formData.append("category_id", editItem.category_id);

      if (editImage?.uri) {
        const uriParts = editImage.uri.split(".");
        const fileType = uriParts[uriParts.length - 1]?.toLowerCase() || "jpg";

        formData.append("sub_category_image", {
          uri: editImage.uri,
          name: `subcategory.${fileType}`,
          type: `image/${fileType === "jpg" ? "jpeg" : fileType}`,
        } as any);
      }

      const res = await fetch(`${BASE_URL}/ScrapPrice/${editItem.price_id}`, {
        method: "PUT",
        body: formData,
      });

      const data = await parseJsonResponse(res);

      if (data.Status === "OK") {
        Alert.alert("Success", data.Result || "Updated successfully");
        setShowEditModal(false);
        setEditItem(null);
        setEditImage(null);
        fetchScrapPrices();
      } else {
        Alert.alert("Error", data.Result || "Failed to update");
      }
    } catch (error: any) {
      console.log("updateScrapPrice error:", error);
      Alert.alert("Error", error.message || "Something went wrong");
    } finally {
      setEditLoading(false);
    }
  };

  const renderCategoryCard = ({ item }: { item: any }) => {
    const isSelected = selectedCategory?.categoryid === item.categoryid;
    const imageUrl = item.image ? `${BASE_URL}${item.image}` : null;

    return (
      <TouchableOpacity
        style={[styles.categoryCard, isSelected && styles.selectedCategoryCard]}
        activeOpacity={0.85}
        onPress={() => setSelectedCategory(item)}
      >
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.categoryImage} />
        ) : (
          <View style={styles.noImageBox}>
            <Ionicons name="image-outline" size={24} color="#7a7a7a" />
          </View>
        )}

        <Text style={styles.categoryTitle} numberOfLines={1}>
          {item.category_name}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderScrapPriceItem = ({ item }: { item: any }) => {
    const subImg = item.sub_category_image
      ? `${BASE_URL}${item.sub_category_image}`
      : null;

    return (
      <View style={styles.priceCard}>
        <View style={styles.priceTopRow}>
          {subImg ? (
            <Image source={{ uri: subImg }} style={styles.subImage} />
          ) : (
            <View style={styles.subNoImage}>
              <Ionicons name="image-outline" size={22} color="#888" />
            </View>
          )}

          <View style={{ flex: 1 }}>
            <Text style={styles.priceCategoryName}>{item.category_name}</Text>
            <Text style={styles.subCategoryName}>{item.sub_category_name}</Text>
            <Text style={styles.priceText}>₹ {item.price_per_kg} / kg</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.editButton}
          onPress={() => openEditModal(item)}
        >
          <MaterialCommunityIcons
            name="pencil-outline"
            size={18}
            color="#1565c0"
          />
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (pageLoading) {
    return (
      <LinearGradient
        colors={["#dff5e4", "#a8e0b2", "#8bd39c"]}
        style={styles.container}
      >
        <SafeAreaView style={styles.centerWrap}>
          <ActivityIndicator size="large" color="#2f6db2" />
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={["#dff5e4", "#a8e0b2", "#8bd39c"]}
      style={styles.container}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerCard}>
            <Text style={styles.title}>Manage Scrap Price</Text>
            <Text style={styles.subtitle}>
              Select category, add sub-category image, and set price per kg
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Select Category</Text>

            <FlatList
              data={categories}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.categoryid?.toString()}
              renderItem={renderCategoryCard}
              contentContainerStyle={{ paddingVertical: 4 }}
            />

            {selectedCategory && (
              <Text style={styles.selectedText}>
                Selected: {selectedCategory.category_name}
              </Text>
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Add Sub Category Price</Text>

            <TextInput
              placeholder="Sub category name"
              placeholderTextColor="#888"
              value={subCategoryName}
              onChangeText={setSubCategoryName}
              style={styles.input}
            />

            <TextInput
              placeholder="Price per kg"
              placeholderTextColor="#888"
              keyboardType="numeric"
              value={pricePerKg}
              onChangeText={setPricePerKg}
              style={styles.input}
            />

            <TouchableOpacity
              style={styles.imagePickerButton}
              onPress={() => pickSubCategoryImage(false)}
            >
              <MaterialCommunityIcons
                name="image-plus"
                size={20}
                color="#2e7d32"
              />
              <Text style={styles.imagePickerText}>
                {subCategoryImage
                  ? "Change Sub Category Image"
                  : "Select Sub Category Image"}
              </Text>
            </TouchableOpacity>

            {subCategoryImage?.uri && (
              <Image
                source={{ uri: subCategoryImage.uri }}
                style={styles.previewImage}
              />
            )}

            <TouchableOpacity
              style={styles.addButton}
              onPress={addScrapPrice}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.addButtonText}>Save Scrap Price</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>All Scrap Prices</Text>

            <FlatList
              data={scrapPrices}
              keyExtractor={(item) => item.price_id?.toString()}
              renderItem={renderScrapPriceItem}
              scrollEnabled={false}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No scrap prices found</Text>
              }
            />
          </View>
        </ScrollView>

        <Modal
          visible={showEditModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowEditModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Edit Scrap Price</Text>
                <TouchableOpacity onPress={() => setShowEditModal(false)}>
                  <Ionicons name="close" size={22} color="#333" />
                </TouchableOpacity>
              </View>

              <TextInput
                placeholder="Sub category name"
                placeholderTextColor="#888"
                value={editSubCategoryName}
                onChangeText={setEditSubCategoryName}
                style={styles.input}
              />

              <TextInput
                placeholder="Price per kg"
                placeholderTextColor="#888"
                keyboardType="numeric"
                value={editPricePerKg}
                onChangeText={setEditPricePerKg}
                style={styles.input}
              />

              <TouchableOpacity
                style={styles.imagePickerButton}
                onPress={() => pickSubCategoryImage(true)}
              >
                <MaterialCommunityIcons
                  name="image-edit-outline"
                  size={20}
                  color="#2e7d32"
                />
                <Text style={styles.imagePickerText}>
                  {editImage ? "Change Image" : "Update Sub Category Image"}
                </Text>
              </TouchableOpacity>

              {editImage?.uri && (
                <Image
                  source={{ uri: editImage.uri }}
                  style={styles.previewImage}
                />
              )}

              <TouchableOpacity
                style={styles.addButton}
                onPress={updateScrapPrice}
                disabled={editLoading}
              >
                {editLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.addButtonText}>Update Price</Text>
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
  container: { flex: 1 },
  centerWrap: { flex: 1, justifyContent: "center", alignItems: "center" },
  scrollContent: { padding: 16, paddingBottom: 30 },

  headerCard: {
    backgroundColor: "rgba(255,255,255,0.35)",
    borderRadius: 22,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.45)",
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#173321",
  },
  subtitle: {
    marginTop: 6,
    fontSize: 13,
    color: "#42634d",
    lineHeight: 19,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1f1f1f",
    marginBottom: 12,
  },

  categoryCard: {
    width: 110,
    marginRight: 12,
    borderRadius: 14,
    backgroundColor: "#f8f8f8",
    padding: 10,
    borderWidth: 1.5,
    borderColor: "#e0e0e0",
    alignItems: "center",
  },
  selectedCategoryCard: {
    borderColor: "#2e7d32",
    backgroundColor: "#edf8ef",
  },
  categoryImage: {
    width: 72,
    height: 72,
    borderRadius: 12,
    resizeMode: "cover",
  },
  noImageBox: {
    width: 72,
    height: 72,
    borderRadius: 12,
    backgroundColor: "#ececec",
    alignItems: "center",
    justifyContent: "center",
  },
  categoryTitle: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: "600",
    color: "#222",
    textAlign: "center",
  },
  selectedText: {
    marginTop: 10,
    color: "#2e7d32",
    fontWeight: "700",
  },

  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 12,
    color: "#222",
    backgroundColor: "#fff",
  },

  imagePickerButton: {
    height: 50,
    borderRadius: 12,
    backgroundColor: "#edf8ef",
    borderWidth: 1,
    borderColor: "#cfe7d3",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  imagePickerText: {
    marginLeft: 8,
    color: "#2e7d32",
    fontWeight: "700",
  },

  previewImage: {
    width: 110,
    height: 110,
    borderRadius: 14,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 12,
  },

  addButton: {
    marginTop: 8,
    height: 52,
    backgroundColor: "#2f6db2",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 15,
  },

  priceCard: {
    borderWidth: 1,
    borderColor: "#ececec",
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    backgroundColor: "#fafafa",
  },
  priceTopRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  subImage: {
    width: 64,
    height: 64,
    borderRadius: 12,
    marginRight: 12,
  },
  subNoImage: {
    width: 64,
    height: 64,
    borderRadius: 12,
    marginRight: 12,
    backgroundColor: "#ececec",
    justifyContent: "center",
    alignItems: "center",
  },
  priceCategoryName: {
    fontSize: 12,
    color: "#2f6db2",
    fontWeight: "700",
  },
  subCategoryName: {
    fontSize: 16,
    fontWeight: "800",
    color: "#222",
    marginTop: 2,
  },
  priceText: {
    marginTop: 4,
    fontSize: 14,
    color: "#2e7d32",
    fontWeight: "700",
  },

  editButton: {
    marginTop: 12,
    alignSelf: "flex-end",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#eef4ff",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  editButtonText: {
    marginLeft: 6,
    color: "#1565c0",
    fontWeight: "700",
  },

  emptyText: {
    textAlign: "center",
    color: "#666",
    marginTop: 10,
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
    borderRadius: 22,
    padding: 18,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: "#173321",
  },
});