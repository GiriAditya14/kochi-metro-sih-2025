import { useState } from 'react';
import { Card, CardBody, CardHeader, Button, Input, Spinner, Chip, Divider, Tabs, Tab } from '@heroui/react';
import { Play, AlertCircle, TrendingUp, TrendingDown, Calculator, Sparkles, BarChart3, FileText, Zap } from 'lucide-react';
import { dashboardApi } from '../services/api';
import DecisionCard from '../components/DecisionCard';
import type { TrainDecision } from '../types';
import { cn } from '../lib/utils';

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
  const [activeTab, setActiveTab] = useState<string>('scenario');

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

  const getImpactColor = (value: number) => {
    if (value > 0) return 'text-green-600 dark:text-green-400';
    if (value < 0) return 'text-red-600 dark:text-red-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  const getImpactIcon = (value: number) => {
    if (value > 0) return TrendingUp;
    if (value < 0) return TrendingDown;
    return AlertCircle;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg shadow-lg">
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
        {results && (
          <Chip color="success" variant="flat" size="lg" className="font-semibold">
            Simulation Complete
          </Chip>
        )}
      </div>

      {/* Quick Stats */}
      {results && results.results?.impactAnalysis && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-l-4 border-l-blue-500">
            <CardBody className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Punctuality Impact
                  </p>
                  <p className={cn("text-2xl font-bold", getImpactColor(results.results.impactAnalysis.punctualityImpact || 0))}>
                    {results.results.impactAnalysis.punctualityImpact > 0 ? '+' : ''}
                    {results.results.impactAnalysis.punctualityImpact || 0}%
                  </p>
                </div>
                {(() => {
                  const Icon = getImpactIcon(results.results.impactAnalysis.punctualityImpact || 0);
                  return <Icon className={cn("h-8 w-8", getImpactColor(results.results.impactAnalysis.punctualityImpact || 0))} />;
                })()}
              </div>
            </CardBody>
          </Card>
          <Card className="border-l-4 border-l-amber-500">
            <CardBody className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Branding Breaches
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {results.results.impactAnalysis.brandingBreaches || 0}
                  </p>
                </div>
                <AlertCircle className="h-8 w-8 text-amber-500" />
              </div>
            </CardBody>
          </Card>
          <Card className="border-l-4 border-l-green-500">
            <CardBody className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Mileage Status
                  </p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white capitalize">
                    {results.results.impactAnalysis.mileageImbalance || 'N/A'}
                  </p>
                </div>
                <BarChart3 className="h-8 w-8 text-green-500" />
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      <Card className="border border-gray-200 dark:border-gray-800">
        <CardHeader className="pb-0">
          <Tabs
            selectedKey={activeTab}
            onSelectionChange={(key) => setActiveTab(key as string)}
            variant="underlined"
            classNames={{
              tabList: "gap-1 w-full relative rounded-none p-0 border-b border-divider",
              cursor: "w-full bg-purple-500",
              tab: "max-w-fit px-4 h-12",
              tabContent: "group-data-[selected=true]:text-purple-600"
            }}
          >
            <Tab
              key="scenario"
              title={
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  <span>Build Scenario</span>
                </div>
              }
            />
            <Tab
              key="results"
              title={
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  <span>Results</span>
                  {results && <Chip size="sm" color="success" variant="flat">Ready</Chip>}
                </div>
              }
            />
            <Tab
              key="preview"
              title={
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span>Induction Preview</span>
                  {results?.results?.newInductionList && (
                    <Chip size="sm" color="primary" variant="flat">
                      {results.results.newInductionList.length}
                    </Chip>
                  )}
                </div>
              }
            />
          </Tabs>
        </CardHeader>
        <CardBody className="pt-6">
          {activeTab === 'scenario' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  type="date"
                  label="Target Date"
                  value={targetDate}
                  onValueChange={setTargetDate}
                  variant="bordered"
                  description="Select the date for simulation"
                />

                <Input
                  label="Remove Train from Service"
                  placeholder="e.g., T001"
                  value={scenario.removeTrain || ''}
                  onValueChange={(value) =>
                    setScenario({ ...scenario, removeTrain: value || undefined })
                  }
                  description="Enter train number to remove"
                  variant="bordered"
                  startContent={<Zap className="h-4 w-4 text-gray-400" />}
                />
              </div>

              <Input
                label="Add Train(s) to Maintenance"
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
                variant="bordered"
                startContent={<AlertCircle className="h-4 w-4 text-gray-400" />}
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
            </div>
          )}

          {activeTab === 'results' && (
            <div className="space-y-6">
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <Spinner size="lg" color="primary" />
                </div>
              ) : results ? (
                <>
                  {/* Impact Analysis */}
                  {results.results?.impactAnalysis && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        Impact Analysis
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card className="border border-gray-200 dark:border-gray-700">
                          <CardBody className="p-4">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                Punctuality Impact
                              </span>
                              {(() => {
                                const Icon = getImpactIcon(results.results.impactAnalysis.punctualityImpact || 0);
                                return <Icon className={cn("h-5 w-5", getImpactColor(results.results.impactAnalysis.punctualityImpact || 0))} />;
                              })()}
                            </div>
                            <p className={cn("text-3xl font-bold", getImpactColor(results.results.impactAnalysis.punctualityImpact || 0))}>
                              {results.results.impactAnalysis.punctualityImpact > 0 ? '+' : ''}
                              {results.results.impactAnalysis.punctualityImpact || 0}%
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                              Change in on-time performance
                            </p>
                          </CardBody>
                        </Card>

                        <Card className="border border-gray-200 dark:border-gray-700">
                          <CardBody className="p-4">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                Branding Breaches
                              </span>
                              <AlertCircle className="h-5 w-5 text-amber-500" />
                            </div>
                            <p className="text-3xl font-bold text-gray-900 dark:text-white">
                              {results.results.impactAnalysis.brandingBreaches || 0}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                              Advertiser SLA violations
                            </p>
                          </CardBody>
                        </Card>
                      </div>

                      <Card className="border border-gray-200 dark:border-gray-700">
                        <CardBody className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                              Mileage Balance Status
                            </span>
                            <BarChart3 className="h-5 w-5 text-green-500" />
                          </div>
                          <Chip
                            color={results.results.impactAnalysis.mileageImbalance === 'optimal' ? 'success' : 'warning'}
                            variant="flat"
                            size="lg"
                            className="font-bold capitalize"
                          >
                            {results.results.impactAnalysis.mileageImbalance || 'N/A'}
                          </Chip>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                            Overall fleet wear distribution
                          </p>
                        </CardBody>
                      </Card>
                    </div>
                  )}

                  {/* Recommendations */}
                  {results.results?.recommendations && results.results.recommendations.length > 0 && (
                    <div className="mt-6">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                        Recommendations
                      </h3>
                      <div className="space-y-2">
                        {results.results.recommendations.map((rec: string, idx: number) => (
                          <Card key={idx} className="border-l-4 border-l-blue-500">
                            <CardBody className="p-4">
                              <div className="flex items-start gap-3">
                                <div className="p-1 bg-blue-100 dark:bg-blue-900/30 rounded">
                                  <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                </div>
                                <p className="text-sm text-gray-700 dark:text-gray-300 flex-1">
                                  {rec}
                                </p>
                              </div>
                            </CardBody>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Conflicts */}
                  {results.results?.impactAnalysis?.conflicts && results.results.impactAnalysis.conflicts.length > 0 && (
                    <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border-l-4 border-amber-500">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                        <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                          {results.results.impactAnalysis.conflicts.length} Conflict{results.results.impactAnalysis.conflicts.length > 1 ? 's' : ''} Detected
                        </p>
                      </div>
                      <ul className="list-disc list-inside space-y-1 text-xs text-amber-800 dark:text-amber-200">
                        {results.results.impactAnalysis.conflicts.map((conflict: any, idx: number) => (
                          <li key={idx}>
                            {typeof conflict === 'string' ? conflict : conflict.description || JSON.stringify(conflict)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <BarChart3 className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 font-medium">
                    Run a simulation to see results
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'preview' && (
            <div className="space-y-4">
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <Spinner size="lg" color="primary" />
                </div>
              ) : results?.results?.newInductionList && results.results.newInductionList.length > 0 ? (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                      New Recommended Induction List
                    </h3>
                    <Chip variant="flat" color="primary">
                      Top {Math.min(5, results.results.newInductionList.length)} of {results.results.newInductionList.length}
                    </Chip>
                  </div>
                  <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
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
                </>
              ) : (
                <div className="text-center py-12">
                  <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <FileText className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 font-medium">
                    Run a simulation to see the new induction list
                  </p>
                </div>
              )}
            </div>
          )}
        </CardBody>
      </Card>

    </div>
  );
}
