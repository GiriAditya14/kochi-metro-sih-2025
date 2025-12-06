import { useState, useEffect, useCallback } from 'react';
import { Card, CardBody, CardHeader, Spinner, Input, Button, Chip } from '@heroui/react';
import { RefreshCw, Calendar, TrendingUp, AlertCircle, CheckCircle2, Clock, Wrench } from 'lucide-react';
import { dashboardApi } from '../services/api';
import type { InductionListResponse, TrainDecision } from '../types';
import DecisionCard from '../components/DecisionCard';
import ConflictAlerts from '../components/ConflictAlerts';
import SixAgentsOverview from '../components/SixAgentsOverview';
import { formatDate } from '../lib/utils';

export default function Dashboard() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [data, setData] = useState<InductionListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInductionList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await dashboardApi.getInductionList(date);
      setData(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load induction list');
      console.error('Error fetching induction list:', err);
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    fetchInductionList();
  }, [fetchInductionList]);

  const handleTrainSelect = (trainId: number) => {
    console.log('Selected train:', trainId);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Train Induction Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            AI-driven decision support for train induction planning and scheduling
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Input
            type="date"
            value={date}
            onValueChange={setDate}
            startContent={<Calendar className="h-4 w-4 text-gray-400" />}
            className="w-full sm:w-48"
            classNames={{
              input: "text-sm",
            }}
          />
          <Button
            color="primary"
            variant="solid"
            onPress={fetchInductionList}
            startContent={<RefreshCw className="h-4 w-4" />}
            isLoading={loading}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      {data && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-gray-400">
            <CardBody className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Total Trains
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {data.summary.totalTrains}
                  </p>
                </div>
                <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="border-l-4 border-l-green-500 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
            <CardBody className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700 dark:text-green-400 mb-1">
                    Revenue Ready
                  </p>
                  <p className="text-3xl font-bold text-green-900 dark:text-green-100">
                    {data.summary.revenueReady}
                  </p>
                </div>
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="border-l-4 border-l-yellow-500 bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20">
            <CardBody className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-yellow-700 dark:text-yellow-400 mb-1">
                    Standby
                  </p>
                  <p className="text-3xl font-bold text-yellow-900 dark:text-yellow-100">
                    {data.summary.standby}
                  </p>
                </div>
                <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                  <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="border-l-4 border-l-red-500 bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20">
            <CardBody className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-700 dark:text-red-400 mb-1">
                    Maintenance
                  </p>
                  <p className="text-3xl font-bold text-red-900 dark:text-red-100">
                    {data.summary.maintenance}
                  </p>
                </div>
                <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                  <Wrench className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Six Agents Overview */}
      <Card className="border border-gray-200 dark:border-gray-700">
        <CardBody className="p-6">
          <SixAgentsOverview />
        </CardBody>
      </Card>

      {/* Conflict Alerts */}
      <ConflictAlerts />

      {/* Loading State */}
      {loading && (
        <Card>
          <CardBody className="p-12">
            <div className="flex flex-col items-center justify-center gap-4">
              <Spinner size="lg" color="primary" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Loading induction list...
              </p>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Error State */}
      {error && !loading && (
        <Card className="border-l-4 border-l-red-500">
          <CardBody className="p-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
              <div>
                <p className="font-semibold text-red-900 dark:text-red-100">Error</p>
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Induction List */}
      {data && !loading && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Ranked Induction List
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Generated for {formatDate(data.decisionDate)}
              </p>
            </div>
            <Chip variant="flat" color="primary">
              {data.trains.length} Trains
            </Chip>
          </div>

          <div className="space-y-4">
            {data.trains.length === 0 ? (
              <Card>
                <CardBody className="p-12 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full">
                      <AlertCircle className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 font-medium">
                      No induction decisions available for this date.
                    </p>
                  </div>
                </CardBody>
              </Card>
            ) : (
              data.trains.map((train, index) => {
                // Ensure unique key - combine trainId with index to prevent duplicates
                const uniqueKey = train.trainId 
                  ? `train-${train.trainId}-${index}` 
                  : `train-${index}-${train.trainNumber || 'unknown'}`;
                return (
                  <DecisionCard
                    key={uniqueKey}
                    train={train}
                    rank={index + 1}
                    onSelect={handleTrainSelect}
                  />
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
