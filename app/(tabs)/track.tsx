import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Button, Card, Title, Text, ActivityIndicator } from 'react-native-paper';
import { executeSql ,deleteTripById} from '@/lib/expense/database';
import TripCard from '@/components/expense/TripCard';
import { ThemedView } from '@/components/ThemedView';
import { router } from 'expo-router';
import LottieView from 'lottie-react-native';
import { Alert } from 'react-native';


interface Trip {
  id: string;
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
  predictedTotal: number;
  actualTotal: number;
}

export default function Track() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  const handleDeleteTrip = async (tripId: string) => {
  try {
    await deleteTripById(tripId);
    setTrips(prev => prev.filter(t => t.id !== tripId));
  } catch (error) {
    console.error('Failed to delete trip:', error);
  }
};


  useEffect(() => {
    const loadTrips = async () => {
      try {
        const result = await executeSql<{ rows: { _array: Trip[] } }>(
          `SELECT t.*, 
           (SELECT SUM(ec.predictedTotal) FROM expense_categories ec WHERE ec.trip_id = t.id) as predictedTotal,
           (SELECT SUM(ec.actualTotal) FROM expense_categories ec WHERE ec.trip_id = t.id) as actualTotal
           FROM trips t WHERE t.isCompleted = 0`
        );
        setTrips(result.rows._array);
      } catch (error) {
        console.error('Error loading trips:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTrips();
  }, []);
  const confirmDeleteTrip = (tripId: string) => {
  Alert.alert(
    'Delete Trip',
    'Are you sure you want to delete this trip?',
    [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => handleDeleteTrip(tripId) },
    ],
    { cancelable: true }
  );
};


  const handleTripPress = (tripId: string) => {
    router.push(`/${tripId}`);
  };

  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator animating={true} size="large" color="#000" />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={{ flex: 1, backgroundColor: 'rgb(0, 0, 0)' }}>
      <ScrollView contentContainerStyle={styles.container}>
        
        {trips.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content>
              <Text style={styles.emptyText}>No trips found. Start by adding a new trip!</Text>
             <LottieView
                    source={require('@/assets/lottie/empty.json')}
                    autoPlay
                    loop
                    style={styles.lottie}
                  />
              <Button 
                mode="contained" 
                onPress={() => router.push('/add')}
                style={styles.addButton}
                buttonColor="#FF8C00"
                labelStyle={{ color: '#FFFFFF' }}
              >
                Add Trip
              </Button>
            </Card.Content>
                
          </Card>
          
        ) : (
          trips.map(trip => (
  <Card key={trip.id} style={{ marginBottom: 16, backgroundColor: '#1a1a1a' }}>
    <Card.Content>
      <Title style={{ color: '#FF8C00' }}>{trip.name}</Title>
      <Text style={{ color: '#fff' }}>Destination: {trip.destination}</Text>
      <Text style={{ color: '#fff' }}>Dates: {trip.startDate} to {trip.endDate}</Text>
      <Text style={{ color: '#fff' }}>Predicted: ₹{trip.predictedTotal?.toFixed(2) || 0}</Text>
      <Text style={{ color: '#fff' }}>Actual: ₹{trip.actualTotal?.toFixed(2) || 0}</Text>
    </Card.Content>
    <Card.Actions style={{ justifyContent: 'space-between' }}>
      <Button 
        mode="contained" 
        buttonColor="#FF8C00" 
        onPress={() => handleTripPress(trip.id)}
      >
        View
      </Button>
      <Button 
        mode="outlined" 
        textColor="#FF8C00" 
        onPress={() => confirmDeleteTrip(trip.id)}
      >
        Delete
      </Button>
    </Card.Actions>
  </Card>
))

        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#000',
  },
  title: {
    marginBottom: 20,
    textAlign: 'center',
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FF8C00',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  emptyCard: {
    marginVertical: 20,
    padding: 15,
    alignItems: 'center',
    backgroundColor: '#FFE5CC',
    borderRadius: 12,
    elevation: 3,
  },
  emptyText: {
    textAlign: 'center',
    marginBottom: 15,
    fontSize: 16,
    color: '#555',
  },
  addButton: {
    width: '50%',
    alignSelf: 'center',
    borderRadius: 25,
  },
  lottie: {
  width: 250,
  height: 250,
  marginBottom: 10,
  marginLeft:18,
},

});
