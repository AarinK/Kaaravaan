import { useState, useRef,useEffect } from 'react';
import {Keyboard,
  KeyboardAvoidingView,
 Animated, TouchableWithoutFeedback, Platform } from 'react-native';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, TextInput, Title, Divider, Text,ActivityIndicator } from 'react-native-paper';
import { executeSql } from '@/lib/expense/database';
import ExpenseForm from '@/components/expense/ExpenseForm';
import { calculateCategoryTotals } from '@/lib/expense/calculations';
import { ThemedView } from '@/components/ThemedView';
import { router } from 'expo-router';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

const generateUniqueId = () => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

const defaultCategories = ['Transport', 'Stay', 'Food', 'Activities', 'Other'];

export default function Add() {
  const [tripName, setTripName] = useState('');
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [memberName, setMemberName] = useState('');
const [members, setMembers] = useState<string[]>([]);
const addScale = useRef(new Animated.Value(1)).current;

const handleAddPressIn = () => {
  Animated.spring(addScale, {
    toValue: 0.95,
    useNativeDriver: true,
  }).start();
};

const handleAddPressOut = () => {
  Animated.spring(addScale, {
    toValue: 1,
    friction: 3,
    tension: 40,
    useNativeDriver: true,
  }).start(() => {
    if (memberName.trim()) {
      setMembers(prev => [...prev, memberName.trim()]);
      setMemberName('');
    }
  });
};


  const [categories, setCategories] = useState(
    defaultCategories.map(name => ({
      id: generateUniqueId(),
      name,
      predictedTotal: 0,
      actualTotal: 0,
      items: [] as any[]
    }))
  );

  const scaleAnim = useRef(new Animated.Value(1)).current;

const handlePressIn = () => {
  Animated.spring(scaleAnim, {
    toValue: 0.95,
    useNativeDriver: true,
  }).start();
};

const handlePressOut = () => {
  
  Animated.spring(scaleAnim, {
    toValue: 1,
    friction: 3,
    tension: 40,
    useNativeDriver: true,
  }).start(() => {
    saveTrip(); // Call the original saveTrip on release
  });
};

useEffect(() => {
  const timer = setTimeout(() => {
    setLoading(false);
  }, 1000); // 1 second

  return () => clearTimeout(timer);
}, []);



  const handleAddExpenseItem = (categoryId: string, itemName: string, predictedCost: string) => {
    setCategories(prev =>
      prev.map(cat =>
        cat.id === categoryId
          ? {
              ...cat,
              items: [...cat.items, {
                id: generateUniqueId(),
                name: itemName,
                predictedCost: parseFloat(predictedCost) || 0,
                actualCost: 0
              }]
            }
          : cat
      )
    );
  };

  const handleRemoveExpenseItem = (categoryId: string, itemId: string) => {
    setCategories(prev =>
      prev.map(cat =>
        cat.id === categoryId
          ? { ...cat, items: cat.items.filter(item => item.id !== itemId) }
          : cat
      )
    );
  };

const saveTrip = async () => {
  console.log('Save Trip button pressed');

  if (!tripName || !destination || !startDate || !endDate) {
    console.log('Validation failed: Please fill in all trip details');
    alert('Please fill in all trip details');
    return;
  }

  const tripId = generateUniqueId();
  console.log('Generated Trip ID:', tripId);

  try {
    console.log('Inserting trip into database...');
    await executeSql(
      'INSERT INTO trips (id, name, destination, startDate, endDate, members) VALUES (?, ?, ?, ?, ?, ?)',
      [tripId, tripName, destination, startDate, endDate, JSON.stringify(members)]
    );
    console.log('Trip inserted successfully');

    // ✅ Insert members into trip_members table
    for (const name of members) {
      const memberId = generateUniqueId();
      await executeSql(
        'INSERT INTO trip_members (id, trip_id, name) VALUES (?, ?, ?)',
        [memberId, tripId, name]
      );
    }
    console.log('Members inserted successfully');

    for (const category of categories) {
      console.log('Processing category:', category.name);
      const { predictedTotal } = calculateCategoryTotals(category.items);
      console.log('Calculated predicted total for category:', predictedTotal);

      await executeSql(
        'INSERT INTO expense_categories (id, trip_id, name, predictedTotal) VALUES (?, ?, ?, ?)',
        [category.id, tripId, category.name, predictedTotal]
      );
      console.log('Category inserted successfully');

      for (const item of category.items) {
        console.log('Inserting item:', item.name);
        await executeSql(
          'INSERT INTO expense_items (id, category_id, name, predictedCost) VALUES (?, ?, ?, ?)',
          [item.id, category.id, item.name, item.predictedCost]
        );
        console.log('Item inserted successfully');
      }
    }

    console.log('All data saved successfully. Navigating to trip details...');
    console.log('Navigating to route:', `/${tripId}`);
    router.push(`/${tripId}`);
  } catch (error) {
    console.error('Error saving trip:', error);
    alert('Failed to save trip');
  }
};



  if (loading) {
  return (
    <View style={styles.loaderContainer}>
      <ActivityIndicator size="large" color="#FF8C00" />
    </View>
  );
}
return (
    <KeyboardAwareScrollView
    contentContainerStyle={styles.container}
    enableOnAndroid={true}
    extraScrollHeight={200}
    keyboardOpeningTime={0}
    enableAutomaticScroll={true}
  > 
           <ScrollView contentContainerStyle={styles.container}>
  <TouchableWithoutFeedback >
    <ThemedView style={{ flex: 1, backgroundColor: '#000' }}>
      <Title style={styles.title}>Plan Your Trip</Title>

     <View style={styles.lightContainer}>
  <TextInput
    label="Trip Name"
    value={tripName}
    onChangeText={setTripName}
    style={styles.outlinedInput}
    theme={{ colors: { primary: '#FF8C00', background: '#fff' } }}
    mode="flat"
  />

  <TextInput
    label="Destination"
    value={destination}
    onChangeText={setDestination}
    style={styles.outlinedInput}
    theme={{ colors: { primary: '#FF8C00', background: '#fff' } }}
    mode="flat"
  />

  <View style={styles.dateRow}>
    <TextInput
      label="Start Date (YYYY-MM-DD)"
      value={startDate}
      onChangeText={setStartDate}
      keyboardType="numbers-and-punctuation"
      style={[styles.outlinedInput, styles.dateInput]}
      theme={{ colors: { primary: '#FF8C00', background: '#fff' } }}
      mode="flat"
    />
    <TextInput
      label="End Date (YYYY-MM-DD)"
      value={endDate}
      onChangeText={setEndDate}
      keyboardType="numbers-and-punctuation"
      style={[styles.outlinedInput, styles.dateInput]}
      theme={{ colors: { primary: '#FF8C00', background: '#fff' } }}
      mode="flat"
    />
  </View>
</View>


      <Text style={styles.sectionTitle}>Trip Members</Text>

<View style={styles.lightContainer}>
        <TextInput
          label="Member Name"
          value={memberName}
          onChangeText={setMemberName}
          style={[styles.outlinedInput, styles.memberInput]}
          theme={{ colors: { primary: '#FF8C00', background: '#fff' } }}
          mode="flat"
        />
        <TouchableWithoutFeedback onPressIn={handleAddPressIn} onPressOut={handleAddPressOut}>
  <Animated.View style={{ transform: [{ scale: addScale }] }}>
    <Button
      mode="contained"
      style={styles.addButton}
      buttonColor="#FF8C00"
      labelStyle={{ color: '#000' }}
      contentStyle={{ height: 55 }}
    >
      Add
    </Button>
  </Animated.View>
</TouchableWithoutFeedback>

      </View>

      {members.length > 0 && (
        <View style={styles.membersList}>
          {members.map((member, idx) => (
            <View key={idx} style={styles.memberItem}>
              <Text style={styles.memberText}>{member}</Text>
              <Button
                
                onPress={() =>
                  setMembers(prev => prev.filter((_, index) => index !== idx))
                }
                compact
                textColor="#FF8C00"
                style={styles.removeButton}
              >X</Button>
            </View>
          ))}
        </View>
      )}

      <Text style={styles.sectionTitle}>Expense Categories:</Text>

      {categories.map(category => (
        <ExpenseForm
          key={category.id}
          category={category}
          onAddItem={handleAddExpenseItem}
          onRemoveItem={handleRemoveExpenseItem}
        />
      ))}

      <TouchableWithoutFeedback onPressIn={handlePressIn} onPressOut={handlePressOut}>
        <Animated.View style={[styles.animatedButton, { transform: [{ scale: scaleAnim }] }]}>
          <Button mode="contained" style={styles.saveButton} textColor="#fff">
            Save Trip
          </Button>
        </Animated.View>
      </TouchableWithoutFeedback>
    </ThemedView>
  </TouchableWithoutFeedback>
</ScrollView>
</KeyboardAwareScrollView>

);
}

const styles = StyleSheet.create({
  membersList: {
  marginBottom: 20,
  gap: 8,
},
memberItem: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  backgroundColor: '#FF8C00',
  paddingVertical: 8,
  paddingHorizontal: 12,
  borderRadius: 8,
  borderColor: '#FF8C00',
  borderWidth: 1,
},
memberText: {
  color: '#000',
  fontSize: 16,
},
removeButton: {
  backgroundColor: '#000',
  marginLeft: 10,
  justifyContent: 'center',
  alignItems: 'center',
  width:'10%'

},

  container: {
    padding: 20,
    backgroundColor: '#000', // Soft warm background
  },
  title: {
    marginBottom: 20,
    marginTop:-20,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF8C00', // Orange highlight for main title
  },
 input: {
  marginBottom: 15,
 
    borderRadius: 8,
  color: '#FF8C00', // Orange text
    
},
lightContainer: {
  backgroundColor: '#000',
  padding: 0,
  borderRadius: 10,
  marginBottom: 20,
},

// dateInput: {
//   width: '48%',
//   backgroundColor: '#000', // Black background
//   borderBottomWidth: 2,
//   borderColor: '#FF8C00',
//   borderRadius: 0,
//   color: '#FF8C00',
  
// },

//   dateRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//   },

  divider: {
    marginVertical: 20,
    height: 1,
    backgroundColor: '#ddd',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#FF8C00', // Orange section title
  },
  saveButton: {
    marginTop: 20,
    marginBottom: 40,
    backgroundColor: '#FF8C00', // Orange button
    borderRadius: 5,
  },
  tripDetailsContainer: {
  backgroundColor: '#000',
  padding: 15,
  borderRadius: 10,
  marginBottom: 20,
},
animatedButton: {
  borderRadius: 5,
  overflow: 'hidden',
},
loaderContainer: {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: '#000',
},

outlinedInput: {
  backgroundColor: '#fff',
  height: 55,
  marginBottom: 12,
  borderRadius: 8,
  width:'100%'
},

dateRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
},

dateInput: {
  flex: 1,
  marginHorizontal:2
},

memberRow: {
  flexDirection: 'row',
  alignItems: 'center',
  marginBottom: 15,
},

memberInput: {
  alignSelf:'center',
  width:'100%',
  flex: 1,
  marginRight: 10,
},

addButton: {
  borderRadius: 8,
  justifyContent: 'center',
  alignItems: 'center',
   alignSelf:'center',
  height: 55,
  width:'60%',
  marginTop: 2,
},


});


