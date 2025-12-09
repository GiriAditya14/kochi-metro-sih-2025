import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { getDashboardSummary, generateMockData, generatePlan } from '../services/api';
import StatCard from '../components/StatCard';
import Button from '../components/Button';
import Badge from '../components/Badge';
import { Card, CardHeader, CardBody } from '../components/Card';
import Loading from '../components/Loading';

export default function DashboardScreen({ navigation }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [planLoading, setPlanLoading] = useState(false);

  const fetchSummary = async () => {
    try {
      const response = await getDashboardSummary();
      setSummary(response.data);
    } catch (err) {
      console.error('Failed to fetch summary:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchSummary();
  }, []);

  const handleGenerateMockData = async () => {
    setGenerating(true);
    try {
      await generateMockData(true);
      await fetchSummary();
      Alert.alert('Success', 'Demo data generated successfully');
    } catch (err) {
      Alert.alert('Error', 'Failed to generate demo data');
    } finally {
      setGenerating(false);
    }
  };

  const handleGeneratePlan = async () => {
    setPlanLoading(true);
    try {
      await generatePlan();
      await fetchSummary();
      Alert.alert('Success', 'Plan generated successfully');
    } catch (err) {
      Alert.alert('Error', 'Failed to generate plan');
    } finally {
      setPlanLoading(false);
    }
  };

  if (loading) return <Loading message={t('common.loading')} />;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      {/* Header Actions */}
      <View style={styles.headerActions}>
        <TouchableOpacity 
          style={[styles.copilotBtn, { backgroundColor: colors.purple + '20' }]}
          onPress={() => navigation.navigate('Copilot')}
        >
          <Ionicons name="sparkles" size={20} color={colors.purple} />
          <Text style={[styles.copilotText, { color: colors.purple }]}>{t('dashboard.aiCopilot')}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
          <Ionicons name="settings-outline" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* AI Status */}
      <Card style={styles.aiCard}>
        <View style={styles.aiContent}>
          <View style={[styles.aiIcon, { backgroundColor: summary?.ai_enabled ? colors.purple + '20' : colors.warning + '20' }]}>
            <Ionicons name="hardware-chip" size={24} color={summary?.ai_enabled ? colors.purple : colors.warning} />
          </View>
          <View style={styles.aiInfo}>
            <View style={styles.aiHeader}>
              <Text style={[styles.aiTitle, { color: colors.text }]}>{t('dashboard.aiCopilot')}</Text>
              <Badge text={summary?.ai_enabled ? t('dashboard.active') : t('dashboard.disabled')} type={summary?.ai_enabled ? 'success' : 'warning'} size="small" />
            </View>
            <Text style={[styles.aiDesc, { color: colors.textTertiary }]}>
              {summary?.ai_enabled ? 'Gemini AI providing intelligent recommendations' : 'Set GEMINI_API_KEY to enable'}
            </Text>
          </View>
        </View>
      </Card>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <StatCard
          icon="train"
          label={t('dashboard.activeTrains')}
          value={summary?.fleet?.active || 0}
          subValue={`of ${summary?.fleet?.total || 0} total`}
          color="blue"
        />
        <StatCard
          icon="shield-checkmark"
          label={t('dashboard.certificatesValid')}
          value={(summary?.fleet?.total || 0) * 3 - (summary?.certificates?.expired || 0)}
          subValue={`${summary?.certificates?.expiring_soon || 0} expiring soon`}
          color={summary?.certificates?.expired > 0 ? 'red' : 'green'}
          alert={summary?.certificates?.expired > 0}
        />
        <StatCard
          icon="construct"
          label={t('dashboard.openJobs')}
          value={summary?.maintenance?.open_jobs || 0}
          subValue={`${summary?.maintenance?.safety_critical || 0} safety critical`}
          color={summary?.maintenance?.safety_critical > 0 ? 'orange' : 'blue'}
          alert={summary?.maintenance?.safety_critical > 0}
        />
        <StatCard
          icon="pricetag"
          label={t('dashboard.brandingSLAs')}
          value={summary?.branding?.active_contracts || 0}
          subValue={`${summary?.branding?.at_risk || 0} at risk`}
          color={summary?.branding?.at_risk > 0 ? 'orange' : 'green'}
        />
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        {summary?.fleet?.total === 0 && (
          <Button
            title={t('dashboard.loadDemoData')}
            icon="sparkles"
            variant="secondary"
            onPress={handleGenerateMockData}
            loading={generating}
            style={styles.actionBtn}
          />
        )}
        <Button
          title={t('dashboard.generatePlan')}
          icon="calendar"
          onPress={handleGeneratePlan}
          loading={planLoading}
          disabled={summary?.fleet?.total === 0}
          style={styles.actionBtn}
        />
      </View>

      {/* Latest Plan */}
      <Card style={styles.planCard}>
        <CardHeader 
          title={t('dashboard.latestPlan')}
          right={
            summary?.latest_plan && (
              <Badge 
                text={summary.latest_plan.status?.toUpperCase()} 
                type={summary.latest_plan.status === 'approved' ? 'success' : 'info'} 
              />
            )
          }
        />
        <CardBody>
          {summary?.latest_plan ? (
            <>
              <Text style={[styles.planId, { color: colors.textSecondary }]}>
                {summary.latest_plan.plan_id}
              </Text>
              <View style={styles.planStats}>
                <View style={styles.planStat}>
                  <Text style={[styles.planStatValue, { color: colors.success }]}>
                    {summary.latest_plan.trains_in_service || 0}
                  </Text>
                  <Text style={[styles.planStatLabel, { color: colors.textTertiary }]}>{t('dashboard.service')}</Text>
                </View>
                <View style={styles.planStat}>
                  <Text style={[styles.planStatValue, { color: colors.primary }]}>
                    {summary.latest_plan.trains_standby || 0}
                  </Text>
                  <Text style={[styles.planStatLabel, { color: colors.textTertiary }]}>{t('dashboard.standby')}</Text>
                </View>
                <View style={styles.planStat}>
                  <Text style={[styles.planStatValue, { color: colors.warning }]}>
                    {summary.latest_plan.trains_ibl || 0}
                  </Text>
                  <Text style={[styles.planStatLabel, { color: colors.textTertiary }]}>{t('dashboard.ibl')}</Text>
                </View>
                <View style={styles.planStat}>
                  <Text style={[styles.planStatValue, { color: colors.textTertiary }]}>
                    {summary.latest_plan.trains_out_of_service || 0}
                  </Text>
                  <Text style={[styles.planStatLabel, { color: colors.textTertiary }]}>{t('dashboard.outOfService')}</Text>
                </View>
              </View>
            </>
          ) : (
            <View style={styles.noPlan}>
              <Ionicons name="train-outline" size={48} color={colors.textTertiary} />
              <Text style={[styles.noPlanText, { color: colors.textSecondary }]}>{t('dashboard.noPlan')}</Text>
              <Text style={[styles.noPlanHint, { color: colors.textTertiary }]}>{t('dashboard.tapGenerate')}</Text>
            </View>
          )}
        </CardBody>
      </Card>

      {/* Active Alerts */}
      <Card style={styles.alertsCard}>
        <CardHeader 
          title={t('dashboard.activeAlerts')}
          right={
            <TouchableOpacity onPress={() => navigation.navigate('Alerts')}>
              <Text style={[styles.viewAll, { color: colors.primary }]}>{t('dashboard.viewAll')}</Text>
            </TouchableOpacity>
          }
        />
        <CardBody>
          {(summary?.alerts?.unresolved > 0 || summary?.certificates?.expired > 0) ? (
            <View style={styles.alertsList}>
              {summary?.alerts?.critical > 0 && (
                <View style={styles.alertItem}>
                  <View style={[styles.alertIcon, { backgroundColor: colors.danger + '20' }]}>
                    <Ionicons name="alert-circle" size={16} color={colors.danger} />
                  </View>
                  <Text style={[styles.alertText, { color: colors.text }]}>
                    {summary.alerts.critical} critical alerts
                  </Text>
                </View>
              )}
              {summary?.certificates?.expired > 0 && (
                <View style={styles.alertItem}>
                  <View style={[styles.alertIcon, { backgroundColor: colors.warning + '20' }]}>
                    <Ionicons name="warning" size={16} color={colors.warning} />
                  </View>
                  <Text style={[styles.alertText, { color: colors.text }]}>
                    {summary.certificates.expired} certificates expired
                  </Text>
                </View>
              )}
              {summary?.maintenance?.safety_critical > 0 && (
                <View style={styles.alertItem}>
                  <View style={[styles.alertIcon, { backgroundColor: colors.warning + '20' }]}>
                    <Ionicons name="construct" size={16} color={colors.warning} />
                  </View>
                  <Text style={[styles.alertText, { color: colors.text }]}>
                    {summary.maintenance.safety_critical} safety-critical jobs
                  </Text>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.noAlerts}>
              <Ionicons name="checkmark-circle" size={48} color={colors.success + '50'} />
              <Text style={[styles.noAlertsText, { color: colors.textSecondary }]}>All systems operational</Text>
            </View>
          )}
        </CardBody>
      </Card>

      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  headerActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  copilotBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 },
  copilotText: { marginLeft: 6, fontWeight: '600', fontSize: 14 },
  aiCard: { marginBottom: 16 },
  aiContent: { flexDirection: 'row', padding: 16, alignItems: 'center' },
  aiIcon: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  aiInfo: { flex: 1, marginLeft: 12 },
  aiHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  aiTitle: { fontSize: 15, fontWeight: '600' },
  aiDesc: { fontSize: 12, marginTop: 2 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  actions: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  actionBtn: { flex: 1 },
  planCard: { marginBottom: 16 },
  planId: { fontSize: 13, fontFamily: 'monospace', marginBottom: 12 },
  planStats: { flexDirection: 'row', justifyContent: 'space-around' },
  planStat: { alignItems: 'center' },
  planStatValue: { fontSize: 24, fontWeight: '700' },
  planStatLabel: { fontSize: 11, marginTop: 2 },
  noPlan: { alignItems: 'center', paddingVertical: 24 },
  noPlanText: { fontSize: 15, marginTop: 12 },
  noPlanHint: { fontSize: 12, marginTop: 4 },
  alertsCard: { marginBottom: 16 },
  viewAll: { fontSize: 13, fontWeight: '500' },
  alertsList: { gap: 12 },
  alertItem: { flexDirection: 'row', alignItems: 'center' },
  alertIcon: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  alertText: { fontSize: 14 },
  noAlerts: { alignItems: 'center', paddingVertical: 24 },
  noAlertsText: { fontSize: 14, marginTop: 8 },
});
