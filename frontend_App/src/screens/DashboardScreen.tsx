import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { getDashboardSummary, generateMockData, generatePlan, getDailyBriefing } from '../lib/api';
import { mockDashboardSummary, mockDailyBriefing } from '../data/mockData';
import { colors } from '../lib/utils';

interface DashboardSummary {
  fleet: { total: number; active: number };
  certificates: { expired: number; expiring_soon: number };
  maintenance: { open_jobs: number; safety_critical: number };
  branding: { active_contracts: number; at_risk: number };
  cleaning: { overdue: number };
  alerts: { unresolved: number; critical: number };
  ai_enabled: boolean;
  latest_plan: any;
}

const StatCard = ({
  icon, label, value, subValue, color = 'blue', alert = false,
}: {
  icon: string; label: string; value: number | string; subValue?: string;
  color?: 'blue' | 'green' | 'orange' | 'red' | 'purple'; alert?: boolean;
}) => {
  const colorMap = {
    blue: colors.primary[500], green: colors.emerald[500], orange: colors.amber[500],
    red: colors.red[500], purple: '#a855f7',
  };
  return (
    <View style={[styles.statCard, alert && styles.statCardAlert]}>
      {alert && <View style={styles.alertDot} />}
      <View style={styles.statContent}>
        <Text style={styles.statLabel}>{label}</Text>
        <Text style={styles.statValue}>{value}</Text>
        {subValue && <Text style={styles.statSubValue}>{subValue}</Text>}
      </View>
      <View style={[styles.statIcon, { backgroundColor: colorMap[color] }]}>
        <Text style={styles.statIconText}>{icon}</Text>
      </View>
    </View>
  );
};

const QuickActionCard = ({ icon, title, subtitle, onPress, color }: {
  icon: string; title: string; subtitle: string; onPress: () => void; color: string;
}) => (
  <TouchableOpacity style={styles.quickAction} onPress={onPress}>
    <View style={[styles.quickActionIcon, { backgroundColor: color + '20' }]}>
      <Text style={styles.quickActionIconText}>{icon}</Text>
    </View>
    <View style={styles.quickActionContent}>
      <Text style={styles.quickActionTitle}>{title}</Text>
      <Text style={styles.quickActionSubtitle}>{subtitle}</Text>
    </View>
  </TouchableOpacity>
);

export default function DashboardScreen() {
  const navigation = useNavigation<any>();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [planLoading, setPlanLoading] = useState(false);
  const [briefing, setBriefing] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const response = await getDashboardSummary();
      setSummary(response.data);
    } catch (err) {
      console.log('Using mock data - backend not available');
      setSummary(mockDashboardSummary);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchBriefing = async () => {
    try {
      const response = await getDailyBriefing();
      setBriefing(response.data.briefing);
    } catch (err) {
      setBriefing(mockDailyBriefing);
    }
  };

  useEffect(() => { fetchSummary(); }, []);
  useEffect(() => { if (summary?.ai_enabled) fetchBriefing(); }, [summary?.ai_enabled]);

  const handleGenerateMockData = async () => {
    setGenerating(true);
    try {
      await generateMockData(true);
      await fetchSummary();
    } catch (err) {
      console.error('Failed to generate mock data:', err);
    } finally {
      setGenerating(false);
    }
  };

  const handleGeneratePlan = async () => {
    setPlanLoading(true);
    try {
      await generatePlan();
      await fetchSummary();
    } catch (err) {
      console.error('Failed to generate plan:', err);
    } finally {
      setPlanLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
        <Text style={styles.loadingText}>Connecting to KMRL System...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} refreshControl={
      <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchSummary(); }}
        tintColor={colors.primary[500]} />
    }>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Operations Dashboard</Text>
        <Text style={styles.headerSubtitle}>Kochi Metro Rail - Train Induction Planning System</Text>
      </View>

      <View style={styles.actionButtons}>
        {summary?.fleet?.total === 0 && (
          <TouchableOpacity style={styles.secondaryButton} onPress={handleGenerateMockData} disabled={generating}>
            {generating ? <ActivityIndicator size="small" color={colors.text.primary} /> :
              <Text style={styles.buttonText}>✨ Load Demo Data</Text>}
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.primaryButton} onPress={handleGeneratePlan}
          disabled={planLoading || summary?.fleet?.total === 0}>
          {planLoading ? <ActivityIndicator size="small" color="#fff" /> :
            <Text style={styles.primaryButtonText}>🎯 Generate Tonight's Plan</Text>}
        </TouchableOpacity>
      </View>

      <View style={[styles.aiCard, summary?.ai_enabled ? styles.aiCardEnabled : styles.aiCardDisabled]}>
        <View style={[styles.aiIcon, { backgroundColor: summary?.ai_enabled ? colors.purple.bg : colors.warning.bg }]}>
          <Text style={styles.aiIconText}>🧠</Text>
        </View>
        <View style={styles.aiContent}>
          <View style={styles.aiHeader}>
            <Text style={styles.aiTitle}>AI Copilot</Text>
            <View style={[styles.aiBadge, { backgroundColor: summary?.ai_enabled ? colors.success.bg : colors.warning.bg }]}>
              <Text style={[styles.aiBadgeText, { color: summary?.ai_enabled ? colors.success.text : colors.warning.text }]}>
                {summary?.ai_enabled ? 'Active' : 'Disabled'}
              </Text>
            </View>
          </View>
          <Text style={styles.aiDescription}>
            {summary?.ai_enabled ? 'Gemini AI providing intelligent explanations' : 'Set GEMINI_API_KEY to enable AI'}
          </Text>
        </View>
      </View>

      <View style={styles.statsGrid}>
        <StatCard icon="🚇" label="Fleet Status" value={summary?.fleet?.active || 0}
          subValue={`of ${summary?.fleet?.total || 0} trains active`} color="blue" />
        <StatCard icon="🛡️" label="Certificates Valid"
          value={summary?.fleet?.total ? summary.fleet.total * 3 - (summary?.certificates?.expired || 0) - (summary?.certificates?.expiring_soon || 0) : 0}
          subValue={`${summary?.certificates?.expiring_soon || 0} expiring within 48h`}
          color={summary?.certificates?.expired ? 'red' : 'green'} alert={(summary?.certificates?.expired || 0) > 0} />
        <StatCard icon="🔧" label="Open Jobs" value={summary?.maintenance?.open_jobs || 0}
          subValue={`${summary?.maintenance?.safety_critical || 0} safety critical`}
          color={(summary?.maintenance?.safety_critical || 0) > 0 ? 'orange' : 'blue'}
          alert={(summary?.maintenance?.safety_critical || 0) > 0} />
        <StatCard icon="📊" label="Branding SLAs" value={summary?.branding?.active_contracts || 0}
          subValue={`${summary?.branding?.at_risk || 0} at risk of penalty`}
          color={(summary?.branding?.at_risk || 0) > 0 ? 'orange' : 'green'} />
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Text style={styles.cardHeaderIcon}>📅</Text>
            <Text style={styles.cardTitle}>Latest Induction Plan</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('InductionPlanner')}>
            <Text style={styles.cardLink}>View Details →</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.cardBody}>
          {summary?.latest_plan ? (
            <>
              <View style={styles.planHeader}>
                <View>
                  <Text style={styles.planLabel}>Plan ID</Text>
                  <Text style={styles.planId}>{summary.latest_plan.plan_id}</Text>
                </View>
                <View style={[styles.statusBadge, {
                  backgroundColor: summary.latest_plan.status === 'approved' ? colors.success.bg :
                    summary.latest_plan.status === 'proposed' ? colors.info.bg : colors.warning.bg
                }]}>
                  <Text style={[styles.statusBadgeText, {
                    color: summary.latest_plan.status === 'approved' ? colors.success.text :
                      summary.latest_plan.status === 'proposed' ? colors.info.text : colors.warning.text
                  }]}>{summary.latest_plan.status?.toUpperCase()}</Text>
                </View>
              </View>
              <View style={styles.planStats}>
                <View style={styles.planStat}>
                  <Text style={[styles.planStatValue, { color: colors.emerald[400] }]}>{summary.latest_plan.trains_in_service || 0}</Text>
                  <Text style={styles.planStatLabel}>Service</Text>
                </View>
                <View style={styles.planStat}>
                  <Text style={[styles.planStatValue, { color: colors.blue[400] }]}>{summary.latest_plan.trains_standby || 0}</Text>
                  <Text style={styles.planStatLabel}>Standby</Text>
                </View>
                <View style={styles.planStat}>
                  <Text style={[styles.planStatValue, { color: colors.amber[400] }]}>{summary.latest_plan.trains_ibl || 0}</Text>
                  <Text style={styles.planStatLabel}>IBL</Text>
                </View>
                <View style={styles.planStat}>
                  <Text style={[styles.planStatValue, { color: colors.slate[400] }]}>{summary.latest_plan.trains_out_of_service || 0}</Text>
                  <Text style={styles.planStatLabel}>Out of Service</Text>
                </View>
              </View>
            </>
          ) : (
            <View style={styles.emptyPlan}>
              <Text style={styles.emptyIcon}>🚇</Text>
              <Text style={styles.emptyText}>No plan generated yet</Text>
              <Text style={styles.emptySubtext}>{summary?.fleet?.total ? 'Click "Generate Tonight\'s Plan"' : 'First load demo data'}</Text>
            </View>
          )}
        </View>
      </View>

      {summary?.ai_enabled && briefing && (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <Text style={styles.cardHeaderIcon}>📝</Text>
              <Text style={styles.cardTitle}>AI Daily Briefing</Text>
            </View>
          </View>
          <View style={styles.cardBody}>
            <Text style={styles.briefingText}>{briefing}</Text>
          </View>
        </View>
      )}

      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.quickActions}>
        <QuickActionCard icon="🎯" title="Night Induction Planner" subtitle="Review and approve tomorrow's plan"
          onPress={() => navigation.navigate('InductionPlanner')} color={colors.primary[500]} />
        <QuickActionCard icon="⚡" title="What-If Simulator" subtitle="Test scenarios and compare outcomes"
          onPress={() => navigation.navigate('WhatIfSimulator')} color="#a855f7" />
        <QuickActionCard icon="✨" title="Data Playground" subtitle="Upload certificates, jobs & contracts"
          onPress={() => navigation.navigate('DataPlayground')} color={colors.orange[500]} />
      </View>
      <View style={styles.spacer} />
    </ScrollView>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.primary },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg.primary },
  loadingText: { marginTop: 16, color: colors.text.secondary, fontSize: 14 },
  header: { padding: 16 },
  headerTitle: { fontSize: 24, fontWeight: '700', color: colors.text.primary },
  headerSubtitle: { fontSize: 13, color: colors.text.secondary, marginTop: 4 },
  actionButtons: { flexDirection: 'row', paddingHorizontal: 16, gap: 12, marginBottom: 16 },
  primaryButton: { flex: 1, backgroundColor: colors.primary[600], paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  primaryButtonText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  secondaryButton: { flex: 1, backgroundColor: colors.slate[700], paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: colors.text.primary, fontWeight: '600', fontSize: 14 },
  aiCard: { marginHorizontal: 16, marginBottom: 16, padding: 16, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1 },
  aiCardEnabled: { backgroundColor: colors.bg.card, borderColor: colors.purple.border },
  aiCardDisabled: { backgroundColor: colors.bg.card, borderColor: colors.warning.border },
  aiIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  aiIconText: { fontSize: 20 },
  aiContent: { flex: 1 },
  aiHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  aiTitle: { fontSize: 15, fontWeight: '600', color: colors.text.primary },
  aiBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  aiBadgeText: { fontSize: 11, fontWeight: '500' },
  aiDescription: { fontSize: 12, color: colors.text.secondary, marginTop: 4 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 8 },
  statCard: { width: '48%', backgroundColor: colors.bg.card, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: colors.slate[800], flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  statCardAlert: { borderColor: colors.danger.border },
  alertDot: { position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: 4, backgroundColor: colors.red[500] },
  statContent: { flex: 1 },
  statLabel: { fontSize: 12, color: colors.text.secondary },
  statValue: { fontSize: 28, fontWeight: '700', color: colors.text.primary, marginTop: 4 },
  statSubValue: { fontSize: 11, color: colors.text.muted, marginTop: 2 },
  statIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  statIconText: { fontSize: 20 },
  card: { marginHorizontal: 16, marginTop: 16, backgroundColor: colors.bg.card, borderRadius: 12, borderWidth: 1, borderColor: colors.slate[800], overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.slate[800] },
  cardHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardHeaderIcon: { fontSize: 16 },
  cardTitle: { fontSize: 15, fontWeight: '600', color: colors.text.primary },
  cardLink: { fontSize: 13, color: colors.primary[400] },
  cardBody: { padding: 16 },
  planHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  planLabel: { fontSize: 12, color: colors.text.secondary },
  planId: { fontSize: 14, fontFamily: 'monospace', color: colors.text.primary, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusBadgeText: { fontSize: 11, fontWeight: '600' },
  planStats: { flexDirection: 'row', justifyContent: 'space-around', paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.slate[800] },
  planStat: { alignItems: 'center' },
  planStatValue: { fontSize: 24, fontWeight: '700' },
  planStatLabel: { fontSize: 11, color: colors.text.secondary, marginTop: 4 },
  emptyPlan: { alignItems: 'center', paddingVertical: 24 },
  emptyIcon: { fontSize: 40, opacity: 0.5, marginBottom: 12 },
  emptyText: { fontSize: 14, color: colors.text.secondary },
  emptySubtext: { fontSize: 12, color: colors.text.muted, marginTop: 4 },
  briefingText: { fontSize: 13, color: colors.text.secondary, lineHeight: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: colors.text.primary, marginHorizontal: 16, marginTop: 24, marginBottom: 12 },
  quickActions: { paddingHorizontal: 16, gap: 12 },
  quickAction: { backgroundColor: colors.bg.card, borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 16, borderWidth: 1, borderColor: colors.slate[800] },
  quickActionIcon: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  quickActionIconText: { fontSize: 22 },
  quickActionContent: { flex: 1 },
  quickActionTitle: { fontSize: 15, fontWeight: '600', color: colors.text.primary },
  quickActionSubtitle: { fontSize: 12, color: colors.text.secondary, marginTop: 2 },
  spacer: { height: 32 },
});
