import { useState } from 'react';
import { Card, CardBody, CardHeader, Button, Input, Spinner, Chip, Divider } from '@heroui/react';
import { Play, AlertCircle, TrendingUp, TrendingDown, Calculator, Sparkles } from 'lucide-react';
import { dashboardApi } from '../services/api';
import DecisionCard from '../components/DecisionCard';
import type { TrainDecision } from '../types';

interface Scenario {
  removeTrain?: string;
  addMaintenance?: string[];
  changeBrandingPriority?: Record<string, string>;
}

export default function WhatIf() {
  const [scenario, setScenario] = useState<Scenario>({});
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [targetDate, setTargetDate] = useState(new Date().toISOString().split('T')[0]);

  const handleRunSimulation = async () => {
    setLoading(true);
    try {
      const response = await dashboardApi.runWhatIfSimulation(scenario, targetDate);
      setResults(response.data);
    } catch (err: any) {
      console.error('Error running simulation:', err);
      alert(err.response?.data?.error || 'Failed to run simulation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg">
            <Calculator className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              What-If Scenario Simulator
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Test different scenarios before committing to decisions
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scenario Builder */}
        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Build Scenario
              </h2>
            </div>
          </CardHeader>
          <CardBody className="space-y-4">
            <Input
              type="date"
              label="Target Date"
              value={targetDate}
              onValueChange={setTargetDate}
              startContent={<span className="text-gray-400">📅</span>}
            />

            <Input
              label="Remove Train from Service"
              placeholder="e.g., T001"
              value={scenario.removeTrain || ''}
              onValueChange={(value) =>
                setScenario({ ...scenario, removeTrain: value || undefined })
              }
              description="Enter train number to remove from revenue service"
            />

            <Input
              label="Add Train to Maintenance"
              placeholder="e.g., T002, T003"
              value={scenario.addMaintenance?.join(', ') || ''}
              onValueChange={(value) =>
                setScenario({
                  ...scenario,
                  addMaintenance: value
                    ? value.split(',').map((t) => t.trim())
                    : undefined,
                })
              }
              description="Comma-separated train numbers"
            />

            <Divider />

            <Button
              color="primary"
              size="lg"
              onPress={handleRunSimulation}
              isLoading={loading}
              startContent={!loading && <Play className="h-5 w-5" />}
              className="w-full font-semibold"
            >
              {loading ? 'Running Simulation...' : 'Run Simulation'}
            </Button>
          </CardBody>
        </Card>

        {/* Results */}
        <div className="space-y-4">
          {loading && (
            <Card>
              <CardBody className="p-12 text-center">
                <div className="flex flex-col items-center gap-4">
                  <Spinner size="lg" color="primary" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Running simulation...
                  </p>
                </div>
              </CardBody>
            </Card>
          )}

          {results && !loading && (
            <>
              {/* Impact Analysis */}
              <Card className="border-l-4 border-l-blue-500">
                <CardHeader className="pb-3">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    Impact Analysis
                  </h3>
                </CardHeader>
                <CardBody className="space-y-4">
                  {results.results?.impactAnalysis && (
                    <>
                      <div className="p-4 bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                            Punctuality Impact
                          </span>
                          <div className="flex items-center gap-2">
                            {results.results.impactAnalysis.punctualityImpact > 0 ? (
                              <TrendingUp className="h-5 w-5 text-green-500" />
                            ) : (
                              <TrendingDown className="h-5 w-5 text-red-500" />
                            )}
                            <span
                              className={`text-lg font-bold ${
                                results.results.impactAnalysis.punctualityImpact >= 0
                                  ? 'text-green-600'
                                  : 'text-red-600'
                              }`}
                            >
                              {results.results.impactAnalysis.punctualityImpact > 0 ? '+' : ''}
                              {results.results.impactAnalysis.punctualityImpact}%
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                            Branding Breaches
                          </p>
                          <Chip
                            color={
                              results.results.impactAnalysis.brandingBreaches === 0
                                ? 'success'
                                : 'warning'
                            }
                            variant="flat"
                            size="lg"
                            className="font-bold"
                          >
                            {results.results.impactAnalysis.brandingBreaches}
                          </Chip>
                        </div>

                        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                            Mileage Imbalance
                          </p>
                          <Chip
                            color={
                              results.results.impactAnalysis.mileageImbalance === 'optimal'
                                ? 'success'
                                : 'warning'
                            }
                            variant="flat"
                            size="lg"
                            className="font-bold"
                          >
                            {results.results.impactAnalysis.mileageImbalance}
                          </Chip>
                        </div>
                      </div>
                    </>
                  )}

                  {results.results?.recommendations &&
                    results.results.recommendations.length > 0 && (
                      <div className="mt-4">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                          Recommendations
                        </p>
                        <div className="space-y-2">
                          {results.results.recommendations.map((rec: string, idx: number) => (
                            <div
                              key={idx}
                              className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
                            >
                              <p className="text-sm text-blue-900 dark:text-blue-100">
                                {rec}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  {results.results?.impactAnalysis?.conflicts &&
                    results.results.impactAnalysis.conflicts.length > 0 && (
                      <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border-l-4 border-amber-500">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertCircle className="h-5 w-5 text-amber-600" />
                          <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                            Conflicts Detected
                          </p>
                        </div>
                        <ul className="list-disc list-inside space-y-1 text-xs text-amber-800 dark:text-amber-200">
                          {results.results.impactAnalysis.conflicts.map((conflict: any, idx: number) => (
                            <li key={idx}>{typeof conflict === 'string' ? conflict : conflict.description || JSON.stringify(conflict)}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                </CardBody>
              </Card>

              {/* New Induction List Preview */}
              {results.results?.newInductionList &&
                results.results.newInductionList.length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        New Recommended Induction List
                      </h3>
                    </CardHeader>
                    <CardBody>
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {results.results.newInductionList
                          .slice(0, 5)
                          .map((train: TrainDecision, index: number) => (
                            <DecisionCard
                              key={train.trainId || `sim-train-${index}-${train.trainNumber}`}
                              train={train}
                              rank={index + 1}
                            />
                          ))}
                      </div>
                    </CardBody>
                  </Card>
                )}
            </>
          )}

          {!results && !loading && (
            <Card>
              <CardBody className="p-12 text-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full">
                    <Calculator className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 font-medium">
                    Configure a scenario and run simulation to see results
                  </p>
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
