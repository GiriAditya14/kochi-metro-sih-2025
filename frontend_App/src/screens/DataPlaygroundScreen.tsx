import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { getTrains, getCertificates, getJobCards, getBrandingContracts, getMileage, getCleaningRecords, generateMockData } from '../lib/api';
import { mockTrains, mockCertificates, mockJobCards, mockBranding, mockMileage, mockCleaning } from '../data/mockData';
import { colors, getStatusColors, getScoreColor } from '../lib/utils';
import { useAuth } from '../context/AuthContext';

type TabType = 'trains' | 'certificates' | 'jobs' | 'branding' | 'mileage' | 'cleaning';

const tabs: { id: TabType; label: string; icon: string }[] = [
  { id: 'trains', label: 'Trains', icon: '🚇' },
  { id: 'certificates', label: 'Certificates', icon: '🛡️' },
  { id: 'jobs', label: 'Job Cards', icon: '🔧' },
  { id: 'branding', label: 'Branding', icon: '🏷️' },
  { id: 'mileage', label: 'Mileage', icon: '📏' },
  { id: 'cleaning', label: 'Cleaning', icon: '✨' },
];

const StatusBadge = ({ value, type = 'status' }: { value: string; type?: 'status' | 'priority' }) => {
  const statusColors = getStatusColors(value, type);
  return (
    <View style={[styles.badge, { backgroundColor: statusColors.bg }]}>
      <Text style={[styles.badgeText, { color: statusColors.text }]}>{value}</Text>
    </View>
  );
};

export default function DataPlaygroundScreen() {
  const { canAccess } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('trains');
  const [data, setData] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  // Check access
  if (!canAccess('dataPlayground')) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.noAccess}>
          <Text style={styles.noAccessIcon}>🔒</Text>
          <Text style={styles.noAccessTitle}>Access Restricted</Text>
          <Text style={styles.noAccessText}>
            You need Worker or Admin role to access the Data Playground.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const fetchData = async () => {
    setLoading(true);
    try {
      const [trains, certs, jobs, branding, mileage, cleaning] = await Promise.all([
        getTrains(), getCertificates(), getJobCards(), getBrandingContracts(), getMileage(), getCleaningRecords(),
      ]);
      setData({
        trains: trains.data.trains || [],
        certificates: certs.data.certificates || [],
        jobs: jobs.data.job_cards || [],
        branding: branding.data.contracts || [],
        mileage: mileage.data.mileage_data || [],
        cleaning: cleaning.data.cleaning_records || [],
      });
    } catch (err) {
      console.log('Using mock data - backend not available');
      setData({
        trains: mockTrains, certificates: mockCertificates, jobs: mockJobCards,
        branding: mockBranding, mileage: mockMileage, cleaning: mockCleaning,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleGenerateMock = async () => {
    setGenerating(true);
    try {
      await generateMockData(true);
      await fetchData();
      setSuccess('Demo data generated! This includes 25 trains with realistic edge cases.');
    } catch (err) {
      setSuccess('Demo data loaded locally.');
    }
    setTimeout(() => setSuccess(null), 5000);
    setGenerating(false);
  };

  const renderTrainItem = (item: any) => (
    <View key={item.id} style={styles.dataRow}>
      <View style={styles.dataRowMain}>
        <Text style={styles.dataId}>{item.train_id}</Text>
        <Text style={styles.dataMeta}>{item.configuration} • {item.depot_id}</Text>
      </View>
      <View style={styles.dataRowRight}>
        <StatusBadge value={item.status} />
        <View style={styles.healthBar}>
          <View
            style={[
              styles.healthFill,
              {
                width: `${item.overall_health_score || 0}%`,
                backgroundColor: getScoreColor(item.overall_health_score),
              },
            ]}
          />
        </View>
        <Text style={styles.healthText}>{item.overall_health_score?.toFixed(0)}%</Text>
      </View>
    </View>
  );

  const renderCertificateItem = (item: any) => (
    <View key={item.id} style={styles.dataRow}>
      <View style={styles.dataRowMain}>
        <Text style={styles.dataId}>{item.certificate_number}</Text>
        <Text style={styles.dataMeta}>Train: {item.train_id} • {item.department}</Text>
      </View>
      <View style={styles.dataRowRight}>
        <StatusBadge value={item.status} />
        <Text style={[styles.hoursText, {
          color: item.hours_until_expiry < 24 ? colors.danger.text :
            item.hours_until_expiry < 48 ? colors.warning.text : colors.text.secondary
        }]}>
          {item.hours_until_expiry?.toFixed(1)}h
        </Text>
      </View>
    </View>
  );

  const renderJobItem = (item: any) => (
    <View key={item.id} style={styles.dataRow}>
      <View style={styles.dataRowMain}>
        <Text style={styles.dataId}>{item.job_id}</Text>
        <Text style={styles.dataMeta} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.dataMeta}>Train: {item.train_id}</Text>
      </View>
      <View style={styles.dataRowRight}>
        <StatusBadge value={item.status} />
        {item.safety_critical && (
          <Text style={styles.safetyBadge}>⚠️ Critical</Text>
        )}
      </View>
    </View>
  );

  const renderBrandingItem = (item: any) => (
    <View key={item.id} style={styles.dataRow}>
      <View style={styles.dataRowMain}>
        <Text style={styles.dataId}>{item.brand_name}</Text>
        <Text style={styles.dataMeta}>Train: {item.train_id}</Text>
      </View>
      <View style={styles.dataRowRight}>
        <StatusBadge value={item.priority} type="priority" />
        <Text style={[styles.urgencyText, {
          color: item.urgency_score > 70 ? colors.danger.text :
            item.urgency_score > 40 ? colors.warning.text : colors.success.text
        }]}>
          {item.urgency_score?.toFixed(0)}% urgency
        </Text>
      </View>
    </View>
  );

  const renderMileageItem = (item: any) => (
    <View key={item.id} style={styles.dataRow}>
      <View style={styles.dataRowMain}>
        <Text style={styles.dataId}>{item.train_id}</Text>
        <Text style={styles.dataMeta}>
          Lifetime: {(item.lifetime_km / 1000)?.toFixed(1)}k km
        </Text>
      </View>
      <View style={styles.dataRowRight}>
        <Text style={[styles.riskText, {
          color: item.threshold_risk_score >= 70 ? colors.danger.text :
            item.threshold_risk_score >= 40 ? colors.warning.text : colors.success.text
        }]}>
          {item.threshold_risk_score?.toFixed(0)}% risk
        </Text>
      </View>
    </View>
  );

  const renderCleaningItem = (item: any) => (
    <View key={item.id} style={styles.dataRow}>
      <View style={styles.dataRowMain}>
        <Text style={styles.dataId}>{item.train_id}</Text>
        <Text style={styles.dataMeta}>
          {item.days_since_last_cleaning?.toFixed(1)} days since cleaning
        </Text>
      </View>
      <View style={styles.dataRowRight}>
        <StatusBadge value={item.status} />
        {item.special_clean_required && (
          <Text style={styles.specialBadge}>Special</Text>
        )}
      </View>
    </View>
  );

  const renderDataList = () => {
    const items = data[activeTab] || [];
    if (items.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>💾</Text>
          <Text style={styles.emptyText}>No data available</Text>
          <Text style={styles.emptySubtext}>Generate demo data or add records manually</Text>
        </View>
      );
    }

    switch (activeTab) {
      case 'trains': return items.map(renderTrainItem);
      case 'certificates': return items.map(renderCertificateItem);
      case 'jobs': return items.map(renderJobItem);
      case 'branding': return items.map(renderBrandingItem);
      case 'mileage': return items.map(renderMileageItem);
      case 'cleaning': return items.map(renderCleaningItem);
      default: return null;
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); fetchData(); }}
          tintColor={colors.primary[500]}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Data Playground</Text>
          <Text style={styles.headerSubtitle}>
            Upload and manage fleet data
          </Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.refreshBtn} onPress={fetchData}>
            <Text style={styles.refreshBtnText}>🔄</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.generateBtn}
            onPress={handleGenerateMock}
            disabled={generating}
          >
            {generating ? (
              <ActivityIndicator size="small" color={colors.text.primary} />
            ) : (
              <Text style={styles.generateBtnText}>✨ Demo Data</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Success Message */}
      {success && (
        <View style={styles.successCard}>
          <Text style={styles.successIcon}>✅</Text>
          <Text style={styles.successText}>{success}</Text>
        </View>
      )}

      {/* Tab Stats */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsContainer}>
        {tabs.map((tab) => {
          const count = data[tab.id]?.length || 0;
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tabCard, isActive && styles.tabCardActive]}
              onPress={() => setActiveTab(tab.id)}
            >
              <View style={styles.tabHeader}>
                <Text style={styles.tabIcon}>{tab.icon}</Text>
                <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                  {tab.label}
                </Text>
              </View>
              <Text style={styles.tabCount}>{count}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Data List */}
      <View style={styles.dataCard}>
        <View style={styles.dataHeader}>
          <Text style={styles.dataTitle}>
            {tabs.find((t) => t.id === activeTab)?.label}
          </Text>
          <Text style={styles.dataCount}>
            {data[activeTab]?.length || 0} records
          </Text>
        </View>
        <View style={styles.dataBody}>{renderDataList()}</View>
      </View>

      {/* Info Card */}
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Data Integration Sources</Text>
        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <Text style={[styles.infoLabel, { color: colors.primary[400] }]}>IBM Maximo</Text>
            <Text style={styles.infoDesc}>Job cards, work orders</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={[styles.infoLabel, { color: colors.success.text }]}>UNS/IoT</Text>
            <Text style={styles.infoDesc}>Real-time sensor data</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={[styles.infoLabel, { color: colors.warning.text }]}>Manual Entry</Text>
            <Text style={styles.infoDesc}>Certificates, branding</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={[styles.infoLabel, { color: '#a855f7' }]}>CSV Import</Text>
            <Text style={styles.infoDesc}>Bulk data upload</Text>
          </View>
        </View>
      </View>

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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
  },
  headerLeft: {
    flex: 1,
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
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  refreshBtn: {
    padding: 8,
  },
  refreshBtnText: {
    fontSize: 18,
  },
  generateBtn: {
    backgroundColor: colors.slate[700],
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  generateBtnText: {
    color: colors.text.primary,
    fontSize: 13,
    fontWeight: '500',
  },
  successCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: colors.success.bg,
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.success.border,
  },
  successIcon: {
    fontSize: 16,
  },
  successText: {
    flex: 1,
    fontSize: 13,
    color: colors.success.text,
  },
  tabsContainer: {
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  tabCard: {
    backgroundColor: colors.bg.card,
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 4,
    minWidth: 100,
    borderWidth: 1,
    borderColor: colors.slate[800],
  },
  tabCardActive: {
    borderColor: colors.primary[500],
    backgroundColor: colors.info.bg,
  },
  tabHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  tabIcon: {
    fontSize: 14,
  },
  tabLabel: {
    fontSize: 11,
    color: colors.text.secondary,
  },
  tabLabelActive: {
    color: colors.primary[400],
  },
  tabCount: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text.primary,
  },
  dataCard: {
    marginHorizontal: 16,
    backgroundColor: colors.bg.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.slate[800],
    overflow: 'hidden',
  },
  dataHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.slate[800],
  },
  dataTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
  },
  dataCount: {
    fontSize: 12,
    color: colors.text.muted,
  },
  dataBody: {
    padding: 8,
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.slate[800],
  },
  dataRowMain: {
    flex: 1,
    marginRight: 12,
  },
  dataId: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    fontFamily: 'monospace',
  },
  dataMeta: {
    fontSize: 12,
    color: colors.text.muted,
    marginTop: 2,
  },
  dataRowRight: {
    alignItems: 'flex-end',
    gap: 6,
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
  healthBar: {
    width: 60,
    height: 4,
    backgroundColor: colors.slate[700],
    borderRadius: 2,
    overflow: 'hidden',
  },
  healthFill: {
    height: '100%',
    borderRadius: 2,
  },
  healthText: {
    fontSize: 11,
    color: colors.text.secondary,
  },
  hoursText: {
    fontSize: 11,
    fontWeight: '500',
  },
  safetyBadge: {
    fontSize: 11,
    color: colors.danger.text,
    fontWeight: '500',
  },
  urgencyText: {
    fontSize: 11,
    fontWeight: '500',
  },
  riskText: {
    fontSize: 11,
    fontWeight: '500',
  },
  specialBadge: {
    fontSize: 11,
    color: colors.warning.text,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyIcon: {
    fontSize: 32,
    opacity: 0.5,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  emptySubtext: {
    fontSize: 12,
    color: colors.text.muted,
    marginTop: 4,
  },
  infoCard: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: colors.bg.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.slate[800],
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 12,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  infoItem: {
    width: '48%',
    backgroundColor: colors.slate[800],
    borderRadius: 8,
    padding: 10,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  infoDesc: {
    fontSize: 10,
    color: colors.text.muted,
    marginTop: 2,
  },
  spacer: {
    height: 32,
  },
  noAccess: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  noAccessIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  noAccessTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
  },
  noAccessText: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});
