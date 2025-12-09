import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { getTrain } from '../services/api';
import Badge from '../components/Badge';
import ScoreBar from '../components/ScoreBar';
import { Card, CardHeader, CardBody } from '../components/Card';
import Loading from '../components/Loading';

function QuickStat({ icon, label, value, subValue, color }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.quickStat, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.quickStatHeader}>
        <Ionicons name={icon} size={14} color={colors.textTertiary} />
        <Text style={[styles.quickStatLabel, { color: colors.textTertiary }]}>{label}</Text>
      </View>
      <Text style={[styles.quickStatValue, { color: color || colors.text }]}>{value}</Text>
      {subValue && <Text style={[styles.quickStatSub, { color: colors.textTertiary }]}>{subValue}</Text>}
    </View>
  );
}

export default function TrainDetailsScreen({ route }) {
  const { trainId } = route.params;
  const { colors } = useTheme();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrain = async () => {
      try {
        const response = await getTrain(trainId);
        setData(response.data);
      } catch (err) {
        console.error('Failed to fetch train:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTrain();
  }, [trainId]);

  if (loading) return <Loading />;
  if (!data?.train) return (
    <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
      <Ionicons name="alert-circle" size={64} color={colors.warning} />
      <Text style={[styles.errorText, { color: colors.text }]}>Train not found</Text>
    </View>
  );


  const { train, fitness_certificates, job_cards, branding_contracts, mileage, cleaning } = data;
  const validCerts = fitness_certificates?.filter(c => c.status === 'Valid' || c.is_currently_valid).length || 0;
  const totalCerts = fitness_certificates?.length || 0;
  const openJobs = job_cards?.filter(j => j.status !== 'CLOSED').length || 0;
  const safetyJobs = job_cards?.filter(j => j.safety_critical && j.status !== 'CLOSED').length || 0;

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={[styles.trainId, { color: colors.text }]}>{train.train_id}</Text>
            <Text style={[styles.trainMeta, { color: colors.textTertiary }]}>
              {train.configuration} • {train.manufacturer} • {train.depot_id}
            </Text>
          </View>
          <Badge text={train.status} type={train.status === 'active' ? 'success' : train.status === 'under_maintenance' ? 'warning' : 'danger'} />
        </View>
        <View style={styles.healthScore}>
          <Text style={[styles.healthLabel, { color: colors.textTertiary }]}>Overall Health Score</Text>
          <Text style={[styles.healthValue, { color: train.overall_health_score >= 80 ? colors.success : train.overall_health_score >= 60 ? colors.warning : colors.danger }]}>
            {train.overall_health_score?.toFixed(0)}%
          </Text>
        </View>
      </View>

      {/* Quick Stats */}
      <View style={styles.quickStats}>
        <QuickStat icon="shield-checkmark" label="Certificates" value={`${validCerts}/${totalCerts}`} subValue="Valid" color={validCerts === totalCerts ? colors.success : colors.warning} />
        <QuickStat icon="construct" label="Open Jobs" value={openJobs} subValue={`${safetyJobs} safety`} color={safetyJobs > 0 ? colors.danger : colors.text} />
        <QuickStat icon="speedometer" label="Mileage" value={mileage ? `${(mileage.lifetime_km / 1000).toFixed(1)}k` : 'N/A'} subValue="km lifetime" />
        <QuickStat icon="location" label="Location" value={train.current_track || 'N/A'} subValue={`Pos ${train.current_position ?? 'N/A'}`} />
      </View>

      {/* Certificates */}
      <Card style={styles.section}>
        <CardHeader title="Fitness Certificates" right={<Badge text={`${validCerts}/${totalCerts}`} type={validCerts === totalCerts ? 'success' : 'warning'} size="small" />} />
        <CardBody>
          {fitness_certificates?.length > 0 ? fitness_certificates.map((cert, idx) => (
            <View key={idx} style={[styles.certItem, { backgroundColor: colors.background }]}>
              <View style={styles.certHeader}>
                <Text style={[styles.certDept, { color: colors.text }]}>{cert.department}</Text>
                <Badge text={cert.status} type={cert.status === 'Valid' ? 'success' : cert.status === 'ExpiringSoon' ? 'warning' : 'danger'} size="small" />
              </View>
              <View style={styles.certDetails}>
                <Text style={[styles.certDetail, { color: colors.textTertiary }]}>Valid until: {cert.valid_to ? new Date(cert.valid_to).toLocaleDateString() : 'N/A'}</Text>
                <Text style={[styles.certDetail, { color: cert.hours_until_expiry < 24 ? colors.danger : cert.hours_until_expiry < 48 ? colors.warning : colors.textTertiary }]}>
                  {cert.hours_until_expiry?.toFixed(1)}h left
                </Text>
              </View>
              {cert.emergency_override && (
                <View style={styles.overrideWarning}>
                  <Ionicons name="warning" size={12} color={colors.warning} />
                  <Text style={[styles.overrideText, { color: colors.warning }]}>Emergency override active</Text>
                </View>
              )}
            </View>
          )) : <Text style={[styles.emptyText, { color: colors.textTertiary }]}>No certificates found</Text>}
        </CardBody>
      </Card>

      {/* Job Cards */}
      <Card style={styles.section}>
        <CardHeader title="Job Cards" right={openJobs > 0 && <Badge text={`${openJobs} Open`} type="warning" size="small" />} />
        <CardBody>
          {job_cards?.length > 0 ? job_cards.slice(0, 5).map((job, idx) => (
            <View key={idx} style={[styles.jobItem, { backgroundColor: colors.background }]}>
              <View style={styles.jobHeader}>
                <Text style={[styles.jobId, { color: colors.textTertiary }]}>{job.job_id}</Text>
                <Badge text={job.status} type={job.status === 'CLOSED' ? 'success' : job.status === 'IN_PROGRESS' ? 'info' : 'warning'} size="small" />
              </View>
              <Text style={[styles.jobTitle, { color: colors.text }]} numberOfLines={1}>{job.title}</Text>
              <View style={styles.jobMeta}>
                <Text style={[styles.jobMetaText, { color: job.safety_critical ? colors.danger : colors.textTertiary }]}>
                  {job.safety_critical ? '⚠ Safety Critical' : job.job_type}
                </Text>
                <Text style={[styles.jobMetaText, { color: colors.textTertiary }]}>Priority {job.priority}</Text>
              </View>
            </View>
          )) : <Text style={[styles.emptyText, { color: colors.textTertiary }]}>No job cards found</Text>}
        </CardBody>
      </Card>

      {/* Branding */}
      {branding_contracts?.length > 0 && (
        <Card style={styles.section}>
          <CardHeader title="Branding Contracts" right={<Badge text={`${branding_contracts.length} Active`} type="info" size="small" />} />
          <CardBody>
            {branding_contracts.map((contract, idx) => (
              <View key={idx} style={[styles.brandItem, { backgroundColor: colors.background }]}>
                <View style={styles.brandHeader}>
                  <Text style={[styles.brandName, { color: colors.text }]}>{contract.brand_name}</Text>
                  <Badge text={contract.priority} type={contract.priority === 'platinum' ? 'danger' : contract.priority === 'gold' ? 'warning' : 'info'} size="small" />
                </View>
                <ScoreBar score={(contract.current_exposure_hours_week / contract.target_exposure_hours_weekly) * 100} label={`Weekly: ${contract.current_exposure_hours_week?.toFixed(1)}h / ${contract.target_exposure_hours_weekly}h`} />
              </View>
            ))}
          </CardBody>
        </Card>
      )}

      {/* Mileage & Cleaning */}
      <View style={styles.row}>
        <Card style={[styles.halfCard, { marginRight: 8 }]}>
          <CardHeader title="Mileage" />
          <CardBody>
            {mileage ? (
              <>
                <Text style={[styles.mileageValue, { color: colors.text }]}>{(mileage.lifetime_km / 1000).toFixed(1)}k km</Text>
                <Text style={[styles.mileageLabel, { color: colors.textTertiary }]}>Lifetime</Text>
                <ScoreBar score={100 - (mileage.threshold_risk_score || 0)} label={`${mileage.km_to_threshold?.toFixed(0)} km to service`} />
              </>
            ) : <Text style={[styles.emptyText, { color: colors.textTertiary }]}>No data</Text>}
          </CardBody>
        </Card>
        <Card style={[styles.halfCard, { marginLeft: 8 }]}>
          <CardHeader title="Cleaning" />
          <CardBody>
            {cleaning ? (
              <>
                <Badge text={cleaning.status} type={cleaning.status === 'ok' ? 'success' : cleaning.status === 'needs_cleaning' ? 'warning' : 'danger'} />
                <Text style={[styles.cleaningDays, { color: colors.text }]}>{cleaning.days_since_last_cleaning?.toFixed(1)} days</Text>
                <Text style={[styles.cleaningLabel, { color: colors.textTertiary }]}>since last cleaning</Text>
              </>
            ) : <Text style={[styles.emptyText, { color: colors.textTertiary }]}>No data</Text>}
          </CardBody>
        </Card>
      </View>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: 18, marginTop: 16 },
  header: { margin: 16, padding: 16, borderRadius: 12, borderWidth: 1 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  trainId: { fontSize: 24, fontWeight: '700' },
  trainMeta: { fontSize: 12, marginTop: 4 },
  healthScore: { marginTop: 16, alignItems: 'flex-end' },
  healthLabel: { fontSize: 12 },
  healthValue: { fontSize: 32, fontWeight: '700' },
  quickStats: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 8 },
  quickStat: { width: '47%', padding: 12, borderRadius: 10, borderWidth: 1 },
  quickStatHeader: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  quickStatLabel: { fontSize: 11 },
  quickStatValue: { fontSize: 20, fontWeight: '700' },
  quickStatSub: { fontSize: 10 },
  section: { margin: 16, marginTop: 8 },
  certItem: { padding: 12, borderRadius: 8, marginBottom: 8 },
  certHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  certDept: { fontSize: 14, fontWeight: '600' },
  certDetails: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  certDetail: { fontSize: 12 },
  overrideWarning: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 4 },
  overrideText: { fontSize: 11 },
  jobItem: { padding: 12, borderRadius: 8, marginBottom: 8 },
  jobHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  jobId: { fontSize: 11, fontFamily: 'monospace' },
  jobTitle: { fontSize: 13, fontWeight: '500', marginTop: 4 },
  jobMeta: { flexDirection: 'row', gap: 12, marginTop: 6 },
  jobMetaText: { fontSize: 11 },
  brandItem: { padding: 12, borderRadius: 8, marginBottom: 8 },
  brandHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  brandName: { fontSize: 14, fontWeight: '600' },
  row: { flexDirection: 'row', paddingHorizontal: 16 },
  halfCard: { flex: 1 },
  mileageValue: { fontSize: 24, fontWeight: '700' },
  mileageLabel: { fontSize: 11, marginBottom: 8 },
  cleaningDays: { fontSize: 24, fontWeight: '700', marginTop: 8 },
  cleaningLabel: { fontSize: 11 },
  emptyText: { fontSize: 13, textAlign: 'center', paddingVertical: 16 },
});
