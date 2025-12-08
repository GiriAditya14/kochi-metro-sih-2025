import { useState, useEffect } from 'react'
import { 
  FlaskConical, 
  Play, 
  Loader2, 
  Train,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Sparkles,
  RotateCcw,
  AlertTriangle
} from 'lucide-react'
import { getTrains, getPlans, runScenario, parseScenario } from '../services/api'

function ComparisonCard({ label, baseline, scenario, unit = '', inverse = false }) {
  const diff = scenario - baseline
  const isPositive = inverse ? diff < 0 : diff > 0
  const isNeutral = diff === 0

  return (
    <div className="bg-slate-800/50 rounded-lg p-4">
      <p className="text-sm text-slate-400 mb-2">{label}</p>
      <div className="flex items-end justify-between">
        <div>
          <span className="text-2xl font-display font-bold text-white">{scenario}{unit}</span>
          {!isNeutral && (
            <span className={`ml-2 text-sm ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
              {diff > 0 ? '+' : ''}{diff}{unit}
            </span>
          )}
        </div>
        <div className="text-xs text-slate-500">
          Baseline: {baseline}{unit}
        </div>
      </div>
    </div>
  )
}

export default function WhatIfSimulator() {
  const [trains, setTrains] = useState([])
  const [plans, setPlans] = useState([])
  const [baselinePlan, setBaselinePlan] = useState(null)
  const [scenarioResult, setScenarioResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  
  // Scenario parameters
  const [scenarioName, setScenarioName] = useState('Custom Scenario')
  const [unavailableTrains, setUnavailableTrains] = useState([])
  const [forceIBL, setForceIBL] = useState([])
  const [brandingWeight, setBrandingWeight] = useState(80)
  const [naturalLanguage, setNaturalLanguage] = useState('')
  const [parseLoading, setParsing] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [trainsRes, plansRes] = await Promise.all([
          getTrains(),
          getPlans({ limit: 5 })
        ])
        setTrains(trainsRes.data.trains || [])
        setPlans(plansRes.data.plans || [])
        
        if (plansRes.data.plans?.length > 0) {
          setBaselinePlan(plansRes.data.plans[0])
        }
      } catch (err) {
        console.error('Failed to fetch data:', err)
      } finally {
        setInitialLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleParseNL = async () => {
    if (!naturalLanguage.trim()) return
    setParsing(true)
    try {
      const response = await parseScenario(naturalLanguage)
      const parsed = response.data.parsed_scenario
      
      setScenarioName(parsed.name || 'Parsed Scenario')
      setUnavailableTrains(parsed.unavailable_trains || [])
      setForceIBL(parsed.force_ibl || [])
      if (parsed.branding_weight) {
        setBrandingWeight(parsed.branding_weight)
      }
    } catch (err) {
      console.error('Failed to parse:', err)
    } finally {
      setParsing(false)
    }
  }

  const handleRunScenario = async () => {
    if (!baselinePlan) return
    setLoading(true)
    setScenarioResult(null)
    
    try {
      const response = await runScenario({
        name: scenarioName,
        unavailable_trains: unavailableTrains,
        force_ibl: forceIBL,
        branding_weight: brandingWeight,
        baseline_plan_id: baselinePlan.id
      })
      setScenarioResult(response.data)
    } catch (err) {
      console.error('Failed to run scenario:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setScenarioName('Custom Scenario')
    setUnavailableTrains([])
    setForceIBL([])
    setBrandingWeight(80)
    setNaturalLanguage('')
    setScenarioResult(null)
  }

  const toggleTrain = (trainId, list, setList) => {
    if (list.includes(trainId)) {
      setList(list.filter(id => id !== trainId))
    } else {
      setList([...list, trainId])
    }
  }

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto" />
          <p className="text-slate-400 mt-4">Loading simulator...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">What-If Simulator</h1>
          <p className="text-slate-400 text-sm mt-1">
            Test different scenarios and compare outcomes with the baseline plan
          </p>
        </div>
        <button onClick={handleReset} className="btn btn-ghost">
          <RotateCcw className="w-4 h-4" />
          Reset
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scenario Builder */}
        <div className="space-y-4">
          <div className="card">
            <div className="card-header">
              <h2 className="font-display font-semibold text-white flex items-center gap-2">
                <FlaskConical className="w-5 h-5 text-purple-400" />
                Scenario Builder
              </h2>
            </div>
            <div className="card-body space-y-4">
              {/* Natural Language Input */}
              <div>
                <label className="text-sm text-slate-400 block mb-2">
                  <Sparkles className="w-4 h-4 inline mr-1" />
                  Describe your scenario in natural language
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={naturalLanguage}
                    onChange={(e) => setNaturalLanguage(e.target.value)}
                    placeholder="e.g., What if trains TS-205 and TS-207 are unavailable?"
                    className="input flex-1"
                  />
                  <button 
                    onClick={handleParseNL}
                    disabled={parseLoading || !naturalLanguage.trim()}
                    className="btn btn-secondary"
                  >
                    {parseLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Parse'}
                  </button>
                </div>
              </div>

              <div className="border-t border-slate-800 pt-4">
                <p className="text-xs text-slate-500 mb-3">Or configure manually:</p>
                
                {/* Scenario Name */}
                <div className="mb-4">
                  <label className="text-sm text-slate-400 block mb-2">Scenario Name</label>
                  <input
                    type="text"
                    value={scenarioName}
                    onChange={(e) => setScenarioName(e.target.value)}
                    className="input w-full"
                  />
                </div>

                {/* Baseline Plan */}
                <div className="mb-4">
                  <label className="text-sm text-slate-400 block mb-2">Baseline Plan</label>
                  <select
                    value={baselinePlan?.id || ''}
                    onChange={(e) => {
                      const plan = plans.find(p => p.id === parseInt(e.target.value))
                      setBaselinePlan(plan)
                    }}
                    className="input w-full"
                  >
                    {plans.map(plan => (
                      <option key={plan.id} value={plan.id}>
                        {plan.plan_id} - {new Date(plan.plan_date).toLocaleDateString()}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Branding Weight */}
                <div className="mb-4">
                  <label className="text-sm text-slate-400 block mb-2">
                    Branding Priority Weight: {brandingWeight}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="200"
                    value={brandingWeight}
                    onChange={(e) => setBrandingWeight(parseInt(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Low</span>
                    <span>Default (80)</span>
                    <span>High</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Train Selection */}
          <div className="card">
            <div className="card-header">
              <h3 className="font-medium text-white">Select Unavailable Trains</h3>
            </div>
            <div className="p-3 max-h-48 overflow-y-auto">
              <div className="grid grid-cols-5 gap-2">
                {trains.map(train => (
                  <button
                    key={train.id}
                    onClick={() => toggleTrain(train.id, unavailableTrains, setUnavailableTrains)}
                    className={`p-2 text-xs rounded-lg border transition-all ${
                      unavailableTrains.includes(train.id)
                        ? 'bg-red-500/20 border-red-500/50 text-red-400'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    {train.train_id}
                  </button>
                ))}
              </div>
              {unavailableTrains.length > 0 && (
                <p className="text-xs text-red-400 mt-2">
                  {unavailableTrains.length} trains marked unavailable
                </p>
              )}
            </div>
          </div>

          {/* Force IBL */}
          <div className="card">
            <div className="card-header">
              <h3 className="font-medium text-white">Force to IBL</h3>
            </div>
            <div className="p-3 max-h-48 overflow-y-auto">
              <div className="grid grid-cols-5 gap-2">
                {trains.filter(t => !unavailableTrains.includes(t.id)).map(train => (
                  <button
                    key={train.id}
                    onClick={() => toggleTrain(train.id, forceIBL, setForceIBL)}
                    className={`p-2 text-xs rounded-lg border transition-all ${
                      forceIBL.includes(train.id)
                        ? 'bg-amber-500/20 border-amber-500/50 text-amber-400'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    {train.train_id}
                  </button>
                ))}
              </div>
              {forceIBL.length > 0 && (
                <p className="text-xs text-amber-400 mt-2">
                  {forceIBL.length} trains forced to IBL
                </p>
              )}
            </div>
          </div>

          {/* Run Button */}
          <button 
            onClick={handleRunScenario}
            disabled={loading || !baselinePlan}
            className="btn btn-primary w-full py-3"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Play className="w-5 h-5" />
            )}
            Run Scenario
          </button>
        </div>

        {/* Results */}
        <div className="space-y-4">
          {scenarioResult ? (
            <>
              {/* Comparison Header */}
              <div className="card">
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-xs text-slate-500">Baseline</p>
                      <p className="text-sm font-medium text-slate-300">
                        {scenarioResult.baseline_plan?.plan_id || 'N/A'}
                      </p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-slate-600" />
                    <div className="text-center">
                      <p className="text-xs text-slate-500">Scenario</p>
                      <p className="text-sm font-medium text-purple-400">
                        {scenarioResult.scenario_plan?.plan_id || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Comparison Stats */}
              <div className="grid grid-cols-2 gap-4">
                <ComparisonCard
                  label="Trains in Service"
                  baseline={scenarioResult.baseline_plan?.trains_in_service || 0}
                  scenario={scenarioResult.scenario_plan?.trains_in_service || 0}
                />
                <ComparisonCard
                  label="Trains Standby"
                  baseline={scenarioResult.baseline_plan?.trains_standby || 0}
                  scenario={scenarioResult.scenario_plan?.trains_standby || 0}
                />
                <ComparisonCard
                  label="Trains in IBL"
                  baseline={scenarioResult.baseline_plan?.trains_ibl || 0}
                  scenario={scenarioResult.scenario_plan?.trains_ibl || 0}
                  inverse
                />
                <ComparisonCard
                  label="Out of Service"
                  baseline={scenarioResult.baseline_plan?.trains_out_of_service || 0}
                  scenario={scenarioResult.scenario_plan?.trains_out_of_service || 0}
                  inverse
                />
              </div>

              {/* Score Comparison */}
              <div className="card">
                <div className="card-header">
                  <h3 className="font-medium text-white">Optimization Score</h3>
                </div>
                <div className="card-body">
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <p className="text-xs text-slate-500 mb-1">Baseline</p>
                      <div className="score-bar h-3">
                        <div 
                          className="score-fill good"
                          style={{ width: `${Math.min(100, (scenarioResult.baseline_plan?.optimization_score || 0) / 10)}%` }}
                        />
                      </div>
                      <p className="text-sm text-slate-400 mt-1">
                        {scenarioResult.baseline_plan?.optimization_score?.toFixed(1) || 0}
                      </p>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-slate-500 mb-1">Scenario</p>
                      <div className="score-bar h-3">
                        <div 
                          className="score-fill"
                          style={{ 
                            width: `${Math.min(100, (scenarioResult.scenario_plan?.optimization_score || 0) / 10)}%`,
                            background: 'linear-gradient(to right, #a855f7, #9333ea)'
                          }}
                        />
                      </div>
                      <p className="text-sm text-purple-400 mt-1">
                        {scenarioResult.scenario_plan?.optimization_score?.toFixed(1) || 0}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Assignment Changes */}
              <div className="card">
                <div className="card-header">
                  <h3 className="font-medium text-white">Scenario Assignments</h3>
                </div>
                <div className="p-3 max-h-64 overflow-y-auto">
                  {scenarioResult.assignments?.slice(0, 10).map((a, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 hover:bg-slate-800/50 rounded">
                      <div className="flex items-center gap-2">
                        <Train className="w-4 h-4 text-slate-400" />
                        <span className="text-sm text-white">
                          {a.train?.train_id || `Train #${a.train_id}`}
                        </span>
                      </div>
                      <span className={`badge ${
                        a.assignment_type === 'SERVICE' ? 'badge-success' :
                        a.assignment_type === 'STANDBY' ? 'badge-info' :
                        a.assignment_type?.includes('IBL') ? 'badge-warning' :
                        'badge-danger'
                      }`}>
                        {a.assignment_type?.replace('_', ' ')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="card p-12 text-center">
              <FlaskConical className="w-16 h-16 text-slate-700 mx-auto" />
              <h3 className="text-lg font-display font-semibold text-white mt-4">
                Configure Your Scenario
              </h3>
              <p className="text-slate-400 text-sm mt-2 max-w-sm mx-auto">
                Select trains to mark as unavailable, force to IBL, or adjust priority weights, 
                then click "Run Scenario" to see the comparison.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

