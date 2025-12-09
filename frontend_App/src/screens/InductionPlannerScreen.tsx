import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { getPlans, getPlan, generatePlan, approvePlan, overrideAssignment, getAlerts } from '../lib/api';
import { mockPlans, mockAssignments, mockAlerts } from '../data/mockData';
import { colors, getScoreColor } from '../lib/utils';
import { useAuth } from '../context/AuthContext';

interface Assignment {
  id: number;
  train_id: number;
  train?: { train_id: string };
  assignment_type: string;
  assigned_track?: string;
  assigned_position?: number;
  service_rank?: number;
  overall_score: number;
  fitness_score: number;
  maintenance_score: number;
  branding_score: number;
  assignment_reason?: string;
  is_manual_override?: boolean;
  override_by?: string;
}

interface Plan {
  id: number;
  plan_id: string;
  plan_date: string;
  status: string;
  trains_in_service: number;
  trains_standby: number;
  trains_ibl: number;
  trains_out_of_service: number;
}

const TrainCard = ({
  assignment,
  onOverride,
  onViewDetails,
}: {
  assignment: Assignment;
  onOverride: () => void;
  onViewDetails: () => void;
}) => {
  const [expanded, setExpanded] = useState(false);
  const train = assignment.train;

  const getAssignmentColor = (type: string) => {
    switch (type) {
      case 'SERVICE': return colors.emerald[400];
      case 'STANDBY': return colors.blue[400];
      case 'IBL_MAINTENANCE':
      case 'IBL_CLEANING':
      case 'IBL_BOTH': return colors.amber[400];
      default: return colors.slate[400];
    }
  };

  const color = getAssignmentColor(assignment.assignment_type);

  return (
    <TouchableOpacity
      style={[styles.trainCard, { borderLeftColor: color }]}
      onPress={() => setExpanded(!expanded)}
    >
      <View style={styles.trainHeader}>
        <View style={styles.trainInfo}>
          <View style={[styles.trainIcon, { backgroundColor: color + '20' }]}>
            <Text style={styles.trainIconText}>🚇</Text>
          </View>
          <View>
            <View style={styles.trainTitleRow}>
              <Text style={styles.trainId}>
                {train?.train_id || `Train #${assignment.train_id}`}
              </Text>
              {assignment.service_rank && (
                <View style={styles.rankBadge}>
                  <Text style={styles.rankText}>#{assignment.service_rank}</Text>
                </View>
              )}
            </View>
            <Text style={styles.trainMeta}>
              Track: {assignment.assigned_track || 'N/A'} • Position: {assignment.assigned_position ?? 'N/A'}
            </Text>
          </View>
        </View>
        <View style={styles.trainRight}>
          <View style={[styles.assignmentBadge, { backgroundColor: color + '20' }]}>
            <Text style={[styles.assignmentText, { color }]}>
              {assignment.assignment_type?.replace('_', ' ')}
            </Text>
          </View>
          <Text style={styles.expandIcon}>{expanded ? '▲' : '▼'}</Text>
        </View>
      </View>

      {/* Score Bar */}
      <View style={styles.scoreContainer}>
        <Text style={styles.scoreLabel}>Overall Score</Text>
        <View style={styles.scoreBar}>
          <View
            style={[
              styles.scoreFill,
              {
                width: `${assignment.overall_score || 0}%`,
                backgroundColor: getScoreColor(assignment.overall_score),
              },
            ]}
          />
        </View>
        <Text style={styles.scoreValue}>{assignment.overall_score?.toFixed(0) || 0}</Text>
      </View>

      {expanded && (
        <View style={styles.expandedContent}>
          {/* Detailed Scores */}
          <View style={styles.detailedScores}>
            <View style={styles.scoreItem}>
              <Text style={styles.scoreItemLabel}>Fitness</Text>
              <Text style={[styles.scoreItemValue, { color: getScoreColor(assignment.fitness_score) }]}>
                {assignment.fitness_score?.toFixed(0) || 0}%
              </Text>
            </View>
            <View style={styles.scoreItem}>
              <Text style={styles.scoreItemLabel}>Maintenance</Text>
              <Text style={[styles.scoreItemValue, { color: getScoreColor(assignment.maintenance_score) }]}>
                {assignment.maintenance_score?.toFixed(0) || 0}%
              </Text>
            </View>
            <View style={styles.scoreItem}>
              <Text style={styles.scoreItemLabel}>Branding</Text>
              <Text style={[styles.scoreItemValue, { color: colors.blue[400] }]}>
                {assignment.branding_score?.toFixed(0) || 0}%
              </Text>
            </View>
          </View>

          {/* Reason */}
          <View style={styles.reasonBox}>
            <Text style={styles.reasonLabel}>Assignment Reason</Text>
            <Text style={styles.reasonText}>
              {assignment.assignment_reason || 'No specific reason recorded'}
            </Text>
          </View>

          {/* Actions */}
          {assignment.is_manual_override ? (
            <View style={styles.overrideInfo}>
              <Text style={styles.overrideIcon}>⚠️</Text>
              <Text style={styles.overrideText}>
                Manually overridden by {assignment.override_by}
              </Text>
            </View>
          ) : (
            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.ghostButton} onPress={onViewDetails}>
                <Text style={styles.ghostButtonText}>View Details</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryButton} onPress={onOverride}>
                <Text style={styles.secondaryButtonText}>⚙️ Override</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

export default function InductionPlannerScreen() {
  const navigation = useNavigation<any>();
  const { user, canAccess } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [filter, setFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [overrideModal, setOverrideModal] = useState<Assignment | null>(null);
  const [overrideType, setOverrideType] = useState('SERVICE');
  const [overrideReason, setOverrideReason] = useState('');
  const [overrideLoading, setOverrideLoading] = useState(false);

  // Role-based permissions
  const canGeneratePlan = canAccess('generatePlan');
  const canApprovePlan = canAccess('approvePlan');
  const canOverride = canAccess('overrideAssignment');

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const response = await getPlans({ limit: 10 });
      setPlans(response.data.plans || []);
      if (response.data.plans?.length > 0) {
        await loadPlanDetails(response.data.plans[0].id);
      }
    } catch (err) {
      console.log('Using mock data - backend not available');
      setPlans(mockPlans);
      setSelectedPlan(mockPlans[0]);
      setAssignments(mockAssignments);
      setAlerts(mockAlerts.slice(0, 3));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadPlanDetails = async (planId: number) => {
    try {
      const [planResponse, alertsResponse] = await Promise.all([
        getPlan(planId),
        getAlerts({ plan_id: planId }),
      ]);
      setSelectedPlan(planResponse.data.plan);
      setAssignments(planResponse.data.assignments || []);
      setAlerts(alertsResponse.data.alerts || []);
    } catch (err) {
      console.log('Failed to load plan details');
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleGeneratePlan = async () => {
    setGenerating(true);
    try {
      await generatePlan();
      await fetchPlans();
    } catch (err) {
      console.error('Failed to generate plan:', err);
    } finally {
      setGenerating(false);
    }
  };

  const handleApprovePlan = async () => {
    if (!selectedPlan) return;
    try {
      await approvePlan(selectedPlan.id, 'Supervisor');
      await loadPlanDetails(selectedPlan.id);
    } catch (err) {
      setSelectedPlan({ ...selectedPlan, status: 'approved' });
    }
  };

  const handleOverride = async () => {
    if (!selectedPlan || !overrideModal || !overrideReason.trim()) return;
    setOverrideLoading(true);
    try {
      await overrideAssignment(selectedPlan.id, {
        train_id: overrideModal.train_id,
        new_assignment: overrideType,
        reason: overrideReason,
        override_by: 'Supervisor',
        reason_category: 'Operational',
      });
      await loadPlanDetails(selectedPlan.id);
      setOverrideModal(null);
      setOverrideReason('');
    } catch (err) {
      const updated = assignments.map(a =>
        a.id === overrideModal.id
          ? { ...a, assignment_type: overrideType, is_manual_override: true, override_by: 'Supervisor' }
          : a
      );
      setAssignments(updated);
      setOverrideModal(null);
      setOverrideReason('');
    } finally {
      setOverrideLoading(false);
    }
  };

  const filteredAssignments = assignments.filter((a) => {
    if (filter === 'all') return true;
    if (filter === 'service') return a.assignment_type === 'SERVICE';
    if (filter === 'standby') return a.assignment_type === 'STANDBY';
    if (filter === 'ibl') return a.assignment_type?.includes('IBL');
    if (filter === 'oos') return a.assignment_type === 'OUT_OF_SERVICE';
    return true;
  });

  const sortedAssignments = [...filteredAssignments].sort((a, b) => {
    if (a.assignment_type === 'SERVICE' && b.assignment_type === 'SERVICE') {
      return (a.service_rank || 999) - (b.service_rank || 999);
    }
    return (b.overall_score || 0) - (a.overall_score || 0);
  });

  const stats = {
    service: assignments.filter((a) => a.assignment_type === 'SERVICE').length,
    standby: assignments.filter((a) => a.assignment_type === 'STANDBY').length,
    ibl: assignments.filter((a) => a.assignment_type?.includes('IBL')).length,
    oos: assignments.filter((a) => a.assignment_type === 'OUT_OF_SERVICE').length,
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
        <Text style={styles.loadingText}>Loading plans...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchPlans(); }}
            tintColor={colors.primary[500]}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Night Induction Planner</Text>
            <Text style={styles.headerSubtitle}>
              Review and approve train assignments for tomorrow's service
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          {canGeneratePlan && (
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={handleGeneratePlan}
              disabled={generating}
            >
              {generating ? (
                <ActivityIndicator size="small" color={colors.text.primary} />
              ) : (
                <Text style={styles.secondaryBtnText}>🔄 Regenerate</Text>
              )}
            </TouchableOpacity>
          )}
          {canApprovePlan && selectedPlan && selectedPlan.status !== 'approved' && (
            <TouchableOpacity style={styles.successBtn} onPress={handleApprovePlan}>
              <Text style={styles.successBtnText}>✓ Approve Plan</Text>
            </TouchableOpacity>
          )}
          {!canGeneratePlan && !canApprovePlan && (
            <View style={styles.viewOnlyBadge}>
              <Text style={styles.viewOnlyText}>👁️ View Only Mode</Text>
            </View>
          )}
        </View>

        {/* Plan Stats */}
        {selectedPlan && (
          <View style={styles.statsCard}>
            <View style={styles.statsHeader}>
              <Text style={styles.planIdText}>{selectedPlan.plan_id}</Text>
              <View style={[styles.statusBadge, {
                backgroundColor: selectedPlan.status === 'approved' ? colors.success.bg :
                  selectedPlan.status === 'proposed' ? colors.info.bg : colors.warning.bg
              }]}>
                <Text style={[styles.statusText, {
                  color: selectedPlan.status === 'approved' ? colors.success.text :
                    selectedPlan.status === 'proposed' ? colors.info.text : colors.warning.text
                }]}>
                  {selectedPlan.status?.toUpperCase()}
                </Text>
              </View>
            </View>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <View style={[styles.statDot, { backgroundColor: colors.emerald[400] }]} />
                <Text style={styles.statText}>{stats.service} Service</Text>
              </View>
              <View style={styles.statItem}>
                <View style={[styles.statDot, { backgroundColor: colors.blue[400] }]} />
                <Text style={styles.statText}>{stats.standby} Standby</Text>
              </View>
              <View style={styles.statItem}>
                <View style={[styles.statDot, { backgroundColor: colors.amber[400] }]} />
                <Text style={styles.statText}>{stats.ibl} IBL</Text>
              </View>
              <View style={styles.statItem}>
                <View style={[styles.statDot, { backgroundColor: colors.slate[400] }]} />
                <Text style={styles.statText}>{stats.oos} OOS</Text>
              </View>
            </View>
          </View>
        )}

        {/* Alerts */}
        {alerts.length > 0 && (
          <View style={styles.alertsCard}>
            <View style={styles.alertsHeader}>
              <Text style={styles.alertsIcon}>⚠️</Text>
              <Text style={styles.alertsTitle}>{alerts.length} Alerts for this Plan</Text>
            </View>
            {alerts.slice(0, 3).map((alert, idx) => (
              <View key={idx} style={styles.alertItem}>
                <View style={[styles.alertBadge, {
                  backgroundColor: alert.severity === 'critical' ? colors.danger.bg :
                    alert.severity === 'warning' ? colors.warning.bg : colors.info.bg
                }]}>
                  <Text style={[styles.alertBadgeText, {
                    color: alert.severity === 'critical' ? colors.danger.text :
                      alert.severity === 'warning' ? colors.warning.text : colors.info.text
                  }]}>
                    {alert.severity}
                  </Text>
                </View>
                <Text style={styles.alertMessage} numberOfLines={1}>{alert.message}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Filter */}
        <View style={styles.filterRow}>
          <Text style={styles.filterIcon}>🔍</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {['all', 'service', 'standby', 'ibl', 'oos'].map((f) => (
              <TouchableOpacity
                key={f}
                style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
                onPress={() => setFilter(f)}
              >
                <Text style={[styles.filterBtnText, filter === f && styles.filterBtnTextActive]}>
                  {f.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Assignments List */}
        <View style={styles.assignmentsList}>
          {sortedAssignments.length > 0 ? (
            sortedAssignments.map((assignment) => (
              <TrainCard
                key={assignment.id}
                assignment={assignment}
                onOverride={() => {
                  setOverrideModal(assignment);
                  setOverrideType(assignment.assignment_type);
                }}
                onViewDetails={() => navigation.navigate('TrainDetail', { trainId: assignment.train_id })}
              />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🚇</Text>
              <Text style={styles.emptyText}>No trains match the current filter</Text>
            </View>
          )}
        </View>

        <View style={styles.spacer} />
      </ScrollView>

      {/* Override Modal */}
      <Modal visible={!!overrideModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Override Assignment</Text>
              <TouchableOpacity onPress={() => setOverrideModal(null)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <Text style={styles.modalLabel}>Train</Text>
              <Text style={styles.modalValue}>
                {overrideModal?.train?.train_id || `Train #${overrideModal?.train_id}`}
              </Text>

              <Text style={styles.modalLabel}>New Assignment</Text>
              <View style={styles.pickerContainer}>
                {['SERVICE', 'STANDBY', 'IBL_MAINTENANCE', 'IBL_CLEANING', 'OUT_OF_SERVICE'].map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[styles.pickerOption, overrideType === type && styles.pickerOptionActive]}
                    onPress={() => setOverrideType(type)}
                  >
                    <Text style={[styles.pickerText, overrideType === type && styles.pickerTextActive]}>
                      {type.replace('_', ' ')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.modalLabel}>Reason for Override *</Text>
              <TextInput
                style={styles.textInput}
                value={overrideReason}
                onChangeText={setOverrideReason}
                placeholder="Explain why this override is necessary..."
                placeholderTextColor={colors.text.muted}
                multiline
                numberOfLines={3}
              />

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.ghostBtn} onPress={() => setOverrideModal(null)}>
                  <Text style={styles.ghostBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.primaryBtn, !overrideReason.trim() && styles.btnDisabled]}
                  onPress={handleOverride}
                  disabled={!overrideReason.trim() || overrideLoading}
                >
                  {overrideLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.primaryBtnText}>✓ Confirm Override</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bg.primary,
  },
  loadingText: {
    marginTop: 16,
    color: colors.text.secondary,
  },
  header: {
    padding: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text.primary,
  },
  headerSubtitle: {
    fontSize: 13,
    color: colors.text.secondary,
    marginTop: 4,
  },
  actionRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 16,
  },
  secondaryBtn: {
    backgroundColor: colors.slate[700],
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  secondaryBtnText: {
    color: colors.text.primary,
    fontWeight: '500',
  },
  successBtn: {
    backgroundColor: colors.emerald[600],
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  successBtnText: {
    color: '#fff',
    fontWeight: '600',
  },
  statsCard: {
    marginHorizontal: 16,
    backgroundColor: colors.bg.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.slate[800],
    marginBottom: 16,
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  planIdText: {
    fontSize: 14,
    fontFamily: 'monospace',
    color: colors.text.primary,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statText: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  alertsCard: {
    marginHorizontal: 16,
    backgroundColor: colors.bg.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.warning.border,
    marginBottom: 16,
  },
  alertsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  alertsIcon: {
    fontSize: 16,
  },
  alertsTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.warning.text,
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  alertBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  alertBadgeText: {
    fontSize: 10,
    fontWeight: '500',
  },
  alertMessage: {
    flex: 1,
    fontSize: 12,
    color: colors.text.secondary,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  filterIcon: {
    fontSize: 14,
  },
  filterBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.slate[800],
    marginRight: 8,
  },
  filterBtnActive: {
    backgroundColor: colors.primary[600],
  },
  filterBtnText: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  filterBtnTextActive: {
    color: '#fff',
  },
  assignmentsList: {
    paddingHorizontal: 16,
  },
  trainCard: {
    backgroundColor: colors.bg.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.slate[800],
    borderLeftWidth: 4,
  },
  trainHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  trainInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  trainIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trainIconText: {
    fontSize: 18,
  },
  trainTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  trainId: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
  },
  rankBadge: {
    backgroundColor: colors.slate[700],
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  rankText: {
    fontSize: 10,
    color: colors.text.secondary,
  },
  trainMeta: {
    fontSize: 11,
    color: colors.text.muted,
    marginTop: 2,
  },
  trainRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  assignmentBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  assignmentText: {
    fontSize: 11,
    fontWeight: '600',
  },
  expandIcon: {
    fontSize: 10,
    color: colors.text.muted,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  scoreLabel: {
    fontSize: 11,
    color: colors.text.muted,
    width: 80,
  },
  scoreBar: {
    flex: 1,
    height: 6,
    backgroundColor: colors.slate[700],
    borderRadius: 3,
    overflow: 'hidden',
  },
  scoreFill: {
    height: '100%',
    borderRadius: 3,
  },
  scoreValue: {
    fontSize: 11,
    color: colors.text.secondary,
    width: 30,
    textAlign: 'right',
  },
  expandedContent: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.slate[800],
  },
  detailedScores: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  scoreItem: {
    alignItems: 'center',
  },
  scoreItemLabel: {
    fontSize: 11,
    color: colors.text.muted,
  },
  scoreItemValue: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 4,
  },
  reasonBox: {
    backgroundColor: colors.slate[800],
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  reasonLabel: {
    fontSize: 11,
    color: colors.text.muted,
    marginBottom: 4,
  },
  reasonText: {
    fontSize: 13,
    color: colors.text.secondary,
  },
  overrideInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  overrideIcon: {
    fontSize: 14,
  },
  overrideText: {
    fontSize: 12,
    color: colors.warning.text,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  ghostButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  ghostButtonText: {
    fontSize: 13,
    color: colors.text.secondary,
  },
  secondaryButton: {
    backgroundColor: colors.slate[700],
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  secondaryButtonText: {
    fontSize: 13,
    color: colors.text.primary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyIcon: {
    fontSize: 40,
    opacity: 0.5,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  spacer: {
    height: 32,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: colors.bg.secondary,
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.slate[700],
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  modalClose: {
    fontSize: 18,
    color: colors.text.muted,
    padding: 4,
  },
  modalBody: {
    padding: 16,
  },
  modalLabel: {
    fontSize: 12,
    color: colors.text.muted,
    marginBottom: 6,
    marginTop: 12,
  },
  modalValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  pickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pickerOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.slate[700],
  },
  pickerOptionActive: {
    backgroundColor: colors.primary[600],
  },
  pickerText: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  pickerTextActive: {
    color: '#fff',
  },
  textInput: {
    backgroundColor: colors.slate[800],
    borderRadius: 8,
    padding: 12,
    color: colors.text.primary,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 20,
  },
  ghostBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  ghostBtnText: {
    color: colors.text.secondary,
    fontWeight: '500',
  },
  primaryBtn: {
    backgroundColor: colors.primary[600],
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  primaryBtnText: {
    color: '#fff',
    fontWeight: '600',
  },
  btnDisabled: {
    opacity: 0.5,
  },
  viewOnlyBadge: {
    backgroundColor: colors.slate[700],
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewOnlyText: {
    color: colors.text.muted,
    fontSize: 13,
  },
});
