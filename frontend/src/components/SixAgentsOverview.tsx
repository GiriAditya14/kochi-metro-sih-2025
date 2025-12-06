import { Card, CardBody } from '@heroui/react';
import { 
  Shield, 
  ClipboardCheck, 
  Megaphone, 
  Gauge, 
  Sparkles, 
  MapPin
} from 'lucide-react';
import { cn } from '../lib/utils';

interface Agent {
  key: string;
  label: string;
  icon: any;
  description: string;
  color: string;
  bgGradient: string;
}

const agents: Agent[] = [
  {
    key: 'fitness',
    label: 'Fitness Certificate',
    icon: Shield,
    description: 'Rolling-Stock, Signalling & Telecom validation',
    color: 'blue',
    bgGradient: 'from-blue-500 to-blue-600',
  },
  {
    key: 'jobCards',
    label: 'Job Cards',
    icon: ClipboardCheck,
    description: 'Maximo work orders & maintenance tracking',
    color: 'purple',
    bgGradient: 'from-purple-500 to-purple-600',
  },
  {
    key: 'branding',
    label: 'Branding Priority',
    icon: Megaphone,
    description: 'Advertiser SLA compliance & exposure hours',
    color: 'orange',
    bgGradient: 'from-orange-500 to-orange-600',
  },
  {
    key: 'mileage',
    label: 'Mileage Balance',
    icon: Gauge,
    description: 'Wear distribution & usage equalization',
    color: 'green',
    bgGradient: 'from-green-500 to-green-600',
  },
  {
    key: 'cleaning',
    label: 'Cleaning Status',
    icon: Sparkles,
    description: 'Cleaning slots & bay availability',
    color: 'pink',
    bgGradient: 'from-pink-500 to-pink-600',
  },
  {
    key: 'stabling',
    label: 'Stabling Geometry',
    icon: MapPin,
    description: 'Depot positioning & shunting efficiency',
    color: 'indigo',
    bgGradient: 'from-indigo-500 to-indigo-600',
  },
];

export default function SixAgentsOverview() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            Six Specialized AI Agents
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Collaborative multi-agent system analyzing interdependent variables
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents.map((agent) => {
          const Icon = agent.icon;
          return (
            <Card
              key={agent.key}
              className={cn(
                "border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all cursor-pointer group",
                "hover:scale-105 hover:-translate-y-1"
              )}
            >
              <CardBody className="p-5">
                <div className="flex items-start gap-4">
                  <div className={cn(
                    "p-3 rounded-xl bg-gradient-to-br shadow-lg group-hover:shadow-xl transition-shadow",
                    `bg-gradient-to-br ${agent.bgGradient}`
                  )}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-base font-bold text-gray-900 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {agent.label}
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                      {agent.description}
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>
      <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <p className="text-sm text-gray-700 dark:text-gray-300">
          <span className="font-semibold">How it works:</span> All six agents analyze trains in parallel, 
          share insights via LangGraph orchestrator, resolve conflicts collaboratively, and generate 
          explainable decisions with composite priority scores.
        </p>
      </div>
    </div>
  );
}

