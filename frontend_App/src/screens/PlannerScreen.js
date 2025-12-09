import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, TouchableOpacity, Alert, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { getPlans, getPlan, generatePlan, approvePlan } from '../services/api';
import Button from '../components/Button';
import Badge from '../components/Badge';
import ScoreBar from '../components/ScoreBar';
import { Card, CardHeader, CardBody } from '../components/Card';
import Loading from '../components/Loading';

function TrainCard({ assignment, onPress, colors, t }) {
  const assignmentColors = {
    SERVICE: 'success',
    STANDBY: 'info',
    IBL_MAINTENANCE: 'warning',
    IBL_CLEANING: 'warning',
    IBL_BOTH: 'warning',
    OUT_OF_SERVICE: 'danger',
  };
  const badgeType = assignmentColors[assignment.assignment_type] || 'info';
  const train = assignment.train;

  const getAssignmentLabel = () => {
    switch (assignment.assignment_type) {
      case 'SERVICE': return t('planner.service');
      case 'STANDBY': return t('planner.standby');
      case 'IBL_MAINTENANCE': return `${t('planner.ibl')} - ${t('planner.maintenance')}`;
      case 'IBL_CLEANING': return `${t('planner.ibl')} - ${t('planner.cleaning')}`;
      case 'IBL_BOTH': return `${t('planner.ibl')} - ${t('planner.both')}`;
      case 'OUT_OF_SERVICE': return t('planner.outOfService');
      default: return assignment.assignment_type;
    }
  };

  return (
    <TouchableOpacity 
      style={[styles.trainCard, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.trainHeader}>
        <View style={styles.trainInfo}>
          <View style={[styles.trainIcon, { backgroundColor: colors.primary + '20' }]}>
            <Ionicons name="train" size={20} color={colors.primary} />
          </View>
          <View>
            <View style={styles.trainTitleRow}>
              <Text style={[styles.trainId, { color: colors.text }]}>
                {train?.train_id || `Train #${assignment.train_id}`}
              </Text>
              {assignment.service_rank && (
                <View style={[styles.rankBadge, { backgroundColor: colors.border }]}>
                  <Text style={[styles.rankText, { color: colors.textSecondary }]}>#{assignment.service_rank}</Text>
                </View>
              )}
            </View>
            <Text style={[styles.trainMeta, { color: colors.textTertiary }]}>
              {t('planner.track')}: {assignment.assigned_track || 'N/A'} • {t('planner.position')}: {assignment.assigned_position ?? 'N/A'}
            </Text>
          </View>
        </View>
        <Badge text={getAssignmentLabel()} type={badgeType} size="small" />
      </View>
      
      <ScoreBar score={assignment.overall_score} label={t('planner.overallScore')} />
      
      <View style={styles.scoresRow}>
        <View style={styles.scoreItem}>
          <Text style={[styles.scoreLabel, { color: colors.textTertiary }]}>{t('planner.fitness')}</Text>
          <Text style={[styles.scoreValue, { color: assignment.fitness_score >= 80 ? colors.success : assignment.fitness_score >= 50 ? colors.warning : colors.danger }]}>
            {assignment.fitness_score?.toFixed(0) || 0}%
          </Text>
        </View>
        <View style={styles.scoreItem}>
          <Text style={[styles.scoreLabel, { color: colors.textTertiary }]}>{t('planner.maintenance')}</Text>
          <Text style={[styles.scoreValue, { color: assignment.maintenance_score >= 80 ? colors.success : assignment.maintenance_score >= 50 ? colors.warning : colors.danger }]}>
            {assignment.maintenance_score?.toFixed(0) || 0}%
          </Text>
        </View>
        <View style={styles.scoreItem}>
          <Text style={[styles.scoreLabel, { color: colors.textTertiary }]}>{t('planner.branding')}</Text>
          <Text style={[styles.scoreValue, { color: colors.primary }]}>
            {assignment.branding_score?.toFixed(0) || 0}%
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function PlannerScreen({ navigation }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [filter, setFilter] = useState('all');

  const fetchPlans = async () => {
    try {
      const response = await getPlans({ limit: 10 });
      setPlans(response.data.plans || []);
      if (response.data.plans?.length > 0) {
        await loadPlanDetails(response.data.plans[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch plans:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadPlanDetails = async (planId) => {
    try {
      const response = await getPlan(planId);
      setSelectedPlan(response.data.plan);
      setAssignments(response.data.assignments || []);
    } catch (err) {
      console.error('Failed to load plan:', err);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPlans();
  }, []);

  const handleRegenerate = async () => {
    setGenerating(true);
    try {
      await generatePlan();
      await fetchPlans();
      Alert.alert('Success', 'Plan regenerated');
    } catch (err) {
      Alert.alert('Error', 'Failed to regenerate plan');
    } finally {
      setGenerating(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedPlan) return;
    try {
      await approvePlan(selectedPlan.id, 'Mobile User');
      await loadPlanDetails(selectedPlan.id);
      Alert.alert('Success', 'Plan approved');
    } catch (err) {
      Alert.alert('Error', 'Failed to approve plan');
    }
  };

  const filteredAssignments = assignments.filter(a => {
    if (filter === 'all') return true;
    if (filter === 'service') return a.assignment_type === 'SERVICE';
    if (filter === 'standby') return a.assignment_type === 'STANDBY';
    if (filter === 'ibl') return a.assignment_type?.includes('IBL');
    if (filter === 'oos') return a.assignment_type === 'OUT_OF_SERVICE';
    return true;
  });

  const stats = {
    service: assignments.filter(a => a.assignment_type === 'SERVICE').length,
    standby: assignments.filter(a => a.assignment_type === 'STANDBY').length,
    ibl: assignments.filter(a => a.assignment_type?.includes('IBL')).length,
    oos: assignments.filter(a => a.assignment_type === 'OUT_OF_SERVICE').length,
  };

  if (loading) return <Loading message={t('common.loading')} />;

  if (plans.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.background }]}>
        <Ionicons name="calendar-outline" size={64} color={colors.textTertiary} />
        <Text style={[styles.emptyTitle, { color: colors.text }]}>{t('planner.noPlans')}</Text>
        <Text style={[styles.emptyHint, { color: colors.textTertiary }]}>{t('planner.generateFirst')}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header Actions */}
      <View style={styles.headerActions}>
        <Button title={t('planner.regenerate')} icon="refresh" variant="secondary" size="small" onPress={handleRegenerate} loading={generating} />
        {selectedPlan && selectedPlan.status !== 'approved' && (
          <Button title={t('planner.approve')} icon="checkmark" variant="success" size="small" onPress={handleApprove} />
        )}
      </View>

      {/* Plan Info */}
      {selectedPlan && (
        <Card style={styles.planInfo}>
          <View style={styles.planInfoContent}>
            <View>
              <Text style={[styles.planId, { color: colors.text }]}>{selectedPlan.plan_id}</Text>
              <Text style={[styles.planDate, { color: colors.textTertiary }]}>
                {new Date(selectedPlan.plan_date).toLocaleDateString()}
              </Text>
            </View>
            <Badge 
              text={selectedPlan.status?.toUpperCase()} 
              type={selectedPlan.status === 'approved' ? 'success' : selectedPlan.status === 'proposed' ? 'info' : 'warning'} 
            />
          </View>
        </Card>
      )}

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <View style={[styles.statDot, { backgroundColor: colors.success }]} />
          <Text style={[styles.statText, { color: colors.text }]}>{stats.service} {t('planner.service')}</Text>
        </View>
        <View style={styles.statItem}>
          <View style={[styles.statDot, { backgroundColor: colors.primary }]} />
          <Text style={[styles.statText, { color: colors.text }]}>{stats.standby} {t('planner.standby')}</Text>
        </View>
        <View style={styles.statItem}>
          <View style={[styles.statDot, { backgroundColor: colors.warning }]} />
          <Text style={[styles.statText, { color: colors.text }]}>{stats.ibl} {t('planner.ibl')}</Text>
        </View>
        <View style={styles.statItem}>
          <View style={[styles.statDot, { backgroundColor: colors.textTertiary }]} />
          <Text style={[styles.statText, { color: colors.text }]}>{stats.oos} {t('planner.oos')}</Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
        {['all', 'service', 'standby', 'ibl', 'oos'].map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterTab, filter === f && { backgroundColor: colors.primary }]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, { color: filter === f ? '#fff' : colors.textSecondary }]}>
              {t(`planner.${f}`).toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Assignments List */}
      <FlatList
        data={filteredAssignments.sort((a, b) => (b.overall_score || 0) - (a.overall_score || 0))}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => (
          <TrainCard
            assignment={item}
            colors={colors}
            t={t}
            onPress={() => navigation.navigate('TrainDetails', { trainId: item.train_id })}
          />
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListEmptyComponent={
          <View style={styles.emptyList}>
            <Text style={[styles.emptyListText, { color: colors.textTertiary }]}>No trains match filter</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyTitle: { fontSize: 18, fontWeight: '600', marginTop: 16 },
  emptyHint: { fontSize: 14, marginTop: 8, textAlign: 'center' },
  headerActions: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, gap: 12 },
  planInfo: { marginHorizontal: 16, marginBottom: 12 },
  planInfoContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  planId: { fontSize: 16, fontWeight: '600' },
  planDate: { fontSize: 12, marginTop: 2 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 16, marginBottom: 12 },
  statItem: { flexDirection: 'row', alignItems: 'center' },
  statDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  statText: { fontSize: 12 },
  filterScroll: { paddingHorizontal: 16, marginBottom: 12 },
  filterTab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 8, backgroundColor: '#334155' },
  filterText: { fontSize: 12, fontWeight: '600' },
  listContent: { padding: 16, paddingTop: 0 },
  trainCard: { borderRadius: 12, borderWidth: 1, padding: 16, marginBottom: 12 },
  trainHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  trainInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  trainIcon: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  trainTitleRow: { flexDirection: 'row', alignItems: 'center' },
  trainId: { fontSize: 15, fontWeight: '600' },
  rankBadge: { marginLeft: 8, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  rankText: { fontSize: 11 },
  trainMeta: { fontSize: 11, marginTop: 2 },
  scoresRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#334155' },
  scoreItem: { alignItems: 'center' },
  scoreLabel: { fontSize: 11 },
  scoreValue: { fontSize: 16, fontWeight: '600', marginTop: 2 },
  emptyList: { padding: 32, alignItems: 'center' },
  emptyListText: { fontSize: 14 },
});
