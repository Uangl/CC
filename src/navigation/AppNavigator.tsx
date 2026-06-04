import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text } from 'react-native';
import { Colors } from '../constants/colors';

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

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  const icons: Record<string, string> = {
    '今日': '📅',
    '错题': '📚',
    '薄弱点': '📊',
    '周报': '📋',
    '我的': '👤',
  };
  return (
    <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>
      {icons[label] || '📌'}
    </Text>
  );
}

function HomeStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: Colors.background },
        headerTintColor: Colors.text,
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Capture"
        component={CaptureScreen}
        options={{ title: '拍错题' }}
      />
      <Stack.Screen
        name="CreateMistake"
        component={CreateMistakeScreen}
        options={{ title: '创建错题' }}
      />
      <Stack.Screen
        name="MistakeDetail"
        component={MistakeDetailScreen}
        options={{ title: '错题详情' }}
      />
      <Stack.Screen
        name="FeynmanCoach"
        component={FeynmanCoachScreen}
        options={{ title: '费曼讲题' }}
      />
      <Stack.Screen
        name="VariantPractice"
        component={VariantPracticeScreen}
        options={{ title: '变式练习' }}
      />
      <Stack.Screen
        name="Review"
        component={ReviewScreen}
        options={{ title: '今日复习' }}
      />
    </Stack.Navigator>
  );
}

function MistakeStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: Colors.background },
        headerTintColor: Colors.text,
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="MistakeList"
        component={MistakeListScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="MistakeDetail"
        component={MistakeDetailScreen}
        options={{ title: '错题详情' }}
      />
      <Stack.Screen
        name="FeynmanCoach"
        component={FeynmanCoachScreen}
        options={{ title: '费曼讲题' }}
      />
      <Stack.Screen
        name="VariantPractice"
        component={VariantPracticeScreen}
        options={{ title: '变式练习' }}
      />
    </Stack.Navigator>
  );
}

export function AppNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused }) => (
            <TabIcon label={route.name} focused={focused} />
          ),
          tabBarActiveTintColor: Colors.primary,
          tabBarInactiveTintColor: Colors.textLight,
          tabBarStyle: {
            backgroundColor: Colors.surface,
            borderTopColor: Colors.border,
            paddingBottom: 4,
            height: 56,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '500',
          },
          headerShown: false,
        })}
      >
        <Tab.Screen name="今日" component={HomeStack} />
        <Tab.Screen name="错题" component={MistakeStack} />
        <Tab.Screen
          name="薄弱点"
          component={WeakPointsScreen}
          options={{
            headerShown: true,
            headerStyle: { backgroundColor: Colors.background },
            headerShadowVisible: false,
            headerTitle: '',
          }}
        />
        <Tab.Screen
          name="周报"
          component={ParentReportScreen}
          options={{
            headerShown: true,
            headerStyle: { backgroundColor: Colors.background },
            headerShadowVisible: false,
            headerTitle: '',
          }}
        />
        <Tab.Screen
          name="我的"
          component={SettingsScreen}
          options={{
            headerShown: true,
            headerStyle: { backgroundColor: Colors.background },
            headerShadowVisible: false,
            headerTitle: '',
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
