import { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View, Dimensions, Alert } from 'react-native';
import { Button, Card, Title, Text, Divider, ActivityIndicator } from 'react-native-paper';
import { PieChart } from 'react-native-chart-kit';
import { executeSql } from '@/lib/expense/database';
import { calculateTripTotals } from '@/lib/expense/calculations';
import { ThemedView } from '@/components/ThemedView';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { Image, TouchableOpacity } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

interface ExpenseCategory {
  id: string;
  name: string;
  predictedTotal: number;
  actualTotal: number;
}

interface Trip {
  id: string;
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
  isCompleted: boolean;
}

interface PersonPayment {
  name: string;
  amountPaid: number;
}

interface Expense {
  person_name: string;
  amount: number;
  category: string;
}

export default function End() {
  const { id } = useLocalSearchParams();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [photos, setPhotos] = useState<string[]>([]);
  const [personPayments, setPersonPayments] = useState<PersonPayment[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
const [totals, setTotals] = useState({ predicted: 0, actual: 0 });

  const screenWidth = Dimensions.get('window').width;
  const categoryColors: string[] = ['#FF6B6B', '#1E88E5', '#FFB74D', '#26C6DA', '#AB47BC', '#4CAF50', '#F06292'];

  const generateBill = async () => {
  if (!trip) return;
  const { predicted: predictedTotal, actual: actualTotal } = totals;

  // Calculate total per person
  const totalPerPerson: { [name: string]: number } = {};
  personPayments.forEach(p => { totalPerPerson[p.name] = p.amountPaid; });

  const totalSpent = personPayments.reduce((sum, p) => sum + p.amountPaid, 0);
  const perHead = totalSpent / personPayments.length;

  const balances: { [name: string]: number } = {};
  personPayments.forEach(p => {
    balances[p.name] = p.amountPaid - perHead;
  });

  const owesList: string[] = [];
  const debtors = Object.entries(balances).filter(([_, val]) => val < 0);
  const creditors = Object.entries(balances).filter(([_, val]) => val > 0);

  for (const [debtor, debt] of debtors) {
    for (const [creditor, credit] of creditors) {
      if (debt === 0 || credit === 0) continue;
      const payment = Math.min(-debt, credit);
      owesList.push(`${debtor} owes ₹${payment.toFixed(2)} to ${creditor}`);
      balances[debtor] += payment;
      balances[creditor] -= payment;
    }
  }

  // Group expenses by person
  const expensesByPerson: { [name: string]: { category: string; amount: number }[] } = {};
  expenses.forEach(e => {
    if (!expensesByPerson[e.person_name]) {
      expensesByPerson[e.person_name] = [];
    }
    expensesByPerson[e.person_name].push({ category: e.category, amount: e.amount });
  });

  // Generate per-person tables
  const personExpenseTables = Object.entries(expensesByPerson)
    .map(([name, entries]) => `
      <h4>${name}'s Expenses</h4>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <thead>
          <tr>
            <th style="border: 1px solid #ccc; padding: 8px;">Category</th>
            <th style="border: 1px solid #ccc; padding: 8px;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${entries.map(e => `
            <tr>
              <td style="border: 1px solid #ccc; padding: 8px;">${e.category}</td>
              <td style="border: 1px solid #ccc; padding: 8px;">₹${e.amount.toFixed(2)}</td>
            </tr>`).join('')}
        </tbody>
      </table>
    `).join('');

  // Generate and share PDF
  const { uri } = await Print.printToFileAsync({
    html: `
      <html>
        <head><meta charset="utf-8" /><title>Split Bill</title></head>
        <body style="font-family: sans-serif; padding: 24px;">
          <h1 style="text-align: center; color: #FF8C00;">Trip Summary</h1>
          <h2>${trip.name}</h2>
          <p><strong>Destination:</strong> ${trip.destination}</p>
          <p><strong>Dates:</strong> ${trip.startDate} to ${trip.endDate}</p>
          <hr />
          <p><strong>Total Predicted:</strong> ₹${predictedTotal.toFixed(2)}</p>
          <p><strong>Total Actual:</strong> ₹${actualTotal.toFixed(2)}</p>
          <p><strong>Difference:</strong> ₹${(actualTotal - predictedTotal).toFixed(2)} (${actualTotal > predictedTotal ? 'Over' : 'Under'})</p>
          <hr />
          <h3>Who Paid</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <thead><tr><th style="border: 1px solid #ccc; padding: 8px;">Person</th><th style="border: 1px solid #ccc; padding: 8px;">Amount Paid</th></tr></thead>
            <tbody>
              ${personPayments.map(p => `<tr><td style="border: 1px solid #ccc; padding: 8px;">${p.name}</td><td style="border: 1px solid #ccc; padding: 8px;">₹${p.amountPaid.toFixed(2)}</td></tr>`).join('')}
            </tbody>
          </table>
          <h3 style="margin-top: 20px;">Individual Expenses</h3>
          ${personExpenseTables}
          <h3 style="margin-top: 20px;">Who Owes Whom</h3>
          <ul>${owesList.map(o => `<li>${o}</li>`).join('')}</ul>
          <p style="margin-top: 30px; font-size: 12px;">Generated by Kaaravan</p>
        </body>
      </html>
    `,
    base64: false,
  });

  await Sharing.shareAsync(uri);
};


  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      const fileName = uri.split('/').pop();
      const newPath = FileSystem.documentDirectory + fileName;
      await FileSystem.copyAsync({ from: uri, to: newPath });
      setPhotos(prev => [...prev, newPath]);
    }
  };

 useEffect(() => {
  const loadTripData = async () => {
    try {
      const tripResult = await executeSql('SELECT * FROM trips WHERE id = ?', [id]);
      setTrip(tripResult.rows._array[0]);

      const categoriesResult = await executeSql('SELECT * FROM expense_categories WHERE trip_id = ?', [id]);
      const categoryData = categoriesResult.rows._array;
      setCategories(categoryData);

      const expensesResult = await executeSql(
        `SELECT paidBy AS person_name, amount, label AS category 
         FROM actual_expenses 
         WHERE item_id IN (
           SELECT id FROM expense_items 
           WHERE category_id IN (
             SELECT id FROM expense_categories WHERE trip_id = ?
           )
         )`, 
        [id]
      );
      const expenseData = expensesResult.rows._array;
      setExpenses(expenseData);

      // ✅ Calculate totals directly
const predicted = categoryData.reduce((sum, c) => sum + (c.predictedTotal || 0), 0);
      const actual = expenseData.reduce((sum, e) => sum + (e.amount || 0), 0);
      setTotals({ predicted, actual });

      // ✅ Calculate payments based on actual_expenses
      const paymentMap: { [name: string]: number } = {};
      for (const e of expenseData) {
        if (!paymentMap[e.person_name]) paymentMap[e.person_name] = 0;
        paymentMap[e.person_name] += e.amount;
      }

      const paymentList = Object.entries(paymentMap).map(([name, amountPaid]) => ({ name, amountPaid }));
      setPersonPayments(paymentList);
    } catch (error) {
      console.error('Error loading trip data:', error);
    } finally {
      setLoading(false);
    }
  };

  loadTripData();
}, [id]);


  const completeTrip = async () => {
    Alert.alert('Finish Trip?', 'Are you sure you want to mark this trip as completed?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Yes',
        onPress: async () => {
          try {
            await executeSql('UPDATE trips SET isCompleted = 1, photoUris = ? WHERE id = ?', [JSON.stringify(photos), id]);
            router.push('/track');
          } catch (error) {
            console.error('Error completing trip:', error);
            alert('Failed to complete trip');
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

const { predicted: predictedTotal, actual: actualTotal } = totals;

  return (
    <ThemedView style={{ flex: 1 }}>
      <ScrollView style={{ backgroundColor: '#000' }} contentContainerStyle={styles.container}>
        <Title style={styles.title}>{trip?.name}</Title>

        <Card style={styles.card}>
        <Card.Content>
  <Text variant="titleMedium" style={styles.orange}>Destination: {trip?.destination}</Text>
  <Text variant="bodyMedium" style={styles.whiteText}>From {trip?.startDate} to {trip?.endDate}</Text>
  <Divider style={{ marginVertical: 10 }} />
  <Text style={styles.whiteText}>Total Predicted: ₹{predictedTotal.toFixed(2)}</Text>
  <Text style={styles.whiteText}>Total Actual: ₹{actualTotal.toFixed(2)}</Text>
  <Text style={{ 
    color: actualTotal > predictedTotal ? '#FF6B6B' : '#4CAF50',
    fontSize: 14,
    marginTop: 4
  }}>
    Difference: ₹{(actualTotal - predictedTotal).toFixed(2)} ({actualTotal > predictedTotal ? 'Over' : 'Under'})
  </Text>
</Card.Content>
        </Card>

        <Text variant="titleMedium" style={[styles.orange, { marginTop: 20 }]}>Who Paid How Much</Text>
        <PieChart
          data={personPayments.map((p, i) => ({
            name: p.name,
            amount: p.amountPaid,
            color: categoryColors[i % categoryColors.length],
            legendFontColor: '#fff',
            legendFontSize: 14,
          }))}
          width={screenWidth - 32}
          height={220}
          chartConfig={{
            backgroundColor: '#000',
            backgroundGradientFrom: '#000',
            backgroundGradientTo: '#000',
            decimalPlaces: 2,
            color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
            labelColor: () => '#fff',
          }}
          accessor="amount"
          backgroundColor="transparent"
          paddingLeft="15"
        />
<Button
  icon="camera"
  mode="outlined"
  onPress={pickImage}
  style={{ marginTop: 20, borderColor: '#FF8C00' }}
  textColor="#FF8C00"
>
  Add Photo from Trip
</Button>

        {photos.length > 0 && (
          <>
            <Text variant="titleMedium" style={[styles.orange, { marginTop: 20 }]}>Attached Photos</Text>
            <ScrollView horizontal style={{ marginVertical: 10 }}>
              {photos.map((uri, index) => (
                <Image
                  key={index}
                  source={{ uri }}
                  style={{ width: 120, height: 120, borderRadius: 10, marginRight: 10 }}
                />
              ))}
            </ScrollView>
          </>
        )}

        

        <Button icon="share-variant" mode="outlined" onPress={generateBill} style={{ marginTop: 10, marginBottom: 40, borderColor: '#FF8C00' }} textColor="#FF8C00">Share Bill</Button>
        <Button
          icon="check-circle"
          mode="contained"
          onPress={completeTrip}
          style={{ backgroundColor: '#FF8C00', marginTop: 10 }}
        >
          Mark Trip as Completed
        </Button>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#000',
  },
  card: {
    marginVertical: 10,
    backgroundColor: '#121212',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF8C00',
    marginBottom: 10,
  },
  orange: {
    color: '#FF8C00',
  },
  
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
    whiteText: {
    color: '#FFFFFF', // Pure white
    fontSize: 14,     // Match default body text size
  },
});