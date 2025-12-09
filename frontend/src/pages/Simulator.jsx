import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Zap, Users, Gauge, Activity, TrendingDown, AlertTriangle, CheckCircle, Info, Loader2, Brain, Sparkles } from 'lucide-react';

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
              <div className="text-slate-900 dark:text-white font-medium">AI Analysis in Progress</div>
              <div className="text-slate-600 dark:text-slate-400 text-sm">Processing simulation data...</div>
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
            <span className="text-slate-600 dark:text-slate-400 text-sm">Analyzing patterns and generating recommendations...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!reasoning) return null;

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
          <ul key={`list-${elements.length}`} className="space-y-2 my-3 ml-4">
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
          <h4 key={i} className="text-blue-600 dark:text-blue-400 font-semibold mt-4 mb-2 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400"></div>
            {line.replace(/^###\s*/, '')}
          </h4>
        );
      } else if (line.startsWith('##')) {
        flushList();
        elements.push(
          <h3 key={i} className="text-lg text-slate-900 dark:text-white font-bold mt-5 mb-3 pb-2 border-b" style={{ borderColor: 'rgb(var(--color-border))' }}>
            {line.replace(/^##\s*/, '')}
          </h3>
        );
      } else if (line.startsWith('#')) {
        flushList();
        elements.push(
          <h2 key={i} className="text-xl text-slate-900 dark:text-white font-bold mt-6 mb-4">
            {line.replace(/^#\s*/, '')}
          </h2>
        );
      }
      // Bullet points
      else if (line.startsWith('- ') || line.startsWith('* ')) {
        inList = true;
        const content = line.replace(/^[-*]\s*/, '');
        listItems.push(
          <li key={i} className="text-slate-700 dark:text-slate-300 flex items-start gap-2">
            <span className="text-emerald-600 dark:text-emerald-400 mt-1.5">•</span>
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
          <li key={i} className="text-slate-700 dark:text-slate-300 flex items-start gap-3">
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
        const cells = line.split('|').filter(c => c.trim());
        if (cells.length > 0) {
          elements.push(
            <div key={i} className="grid grid-cols-3 gap-2 py-2 border-b border-slate-300/50 dark:border-slate-700/50 text-sm">
              {cells.map((cell, j) => (
                <span key={j} className={j === 0 ? 'text-slate-600 dark:text-slate-400' : 'text-slate-800 dark:text-slate-200 font-medium'}>
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
          <p key={i} className="text-slate-700 dark:text-slate-300 leading-relaxed my-2">
            {renderInlineFormatting(line)}
          </p>
        );
      }
    });

    flushList();
    return elements;
  };

  const renderInlineFormatting = (text) => {
    // Handle bold text
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="text-slate-900 dark:text-white font-semibold">{part.slice(2, -2)}</strong>;
      }
      // Handle emojis with proper styling
      if (part.includes('✅')) return <span key={i}>{part.replace('✅', '')} <span className="text-emerald-600 dark:text-emerald-400">✓</span></span>;
      if (part.includes('⚠️')) return <span key={i}>{part.replace('⚠️', '')} <span className="text-amber-600 dark:text-amber-400">⚠</span></span>;
      if (part.includes('🚨')) return <span key={i}>{part.replace('🚨', '')} <span className="text-red-600 dark:text-red-400">!</span></span>;
      if (part.includes('🔧')) return <span key={i}>{part.replace('🔧', '')} <span className="text-blue-600 dark:text-blue-400">→</span></span>;
      return part;
    });
  };

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 border-b px-6 py-4" style={{ borderColor: 'rgb(var(--color-border))' }}>
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
const StatCard = ({ label, value, unit, icon: Icon, color = 'blue', trend }) => {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-emerald-500 to-emerald-600',
    amber: 'from-amber-500 to-amber-600',
    red: 'from-red-500 to-red-600',
    purple: 'from-purple-500 to-purple-600'
  };

  return (
    <div className="bg-slate-200/50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-300/50 dark:border-slate-700/50">
      <div className="flex items-start justify-between mb-2">
        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        {trend !== undefined && (
          <span className={`text-xs font-medium ${trend >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div className="mt-2">
        <div className="text-2xl font-bold text-slate-900 dark:text-white">
          {typeof value === 'number' ? value.toLocaleString() : value}
          {unit && <span className="text-sm font-normal text-slate-600 dark:text-slate-400 ml-1">{unit}</span>}
        </div>
        <div className="text-sm text-slate-600 dark:text-slate-400">{label}</div>
      </div>
    </div>
  );
};

export default function Simulator() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('passenger');
  const [isLoading, setIsLoading] = useState(false);
  const [stations, setStations] = useState([]);
  const [results, setResults] = useState(null);

  // Passenger simulation params
  const [passengerParams, setPassengerParams] = useState({
    time_of_day: 'off_peak',
    special_event: '',
    event_station: '',
    expected_crowd_multiplier: 1.0,
    trains_available: 18,
    simulation_duration_minutes: 60
  });

  // Energy simulation params
  const [energyParams, setEnergyParams] = useState({
    trains_in_service: 18,
    operating_hours: 16,
    passenger_load_percent: 60,
    hvac_mode: 'full',
    regen_braking: true,
    coasting_optimization: false,
    speed_profile: 'normal'
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
    speed_profile: 'normal'
  });

  useEffect(() => {
    fetchStations();
  }, []);

  const fetchStations = async () => {
    try {
      const res = await fetch(`${API_BASE}/simulation/stations`);
      const data = await res.json();
      setStations(data.stations || []);
    } catch (error) {
      console.error('Failed to fetch stations:', error);
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
          event_station: passengerParams.event_station || null
        };
      } else if (type === 'energy') {
        endpoint = '/simulation/energy';
        params = energyParams;
      } else {
        endpoint = '/simulation/combined';
        params = {
          ...combinedParams,
          special_event: combinedParams.special_event || null,
          event_station: combinedParams.event_station || null
        };
      }

      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });

      const data = await res.json();
      setResults(data);
    } catch (error) {
      console.error('Simulation failed:', error);
    }

    setIsLoading(false);
  };

  const getQualityColor = (quality) => {
    const colors = {
      'Excellent': 'text-emerald-400',
      'Good': 'text-blue-400',
      'Acceptable': 'text-amber-400',
      'Crowded': 'text-orange-400',
      'Critical': 'text-red-400'
    };
    return colors[quality] || 'text-slate-400';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            {t('simulator.title')}
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">{t('simulator.subtitle')}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-slate-200/50 dark:bg-slate-800/50 rounded-xl border border-slate-300/50 dark:border-slate-700/50">
        {[
          { id: 'passenger', label: t('simulator.tabs.passenger'), icon: Users },
          { id: 'energy', label: t('simulator.tabs.energy'), icon: Zap },
          { id: 'combined', label: t('simulator.tabs.combined'), icon: Activity }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setResults(null); }}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${activeTab === tab.id
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-300/50 dark:hover:bg-slate-700/50'
              }`}
          >
            <tab.icon className="w-5 h-5" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Parameters Panel */}
        <div className="col-span-12 lg:col-span-4">
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{t('simulator.parameters')}</h3>
            </div>
            <div className="card-body space-y-4">
              {activeTab === 'passenger' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">{t('simulator.timeOfDay')}</label>
                    <select
                      className="input w-full"
                      value={passengerParams.time_of_day}
                      onChange={(e) => setPassengerParams({ ...passengerParams, time_of_day: e.target.value })}
                    >
                      <option value="early_morning">{t('simulator.earlyMorning')}</option>
                      <option value="peak_morning">{t('simulator.peakMorning')}</option>
                      <option value="off_peak">{t('simulator.offPeak')}</option>
                      <option value="peak_evening">{t('simulator.peakEvening')}</option>
                      <option value="late_night">{t('simulator.lateNight')}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('simulator.specialEvent')}</label>
                    <select
                      className="input w-full"
                      value={passengerParams.special_event}
                      onChange={(e) => setPassengerParams({ ...passengerParams, special_event: e.target.value })}
                    >
                      <option value="">{t('simulator.none')}</option>
                      <option value="football_match">{t('simulator.footballMatch')}</option>
                      <option value="concert">{t('simulator.concert')}</option>
                      <option value="festival">{t('simulator.festival')}</option>
                      <option value="strike">{t('simulator.strike')}</option>
                      <option value="emergency">{t('simulator.emergency')}</option>
                    </select>
                  </div>

                  {passengerParams.special_event && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('simulator.eventStation')}</label>
                      <select
                        className="input w-full"
                        value={passengerParams.event_station}
                        onChange={(e) => setPassengerParams({ ...passengerParams, event_station: e.target.value })}
                      >
                        <option value="">{t('simulator.selectStation')}</option>
                        {stations.map(s => (
                          <option key={s.name} value={s.name}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      {t('simulator.crowdMultiplier')}: <span className="text-blue-600 dark:text-blue-400">{passengerParams.expected_crowd_multiplier.toFixed(1)}x</span>
                    </label>
                    <input
                      type="range"
                      className="w-full accent-blue-500"
                      min="0.5" max="3" step="0.1"
                      value={passengerParams.expected_crowd_multiplier}
                      onChange={(e) => setPassengerParams({ ...passengerParams, expected_crowd_multiplier: parseFloat(e.target.value) })}
                    />
                    <div className="flex justify-between text-xs text-slate-500 dark:text-slate-500 mt-1">
                      <span>{t('whatif.low')}</span><span>{t('simulator.normal')}</span><span>{t('whatif.high')}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      {t('simulator.trainsAvailable')}: <span className="text-blue-600 dark:text-blue-400">{passengerParams.trains_available}</span>
                    </label>
                    <input
                      type="range"
                      className="w-full accent-blue-500"
                      min="10" max="25" step="1"
                      value={passengerParams.trains_available}
                      onChange={(e) => setPassengerParams({ ...passengerParams, trains_available: parseInt(e.target.value) })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      {t('simulator.duration')}: <span className="text-blue-600 dark:text-blue-400">{passengerParams.simulation_duration_minutes} {t('simulator.min')}</span>
                    </label>
                    <input
                      type="range"
                      className="w-full accent-blue-500"
                      min="15" max="180" step="15"
                      value={passengerParams.simulation_duration_minutes}
                      onChange={(e) => setPassengerParams({ ...passengerParams, simulation_duration_minutes: parseInt(e.target.value) })}
                    />
                  </div>

                  <button
                    className="btn btn-primary w-full justify-center mt-4"
                    onClick={() => runSimulation('passenger')}
                    disabled={isLoading}
                  >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Users className="w-5 h-5" />}
                    {isLoading ? t('simulator.simulating') : t('simulator.runSimulation')}
                  </button>
                </>
              )}

              {activeTab === 'energy' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Trains in Service: <span className="text-amber-600 dark:text-amber-400">{energyParams.trains_in_service}</span>
                    </label>
                    <input
                      type="range"
                      className="w-full accent-amber-500"
                      min="10" max="25" step="1"
                      value={energyParams.trains_in_service}
                      onChange={(e) => setEnergyParams({ ...energyParams, trains_in_service: parseInt(e.target.value) })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Operating Hours: <span className="text-amber-600 dark:text-amber-400">{energyParams.operating_hours}h</span>
                    </label>
                    <input
                      type="range"
                      className="w-full accent-amber-500"
                      min="1" max="20" step="1"
                      value={energyParams.operating_hours}
                      onChange={(e) => setEnergyParams({ ...energyParams, operating_hours: parseInt(e.target.value) })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Passenger Load: <span className="text-amber-600 dark:text-amber-400">{energyParams.passenger_load_percent}%</span>
                    </label>
                    <input
                      type="range"
                      className="w-full accent-amber-500"
                      min="10" max="100" step="5"
                      value={energyParams.passenger_load_percent}
                      onChange={(e) => setEnergyParams({ ...energyParams, passenger_load_percent: parseInt(e.target.value) })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">HVAC Mode</label>
                    <select
                      className="input w-full"
                      value={energyParams.hvac_mode}
                      onChange={(e) => setEnergyParams({ ...energyParams, hvac_mode: e.target.value })}
                    >
                      <option value="full">Full Cooling</option>
                      <option value="eco">ECO Mode</option>
                      <option value="off">Off</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Speed Profile</label>
                    <select
                      className="input w-full"
                      value={energyParams.speed_profile}
                      onChange={(e) => setEnergyParams({ ...energyParams, speed_profile: e.target.value })}
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
                        className="w-5 h-5 rounded border-slate-400 dark:border-slate-600 bg-slate-100 dark:bg-slate-700 text-amber-500 focus:ring-amber-500"
                        checked={energyParams.regen_braking}
                        onChange={(e) => setEnergyParams({ ...energyParams, regen_braking: e.target.checked })}
                      />
                      <span className="text-slate-700 dark:text-slate-300">Regenerative Braking</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        className="w-5 h-5 rounded border-slate-400 dark:border-slate-600 bg-slate-100 dark:bg-slate-700 text-amber-500 focus:ring-amber-500"
                        checked={energyParams.coasting_optimization}
                        onChange={(e) => setEnergyParams({ ...energyParams, coasting_optimization: e.target.checked })}
                      />
                      <span className="text-slate-700 dark:text-slate-300">Coasting Optimization</span>
                    </label>
                  </div>

                  <button
                    className="btn btn-warning w-full justify-center mt-4"
                    onClick={() => runSimulation('energy')}
                    disabled={isLoading}
                  >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
                    {isLoading ? 'Simulating...' : 'Run Energy Simulation'}
                  </button>
                </>
              )}

              {activeTab === 'combined' && (
                <>
                  <div className="pb-3 border-b border-slate-300 dark:border-slate-700">
                    <h4 className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Passenger Settings</h4>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Time of Day</label>
                    <select
                      className="input w-full"
                      value={combinedParams.time_of_day}
                      onChange={(e) => setCombinedParams({ ...combinedParams, time_of_day: e.target.value })}
                    >
                      <option value="peak_morning">Peak Morning</option>
                      <option value="off_peak">Off-Peak</option>
                      <option value="peak_evening">Peak Evening</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Crowd Multiplier: <span className="text-purple-600 dark:text-purple-400">{combinedParams.expected_crowd_multiplier.toFixed(1)}x</span>
                    </label>
                    <input
                      type="range"
                      className="w-full accent-purple-500"
                      min="0.5" max="3" step="0.1"
                      value={combinedParams.expected_crowd_multiplier}
                      onChange={(e) => setCombinedParams({ ...combinedParams, expected_crowd_multiplier: parseFloat(e.target.value) })}
                    />
                  </div>

                  <div className="pb-3 pt-2 border-b border-slate-300 dark:border-slate-700">
                    <h4 className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Energy Settings</h4>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Trains: <span className="text-purple-600 dark:text-purple-400">{combinedParams.trains_in_service}</span>
                    </label>
                    <input
                      type="range"
                      className="w-full accent-purple-500"
                      min="10" max="25" step="1"
                      value={combinedParams.trains_in_service}
                      onChange={(e) => setCombinedParams({ ...combinedParams, trains_in_service: parseInt(e.target.value) })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">HVAC Mode</label>
                    <select
                      className="input w-full"
                      value={combinedParams.hvac_mode}
                      onChange={(e) => setCombinedParams({ ...combinedParams, hvac_mode: e.target.value })}
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
                      onChange={(e) => setCombinedParams({ ...combinedParams, regen_braking: e.target.checked })}
                    />
                    <span className="text-slate-700 dark:text-slate-300">Regenerative Braking</span>
                  </label>

                  <button
                    className="btn w-full justify-center mt-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                    onClick={() => runSimulation('combined')}
                    disabled={isLoading}
                  >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Activity className="w-5 h-5" />}
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
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">{t('simulator.configure')}</h3>
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
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">Running Simulation...</h3>
                <p className="text-slate-600 dark:text-slate-400">AI is analyzing patterns and generating recommendations</p>
                <div className="flex gap-1 mt-4">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}

          {results && !isLoading && (
            <>
              {/* Passenger Results */}
              {(results.simulation_type === 'passenger_handling' || results.passenger_results) && (
                <div className="card">
                  <div className="card-header flex items-center gap-3">
                    <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Passenger Handling Results</h3>
                  </div>
                  <div className="card-body">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                      <StatCard
                        icon={Users}
                        label="Total Passengers"
                        value={(results.results?.summary || results.passenger_results?.summary)?.total_passengers_served}
                        color="blue"
                      />
                      <StatCard
                        icon={Activity}
                        label="Max Load"
                        value={(results.results?.summary || results.passenger_results?.summary)?.max_load_percent}
                        unit="%"
                        color={(results.results?.summary || results.passenger_results?.summary)?.max_load_percent > 100 ? 'red' : 'green'}
                      />
                      <StatCard
                        icon={Gauge}
                        label="Service Quality"
                        value={(results.results?.summary || results.passenger_results?.summary)?.service_quality}
                        color="purple"
                      />
                    </div>

                    {/* Critical Stations Alert */}
                    {results.results?.critical_stations?.length > 0 && (
                      <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-4">
                        <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-semibold mb-3">
                          <AlertTriangle className="w-5 h-5" />
                          Critical Stations ({results.results.critical_stations.length})
                        </div>
                        <div className="space-y-2">
                          {results.results.critical_stations.slice(0, 5).map((station, i) => (
                            <div key={i} className="flex items-center justify-between bg-slate-200/50 dark:bg-slate-800/50 rounded-lg px-3 py-2">
                              <span className="text-slate-900 dark:text-white">{station.station}</span>
                              <div className="flex items-center gap-3">
                                <span className="badge badge-danger">{station.load_percent}% load</span>
                                <span className="text-red-600 dark:text-red-400 text-sm">+{station.excess_passengers} excess</span>
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
                            <div className="text-slate-600 dark:text-slate-400 text-sm">Recommended Trains</div>
                            <div className="text-2xl font-bold text-slate-900 dark:text-white">{results.results.recommendations.recommended_trains}</div>
                          </div>
                          {results.results.recommendations.additional_trains_needed > 0 && (
                            <div className="bg-amber-500/20 rounded-lg p-3">
                              <div className="text-amber-600 dark:text-amber-400 text-sm">Additional Needed</div>
                              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">+{results.results.recommendations.additional_trains_needed}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Energy Results */}
              {(results.simulation_type === 'energy_optimization' || results.energy_results) && (
                <div className="card">
                  <div className="card-header flex items-center gap-3">
                    <Zap className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Energy Analysis Results</h3>
                  </div>
                  <div className="card-body">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <StatCard
                        icon={Zap}
                        label="Total Energy"
                        value={(results.results?.summary || results.energy_results?.summary)?.total_energy_kwh?.toFixed(0)}
                        unit="kWh"
                        color="amber"
                      />
                      <StatCard
                        icon={Activity}
                        label="Total Cost"
                        value={`₹${((results.results?.summary || results.energy_results?.summary)?.total_cost_inr / 1000).toFixed(1)}K`}
                        color="amber"
                      />
                      <StatCard
                        icon={TrendingDown}
                        label="Potential Savings"
                        value={(results.results?.optimization_potential || results.energy_results?.optimization_potential)?.potential_savings_percent?.toFixed(1)}
                        unit="%"
                        color="green"
                      />
                      <StatCard
                        icon={Activity}
                        label="CO₂ Footprint"
                        value={(results.results?.summary || results.energy_results?.summary)?.carbon_footprint_kg?.toFixed(0)}
                        unit="kg"
                        color="purple"
                      />
                    </div>

                    {/* Energy Breakdown */}
                    <div className="bg-slate-200/50 dark:bg-slate-800/50 rounded-xl p-4">
                      <h4 className="text-slate-900 dark:text-white font-semibold mb-4">Energy Breakdown</h4>
                      <div className="space-y-3">
                        {[
                          { label: 'Traction', value: (results.results?.breakdown || results.energy_results?.breakdown)?.traction_energy_kwh, color: 'bg-amber-500', pct: (results.results?.efficiency_metrics || results.energy_results?.efficiency_metrics)?.traction_share_percent },
                          { label: 'HVAC', value: (results.results?.breakdown || results.energy_results?.breakdown)?.hvac_energy_kwh, color: 'bg-blue-500', pct: (results.results?.efficiency_metrics || results.energy_results?.efficiency_metrics)?.hvac_share_percent },
                          { label: 'Regen Savings', value: (results.results?.breakdown || results.energy_results?.breakdown)?.regen_savings_kwh, color: 'bg-emerald-500', pct: (results.results?.efficiency_metrics || results.energy_results?.efficiency_metrics)?.regen_efficiency_percent, negative: true }
                        ].map((item, i) => (
                          <div key={i} className="flex items-center gap-4">
                            <div className="w-28 text-sm text-slate-600 dark:text-slate-400">{item.label}</div>
                            <div className="flex-1 h-3 bg-slate-300 dark:bg-slate-700 rounded-full overflow-hidden">
                              <div className={`h-full ${item.color} rounded-full transition-all`} style={{ width: `${Math.min(item.pct || 0, 100)}%` }}></div>
                            </div>
                            <div className={`w-24 text-right text-sm font-medium ${item.negative ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
                              {item.negative ? '-' : ''}{item.value?.toFixed(0)} kWh
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* AI Reasoning Section */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Brain className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">AI-Powered Analysis</h3>
                </div>
                <ReasoningDisplay reasoning={results.ai_reasoning} isLoading={false} />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
