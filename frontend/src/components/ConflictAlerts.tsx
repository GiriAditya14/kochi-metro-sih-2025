import { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader, Chip, Button } from '@heroui/react';
import { AlertTriangle } from 'lucide-react';
import { dashboardApi } from '../services/api';
import type { Conflict } from '../types';
import { formatDateTime } from '../lib/utils';

export default function ConflictAlerts() {
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'critical' | 'high'>('all');

  useEffect(() => {
    fetchConflicts();
  }, []);

  const fetchConflicts = async () => {
    try {
      const response = await dashboardApi.getConflicts();
      setConflicts(response.data.conflicts || []);
    } catch (err) {
      console.error('Error fetching conflicts:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredConflicts = conflicts.filter(
    (c) => filter === 'all' || c.severity === filter
  );

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'danger';
      case 'high':
        return 'warning';
      default:
        return 'default';
    }
  };

  if (loading || conflicts.length === 0) {
    return null;
  }

  return (
    <Card className="border-l-4 border-l-amber-500">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Conflict Alerts
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {conflicts.length} active conflict{conflicts.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <Chip size="sm" variant="flat" color="warning" className="font-semibold">
            {conflicts.length}
          </Chip>
        </div>
      </CardHeader>
      <CardBody className="pt-0">
        {/* Filter Buttons */}
        <div className="flex gap-2 mb-4">
          <Button
            size="sm"
            variant={filter === 'all' ? 'solid' : 'flat'}
            color={filter === 'all' ? 'primary' : 'default'}
            onPress={() => setFilter('all')}
            className="text-xs"
          >
            All ({conflicts.length})
          </Button>
          <Button
            size="sm"
            variant={filter === 'critical' ? 'solid' : 'flat'}
            color={filter === 'critical' ? 'danger' : 'default'}
            onPress={() => setFilter('critical')}
            className="text-xs"
          >
            Critical ({conflicts.filter(c => c.severity === 'critical').length})
          </Button>
          <Button
            size="sm"
            variant={filter === 'high' ? 'solid' : 'flat'}
            color={filter === 'high' ? 'warning' : 'default'}
            onPress={() => setFilter('high')}
            className="text-xs"
          >
            High ({conflicts.filter(c => c.severity === 'high').length})
          </Button>
        </div>

        {/* Conflicts List */}
        <div className="space-y-3">
          {filteredConflicts.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No {filter !== 'all' ? filter : ''} conflicts found.
              </p>
            </div>
          ) : (
            filteredConflicts.map((conflict) => (
              <div
                key={conflict.id}
                className="p-4 bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Chip
                        size="sm"
                        color={getSeverityColor(conflict.severity)}
                        variant="flat"
                        className="font-semibold"
                      >
                        {conflict.severity.toUpperCase()}
                      </Chip>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">
                        Train {conflict.trainNumber}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        • {conflict.conflictType}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                      {conflict.description}
                    </p>
                    {conflict.suggestedResolution && (
                      <div className="mt-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                        <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                          Suggested Resolution:
                        </p>
                        <p className="text-xs text-gray-700 dark:text-gray-300">
                          {conflict.suggestedResolution}
                        </p>
                      </div>
                    )}
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-3">
                      Detected: {formatDateTime(conflict.detectedAt)}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardBody>
    </Card>
  );
}
