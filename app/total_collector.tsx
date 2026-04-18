import { BASE_URL } from '@/Services/axiosServices';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

interface Collector {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  distance?: string;
  collector_id: string;
}

const CollectorsScreen = () => {
  const router = useRouter();

  const params = useLocalSearchParams<{
    seller_id?: string;
    name?: string;
    address?: string;
  }>();

  const sellerId =
    typeof params.seller_id === 'string' ? params.seller_id : '';

  const [collectors, setCollectors] = useState<Collector[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const getCleanUrl = (path: string) => {
    const base = BASE_URL.endsWith('/') ? BASE_URL.slice(0, -1) : BASE_URL;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${base}${cleanPath}`;
  };

  const getLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        fetchCollectors();
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    } catch (err) {
      console.log('Location Error:', err);
      fetchCollectors();
    }
  };

  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ) => {
    const toRad = (v: number) => (v * Math.PI) / 180;
    const R = 6371;

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) ** 2;

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c).toFixed(2);
  };

  const fetchCollectors = async () => {
    try {
      setLoading(true);

      const res = await fetch(getCleanUrl('Collector'));
      const json = await res.json();

      if (json.Status !== 'OK') {
        console.log('API Error:', json.Result);
        setCollectors([]);
        return;
      }

      let data = json.Result || [];

      if (userLocation) {
        data = data.map((collector: any) => {
          const lat = parseFloat(collector.latitude);
          const lon = parseFloat(collector.longitude);

          if (!isNaN(lat) && !isNaN(lon)) {
            const distance = calculateDistance(
              userLocation.latitude,
              userLocation.longitude,
              lat,
              lon
            );
            return { ...collector, distance };
          }

          return { ...collector, distance: '--' };
        });

        data.sort(
          (a: any, b: any) =>
            parseFloat(a.distance || '999') - parseFloat(b.distance || '999')
        );
      }

      setCollectors(data);
    } catch (err) {
      console.log('Fetch Error:', err);
      setCollectors([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getLocation();
  }, []);

  useEffect(() => {
    if (userLocation) {
      fetchCollectors();
    }
  }, [userLocation]);

  const filtered = collectors.filter((c) =>
    c.name?.toLowerCase().includes(search.toLowerCase())
  );

  const renderItem = ({ item }: { item: Collector }) => (
    <View style={styles.card}>
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.address}>
          {item.address} • {item.distance ? `${item.distance} km` : '--'}
        </Text>
      </View>

      <TouchableOpacity
        onPress={() =>
          router.push({
            pathname: '/collector_details',
            params: {
              name: item.name,
              address: item.address,
              collector_id: String(item.collector_id),
              seller_id: sellerId,
            },
          })
        }
        style={styles.button}
      >
        <Text style={styles.buttonText}>View</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f2f4f7' }}>
      <LinearGradient
        colors={['#2f855a', '#38a169']}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>

        <Text style={styles.headerText}>Collectors</Text>
      </LinearGradient>

      <View style={styles.searchBox}>
        <TextInput
          placeholder="Search Collectors..."
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {loading ? (
        <ActivityIndicator
          size="large"
          color="#2f855a"
          style={{ marginTop: 20 }}
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item, index) => index.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 15 }}
          ListEmptyComponent={
            <Text style={{ textAlign: 'center', marginTop: 20 }}>
              No collectors found
            </Text>
          }
        />
      )}
    </SafeAreaView>
  );
};

export default CollectorsScreen;

const styles = StyleSheet.create({
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

  searchBox: {
    margin: 15,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
  },

  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 15,
    marginBottom: 12,
    alignItems: 'center',
    elevation: 2,
  },

  name: {
    fontSize: 16,
    fontWeight: 'bold',
  },

  address: {
    fontSize: 13,
    color: '#555',
    marginVertical: 4,
  },

  button: {
    backgroundColor: '#2f855a',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },

  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
});