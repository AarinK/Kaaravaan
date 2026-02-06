import { View, StyleSheet } from 'react-native';
import { Card, Title, Text } from 'react-native-paper';
import { Trip } from '@/lib/expense/types';

interface TripCardProps {
  trip: Trip;
  onPress: () => void;
}

export default function TripCard({ trip, onPress }: TripCardProps) {
  const isOverspent = (trip.actualTotal || 0) > (trip.predictedTotal || 0);

  return (
    <Card 
      style={[styles.card, isOverspent ? styles.overspentCard : styles.underBudgetCard]}
      onPress={onPress}
    >
      <Card.Content>
        <Title style={styles.title}>{trip.name}</Title>
        <Text>Destination: {trip.destination}</Text>
        <Text>Dates: {trip.startDate} to {trip.endDate}</Text>
        <Text style={styles.totalText}>
          Predicted: ${trip.predictedTotal?.toFixed(2)}
        </Text>
        <Text style={[styles.totalText, isOverspent ? styles.overspentText : styles.underBudgetText]}>
          Actual: ${trip.actualTotal?.toFixed(2)}
        </Text>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 15,
    padding: 10,
  },
  overspentCard: {
    borderLeftWidth: 5,
    borderLeftColor: '#f44336',
  },
  underBudgetCard: {
    borderLeftWidth: 5,
    borderLeftColor: '#4caf50',
  },
  title: {
    fontSize: 18,
    marginBottom: 5,
  },
  totalText: {
    marginTop: 5,
  },
  overspentText: {
    color: '#f44336',
    fontWeight: 'bold',
  },
  underBudgetText: {
    color: '#4caf50',
  },
});