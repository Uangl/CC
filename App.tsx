import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { AppNavigator } from './src/navigation/AppNavigator';
import { useAuthStore } from './src/store/authStore';
import { useMistakeStore } from './src/store/mistakeStore';
import { loadApiUrl } from './src/services/api/client';

export default function App() {
  const initAuth = useAuthStore((s) => s.initialize);
  const initMistakes = useMistakeStore((s) => s.initialize);

  useEffect(() => {
    loadApiUrl().then(() => {
      initAuth();
      initMistakes();
    });
  }, [initAuth, initMistakes]);

  return (
    <>
      <StatusBar style="dark" />
      <AppNavigator />
    </>
  );
}
