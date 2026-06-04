import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Palette, Radius, Spacing, Shadow, Typo } from '../constants/theme';
import { useAuthStore } from '../store/authStore';

export function LoginScreen({ navigation }: { navigation: any }) {
  const login = useAuthStore((s) => s.login);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!phone.trim() || !password) {
      setError('请输入账号和密码');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await login(phone.trim(), password);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.container}>
          <View style={styles.logoArea}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoEmoji}>📖</Text>
            </View>
            <Text style={styles.appName}>错题小老师</Text>
            <Text style={styles.tagline}>把错题讲明白、练透、清掉</Text>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.formTitle}>登录</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>账号</Text>
              <TextInput
                style={styles.input}
                placeholder="手机号 / 用户名"
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
                placeholder="请输入密码"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholderTextColor={Palette.textMuted}
              />
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <TouchableOpacity
              style={[styles.btn, loading && styles.btnDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={Palette.textInverse} />
              ) : (
                <Text style={styles.btnText}>登 录</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={() => navigation.navigate('Register')}
            >
              <Text style={styles.secondaryBtnText}>没有账号？注册一个</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.hint}>
            测试账号：test / test123{'\n'}
            管理员：admin / admin123
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Palette.bg },
  flex: { flex: 1 },
  container: { flex: 1, padding: Spacing.xl, justifyContent: 'center' },
  logoArea: { alignItems: 'center', marginBottom: Spacing.xxxl },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Palette.primaryBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  logoEmoji: { fontSize: 36 },
  appName: { ...Typo.h1, color: Palette.primary, marginBottom: Spacing.xs },
  tagline: { ...Typo.bodySecondary },
  formCard: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    ...Shadow,
  },
  formTitle: { ...Typo.h2, marginBottom: Spacing.lg },
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
  hint: {
    ...Typo.small,
    textAlign: 'center',
    marginTop: Spacing.xl,
    lineHeight: 20,
  },
});
