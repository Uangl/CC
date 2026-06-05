import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  TextInput,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Palette, Radius, Spacing, Shadow, Typo } from '../constants/theme';
import { useMistakeStore } from '../store/mistakeStore';
import { useAuthStore } from '../store/authStore';
import { backendEnabled } from '../services';
import { getApiUrl, setApiUrl } from '../services/api/client';

export function SettingsScreen() {
  const { user, logout } = useAuthStore();
  const initMistakes = useMistakeStore((s) => s.initialize);
  const [serverUrl, setServerUrl] = useState(getApiUrl());
  const [editingUrl, setEditingUrl] = useState(false);

  const handleLogout = () => {
    Alert.alert('退出登录', '确定要退出吗？', [
      { text: '取消', style: 'cancel' },
      { text: '退出', style: 'destructive', onPress: () => logout() },
    ]);
  };

  const handleClearData = () => {
    Alert.alert('清除数据', '确定要清除所有本地数据吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '清除',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.removeItem('cuoti_mistakes');
          await initMistakes();
          Alert.alert('已重置');
        },
      },
    ]);
  };

  const handleSaveUrl = async () => {
    await setApiUrl(serverUrl.trim());
    setEditingUrl(false);
    Alert.alert('已保存', '重启 App 生效');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={Typo.h2}>我的</Text>

        {user && (
          <View style={styles.profileCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{user.nickname?.[0] || '?'}</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{user.nickname}</Text>
              <Text style={styles.profileMeta}>
                {user.phone} · {user.grade}年级 · {user.role === 'admin' ? '管理员' : '学生'}
              </Text>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>服务状态</Text>
          <View style={styles.card}>
            <Row label="后端连接" value={backendEnabled ? '已连接' : '离线模式'}
              valueColor={backendEnabled ? Palette.success : Palette.textMuted} />
            <Row label="AI 服务（DeepSeek）" value={backendEnabled ? '服务端代理' : '本地模拟'}
              valueColor={backendEnabled ? Palette.success : Palette.textMuted} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>服务器地址</Text>
          {editingUrl ? (
            <View style={styles.urlEditRow}>
              <TextInput
                style={styles.urlInput}
                value={serverUrl}
                onChangeText={setServerUrl}
                autoCapitalize="none"
                placeholder="http://192.168.x.x:3000"
                placeholderTextColor={Palette.textMuted}
              />
              <TouchableOpacity style={styles.urlSaveBtn} onPress={handleSaveUrl}>
                <Text style={styles.urlSaveBtnText}>保存</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.card} onPress={() => setEditingUrl(true)}>
              <Text style={Typo.caption}>{serverUrl || '未配置'}</Text>
              <Text style={styles.editHint}>点击修改</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>学习理念</Text>
          <View style={styles.ideaCard}>
            <Text style={styles.ideaText}>
              不是把错题存起来，而是把错题讲明白、练透、清掉。
            </Text>
          </View>
          <View style={styles.ideaCard}>
            <Text style={styles.ideaText}>
              每天只讲 1 道代表性错题，少量高质量复习，效果最好。
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>隐私说明</Text>
          <View style={styles.card}>
            <Text style={Typo.caption}>
              • 不收集真实姓名、学校等信息{'\n'}
              • 不含社交、排名功能{'\n'}
              • 专注学习，保护未成年人隐私
            </Text>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.dangerBtn} onPress={handleClearData}>
            <Text style={styles.dangerBtnText}>重置本地数据</Text>
          </TouchableOpacity>
          {user && user.phone !== 'offline' && (
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
              <Text style={styles.logoutBtnText}>退出登录</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <View style={rowStyles.row}>
      <Text style={Typo.body}>{label}</Text>
      <Text style={[Typo.caption, { fontWeight: '600', color: valueColor || Palette.textSecondary }]}>
        {value}
      </Text>
    </View>
  );
}

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Palette.divider,
  },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Palette.bg },
  container: { flex: 1, padding: Spacing.xl },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
    ...Shadow,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Palette.primaryBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.lg,
  },
  avatarText: { color: Palette.primary, fontSize: 22, fontWeight: '700' },
  profileInfo: { flex: 1 },
  profileName: { ...Typo.h3, marginBottom: 2 },
  profileMeta: { ...Typo.caption },
  section: { marginBottom: Spacing.xl },
  sectionTitle: { ...Typo.label, color: Palette.textSecondary, marginBottom: Spacing.sm },
  card: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    ...Shadow,
  },
  urlEditRow: { flexDirection: 'row', gap: 8 },
  urlInput: {
    flex: 1,
    backgroundColor: Palette.surface,
    borderRadius: Radius.sm,
    padding: 12,
    fontSize: 14,
    color: Palette.text,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  urlSaveBtn: {
    backgroundColor: Palette.primary,
    borderRadius: Radius.sm,
    paddingHorizontal: 18,
    justifyContent: 'center',
  },
  urlSaveBtnText: { color: Palette.textInverse, fontWeight: '600', fontSize: 14 },
  editHint: { ...Typo.small, color: Palette.primary, marginTop: 4 },
  ideaCard: {
    backgroundColor: Palette.primaryBg,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  ideaText: { ...Typo.body, color: Palette.primaryDark, lineHeight: 22 },
  actions: { gap: 10, marginTop: Spacing.lg },
  dangerBtn: {
    backgroundColor: Palette.errorBg,
    borderRadius: Radius.sm,
    padding: 16,
    alignItems: 'center',
  },
  dangerBtnText: { color: Palette.error, fontWeight: '600', fontSize: 15 },
  logoutBtn: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.sm,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Palette.border,
  },
  logoutBtnText: { color: Palette.textSecondary, fontWeight: '600', fontSize: 15 },
});
