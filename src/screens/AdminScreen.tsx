import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Palette, Radius, Spacing, Shadow, Typo } from '../constants/theme';
import { apiFetch } from '../services/api/client';

interface AdminUser {
  id: number;
  phone: string;
  nickname: string;
  role: string;
  grade: number;
  created_at: string;
  mistake_count: number;
  mastered_count: number;
}

interface Stats {
  totalUsers: number;
  totalMistakes: number;
  totalMastered: number;
  todayNew: number;
  topKnowledgePoints: { knowledge_point_name: string; count: number }[];
}

export function AdminScreen() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [userData, statsData] = await Promise.all([
        apiFetch<{ users: AdminUser[] }>('/api/admin/users'),
        apiFetch<Stats>('/api/admin/stats'),
      ]);
      setUsers(userData.users);
      setStats(statsData);
    } catch (e: unknown) {
      Alert.alert('加载失败', e instanceof Error ? e.message : '');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleResetPwd = (userId: number, nickname: string) => {
    Alert.alert(`重置 ${nickname} 的密码？`, '密码将重置为 reset123', [
      { text: '取消', style: 'cancel' },
      {
        text: '确定',
        onPress: () => {
          apiFetch(`/api/admin/users/${userId}/reset-password`, { method: 'POST' })
            .then(() => Alert.alert('已重置', '新密码：reset123'))
            .catch(() => Alert.alert('操作失败', '请检查网络'));
        },
      },
    ]);
  };

  const handleToggleRole = (user: AdminUser) => {
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    setUsers((prev) =>
      prev.map((u) => (u.id === user.id ? { ...u, role: newRole } : u))
    );
    apiFetch(`/api/admin/users/${user.id}`, {
      method: 'PUT',
      body: JSON.stringify({ role: newRole }),
    }).catch(() => {
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, role: user.role } : u))
      );
      Alert.alert('操作失败', '请检查网络');
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Palette.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={users}
        keyExtractor={(item) => String(item.id)}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={Typo.h2}>管理后台</Text>

            {stats && (
              <View style={styles.statsGrid}>
                <StatCard label="总用户" value={stats.totalUsers} color={Palette.primary} />
                <StatCard label="总错题" value={stats.totalMistakes} color={Palette.warning} />
                <StatCard label="已出库" value={stats.totalMastered} color={Palette.success} />
                <StatCard label="今日新增" value={stats.todayNew} color={Palette.accent} />
              </View>
            )}

            {stats && stats.topKnowledgePoints.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>全平台薄弱知识点</Text>
                {stats.topKnowledgePoints.slice(0, 5).map((kp, i) => (
                  <View key={i} style={styles.kpRow}>
                    <Text style={styles.kpRank}>{i + 1}</Text>
                    <Text style={styles.kpName}>{kp.knowledge_point_name}</Text>
                    <Text style={styles.kpCount}>{kp.count}道</Text>
                  </View>
                ))}
              </View>
            )}

            <Text style={styles.sectionTitle}>用户列表</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.userCard}>
            <View style={styles.userHeader}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>{item.nickname[0] || '?'}</Text>
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{item.nickname}</Text>
                <Text style={styles.userPhone}>{item.phone}</Text>
              </View>
              <View style={[styles.roleBadge, item.role === 'admin' && styles.adminBadge]}>
                <Text style={[styles.roleText, item.role === 'admin' && styles.adminText]}>
                  {item.role === 'admin' ? '管理员' : '学生'}
                </Text>
              </View>
            </View>

            <View style={styles.userStats}>
              <Text style={styles.userStat}>错题 {item.mistake_count}</Text>
              <Text style={styles.userStatDot}>·</Text>
              <Text style={styles.userStat}>出库 {item.mastered_count}</Text>
              <Text style={styles.userStatDot}>·</Text>
              <Text style={styles.userStat}>{item.grade}年级</Text>
            </View>

            <View style={styles.userActions}>
              <TouchableOpacity
                style={styles.actionChip}
                onPress={() => handleToggleRole(item)}
              >
                <Text style={styles.actionChipText}>
                  {item.role === 'admin' ? '取消管理员' : '设为管理员'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionChip, styles.actionChipWarn]}
                onPress={() => handleResetPwd(item.id, item.nickname)}
              >
                <Text style={[styles.actionChipText, styles.actionChipWarnText]}>
                  重置密码
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} />
        }
      />
    </SafeAreaView>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={[statStyles.card, { borderTopColor: color }]}>
      <Text style={[statStyles.value, { color }]}>{value}</Text>
      <Text style={statStyles.label}>{label}</Text>
    </View>
  );
}

const statStyles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Palette.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: 'center',
    borderTopWidth: 3,
    ...Shadow,
  },
  value: { fontSize: 24, fontWeight: '700' },
  label: { ...Typo.caption, marginTop: 2 },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Palette.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: Spacing.xl, paddingBottom: 40 },
  header: { marginBottom: Spacing.lg },
  statsGrid: { flexDirection: 'row', gap: 10, marginTop: Spacing.lg, marginBottom: Spacing.xl },
  section: { marginBottom: Spacing.xl },
  sectionTitle: { ...Typo.h3, marginBottom: Spacing.md },
  kpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.surface,
    borderRadius: Radius.sm,
    padding: Spacing.md,
    marginBottom: 6,
  },
  kpRank: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Palette.primaryBg,
    color: Palette.primary,
    textAlign: 'center',
    lineHeight: 24,
    fontSize: 12,
    fontWeight: '700',
    marginRight: Spacing.md,
    overflow: 'hidden',
  },
  kpName: { flex: 1, ...Typo.body },
  kpCount: { ...Typo.caption, fontWeight: '600' },
  userCard: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadow,
  },
  userHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Palette.primaryBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  avatarText: { color: Palette.primary, fontSize: 16, fontWeight: '600' },
  userInfo: { flex: 1 },
  userName: { ...Typo.label },
  userPhone: { ...Typo.small },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: Radius.full,
    backgroundColor: Palette.bg,
  },
  adminBadge: { backgroundColor: Palette.primaryBg },
  roleText: { fontSize: 12, color: Palette.textSecondary },
  adminText: { color: Palette.primary, fontWeight: '600' },
  userStats: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md },
  userStat: { ...Typo.caption },
  userStatDot: { color: Palette.textMuted, marginHorizontal: 6 },
  userActions: { flexDirection: 'row', gap: 8 },
  actionChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: Palette.primaryBg,
  },
  actionChipText: { fontSize: 12, color: Palette.primary, fontWeight: '500' },
  actionChipWarn: { backgroundColor: Palette.warningBg },
  actionChipWarnText: { color: Palette.warning },
});
