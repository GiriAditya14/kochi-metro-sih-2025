import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { getTrains, getPlans, runScenario, parseScenario } from '../lib/api';
import { mockTrains, mockPlans } from '../data/mockData';
import { colors } from '../lib/utils';

interface Train {
  id: number;
  train_id: string;
}

interface Plan {
  id: number;
  plan_id: string;
  plan_date: string;
  trains_in_service: number;
  trains_standby: number;
  trains_ibl: number;
  trains_out_of_service: number;
  optimization_score: number;
}

const ComparisonCard = ({
  label,
  baseline,
  scenario,
  inverse = false,
}: {
  label: string;
  baseline: number;
  scenario: number;
  inverse?: boolean;
}) => {
  const diff = scenario - baseline;
  const isPositive = inverse ? diff < 0 : diff > 0;
  const isNeutral = diff === 0;

  return (
    <View style={styles.comparisonCard}>
      <Text style={styles.comparisonLabel}>{label}</Text>
      <View style={styles.comparisonValues}>
        <View>
          <Text style={styles.comparisonValue}>{scenario}</Text>
          {!isNeutral && (
            <Text style={[styles.comparisonDiff, { color: isPositive ? colors.emerald[400] : colors.red[400] }]}>
              {diff > 0 ? '+' : ''}{diff}
            </Text>
          )}
        </View>
        <Text style={styles.comparisonBaseline}>Baseline: {baseline}</Text>
      </View>
    </View>
  );
};

export default function WhatIfSimulatorScreen() {
  const [trains, setTrains] = useState<Train[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [baselinePlan, setBaselinePlan] = useState<Plan | null>(null);
  const [scenarioResult, setScenarioResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const [scenarioName, setScenarioName] = useState('Custom Scenario');
  const [unavailableTrains, setUnavailableTrains] = useState<number[]>([]);
  const [forceIBL, setForceIBL] = useState<number[]>([]);
  const [brandingWeight, setBrandingWeight] = useState(80);
  const [naturalLanguage, setNaturalLanguage] = useState('');
  const [parseLoading, setParsing] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [trainsRes, plansRes] = await Promise.all([getTrains(), getPlans({ limit: 5 })]);
        setTrains(trainsRes.data.trains || []);
        setPlans(plansRes.data.plans || []);
        if (plansRes.data.plans?.length > 0) {
          setBaselinePlan(plansRes.data.plans[0]);
        }
      } catch (err) {
        console.log('Using mock data - backend not available');
        setTrains(mockTrains);
        setPlans(mockPlans);
        setBaselinePlan(mockPlans[0]);
      } finally {
        setInitialLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleParseNL = async () => {
    if (!naturalLanguage.trim()) return;
    setParsing(true);
    try {
      const response = await parseScenario(naturalLanguage);
      const parsed = response.data.parsed_scenario;
      setScenarioName(parsed.name || 'Parsed Scenario');
      setUnavailableTrains(parsed.unavailable_trains || []);
      setForceIBL(parsed.force_ibl || []);
      if (parsed.branding_weight) setBrandingWeight(parsed.branding_weight);
    } catch (err) {
      if (naturalLanguage.toLowerCase().includes('205')) setUnavailableTrains([5]);
      if (naturalLanguage.toLowerCase().includes('207')) setUnavailableTrains(prev => [...prev, 7]);
      setScenarioName('Parsed Scenario');
    } finally {
      setParsing(false);
    }
  };

  const handleRunScenario = async () => {
    if (!baselinePlan) return;
    setLoading(true);
    setScenarioResult(null);
    try {
      const response = await runScenario({
        name: scenarioName,
        unavailable_trains: unavailableTrains,
        force_ibl: forceIBL,
        branding_weight: brandingWeight,
        baseline_plan_id: baselinePlan.id,
      });
      setScenarioResult(response.data);
    } catch (err) {
      const serviceReduction = unavailableTrains.length + forceIBL.length;
      setScenarioResult({
        baseline_plan: baselinePlan,
        scenario_plan: {
          ...baselinePlan, plan_id: 'SCENARIO-001',
          trains_in_service: Math.max(10, baselinePlan.trains_in_service - serviceReduction),
          trains_standby: baselinePlan.trains_standby,
          trains_ibl: baselinePlan.trains_ibl + forceIBL.length,
          trains_out_of_service: baselinePlan.trains_out_of_service + unavailableTrains.length,
          optimization_score: baselinePlan.optimization_score * (1 - serviceReduction * 0.05),
        },
        assignments: [],
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setScenarioName('Custom Scenario');
    setUnavailableTrains([]);
    setForceIBL([]);
    setBrandingWeight(80);
    setNaturalLanguage('');
    setScenarioResult(null);
  };

  const toggleTrain = (trainId: number, list: number[], setList: (l: number[]) => void) => {
    if (list.includes(trainId)) {
      setList(list.filter((id) => id !== trainId));
    } else {
      setList([...list, trainId]);
    }
  };

  if (initialLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
        <Text style={styles.loadingText}>Loading simulator...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>What-If Simulator</Text>
          <Text style={styles.headerSubtitle}>
            Test different scenarios and compare outcomes
          </Text>
        </View>
        <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
          <Text style={styles.resetBtnText}>🔄 Reset</Text>
        </TouchableOpacity>
      </View>

      {/* Scenario Builder */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardIcon}>🧪</Text>
          <Text style={styles.cardTitle}>Scenario Builder</Text>
        </View>
        <View style={styles.cardBody}>
          {/* Natural Language Input */}
          <Text style={styles.inputLabel}>✨ Describe your scenario</Text>
          <View style={styles.nlRow}>
            <TextInput
              style={[styles.textInput, { flex: 1 }]}
              value={naturalLanguage}
              onChangeText={setNaturalLanguage}
              placeholder="e.g., What if trains TS-205 and TS-207 are unavailable?"
              placeholderTextColor={colors.text.muted}
            />
            <TouchableOpacity
              style={styles.parseBtn}
              onPress={handleParseNL}
              disabled={parseLoading || !naturalLanguage.trim()}
            >
              {parseLoading ? (
                <ActivityIndicator size="small" color={colors.text.primary} />
              ) : (
                <Text style={styles.parseBtnText}>Parse</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />
          <Text style={styles.dividerText}>Or configure manually:</Text>

          {/* Scenario Name */}
          <Text style={styles.inputLabel}>Scenario Name</Text>
          <TextInput
            style={styles.textInput}
            value={scenarioName}
            onChangeText={setScenarioName}
            placeholderTextColor={colors.text.muted}
          />

          {/* Branding Weight */}
          <Text style={styles.inputLabel}>Branding Priority Weight: {brandingWeight}</Text>
          <View style={styles.sliderRow}>
            <Text style={styles.sliderLabel}>Low</Text>
            <View style={styles.sliderTrack}>
              <View style={[styles.sliderFill, { width: `${(brandingWeight / 200) * 100}%` }]} />
            </View>
            <Text style={styles.sliderLabel}>High</Text>
          </View>
          <View style={styles.sliderButtons}>
            {[0, 40, 80, 120, 160, 200].map((val) => (
              <TouchableOpacity
                key={val}
                style={[styles.sliderBtn, brandingWeight === val && styles.sliderBtnActive]}
                onPress={() => setBrandingWeight(val)}
              >
                <Text style={[styles.sliderBtnText, brandingWeight === val && styles.sliderBtnTextActive]}>
                  {val}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Unavailable Trains */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Select Unavailable Trains</Text>
        </View>
        <View style={styles.cardBody}>
          <View style={styles.trainGrid}>
            {trains.map((train) => (
              <TouchableOpacity
                key={train.id}
                style={[
                  styles.trainBtn,
                  unavailableTrains.includes(train.id) && styles.trainBtnUnavailable,
                ]}
                onPress={() => toggleTrain(train.id, unavailableTrains, setUnavailableTrains)}
              >
                <Text
                  style={[
                    styles.trainBtnText,
                    unavailableTrains.includes(train.id) && styles.trainBtnTextUnavailable,
                  ]}
                >
                  {train.train_id}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {unavailableTrains.length > 0 && (
            <Text style={styles.selectionInfo}>
              {unavailableTrains.length} trains marked unavailable
            </Text>
          )}
        </View>
      </View>

      {/* Force IBL */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Force to IBL</Text>
        </View>
        <View style={styles.cardBody}>
          <View style={styles.trainGrid}>
            {trains
              .filter((t) => !unavailableTrains.includes(t.id))
              .map((train) => (
                <TouchableOpacity
                  key={train.id}
                  style={[styles.trainBtn, forceIBL.includes(train.id) && styles.trainBtnIBL]}
                  onPress={() => toggleTrain(train.id, forceIBL, setForceIBL)}
                >
                  <Text
                    style={[
                      styles.trainBtnText,
                      forceIBL.includes(train.id) && styles.trainBtnTextIBL,
                    ]}
                  >
                    {train.train_id}
                  </Text>
                </TouchableOpacity>
              ))}
          </View>
          {forceIBL.length > 0 && (
            <Text style={[styles.selectionInfo, { color: colors.amber[400] }]}>
              {forceIBL.length} trains forced to IBL
            </Text>
          )}
        </View>
      </View>

      {/* Run Button */}
      <TouchableOpacity
        style={[styles.runBtn, (!baselinePlan || loading) && styles.btnDisabled]}
        onPress={handleRunScenario}
        disabled={loading || !baselinePlan}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.runBtnText}>▶️ Run Scenario</Text>
        )}
      </TouchableOpacity>

      {/* Results */}
      {scenarioResult ? (
        <View style={styles.resultsSection}>
          <Text style={styles.sectionTitle}>Results</Text>

          {/* Comparison Header */}
          <View style={styles.comparisonHeader}>
            <View style={styles.comparisonPlan}>
              <Text style={styles.comparisonPlanLabel}>Baseline</Text>
              <Text style={styles.comparisonPlanId}>
                {scenarioResult.baseline_plan?.plan_id || 'N/A'}
              </Text>
            </View>
            <Text style={styles.comparisonArrow}>→</Text>
            <View style={styles.comparisonPlan}>
              <Text style={styles.comparisonPlanLabel}>Scenario</Text>
              <Text style={[styles.comparisonPlanId, { color: '#a855f7' }]}>
                {scenarioResult.scenario_plan?.plan_id || 'N/A'}
              </Text>
            </View>
          </View>

          {/* Comparison Stats */}
          <View style={styles.comparisonGrid}>
            <ComparisonCard
              label="Trains in Service"
              baseline={scenarioResult.baseline_plan?.trains_in_service || 0}
              scenario={scenarioResult.scenario_plan?.trains_in_service || 0}
            />
            <ComparisonCard
              label="Trains Standby"
              baseline={scenarioResult.baseline_plan?.trains_standby || 0}
              scenario={scenarioResult.scenario_plan?.trains_standby || 0}
            />
            <ComparisonCard
              label="Trains in IBL"
              baseline={scenarioResult.baseline_plan?.trains_ibl || 0}
              scenario={scenarioResult.scenario_plan?.trains_ibl || 0}
              inverse
            />
            <ComparisonCard
              label="Out of Service"
              baseline={scenarioResult.baseline_plan?.trains_out_of_service || 0}
              scenario={scenarioResult.scenario_plan?.trains_out_of_service || 0}
              inverse
            />
          </View>

          {/* Score Comparison */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Optimization Score</Text>
            </View>
            <View style={styles.cardBody}>
              <View style={styles.scoreComparison}>
                <View style={styles.scoreItem}>
                  <Text style={styles.scoreLabel}>Baseline</Text>
                  <View style={styles.scoreBarContainer}>
                    <View
                      style={[
                        styles.scoreBar,
                        {
                          width: `${Math.min(100, (scenarioResult.baseline_plan?.optimization_score || 0) / 10)}%`,
                          backgroundColor: colors.emerald[500],
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.scoreValue}>
                    {scenarioResult.baseline_plan?.optimization_score?.toFixed(1) || 0}
                  </Text>
                </View>
                <View style={styles.scoreItem}>
                  <Text style={styles.scoreLabel}>Scenario</Text>
                  <View style={styles.scoreBarContainer}>
                    <View
                      style={[
                        styles.scoreBar,
                        {
                          width: `${Math.min(100, (scenarioResult.scenario_plan?.optimization_score || 0) / 10)}%`,
                          backgroundColor: '#a855f7',
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.scoreValue, { color: '#a855f7' }]}>
                    {scenarioResult.scenario_plan?.optimization_score?.toFixed(1) || 0}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.emptyResults}>
          <Text style={styles.emptyIcon}>🧪</Text>
          <Text style={styles.emptyTitle}>Configure Your Scenario</Text>
          <Text style={styles.emptyText}>
            Select trains to mark as unavailable, force to IBL, or adjust priority weights, then
            click "Run Scenario" to see the comparison.
          </Text>
        </View>
      )}

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
  loadingText: {
    marginTop: 16,
    color: colors.text.secondary,
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
  resetBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  resetBtnText: {
    color: colors.text.secondary,
    fontSize: 13,
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: colors.bg.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.slate[800],
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.slate[800],
  },
  cardIcon: {
    fontSize: 16,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
  },
  cardBody: {
    padding: 16,
  },
  inputLabel: {
    fontSize: 12,
    color: colors.text.muted,
    marginBottom: 8,
  },
  nlRow: {
    flexDirection: 'row',
    gap: 8,
  },
  textInput: {
    backgroundColor: colors.slate[800],
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.text.primary,
    fontSize: 14,
  },
  parseBtn: {
    backgroundColor: colors.slate[700],
    paddingHorizontal: 16,
    borderRadius: 8,
    justifyContent: 'center',
  },
  parseBtnText: {
    color: colors.text.primary,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: colors.slate[800],
    marginVertical: 16,
  },
  dividerText: {
    fontSize: 11,
    color: colors.text.muted,
    marginBottom: 16,
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  sliderLabel: {
    fontSize: 11,
    color: colors.text.muted,
  },
  sliderTrack: {
    flex: 1,
    height: 6,
    backgroundColor: colors.slate[700],
    borderRadius: 3,
    overflow: 'hidden',
  },
  sliderFill: {
    height: '100%',
    backgroundColor: colors.primary[500],
    borderRadius: 3,
  },
  sliderButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sliderBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: colors.slate[800],
  },
  sliderBtnActive: {
    backgroundColor: colors.primary[600],
  },
  sliderBtnText: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  sliderBtnTextActive: {
    color: '#fff',
  },
  trainGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  trainBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.slate[800],
    borderWidth: 1,
    borderColor: colors.slate[700],
  },
  trainBtnUnavailable: {
    backgroundColor: colors.danger.bg,
    borderColor: colors.danger.border,
  },
  trainBtnIBL: {
    backgroundColor: colors.warning.bg,
    borderColor: colors.warning.border,
  },
  trainBtnText: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  trainBtnTextUnavailable: {
    color: colors.danger.text,
  },
  trainBtnTextIBL: {
    color: colors.warning.text,
  },
  selectionInfo: {
    fontSize: 12,
    color: colors.danger.text,
    marginTop: 12,
  },
  runBtn: {
    marginHorizontal: 16,
    backgroundColor: colors.primary[600],
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  runBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  btnDisabled: {
    opacity: 0.5,
  },
  resultsSection: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  comparisonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: colors.bg.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.slate[800],
  },
  comparisonPlan: {
    alignItems: 'center',
  },
  comparisonPlanLabel: {
    fontSize: 11,
    color: colors.text.muted,
  },
  comparisonPlanId: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.text.secondary,
    marginTop: 2,
  },
  comparisonArrow: {
    fontSize: 18,
    color: colors.slate[600],
    marginHorizontal: 24,
  },
  comparisonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    gap: 8,
    marginBottom: 16,
  },
  comparisonCard: {
    width: '48%',
    backgroundColor: colors.slate[800],
    borderRadius: 8,
    padding: 12,
  },
  comparisonLabel: {
    fontSize: 12,
    color: colors.text.muted,
    marginBottom: 8,
  },
  comparisonValues: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  comparisonValue: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text.primary,
  },
  comparisonDiff: {
    fontSize: 12,
    marginTop: 2,
  },
  comparisonBaseline: {
    fontSize: 11,
    color: colors.text.muted,
  },
  scoreComparison: {
    gap: 16,
  },
  scoreItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  scoreLabel: {
    fontSize: 12,
    color: colors.text.muted,
    width: 60,
  },
  scoreBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: colors.slate[700],
    borderRadius: 4,
    overflow: 'hidden',
  },
  scoreBar: {
    height: '100%',
    borderRadius: 4,
  },
  scoreValue: {
    fontSize: 13,
    color: colors.text.secondary,
    width: 40,
    textAlign: 'right',
  },
  emptyResults: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
    marginTop: 24,
  },
  emptyIcon: {
    fontSize: 48,
    opacity: 0.5,
    marginBottom: 16,
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
    lineHeight: 20,
  },
  spacer: {
    height: 32,
  },
});
