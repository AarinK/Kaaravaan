import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { fetchMostRecentUpcomingTrip, fetchCompletedTrips } from '@/lib/expense/database';
import LottieView from 'lottie-react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import { ActivityIndicator } from 'react-native';


const travelQuotes = [
  "Travel is the only thing you buy that makes you richer.",
  "Life is short and the world is wide.",
  "Adventure is out there!",
  "Not all those who wander are lost. — J.R.R. Tolkien",
  "The world is a book and those who do not travel read only one page. — Saint Augustine",
  "Jobs fill your pocket, but adventures fill your soul. — Jaime Lyn Beatty",
  "Take only memories, leave only footprints. — Chief Seattle",
  "Travel far enough, you meet yourself. — David Mitchell",
  "Adventure may hurt you, but monotony will kill you.",
  "To travel is to live. — Hans Christian Andersen",
  "Life begins at the end of your comfort zone.",
  "Live your life by a compass, not a clock. — Stephen Covey",
  "Once a year, go someplace you’ve never been before. — Dalai Lama",
  "Collect moments, not things.",
  "Travel makes one modest, you see what a tiny place you occupy in the world. — Gustave Flaubert",
  "Wherever you go becomes a part of you somehow. — Anita Desai",
  "You don’t have to be rich to travel well. — Eugene Fodor",
  "The journey is the destination. — Dan Eldon",
  "The goal is to die with memories, not dreams.",
  "Travel: the best way to be lost and found at the same time. — Brenna Smith",
  "Life is meant for good friends and great adventures.",
  "Take the scenic route.",
  "Fill your life with experiences, not things.",
  "Wander often, wonder always.",
  "Every exit is an entry somewhere else. — Tom Stoppard",
  "Oh the places you’ll go. — Dr. Seuss",
  "A journey of a thousand miles begins with a single step. — Lao Tzu",
  "Catch flights, not feelings.",
  "Travel isn’t always pretty. It isn’t always comfortable. But that’s okay. — Anthony Bourdain",
  "Travel is rebellion in its purest form.",
  "The biggest adventure you can take is to live the life of your dreams. — Oprah Winfrey",
  "Eat well, travel often.",
  "Dare to live the life you’ve always wanted."
];


const getDaysLeft = (startDate: string) => {
  const start = new Date(startDate);
  const today = new Date();
  const diff = Math.ceil((start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
};

const HomePage = () => {
  const [upcomingTrip, setUpcomingTrip] = useState<any>(null);
  const [completedTrips, setCompletedTrips] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

  const router = useRouter();

  useFocusEffect(
  useCallback(() => {
    const loadData = async () => {
      setLoading(true);
      const upcoming = await fetchMostRecentUpcomingTrip();
      const completed = await fetchCompletedTrips();
      setUpcomingTrip(upcoming);
      setCompletedTrips(completed);
      setLoading(false);
    };

    loadData();
  }, [])
);

  useEffect(() => {
    const loadData = async () => {
      const upcoming = await fetchMostRecentUpcomingTrip();
      const completed = await fetchCompletedTrips();
      setUpcomingTrip(upcoming);
      setCompletedTrips(completed);
    };
    loadData();
  }, []);

  const renderUpcomingTrip = () => {
    if (!upcomingTrip) {
      return (
        <View style={styles.emptyState}>
          <LottieView
            source={require('@/assets/lottie/girl-walk.json')}
            autoPlay
            loop
            style={styles.lottie}
          />
          <Text style={styles.emptyTitle}>No Upcoming Trip</Text>
          <Text style={styles.emptyText}>Start planning your next adventure! ✈️</Text>
          <Text style={styles.emptyText}>
            “{travelQuotes[Math.floor(Math.random() * travelQuotes.length)]}”
          </Text>
          <Text style={styles.emptyCTA}>Go to the Add Trip section now!</Text>
        </View>
      );
    }

    const daysLeft = getDaysLeft(upcomingTrip.startDate);




if (loading) {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#FF8C00" />
      <Text style={styles.emptyText}>Loading your trips...</Text>
    </View>
  );
}



    return (
      <View style={styles.tripCardUpcoming}>
        <Text style={styles.tripCardTitleUpcoming}>Upcoming Trip</Text>
        <Text style={styles.tripDetail}>✈️ {upcomingTrip.name}</Text>
        <Text style={styles.tripDetail}>📍 {upcomingTrip.destination}</Text>
        <Text style={styles.tripDetail}>🗓️ {upcomingTrip.startDate} ➔ {upcomingTrip.endDate}</Text>
        <Text style={styles.tripDetailCountdown}>⏳ {daysLeft} day(s) to go!</Text>

        {daysLeft <= 3 && (
          <Text style={styles.reminderBanner}>⏰ Don’t forget to pack! Trip starts soon.</Text>
        )}
      </View>
    );
  };

  const renderCompletedTripItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      onPress={() => {
        router.push({
          pathname: '/tripDetails',
          params: { trip: JSON.stringify(item) },
        });
      }}
      style={styles.tripCardCompleted}
      activeOpacity={0.8}
    >
      <Text style={styles.tripCardTitleCompleted}>Completed Trip</Text>
      <Text style={styles.tripDetail}>✈️ {item.name}</Text>
      <Text style={styles.tripDetail}>📍 {item.destination}</Text>
      <Text style={styles.tripDetail}>🗓️ {item.startDate} ➔ {item.endDate}</Text>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {item.photoUris &&
          JSON.parse(item.photoUris).slice(0, 3).map((uri: string, idx: number) => (
            <Image
              key={idx}
              source={{ uri }}
              style={{
                width: 80,
                height: 80,
                borderRadius: 8,
                marginRight: 10,
                marginTop: 10,
              }}
            />
          ))}
      </View>
    </TouchableOpacity>
  );

  return (
  <FlatList
    data={completedTrips}
    keyExtractor={(item) => item.id}
    renderItem={renderCompletedTripItem}
    ListHeaderComponent={
      <View>

          <View style={styles.logoContainer}>
      <Image source={require('@/assets/images/logo_text.png')} style={styles.logoImage} />
    </View>
     <Text style={styles.quoteText}>
          “{travelQuotes[Math.floor(Math.random() * travelQuotes.length)]}”
        </Text>
      <View style={styles.tripStatsContainer}>
  <View style={styles.tripStatCard}>
    <Text style={styles.tripStatNumber}>{completedTrips.length}</Text>
    <Text style={[styles.tripStatLabel, { color: '#4CAF50' }]}>Trips Completed</Text>
  </View>
  <View style={styles.tripStatCard}>
    <Text style={styles.tripStatNumber}>{upcomingTrip ? 1 : 0}</Text>
    <Text style={[styles.tripStatLabel, { color: '#FF8C00' }]}>Trips Planned</Text>
  </View>
</View>


        <Text style={styles.header}>Your Trips:</Text>

        {/* Travel Quote Always Visible */}
       

        {renderUpcomingTrip()}
        <Text style={styles.sectionTitle}>Completed Trips:</Text>
      </View>
    }
    contentContainerStyle={styles.container}
    ListEmptyComponent={
      <View style={styles.emptyState}>
        <LottieView
          source={require('@/assets/lottie/empty.json')}
          autoPlay
          loop
          style={styles.lottie}
        />
        <Text style={styles.emptyTitle}>No Completed Trips Yet</Text>
        <Text style={styles.emptyText}>Once you finish a trip, it’ll show up here! 🗺️</Text>
      </View>
    }
  />
);

};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#000',
    flexGrow: 1,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#FF8C00',
    textAlign: 'left',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#FF8C00',
    marginVertical: 15,
    textAlign: 'left',
  },
  loadingContainer: {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: '#000', // Match your app theme
},

logoContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: 20,
  marginTop: 10,
},
logoImage: {
  width: 150,
  height: 100,
  resizeMode: 'contain',
  marginRight: 10,
  backgroundColor:'black',
marginTop:15},
logoText: {
  fontSize: 24,
  fontWeight: 'bold',
  color: '#FF8C00',
},

  tripCardUpcoming: {
    backgroundColor: '#FFE5CC',
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  quoteText: {
  fontSize: 18,
  fontStyle: 'italic',
  textAlign: 'center',
  color: '#ddd',
  marginBottom:10,
  marginTop:0,
  paddingHorizontal: 20,
},

  tripCardCompleted: {
    backgroundColor: '#FFE5CC',
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  tripCardTitleUpcoming: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF8C00',
    marginBottom: 8,
  },
  tripCardTitleCompleted: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 8,
  },
  tripDetail: {
    fontSize: 16,
    color: '#555',
    marginBottom: 4,
  },
  tripDetailCountdown: {
    fontSize: 14,
    color: '#FF8C00',
    marginTop: 6,
    fontWeight: 'bold',
  },
  reminderBanner: {
    fontSize: 14,
    color: '#fff',
    backgroundColor: '#FF8C00',
    padding: 8,
    borderRadius: 6,
    marginTop: 10,
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
    backgroundColor: '#111',
    borderRadius: 12,
    marginVertical: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF8C00',
    marginBottom: 5,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#aaa',
    textAlign: 'center',
    marginBottom: 4,
  },
  emptyCTA: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  lottie: {
    width: 120,
    height: 120,
    marginBottom: 10,
  },
  tripStatsContainer: {
  flexDirection: 'row',
  justifyContent: 'space-around',
  backgroundColor: '#222',
  paddingVertical: 15,
  marginBottom: 20,
  borderRadius: 10,
},

tripStatCard: {
  alignItems: 'center',
},

tripStatNumber: {
  fontSize: 26,
  fontWeight: 'bold',
  color: '#FF8C00',
},

tripStatLabel: {
  fontSize: 14,
  color: '#aaa',
},

});

export default HomePage;
