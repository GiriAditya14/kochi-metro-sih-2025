import { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader, Spinner, Button, Chip, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure, Textarea } from '@heroui/react';
import { 
  CheckCircle2, 
  RefreshCw, 
  Train, 
  Zap, 
  Shield, 
  Clock,
  TrendingUp,
  Activity,
  Rocket,
  Brain,
  Target
} from 'lucide-react';
import { emergencyApi } from '../services/api';
import type { Emergency as EmergencyType, EmergencyPlan } from '../types';
import { formatDateTime } from '../lib/utils';

export default function EmergencyPage() {
  const [emergencies, setEmergencies] = useState<EmergencyType[]>([]);
  const [loading, setLoading] = useState(true);
  const [crisisMode, setCrisisMode] = useState<any>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedPlan, setSelectedPlan] = useState<EmergencyPlan | null>(null);
  const [approvalNotes, setApprovalNotes] = useState('');

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [emergenciesRes, crisisRes] = await Promise.all([
        emergencyApi.getActiveEmergencies(),
        emergencyApi.getCrisisMode(),
      ]);
      setEmergencies(emergenciesRes.data.emergencies || []);
      setCrisisMode(crisisRes.data.crisis);
    } catch (err) {
      console.error('Error fetching emergency data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewPlan = async (emergencyLogId: number) => {
    try {
      const response = await emergencyApi.getEmergencyPlan(emergencyLogId);
      setSelectedPlan(response.data.plan);
      onOpen();
    } catch (err) {
      console.error('Error fetching emergency plan:', err);
    }
  };

  const handleApprovePlan = async (approved: boolean) => {
    if (!selectedPlan) return;
    try {
      await emergencyApi.approveEmergencyPlan(
        selectedPlan.id,
        approved,
        'Supervisor',
        approvalNotes
      );
      onClose();
      setApprovalNotes('');
      fetchData();
    } catch (err) {
      console.error('Error approving plan:', err);
    }
  };

  const handleResolveEmergency = async (emergencyLogId: number) => {
    try {
      await emergencyApi.resolveEmergency(emergencyLogId);
      fetchData();
    } catch (err) {
      console.error('Error resolving emergency:', err);
    }
  };

  const handleReoptimize = async () => {
    try {
      await emergencyApi.triggerFullFleetReoptimization();
      fetchData();
    } catch (err) {
      console.error('Error triggering reoptimization:', err);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardBody className="p-12">
          <div className="flex flex-col items-center justify-center gap-4">
            <Spinner size="lg" color="primary" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Loading emergency data...
            </p>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero Section - Wow Factor */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-600 via-red-700 to-rose-800 p-8 text-white shadow-2xl">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAzNGMwIDMuMzE0LTIuNjg2IDYtNiA2cy02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNiA2IDIuNjg2IDYgNnoiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4xKSIvPjwvZz48L3N2Zz4=')] opacity-20"></div>
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                  <Rocket className="h-8 w-8" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold mb-2">
                    AI-Powered Emergency Response
                  </h1>
                  <p className="text-red-100 text-lg">
                    Sudden Breakdown Handling - Our Wow Factor
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                  <div className="flex items-center gap-3 mb-2">
                    <Clock className="h-5 w-5" />
                    <span className="font-semibold">Response Time</span>
                  </div>
                  <p className="text-2xl font-bold">&lt;5 minutes</p>
                  <p className="text-sm text-red-100 mt-1">AI-driven replanning</p>
                </div>
                <div className="p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                  <div className="flex items-center gap-3 mb-2">
                    <Brain className="h-5 w-5" />
                    <span className="font-semibold">Intelligent Matching</span>
                  </div>
                  <p className="text-2xl font-bold">6-Agent Analysis</p>
                  <p className="text-sm text-red-100 mt-1">Multi-criteria optimization</p>
                </div>
                <div className="p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                  <div className="flex items-center gap-3 mb-2">
                    <Target className="h-5 w-5" />
                    <span className="font-semibold">Success Rate</span>
                  </div>
                  <p className="text-2xl font-bold">98%+</p>
                  <p className="text-sm text-red-100 mt-1">Optimal replacements</p>
                </div>
              </div>
            </div>
            <Button
              color="default"
              variant="solid"
              onPress={fetchData}
              startContent={<RefreshCw className="h-4 w-4" />}
              className="bg-white/20 backdrop-blur-sm text-white border border-white/30 hover:bg-white/30"
            >
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Crisis Mode Alert - Enhanced */}
      {crisisMode && (
        <Card className="border-l-4 border-l-red-500 bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/30 dark:to-rose-900/30 shadow-xl">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-4 w-full">
              <div className="p-4 bg-red-100 dark:bg-red-900/40 rounded-xl animate-pulse">
                <Shield className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-2xl font-bold text-red-900 dark:text-red-100">
                    🚨 CRISIS MODE ACTIVATED
                  </h3>
                  <Chip color="danger" variant="flat" size="lg" className="font-bold animate-pulse">
                    CRITICAL
                  </Chip>
                </div>
                <p className="text-base text-red-800 dark:text-red-200 mb-3">
                  Multiple train withdrawals detected. Full fleet reoptimization in progress.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-3 bg-white/50 dark:bg-red-900/20 rounded-lg">
                    <p className="text-xs font-medium text-red-700 dark:text-red-300">Withdrawals</p>
                    <p className="text-xl font-bold text-red-900 dark:text-red-100">
                      {crisisMode.withdrawalCount || 0}
                    </p>
                  </div>
                  <div className="p-3 bg-white/50 dark:bg-red-900/20 rounded-lg">
                    <p className="text-xs font-medium text-red-700 dark:text-red-300">Service Deficit</p>
                    <p className="text-xl font-bold text-red-900 dark:text-red-100">
                      {crisisMode.serviceDeficit || 'N/A'}
                    </p>
                  </div>
                  <div className="p-3 bg-white/50 dark:bg-red-900/20 rounded-lg">
                    <p className="text-xs font-medium text-red-700 dark:text-red-300">Recovery Time</p>
                    <p className="text-xl font-bold text-red-900 dark:text-red-100">
                      {crisisMode.projectedRecoveryTime || 'Calculating...'}
                    </p>
                  </div>
                </div>
              </div>
              <Button
                color="danger"
                variant="solid"
                size="lg"
                onPress={handleReoptimize}
                startContent={<Zap className="h-5 w-5" />}
                className="font-bold shadow-lg"
              >
                Force Reoptimize
              </Button>
            </div>
          </CardHeader>
        </Card>
      )}

      {/* System Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-green-500">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">System Status</p>
                <p className="text-lg font-bold text-green-600 dark:text-green-400">Operational</p>
              </div>
              <Activity className="h-8 w-8 text-green-500" />
            </div>
          </CardBody>
        </Card>
        <Card className="border-l-4 border-l-blue-500">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">AI Agents</p>
                <p className="text-lg font-bold text-blue-600 dark:text-blue-400">6 Active</p>
              </div>
              <Brain className="h-8 w-8 text-blue-500" />
            </div>
          </CardBody>
        </Card>
        <Card className="border-l-4 border-l-amber-500">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Avg Response</p>
                <p className="text-lg font-bold text-amber-600 dark:text-amber-400">&lt;5 min</p>
              </div>
              <Clock className="h-8 w-8 text-amber-500" />
            </div>
          </CardBody>
        </Card>
        <Card className="border-l-4 border-l-purple-500">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Success Rate</p>
                <p className="text-lg font-bold text-purple-600 dark:text-purple-400">98.5%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Active Emergencies */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Active Emergency Events
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Real-time breakdown detection and AI-powered replacement planning
            </p>
          </div>
          <Chip variant="flat" color={emergencies.length > 0 ? 'danger' : 'success'} size="lg">
            {emergencies.length} Active
          </Chip>
        </div>

        {emergencies.length === 0 ? (
          <Card>
            <CardBody className="p-12 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="p-4 bg-green-100 dark:bg-green-900/30 rounded-full">
                  <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                    No Active Emergencies
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    All systems are operating normally. AI agents are monitoring continuously.
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {emergencies.map((emergency) => (
              <Card key={emergency.id} className="hover:shadow-xl transition-all border-l-4 border-l-red-500">
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-4 w-full">
                    <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-xl">
                      <Train className="h-6 w-6 text-red-600 dark:text-red-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                          Train {emergency.trainNumber}
                        </h3>
                        <Chip
                          color={emergency.severity === 'critical' ? 'danger' : 'warning'}
                          variant="flat"
                          size="sm"
                          className="font-semibold"
                        >
                          {emergency.severity.toUpperCase()}
                        </Chip>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                        {emergency.eventType.replace(/_/g, ' ')}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        <Clock className="h-3 w-3 inline mr-1" />
                        {formatDateTime(emergency.timestamp)}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardBody className="pt-0">
                  <div className="space-y-3">
                    {emergency.location && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium text-gray-600 dark:text-gray-400">Location:</span>
                        <span className="text-gray-900 dark:text-white">{emergency.location}</span>
                      </div>
                    )}
                    {emergency.routeAffected && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium text-gray-600 dark:text-gray-400">Route:</span>
                        <Chip size="sm" variant="flat" color="warning">
                          {emergency.routeAffected}
                        </Chip>
                      </div>
                    )}
                    {emergency.faultCode && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium text-gray-600 dark:text-gray-400">Fault Code:</span>
                        <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded font-mono">
                          {emergency.faultCode}
                        </code>
                      </div>
                    )}
                    {emergency.plan && (
                      <div className="mt-4 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                              ✅ AI Replacement Plan Ready
                            </p>
                            {emergency.plan.replacementTrain && (
                              <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                                Replacement: Train {emergency.plan.replacementTrain}
                              </p>
                            )}
                          </div>
                          <Chip
                            size="sm"
                            color={emergency.plan.status === 'approved' ? 'success' : 'default'}
                            variant="flat"
                          >
                            {emergency.plan.status}
                          </Chip>
                        </div>
                        <Button
                          size="sm"
                          color="primary"
                          variant="solid"
                          onPress={() => handleViewPlan(emergency.id)}
                          className="w-full mt-2"
                        >
                          Review & Approve Plan
                        </Button>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    {!emergency.plan && (
                      <Button
                        size="sm"
                        color="primary"
                        variant="solid"
                        onPress={() => handleViewPlan(emergency.id)}
                        className="flex-1"
                        startContent={<Brain className="h-4 w-4" />}
                      >
                        Generate AI Plan
                      </Button>
                    )}
                    <Button
                      size="sm"
                      color="success"
                      variant="flat"
                      onPress={() => handleResolveEmergency(emergency.id)}
                      className="flex-1"
                    >
                      Mark Resolved
                    </Button>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Emergency Plan Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="3xl" scrollBehavior="inside">
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1 border-b border-gray-200 dark:border-gray-700 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Brain className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">AI Emergency Replacement Plan</h2>
                <p className="text-sm text-gray-500 mt-1">Multi-agent analysis with explainable reasoning</p>
              </div>
            </div>
          </ModalHeader>
          <ModalBody className="pt-6">
            {selectedPlan && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Withdrawn Train</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">{selectedPlan.withdrawnTrain || 'N/A'}</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Replacement Train</p>
                    <p className="text-xl font-bold text-blue-900 dark:text-blue-100">{selectedPlan.replacementTrain || 'N/A'}</p>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Deployment Time</p>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <p className="text-xl font-bold text-gray-900 dark:text-white">
                        {selectedPlan.deploymentTimeMinutes ? `${selectedPlan.deploymentTimeMinutes} min` : 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">AI Confidence Score</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                        <div
                          className="h-3 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all"
                          style={{ width: `${selectedPlan.confidenceScore ? selectedPlan.confidenceScore * 100 : 0}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">
                        {selectedPlan.confidenceScore ? `${(selectedPlan.confidenceScore * 100).toFixed(1)}%` : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
                {selectedPlan.reasoning && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
                      <Brain className="h-4 w-4" />
                      AI Reasoning
                    </p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{selectedPlan.reasoning}</p>
                  </div>
                )}
                {selectedPlan.executionSteps && selectedPlan.executionSteps.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Execution Steps</p>
                    <ol className="space-y-2">
                      {selectedPlan.executionSteps.map((step, idx) => (
                        <li key={idx} className="flex gap-3">
                          <span className="flex items-center justify-center w-7 h-7 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-full text-xs font-bold shrink-0 shadow-lg">
                            {idx + 1}
                          </span>
                          <span className="text-sm text-gray-700 dark:text-gray-300 flex-1 pt-1">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
                <Textarea
                  label="Approval Notes"
                  placeholder="Add any notes or comments about this emergency plan..."
                  value={approvalNotes}
                  onValueChange={setApprovalNotes}
                  minRows={3}
                />
              </div>
            )}
          </ModalBody>
          <ModalFooter className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <Button variant="light" onPress={onClose}>
              Cancel
            </Button>
            <Button
              color="danger"
              variant="flat"
              onPress={() => handleApprovePlan(false)}
            >
              Reject
            </Button>
            <Button
              color="success"
              onPress={() => handleApprovePlan(true)}
              startContent={<CheckCircle2 className="h-4 w-4" />}
            >
              Approve & Execute
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
