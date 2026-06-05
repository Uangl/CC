import React from 'react';
import { Text, ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Palette, Radius } from '../constants/theme';
import { useAuthStore } from '../store/authStore';

import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { CaptureScreen } from '../screens/CaptureScreen';
import { CreateMistakeScreen } from '../screens/CreateMistakeScreen';
import { MistakeListScreen } from '../screens/MistakeListScreen';
import { MistakeDetailScreen } from '../screens/MistakeDetailScreen';
import { FeynmanCoachScreen } from '../screens/FeynmanCoachScreen';
import { VariantPracticeScreen } from '../screens/VariantPracticeScreen';
import { ReviewScreen } from '../screens/ReviewScreen';
import { WeakPointsScreen } from '../screens/WeakPointsScreen';
import { ParentReportScreen } from '../screens/ParentReportScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { AdminScreen } from '../screens/AdminScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  const icons: Record<string, string> = {
    '今日': '📅',
    '错题': '📚',
    '薄弱点': '📊',
    '周报': '📋',
    '我的': '👤',
    '管理': '⚙️',
  };
  return (
    <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.4 }}>
      {icons[label] || '📌'}
    </Text>
  );
}

const screenOpts = {
  headerStyle: { backgroundColor: Palette.bg },
  headerTintColor: Palette.text,
  headerShadowVisible: false,
  headerBackTitleVisible: false,
};

function HomeStack() {
  return (
    <Stack.Navigator screenOptions={screenOpts}>
      <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Capture" component={CaptureScreen} options={{ title: '拍错题' }} />
      <Stack.Screen name="CreateMistake" component={CreateMistakeScreen} options={{ title: '创建错题' }} />
      <Stack.Screen name="MistakeDetail" component={MistakeDetailScreen} options={{ title: '错题详情' }} />
      <Stack.Screen name="FeynmanCoach" component={FeynmanCoachScreen} options={{ title: '费曼讲题' }} />
      <Stack.Screen name="VariantPractice" component={VariantPracticeScreen} options={{ title: '变式练习' }} />
      <Stack.Screen name="Review" component={ReviewScreen} options={{ title: '今日复习' }} />
    </Stack.Navigator>
  );
}

function MistakeStack() {
  return (
    <Stack.Navigator screenOptions={screenOpts}>
      <Stack.Screen name="MistakeList" component={MistakeListScreen} options={{ headerShown: false }} />
      <Stack.Screen name="MistakeDetail" component={MistakeDetailScreen} options={{ title: '错题详情' }} />
      <Stack.Screen name="FeynmanCoach" component={FeynmanCoachScreen} options={{ title: '费曼讲题' }} />
      <Stack.Screen name="VariantPractice" component={VariantPracticeScreen} options={{ title: '变式练习' }} />
    </Stack.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

function MainTabs() {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'admin';

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused }) => <TabIcon label={route.name} focused={focused} />,
        tabBarActiveTintColor: Palette.primary,
        tabBarInactiveTintColor: Palette.textMuted,
        tabBarStyle: {
          backgroundColor: Palette.surface,
          borderTopColor: Palette.border,
          paddingBottom: 4,
          height: 56,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '500' as const },
        headerShown: false,
      })}
    >
      <Tab.Screen name="今日" component={HomeStack} />
      <Tab.Screen name="错题" component={MistakeStack} />
      <Tab.Screen name="薄弱点" component={WeakPointsScreen}
        options={{ headerShown: true, headerStyle: { backgroundColor: Palette.bg }, headerShadowVisible: false, headerTitle: '' }}
      />
      <Tab.Screen name="周报" component={ParentReportScreen}
        options={{ headerShown: true, headerStyle: { backgroundColor: Palette.bg }, headerShadowVisible: false, headerTitle: '' }}
      />
      {isAdmin && (
        <Tab.Screen name="管理" component={AdminScreen}
          options={{ headerShown: true, headerStyle: { backgroundColor: Palette.bg }, headerShadowVisible: false, headerTitle: '' }}
        />
      )}
      <Tab.Screen name="我的" component={SettingsScreen}
        options={{ headerShown: true, headerStyle: { backgroundColor: Palette.bg }, headerShadowVisible: false, headerTitle: '' }}
      />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Palette.bg }}>
        <ActivityIndicator size="large" color={Palette.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? <MainTabs /> : <AuthStack />}
    </NavigationContainer>
  );
}
