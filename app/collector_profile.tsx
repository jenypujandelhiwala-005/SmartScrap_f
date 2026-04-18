import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { BASE_URL } from '../Services/axiosServices';

interface Profile {
  name: string;
  email: string;
  phone: string;
  address: string;
}

const CollectorProfileScreen = () => {
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

  const collector_id =
    typeof params.collector_id === 'string' ? params.collector_id : '';

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const [profileModal, setProfileModal] = useState(false);
  const [passwordModal, setPasswordModal] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
  });

  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
  });

  const getCleanUrl = (path: string) => {
    const base = BASE_URL.endsWith('/') ? BASE_URL.slice(0, -1) : BASE_URL;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${base}${cleanPath}`;
  };

  const fetchProfile = async () => {
    try {
      if (!collector_id) {
        Alert.alert('Error', 'Collector ID missing');
        router.replace('/');
        return;
      }

      const res = await fetch(getCleanUrl(`Collector/Profile/${collector_id}`));
      const json = await res.json();

      console.log('PROFILE RESPONSE:', json);

      if (json.Status === 'OK') {
        setProfile(json.Result);
      } else {
        Alert.alert('Error', json.Result || 'Failed to load profile');
      }
    } catch (err) {
      console.log('Profile Error:', err);
      Alert.alert('Error', 'Server connection failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Yes',
        onPress: () => router.replace('/'),
      },
    ]);
  };

  const handleUpdateProfile = async () => {
    try {
      if (!collector_id) {
        Alert.alert('Error', 'Collector ID missing');
        return;
      }

      const bodyData = {
        collector_id,
        ...(formData.name && { name: formData.name }),
        ...(formData.phone && { phone: formData.phone }),
        ...(formData.address && { address: formData.address }),
      };

      const res = await fetch(getCleanUrl(`Collector/Profile/${collector_id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData),
      });

      const json = await res.json();

      if (json.Status === 'OK') {
        Alert.alert('Success', json.Result);
        setProfileModal(false);
        setFormData({ name: '', phone: '', address: '' });
        fetchProfile();
      } else {
        Alert.alert('Error', json.Result || 'Failed to update profile');
      }
    } catch (err: any) {
      console.log('UPDATE PROFILE ERROR:', err);
      Alert.alert('Error', err.message || 'Server error');
    }
  };

  const handleChangePassword = async () => {
    try {
      if (!collector_id) {
        Alert.alert('Error', 'Collector ID missing');
        return;
      }

      const res = await fetch(getCleanUrl('Collector/ChangePassword'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          collector_id,
          ...passwordData,
        }),
      });

      const json = await res.json();

      if (json.Status === 'OK') {
        Alert.alert('Success', json.Result);
        setPasswordModal(false);
        setPasswordData({ oldPassword: '', newPassword: '' });
      } else {
        Alert.alert('Error', json.Result || 'Failed to change password');
      }
    } catch (err: any) {
      console.log('CHANGE PASSWORD ERROR:', err);
      Alert.alert('Error', err.message || 'Server error');
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
    <SafeAreaView style={styles.screen}>
      <LinearGradient
        colors={['#2f855a', '#38a169']}
        style={styles.header}
      >
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
              <Text style={styles.value}>{profile?.name}</Text>
            </View>
          </View>

          <View style={styles.row}>
            <Ionicons name="mail-outline" size={20} color="#2f855a" />
            <View style={styles.info}>
              <Text style={styles.label}>Email</Text>
              <Text style={styles.value}>{profile?.email}</Text>
            </View>
          </View>

          <View style={styles.row}>
            <Ionicons name="call-outline" size={20} color="#2f855a" />
            <View style={styles.info}>
              <Text style={styles.label}>Phone</Text>
              <Text style={styles.value}>{profile?.phone}</Text>
            </View>
          </View>

          <View style={[styles.row, styles.lastRow]}>
            <Ionicons name="location-outline" size={20} color="#2f855a" />
            <View style={styles.info}>
              <Text style={styles.label}>Address</Text>
              <Text style={styles.value}>{profile?.address}</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          onPress={() =>
            router.push({
              pathname: '/collector_updatePrice',
              params: {
                collector_id,
                name: params.name || '',
                email: params.email || '',
                phone: params.phone || '',
                address: params.address || '',
                area: params.area || '',
                city: params.city || '',
                latitude: params.latitude || '',
                longitude: params.longitude || '',
              },
            })
          }
          style={styles.priceBtn}
        >
          <Ionicons name="create-outline" size={16} color="#fff" />
          <Text style={styles.btnText}> Update Prices</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => setProfileModal(true)}
        >
          <Ionicons name="create-outline" size={16} color="#fff" />
          <Text style={styles.btnText}> Update Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => setPasswordModal(true)}
        >
          <Ionicons name="lock-closed-outline" size={16} color="#fff" />
          <Text style={styles.btnText}> Change Password</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={18} color="#fff" />
          <Text style={styles.btnText}> Logout</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={profileModal} transparent animationType="slide">
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Update Profile</Text>

            <TextInput
              style={styles.input}
              placeholder="Name"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
            />

            <TextInput
              style={styles.input}
              placeholder="Phone"
              value={formData.phone}
              onChangeText={(text) => setFormData({ ...formData, phone: text })}
            />

            <TextInput
              style={styles.input}
              placeholder="Address"
              value={formData.address}
              onChangeText={(text) => setFormData({ ...formData, address: text })}
            />

            <TouchableOpacity style={styles.primaryBtn} onPress={handleUpdateProfile}>
              <Text style={styles.btnText}>Update</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={() => setProfileModal(false)}
            >
              <Text style={styles.btnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={passwordModal} transparent animationType="slide">
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Change Password</Text>

            <TextInput
              style={styles.input}
              placeholder="Old Password"
              secureTextEntry
              value={passwordData.oldPassword}
              onChangeText={(text) =>
                setPasswordData({ ...passwordData, oldPassword: text })
              }
            />

            <TextInput
              style={styles.input}
              placeholder="New Password"
              secureTextEntry
              value={passwordData.newPassword}
              onChangeText={(text) =>
                setPasswordData({ ...passwordData, newPassword: text })
              }
            />

            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={handleChangePassword}
            >
              <Text style={styles.btnText}>Change</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={() => setPasswordModal(false)}
            >
              <Text style={styles.btnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f2f4f7',
  },

  header: {
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
  },

  headerText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },

  back: {
    position: 'absolute',
    left: 15,
  },

  container: {
    padding: 20,
    alignItems: 'center',
  },

  card: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
    elevation: 2,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderColor: '#ddd',
  },

  lastRow: {
    borderBottomWidth: 0,
  },

  info: {
    marginLeft: 10,
    flex: 1,
  },

  label: {
    fontSize: 12,
    color: '#777',
  },

  value: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2f3138',
    marginTop: 2,
  },

  primaryBtn: {
    flexDirection: 'row',
    backgroundColor: '#2f855a',
    padding: 12,
    borderRadius: 10,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },

  priceBtn: {
    flexDirection: 'row',
    backgroundColor: '#2ba4e9',
    padding: 12,
    borderRadius: 10,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },

  secondaryBtn: {
    flexDirection: 'row',
    backgroundColor: '#4a5568',
    padding: 12,
    borderRadius: 10,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },

  logoutBtn: {
    flexDirection: 'row',
    backgroundColor: '#e53e3e',
    padding: 12,
    borderRadius: 10,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },

  btnText: {
    color: '#fff',
    fontWeight: 'bold',
  },

  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalContainer: {
    width: '90%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },

  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
});

export default CollectorProfileScreen;