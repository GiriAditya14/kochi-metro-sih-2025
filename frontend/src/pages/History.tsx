import { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader, Input, Button, Spinner, Chip } from '@heroui/react';
import { Calendar, Search, FileText, TrendingUp } from 'lucide-react';
import { historyApi } from '../services/api';
import { formatDate, formatDateTime } from '../lib/utils';

export default function History() {
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [decisions, setDecisions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const response = await historyApi.getDecisions(startDate, endDate);
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

      {/* Filters */}
      <Card className="border-l-4 border-l-indigo-500">
        <CardHeader className="pb-3">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            Filter Options
          </h2>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              type="date"
              label="Start Date"
              value={startDate}
              onValueChange={setStartDate}
              startContent={<Calendar className="h-4 w-4 text-gray-400" />}
            />
            <Input
              type="date"
              label="End Date"
              value={endDate}
              onValueChange={setEndDate}
              startContent={<Calendar className="h-4 w-4 text-gray-400" />}
            />
            <div className="flex items-end">
              <Button
                color="primary"
                onPress={fetchHistory}
                startContent={<Search className="h-4 w-4" />}
                className="w-full"
                isLoading={loading}
              >
                Search
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
              {decisions.length} Results
            </Chip>
          </div>
          {decisions.map((decision, idx) => (
            <Card key={decision.decisionId || `decision-${idx}`} className="hover:shadow-lg transition-all border-l-4 border-l-indigo-500">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
                      <FileText className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        Decision #{decision.decisionId}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(decision.decisionDate)}
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
                {decision.reasoningDetails && typeof decision.reasoningDetails === 'string' && (
                  <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                      {decision.reasoningDetails}
                    </p>
                  </div>
                )}
                {decision.reasoningDetails && typeof decision.reasoningDetails === 'object' && (
                  <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">Reasoning Details</p>
                    <pre className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {JSON.stringify(decision.reasoningDetails, null, 2)}
                    </pre>
                  </div>
                )}
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
