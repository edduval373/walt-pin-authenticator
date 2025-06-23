import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { enableScreens } from 'react-native-screens';

// Import screens
import SplashScreen from './src/screens/SplashScreen';
import OverviewScreen from './src/screens/OverviewScreen';
import CameraScreen from './src/screens/CameraScreen';
import ProcessingScreen from './src/screens/ProcessingScreen';
import ResultsScreen from './src/screens/ResultsScreen';

// Enable screens for better performance
enableScreens();

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="dark" backgroundColor="#eef2ff" />
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false,
          gestureEnabled: true,
          cardStyle: { backgroundColor: '#eef2ff' }
        }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Overview" component={OverviewScreen} />
        <Stack.Screen name="Camera" component={CameraScreen} />
        <Stack.Screen name="Processing" component={ProcessingScreen} />
        <Stack.Screen name="Results" component={ResultsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}