import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { BASE_URL } from '../Services/axiosServices';

interface PriceItem {
  category_id?: string;
  categoryid?: string;
  sub_category_id?: string;
  subcategory_id?: string;
  subcategoryid?: string;
  category_name: string;
  sub_category_name: string;
  collector_price_per_kg: number;
  admin_price: number;
}

const CollectorDetails = () => {
  const params = useLocalSearchParams<{
    name?: string;
    address?: string;
    collector_id?: string;
    seller_id?: string;
  }>();

  const collectorName = typeof params.name === 'string' ? params.name : '';
  const collectorAddress =
    typeof params.address === 'string' ? params.address : '';
  const collectorId =
    typeof params.collector_id === 'string' ? params.collector_id : '';
  const sellerId = typeof params.seller_id === 'string' ? params.seller_id : '';

  const router = useRouter();

  const [prices, setPrices] = useState<PriceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantities, setQuantities] = useState<{ [key: number]: string }>({});
  const [modalVisible, setModalVisible] = useState(false);
  const [sellerName, setSellerName] = useState('');
  const [sellerAddress, setSellerAddress] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedTime, setSelectedTime] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const getCleanUrl = (path: string) => {
    const base = BASE_URL.endsWith('/') ? BASE_URL.slice(0, -1) : BASE_URL;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${base}${cleanPath}`;
  };

  const fetchSellerInfo = async () => {
    try {
      if (!sellerId) return;

      const res = await fetch(getCleanUrl('seller/get-profile'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          seller_id: sellerId,
        }),
      });

      const data = await res.json();

      if (data.Status === 'OK') {
        setSellerName(data.Data?.name || '');
        setSellerAddress(data.Data?.address || '');
      }
    } catch (err) {
      console.log('Error fetching seller info:', err);
    }
  };

  const fetchPrices = async () => {
    try {
      if (!collectorId) {
        setPrices([]);
        return;
      }

      const res = await fetch(getCleanUrl(`Collector/prices/${collectorId}`));
      const data = await res.json();

      console.log('PRICE RESPONSE:', data);

      if (data.Status === 'OK') {
        setPrices(data.Result || []);
      } else {
        setPrices([]);
      }
    } catch (err) {
      console.log('Error fetching prices:', err);
      setPrices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSellerInfo();
    fetchPrices();
  }, []);

  const calculateTotal = () => {
    return prices.reduce((sum, item, index) => {
      const qty = parseFloat(quantities[index] || '0');
      return sum + qty * Number(item.collector_price_per_kg || 0);
    }, 0);
  };

  const getTotalQty = () => {
    return Object.values(quantities).reduce((sum, q) => {
      return sum + parseFloat(q || '0');
    }, 0);
  };

  const handleQuantityChange = (index: number, text: string) => {
    const cleaned = text.replace(/[^0-9.]/g, '');
    setQuantities((prev) => ({
      ...prev,
      [index]: cleaned,
    }));
  };

  // const buildPayloadItems = () => {
  //   return prices
  //     .map((item, index) => {
  //       const qty = parseFloat(quantities[index] || '0');

  //       if (qty > 0) {
  //         return {
  //           category_id: item.category_id || item.categoryid || '',
  //           subcategory_id:
  //             item.sub_category_id ||
  //             item.subcategory_id ||
  //             item.subcategoryid ||
  //             '',
  //           price: Number(item.collector_price_per_kg || 0),
  //           approx_weight: Number(qty),
  //         };
  //       }

  //       return null;
  //     })
  //     .filter(Boolean) as {
  //     category_id: string;
  //     subcategory_id: string;
  //     price: number;
  //     approx_weight: number;
  //   }[];
  // };
  const buildPayloadItems = () => {
  return prices
    .map((item, index) => {
      const qty = parseFloat(quantities[index] || '0');

      if (qty > 0) {
        return {
          category_id: item.category_id || item.categoryid || '',
          subcategory_id:
            item.sub_category_id ||
            item.subcategory_id ||
            item.subcategoryid ||
            '',
          category_name: item.category_name || '',
          subcategory_name: item.sub_category_name || '',
          price: Number(item.collector_price_per_kg || 0),
          approx_weight: Number(qty),
        };
      }

      return null;
    })
    .filter(Boolean) as {
    category_id: string;
    subcategory_id: string;
    category_name: string;
    subcategory_name: string;
    price: number;
    approx_weight: number;
  }[];
};

  const handleConfirmPickup = async () => {
    if (!selectedTime) {
      alert('Please select time slot');
      return;
    }

    if (!sellerId) {
      alert('Seller ID missing');
      return;
    }

    if (!collectorId) {
      alert('Collector ID missing');
      return;
    }

    const items = buildPayloadItems();

    if (items.length === 0) {
      alert('Please enter quantity for at least one item');
      return;
    }

    const hasMissingIds = items.some(
      (item) => !item.category_id || !item.subcategory_id
    );

    if (hasMissingIds) {
      alert(
        'Category or subcategory ID is missing from price data. Please update Collector/prices API first.'
      );
      return;
    }

   const payload = {
  seller_id: sellerId,
  collector_id: collectorId,
  address: sellerAddress || '',
  latitude: 0,
  longitude: 0,
  contact_no: '',
  pickupdate: selectedDate.toISOString().split('T')[0],
  pickup_time: selectedTime,
  items,
};

    console.log('FINAL PAYLOAD:', payload);

    try {
      setSubmitting(true);

      const res = await fetch(getCleanUrl('request-pickup'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.Status === 'OK') {
        alert('Pickup Request Sent ✅');
        setModalVisible(false);
        setSelectedTime('');
        setQuantities({});
      } else {
        alert(data.Result || data.Message || 'Failed to send pickup request');
      }
    } catch (err) {
      console.log('Pickup request error:', err);
      alert('Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f2f4f7' }}>
      <LinearGradient colors={['#2f855a', '#38a169']} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Collector Details</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={{ padding: 15 }}>
        <View style={styles.infoBox}>
          <Text style={styles.name}>{collectorName}</Text>
          <View style={styles.row}>
            <Ionicons name="location-outline" size={18} color="#2f855a" />
            <Text style={styles.infoText}>{collectorAddress}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Scrap Prices</Text>

        <View style={styles.itemsBox}>
          <View style={styles.tableHeader}>
            <Text style={[styles.itemName, { fontWeight: '700' }]}>Item</Text>
            <Text style={[styles.qtyLabel, { fontWeight: '700' }]}>
              Quantity (kg)
            </Text>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color="#2f855a" style={{ marginVertical: 20 }} />
          ) : prices.length === 0 ? (
            <Text style={{ textAlign: 'center', padding: 15 }}>
              No prices available
            </Text>
          ) : (
            prices.map((item, index) => (
              <View key={index} style={styles.itemRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemName}>
                    {item.category_name} - {item.sub_category_name}
                  </Text>
                  <Text style={styles.itemQty}>
                    ₹{item.collector_price_per_kg} / kg
                  </Text>
                  <Text style={styles.adminPrice}>Min: ₹{item.admin_price}</Text>
                </View>

                <TextInput
                  style={styles.qtyInput}
                  placeholder="0"
                  keyboardType="numeric"
                  value={quantities[index] || ''}
                  onChangeText={(text) => handleQuantityChange(index, text)}
                />
              </View>
            ))
          )}
        </View>

        <View style={styles.totalBox}>
          <Text style={styles.totalText}>
            Total Amount: ₹{calculateTotal().toFixed(2)}
          </Text>
        </View>
      </ScrollView>

      <View style={styles.bottom}>
        <TouchableOpacity
          style={styles.scheduleBtn}
          onPress={() => {
            const totalQty = getTotalQty();

            if (totalQty < 5) {
              alert('Total quantity should be at least 5 kg to request pickup.');
              return;
            }

            const items = buildPayloadItems();

            if (items.length === 0) {
              alert('Please enter quantity for at least one item');
              return;
            }

            setModalVisible(true);
          }}
        >
          <Ionicons name="flash-outline" size={18} color="white" />
          <Text style={styles.scheduleText}>Request Pickup</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirm Pickup</Text>

            <View style={styles.modalRow}>
              <Text style={styles.modalLabel}>From:</Text>
              <Text style={styles.modalText}>
                {sellerName} - {sellerAddress}
              </Text>
            </View>

            <View style={styles.modalRow}>
              <Text style={styles.modalLabel}>To:</Text>
              <Text style={styles.modalText}>
                {collectorName} - {collectorAddress}
              </Text>
            </View>

            <Text style={[styles.modalLabel, { marginTop: 10 }]}>
              Select Date:
            </Text>

            <TouchableOpacity
              style={styles.datePickerBtn}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.dateText}>{selectedDate.toDateString()}</Text>
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={selectedDate}
                mode="date"
                minimumDate={new Date()}
                display="default"
                onChange={(_, date) => {
                  setShowDatePicker(false);
                  if (date) setSelectedDate(date);
                }}
              />
            )}

            <Text style={[styles.modalLabel, { marginTop: 10 }]}>
              Select Time Slot:
            </Text>

            <View style={styles.timeContainer}>
              {['9AM-12PM', '12PM-3PM', '3PM-6PM'].map((slot, idx, arr) => (
                <TouchableOpacity
                  key={slot}
                  style={[
                    styles.timeSlot,
                    idx === arr.length - 1 && { marginRight: 0 },
                    selectedTime === slot && styles.activeTimeSlot,
                  ]}
                  onPress={() => setSelectedTime(slot)}
                >
                  <Text
                    style={[
                      styles.timeText,
                      selectedTime === slot && { color: '#fff' },
                    ]}
                  >
                    {slot}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.modalLabel, { marginTop: 10 }]}>Items:</Text>

            {prices.map((item, index) => {
              const qty = parseFloat(quantities[index] || '0');

              if (qty > 0) {
                return (
                  <View key={index} style={styles.modalItemRow}>
                    <Text style={styles.modalText}>
                      {item.category_name} - {item.sub_category_name}
                    </Text>
                    <Text style={styles.modalTextCenter}>{qty} kg</Text>
                    <Text style={styles.modalTextRight}>
                      ₹{(qty * item.collector_price_per_kg).toFixed(2)}
                    </Text>
                  </View>
                );
              }

              return null;
            })}

            <Text style={[styles.modalTotal, { marginTop: 10 }]}>
              Total Amount: ₹{calculateTotal().toFixed(2)}
            </Text>

            <View style={{ flexDirection: 'row', marginTop: 20 }}>
              <TouchableOpacity
                style={[
                  styles.modalBtn,
                  { backgroundColor: submitting ? '#7fb899' : '#2f855a' },
                ]}
                onPress={handleConfirmPickup}
                disabled={submitting}
              >
                <Text style={styles.modalBtnText}>
                  {submitting ? 'Sending...' : 'Confirm'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalBtn,
                  { backgroundColor: '#ccc', marginLeft: 10 },
                ]}
                onPress={() => !submitting && setModalVisible(false)}
                disabled={submitting}
              >
                <Text style={[styles.modalBtnText, { color: '#333' }]}>
                  Cancel
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
    paddingTop: 20,
    paddingBottom: 25,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    elevation: 5,
  },
  back: {
    position: 'absolute',
    left: 15,
    top: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 6,
    borderRadius: 20,
  },
  headerText: {
    color: 'white',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  infoBox: {
    backgroundColor: '#fff',
    padding: 18,
    borderRadius: 18,
    marginBottom: 18,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    marginLeft: 8,
    color: '#555',
    fontSize: 14,
    flex: 1,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 12,
    color: '#2f855a',
    marginLeft: 2,
  },
  itemsBox: {
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingVertical: 5,
    elevation: 3,
  },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    marginBottom: 5,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  itemQty: {
    fontSize: 14,
    color: '#2f855a',
    fontWeight: '700',
    marginTop: 4,
  },
  adminPrice: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  qtyInput: {
    width: 60,
    height: 38,
    borderWidth: 1,
    borderColor: '#2f855a',
    borderRadius: 8,
    textAlign: 'center',
    marginLeft: 12,
  },
  qtyLabel: {
    fontSize: 13,
    color: '#2f855a',
    textAlign: 'center',
  },
  totalBox: {
    marginTop: 15,
    backgroundColor: '#e6f4ea',
    padding: 12,
    borderRadius: 12,
  },
  totalText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2f855a',
    textAlign: 'right',
  },
  bottom: {
    padding: 18,
    backgroundColor: '#fff',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    elevation: 12,
  },
  scheduleBtn: {
    backgroundColor: '#2f855a',
    padding: 16,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },
  scheduleText: {
    color: 'white',
    fontWeight: '700',
    marginLeft: 8,
    fontSize: 15,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 15,
    color: '#2f855a',
    textAlign: 'center',
  },
  modalRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  modalLabel: {
    fontWeight: '600',
    color: '#2f855a',
    width: 60,
  },
  modalText: {
    flex: 1,
    color: '#333',
  },
  modalTextCenter: {
    width: 70,
    textAlign: 'center',
    color: '#333',
  },
  modalTextRight: {
    width: 90,
    textAlign: 'right',
    color: '#333',
  },
  modalItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
    alignItems: 'center',
  },
  modalTotal: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2f855a',
    textAlign: 'right',
  },
  modalBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBtnText: {
    color: '#fff',
    fontWeight: '700',
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  timeSlot: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: '#2f855a',
    borderRadius: 8,
    marginRight: 5,
    alignItems: 'center',
  },
  activeTimeSlot: {
    backgroundColor: '#2f855a',
  },
  timeText: {
    color: '#2f855a',
    fontWeight: '600',
    fontSize: 12,
  },
  datePickerBtn: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginTop: 5,
  },
  dateText: {
    fontSize: 14,
    color: '#333',
  },
});

export default CollectorDetails;