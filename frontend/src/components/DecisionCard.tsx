import { useState } from 'react';
import { Card, CardBody, CardHeader, Chip, Button } from '@heroui/react';
import { ChevronDown, AlertCircle, CheckCircle2, Clock, Wrench, TrendingUp } from 'lucide-react';
import type { TrainDecision, ReasoningDetails } from '../types';
import { cn } from '../lib/utils';
import AgentBreakdown from './AgentBreakdown';

interface DecisionCardProps {
  train: TrainDecision;
  rank: number;
  onSelect?: (trainId: number) => void;
}

const actionColors = {
  revenue: 'success',
  standby: 'warning',
  maintenance: 'danger',
} as const;

const actionIcons = {
  revenue: CheckCircle2,
  standby: Clock,
  maintenance: Wrench,
};

export default function DecisionCard({ train, rank, onSelect }: DecisionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const ActionIcon = actionIcons[train.recommendedAction] || CheckCircle2;

  const getRankBadgeColor = () => {
    if (rank <= 3) return 'bg-gradient-to-br from-blue-500 to-blue-600';
    if (rank <= 10) return 'bg-gradient-to-br from-gray-500 to-gray-600';
    return 'bg-gradient-to-br from-gray-400 to-gray-500';
  };

  return (
    <Card className="w-full hover:shadow-lg transition-all duration-300 border border-gray-200 dark:border-gray-800">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-4 w-full">
          {/* Rank Badge */}
          <div className={cn(
            "flex items-center justify-center w-12 h-12 rounded-xl font-bold text-white shadow-lg shrink-0",
            getRankBadgeColor()
          )}>
            #{rank}
          </div>

          {/* Train Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Train {train.trainNumber}
              </h3>
              <Chip
                color={actionColors[train.recommendedAction] || 'default'}
                variant="flat"
                size="sm"
                startContent={ActionIcon && <ActionIcon className="h-3.5 w-3.5" />}
                className="font-semibold"
              >
                {train.recommendedAction?.toUpperCase() || 'UNKNOWN'}
              </Chip>
            </div>
            
            {/* Priority Score */}
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                    Priority Score
                  </span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {train.priorityScore.toFixed(1)}/100
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className={cn(
                      "h-2 rounded-full transition-all",
                      train.priorityScore >= 80 && "bg-gradient-to-r from-green-500 to-emerald-500",
                      train.priorityScore >= 60 && train.priorityScore < 80 && "bg-gradient-to-r from-yellow-500 to-amber-500",
                      train.priorityScore < 60 && "bg-gradient-to-r from-red-500 to-rose-500"
                    )}
                    style={{ width: `${train.priorityScore}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardBody className="pt-0">
        {/* Reasoning Summary */}
        {train.reasoning && (
          <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              {train.reasoning}
            </p>
          </div>
        )}

        {/* Conflicts */}
        {train.conflicts && train.conflicts.length > 0 && (
          <div className="mb-4 p-4 bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
              <span className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                {train.conflicts.length} Conflict{train.conflicts.length > 1 ? 's' : ''} Detected
              </span>
            </div>
            <ul className="space-y-1 ml-7">
              {train.conflicts.map((conflict, idx) => (
                <li key={conflict.id || `conflict-${idx}`} className="text-xs text-amber-800 dark:text-amber-200">
                  • {conflict.description}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Detailed Reasoning Toggle */}
        {train.reasoningDetails && (
          <div className="mb-4">
            <Button
              variant="light"
              size="sm"
              onPress={() => setIsExpanded(!isExpanded)}
              endContent={
                <ChevronDown className={cn(
                  "h-4 w-4 transition-transform duration-200",
                  isExpanded && "rotate-180"
                )} />
              }
              className="text-gray-700 dark:text-gray-300"
            >
              {isExpanded ? 'Hide' : 'Show'} Detailed Reasoning
            </Button>

            {isExpanded && train.reasoningDetails && (
              <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-200">
                <AgentBreakdown details={train.reasoningDetails} priorityScore={train.priorityScore} />
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        {onSelect && (
          <div className="flex gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
            <Button
              color="primary"
              variant="solid"
              onPress={() => onSelect(train.trainId)}
              className="flex-1"
            >
              View Full Details
            </Button>
          </div>
        )}
      </CardBody>
    </Card>
  );
}

