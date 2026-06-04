import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  SafeAreaView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMistakeStore } from '../store/mistakeStore';
import { Colors } from '../constants/colors';
import { Features } from '../services';

export function SettingsScreen() {
  const initialize = useMistakeStore((s) => s.initialize);

  const handleClearData = () => {
    Alert.alert('清除数据', '确定要清除所有错题数据吗？此操作不可恢复。', [
      { text: '取消', style: 'cancel' },
      {
        text: '清除',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.removeItem('cuoti_mistakes');
          await initialize();
          Alert.alert('已重置', '数据已恢复为示例数据');
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        <Text style={styles.title}>我的</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>关于</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>应用名称</Text>
              <Text style={styles.infoValue}>错题小老师</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>版本</Text>
              <Text style={styles.infoValue}>1.0.0 MVP</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>定位</Text>
              <Text style={styles.infoValue}>小学数学AI错题补弱</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>智能服务</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>AI讲题 / 变式题（智谱）</Text>
              <Text
                style={[
                  styles.infoValue,
                  { color: Features.aiEnabled ? Colors.green : Colors.textLight },
                ]}
              >
                {Features.aiEnabled ? '已启用' : '未配置'}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>拍题识别（百度OCR）</Text>
              <Text
                style={[
                  styles.infoValue,
                  { color: Features.ocrEnabled ? Colors.green : Colors.textLight },
                ]}
              >
                {Features.ocrEnabled ? '已启用' : '未配置'}
              </Text>
            </View>
          </View>
          {(!Features.aiEnabled || !Features.ocrEnabled) && (
            <Text style={styles.hintNote}>
              未配置时自动使用本地模拟，功能可正常体验。在 .env 中填入 key
              并重启（npx expo start -c）即可启用真实服务。
            </Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>学习理念</Text>
          <View style={styles.conceptCard}>
            <Text style={styles.conceptText}>
              不是把错题存起来，而是把错题讲明白、练透、清掉。
            </Text>
          </View>
          <View style={styles.conceptCard}>
            <Text style={styles.conceptText}>
              每天只讲 1 道代表性错题，不要一次刷太多。少量高质量复习，效果最好。
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>数据管理</Text>
          <TouchableOpacity style={styles.dangerBtn} onPress={handleClearData}>
            <Text style={styles.dangerBtnText}>重置为示例数据</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>隐私说明</Text>
          <View style={styles.privacyCard}>
            <Text style={styles.privacyText}>
              • 所有数据仅保存在本地设备{'\n'}
              • 不收集真实姓名、学校等信息{'\n'}
              • 不含社交、排名功能{'\n'}
              • 专注学习，保护未成年人隐私
            </Text>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 10,
  },
  infoCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 4,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  infoLabel: {
    fontSize: 14,
    color: Colors.text,
  },
  infoValue: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  hintNote: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginTop: 8,
    paddingHorizontal: 4,
  },
  conceptCard: {
    backgroundColor: Colors.primary + '08',
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
  },
  conceptText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 22,
  },
  dangerBtn: {
    backgroundColor: Colors.error + '10',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  dangerBtnText: {
    color: Colors.error,
    fontSize: 15,
    fontWeight: '600',
  },
  privacyCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
  },
  privacyText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
});
