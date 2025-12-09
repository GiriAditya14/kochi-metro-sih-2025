import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { getAlerts, acknowledgeAlert, resolveAlert } from '../lib/api';
import { mockAlerts } from '../data/mockData';
import { colors, formatDateTime } from '../lib/utils';

interface Alert {
  id: number;
  title: string;
  message: string;
  severity: 'critical' | 'warning' | 'info';
  train_id?: number;
  is_acknowledged: boolean;
  acknowledged_by?: string;
  is_resolved: boolean;
  created_at: string;
}

const AlertCard = ({
  alert,
  onAcknowledge,
  onResolve,
  onViewTrain,
}: {
  alert: Alert;
  onAcknowledge: () => void;
  onResolve: (notes: string) => void;
  onViewTrain: () => void;
}) => {
  const [showResolve, setShowResolve] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [resolving, setResolving] = useState(false);

  const getSeverityConfig = (severity: string) => {
    switch (severity) {
      case 'critical':
        return { bg: colors.danger.bg, text: colors.danger.text, border: colors.danger.border, icon: '🚨' };
      case 'warning':
        return { bg: colors.warning.bg, text: colors.warning.text, border: colors.warning.border, icon: '⚠️' };
      default:
        return { bg: colors.info.bg, text: colors.info.text, border: colors.info.border, icon: 'ℹ️' };
    }
  };

  const config = getSeverityConfig(alert.severity);

  const handleResolve = async () => {
    setResolving(true);
    await onResolve(resolutionNotes);
    setResolving(false);
    setShowResolve(false);
  };

  return (
    <View style={[styles.alertCard, { borderColor: config.border }, alert.is_resolved && styles.alertResolved]}>
      <View style={styles.alertHeader}>
        <View style={[styles.alertIcon, { backgroundColor: config.bg }]}>
          <Text style={styles.alertIconText}>{config.icon}</Text>
        </View>
        <View style={styles.alertContent}>
          <View style={styles.alertTitleRow}>
            <Text style={styles.alertTitle}>{alert.title}</Text>
            <View style={[styles.severityBadge, { backgroundColor: config.bg }]}>
              <Text style={[styles.severityText, { color: config.text }]}>{alert.severity}</Text>
            </View>
            {alert.is_resolved && (
              <View style={[styles.severityBadge, { backgroundColor: colors.success.bg }]}>
                <Text style={[styles.severityText, { color: colors.success.text }]}>Resolved</Text>
              </View>
            )}
          </View>
          <Text style={styles.alertMessage}>{alert.message}</Text>
          <View style={styles.alertMeta}>
            {alert.train_id && (
              <TouchableOpacity onPress={onViewTrain}>
                <Text style={styles.alertLink}>🚇 Train #{alert.train_id}</Text>
              </TouchableOpacity>
            )}
            <Text style={styles.alertTime}>🕐 {formatDateTime(alert.created_at)}</Text>
            {alert.is_acknowledged && (
              <Text style={styles.alertAck}>✓ Acknowledged by {alert.acknowledged_by}</Text>
            )}
          </View>
        </View>
      </View>

      {!alert.is_resolved && (
        <View style={styles.alertActions}>
          {!alert.is_acknowledged && (
            <TouchableOpacity style={styles.ghostBtn} onPress={onAcknowledge}>
              <Text style={styles.ghostBtnText}>✓ Acknowledge</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => setShowResolve(!showResolve)}
          >
            <Text style={styles.secondaryBtnText}>Resolve</Text>
          </TouchableOpacity>
        </View>
      )}

      {showResolve && (
        <View style={styles.resolveSection}>
          <Text style={styles.resolveLabel}>Resolution Notes</Text>
          <TextInput
            style={styles.resolveInput}
            value={resolutionNotes}
            onChangeText={setResolutionNotes}
            placeholder="Describe how this was resolved..."
            placeholderTextColor={colors.text.muted}
            multiline
          />
          <View style={styles.resolveActions}>
            <TouchableOpacity style={styles.ghostBtn} onPress={() => setShowResolve(false)}>
              <Text style={styles.ghostBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.successBtn}
              onPress={handleResolve}
              disabled={resolving}
            >
              {resolving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.successBtnText}>✓ Mark Resolved</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

export default function AlertsScreen() {
  const navigation = useNavigation<any>();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('unresolved');
  const [severityFilter, setSeverityFilter] = useState('all');

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (filter === 'unresolved') params.resolved = false;
      if (filter === 'resolved') params.resolved = true;
      if (severityFilter !== 'all') params.severity = severityFilter;
      const response = await getAlerts(params);
      setAlerts(response.data.alerts || []);
    } catch (err) {
      console.log('Using mock data - backend not available');
      let filtered = [...mockAlerts];
      if (filter === 'unresolved') filtered = filtered.filter(a => !a.is_resolved);
      if (filter === 'resolved') filtered = filtered.filter(a => a.is_resolved);
      if (severityFilter !== 'all') filtered = filtered.filter(a => a.severity === severityFilter);
      setAlerts(filtered);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [filter, severityFilter]);

  const handleAcknowledge = async (alertId: number) => {
    try {
      await acknowledgeAlert(alertId, 'Supervisor');
      await fetchAlerts();
    } catch (err) {
      setAlerts(alerts.map(a => a.id === alertId ? { ...a, is_acknowledged: true, acknowledged_by: 'Supervisor' } : a));
    }
  };

  const handleResolve = async (alertId: number, notes: string) => {
    try {
      await resolveAlert(alertId, { resolved_by: 'Supervisor', resolution_notes: notes });
      await fetchAlerts();
    } catch (err) {
      setAlerts(alerts.map(a => a.id === alertId ? { ...a, is_resolved: true } : a));
    }
  };

  const stats = {
    total: alerts.length,
    critical: alerts.filter((a) => a.severity === 'critical' && !a.is_resolved).length,
    warning: alerts.filter((a) => a.severity === 'warning' && !a.is_resolved).length,
    unresolved: alerts.filter((a) => !a.is_resolved).length,
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
          onRefresh={() => { setRefreshing(true); fetchAlerts(); }}
          tintColor={colors.primary[500]}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Alerts</Text>
        <Text style={styles.headerSubtitle}>Monitor and manage system alerts</Text>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statIcon}>🔔</Text>
          <Text style={styles.statValue}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={[styles.statCard, { borderColor: colors.danger.border }]}>
          <Text style={styles.statIcon}>🚨</Text>
          <Text style={[styles.statValue, { color: colors.danger.text }]}>{stats.critical}</Text>
          <Text style={styles.statLabel}>Critical</Text>
        </View>
        <View style={[styles.statCard, { borderColor: colors.warning.border }]}>
          <Text style={styles.statIcon}>⚠️</Text>
          <Text style={[styles.statValue, { color: colors.warning.text }]}>{stats.warning}</Text>
          <Text style={styles.statLabel}>Warnings</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statIcon}>🕐</Text>
          <Text style={styles.statValue}>{stats.unresolved}</Text>
          <Text style={styles.statLabel}>Unresolved</Text>
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filterSection}>
        <Text style={styles.filterLabel}>Status:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {['all', 'unresolved', 'resolved'].map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterBtnText, filter === f && styles.filterBtnTextActive]}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.filterSection}>
        <Text style={styles.filterLabel}>Severity:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {['all', 'critical', 'warning', 'info'].map((s) => (
            <TouchableOpacity
              key={s}
              style={[
                styles.filterBtn,
                severityFilter === s && (
                  s === 'critical' ? styles.filterBtnDanger :
                  s === 'warning' ? styles.filterBtnWarning :
                  styles.filterBtnActive
                ),
              ]}
              onPress={() => setSeverityFilter(s)}
            >
              <Text style={[
                styles.filterBtnText,
                severityFilter === s && styles.filterBtnTextActive,
              ]}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Alerts List */}
      <View style={styles.alertsList}>
        {alerts.length > 0 ? (
          alerts.map((alert) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onAcknowledge={() => handleAcknowledge(alert.id)}
              onResolve={(notes) => handleResolve(alert.id, notes)}
              onViewTrain={() => navigation.navigate('TrainDetail', { trainId: alert.train_id })}
            />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>✅</Text>
            <Text style={styles.emptyTitle}>No alerts found</Text>
            <Text style={styles.emptyText}>
              {filter === 'unresolved'
                ? 'All alerts have been resolved. Great job!'
                : 'No alerts match your current filters.'}
            </Text>
          </View>
        )}
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
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
  },
  statLabel: {
    fontSize: 10,
    color: colors.text.muted,
    marginTop: 2,
  },
  filterSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 8,
  },
  filterLabel: {
    fontSize: 12,
    color: colors.text.muted,
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
  filterBtnDanger: {
    backgroundColor: colors.red[600],
  },
  filterBtnWarning: {
    backgroundColor: colors.amber[600],
  },
  filterBtnText: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  filterBtnTextActive: {
    color: '#fff',
  },
  alertsList: {
    paddingHorizontal: 16,
  },
  alertCard: {
    backgroundColor: colors.bg.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.slate[800],
  },
  alertResolved: {
    opacity: 0.6,
  },
  alertHeader: {
    flexDirection: 'row',
    gap: 12,
  },
  alertIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertIconText: {
    fontSize: 16,
  },
  alertContent: {
    flex: 1,
  },
  alertTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  severityText: {
    fontSize: 10,
    fontWeight: '500',
  },
  alertMessage: {
    fontSize: 13,
    color: colors.text.secondary,
    marginTop: 6,
  },
  alertMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 10,
  },
  alertLink: {
    fontSize: 11,
    color: colors.primary[400],
  },
  alertTime: {
    fontSize: 11,
    color: colors.text.muted,
  },
  alertAck: {
    fontSize: 11,
    color: colors.success.text,
  },
  alertActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.slate[800],
  },
  ghostBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  ghostBtnText: {
    fontSize: 13,
    color: colors.text.secondary,
  },
  secondaryBtn: {
    backgroundColor: colors.slate[700],
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  secondaryBtnText: {
    fontSize: 13,
    color: colors.text.primary,
  },
  successBtn: {
    backgroundColor: colors.emerald[600],
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  successBtnText: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '500',
  },
  resolveSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.slate[800],
  },
  resolveLabel: {
    fontSize: 12,
    color: colors.text.muted,
    marginBottom: 8,
  },
  resolveInput: {
    backgroundColor: colors.slate[800],
    borderRadius: 8,
    padding: 12,
    color: colors.text.primary,
    fontSize: 14,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  resolveActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 13,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  spacer: {
    height: 32,
  },
});
