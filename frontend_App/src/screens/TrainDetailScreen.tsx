import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { getTrain } from '../lib/api';
import { mockTrainDetail } from '../data/mockData';
import { colors, getScoreColor, formatDate, getStatusColors } from '../lib/utils';
import { RootStackParamList } from '../navigation/RootNavigator';

type TrainDetailRouteProp = RouteProp<RootStackParamList, 'TrainDetail'>;

const StatusBadge = ({ status, type = 'default' }: { status: string; type?: string }) => {
  const statusColors = getStatusColors(status, 'status');
  return (
    <View style={[styles.badge, { backgroundColor: statusColors.bg }]}>
      <Text style={[styles.badgeText, { color: statusColors.text }]}>{status}</Text>
    </View>
  );
};

const ScoreBar = ({ score, label }: { score: number; label: string }) => {
  const color = getScoreColor(score);
  return (
    <View style={styles.scoreBarContainer}>
      <View style={styles.scoreBarHeader}>
        <Text style={styles.scoreBarLabel}>{label}</Text>
        <Text style={[styles.scoreBarValue, { color }]}>{score?.toFixed(0) || 0}%</Text>
      </View>
      <View style={styles.scoreBarTrack}>
        <View style={[styles.scoreBarFill, { width: `${score || 0}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
};

const SectionCard = ({
  title,
  icon,
  badge,
  children,
}: {
  title: string;
  icon: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
}) => (
  <View style={styles.sectionCard}>
    <View style={styles.sectionHeader}>
      <View style={styles.sectionHeaderLeft}>
        <Text style={styles.sectionIcon}>{icon}</Text>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {badge}
    </View>
    <View style={styles.sectionBody}>{children}</View>
  </View>
);

export default function TrainDetailScreen() {
  const route = useRoute<TrainDetailRouteProp>();
  const navigation = useNavigation();
  const { trainId } = route.params;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrain = async () => {
      try {
        const response = await getTrain(trainId);
        setData(response.data);
      } catch (err) {
        console.log('Using mock data - backend not available');
        setData(mockTrainDetail);
      } finally {
        setLoading(false);
      }
    };
    fetchTrain();
  }, [trainId]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
      </View>
    );
  }

  if (!data || !data.train) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorTitle}>Train Not Found</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { train, fitness_certificates, job_cards, branding_contracts, mileage, cleaning } = data;
  const validCerts = fitness_certificates?.filter((c: any) => c.status === 'Valid' || c.is_currently_valid).length || 0;
  const totalCerts = fitness_certificates?.length || 0;
  const openJobs = job_cards?.filter((j: any) => j.status !== 'CLOSED').length || 0;
  const safetyJobs = job_cards?.filter((j: any) => j.safety_critical && j.status !== 'CLOSED').length || 0;

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <View style={styles.headerTitleRow}>
            <Text style={styles.headerTitle}>{train.train_id}</Text>
            <StatusBadge status={train.status} />
          </View>
          <Text style={styles.headerMeta}>
            {train.configuration} • {train.manufacturer} • Commissioned{' '}
            {train.commissioning_date ? formatDate(train.commissioning_date) : 'N/A'}
          </Text>
        </View>
        <View style={styles.headerScore}>
          <Text style={styles.headerScoreLabel}>Health Score</Text>
          <Text style={[styles.headerScoreValue, { color: getScoreColor(train.overall_health_score) }]}>
            {train.overall_health_score?.toFixed(0)}%
          </Text>
        </View>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statIcon}>🛡️</Text>
          <Text style={styles.statValue}>{validCerts}/{totalCerts}</Text>
          <Text style={styles.statLabel}>Certificates</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statIcon}>🔧</Text>
          <Text style={styles.statValue}>{openJobs}</Text>
          <Text style={styles.statLabel}>Open Jobs</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statIcon}>📏</Text>
          <Text style={styles.statValue}>
            {mileage ? `${(mileage.lifetime_km / 1000).toFixed(1)}k` : 'N/A'}
          </Text>
          <Text style={styles.statLabel}>km</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statIcon}>📍</Text>
          <Text style={styles.statValue}>{train.current_track || 'N/A'}</Text>
          <Text style={styles.statLabel}>Track</Text>
        </View>
      </View>

      {/* Fitness Certificates */}
      <SectionCard
        title="Fitness Certificates"
        icon="🛡️"
        badge={
          <View style={[styles.badge, { backgroundColor: validCerts === totalCerts ? colors.success.bg : colors.warning.bg }]}>
            <Text style={[styles.badgeText, { color: validCerts === totalCerts ? colors.success.text : colors.warning.text }]}>
              {validCerts}/{totalCerts} Valid
            </Text>
          </View>
        }
      >
        {fitness_certificates?.length > 0 ? (
          fitness_certificates.map((cert: any, idx: number) => (
            <View key={idx} style={styles.listItem}>
              <View style={styles.listItemHeader}>
                <Text style={styles.listItemTitle}>{cert.department}</Text>
                <StatusBadge status={cert.status} />
              </View>
              <View style={styles.listItemMeta}>
                <Text style={styles.metaText}>
                  Valid Until: {cert.valid_to ? formatDate(cert.valid_to) : 'N/A'}
                </Text>
                <Text style={[styles.metaText, {
                  color: cert.hours_until_expiry < 24 ? colors.danger.text :
                    cert.hours_until_expiry < 48 ? colors.warning.text : colors.text.secondary
                }]}>
                  {cert.hours_until_expiry?.toFixed(1)}h left
                </Text>
              </View>
              {cert.remarks && <Text style={styles.remarks}>{cert.remarks}</Text>}
              {cert.emergency_override && (
                <View style={styles.overrideWarning}>
                  <Text style={styles.overrideText}>⚠️ Emergency override active</Text>
                </View>
              )}
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No certificates found</Text>
        )}
      </SectionCard>

      {/* Job Cards */}
      <SectionCard
        title="Job Cards"
        icon="🔧"
        badge={openJobs > 0 ? (
          <View style={[styles.badge, { backgroundColor: colors.warning.bg }]}>
            <Text style={[styles.badgeText, { color: colors.warning.text }]}>{openJobs} Open</Text>
          </View>
        ) : undefined}
      >
        {job_cards?.length > 0 ? (
          job_cards.slice(0, 5).map((job: any, idx: number) => (
            <View key={idx} style={styles.listItem}>
              <View style={styles.listItemHeader}>
                <Text style={styles.jobId}>{job.job_id}</Text>
                <StatusBadge status={job.status} />
              </View>
              <Text style={styles.jobTitle}>{job.title}</Text>
              <View style={styles.jobMeta}>
                <Text style={[styles.metaText, job.safety_critical && { color: colors.danger.text }]}>
                  {job.safety_critical ? '⚠️ Safety Critical' : job.job_type}
                </Text>
                <Text style={styles.metaText}>Priority {job.priority}</Text>
                {job.due_date && (
                  <Text style={[styles.metaText, job.is_overdue && { color: colors.danger.text }]}>
                    Due: {formatDate(job.due_date)}
                  </Text>
                )}
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No job cards found</Text>
        )}
      </SectionCard>

      {/* Branding Contracts */}
      <SectionCard
        title="Branding Contracts"
        icon="🏷️"
        badge={branding_contracts?.length > 0 ? (
          <View style={[styles.badge, { backgroundColor: colors.info.bg }]}>
            <Text style={[styles.badgeText, { color: colors.info.text }]}>{branding_contracts.length} Active</Text>
          </View>
        ) : undefined}
      >
        {branding_contracts?.length > 0 ? (
          branding_contracts.map((contract: any, idx: number) => (
            <View key={idx} style={styles.listItem}>
              <View style={styles.listItemHeader}>
                <Text style={styles.listItemTitle}>{contract.brand_name}</Text>
                <View style={[styles.badge, {
                  backgroundColor: contract.priority === 'platinum' ? colors.danger.bg :
                    contract.priority === 'gold' ? colors.warning.bg : colors.info.bg
                }]}>
                  <Text style={[styles.badgeText, {
                    color: contract.priority === 'platinum' ? colors.danger.text :
                      contract.priority === 'gold' ? colors.warning.text : colors.info.text
                  }]}>
                    {contract.priority}
                  </Text>
                </View>
              </View>
              <ScoreBar
                score={(contract.current_exposure_hours_week / contract.target_exposure_hours_weekly) * 100}
                label={`Weekly: ${contract.current_exposure_hours_week?.toFixed(1)}h / ${contract.target_exposure_hours_weekly}h`}
              />
              {contract.urgency_score > 50 && (
                <Text style={styles.urgencyWarning}>
                  ⚠️ {contract.urgency_score?.toFixed(0)}% urgency - needs attention
                </Text>
              )}
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No active branding contracts</Text>
        )}
      </SectionCard>

      {/* Mileage */}
      <SectionCard title="Mileage" icon="📏">
        {mileage ? (
          <View>
            <View style={styles.mileageStats}>
              <View style={styles.mileageStat}>
                <Text style={styles.mileageLabel}>Lifetime</Text>
                <Text style={styles.mileageValue}>{(mileage.lifetime_km / 1000).toFixed(1)}k km</Text>
              </View>
              <View style={styles.mileageStat}>
                <Text style={styles.mileageLabel}>Since Service</Text>
                <Text style={styles.mileageValue}>{mileage.km_since_last_service?.toFixed(0)} km</Text>
              </View>
            </View>
            <ScoreBar
              score={100 - mileage.threshold_risk_score}
              label={`${mileage.km_to_threshold?.toFixed(0)} km to service threshold`}
            />
            {mileage.is_near_threshold && (
              <Text style={styles.urgencyWarning}>⚠️ Approaching maintenance threshold</Text>
            )}
          </View>
        ) : (
          <Text style={styles.emptyText}>No mileage data</Text>
        )}
      </SectionCard>

      {/* Cleaning */}
      <SectionCard title="Cleaning Status" icon="✨">
        {cleaning ? (
          <View>
            <View style={styles.cleaningRow}>
              <Text style={styles.cleaningLabel}>Status</Text>
              <StatusBadge status={cleaning.status} />
            </View>
            <View style={styles.cleaningRow}>
              <Text style={styles.cleaningLabel}>Last Cleaned</Text>
              <Text style={styles.cleaningValue}>
                {cleaning.days_since_last_cleaning?.toFixed(1)} days ago
              </Text>
            </View>
            {cleaning.special_clean_required && (
              <View style={styles.specialCleanBox}>
                <Text style={styles.specialCleanTitle}>Special Cleaning Required</Text>
                <Text style={styles.specialCleanReason}>{cleaning.special_clean_reason}</Text>
              </View>
            )}
            {cleaning.vip_inspection_tomorrow && (
              <View style={[styles.specialCleanBox, { borderColor: colors.purple.border }]}>
                <Text style={[styles.specialCleanTitle, { color: colors.purple.text }]}>
                  VIP Inspection Tomorrow
                </Text>
                <Text style={styles.specialCleanReason}>{cleaning.vip_inspection_notes}</Text>
              </View>
            )}
          </View>
        ) : (
          <Text style={styles.emptyText}>No cleaning data</Text>
        )}
      </SectionCard>

      <View style={styles.spacer} />
    </ScrollView>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bg.primary,
    padding: 24,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 16,
  },
  backBtn: {
    backgroundColor: colors.slate[700],
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  backBtnText: {
    color: colors.text.primary,
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    gap: 12,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  backIcon: {
    fontSize: 20,
    color: colors.text.secondary,
  },
  headerContent: {
    flex: 1,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text.primary,
  },
  headerMeta: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 4,
  },
  headerScore: {
    alignItems: 'flex-end',
  },
  headerScoreLabel: {
    fontSize: 11,
    color: colors.text.muted,
  },
  headerScoreValue: {
    fontSize: 28,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    gap: 8,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.bg.card,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.slate[800],
  },
  statIcon: {
    fontSize: 16,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
  },
  statLabel: {
    fontSize: 10,
    color: colors.text.muted,
    marginTop: 2,
  },
  sectionCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: colors.bg.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.slate[800],
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.slate[800],
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionIcon: {
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
  },
  sectionBody: {
    padding: 16,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '500',
  },
  listItem: {
    backgroundColor: colors.slate[800],
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  listItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  listItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  listItemMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaText: {
    fontSize: 11,
    color: colors.text.muted,
  },
  remarks: {
    fontSize: 11,
    color: colors.text.secondary,
    fontStyle: 'italic',
    marginTop: 8,
  },
  overrideWarning: {
    marginTop: 8,
  },
  overrideText: {
    fontSize: 11,
    color: colors.warning.text,
  },
  jobId: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: colors.text.muted,
  },
  jobTitle: {
    fontSize: 13,
    color: colors.text.primary,
    marginBottom: 8,
  },
  jobMeta: {
    flexDirection: 'row',
    gap: 12,
  },
  urgencyWarning: {
    fontSize: 11,
    color: colors.warning.text,
    marginTop: 8,
  },
  scoreBarContainer: {
    marginTop: 8,
  },
  scoreBarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  scoreBarLabel: {
    fontSize: 11,
    color: colors.text.muted,
  },
  scoreBarValue: {
    fontSize: 11,
    fontWeight: '500',
  },
  scoreBarTrack: {
    height: 6,
    backgroundColor: colors.slate[700],
    borderRadius: 3,
    overflow: 'hidden',
  },
  scoreBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  mileageStats: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 16,
  },
  mileageStat: {},
  mileageLabel: {
    fontSize: 11,
    color: colors.text.muted,
  },
  mileageValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
    marginTop: 2,
  },
  cleaningRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cleaningLabel: {
    fontSize: 13,
    color: colors.text.secondary,
  },
  cleaningValue: {
    fontSize: 13,
    color: colors.text.primary,
  },
  specialCleanBox: {
    backgroundColor: colors.warning.bg,
    borderWidth: 1,
    borderColor: colors.warning.border,
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  specialCleanTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.warning.text,
  },
  specialCleanReason: {
    fontSize: 11,
    color: colors.text.secondary,
    marginTop: 4,
  },
  emptyText: {
    fontSize: 13,
    color: colors.text.muted,
    textAlign: 'center',
    paddingVertical: 16,
  },
  spacer: {
    height: 32,
  },
});
