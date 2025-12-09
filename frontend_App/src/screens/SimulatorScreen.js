import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, Modal, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { getSimulationStations, runPassengerSimulation, runEnergySimulation, runCombinedSimulation } from '../services/api';
import Button from '../components/Button';
import { Card, CardHeader, CardBody } from '../components/Card';

// Simple Select Component (no external dependency)
function SimpleSelect({ value, options, onSelect, label, colors }) {
  const [visible, setVisible] = useState(false);
  const selectedOption = options.find(o => o.value === value);

  return (
    <View style={selectStyles.container}>
      <Text style={[selectStyles.label, { color: colors.textSecondary }]}>{label}</Text>
      <TouchableOpacity
        style={[selectStyles.button, { backgroundColor: colors.background, borderColor: colors.border }]}
        onPress={() => setVisible(true)}
      >
        <Text style={[selectStyles.buttonText, { color: colors.text }]}>{selectedOption?.label || 'Select...'}</Text>
        <Ionicons name="chevron-down" size={16} color={colors.textTertiary} />
      </TouchableOpacity>
      <Modal visible={visible} transparent animationType="fade">
        <TouchableOpacity style={selectStyles.overlay} onPress={() => setVisible(false)}>
          <View style={[selectStyles.modal, { backgroundColor: colors.card }]}>
            <FlatList
              data={options}
              keyExtractor={item => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[selectStyles.option, item.value === value && { backgroundColor: colors.primary + '20' }]}
                  onPress={() => { onSelect(item.value); setVisible(false); }}
                >
                  <Text style={[selectStyles.optionText, { color: item.value === value ? colors.primary : colors.text }]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const selectStyles = StyleSheet.create({
  container: { marginBottom: 16 },
  label: { fontSize: 13, marginBottom: 6 },
  button: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderRadius: 8, borderWidth: 1 },
  buttonText: { fontSize: 14 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 32 },
  modal: { borderRadius: 12, maxHeight: 300 },
  option: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#33415520' },
  optionText: { fontSize: 14 },
});


function Slider({ value, onValueChange, min, max, step, label, unit, color }) {
  const { colors } = useTheme();
  const percentage = ((value - min) / (max - min)) * 100;
  
  return (
    <View style={styles.sliderContainer}>
      <View style={styles.sliderHeader}>
        <Text style={[styles.sliderLabel, { color: colors.textSecondary }]}>{label}</Text>
        <Text style={[styles.sliderValue, { color: color || colors.primary }]}>{typeof value === 'number' ? value.toFixed(step < 1 ? 1 : 0) : value}{unit}</Text>
      </View>
      <View style={[styles.sliderTrack, { backgroundColor: colors.border }]}>
        <View style={[styles.sliderFill, { width: `${percentage}%`, backgroundColor: color || colors.primary }]} />
      </View>
      <View style={styles.sliderButtons}>
        <TouchableOpacity 
          style={[styles.sliderBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => onValueChange(Math.max(min, parseFloat((value - step).toFixed(1))))}
        >
          <Ionicons name="remove" size={16} color={colors.text} />
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.sliderBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => onValueChange(Math.min(max, parseFloat((value + step).toFixed(1))))}
        >
          <Ionicons name="add" size={16} color={colors.text} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function ResultCard({ icon, label, value, unit, color }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.resultCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.resultIcon, { backgroundColor: (color || colors.primary) + '20' }]}>
        <Ionicons name={icon} size={20} color={color || colors.primary} />
      </View>
      <Text style={[styles.resultValue, { color: colors.text }]}>{value}{unit}</Text>
      <Text style={[styles.resultLabel, { color: colors.textTertiary }]}>{label}</Text>
    </View>
  );
}

export default function SimulatorScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState('passenger');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  const [passengerParams, setPassengerParams] = useState({
    time_of_day: 'off_peak',
    special_event: '',
    expected_crowd_multiplier: 1.0,
    trains_available: 18,
  });

  const [energyParams, setEnergyParams] = useState({
    trains_in_service: 18,
    operating_hours: 16,
    passenger_load_percent: 60,
  });

  const runSimulation = async () => {
    setLoading(true);
    setResults(null);
    try {
      let response;
      if (activeTab === 'passenger') {
        response = await runPassengerSimulation({ ...passengerParams, special_event: passengerParams.special_event || null });
      } else if (activeTab === 'energy') {
        response = await runEnergySimulation(energyParams);
      } else {
        response = await runCombinedSimulation({ ...passengerParams, ...energyParams, special_event: passengerParams.special_event || null });
      }
      setResults(response.data);
    } catch (err) {
      Alert.alert('Error', 'Simulation failed. Check backend connection.');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'passenger', label: t('simulator.passenger'), icon: 'people' },
    { id: 'energy', label: t('simulator.energy'), icon: 'flash' },
    { id: 'combined', label: t('simulator.combined'), icon: 'analytics' },
  ];

  const timeOptions = [
    { value: 'early_morning', label: 'Early Morning (6-7:30 AM)' },
    { value: 'peak_morning', label: 'Peak Morning (7:30-10 AM)' },
    { value: 'off_peak', label: 'Off-Peak (10 AM - 5 PM)' },
    { value: 'peak_evening', label: 'Peak Evening (5-8 PM)' },
    { value: 'late_night', label: 'Late Night (after 9 PM)' },
  ];

  const eventOptions = [
    { value: '', label: t('simulator.none') },
    { value: 'football_match', label: 'Football Match' },
    { value: 'concert', label: 'Concert/Event' },
    { value: 'festival', label: 'Festival' },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Tabs */}
      <View style={[styles.tabsContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {tabs.map(tab => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && styles.activeTab]}
            onPress={() => { setActiveTab(tab.id); setResults(null); }}
          >
            <Ionicons name={tab.icon} size={18} color={activeTab === tab.id ? '#fff' : colors.textSecondary} />
            <Text style={[styles.tabText, { color: activeTab === tab.id ? '#fff' : colors.textSecondary }]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Parameters */}
      <Card style={styles.paramsCard}>
        <CardHeader title={t('simulator.parameters') || 'Parameters'} />
        <CardBody>
          {(activeTab === 'passenger' || activeTab === 'combined') && (
            <>
              <SimpleSelect
                label={t('simulator.timeOfDay')}
                value={passengerParams.time_of_day}
                options={timeOptions}
                onSelect={v => setPassengerParams({ ...passengerParams, time_of_day: v })}
                colors={colors}
              />
              <SimpleSelect
                label={t('simulator.specialEvent')}
                value={passengerParams.special_event}
                options={eventOptions}
                onSelect={v => setPassengerParams({ ...passengerParams, special_event: v })}
                colors={colors}
              />
              <Slider label={t('simulator.crowdMultiplier')} value={passengerParams.expected_crowd_multiplier} onValueChange={v => setPassengerParams({ ...passengerParams, expected_crowd_multiplier: v })} min={0.5} max={3} step={0.1} unit="x" color={colors.primary} />
              <Slider label={t('simulator.trainsAvailable')} value={passengerParams.trains_available} onValueChange={v => setPassengerParams({ ...passengerParams, trains_available: v })} min={10} max={25} step={1} unit="" color={colors.primary} />
            </>
          )}
          {(activeTab === 'energy' || activeTab === 'combined') && (
            <>
              <Slider label="Trains in Service" value={energyParams.trains_in_service} onValueChange={v => setEnergyParams({ ...energyParams, trains_in_service: v })} min={10} max={25} step={1} unit="" color={colors.warning} />
              <Slider label="Operating Hours" value={energyParams.operating_hours} onValueChange={v => setEnergyParams({ ...energyParams, operating_hours: v })} min={1} max={20} step={1} unit="h" color={colors.warning} />
              <Slider label="Passenger Load" value={energyParams.passenger_load_percent} onValueChange={v => setEnergyParams({ ...energyParams, passenger_load_percent: v })} min={10} max={100} step={5} unit="%" color={colors.warning} />
            </>
          )}
          <Button title={t('simulator.runSimulation')} icon="play" onPress={runSimulation} loading={loading} style={styles.runBtn} />
        </CardBody>
      </Card>

      {/* Results */}
      {results && (
        <Card style={styles.resultsCard}>
          <CardHeader title={t('simulator.results')} />
          <CardBody>
            <View style={styles.resultsGrid}>
              {results.total_passengers !== undefined && <ResultCard icon="people" label={t('simulator.totalPassengers')} value={results.total_passengers?.toLocaleString()} unit="" color={colors.primary} />}
              {results.service_quality !== undefined && <ResultCard icon="star" label={t('simulator.serviceQuality')} value={results.service_quality?.toFixed(0)} unit="%" color={colors.success} />}
              {results.total_energy_kwh !== undefined && <ResultCard icon="flash" label={t('simulator.totalEnergy')} value={results.total_energy_kwh?.toLocaleString()} unit=" kWh" color={colors.warning} />}
              {results.total_cost !== undefined && <ResultCard icon="cash" label={t('simulator.totalCost')} value={`₹${results.total_cost?.toLocaleString()}`} unit="" color={colors.success} />}
            </View>
            {results.ai_reasoning && (
              <View style={[styles.aiReasoning, { backgroundColor: colors.purple + '10', borderColor: colors.purple + '30' }]}>
                <View style={styles.aiHeader}>
                  <Ionicons name="sparkles" size={16} color={colors.purple} />
                  <Text style={[styles.aiTitle, { color: colors.purple }]}>AI Analysis</Text>
                </View>
                <Text style={[styles.aiText, { color: colors.textSecondary }]}>{results.ai_reasoning.reasoning?.substring(0, 500)}...</Text>
              </View>
            )}
          </CardBody>
        </Card>
      )}
      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  tabsContainer: { flexDirection: 'row', margin: 16, borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, gap: 6 },
  activeTab: { backgroundColor: '#3b82f6' },
  tabText: { fontSize: 13, fontWeight: '600' },
  paramsCard: { marginHorizontal: 16, marginBottom: 16 },
  sliderContainer: { marginBottom: 20 },
  sliderHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  sliderLabel: { fontSize: 13 },
  sliderValue: { fontSize: 14, fontWeight: '600' },
  sliderTrack: { height: 6, borderRadius: 3, marginBottom: 8 },
  sliderFill: { height: '100%', borderRadius: 3 },
  sliderButtons: { flexDirection: 'row', justifyContent: 'space-between' },
  sliderBtn: { width: 36, height: 36, borderRadius: 8, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  runBtn: { marginTop: 8 },
  resultsCard: { marginHorizontal: 16 },
  resultsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  resultCard: { width: '47%', padding: 16, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
  resultIcon: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  resultValue: { fontSize: 20, fontWeight: '700' },
  resultLabel: { fontSize: 11, marginTop: 4, textAlign: 'center' },
  aiReasoning: { marginTop: 16, padding: 16, borderRadius: 12, borderWidth: 1 },
  aiHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  aiTitle: { fontSize: 13, fontWeight: '600' },
  aiText: { fontSize: 13, lineHeight: 20 },
});
