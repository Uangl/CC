import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
} from 'react-native';
import { useMistakeStore } from '../store/mistakeStore';
import { Colors } from '../constants/colors';
import { MistakeCardPreview } from '../components/MistakeCardPreview';
import { EmptyState } from '../components/EmptyState';
import { STATUS_LABELS, GRADE_LABELS } from '../constants/mistakeReasons';
import { MistakeStatus, Grade } from '../models/types';

const STATUS_FILTERS: { value: MistakeStatus | 'all'; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'captured', label: '已收录' },
  { value: 'diagnosed', label: '已诊断' },
  { value: 'explained', label: '已讲题' },
  { value: 'variant_passed', label: '变式通过' },
  { value: 'review_due', label: '待复习' },
  { value: 'mastered', label: '已出库' },
];

export function MistakeListScreen({ navigation }: { navigation: any }) {
  const mistakes = useMistakeStore((s) => s.mistakes);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<MistakeStatus | 'all'>('all');
  const [gradeFilter, setGradeFilter] = useState<Grade | 'all'>('all');

  const filtered = useMemo(() => {
    return mistakes.filter((m) => {
      if (statusFilter !== 'all' && m.status !== statusFilter) return false;
      if (gradeFilter !== 'all' && m.grade !== gradeFilter) return false;
      if (searchText.trim() && !m.questionText.includes(searchText.trim())) return false;
      return true;
    });
  }, [mistakes, statusFilter, gradeFilter, searchText]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>错题本</Text>

        <TextInput
          style={styles.searchInput}
          placeholder="搜索题干..."
          value={searchText}
          onChangeText={setSearchText}
          placeholderTextColor={Colors.textLight}
        />

        <View style={styles.filterSection}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={STATUS_FILTERS}
            keyExtractor={(item) => item.value}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  statusFilter === item.value && styles.filterChipActive,
                ]}
                onPress={() => setStatusFilter(item.value)}
              >
                <Text
                  style={[
                    styles.filterText,
                    statusFilter === item.value && styles.filterTextActive,
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            )}
            style={styles.filterList}
          />

          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={[
              { value: 'all' as const, label: '全部年级' },
              { value: 1 as const, label: '一年级' },
              { value: 2 as const, label: '二年级' },
              { value: 3 as const, label: '三年级' },
              { value: 4 as const, label: '四年级' },
              { value: 5 as const, label: '五年级' },
              { value: 6 as const, label: '六年级' },
            ]}
            keyExtractor={(item) => String(item.value)}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  gradeFilter === item.value && styles.filterChipActive,
                ]}
                onPress={() => setGradeFilter(item.value)}
              >
                <Text
                  style={[
                    styles.filterText,
                    gradeFilter === item.value && styles.filterTextActive,
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            )}
            style={styles.filterList}
          />
        </View>

        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <MistakeCardPreview
              mistake={item}
              onPress={() =>
                navigation.navigate('MistakeDetail', { mistakeId: item.id })
              }
            />
          )}
          ListEmptyComponent={
            <EmptyState
              title="还没有错题"
              subtitle="拍下第一道错题，开始清理学习小坑吧。"
            />
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={filtered.length === 0 ? styles.emptyList : undefined}
        />
      </View>
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
    marginBottom: 16,
  },
  searchInput: {
    backgroundColor: Colors.surface,
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: Colors.text,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterSection: {
    marginBottom: 12,
  },
  filterList: {
    marginBottom: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    marginRight: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  filterTextActive: {
    color: Colors.white,
    fontWeight: '600',
  },
  emptyList: {
    flex: 1,
  },
});
