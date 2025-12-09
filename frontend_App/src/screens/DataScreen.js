import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, TouchableOpacity, FlatList, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { getTrains, getCertificates, getJobCards, getBrandingContracts, getMileage, getCleaningRecords, generateMockData } from '../services/api';
import Button from '../components/Button';
import Badge from '../components/Badge';
import { Card, CardHeader, CardBody } from '../components/Card';
import Loading from '../components/Loading';

const tabs = [
  { id: 'trains', icon: 'train', label: 'Trains' },
  { id: 'certificates', icon: 'shield-checkmark', label: 'Certificates' },
  { id: 'jobs', icon: 'construct', label: 'Jobs' },
  { id: 'branding', icon: 'pricetag', label: 'Branding' },
  { id: 'mileage', icon: 'speedometer', label: 'Mileage' },
  { id: 'cleaning', icon: 'sparkles', label: 'Cleaning' },
];

export default function DataScreen({ navigation }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState('trains');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [generating, setGenerating] = useState(false);

  const fetchData = async () => {
    try {
      let response;
      switch (activeTab) {
        case 'trains': response = await getTrains(); setData(response.data.trains || []); break;
        case 'certificates': response = await getCertificates(); setData(response.data.certificates || []); break;
        case 'jobs': response = await getJobCards(); setData(response.data.job_cards || []); break;
        case 'branding': response = await getBrandingContracts(); setData(response.data.contracts || []); break;
        case 'mileage': response = await getMileage(); setData(response.data.mileage || []); break;
        case 'cleaning': response = await getCleaningRecords(); setData(response.data.records || []); break;
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };


  useEffect(() => {
    setLoading(true);
    fetchData();
  }, [activeTab]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [activeTab]);

  const handleGenerateDemo = async () => {
    setGenerating(true);
    try {
      await generateMockData(true);
      await fetchData();
      Alert.alert('Success', 'Demo data generated');
    } catch (err) {
      Alert.alert('Error', 'Failed to generate demo data');
    } finally {
      setGenerating(false);
    }
  };

  const renderItem = ({ item }) => {
    switch (activeTab) {
      case 'trains':
        return (
          <TouchableOpacity 
            style={[styles.itemCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => navigation.navigate('TrainDetails', { trainId: item.id })}
          >
            <View style={styles.itemHeader}>
              <View style={[styles.itemIcon, { backgroundColor: colors.primary + '20' }]}>
                <Ionicons name="train" size={20} color={colors.primary} />
              </View>
              <View style={styles.itemInfo}>
                <Text style={[styles.itemTitle, { color: colors.text }]}>{item.train_id}</Text>
                <Text style={[styles.itemSubtitle, { color: colors.textTertiary }]}>{item.configuration} • {item.depot_id}</Text>
              </View>
              <Badge text={item.status} type={item.status === 'active' ? 'success' : item.status === 'under_maintenance' ? 'warning' : 'danger'} size="small" />
            </View>
          </TouchableOpacity>
        );
      case 'certificates':
        return (
          <View style={[styles.itemCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.itemHeader}>
              <View style={[styles.itemIcon, { backgroundColor: colors.success + '20' }]}>
                <Ionicons name="shield-checkmark" size={20} color={colors.success} />
              </View>
              <View style={styles.itemInfo}>
                <Text style={[styles.itemTitle, { color: colors.text }]}>{item.department}</Text>
                <Text style={[styles.itemSubtitle, { color: colors.textTertiary }]}>Train #{item.train_id} • Valid until {new Date(item.valid_to).toLocaleDateString()}</Text>
              </View>
              <Badge text={item.status} type={item.status === 'Valid' ? 'success' : item.status === 'ExpiringSoon' ? 'warning' : 'danger'} size="small" />
            </View>
          </View>
        );
      case 'jobs':
        return (
          <View style={[styles.itemCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.itemHeader}>
              <View style={[styles.itemIcon, { backgroundColor: item.safety_critical ? colors.danger + '20' : colors.warning + '20' }]}>
                <Ionicons name="construct" size={20} color={item.safety_critical ? colors.danger : colors.warning} />
              </View>
              <View style={styles.itemInfo}>
                <Text style={[styles.itemTitle, { color: colors.text }]} numberOfLines={1}>{item.title}</Text>
                <Text style={[styles.itemSubtitle, { color: colors.textTertiary }]}>{item.job_id} • Priority {item.priority}</Text>
              </View>
              <Badge text={item.status} type={item.status === 'CLOSED' ? 'success' : item.status === 'IN_PROGRESS' ? 'info' : 'warning'} size="small" />
            </View>
          </View>
        );
      case 'branding':
        return (
          <View style={[styles.itemCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.itemHeader}>
              <View style={[styles.itemIcon, { backgroundColor: colors.purple + '20' }]}>
                <Ionicons name="pricetag" size={20} color={colors.purple} />
              </View>
              <View style={styles.itemInfo}>
                <Text style={[styles.itemTitle, { color: colors.text }]}>{item.brand_name}</Text>
                <Text style={[styles.itemSubtitle, { color: colors.textTertiary }]}>Train #{item.train_id} • {item.current_exposure_hours_week?.toFixed(1)}h / {item.target_exposure_hours_weekly}h weekly</Text>
              </View>
              <Badge text={item.priority} type={item.priority === 'platinum' ? 'danger' : item.priority === 'gold' ? 'warning' : 'info'} size="small" />
            </View>
          </View>
        );
      case 'mileage':
        return (
          <View style={[styles.itemCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.itemHeader}>
              <View style={[styles.itemIcon, { backgroundColor: colors.info + '20' }]}>
                <Ionicons name="speedometer" size={20} color={colors.info} />
              </View>
              <View style={styles.itemInfo}>
                <Text style={[styles.itemTitle, { color: colors.text }]}>Train #{item.train_id}</Text>
                <Text style={[styles.itemSubtitle, { color: colors.textTertiary }]}>{(item.lifetime_km / 1000).toFixed(1)}k km lifetime • {item.km_since_last_service?.toFixed(0)} km since service</Text>
              </View>
              {item.is_near_threshold && <Badge text="Near Threshold" type="warning" size="small" />}
            </View>
          </View>
        );
      case 'cleaning':
        return (
          <View style={[styles.itemCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.itemHeader}>
              <View style={[styles.itemIcon, { backgroundColor: colors.success + '20' }]}>
                <Ionicons name="sparkles" size={20} color={colors.success} />
              </View>
              <View style={styles.itemInfo}>
                <Text style={[styles.itemTitle, { color: colors.text }]}>Train #{item.train_id}</Text>
                <Text style={[styles.itemSubtitle, { color: colors.textTertiary }]}>{item.days_since_last_cleaning?.toFixed(1)} days since cleaning</Text>
              </View>
              <Badge text={item.status} type={item.status === 'ok' ? 'success' : item.status === 'needs_cleaning' ? 'warning' : 'danger'} size="small" />
            </View>
          </View>
        );
      default:
        return null;
    }
  };

  if (loading && data.length === 0) return <Loading message={t('common.loading')} />;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll}>
        {tabs.map(tab => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && { backgroundColor: colors.primary }]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Ionicons name={tab.icon} size={16} color={activeTab === tab.id ? '#fff' : colors.textSecondary} />
            <Text style={[styles.tabText, { color: activeTab === tab.id ? '#fff' : colors.textSecondary }]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Actions */}
      <View style={styles.actions}>
        <Button title={t('data.generateDemo')} icon="sparkles" variant="secondary" size="small" onPress={handleGenerateDemo} loading={generating} />
      </View>

      {/* Data List */}
      <FlatList
        data={data}
        keyExtractor={(item, index) => item.id?.toString() || index.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="folder-open-outline" size={64} color={colors.textTertiary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No data available</Text>
            <Text style={[styles.emptyHint, { color: colors.textTertiary }]}>Generate demo data to get started</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  tabsScroll: { paddingHorizontal: 16, paddingVertical: 12 },
  tab: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginRight: 8, backgroundColor: '#334155', gap: 6 },
  tabText: { fontSize: 12, fontWeight: '600' },
  actions: { paddingHorizontal: 16, marginBottom: 8 },
  listContent: { padding: 16, paddingTop: 0 },
  itemCard: { borderRadius: 12, borderWidth: 1, padding: 16, marginBottom: 10 },
  itemHeader: { flexDirection: 'row', alignItems: 'center' },
  itemIcon: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  itemInfo: { flex: 1, marginLeft: 12 },
  itemTitle: { fontSize: 14, fontWeight: '600' },
  itemSubtitle: { fontSize: 11, marginTop: 2 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 64 },
  emptyText: { fontSize: 16, marginTop: 16 },
  emptyHint: { fontSize: 13, marginTop: 4 },
});
