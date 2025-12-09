import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, TouchableOpacity, FlatList, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { getAlerts, acknowledgeAlert, resolveAlert } from '../services/api';
import Badge from '../components/Badge';
import { Card } from '../components/Card';
import Loading from '../components/Loading';

function AlertCard({ alert, onAcknowledge, onResolve, colors, t }) {
  const severityConfig = {
    critical: { color: colors.danger, icon: 'alert-circle', type: 'danger' },
    warning: { color: colors.warning, icon: 'warning', type: 'warning' },
    error: { color: colors.danger, icon: 'alert-circle', type: 'danger' },
    info: { color: colors.info, icon: 'information-circle', type: 'info' },
  };
  const config = severityConfig[alert.severity] || severityConfig.info;

  return (
    <Card style={[styles.alertCard, alert.is_resolved && styles.resolvedCard]}>
      <View style={styles.alertContent}>
        <View style={[styles.alertIcon, { backgroundColor: config.color + '20' }]}>
          <Ionicons name={config.icon} size={20} color={config.color} />
        </View>
        <View style={styles.alertInfo}>
          <View style={styles.alertHeader}>
            <Text style={[styles.alertTitle, { color: colors.text }]} numberOfLines={1}>{alert.title}</Text>
            <Badge text={alert.severity} type={config.type} size="small" />
            {alert.is_resolved && <Badge text={t('alerts.resolved')} type="success" size="small" />}
          </View>
          <Text style={[styles.alertMessage, { color: colors.textSecondary }]} numberOfLines={2}>
            {alert.message}
          </Text>
          <View style={styles.alertMeta}>
            {alert.train_id && (
              <View style={styles.metaItem}>
                <Ionicons name="train" size={12} color={colors.textTertiary} />
                <Text style={[styles.metaText, { color: colors.textTertiary }]}>Train #{alert.train_id}</Text>
              </View>
            )}
            <View style={styles.metaItem}>
              <Ionicons name="time" size={12} color={colors.textTertiary} />
              <Text style={[styles.metaText, { color: colors.textTertiary }]}>
                {new Date(alert.created_at).toLocaleString()}
              </Text>
            </View>
          </View>
          {!alert.is_resolved && (
            <View style={styles.alertActions}>
              {!alert.is_acknowledged && (
                <TouchableOpacity 
                  style={[styles.actionBtn, { borderColor: colors.border }]}
                  onPress={() => onAcknowledge(alert.id)}
                >
                  <Ionicons name="checkmark" size={16} color={colors.textSecondary} />
                  <Text style={[styles.actionText, { color: colors.textSecondary }]}>{t('alerts.acknowledge')}</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity 
                style={[styles.actionBtn, { backgroundColor: colors.success + '20', borderColor: colors.success }]}
                onPress={() => onResolve(alert.id)}
              >
                <Ionicons name="checkmark-done" size={16} color={colors.success} />
                <Text style={[styles.actionText, { color: colors.success }]}>{t('alerts.resolve')}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Card>
  );
}

export default function AlertsScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('unresolved');
  const [severityFilter, setSeverityFilter] = useState('all');

  const fetchAlerts = async () => {
    try {
      const params = {};
      if (filter === 'unresolved') params.resolved = false;
      if (filter === 'resolved') params.resolved = true;
      if (severityFilter !== 'all') params.severity = severityFilter;
      
      const response = await getAlerts(params);
      setAlerts(response.data.alerts || []);
    } catch (err) {
      console.error('Failed to fetch alerts:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [filter, severityFilter]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAlerts();
  }, [filter, severityFilter]);

  const handleAcknowledge = async (alertId) => {
    try {
      await acknowledgeAlert(alertId, 'Mobile User');
      fetchAlerts();
    } catch (err) {
      Alert.alert('Error', 'Failed to acknowledge alert');
    }
  };

  const handleResolve = async (alertId) => {
    Alert.prompt(
      'Resolve Alert',
      'Enter resolution notes (optional):',
      async (notes) => {
        try {
          await resolveAlert(alertId, { resolved_by: 'Mobile User', resolution_notes: notes || '' });
          fetchAlerts();
        } catch (err) {
          Alert.alert('Error', 'Failed to resolve alert');
        }
      },
      'plain-text'
    );
  };

  const stats = {
    total: alerts.length,
    critical: alerts.filter(a => a.severity === 'critical' && !a.is_resolved).length,
    warning: alerts.filter(a => a.severity === 'warning' && !a.is_resolved).length,
    unresolved: alerts.filter(a => !a.is_resolved).length,
  };

  if (loading) return <Loading message={t('common.loading')} />;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="notifications" size={16} color={colors.textTertiary} />
          <Text style={[styles.statValue, { color: colors.text }]}>{stats.total}</Text>
          <Text style={[styles.statLabel, { color: colors.textTertiary }]}>{t('alerts.total')}</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.danger + '30' }]}>
          <Ionicons name="alert-circle" size={16} color={colors.danger} />
          <Text style={[styles.statValue, { color: colors.danger }]}>{stats.critical}</Text>
          <Text style={[styles.statLabel, { color: colors.textTertiary }]}>{t('alerts.critical')}</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.warning + '30' }]}>
          <Ionicons name="warning" size={16} color={colors.warning} />
          <Text style={[styles.statValue, { color: colors.warning }]}>{stats.warning}</Text>
          <Text style={[styles.statLabel, { color: colors.textTertiary }]}>{t('alerts.warning')}</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="time" size={16} color={colors.textTertiary} />
          <Text style={[styles.statValue, { color: colors.text }]}>{stats.unresolved}</Text>
          <Text style={[styles.statLabel, { color: colors.textTertiary }]}>{t('alerts.unresolved')}</Text>
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {['all', 'unresolved', 'resolved'].map(f => (
            <TouchableOpacity
              key={f}
              style={[styles.filterTab, filter === f && { backgroundColor: colors.primary }]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterText, { color: filter === f ? '#fff' : colors.textSecondary }]}>
                {t(`alerts.${f}`)}
              </Text>
            </TouchableOpacity>
          ))}
          <View style={styles.filterDivider} />
          {['all', 'critical', 'warning', 'info'].map(s => (
            <TouchableOpacity
              key={s}
              style={[
                styles.filterTab, 
                severityFilter === s && { 
                  backgroundColor: s === 'critical' ? colors.danger : s === 'warning' ? colors.warning : s === 'info' ? colors.info : colors.primary 
                }
              ]}
              onPress={() => setSeverityFilter(s)}
            >
              <Text style={[styles.filterText, { color: severityFilter === s ? '#fff' : colors.textSecondary }]}>
                {t(`alerts.${s}`)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Alerts List */}
      <FlatList
        data={alerts}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => (
          <AlertCard
            alert={item}
            colors={colors}
            t={t}
            onAcknowledge={handleAcknowledge}
            onResolve={handleResolve}
          />
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="checkmark-circle" size={64} color={colors.success + '50'} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>{t('alerts.noAlerts')}</Text>
            <Text style={[styles.emptyHint, { color: colors.textTertiary }]}>{t('alerts.allClear')}</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  statsRow: { flexDirection: 'row', padding: 16, gap: 8 },
  statCard: { flex: 1, padding: 12, borderRadius: 10, borderWidth: 1, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '700', marginTop: 4 },
  statLabel: { fontSize: 10, marginTop: 2 },
  filtersContainer: { paddingHorizontal: 16, marginBottom: 8 },
  filterTab: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, marginRight: 8, backgroundColor: '#334155' },
  filterText: { fontSize: 12, fontWeight: '500' },
  filterDivider: { width: 1, height: 24, backgroundColor: '#475569', marginHorizontal: 8 },
  listContent: { padding: 16, paddingTop: 8 },
  alertCard: { marginBottom: 12 },
  resolvedCard: { opacity: 0.6 },
  alertContent: { flexDirection: 'row', padding: 16 },
  alertIcon: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  alertInfo: { flex: 1, marginLeft: 12 },
  alertHeader: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
  alertTitle: { fontSize: 14, fontWeight: '600', flex: 1 },
  alertMessage: { fontSize: 13, marginTop: 4 },
  alertMeta: { flexDirection: 'row', marginTop: 8, gap: 16 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 11 },
  alertActions: { flexDirection: 'row', marginTop: 12, gap: 8 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, borderWidth: 1, gap: 4 },
  actionText: { fontSize: 12, fontWeight: '500' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 64 },
  emptyTitle: { fontSize: 18, fontWeight: '600', marginTop: 16 },
  emptyHint: { fontSize: 14, marginTop: 8 },
});
