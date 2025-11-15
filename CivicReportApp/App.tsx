import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import SetupGuideScreen from './src/screens/SetupGuideScreen';
import SplashScreen from './src/components/SplashScreen';
import { AuthService } from './src/services/authService';
import { isSupabaseConfigured, supabase } from './src/services/supabase';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [supabaseConfigured, setSupabaseConfigured] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  useEffect(() => {
    console.log('🚀 App starting up...');
    
    // TEMPORARY: Development mode bypass for network issues
    const DEVELOPMENT_MODE = true; // Set to false for production
    
    if (DEVELOPMENT_MODE) {
      console.log('🔧 Development mode: Bypassing authentication');
      setSupabaseConfigured(true);
      setIsAuthenticated(true);
      setIsLoading(false);
      return;
    }
    
    // Add a timeout to prevent infinite loading
    const initTimeout = setTimeout(() => {
      console.log('⏰ App initialization timeout, proceeding anyway');
      setIsLoading(false);
    }, 10000); // 10 second timeout
    
    try {
      // Check if Supabase is configured
      const configured = isSupabaseConfigured();
      console.log('🔧 Supabase configured:', configured);
      setSupabaseConfigured(!!configured);

      if (configured) {
        // Check initial auth state with error handling
        checkAuthState().finally(() => {
          clearTimeout(initTimeout);
        });

        // Listen for auth state changes with error handling
        try {
          const { data: { subscription } } = AuthService.onAuthStateChange(async (user) => {
            console.log('🔄 Auth state changed in App:', user?.email);
            
            if (user) {
              // User is authenticated, check if profile exists
              try {
                const profile = await AuthService.getCurrentUser();
                console.log('🔄 Profile exists:', !!profile);
                setIsAuthenticated(!!profile);
              } catch (error) {
                console.log('🔄 Profile check failed but user exists, considering authenticated');
                setIsAuthenticated(true);
              }
            } else {
              console.log('🔄 No user, setting unauthenticated');
              setIsAuthenticated(false);
            }
            
            setIsLoading(false);
          });

          return () => {
            console.log('🧹 Cleaning up auth listener');
            subscription?.unsubscribe();
            clearTimeout(initTimeout);
          };
        } catch (error) {
          console.error('❌ Error setting up auth listener:', error);
          setIsLoading(false);
          clearTimeout(initTimeout);
        }
      } else {
        console.log('⚠️ Supabase not configured, showing setup guide');
        setIsLoading(false);
        clearTimeout(initTimeout);
      }
    } catch (error) {
      console.error('❌ Error in app initialization:', error);
      setIsLoading(false);
      clearTimeout(initTimeout);
    }
  }, []);

  const checkAuthState = async () => {
    try {
      console.log('🔍 Checking initial auth state...');
      
      // Add timeout for auth operations
      const authTimeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Auth check timeout')), 5000)
      );
      
      // Race between auth check and timeout
      await Promise.race([
        (async () => {
          // Simplified auth check - just check if supabase session exists
          if (supabase) {
            const { data: { session }, error } = await supabase.auth.getSession();
            console.log('🔍 Session check result:', { 
              hasSession: !!session, 
              userEmail: session?.user?.email,
              error 
            });
            
            if (session?.user) {
              console.log('🔍 Session found, user authenticated');
              setIsAuthenticated(true);
            } else {
              console.log('🔍 No session found');
              setIsAuthenticated(false);
            }
          } else {
            setIsAuthenticated(false);
          }
        })(),
        authTimeout
      ]);
    } catch (error) {
      console.error('❌ Error checking auth state:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (showSplash || isLoading) {
    return (
      <SplashScreen 
        onFinish={() => {
          setShowSplash(false);
          setHasCompletedOnboarding(true);
        }} 
      />
    );
  }

  if (!supabaseConfigured) {
    return (
      <SafeAreaProvider>
        <StatusBar style="auto" />
        <SetupGuideScreen />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <AppNavigator 
        isAuthenticated={isAuthenticated} 
        hasCompletedOnboarding={hasCompletedOnboarding}
      />
    </SafeAreaProvider>
  );
}
