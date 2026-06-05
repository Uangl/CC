import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Palette, Radius, Spacing, Shadow, Typo } from '../constants/theme';

export function CaptureScreen({ navigation }: { navigation: any }) {
  const handleCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('需要相机权限', '请在设置中允许访问相机');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      navigation.navigate('CreateMistake', { imageUri: result.assets[0].uri });
    }
  };

  const handleGallery = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('需要相册权限', '请在设置中允许访问相册');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      navigation.navigate('CreateMistake', { imageUri: result.assets[0].uri });
    }
  };

  const handleManual = () => {
    navigation.navigate('CreateMistake', { imageUri: undefined });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>拍下错题</Text>
        <Text style={styles.subtitle}>
          拍照或从相册选择错题图片，也可以手动录入
        </Text>

        <View style={styles.options}>
          <TouchableOpacity style={styles.optionCard} onPress={handleCamera} activeOpacity={0.85}>
            <View style={styles.iconCircle}>
              <Text style={styles.optionIcon}>📸</Text>
            </View>
            <View style={styles.optionTextWrap}>
              <Text style={styles.optionTitle}>拍照</Text>
              <Text style={styles.optionDesc}>用相机拍下错题</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.optionCard} onPress={handleGallery} activeOpacity={0.85}>
            <View style={styles.iconCircle}>
              <Text style={styles.optionIcon}>🖼️</Text>
            </View>
            <View style={styles.optionTextWrap}>
              <Text style={styles.optionTitle}>从相册选择</Text>
              <Text style={styles.optionDesc}>选择已有的错题照片</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.optionCard} onPress={handleManual} activeOpacity={0.85}>
            <View style={styles.iconCircle}>
              <Text style={styles.optionIcon}>✏️</Text>
            </View>
            <View style={styles.optionTextWrap}>
              <Text style={styles.optionTitle}>手动录入</Text>
              <Text style={styles.optionDesc}>直接输入题目内容</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Palette.bg,
  },
  container: {
    flex: 1,
    padding: Spacing.xl,
  },
  title: {
    ...Typo.h2,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...Typo.caption,
    marginBottom: Spacing.xxl,
    lineHeight: 20,
  },
  options: {
    gap: Spacing.lg,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    ...Shadow,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: Radius.full,
    backgroundColor: Palette.primaryBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.lg,
  },
  optionIcon: {
    fontSize: 28,
  },
  optionTextWrap: {
    flex: 1,
  },
  optionTitle: {
    ...Typo.h3,
    marginBottom: 2,
  },
  optionDesc: {
    ...Typo.caption,
  },
});
