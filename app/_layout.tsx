import React, { useEffect, useState } from 'react';
import { View, Image, StyleSheet, Dimensions } from 'react-native';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from '@/hooks/useColorScheme';
import { initDatabase } from '@/lib/expense/database';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [showSplash, setShowSplash] = useState(true);
  const [fontsLoaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    const initialize = async () => {
      await initDatabase();
      console.log("database")
      await new Promise(resolve => setTimeout(resolve, 1500)); // 2 seconds splash
      setShowSplash(false);
    };
    initialize();
  }, []);

  if (showSplash || !fontsLoaded) {
    return (
      <View style={styles.splashContainer}>
        <Image
          source={require('../assets/images/splash-screen.png')}
          style={styles.splashImage}
          resizeMode="cover"
        />
      </View>
    );
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
        <Stack.Screen name="[id]" options={{ title: 'Trip Summary' }}/>
        <Stack.Screen name="end" options={{ title: 'Complete Your Trip' }}/>
        <Stack.Screen name="tripDetails" options={{ title: 'Trip Summary' }}/>

      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashImage: {
    width: Dimensions.get('window').width * 0.8,
    height: Dimensions.get('window').height * 0.5,
  },
});
