import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, TextInput, Title, List, IconButton } from 'react-native-paper';

const ExpenseForm = ({ category, onAddItem, onRemoveItem }) => {
  const [itemName, setItemName] = useState('');
  const [predictedCost, setPredictedCost] = useState('');

  const handleAddItem = () => {
    if (itemName && predictedCost) {
      onAddItem(category.id, itemName, predictedCost);
      setItemName('');
      setPredictedCost('');
    }
  };

  return (
    <View style={styles.container}>
      <Title style={styles.categoryTitle}>{category.name}</Title>
      
      <View style={styles.inputRow}>
  <TextInput
    label="Item Name"
    value={itemName}
    onChangeText={setItemName}
    style={[styles.input, styles.nameInput]}
    theme={{ colors: { primary: '#FF8C00' } }}
    mode="flat"
  />
  <TextInput
    label="Budget"
    value={predictedCost}
    onChangeText={setPredictedCost}
    keyboardType="numeric"
    style={[styles.input, styles.costInput]}
    theme={{ colors: { primary: '#FF8C00' } }}
    mode="flat"
  />
 <Button 
  mode="contained" 
  onPress={handleAddItem}
  style={styles.addButton}
  buttonColor="#FF8C00"
  labelStyle={styles.addButtonLabel}
  contentStyle={styles.addButtonContent}
>
  Add
</Button>
</View>


      {category.items.map(item => (
        <View key={item.id} style={styles.itemContainer}>
          <List.Item
            title={item.name}
            titleStyle={{ color: 'black' }}
            description={`Predicted: ₹${item.predictedCost.toFixed(2)}`}
            descriptionStyle={{ color: 'black' }}
            right={() => (
              <IconButton 
                icon="delete" 
                onPress={() => onRemoveItem(category.id, item.id)}
                iconColor="white"
                containerColor="#FF8C00"
              />
            )}
          />
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 2,
    backgroundColor: '#000',
    borderRadius: 8,
  },
  categoryTitle: {
    fontSize: 18,
    marginBottom: 10,
    color: '#FF8C00',
    fontWeight: 'bold',
  },
inputRow: {
  flexDirection: 'row',
  alignItems: 'stretch',
  marginBottom: 10,
},

input: {
  backgroundColor: '#fff',
  height: 55, // Ensures same height
},

nameInput: {
  flex: 2,
    borderRadius: 8,

  marginRight: 5,
},

costInput: {
  flex: 1,
  marginRight: 5,
    borderRadius: 8,

},

addButton: {
  borderRadius: 8,
  justifyContent: 'center',
  alignItems: 'center',
  height: 55,
  marginTop: 0, // Ensure no vertical offset
},

addButtonContent: {
  height: 55,
  paddingVertical: 7, // Remove default padding
},

addButtonLabel: {
  fontSize: 16,
  color: '#000',
  paddingTop: 2, // Optional, tweak if needed for perfect vertical alignment
},


  itemContainer: {
    backgroundColor: '#FFE4B5',
    borderRadius: 8,
    marginBottom: 5,
  },
});

export default ExpenseForm;
