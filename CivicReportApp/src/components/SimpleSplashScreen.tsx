import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface SimpleSplashScreenProps {
  onFinish?: () => void;
}

const SimpleSplashScreen: React.FC<SimpleSplashScreenProps> = ({ onFinish }) => {
  useEffect(() => {
    console.log('🎯 SimpleSplashScreen mounted');
  }, []);

  const handleContinue = () => {
    console.log('🎯 Continue button pressed');
    onFinish?.();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>NIVARAN</Text>
      <Text style={styles.subtitle}>Civic Issue Reporter</Text>
      <TouchableOpacity style={styles.button} onPress={handleContinue}>
        <Text style={styles.buttonText}>Get Started</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#232323',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#54AF60',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#FFFFFF',
    marginBottom: 40,
  },
  button: {
    backgroundColor: '#54AF60',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 25,
  },
  buttonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SimpleSplashScreen;