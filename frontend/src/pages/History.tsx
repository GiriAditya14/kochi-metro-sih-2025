import { useState, useEffect, useMemo } from 'react';
import { Card, CardBody, CardHeader, Input, Button, Spinner, Chip, Tabs, Tab } from '@heroui/react';
import { Calendar, Search, FileText, TrendingUp, Train, BarChart3, Filter, Download } from 'lucide-react';
import { historyApi } from '../services/api';
import { formatDate, formatDateTime } from '../lib/utils';
import AgentBreakdown from '../components/AgentBreakdown';
import { cn } from '../lib/utils';

export default function History() {
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [trainIdFilter, setTrainIdFilter] = useState('');
  const [decisions, setDecisions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [selectedDecision, setSelectedDecision] = useState<any>(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const filteredDecisions = useMemo(() => {
    if (activeTab === 'all') return decisions;
    return decisions.filter(d => d.decisionType === activeTab);
  }, [decisions, activeTab]);

  const stats = useMemo(() => {
    const total = decisions.length;
    const revenue = decisions.filter(d => d.decisionType === 'revenue').length;
    const standby = decisions.filter(d => d.decisionType === 'standby').length;
    const maintenance = decisions.filter(d => d.decisionType === 'maintenance').length;
    const avgScore = total > 0 
      ? decisions.reduce((sum, d) => sum + (d.decisionScore || 0), 0) / total 
      : 0;
    
    return { total, revenue, standby, maintenance, avgScore };
  }, [decisions]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const response = await historyApi.getDecisions(
        startDate,
        endDate,
        trainIdFilter ? parseInt(trainIdFilter, 10) : undefined
      );
      setDecisions(response.data.decisions || []);
    } catch (err) {
      console.error('Error fetching history:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg">
            <FileText className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Decision History
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              View past induction decisions and their outcomes
            </p>
          </div>
        </div>
      </div>

      {/* Statistics Overview */}
      {decisions.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="border-l-4 border-l-indigo-500">
            <CardBody className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Total Decisions</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
                </div>
                <FileText className="h-8 w-8 text-indigo-500" />
              </div>
            </CardBody>
          </Card>
          <Card className="border-l-4 border-l-green-500">
            <CardBody className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Revenue Ready</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.revenue}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </CardBody>
          </Card>
          <Card className="border-l-4 border-l-yellow-500">
            <CardBody className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Standby</p>
                  <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.standby}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-yellow-500" />
              </div>
            </CardBody>
          </Card>
          <Card className="border-l-4 border-l-red-500">
            <CardBody className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Maintenance</p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.maintenance}</p>
                </div>
                <Train className="h-8 w-8 text-red-500" />
              </div>
            </CardBody>
          </Card>
          <Card className="border-l-4 border-l-purple-500">
            <CardBody className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Avg Score</p>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {stats.avgScore.toFixed(1)}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-500" />
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="border border-gray-200 dark:border-gray-800">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <Filter className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Filter Options
            </h2>
          </div>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              type="date"
              label="Start Date"
              value={startDate}
              onValueChange={setStartDate}
              startContent={<Calendar className="h-4 w-4 text-gray-400" />}
              variant="bordered"
            />
            <Input
              type="date"
              label="End Date"
              value={endDate}
              onValueChange={setEndDate}
              startContent={<Calendar className="h-4 w-4 text-gray-400" />}
              variant="bordered"
            />
            <Input
              type="number"
              label="Train ID (Optional)"
              placeholder="e.g., 1"
              value={trainIdFilter}
              onValueChange={setTrainIdFilter}
              startContent={<Train className="h-4 w-4 text-gray-400" />}
              variant="bordered"
            />
            <div className="flex items-end gap-2">
              <Button
                color="primary"
                onPress={fetchHistory}
                startContent={<Search className="h-4 w-4" />}
                className="flex-1"
                isLoading={loading}
              >
                Search
              </Button>
              <Button
                variant="flat"
                onPress={() => {
                  const csv = [
                    ['Decision ID', 'Date', 'Train', 'Action', 'Score'].join(','),
                    ...decisions.map(d => [
                      d.decisionId || '',
                      formatDate(d.decisionDate),
                      d.trainNumber || '',
                      d.decisionType || '',
                      d.decisionScore?.toFixed(1) || ''
                    ].join(','))
                  ].join('\n');
                  const blob = new Blob([csv], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `decisions-${startDate}-to-${endDate}.csv`;
                  a.click();
                }}
                startContent={<Download className="h-4 w-4" />}
                isDisabled={decisions.length === 0}
              >
                Export
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* History List */}
      {loading ? (
        <Card>
          <CardBody className="p-12 text-center">
            <div className="flex flex-col items-center gap-4">
              <Spinner size="lg" color="primary" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Loading decision history...
              </p>
            </div>
          </CardBody>
        </Card>
      ) : decisions.length === 0 ? (
        <Card>
          <CardBody className="p-12 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full">
                <FileText className="h-8 w-8 text-gray-400" />
              </div>
              <div>
                <p className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                  No History Found
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No decision history found for the selected date range.
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Past Decisions
            </h2>
            <Chip variant="flat" color="primary">
              {filteredDecisions.length} Result{filteredDecisions.length !== 1 ? 's' : ''}
            </Chip>
          </div>

          {/* Filter Tabs */}
          <Card className="border border-gray-200 dark:border-gray-800">
            <CardBody className="p-0">
              <Tabs
                selectedKey={activeTab}
                onSelectionChange={(key) => setActiveTab(key as string)}
                variant="underlined"
                classNames={{
                  tabList: "gap-1 w-full relative rounded-none p-0 border-b border-divider",
                  cursor: "w-full bg-indigo-500",
                  tab: "max-w-fit px-4 h-12",
                  tabContent: "group-data-[selected=true]:text-indigo-600"
                }}
              >
                <Tab
                  key="all"
                  title={
                    <div className="flex items-center gap-2">
                      <span>All</span>
                      <Chip size="sm" variant="flat" color="default">
                        {stats.total}
                      </Chip>
                    </div>
                  }
                />
                <Tab
                  key="revenue"
                  title={
                    <div className="flex items-center gap-2">
                      <span>Revenue</span>
                      <Chip size="sm" variant="flat" color="success">
                        {stats.revenue}
                      </Chip>
                    </div>
                  }
                />
                <Tab
                  key="standby"
                  title={
                    <div className="flex items-center gap-2">
                      <span>Standby</span>
                      <Chip size="sm" variant="flat" color="warning">
                        {stats.standby}
                      </Chip>
                    </div>
                  }
                />
                <Tab
                  key="maintenance"
                  title={
                    <div className="flex items-center gap-2">
                      <span>Maintenance</span>
                      <Chip size="sm" variant="flat" color="danger">
                        {stats.maintenance}
                      </Chip>
                    </div>
                  }
                />
              </Tabs>
            </CardBody>
          </Card>

          <div className="space-y-4">
            {filteredDecisions.map((decision, idx) => (
              <Card 
                key={decision.decisionId || `decision-${idx}`} 
                className={cn(
                  "hover:shadow-lg transition-all border-l-4 cursor-pointer",
                  decision.decisionType === 'revenue' && "border-l-green-500",
                  decision.decisionType === 'standby' && "border-l-yellow-500",
                  decision.decisionType === 'maintenance' && "border-l-red-500",
                  !decision.decisionType && "border-l-indigo-500"
                )}
                onPress={() => setSelectedDecision(selectedDecision?.decisionId === decision.decisionId ? null : decision)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "p-3 rounded-xl",
                        decision.decisionType === 'revenue' && "bg-green-100 dark:bg-green-900/30",
                        decision.decisionType === 'standby' && "bg-yellow-100 dark:bg-yellow-900/30",
                        decision.decisionType === 'maintenance' && "bg-red-100 dark:bg-red-900/30",
                        !decision.decisionType && "bg-indigo-100 dark:bg-indigo-900/30"
                      )}>
                        <FileText className={cn(
                          "h-5 w-5",
                          decision.decisionType === 'revenue' && "text-green-600 dark:text-green-400",
                          decision.decisionType === 'standby' && "text-yellow-600 dark:text-yellow-400",
                          decision.decisionType === 'maintenance' && "text-red-600 dark:text-red-400",
                          !decision.decisionType && "text-indigo-600 dark:text-indigo-400"
                        )} />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                          Decision #{decision.decisionId}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {formatDateTime(decision.decisionDate)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                        Score
                      </p>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-indigo-500" />
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {decision.decisionScore?.toFixed(1) || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardBody className="pt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                        Train
                      </p>
                      <Chip variant="flat" color="primary" size="sm">
                        {decision.trainNumber || 'N/A'}
                      </Chip>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                        Action
                      </p>
                      <Chip
                        variant="flat"
                        color={
                          decision.decisionType === 'revenue'
                            ? 'success'
                            : decision.decisionType === 'standby'
                            ? 'warning'
                            : 'danger'
                        }
                        size="sm"
                        className="font-semibold"
                      >
                        {decision.decisionType?.toUpperCase() || 'N/A'}
                      </Chip>
                    </div>
                  </div>
                  {selectedDecision?.decisionId === decision.decisionId && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      {decision.reasoningDetails && typeof decision.reasoningDetails === 'object' && (
                        <AgentBreakdown 
                          details={decision.reasoningDetails} 
                          priorityScore={decision.decisionScore || 0} 
                        />
                      )}
                      {decision.reasoningDetails && typeof decision.reasoningDetails === 'string' && (
                        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                            {decision.reasoningDetails}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </CardBody>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
