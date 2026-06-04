import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Palette, Radius, Spacing, Shadow, Typo } from '../constants/theme';
import { useAuthStore } from '../store/authStore';
import { Grade } from '../models/types';
import { GRADE_LABELS } from '../constants/mistakeReasons';

export function RegisterScreen({ navigation }: { navigation: any }) {
  const register = useAuthStore((s) => s.register);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [grade, setGrade] = useState<Grade>(3);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    if (!phone.trim()) { setError('请输入手机号'); return; }
    if (!password || password.length < 4) { setError('密码至少4位'); return; }
    setLoading(true);
    setError('');
    try {
      await register(phone.trim(), password, nickname.trim(), grade);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '注册失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>注册账号</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>手机号 / 用户名</Text>
            <TextInput
              style={styles.input}
              placeholder="输入手机号或自定义用户名"
              value={phone}
              onChangeText={setPhone}
              autoCapitalize="none"
              placeholderTextColor={Palette.textMuted}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>密码</Text>
            <TextInput
              style={styles.input}
              placeholder="至少4位"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholderTextColor={Palette.textMuted}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>昵称（选填）</Text>
            <TextInput
              style={styles.input}
              placeholder="给自己起个名字"
              value={nickname}
              onChangeText={setNickname}
              placeholderTextColor={Palette.textMuted}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>年级</Text>
            <View style={styles.gradeRow}>
              {([1, 2, 3, 4, 5, 6] as Grade[]).map((g) => (
                <TouchableOpacity
                  key={g}
                  style={[styles.gradeChip, grade === g && styles.gradeChipActive]}
                  onPress={() => setGrade(g)}
                >
                  <Text style={[styles.gradeText, grade === g && styles.gradeTextActive]}>
                    {GRADE_LABELS[g]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={Palette.textInverse} />
            ) : (
              <Text style={styles.btnText}>注 册</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.secondaryBtnText}>已有账号？去登录</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Palette.bg },
  container: { padding: Spacing.xl, paddingTop: 60 },
  formCard: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    ...Shadow,
  },
  formTitle: { ...Typo.h2, marginBottom: Spacing.xl },
  inputGroup: { marginBottom: Spacing.lg },
  inputLabel: { ...Typo.label, marginBottom: Spacing.sm },
  input: {
    backgroundColor: Palette.bg,
    borderRadius: Radius.sm,
    padding: 14,
    fontSize: 15,
    color: Palette.text,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  gradeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  gradeChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.full,
    backgroundColor: Palette.bg,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  gradeChipActive: { backgroundColor: Palette.primary, borderColor: Palette.primary },
  gradeText: { fontSize: 13, color: Palette.text },
  gradeTextActive: { color: Palette.textInverse, fontWeight: '600' },
  error: {
    color: Palette.error,
    fontSize: 13,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  btn: {
    backgroundColor: Palette.primary,
    borderRadius: Radius.sm,
    padding: 16,
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { ...Typo.button },
  secondaryBtn: { alignItems: 'center', padding: Spacing.sm },
  secondaryBtnText: { color: Palette.primary, fontSize: 14, fontWeight: '500' },
});
