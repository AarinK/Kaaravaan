import { Tabs } from 'expo-router';

import Ionicons from '@expo/vector-icons/Ionicons';


export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#FF8C00',
        headerStyle: {
          backgroundColor: '#000',
        },
        headerShadowVisible: false,
        headerTintColor: '#fff',
        tabBarStyle: {
          backgroundColor: '#000',
        },
      }}
    >

      <Tabs.Screen
        name="index"
        options={{
          headerShown:false,
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home-sharp' : 'home-outline'} color={color} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: 'Add Trip',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'add-circle' : 'add-circle-outline'} color={color} size={24}/>
          ),
        }}
      />
       <Tabs.Screen
        name="track"
        options={{
          title: 'Track trips',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'analytics' : 'analytics-outline'} color={color} size={24}/>
          ),
        }}
      />
    
    
    </Tabs>
  );
}
