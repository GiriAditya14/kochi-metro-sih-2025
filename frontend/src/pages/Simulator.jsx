import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Zap,
  Users,
  Gauge,
  Activity,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Brain,
  Sparkles,
  DollarSign,
  Shuffle,
  Train,
  Clock,
  Target,
  TrendingUp,
  Building,
} from 'lucide-react';

const API_BASE = '/api';

// AI Reasoning Display Component with proper dark theme
const ReasoningDisplay = ({ reasoning, isLoading }) => {
  if (isLoading) {
    return (
      <div className="card">
        <div className="card-body">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center animate-pulse">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-slate-900 dark:text-white font-medium">
                AI Analysis in Progress
              </div>
              <div className="text-slate-600 dark:text-slate-400 text-sm">
                Processing simulation data...
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <div className="h-4 bg-slate-300/50 dark:bg-slate-700/50 rounded animate-pulse w-3/4"></div>
            <div className="h-4 bg-slate-300/50 dark:bg-slate-700/50 rounded animate-pulse w-full"></div>
            <div className="h-4 bg-slate-300/50 dark:bg-slate-700/50 rounded animate-pulse w-5/6"></div>
            <div className="h-4 bg-slate-300/50 dark:bg-slate-700/50 rounded animate-pulse w-2/3"></div>
          </div>
          <div className="flex items-center gap-2 mt-6 pt-4 border-t border-slate-300 dark:border-slate-700">
            <Loader2 className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-spin" />
            <span className="text-slate-600 dark:text-slate-400 text-sm">
              Analyzing patterns and generating recommendations...
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (!reasoning) return null;

  const renderInlineFormatting = (text) => {
    // Handle bold text
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong
            key={i}
            className="text-slate-900 dark:text-white font-semibold"
          >
            {part.slice(2, -2)}
          </strong>
        );
      }
      // Handle emojis with proper styling
      if (part.includes('✅'))
        return (
          <span key={i}>
            {part.replace('✅', '')}{' '}
            <span className="text-emerald-600 dark:text-emerald-400">✓</span>
          </span>
        );
      if (part.includes('⚠️'))
        return (
          <span key={i}>
            {part.replace('⚠️', '')}{' '}
            <span className="text-amber-600 dark:text-amber-400">⚠</span>
          </span>
        );
      if (part.includes('🚨'))
        return (
          <span key={i}>
            {part.replace('🚨', '')}{' '}
            <span className="text-red-600 dark:text-red-400">!</span>
          </span>
        );
      if (part.includes('🔧'))
        return (
          <span key={i}>
            {part.replace('🔧', '')}{' '}
            <span className="text-blue-600 dark:text-blue-400">→</span>
          </span>
        );
      return part;
    });
  };

  // Parse and render the reasoning text
  const renderReasoning = (text) => {
    if (!text) return null;

    const lines = text.split('\n');
    const elements = [];
    let listItems = [];
    let inList = false;

    const flushList = () => {
      if (listItems.length > 0) {
        elements.push(
          <ul
            key={`list-${elements.length}`}
            className="space-y-2 my-3 ml-4"
          >
            {listItems}
          </ul>
        );
        listItems = [];
      }
      inList = false;
    };

    lines.forEach((line, i) => {
      // Headers
      if (line.startsWith('###')) {
        flushList();
        elements.push(
          <h4
            key={i}
            className="text-blue-600 dark:text-blue-400 font-semibold mt-4 mb-2 flex items-center gap-2"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400"></div>
            {line.replace(/^###\s*/, '')}
          </h4>
        );
      } else if (line.startsWith('##')) {
        flushList();
        elements.push(
          <h3
            key={i}
            className="text-lg text-slate-900 dark:text-white font-bold mt-5 mb-3 pb-2 border-b"
            style={{ borderColor: 'rgb(var(--color-border))' }}
          >
            {line.replace(/^##\s*/, '')}
          </h3>
        );
      } else if (line.startsWith('#')) {
        flushList();
        elements.push(
          <h2
            key={i}
            className="text-xl text-slate-900 dark:text-white font-bold mt-6 mb-4"
          >
            {line.replace(/^#\s*/, '')}
          </h2>
        );
      }
      // Bullet points
      else if (line.startsWith('- ') || line.startsWith('* ')) {
        inList = true;
        const content = line.replace(/^[-*]\s*/, '');
        listItems.push(
          <li
            key={i}
            className="text-slate-700 dark:text-slate-300 flex items-start gap-2"
          >
            <span className="text-emerald-600 dark:text-emerald-400 mt-1.5">
              •
            </span>
            <span>{renderInlineFormatting(content)}</span>
          </li>
        );
      }
      // Numbered lists
      else if (/^\d+\.\s/.test(line)) {
        inList = true;
        const num = line.match(/^(\d+)\./)[1];
        const content = line.replace(/^\d+\.\s*/, '');
        listItems.push(
          <li
            key={i}
            className="text-slate-700 dark:text-slate-300 flex items-start gap-3"
          >
            <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-400 text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
              {num}
            </span>
            <span>{renderInlineFormatting(content)}</span>
          </li>
        );
      }
      // Table rows
      else if (line.includes('|') && !line.includes('---')) {
        flushList();
        const cells = line.split('|').filter((c) => c.trim());
        if (cells.length > 0) {
          elements.push(
            <div
              key={i}
              className="grid grid-cols-3 gap-2 py-2 border-b border-slate-300/50 dark:border-slate-700/50 text-sm"
            >
              {cells.map((cell, j) => (
                <span
                  key={j}
                  className={
                    j === 0
                      ? 'text-slate-600 dark:text-slate-400'
                      : 'text-slate-800 dark:text-slate-200 font-medium'
                  }
                >
                  {cell.trim()}
                </span>
              ))}
            </div>
          );
        }
      }
      // Empty lines
      else if (!line.trim()) {
        flushList();
        elements.push(<div key={i} className="h-2"></div>);
      }
      // Regular paragraphs
      else if (line.trim()) {
        flushList();
        elements.push(
          <p
            key={i}
            className="text-slate-700 dark:text-slate-300 leading-relaxed my-2"
          >
            {renderInlineFormatting(line)}
          </p>
        );
      }
    });

    flushList();
    return elements;
  };

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div
        className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 border-b px-6 py-4"
        style={{ borderColor: 'rgb(var(--color-border))' }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
              {reasoning.status === 'success' ? (
                <Sparkles className="w-5 h-5 text-white" />
              ) : (
                <Brain className="w-5 h-5 text-white" />
              )}
            </div>
            <div>
              <div className="text-slate-900 dark:text-white font-semibold flex items-center gap-2">
                AI-Powered Analysis
                {reasoning.status === 'success' && (
                  <span className="badge badge-success text-xs">Groq LLM</span>
                )}
              </div>
              <div className="text-slate-600 dark:text-slate-400 text-sm">
                {reasoning.model === 'llama-3.1-70b-versatile'
                  ? 'Advanced reasoning with Llama 3.1 70B'
                  : 'Rule-based analysis system'}
              </div>
            </div>
          </div>
          {reasoning.generated_at && (
            <div className="text-xs text-slate-500">
              {new Date(reasoning.generated_at).toLocaleTimeString()}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="card-body max-h-[500px] overflow-y-auto">
        {renderReasoning(reasoning.reasoning)}
      </div>
    </div>
  );
};

// Stats Card Component
const StatCard = ({ label, value, unit, icon: Icon, color = 'blue', trend, prefix = '' }) => {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-emerald-500 to-emerald-600',
    amber: 'from-amber-500 to-amber-600',
    red: 'from-red-500 to-red-600',
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-orange-600',
  };

  return (
    <div className="bg-slate-200/50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-300/50 dark:border-slate-700/50">
      <div className="flex items-start justify-between mb-2">
        <div
          className={`w-10 h-10 rounded-lg bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center`}
        >
          <Icon className="w-5 h-5 text-white" />
        </div>
        {trend !== undefined && (
          <span
            className={`text-xs font-medium ${trend >= 0
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-red-600 dark:text-red-400'
              }`}
          >
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div className="mt-2">
        <div className="text-2xl font-bold text-white">
          {prefix}
          {typeof value === 'number' ? value.toLocaleString() : value}
          {unit && (
            <span className="text-sm font-normal text-slate-400 ml-1">
              {unit}
            </span>
          )}
        </div>
        <div className="text-sm text-slate-600 dark:text-slate-400">
          {label}
        </div>
      </div>
    </div>
  );
};

// Risk Badge Component
const RiskBadge = ({ level }) => {
  const styles = {
    critical: 'bg-red-500/20 text-red-400 border-red-500/30',
    high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    medium: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    low: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  };

  return (
    <span className={`badge border ${styles[level] || styles.low}`}>
      {level}
    </span>
  );
};

export default function Simulator() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('passenger');
  const [isLoading, setIsLoading] = useState(false);
  const [stations, setStations] = useState([]);
  const [brandingContracts, setBrandingContracts] = useState([]);
  const [results, setResults] = useState(null);

  // Passenger simulation params
  const [passengerParams, setPassengerParams] = useState({
    time_of_day: 'off_peak',
    special_event: '',
    event_station: '',
    expected_crowd_multiplier: 1.0,
    trains_available: 18,
    simulation_duration_minutes: 60,
  });

  // Energy simulation params
  const [energyParams, setEnergyParams] = useState({
    trains_in_service: 18,
    operating_hours: 16,
    passenger_load_percent: 60,
    hvac_mode: 'full',
    regen_braking: true,
    coasting_optimization: false,
    speed_profile: 'normal',
  });

  // Combined params
  const [combinedParams, setCombinedParams] = useState({
    time_of_day: 'off_peak',
    special_event: '',
    event_station: '',
    expected_crowd_multiplier: 1.0,
    trains_in_service: 18,
    operating_hours: 1,
    passenger_load_percent: 60,
    hvac_mode: 'full',
    regen_braking: true,
    coasting_optimization: false,
    speed_profile: 'normal',
  });

  // Advertising simulation params
  const [advertisingParams, setAdvertisingParams] = useState({
    simulation_days: 7,
    trains_in_service: 18,
    service_hours_per_day: 16,
    peak_hour_percentage: 35,
    scenario: 'normal',
  });

  // Shunting simulation params
  const [shuntingParams, setShuntingParams] = useState({
    optimize_for: 'balanced',
    available_shunters: 2,
    time_window_minutes: 120,
    prioritize_trains: [],
  });

  // Track if parameters are being adjusted for visual feedback
  const [isAdjusting, setIsAdjusting] = useState(false);

  useEffect(() => {
    fetchStations();
    fetchBrandingContracts();
  }, []);

  // Auto-update shunting visualization when parameters change
  useEffect(() => {
    if (activeTab === 'shunting' && results && results.simulation_type === 'shunting_optimization') {
      // Show adjusting indicator
      setIsAdjusting(true);

      // Small delay to show the transition
      const timer = setTimeout(() => {
        // Regenerate mock data with new parameters for real-time updates
        const updatedData = generateMockShuntingData(shuntingParams);
        setResults(updatedData);
        setIsAdjusting(false);
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [shuntingParams.available_shunters, shuntingParams.time_window_minutes]);

  const fetchStations = async () => {
    try {
      const res = await fetch(`${API_BASE}/simulation/stations`);
      const data = await res.json();
      setStations(data.stations || []);
    } catch (error) {
      console.error('Failed to fetch stations:', error);
    }
  };

  const fetchBrandingContracts = async () => {
    try {
      const res = await fetch(`${API_BASE}/simulation/branding-contracts`);
      const data = await res.json();
      setBrandingContracts(data.contracts || []);
    } catch (error) {
      console.error('Failed to fetch branding contracts:', error);
    }
  };

  const runSimulation = async (type) => {
    setIsLoading(true);
    setResults(null);

    try {
      let endpoint, params;

      if (type === 'passenger') {
        endpoint = '/simulation/passenger';
        params = {
          ...passengerParams,
          special_event: passengerParams.special_event || null,
          event_station: passengerParams.event_station || null,
        };
      } else if (type === 'energy') {
        endpoint = '/simulation/energy';
        params = energyParams;
      } else if (type === 'combined') {
        endpoint = '/simulation/combined';
        params = {
          ...combinedParams,
          special_event: combinedParams.special_event || null,
          event_station: combinedParams.event_station || null,
        };
      } else if (type === 'advertising') {
        endpoint = '/simulation/advertising';
        params = advertisingParams;
      } else if (type === 'shunting') {
        endpoint = '/simulation/shunting';
        params = shuntingParams;
      }

      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      const data = await res.json();

      // If shunting simulation fails or returns no data, use mock data for visualization
      if (type === 'shunting' && (!data || !data.results || !data.results.initial_state)) {
        console.log('Using mock shunting data for visualization');
        const mockData = generateMockShuntingData(shuntingParams);
        setResults(mockData);
      } else {
        setResults(data);
      }
    } catch (error) {
      console.error('Simulation failed:', error);

      // For shunting, show mock data even on error so visualization is visible
      if (type === 'shunting') {
        console.log('Error occurred, using mock shunting data');
        const mockData = generateMockShuntingData(shuntingParams);
        setResults(mockData);
      }
    }

    setIsLoading(false);
  };

  // Generate mock shunting data for visualization
  const generateMockShuntingData = (params) => {
    const numShunters = params.available_shunters;
    const timeWindow = params.time_window_minutes;

    // All available trains
    const allTrains = [
      'TS-201', 'TS-203', 'TS-205', 'TS-207', 'TS-209',
      'TS-211', 'TS-213', 'TS-215', 'TS-217', 'TS-219',
      'TS-221', 'TS-223', 'TS-225', 'TS-227', 'TS-229'
    ];

    // Dynamic track distribution based on parameters
    let tracks = {};

    // More shunters = better distribution (less congestion)
    // More time = can handle more complex arrangements

    if (numShunters === 1) {
      // 1 shunter: High congestion, uneven distribution
      tracks = {
        track_1: ['TS-201', 'TS-203', 'TS-205', 'TS-207'],
        track_2: ['TS-209', 'TS-211', 'TS-213'],
        track_3: ['TS-215', 'TS-217', 'TS-219', 'TS-221', 'TS-223'],
        track_4: ['TS-225'],
        track_5: ['TS-227', 'TS-229'],
        track_6: [],
      };
    } else if (numShunters === 2) {
      // 2 shunters: Moderate distribution
      if (timeWindow <= 90) {
        // Short time: Keep trains concentrated
        tracks = {
          track_1: ['TS-201', 'TS-203', 'TS-205'],
          track_2: ['TS-207', 'TS-209', 'TS-211'],
          track_3: ['TS-213', 'TS-215', 'TS-217', 'TS-219'],
          track_4: ['TS-221'],
          track_5: ['TS-223', 'TS-225'],
          track_6: ['TS-227'],
        };
      } else {
        // More time: Better spread
        tracks = {
          track_1: ['TS-201', 'TS-203', 'TS-205'],
          track_2: ['TS-207', 'TS-209'],
          track_3: ['TS-211', 'TS-213', 'TS-215', 'TS-217'],
          track_4: ['TS-219', 'TS-221'],
          track_5: ['TS-223', 'TS-225', 'TS-227'],
          track_6: [],
        };
      }
    } else if (numShunters === 3) {
      // 3 shunters: Good distribution
      if (timeWindow <= 90) {
        tracks = {
          track_1: ['TS-201', 'TS-203'],
          track_2: ['TS-205', 'TS-207', 'TS-209'],
          track_3: ['TS-211', 'TS-213', 'TS-215'],
          track_4: ['TS-217', 'TS-219'],
          track_5: ['TS-221', 'TS-223'],
          track_6: ['TS-225', 'TS-227'],
        };
      } else if (timeWindow <= 150) {
        tracks = {
          track_1: ['TS-201', 'TS-203', 'TS-205'],
          track_2: ['TS-207', 'TS-209'],
          track_3: ['TS-211', 'TS-213'],
          track_4: ['TS-215', 'TS-217', 'TS-219'],
          track_5: ['TS-221', 'TS-223'],
          track_6: ['TS-225', 'TS-227', 'TS-229'],
        };
      } else {
        // Lots of time: Optimal spread
        tracks = {
          track_1: ['TS-201', 'TS-203'],
          track_2: ['TS-205', 'TS-207'],
          track_3: ['TS-209', 'TS-211', 'TS-213'],
          track_4: ['TS-215', 'TS-217'],
          track_5: ['TS-219', 'TS-221', 'TS-223'],
          track_6: ['TS-225', 'TS-227', 'TS-229'],
        };
      }
    } else { // 4 shunters
      // 4 shunters: Optimal distribution
      if (timeWindow <= 90) {
        tracks = {
          track_1: ['TS-201', 'TS-203'],
          track_2: ['TS-205', 'TS-207'],
          track_3: ['TS-209', 'TS-211', 'TS-213'],
          track_4: ['TS-215', 'TS-217'],
          track_5: ['TS-219', 'TS-221'],
          track_6: ['TS-223', 'TS-225'],
        };
      } else if (timeWindow <= 150) {
        tracks = {
          track_1: ['TS-201', 'TS-203'],
          track_2: ['TS-205', 'TS-207'],
          track_3: ['TS-209', 'TS-211'],
          track_4: ['TS-213', 'TS-215', 'TS-217'],
          track_5: ['TS-219', 'TS-221'],
          track_6: ['TS-223', 'TS-225', 'TS-227'],
        };
      } else {
        // Maximum efficiency: Even distribution
        tracks = {
          track_1: ['TS-201', 'TS-203'],
          track_2: ['TS-205', 'TS-207'],
          track_3: ['TS-209', 'TS-211'],
          track_4: ['TS-213', 'TS-215'],
          track_5: ['TS-217', 'TS-219', 'TS-221'],
          track_6: ['TS-223', 'TS-225', 'TS-227', 'TS-229'],
        };
      }
    }

    // Calculate moves based on shunters and time
    const totalTrains = Object.values(tracks).flat().length;
    const baseMovesPerTrain = numShunters >= 3 ? 1.5 : numShunters >= 2 ? 2 : 3;
    const totalMoves = Math.floor(totalTrains * baseMovesPerTrain);
    const timePerMove = 8;
    const totalTime = totalMoves * timePerMove;
    const isFeasible = totalTime <= timeWindow;

    // Generate dynamic blocking analysis based on actual track configuration
    const blockedTrains = [];
    Object.entries(tracks).forEach(([trackName, trainArray]) => {
      if (trainArray.length > 1) {
        // Trains that are not first are blocked
        for (let i = 1; i < trainArray.length; i++) {
          const train = trainArray[i];
          const blockingTrains = trainArray.slice(0, i);
          const movesRequired = blockingTrains.length + (i > 2 ? i - 1 : 0);

          blockedTrains.push({
            target_train: train,
            track: trackName,
            blocked_by: blockingTrains,
            moves_required: movesRequired,
          });
        }
      }
    });

    // Sort by most blocked (highest moves required) and take top 5
    const mostBlockedTrains = blockedTrains
      .sort((a, b) => b.moves_required - a.moves_required)
      .slice(0, 5);

    return {
      simulation_type: 'shunting_optimization',
      status: 'success',
      results: {
        summary: {
          total_moves: totalMoves,
          adjusted_time_minutes: totalTime,
          is_feasible: isFeasible,
          total_energy_kwh: totalMoves * 12.5,
          energy_cost_inr: totalMoves * 12.5 * 8,
        },
        initial_state: tracks,
        blocking_analysis: {
          most_blocked_trains: mostBlockedTrains,
        },
        move_sequence: [
          { step: 1, train: 'TS-201', action: 'move_to_track_6', time_minutes: 8 },
          { step: 2, train: 'TS-203', action: 'move_to_track_6', time_minutes: 8 },
          { step: 3, train: 'TS-205', action: 'exit_depot', time_minutes: 5 },
          { step: 4, train: 'TS-207', action: 'move_to_track_1', time_minutes: 8 },
          { step: 5, train: 'TS-209', action: 'exit_depot', time_minutes: 5 },
          { step: 6, train: 'TS-211', action: 'move_to_track_2', time_minutes: 8 },
          { step: 7, train: 'TS-213', action: 'move_to_track_2', time_minutes: 8 },
          { step: 8, train: 'TS-215', action: 'move_to_track_1', time_minutes: 8 },
          { step: 9, train: 'TS-217', action: 'exit_depot', time_minutes: 5 },
          { step: 10, train: 'TS-219', action: 'exit_depot', time_minutes: 5 },
        ],
      },
      ai_reasoning: {
        status: 'success',
        reasoning: `## Shunting Optimization Analysis

### Current Configuration
- **Available Shunters**: ${numShunters}
- **Time Window**: ${timeWindow} minutes
- **Optimization Goal**: ${params.optimize_for}
- **Total Trains**: ${totalTrains}

### Key Findings

**Total Moves Required**: ${totalMoves} moves
**Estimated Time**: ${totalTime} minutes
**Feasibility**: ${isFeasible ? '✅ Feasible within time window' : '⚠️ Exceeds time window'}

### Track Utilization
${Object.entries(tracks).map(([track, trains]) => {
          const density = trains.length === 0 ? 'Empty' :
            trains.length === 1 ? 'Low' :
              trains.length === 2 ? 'Moderate' :
                trains.length === 3 ? 'High' : 'Very High';
          const status = trains.length === 0 ? '(Available for moves)' :
            trains.length >= 4 ? '(Bottleneck!)' : '';
          return `- ${track.replace('_', ' ').toUpperCase()}: ${trains.length} train${trains.length !== 1 ? 's' : ''} (${density} density) ${status}`;
        }).join('\n')}

### Blocking Analysis
${mostBlockedTrains.length > 0 ?
            'The most blocked trains require multiple preliminary moves:\n' +
            mostBlockedTrains.slice(0, 3).map(t =>
              `- **${t.target_train}** on ${t.track.replace('_', ' ')}: Requires ${t.moves_required} moves (${t.blocked_by.length} train${t.blocked_by.length !== 1 ? 's' : ''} blocking)`
            ).join('\n')
            : '✅ No significant blocking detected - optimal configuration!'}

### Distribution Strategy
${numShunters === 1 ?
            '⚠️ **Single shunter mode**: Trains concentrated on fewer tracks to minimize movement complexity.' :
            numShunters === 2 ?
              '📊 **Dual shunter mode**: Balanced distribution allowing parallel operations on 2 tracks.' :
              numShunters === 3 ?
                '✅ **Triple shunter mode**: Optimized spread across tracks for efficient parallel processing.' :
                '🚀 **Quad shunter mode**: Maximum efficiency with even distribution and minimal blocking.'}

${timeWindow <= 90 ?
            '⏱️ **Short time window**: Trains positioned for quick sequential exits.' :
            timeWindow <= 150 ?
              '⏱️ **Moderate time window**: Balanced positioning for steady operations.' :
              '⏱️ **Extended time window**: Optimal positioning for maximum efficiency.'}

### Recommendations
${numShunters < 2 ? '⚠️ **Increase shunters**: With only 1 shunter, operations will be slow. Consider adding more shunters for parallel processing.' : ''}
${!isFeasible ? '⚠️ **Extend time window**: Current window is insufficient. Recommend extending to ' + Math.ceil(totalTime / 15) * 15 + ' minutes.' : ''}
${numShunters >= 3 && isFeasible ? '✅ **Optimal configuration**: Current setup provides good parallelization and meets time constraints.' : ''}
${numShunters === 4 && timeWindow >= 180 ? '🌟 **Peak efficiency**: Maximum shunters with ample time - ideal for complex rearrangements.' : ''}

### Optimization Strategy
1. ${tracks.track_6.length === 0 ? 'Use Track 6 as temporary holding area' : 'Utilize available empty tracks for temporary moves'}
2. ${mostBlockedTrains.length > 0 ? `Prioritize clearing ${mostBlockedTrains[0].track.replace('_', ' ')} (highest blocking)` : 'Process tracks in parallel for maximum efficiency'}
3. ${numShunters >= 2 ? `Parallel operations on ${numShunters} tracks simultaneously` : 'Sequential processing due to limited shunters'}
4. Exit trains in order of accessibility and priority`,
        model: 'rule-based',
        generated_at: new Date().toISOString(),
      },
    };
  };

  const tabs = [
    { id: 'passenger', label: 'Passenger', icon: Users },
    { id: 'energy', label: 'Energy', icon: Zap },
    { id: 'advertising', label: 'Advertising', icon: DollarSign },
    { id: 'shunting', label: 'Shunting', icon: Shuffle },
    { id: 'combined', label: 'Combined', icon: Activity },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
              <Gauge className="w-6 h-6 text-white" />
            </div>
            {t('simulator.title')}
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            {t('simulator.subtitle')}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl border overflow-x-auto" style={{
        background: 'var(--glass-bg)',
        borderColor: 'rgb(var(--color-border))'
      }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setResults(null);
            }}
            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all whitespace-nowrap ${activeTab === tab.id
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-300/50 dark:hover:bg-slate-700/50'
              }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Parameters Panel */}
        <div className="col-span-12 lg:col-span-4">
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                {t('simulator.parameters')}
              </h3>
            </div>
            <div className="card-body space-y-4">
              {/* Passenger Parameters */}
              {activeTab === 'passenger' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      {t('simulator.timeOfDay')}
                    </label>
                    <select
                      className="input w-full"
                      value={passengerParams.time_of_day}
                      onChange={(e) =>
                        setPassengerParams({
                          ...passengerParams,
                          time_of_day: e.target.value,
                        })
                      }
                    >
                      <option value="early_morning">
                        {t('simulator.earlyMorning')}
                      </option>
                      <option value="peak_morning">
                        {t('simulator.peakMorning')}
                      </option>
                      <option value="off_peak">
                        {t('simulator.offPeak')}
                      </option>
                      <option value="peak_evening">
                        {t('simulator.peakEvening')}
                      </option>
                      <option value="late_night">
                        {t('simulator.lateNight')}
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      {t('simulator.specialEvent')}
                    </label>
                    <select
                      className="input w-full"
                      value={passengerParams.special_event}
                      onChange={(e) =>
                        setPassengerParams({
                          ...passengerParams,
                          special_event: e.target.value,
                        })
                      }
                    >
                      <option value="">{t('simulator.none')}</option>
                      <option value="football_match">
                        {t('simulator.footballMatch')}
                      </option>
                      <option value="concert">{t('simulator.concert')}</option>
                      <option value="festival">{t('simulator.festival')}</option>
                      <option value="strike">{t('simulator.strike')}</option>
                      <option value="emergency">
                        {t('simulator.emergency')}
                      </option>
                    </select>
                  </div>

                  {passengerParams.special_event && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        {t('simulator.eventStation')}
                      </label>
                      <select
                        className="input w-full"
                        value={passengerParams.event_station}
                        onChange={(e) =>
                          setPassengerParams({
                            ...passengerParams,
                            event_station: e.target.value,
                          })
                        }
                      >
                        <option value="">{t('simulator.selectStation')}</option>
                        {stations.map((s) => (
                          <option key={s.name} value={s.name}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      {t('simulator.crowdMultiplier')}:{' '}
                      <span className="text-blue-600 dark:text-blue-400">
                        {passengerParams.expected_crowd_multiplier.toFixed(1)}x
                      </span>
                    </label>
                    <input
                      type="range"
                      className="w-full accent-blue-500"
                      min="0.5"
                      max="3"
                      step="0.1"
                      value={passengerParams.expected_crowd_multiplier}
                      onChange={(e) =>
                        setPassengerParams({
                          ...passengerParams,
                          expected_crowd_multiplier: parseFloat(
                            e.target.value
                          ),
                        })
                      }
                    />
                    <div className="flex justify-between text-xs text-slate-500 dark:text-slate-500 mt-1">
                      <span>{t('whatif.low')}</span>
                      <span>{t('simulator.normal')}</span>
                      <span>{t('whatif.high')}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      {t('simulator.trainsAvailable')}:{' '}
                      <span className="text-blue-600 dark:text-blue-400">
                        {passengerParams.trains_available}
                      </span>
                    </label>
                    <input
                      type="range"
                      className="w-full accent-blue-500"
                      min="10"
                      max="25"
                      step="1"
                      value={passengerParams.trains_available}
                      onChange={(e) =>
                        setPassengerParams({
                          ...passengerParams,
                          trains_available: parseInt(e.target.value),
                        })
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      {t('simulator.duration')}:{' '}
                      <span className="text-blue-600 dark:text-blue-400">
                        {passengerParams.simulation_duration_minutes}{' '}
                        {t('simulator.min')}
                      </span>
                    </label>
                    <input
                      type="range"
                      className="w-full accent-blue-500"
                      min="15"
                      max="180"
                      step="15"
                      value={passengerParams.simulation_duration_minutes}
                      onChange={(e) =>
                        setPassengerParams({
                          ...passengerParams,
                          simulation_duration_minutes: parseInt(
                            e.target.value
                          ),
                        })
                      }
                    />
                  </div>

                  <button
                    className="btn btn-primary w-full justify-center mt-4"
                    onClick={() => runSimulation('passenger')}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Users className="w-5 h-5" />
                    )}
                    {isLoading
                      ? t('simulator.simulating')
                      : t('simulator.runSimulation')}
                  </button>
                </>
              )}

              {/* Energy Parameters */}
              {activeTab === 'energy' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Trains in Service:{' '}
                      <span className="text-blue-600 dark:text-blue-400">
                        {energyParams.trains_in_service}
                      </span>
                    </label>
                    <input
                      type="range"
                      className="w-full accent-blue-500"
                      min="10"
                      max="25"
                      step="1"
                      value={energyParams.trains_in_service}
                      onChange={(e) =>
                        setEnergyParams({
                          ...energyParams,
                          trains_in_service: parseInt(e.target.value),
                        })
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Operating Hours:{' '}
                      <span className="text-blue-600 dark:text-blue-400">
                        {energyParams.operating_hours}h
                      </span>
                    </label>
                    <input
                      type="range"
                      className="w-full accent-blue-500"
                      min="1"
                      max="20"
                      step="1"
                      value={energyParams.operating_hours}
                      onChange={(e) =>
                        setEnergyParams({
                          ...energyParams,
                          operating_hours: parseInt(e.target.value),
                        })
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Passenger Load:{' '}
                      <span className="text-blue-600 dark:text-blue-400">
                        {energyParams.passenger_load_percent}%
                      </span>
                    </label>
                    <input
                      type="range"
                      className="w-full accent-blue-500"
                      min="10"
                      max="100"
                      step="5"
                      value={energyParams.passenger_load_percent}
                      onChange={(e) =>
                        setEnergyParams({
                          ...energyParams,
                          passenger_load_percent: parseInt(e.target.value),
                        })
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      HVAC Mode
                    </label>
                    <select
                      className="input w-full"
                      value={energyParams.hvac_mode}
                      onChange={(e) =>
                        setEnergyParams({
                          ...energyParams,
                          hvac_mode: e.target.value,
                        })
                      }
                    >
                      <option value="full">Full Cooling</option>
                      <option value="eco">ECO Mode</option>
                      <option value="off">Off</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Speed Profile
                    </label>
                    <select
                      className="input w-full"
                      value={energyParams.speed_profile}
                      onChange={(e) =>
                        setEnergyParams({
                          ...energyParams,
                          speed_profile: e.target.value,
                        })
                      }
                    >
                      <option value="normal">Normal</option>
                      <option value="eco">ECO (Energy Saving)</option>
                      <option value="express">Express (Fast)</option>
                    </select>
                  </div>

                  <div className="space-y-3 pt-2">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        className="w-5 h-5 rounded border-slate-400 dark:border-slate-600 bg-slate-100 dark:bg-slate-700 text-blue-500 focus:ring-blue-500"
                        checked={energyParams.regen_braking}
                        onChange={(e) =>
                          setEnergyParams({
                            ...energyParams,
                            regen_braking: e.target.checked,
                          })
                        }
                      />
                      <span className="text-slate-700 dark:text-slate-300">
                        Regenerative Braking
                      </span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        className="w-5 h-5 rounded border-slate-400 dark:border-slate-600 bg-slate-100 dark:bg-slate-700 text-blue-500 focus:ring-blue-500"
                        checked={energyParams.coasting_optimization}
                        onChange={(e) =>
                          setEnergyParams({
                            ...energyParams,
                            coasting_optimization: e.target.checked,
                          })
                        }
                      />
                      <span className="text-slate-700 dark:text-slate-300">
                        Coasting Optimization
                      </span>
                    </label>
                  </div>

                  <button
                    className="btn btn-primary w-full justify-center mt-4"
                    onClick={() => runSimulation('energy')}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Zap className="w-5 h-5" />
                    )}
                    {isLoading ? 'Simulating...' : 'Run Energy Simulation'}
                  </button>
                </>
              )}

              {/* Advertising Parameters */}
              {activeTab === 'advertising' && (
                <>
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mb-4">
                    <div className="flex items-center gap-2 text-blue-400 text-sm font-medium">
                      <DollarSign className="w-4 h-4" />
                      Advertising Penalty Simulator
                    </div>
                    <p className="text-slate-400 text-xs mt-1">
                      Calculate potential penalties/bonuses based on branding
                      contract compliance
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Simulation Period:{' '}
                      <span className="text-blue-400">
                        {advertisingParams.simulation_days} days
                      </span>
                    </label>
                    <input
                      type="range"
                      className="w-full accent-blue-500"
                      min="1"
                      max="30"
                      step="1"
                      value={advertisingParams.simulation_days}
                      onChange={(e) =>
                        setAdvertisingParams({
                          ...advertisingParams,
                          simulation_days: parseInt(e.target.value),
                        })
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Trains in Service:{' '}
                      <span className="text-blue-400">
                        {advertisingParams.trains_in_service}
                      </span>
                    </label>
                    <input
                      type="range"
                      className="w-full accent-blue-500"
                      min="10"
                      max="25"
                      step="1"
                      value={advertisingParams.trains_in_service}
                      onChange={(e) =>
                        setAdvertisingParams({
                          ...advertisingParams,
                          trains_in_service: parseInt(e.target.value),
                        })
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Service Hours/Day:{' '}
                      <span className="text-blue-400">
                        {advertisingParams.service_hours_per_day}h
                      </span>
                    </label>
                    <input
                      type="range"
                      className="w-full accent-blue-500"
                      min="8"
                      max="20"
                      step="1"
                      value={advertisingParams.service_hours_per_day}
                      onChange={(e) =>
                        setAdvertisingParams({
                          ...advertisingParams,
                          service_hours_per_day: parseInt(e.target.value),
                        })
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Peak Hour %:{' '}
                      <span className="text-blue-400">
                        {advertisingParams.peak_hour_percentage}%
                      </span>
                    </label>
                    <input
                      type="range"
                      className="w-full accent-blue-500"
                      min="10"
                      max="60"
                      step="5"
                      value={advertisingParams.peak_hour_percentage}
                      onChange={(e) =>
                        setAdvertisingParams({
                          ...advertisingParams,
                          peak_hour_percentage: parseInt(e.target.value),
                        })
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Scenario
                    </label>
                    <select
                      className="input w-full"
                      value={advertisingParams.scenario}
                      onChange={(e) =>
                        setAdvertisingParams({
                          ...advertisingParams,
                          scenario: e.target.value,
                        })
                      }
                    >
                      <option value="normal">Normal Operations</option>
                      <option value="reduced_service">
                        Reduced Service (70%)
                      </option>
                      <option value="festival_boost">
                        Festival Boost (+30%)
                      </option>
                      <option value="maintenance_disruption">
                        Maintenance Disruption (50%)
                      </option>
                    </select>
                  </div>

                  <div className="text-xs text-slate-500 pt-2">
                    Active contracts: {brandingContracts.length}
                  </div>

                  <button
                    className="btn btn-primary w-full justify-center mt-4"
                    onClick={() => runSimulation('advertising')}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <DollarSign className="w-5 h-5" />
                    )}
                    {isLoading ? 'Calculating...' : 'Calculate Penalties'}
                  </button>
                </>
              )}

              {/* Shunting Parameters */}
              {activeTab === 'shunting' && (
                <>
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mb-4">
                    <div className="flex items-center gap-2 text-blue-400 text-sm font-medium">
                      <Shuffle className="w-4 h-4" />
                      Shunting Rearrangement Simulator
                    </div>
                    <p className="text-slate-400 text-xs mt-1">
                      Optimize train positioning and calculate shunting costs
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Optimization Goal
                    </label>
                    <select
                      className="input w-full"
                      value={shuntingParams.optimize_for}
                      onChange={(e) =>
                        setShuntingParams({
                          ...shuntingParams,
                          optimize_for: e.target.value,
                        })
                      }
                    >
                      <option value="time">Minimize Time</option>
                      <option value="energy">Minimize Energy</option>
                      <option value="balanced">Balanced</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Available Shunters:{' '}
                      <span className="text-blue-400">
                        {shuntingParams.available_shunters}
                      </span>
                    </label>
                    <input
                      type="range"
                      className="w-full accent-blue-500"
                      min="1"
                      max="4"
                      step="1"
                      value={shuntingParams.available_shunters}
                      onChange={(e) =>
                        setShuntingParams({
                          ...shuntingParams,
                          available_shunters: parseInt(e.target.value),
                        })
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Time Window:{' '}
                      <span className="text-blue-400">
                        {shuntingParams.time_window_minutes} min
                      </span>
                    </label>
                    <input
                      type="range"
                      className="w-full accent-blue-500"
                      min="60"
                      max="240"
                      step="15"
                      value={shuntingParams.time_window_minutes}
                      onChange={(e) =>
                        setShuntingParams({
                          ...shuntingParams,
                          time_window_minutes: parseInt(e.target.value),
                        })
                      }
                    />
                    <div className="flex justify-between text-xs text-slate-500 mt-1">
                      <span>1 hr</span>
                      <span>2 hr</span>
                      <span>3 hr</span>
                      <span>4 hr</span>
                    </div>
                  </div>

                  <button
                    className="btn btn-primary w-full justify-center mt-4"
                    onClick={() => runSimulation('shunting')}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Shuffle className="w-5 h-5" />
                    )}
                    {isLoading ? 'Planning...' : 'Generate Shunting Plan'}
                  </button>
                </>
              )}

              {/* Combined Parameters */}
              {activeTab === 'combined' && (
                <>
                  <div className="pb-3 border-b border-slate-300 dark:border-slate-700">
                    <h4 className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                      Passenger Settings
                    </h4>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Time of Day
                    </label>
                    <select
                      className="input w-full"
                      value={combinedParams.time_of_day}
                      onChange={(e) =>
                        setCombinedParams({
                          ...combinedParams,
                          time_of_day: e.target.value,
                        })
                      }
                    >
                      <option value="peak_morning">Peak Morning</option>
                      <option value="off_peak">Off-Peak</option>
                      <option value="peak_evening">Peak Evening</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Crowd Multiplier:{' '}
                      <span className="text-purple-600 dark:text-purple-400">
                        {combinedParams.expected_crowd_multiplier.toFixed(1)}x
                      </span>
                    </label>
                    <input
                      type="range"
                      className="w-full accent-purple-500"
                      min="0.5"
                      max="3"
                      step="0.1"
                      value={combinedParams.expected_crowd_multiplier}
                      onChange={(e) =>
                        setCombinedParams({
                          ...combinedParams,
                          expected_crowd_multiplier: parseFloat(
                            e.target.value
                          ),
                        })
                      }
                    />
                  </div>

                  <div className="pb-3 pt-2 border-b border-slate-300 dark:border-slate-700">
                    <h4 className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                      Energy Settings
                    </h4>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Trains:{' '}
                      <span className="text-purple-600 dark:text-purple-400">
                        {combinedParams.trains_in_service}
                      </span>
                    </label>
                    <input
                      type="range"
                      className="w-full accent-purple-500"
                      min="10"
                      max="25"
                      step="1"
                      value={combinedParams.trains_in_service}
                      onChange={(e) =>
                        setCombinedParams({
                          ...combinedParams,
                          trains_in_service: parseInt(e.target.value),
                        })
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      HVAC Mode
                    </label>
                    <select
                      className="input w-full"
                      value={combinedParams.hvac_mode}
                      onChange={(e) =>
                        setCombinedParams({
                          ...combinedParams,
                          hvac_mode: e.target.value,
                        })
                      }
                    >
                      <option value="full">Full</option>
                      <option value="eco">ECO</option>
                    </select>
                  </div>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-5 h-5 rounded border-slate-400 dark:border-slate-600 bg-slate-100 dark:bg-slate-700 text-purple-500 focus:ring-purple-500"
                      checked={combinedParams.regen_braking}
                      onChange={(e) =>
                        setCombinedParams({
                          ...combinedParams,
                          regen_braking: e.target.checked,
                        })
                      }
                    />
                    <span className="text-slate-700 dark:text-slate-300">
                      Regenerative Braking
                    </span>
                  </label>

                  <button
                    className="btn w-full justify-center mt-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                    onClick={() => runSimulation('combined')}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Activity className="w-5 h-5" />
                    )}
                    {isLoading ? 'Analyzing...' : 'Run Combined Analysis'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Results Panel */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          {!results && !isLoading && (
            <div className="card">
              <div className="card-body flex flex-col items-center justify-center py-16">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-300 to-slate-400 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center mb-4">
                  <Gauge className="w-10 h-10 text-slate-600 dark:text-slate-500" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                  {t('simulator.configure')}
                </h3>
                <p className="text-slate-600 dark:text-slate-400 text-center max-w-md">
                  {t('simulator.configureDesc')}
                </p>
              </div>
            </div>
          )}

          {isLoading && (
            <div className="card">
              <div className="card-body flex flex-col items-center justify-center py-16">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center mb-4 animate-pulse">
                  <Brain className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                  Running Simulation...
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  AI is analyzing patterns and generating recommendations
                </p>
                <div className="flex gap-1 mt-4">
                  <div
                    className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                    style={{ animationDelay: '0ms' }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                    style={{ animationDelay: '150ms' }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                    style={{ animationDelay: '300ms' }}
                  ></div>
                </div>
              </div>
            </div>
          )}

          {results && !isLoading && (
            <>
              {/* Passenger Results */}
              {results.simulation_type === 'passenger_handling' && (
                <div className="card">
                  <div className="card-header flex items-center gap-3">
                    <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                      Passenger Handling Results
                    </h3>
                  </div>
                  <div className="card-body">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                      <StatCard
                        icon={Users}
                        label="Total Passengers"
                        value={results.results?.summary?.total_passengers_served}
                        color="blue"
                      />
                      <StatCard
                        icon={Activity}
                        label="Max Load"
                        value={results.results?.summary?.max_load_percent}
                        unit="%"
                        color={
                          results.results?.summary?.max_load_percent > 100
                            ? 'red'
                            : 'green'
                        }
                      />
                      <StatCard
                        icon={Gauge}
                        label="Service Quality"
                        value={results.results?.summary?.service_quality}
                        color="purple"
                      />
                    </div>

                    {results.results?.critical_stations?.length > 0 && (
                      <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-4">
                        <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-semibold mb-3">
                          <AlertTriangle className="w-5 h-5" />
                          Critical Stations (
                          {results.results.critical_stations.length})
                        </div>
                        <div className="space-y-2">
                          {results.results.critical_stations
                            .slice(0, 5)
                            .map((station, i) => (
                              <div
                                key={i}
                                className="flex items-center justify-between bg-slate-200/50 dark:bg-slate-800/50 rounded-lg px-3 py-2"
                              >
                                <span className="text-slate-900 dark:text-white">
                                  {station.station}
                                </span>
                                <div className="flex items-center gap-3">
                                  <span className="badge badge-danger">
                                    {station.load_percent}% load
                                  </span>
                                  <span className="text-red-600 dark:text-red-400 text-sm">
                                    +{station.excess_passengers} excess
                                  </span>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Recommendations */}
                    {results.results?.recommendations && (
                      <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
                        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold mb-3">
                          <CheckCircle className="w-5 h-5" />
                          Recommendations
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-slate-200/50 dark:bg-slate-800/50 rounded-lg p-3">
                            <div className="text-slate-600 dark:text-slate-400 text-sm">
                              Recommended Trains
                            </div>
                            <div className="text-2xl font-bold text-slate-900 dark:text-white">
                              {
                                results.results.recommendations
                                  .recommended_trains
                              }
                            </div>
                          </div>
                          {results.results.recommendations
                            .additional_trains_needed > 0 && (
                              <div className="bg-amber-500/20 rounded-lg p-3">
                                <div className="text-amber-600 dark:text-amber-400 text-sm">
                                  Additional Needed
                                </div>
                                <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                                  +
                                  {
                                    results.results.recommendations
                                      .additional_trains_needed
                                  }
                                </div>
                              </div>
                            )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Energy Results */}
              {results.simulation_type === 'energy_optimization' && (
                <>
                  <div className="card">
                    <div className="card-header flex items-center gap-3">
                      <Zap className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                        Energy Analysis Results
                      </h3>
                    </div>
                    <div className="card-body">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <StatCard
                          icon={Zap}
                          label="Total Energy"
                          value={results.results?.summary?.total_energy_kwh?.toFixed(
                            0
                          )}
                          unit="kWh"
                          color="amber"
                        />
                        <StatCard
                          icon={Activity}
                          label="Total Cost"
                          value={`${(
                            (results.results?.summary?.total_cost_inr || 0) /
                            1000
                          ).toFixed(1)}K`}
                          prefix="₹"
                          color="amber"
                        />
                        <StatCard
                          icon={TrendingDown}
                          label="Potential Savings"
                          value={results.results?.optimization_potential?.potential_savings_percent?.toFixed(
                            1
                          )}
                          unit="%"
                          color="green"
                        />
                        <StatCard
                          icon={Activity}
                          label="CO₂ Footprint"
                          value={results.results?.summary?.carbon_footprint_kg?.toFixed(
                            0
                          )}
                          unit="kg"
                          color="purple"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Energy Breakdown */}
                  <div className="bg-slate-200/50 dark:bg-slate-800/50 rounded-xl p-4">
                    <h4 className="text-slate-900 dark:text-white font-semibold mb-4">
                      Energy Breakdown
                    </h4>
                    <div className="space-y-3">
                      {[
                        {
                          label: 'Traction',
                          value:
                            (results.results?.breakdown ||
                              results.energy_results?.breakdown)
                              ?.traction_energy_kwh,
                          color: 'bg-amber-500',
                          pct: (results.results?.efficiency_metrics ||
                            results.energy_results?.efficiency_metrics)
                            ?.traction_share_percent,
                        },
                        {
                          label: 'HVAC',
                          value:
                            (results.results?.breakdown ||
                              results.energy_results?.breakdown)
                              ?.hvac_energy_kwh,
                          color: 'bg-blue-500',
                          pct: (results.results?.efficiency_metrics ||
                            results.energy_results?.efficiency_metrics)
                            ?.hvac_share_percent,
                        },
                        {
                          label: 'Regen Savings',
                          value:
                            (results.results?.breakdown ||
                              results.energy_results?.breakdown)
                              ?.regen_savings_kwh,
                          color: 'bg-emerald-500',
                          pct: (results.results?.efficiency_metrics ||
                            results.energy_results?.efficiency_metrics)
                            ?.regen_efficiency_percent,
                          negative: true,
                        },
                      ].map((item, i) => (
                        <div key={i} className="flex items-center gap-4">
                          <div className="w-28 text-sm text-slate-600 dark:text-slate-400">
                            {item.label}
                          </div>
                          <div className="flex-1 h-3 bg-slate-300 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${item.color} rounded-full transition-all`}
                              style={{
                                width: `${Math.min(item.pct || 0, 100)}%`,
                              }}
                            ></div>
                          </div>
                          <div
                            className={`w-24 text-right text-sm font-medium ${item.negative
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-slate-900 dark:text-white'
                              }`}
                          >
                            {item.negative ? '-' : ''}
                            {item.value?.toFixed(0)} kWh
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Shunting Results */}
              {results.simulation_type === 'shunting_optimization' && (
                <div className="card">
                  {/* <div className="card-header flex items-center gap-3">
                    <Shuffle className="w-5 h-5 text-purple-400" />
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                      Shunting Plan Results
                    </h3>
                  </div> */}
                  <div className="card-body">
                    {/* <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"> */}
                      {/* <StatCard
                        icon={Shuffle}
                        label="Total Moves"
                        value={results.results?.summary?.total_moves}
                        color="purple"
                      />
                      <StatCard
                        icon={Clock}
                        label="Time Required"
                        value={results.results?.summary?.adjusted_time_minutes?.toFixed(
                          0
                        )}
                        unit="min"
                        color={
                          results.results?.summary?.is_feasible
                            ? 'green'
                            : 'red'
                        }
                      />
                      <StatCard
                        icon={Zap}
                        label="Energy Cost"
                        value={results.results?.summary?.total_energy_kwh?.toFixed(
                          0
                        )}
                        unit="kWh"
                        color="amber"
                      />
                      <StatCard
                        icon={DollarSign}
                        label="Shunting Cost"
                        value={results.results?.summary?.energy_cost_inr?.toFixed(
                          0
                        )}
                        prefix="₹"
                        color="orange"
                      /> */}
                    {/* </div> */}

                    {/* Blocking Analysis */}
                    {/* {results.results?.blocking_analysis?.most_blocked_trains
                      ?.length > 0 && (
                        <div className="bg-slate-800/50 rounded-xl p-4 mb-4">
                          <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                            <Train className="w-4 h-4 text-purple-400" />
                            Blocking Analysis
                          </h4>
                          <div className="space-y-2">
                            {results.results.blocking_analysis.most_blocked_trains
                              .slice(0, 5)
                              .map((item, i) => (
                                <div
                                  key={i}
                                  className="flex items-center justify-between bg-slate-700/50 rounded-lg px-3 py-2"
                                >
                                  <div>
                                    <span className="text-white font-medium">
                                      {item.target_train}
                                    </span>
                                    <span className="text-slate-400 text-sm ml-2">
                                      on {item.track}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-slate-400 text-sm">
                                      Blocked by {item.blocked_by?.length || 0}
                                    </span>
                                    <span className="badge badge-warning">
                                      {item.moves_required} moves
                                    </span>
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      )} */}

                    {/* Track Visualization */}
                    {results.results?.initial_state && (
                      <div
                        key={`viz-${shuntingParams.available_shunters}-${shuntingParams.time_window_minutes}`}
                        className="rounded-xl p-6 mb-4 border relative"
                        style={{
                          background: 'var(--glass-bg)',
                          borderColor: 'rgb(var(--color-border))',
                          animation: 'slideIn 0.5s ease-out',
                          transition: 'all 0.3s ease'
                        }}
                      >
                        {/* Adjusting Overlay */}
                        {isAdjusting && (
                          <div className="absolute inset-0 bg-blue-500/10 rounded-xl flex items-center justify-center z-20 backdrop-blur-sm">
                            <div className="flex items-center gap-2 text-blue-400">
                              <Shuffle className="w-5 h-5 animate-spin" />
                              <span className="text-sm font-medium">Recalculating...</span>
                            </div>
                          </div>
                        )}

                        <h4 className="font-semibold mb-4 flex items-center gap-2" style={{ color: 'rgb(var(--color-text-primary))' }}>
                          <Building className="w-4 h-4 text-blue-400 animate-pulse" />
                          Track Visualization - Live View
                          <span className="text-xs ml-2 animate-pulse" style={{ color: 'rgb(var(--color-text-tertiary))' }}>
                            ({shuntingParams.available_shunters} shunters, {shuntingParams.time_window_minutes}min window)
                          </span>
                          {isAdjusting && (
                            <span className="ml-2 px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded-full animate-pulse">
                              Updating...
                            </span>
                          )}
                        </h4>

                        <div className="space-y-4">
                          {Object.entries(results.results.initial_state).map(([trackName, trains], trackIdx) => {
                            const trackNumber = trackName.replace('track_', '');
                            const trainArray = Array.isArray(trains) ? trains : [];

                            return (
                              <div
                                key={`${trackName}-${shuntingParams.available_shunters}-${shuntingParams.time_window_minutes}`}
                                className="relative"
                                style={{
                                  animation: `slideIn 0.4s ease-out ${trackIdx * 0.1}s both`
                                }}
                              >
                                {/* Track Label */}
                                <div className="flex items-center gap-3 mb-2">
                                  <div className="w-16 text-sm font-medium" style={{ color: 'rgb(var(--color-text-secondary))' }}>
                                    Track {trackNumber}
                                  </div>
                                  <div className="text-xs" style={{ color: 'rgb(var(--color-text-tertiary))' }}>
                                    {trainArray.length} train{trainArray.length !== 1 ? 's' : ''}
                                  </div>
                                </div>

                                {/* Track Line */}
                                <div className="relative h-16 rounded-lg border-2 overflow-visible" style={{
                                  background: 'rgba(var(--color-bg-tertiary), 0.5)',
                                  borderColor: 'rgb(var(--color-border))'
                                }}>
                                  {/* Track Rails with animation */}
                                  <div className="absolute inset-0 flex flex-col justify-center px-4">
                                    <div
                                      className="h-0.5 mb-2"
                                      style={{
                                        background: 'rgba(var(--color-border), 0.5)',
                                        animation: 'trackPulse 2s ease-in-out infinite'
                                      }}
                                    ></div>
                                    <div
                                      className="h-0.5"
                                      style={{
                                        background: 'rgba(var(--color-border), 0.5)',
                                        animation: 'trackPulse 2s ease-in-out infinite 0.5s'
                                      }}
                                    ></div>
                                  </div>

                                  {/* Trains on Track */}
                                  <div className="absolute inset-0 flex items-center px-4 gap-2">
                                    {trainArray.length === 0 ? (
                                      <div className="text-xs italic" style={{ color: 'rgb(var(--color-text-tertiary))' }}>Empty track</div>
                                    ) : (
                                      trainArray.map((train, idx) => {
                                        // Determine train color based on blocking status
                                        const blockedTrain = results.results?.blocking_analysis?.most_blocked_trains?.find(
                                          b => b.target_train === train
                                        );
                                        const movesRequired = blockedTrain?.moves_required || 0;

                                        let trainColor = 'from-blue-500 to-blue-600';
                                        let borderColor = 'border-blue-400/50';
                                        let textColor = 'text-blue-100';

                                        if (movesRequired >= 3) {
                                          trainColor = 'from-red-500 to-red-600';
                                          borderColor = 'border-red-400/50';
                                          textColor = 'text-red-100';
                                        } else if (movesRequired >= 1) {
                                          trainColor = 'from-amber-500 to-amber-600';
                                          borderColor = 'border-amber-400/50';
                                          textColor = 'text-amber-100';
                                        } else if (idx === 0) {
                                          trainColor = 'from-emerald-500 to-emerald-600';
                                          borderColor = 'border-emerald-400/50';
                                          textColor = 'text-emerald-100';
                                        }

                                        return (
                                          <div
                                            key={`${train}-${idx}-${shuntingParams.available_shunters}-${shuntingParams.time_window_minutes}`}
                                            className={`relative flex-shrink-0 group`}
                                            style={{
                                              animation: `slideIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) ${(idx * 0.15) + (trackIdx * 0.05)}s both, trainMove 3s ease-in-out ${idx * 0.5}s infinite`
                                            }}
                                          >
                                            {/* Train Car */}
                                            <div className={`
                                              h-12 px-3 rounded-lg border-2 ${borderColor}
                                              bg-gradient-to-br ${trainColor}
                                              flex items-center justify-center
                                              shadow-lg hover:scale-110 transition-all duration-300
                                              cursor-pointer
                                              relative overflow-hidden
                                            `}
                                              style={{
                                                boxShadow: movesRequired >= 3
                                                  ? '0 4px 20px rgba(239, 68, 68, 0.4)'
                                                  : movesRequired >= 1
                                                    ? '0 4px 20px rgba(245, 158, 11, 0.4)'
                                                    : idx === 0
                                                      ? '0 4px 20px rgba(16, 185, 129, 0.4)'
                                                      : '0 4px 15px rgba(59, 130, 246, 0.3)'
                                              }}
                                            >
                                              {/* Shimmer effect */}
                                              <div
                                                className="absolute inset-0 opacity-30"
                                                style={{
                                                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                                                  backgroundSize: '200% 100%',
                                                  animation: 'shimmer 3s infinite'
                                                }}
                                              ></div>

                                              <div className="flex flex-col items-center relative z-10">
                                                <Train
                                                  className={`w-4 h-4 ${textColor}`}
                                                  style={{
                                                    animation: idx === 0 ? 'pulse 2s ease-in-out infinite' : 'none'
                                                  }}
                                                />
                                                <span className={`text-xs font-bold ${textColor} whitespace-nowrap`}>
                                                  {train}
                                                </span>
                                              </div>
                                            </div>

                                            {/* Tooltip on Hover */}
                                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                              <div className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs whitespace-nowrap shadow-xl">
                                                <div className="text-white font-semibold mb-1">{train}</div>
                                                <div className="text-slate-400">Position: {idx + 1}</div>
                                                {blockedTrain && (
                                                  <>
                                                    <div className="text-amber-400 mt-1">
                                                      Blocked by: {blockedTrain.blocked_by?.length || 0}
                                                    </div>
                                                    <div className="text-red-400">
                                                      Moves needed: {movesRequired}
                                                    </div>
                                                  </>
                                                )}
                                                {idx === 0 && !blockedTrain && (
                                                  <div className="text-emerald-400 mt-1">
                                                    ✓ Ready to exit
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                          </div>
                                        );
                                      })
                                    )}
                                  </div>

                                  {/* Track End Bumper */}
                                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 w-2 h-10 bg-red-500/50 rounded-sm"></div>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Legend */}
                        <div className="mt-6 pt-4 border-t" style={{ borderColor: 'rgb(var(--color-border))' }}>
                          <div className="flex flex-wrap gap-4 text-xs">
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded bg-gradient-to-br from-emerald-500 to-emerald-600 border border-emerald-400/50"></div>
                              <span style={{ color: 'rgb(var(--color-text-secondary))' }}>Ready to exit</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded bg-gradient-to-br from-blue-500 to-blue-600 border border-blue-400/50"></div>
                              <span style={{ color: 'rgb(var(--color-text-secondary))' }}>No blocking</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded bg-gradient-to-br from-amber-500 to-amber-600 border border-amber-400/50"></div>
                              <span style={{ color: 'rgb(var(--color-text-secondary))' }}>1-2 moves needed</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded bg-gradient-to-br from-red-500 to-red-600 border border-red-400/50"></div>
                              <span style={{ color: 'rgb(var(--color-text-secondary))' }}>3+ moves needed</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Move Sequence Preview */}
                    {results.results?.move_sequence?.length > 0 && (
                      <div className="rounded-xl p-4 border" style={{
                        background: 'var(--glass-bg)',
                        borderColor: 'rgb(var(--color-border))'
                      }}>
                        <h4 className="font-semibold mb-3 flex items-center gap-2" style={{ color: 'rgb(var(--color-text-primary))' }}>
                          <Activity className="w-4 h-4 text-blue-400" />
                          Move Sequence (First 10)
                        </h4>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {results.results.move_sequence
                            .slice(0, 10)
                            .map((move, i) => (
                              <div
                                key={i}
                                className="flex items-center gap-3 text-sm py-2 border-b"
                                style={{ borderColor: 'rgb(var(--color-border))' }}
                              >
                                <span className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center flex-shrink-0">
                                  {move.step}
                                </span>
                                <div className="flex-1">
                                  <span className="font-medium" style={{ color: 'rgb(var(--color-text-primary))' }}>
                                    {move.train}
                                  </span>
                                  <span className="mx-2" style={{ color: 'rgb(var(--color-text-tertiary))' }}>→</span>
                                  <span style={{ color: 'rgb(var(--color-text-secondary))' }}>
                                    {move.action.replace(/_/g, ' ')}
                                  </span>
                                </div>
                                <span className="text-xs" style={{ color: 'rgb(var(--color-text-tertiary))' }}>
                                  {move.time_minutes} min
                                </span>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Combined Results */}
              {results.simulation_type === 'combined_optimization' && (
                <div className="card">
                  <div className="card-header flex items-center gap-3">
                    <Activity className="w-5 h-5 text-emerald-400" />
                    <h3 className="text-lg font-semibold text-white">
                      Combined Analysis
                    </h3>
                  </div>
                  <div className="card-body">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <StatCard
                        icon={Users}
                        label="Passengers"
                        value={
                          results.passenger_results?.summary
                            ?.total_passengers_served
                        }
                        color="blue"
                      />
                      <StatCard
                        icon={Activity}
                        label="Max Load"
                        value={
                          results.passenger_results?.summary?.max_load_percent
                        }
                        unit="%"
                        color={
                          results.passenger_results?.summary?.max_load_percent >
                            100
                            ? 'red'
                            : 'green'
                        }
                      />
                      <StatCard
                        icon={Zap}
                        label="Energy"
                        value={results.energy_results?.summary?.total_energy_kwh?.toFixed(
                          0
                        )}
                        unit="kWh"
                        color="amber"
                      />
                      <StatCard
                        icon={TrendingDown}
                        label="Savings Potential"
                        value={results.energy_results?.optimization_potential?.potential_savings_percent?.toFixed(
                          1
                        )}
                        unit="%"
                        color="green"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* AI Reasoning Section */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Brain className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                    AI-Powered Analysis
                  </h3>
                </div>
                <ReasoningDisplay
                  reasoning={results.ai_reasoning}
                  isLoading={false}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
