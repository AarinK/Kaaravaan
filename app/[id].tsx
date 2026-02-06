import { useEffect, useState } from 'react';
import { ScrollView, View, Dimensions, StyleSheet } from 'react-native';
import { Button, Card, Title, Text, TextInput, Divider, ActivityIndicator } from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';
import { LineChart } from 'react-native-chart-kit';
import { executeSql } from '@/lib/expense/database';
import { calculateCategoryTotals, calculateTripTotals } from '@/lib/expense/calculations';
import { ThemedView } from '@/components/ThemedView';
import { router, useLocalSearchParams } from 'expo-router';
import Swiper from 'react-native-swiper';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

interface ExpenseItem {
  id: string;
  name: string;
  predictedCost: number;
  actualCost: number;
}

interface ExpenseCategory {
  id: string;
  name: string;
  predictedTotal: number;
  actualTotal: number;
  items: ExpenseItem[];
}

interface Trip {
  id: string;
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
  isCompleted: boolean;
}

interface ActualExpense {
  id: string;
  label: string;
  amount: number;
  paidBy: string;
}

export default function TripDetails() {
  const { id } = useLocalSearchParams();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [editedCosts, setEditedCosts] = useState<Record<string, number>>({});
  const [actualExpenses, setActualExpenses] = useState<Record<string, ActualExpense[]>>({});
  const [tempInputs, setTempInputs] = useState<Record<string, { label: string; amount: string; paidBy: string }>>({});
  const [newItems, setNewItems] = useState<Record<string, { name: string; predicted: string }>>({});
  const [members, setMembers] = useState<string[]>([]);
  const screenWidth = Dimensions.get('window').width;
  const [showCategories, setShowCategories] = useState(false);

  useEffect(() => {
    const loadTripData = async () => {
      try {
        const tripResult = await executeSql('SELECT * FROM trips WHERE id = ?', [id]);
        setTrip(tripResult.rows._array[0]);

        const actualExpensesResult = await executeSql('SELECT * FROM actual_expenses');
        const allExpenses = actualExpensesResult.rows._array;

        const groupedExpenses: Record<string, ActualExpense[]> = {};
        allExpenses.forEach(exp => {
          if (!groupedExpenses[exp.item_id]) groupedExpenses[exp.item_id] = [];
          groupedExpenses[exp.item_id].push({
            id: exp.id,
            label: exp.label,
            amount: exp.amount,
            paidBy: exp.paidBy,
          });
        });

        const categoriesResult = await executeSql('SELECT * FROM expense_categories WHERE trip_id = ?', [id]);
        const loadedCategories: ExpenseCategory[] = [];

        for (const category of categoriesResult.rows._array) {
          const itemsResult = await executeSql('SELECT * FROM expense_items WHERE category_id = ?', [category.id]);
          const items = itemsResult.rows._array;

          const predictedTotal = items.reduce((sum, item) => sum + item.predictedCost, 0);
          const actualTotal = items.reduce((sum, item) => {
            const expenses = groupedExpenses[item.id] || [];
            return sum + expenses.reduce((eSum, e) => eSum + e.amount, 0);
          }, 0);

          loadedCategories.push({
            ...category,
            items,
            predictedTotal,
            actualTotal,
          });
        }

        const membersResult = await executeSql('SELECT name FROM trip_members WHERE trip_id = ?', [id]);
        const memberNames = membersResult.rows._array.map((row: any) => row.name);

        setMembers(memberNames);
        setActualExpenses(groupedExpenses);
        setCategories(loadedCategories);
      } catch (error) {
        console.error('Error loading trip data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTripData();
  }, [id]);

  const handleInputChange = (itemId: string, value: string) => {
    const numericValue = parseFloat(value) || 0;
    setEditedCosts(prev => ({ ...prev, [itemId]: numericValue }));
  };

  const handleAddActualExpense = async (itemId: string) => {
    const inputs = tempInputs[itemId] || { label: '', amount: '', paidBy: '' };
    const { label, amount, paidBy } = inputs;

    if (!label || !amount || !paidBy) return;

    const newExpense: ActualExpense = {
      id: Date.now().toString(),
      label,
      amount: parseFloat(amount),
      paidBy,
    };

    try {
      await executeSql(
        `INSERT INTO actual_expenses (id, item_id, label, amount, paidBy) VALUES (?, ?, ?, ?, ?)`,
        [newExpense.id, itemId, newExpense.label, newExpense.amount, newExpense.paidBy]
      );

      setActualExpenses(prev => ({
        ...prev,
        [itemId]: [...(prev[itemId] || []), newExpense],
      }));

      const updatedCategories = categories.map(category => {
        const updatedItems = category.items.map(item => {
          if (item.id === itemId) {
            const itemExpenses = [...(actualExpenses[itemId] || []), newExpense];
            const actualTotal = itemExpenses.reduce((sum, exp) => sum + exp.amount, 0);
            return { ...item, actualCost: actualTotal };
          }
          return item;
        });

        const { predictedTotal, actualTotal } = calculateCategoryTotals(updatedItems);
        return { ...category, items: updatedItems, actualTotal };
      });

      setCategories(updatedCategories);
      setTempInputs(prev => ({ ...prev, [itemId]: { label: '', amount: '', paidBy: '' } }));
      
      alert('✅ Actual expense saved successfully!');
    } catch (error) {
      console.error('Error adding actual expense:', error);
    }
  };

  const handleTempInputChange = (itemId: string, key: 'label' | 'amount' | 'paidBy', value: string) => {
    setTempInputs(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [key]: value,
      },
    }));
  };

  const handleAddNewItem = async (categoryId: string) => {
    const input = newItems[categoryId] || { name: '', predicted: '' };
    const { name, predicted } = input;

    if (!name || !predicted) return;

    const newItemId = Date.now().toString();
    const predictedValue = parseFloat(predicted);

    try {
      await executeSql(
        'INSERT INTO expense_items (id, name, predictedCost, actualCost, category_id) VALUES (?, ?, ?, ?, ?)',
        [newItemId, name, predictedValue, 0, categoryId]
      );

      const updatedItems = [
        ...(categories.find(c => c.id === categoryId)?.items || []),
        { id: newItemId, name, predictedCost: predictedValue, actualCost: 0 }
      ];

      const updatedCategories = categories.map(cat => {
        if (cat.id === categoryId) {
          const { predictedTotal, actualTotal } = calculateCategoryTotals(updatedItems);
          return { ...cat, items: updatedItems, predictedTotal, actualTotal };
        }
        return cat;
      });

      setCategories(updatedCategories);
      setNewItems(prev => ({ ...prev, [categoryId]: { name: '', predicted: '' } }));
    } catch (error) {
      console.error('Error adding new item:', error);
    }
  };

  const handleNewItemChange = (categoryId: string, key: 'name' | 'predicted', value: string) => {
    setNewItems(prev => ({
      ...prev,
      [categoryId]: {
        ...prev[categoryId],
        [key]: value,
      },
    }));
  };

  const saveChanges = async () => {
    try {
      const updatedCategories = await Promise.all(
        categories.map(async category => {
          const updatedItems = await Promise.all(
            category.items.map(async item => {
              if (editedCosts[item.id] !== undefined) {
                const newCost = editedCosts[item.id];
                await executeSql('UPDATE expense_items SET actualCost = ? WHERE id = ?', [newCost, item.id]);
                return { ...item, actualCost: newCost };
              }
              return item;
            })
          );

          const { actualTotal } = calculateCategoryTotals(updatedItems);
          await executeSql('UPDATE expense_categories SET actualTotal = ? WHERE id = ?', [actualTotal, category.id]);

          return {
            ...category,
            items: updatedItems,
            actualTotal,
          };
        })
      );

      setCategories(updatedCategories);
      setEditedCosts({});
      alert('✅ Total actual costs updated successfully!');
    } catch (error) {
      console.error('Error saving changes:', error);
    }
  };

  const completeTrip = () => {
    router.push({ pathname: '/end', params: { id } });
  };

  if (loading || !trip) {
    return (
      <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator animating={true} size="large" color="#FF8C00" />
      </ThemedView>
    );
  }

  const { predictedTotal, actualTotal } = calculateTripTotals(categories);

  return (
           <KeyboardAwareScrollView
  contentContainerStyle={styles.mainContainer}
  enableOnAndroid={true}
  extraScrollHeight={20}
  keyboardOpeningTime={0}
>
      {!showCategories ? (
        <ScrollView contentContainerStyle={styles.container}>
          <Card style={styles.card1}>
            <Card.Content style={styles.cardContent}>
              <Title style={styles.title}>{trip.name}</Title>
              <Text style={styles.text}>Destination: {trip.destination}</Text>
              <Text style={styles.text}>Dates: {trip.startDate} to {trip.endDate}</Text>
              <Divider style={styles.divider} />
              <Text style={styles.text}>Total Predicted: ₹{predictedTotal}</Text>
              <Text style={[styles.text, { color: actualTotal > predictedTotal ? 'red' : 'green' }]}>
                Total Actual: ₹{actualTotal.toFixed(2)}
              </Text>
            </Card.Content>
          </Card>

          <Title style={styles.chartTitle}>Predicted vs Actual Cost</Title>
          <LineChart
            data={{
              labels: categories.map(c => c.name),
              datasets: [
                {
                  data: categories.map(c => c.predictedTotal),
                  color: () => `rgba(255, 140, 0, 1)`
                },
                {
                  data: categories.map(c => c.actualTotal),
                  color: () => `rgba(33, 150, 243, 1)`
                },
              ],
              legend: ['Predicted', 'Actual'],
            }}
            width={screenWidth - 40}
            height={220}
            yAxisSuffix=" ₹"
            chartConfig={{
              backgroundColor: '#000',
              backgroundGradientFrom: '#000',
              backgroundGradientTo: '#000',
              decimalPlaces: 2,
              color: () => `rgb(255, 255, 255)`
            }}
            bezier
            style={styles.chart}
          />

          <Button
            mode="contained"
            buttonColor="#FF8C00"
            style={[styles.button, { marginVertical: 12 }]}
            labelStyle={styles.buttonText}
            onPress={saveChanges}
          >
           Update Graph
          </Button>

          <Button
            mode="contained"
            buttonColor="#FF8C00"
            style={[styles.button, { marginBottom: 12 }]}
            labelStyle={styles.buttonText}
            onPress={() => setShowCategories(true)}
          >
            Track Payments
          </Button>

          <Button
            mode="contained"
            buttonColor="#FF8C00"
            style={styles.button}
            labelStyle={styles.buttonText}
            onPress={completeTrip}
          >
            Complete Trip
          </Button>
        </ScrollView>
      ) : (
 
        <View style={styles.categoriesWrapper}>
          <View style={styles.swiperContainer}>
            <Swiper
              style={styles.swiper}
              showsButtons={true}
              showsPagination={false}
                nextButton={
    <View style={styles.nextButton}>
      <Text style={styles.buttonText1}>›</Text>
    </View>
  }
  prevButton={
    <View style={styles.prevButton}>
      <Text style={styles.buttonText1}>‹</Text>
    </View>
  }
              dot={<View style={styles.dot} />}
              activeDot={<View style={styles.activeDot} />}
              paginationStyle={styles.paginationStyle}
            >
              {categories.map(category => (
                <View key={category.id} style={styles.slide}>
                  <ScrollView contentContainerStyle={styles.scrollContent}>
                    <Card style={styles.card}>
                      <Card.Title
                        title={category.name}
                        subtitle={`Predicted: ₹${category.predictedTotal} | Actual: ₹${category.actualTotal}`}
                        titleStyle={styles.title}
                        subtitleStyle={styles.subtitle}
                      />
                      <Card.Content style={styles.cardContent}>
                        {category.items.map(item => {
                          const input = tempInputs[item.id] || { label: '', amount: '', paidBy: '' };
                          const expenses = actualExpenses[item.id] || [];

                          return (
                            <View key={item.id} style={styles.section}>
                              <Text style={styles.expenseLabel}>{item.name}</Text>

                              <TextInput
                                label="What did you pay for?"
                                    theme={{ colors: { primary: '#FF8C00', background: '#fff' } }}

                                value={input.label}
                                onChangeText={(text) => handleTempInputChange(item.id, 'label', text)}
                                mode="flat"
                                style={styles.input}
                              />
                              <TextInput
                                label="Amount Spent (₹)"
                                    theme={{ colors: { primary: '#FF8C00', background: '#fff' } }}

                                value={input.amount}
                                onChangeText={(text) => handleTempInputChange(item.id, 'amount', text)}
                                keyboardType="numeric"
                                mode="flat"
                                style={styles.input}
                              />
                              <Picker
                                selectedValue={input.paidBy}
                                onValueChange={(value) => handleTempInputChange(item.id, 'paidBy', value)}
                                style={styles.picker}
                              >
                                <Picker.Item label="Select payer" value="" />
                                {members.map((name, index) => (
                                  <Picker.Item key={index} label={name} value={name} />
                                ))}
                              </Picker>

                              <Button
                                mode="contained"
                                buttonColor="#FF8C00"
                                style={styles.button}
                                labelStyle={styles.buttonText}
                                onPress={() => handleAddActualExpense(item.id)}
                              >
                                Add Expense
                              </Button>

                              {expenses.length > 0 && (
                                <View style={{ marginTop: 8,alignSelf:'center' }}>
                                  <Text style={styles.expenseLabel}>Recorded Payments:</Text>
                                  {expenses.map((exp) => (
                                    <Text key={exp.id} style={styles.recordedExpense}>
                                      • ₹{exp.amount} for "{exp.label}" by {exp.paidBy}
                                    </Text>
                                  ))}
                                </View>
                              )}
                            </View>
                          );
                        })}


                        <TextInput
                          label="Add New Item"
                          value={newItems[category.id]?.name || ''}
                          onChangeText={(text) => handleNewItemChange(category.id, 'name', text)}
                          mode="flat"
                              theme={{ colors: { primary: '#FF8C00', background: '#fff' } }}

                          style={styles.inputend}
                        />
                        <TextInput
                          label="Predicted Cost"
                          value={newItems[category.id]?.predicted || ''}
                          onChangeText={(text) => handleNewItemChange(category.id, 'predicted', text)}
                          keyboardType="numeric"
                          mode="flat"
                              theme={{ colors: { primary: '#FF8C00', background: '#fff' } }}

                          style={styles.inputend}
                        />
                        <Button
                          mode="contained"
                          buttonColor="#FF8C00"
                          style={styles.buttonend}
                          labelStyle={styles.buttonText}
                          onPress={() => handleAddNewItem(category.id)}
                        >
                          Add New Item
                        </Button>
                      </Card.Content>
                    </Card>
                  </ScrollView>
                </View>
              ))}
            </Swiper>
          </View>

          <Button
            mode="contained"
            buttonColor="#FF8C00"
            style={styles.backButton}
            labelStyle={styles.buttonText}
            onPress={() => setShowCategories(false)}
          >
            Back to Overview
          </Button>
        </View>
      )}
        </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: 'rgb(0, 0, 0)',
  },
  container: {
    padding: 16,
    paddingBottom: 20,
  },
  categoriesWrapper: {
    flex: 1,
    paddingHorizontal: 10,
    marginTop:10
    
  },
  swiperContainer: {
    flex: 1,
    marginBottom: 0,
  },
  swiper: {
    height: '100%',
  },
  slide: {
    flex: 1,
    height: '100%',
    
  },
  scrollContent: {
    paddingBottom: 10,
    
  },
  card: {
    marginBottom: 0,
    backgroundColor: '#111',
    borderRadius: 10,
    height: '100%',
        

  },

  card1:{
     marginBottom: 0,
    backgroundColor: '#111',
    borderRadius: 10,
    height: '30%',
  },
  cardContent: {
    paddingBottom: 0,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF8C00',
    marginBottom: 6,
    alignSelf:'center'
  },
  text: {
    color: '#fff',
    fontSize: 15,
  },
  subtitle: {
    color: '#FF8C00',
    fontSize: 13,
    marginBottom: 3,
        alignSelf:'center'

  },
  input: {
    backgroundColor: '#fff',
    marginBottom: 8,
    borderRadius: 8,
    height: 48,
    width:"100%",
    justifyContent:'center',
    alignSelf:'center'
  },
  picker: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 8,
    width:"100%",
    height: 52,
    justifyContent: 'center',
        alignSelf:'center'

  },
  button: {
        width:"100%",
    alignSelf:'center',

    backgroundColor: '#FF8C00',
    borderRadius: 6,
    marginTop: 6,
    paddingVertical: 5,
  },
  backButton: {
    backgroundColor: '#FF8C00',
    borderRadius: 6,
    margin: 10,
    marginBottom: 30,
  },
  buttonText: {
    color: '#000',
    fontSize: 15,
  },
  section: {
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
    paddingBottom: 6,
    justifyContent:'center',
    alignContent:'center',
    alignSelf:'center',
    width:'80%'
  },
  expenseLabel: {
    fontWeight: 'bold',
    color: '#FF8C00',
    marginBottom: 4,
    fontSize: 15,
    alignSelf:'center'
  },
  recordedExpense: {
    color: '#ccc',
    marginLeft: 8,
    marginTop: 2,
    fontSize: 14,
  },
  divider: {
    marginVertical: 10,
    backgroundColor: '#FF8C00',
    height: 1,
    width:"100%"
  },
  chartTitle: {
    alignSelf:'center',
    fontSize: 17,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 6,
    color: '#FF8C00',
  },
  chart: {
    borderRadius: 12,
    marginBottom: 80,
  },
  dot: {
    backgroundColor: 'rgba(255,255,255,.3)',
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 2,
    marginBottom: 2,
  },
  activeDot: {
    backgroundColor: '#FF8C00',
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 2,
    marginBottom: 2,
  },
  paginationStyle: {
    bottom: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
     nextButton: {
    color: '#FF8C00', // Orange color
    fontSize: 40,
    fontWeight: 'bold',
    marginRight: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
  prevButton: {
    color: '#FF8C00', // Orange color
    fontSize: 40,
    fontWeight: 'bold',
    marginLeft: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
    buttonText1: {
   color: '#FF8C00', 
    fontSize: 30,
    fontWeight: 'bold',
    marginTop: -3, // Adjust vertical alignment
  },
  inputend:{   backgroundColor: '#fff',
    marginBottom: 8,
    borderRadius: 8,
    height: 48,
    width:"80%",
    justifyContent:'center',
    alignSelf:'center'},

  buttonend:{
       width:"80%",
    alignSelf:'center',
marginBottom:10,
    backgroundColor: '#FF8C00',
    borderRadius: 6,
    marginTop: 6,
    paddingVertical: 5,
  },
});