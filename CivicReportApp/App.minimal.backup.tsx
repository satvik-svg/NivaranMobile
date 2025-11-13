import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function App() {
  console.log('🚀 Minimal App starting...');
  
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Hello from Nivaran!</Text>
      <Text style={styles.subtext}>If you see this, the app is working!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#232323',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#54AF60',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtext: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
  },
});