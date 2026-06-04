import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { AppNavigator } from './src/navigation/AppNavigator';
import { useMistakeStore } from './src/store/mistakeStore';

export default function App() {
  const initialize = useMistakeStore((s) => s.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <>
      <StatusBar style="dark" />
      <AppNavigator />
    </>
  );
}
