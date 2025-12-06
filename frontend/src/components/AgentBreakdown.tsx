import { Card, CardBody, CardHeader, Chip, Tabs, Tab } from '@heroui/react';
import { 
  Shield, 
  ClipboardCheck, 
  Megaphone, 
  Gauge, 
  Sparkles, 
  MapPin,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { useState } from 'react';
import type { ReasoningDetails } from '../types';
import { cn } from '../lib/utils';

interface AgentBreakdownProps {
  details: ReasoningDetails;
  priorityScore: number;
}

const agents = [
  {
    key: 'fitness',
    label: 'Fitness Certificate',
    icon: Shield,
    description: 'Rolling-Stock, Signalling & Telecom certificates',
    color: 'blue',
  },
  {
    key: 'jobCards',
    label: 'Job Cards',
    icon: ClipboardCheck,
    description: 'Maximo work orders & maintenance status',
    color: 'purple',
  },
  {
    key: 'branding',
    label: 'Branding Priority',
    icon: Megaphone,
    description: 'Advertiser SLA compliance & exposure hours',
    color: 'orange',
  },
  {
    key: 'mileage',
    label: 'Mileage Balance',
    icon: Gauge,
    description: 'Wear distribution & usage equalization',
    color: 'green',
  },
  {
    key: 'cleaning',
    label: 'Cleaning Status',
    icon: Sparkles,
    description: 'Cleaning slots & bay availability',
    color: 'pink',
  },
  {
    key: 'stabling',
    label: 'Stabling Geometry',
    icon: MapPin,
    description: 'Depot positioning & shunting efficiency',
    color: 'indigo',
  },
] as const;

export default function AgentBreakdown({ details, priorityScore }: AgentBreakdownProps) {
  const [selectedTab, setSelectedTab] = useState<string>('fitness');
  
  const sections = agents
    .map(agent => ({
      ...agent,
      data: details[agent.key as keyof ReasoningDetails],
    }))
    .filter(section => section.data);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'danger';
  };

  const getScoreGradient = (score: number) => {
    if (score >= 80) return 'from-green-500 to-emerald-500';
    if (score >= 60) return 'from-yellow-500 to-amber-500';
    return 'from-red-500 to-rose-500';
  };

  const selectedAgent = sections.find(s => s.key === selectedTab) || sections[0];
  const selectedData = selectedAgent?.data;

  return (
    <div className="space-y-4">
      {/* Overall Score Header */}
      <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Composite Priority Score</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {priorityScore.toFixed(1)}/100
              </p>
            </div>
          </div>
          <Chip
            color={getScoreColor(priorityScore)}
            variant="flat"
            size="lg"
            className="font-bold"
          >
            {priorityScore >= 80 ? 'Excellent' : priorityScore >= 60 ? 'Good' : 'Needs Review'}
          </Chip>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
          <div
            className={cn(
              "h-3 rounded-full bg-gradient-to-r transition-all duration-500",
              getScoreGradient(priorityScore)
            )}
            style={{ width: `${priorityScore}%` }}
          />
        </div>
      </div>

      {/* Agent Tabs */}
      <Card className="border border-gray-200 dark:border-gray-700">
        <CardHeader className="pb-0">
          <Tabs
            selectedKey={selectedTab}
            onSelectionChange={(key) => setSelectedTab(key as string)}
            variant="underlined"
            classNames={{
              tabList: "gap-2 w-full relative rounded-none p-0 border-b border-divider",
              cursor: "w-full bg-blue-500",
              tab: "max-w-fit px-4 h-12",
              tabContent: "group-data-[selected=true]:text-blue-600"
            }}
          >
            {sections.map((section) => {
              const Icon = section.icon;
              const score = section.data?.score || 0;
              return (
                <Tab
                  key={section.key}
                  title={
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      <span className="font-medium">{section.label}</span>
                      <Chip
                        size="sm"
                        color={getScoreColor(score)}
                        variant="flat"
                        className="ml-1"
                      >
                        {score}
                      </Chip>
                    </div>
                  }
                />
              );
            })}
          </Tabs>
        </CardHeader>
        <CardBody className="pt-6">
          {selectedAgent && selectedData && (
            <div className="space-y-6">
              {/* Agent Header */}
              <div className="flex items-start gap-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                <div className={cn(
                  "p-3 rounded-xl shadow-lg",
                  selectedAgent.color === 'blue' && "bg-gradient-to-br from-blue-500 to-blue-600",
                  selectedAgent.color === 'purple' && "bg-gradient-to-br from-purple-500 to-purple-600",
                  selectedAgent.color === 'orange' && "bg-gradient-to-br from-orange-500 to-orange-600",
                  selectedAgent.color === 'green' && "bg-gradient-to-br from-green-500 to-green-600",
                  selectedAgent.color === 'pink' && "bg-gradient-to-br from-pink-500 to-pink-600",
                  selectedAgent.color === 'indigo' && "bg-gradient-to-br from-indigo-500 to-indigo-600",
                )}>
                  {(() => {
                    const Icon = selectedAgent.icon;
                    return <Icon className="h-8 w-8 text-white" />;
                  })()}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                    {selectedAgent.label}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedAgent.description}
                  </p>
                </div>
                <Chip
                  color={getScoreColor(selectedData.score || 0)}
                  variant="flat"
                  size="lg"
                  className="font-bold text-lg"
                >
                  {selectedData.score || 0}/100
                </Chip>
              </div>

              {/* Score Visualization */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Agent Score</span>
                  <span className="text-lg font-bold text-gray-900 dark:text-white">
                    {selectedData.score || 0}/100
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                  <div
                    className={cn(
                      "h-4 rounded-full bg-gradient-to-r transition-all duration-500 shadow-md",
                      getScoreGradient(selectedData.score || 0)
                    )}
                    style={{ width: `${selectedData.score || 0}%` }}
                  />
                </div>
              </div>

              {/* Status Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="border border-gray-200 dark:border-gray-700">
                  <CardBody className="p-4">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Current Status</p>
                    <p className="text-base font-bold text-gray-900 dark:text-white">
                      {selectedData.status || selectedData.priority || selectedData.balance || 'N/A'}
                    </p>
                  </CardBody>
                </Card>
                <Card className={cn(
                  "border",
                  (selectedData.score || 0) >= 80 && "border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10",
                  (selectedData.score || 0) >= 60 && (selectedData.score || 0) < 80 && "border-yellow-200 dark:border-yellow-800 bg-yellow-50/50 dark:bg-yellow-900/10",
                  (selectedData.score || 0) < 60 && "border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10"
                )}>
                  <CardBody className="p-4">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Assessment</p>
                    <p className="text-base font-bold text-gray-900 dark:text-white">
                      {(selectedData.score || 0) >= 80 ? 'Excellent' : (selectedData.score || 0) >= 60 ? 'Good' : 'Needs Review'}
                    </p>
                  </CardBody>
                </Card>
              </div>

              {/* Detailed Information */}
              {selectedData.details && (
                <Card className="border border-gray-200 dark:border-gray-700">
                  <CardHeader className="pb-2">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">Detailed Analysis</p>
                  </CardHeader>
                  <CardBody className="pt-0">
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                      {selectedData.details}
                    </p>
                  </CardBody>
                </Card>
              )}

              {/* Warning Alert */}
              {(selectedData.score || 0) < 60 && (
                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    <div>
                      <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                        Attention Required
                      </p>
                      <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                        This agent has identified issues that require review before proceeding with induction.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Legend */}
      <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
        <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-3">
          Score Interpretation Guide
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-900/10 rounded">
            <div className="w-4 h-4 rounded-full bg-gradient-to-r from-green-500 to-emerald-500" />
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">80-100: Excellent</p>
              <p className="text-gray-600 dark:text-gray-400">Optimal condition, ready for service</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 bg-yellow-50 dark:bg-yellow-900/10 rounded">
            <div className="w-4 h-4 rounded-full bg-gradient-to-r from-yellow-500 to-amber-500" />
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">60-79: Good</p>
              <p className="text-gray-600 dark:text-gray-400">Acceptable with minor considerations</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-900/10 rounded">
            <div className="w-4 h-4 rounded-full bg-gradient-to-r from-red-500 to-rose-500" />
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">&lt;60: Review Required</p>
              <p className="text-gray-600 dark:text-gray-400">Issues detected, needs attention</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

