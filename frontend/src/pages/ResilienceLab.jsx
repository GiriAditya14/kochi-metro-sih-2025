import { useMemo, useState } from 'react'
import {
  Shield,
  PlugZap,
  Activity,
  AlertTriangle,
  Repeat,
  ShieldCheck,
  ServerCrash,
  Sparkles,
  Zap,
  Users,
  LineChart,
  RefreshCcw,
  ClipboardCheck
} from 'lucide-react'

const AGENTS = [
  {
    id: 'demand',
    name: 'Passenger Demand Forecaster',
    description: 'Predicts station load and adjusts headway',
    fallback: 'Falls back to fixed 8–10 min headway using historical peaks',
    icon: Users,
    color: 'from-blue-500 to-cyan-500',
    impact: { resilience: -12, crowding: 22 }
  },
  {
    id: 'energy',
    name: 'Energy Optimizer',
    description: 'Coasting, regen and HVAC tuning per consist',
    fallback: 'Locks to eco HVAC + regen on; coasting profiles cached',
    icon: Zap,
    color: 'from-amber-500 to-orange-500',
    impact: { resilience: -10, energy: -25 }
  },
  {
    id: 'shunting',
    name: 'Shunting Planner',
    description: 'Re-sequences moves at depot based on blocks',
    fallback: 'Switches to rule-based: shortest-block-first + safety buffer',
    icon: Activity,
    color: 'from-purple-500 to-pink-500',
    impact: { resilience: -15, availability: -18 }
  },
  {
    id: 'branding',
    name: 'Branding Compliance',
    description: 'Ensures contracts & penalties per rake',
    fallback: 'Applies static whitelist and caps penalty exposure at 30%',
    icon: LineChart,
    color: 'from-emerald-500 to-teal-500',
    impact: { resilience: -6, revenue: -15 }
  },
  {
    id: 'alerts',
    name: 'Alerting & Escalation',
    description: 'Auto-raises blocking issues to OCC/maintenance',
    fallback: 'Local rules: duplicate after 3 mins; SMS/WhatsApp fan-out',
    icon: AlertTriangle,
    color: 'from-red-500 to-orange-500',
    impact: { resilience: -18, detection: -35 }
  },
  {
    id: 'llm',
    name: 'LLM Reasoner',
    description: 'Summaries and explanations for judges/ops',
    fallback: 'Rule-engine summaries only; no generative text',
    icon: Sparkles,
    color: 'from-indigo-500 to-blue-500',
    impact: { resilience: -5, narrative: -25 }
  }
]

const rulebook = [
  'Depot safety rules stay priority over energy or branding goals.',
  'Headway never exceeds 10 mins even if demand agent is down.',
  'IBL/cleaning/fleet health constraints are honored before revenue.',
  'If alerting fails, local retry + multi-channel SMS is activated.',
  'If LLM is down, deterministic rule summaries are displayed.'
]

const impactToBadge = (value) => {
  if (value >= 85) return 'bg-emerald-500/15 text-emerald-200 border-emerald-500/40'
  if (value >= 65) return 'bg-amber-500/15 text-amber-100 border-amber-500/40'
  return 'bg-red-500/15 text-red-100 border-red-500/40'
}

function MetricCard({ label, value, suffix = '%', accent }) {
  return (
    <div className="card bg-slate-900/85 border border-slate-700/70">
      <div className="card-body">
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-200">{label}</p>
          <span className={`badge border ${impactToBadge(value)}`}>{value}{suffix}</span>
        </div>
        <div className="mt-2 text-3xl font-display font-bold text-white drop-shadow">{value}{suffix}</div>
        <div className="mt-3 h-2 rounded-full bg-slate-800 overflow-hidden border border-slate-700/80">
          <div
            className="h-full rounded-full transition-all shadow"
            style={{
              width: `${Math.min(value, 100)}%`,
              background: accent || 'linear-gradient(90deg,#6366f1,#22d3ee)'
            }}
          />
        </div>
      </div>
    </div>
  )
}

function AgentCard({ agent, isDown, onToggle }) {
  const Icon = agent.icon
  return (
    <div
      className={`border rounded-xl p-4 bg-slate-900/85 ${
        isDown ? 'border-red-500/50 shadow-lg shadow-red-900/30' : 'border-slate-700/60 shadow-md shadow-black/20'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${agent.color} flex items-center justify-center`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-semibold text-slate-50 drop-shadow-sm">{agent.name}</p>
            <p className="text-xs text-slate-200">{agent.description}</p>
          </div>
        </div>
        <button
          onClick={onToggle}
          className={`px-3 py-1.5 text-xs rounded-full border transition ${
            isDown
              ? 'bg-red-500/20 text-red-200 border-red-500/40'
              : 'bg-emerald-500/15 text-emerald-200 border-emerald-500/40'
          }`}
        >
          {isDown ? 'Restore' : 'Simulate Down'}
        </button>
      </div>
      <div className="mt-3 text-xs text-slate-200">
        <span className="font-medium text-slate-100">Fallback:</span> {agent.fallback}
      </div>
    </div>
  )
}

export default function ResilienceLab() {
  const [downAgents, setDownAgents] = useState([])
  const [decisions, setDecisions] = useState([])

  const toggleAgent = (id) => {
    setDownAgents((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const chaos = () => {
    const ids = AGENTS.map((a) => a.id)
    const pick = ids.filter(() => Math.random() > 0.55)
    setDownAgents(pick.length ? pick : [ids[Math.floor(Math.random() * ids.length)]])
  }

  const reset = () => setDownAgents([])

  const runLocalRules = () => {
    const applied = [
      {
        title: 'Headway & Service',
        decision: downAgents.includes('demand')
          ? 'Lock to 8-10 min headway using peak-hour playbook; hold standby rakes ready.'
          : 'Dynamic headway stays adaptive to demand forecasts.'
      },
      {
        title: 'Energy & HVAC',
        decision: downAgents.includes('energy')
          ? 'Force ECO HVAC, keep regen ON, apply cached coasting curves to save ~18%.'
          : 'Optimizer tunes HVAC + coasting live per load.'
      },
      {
        title: 'Depot & Shunting',
        decision: downAgents.includes('shunting')
          ? 'Switch to rule-based shortest-block-first with 2-min safety buffer.'
          : 'LLM-assisted shunting keeps minimizing moves and conflicts.'
      },
      {
        title: 'Alerting & Escalation',
        decision: downAgents.includes('alerts')
          ? 'Enable local retry, duplicate after 3 min, SMS/WhatsApp fan-out to OCC.'
          : 'Central alerting runs with normal dedup and routing.'
      },
      {
        title: 'Branding & Revenue',
        decision: downAgents.includes('branding')
          ? 'Apply static whitelist; cap penalty exposure at 30% until agent is back.'
          : 'Live compliance engine balances revenue vs. ops.'
      },
      {
        title: 'Narratives & Briefings',
        decision: downAgents.includes('llm')
          ? 'Show deterministic rule summaries only (no generative text).'
          : 'LLM produces judge-facing narratives and explanations.'
      }
    ]
    setDecisions(applied)
  }

  const impact = useMemo(() => {
    let resilience = 96
    let coverage = 94
    let revenue = 90
    let crowding = 12
    let energy = 88
    let narrative = 100
    let detection = 95
    let availability = 92

    downAgents.forEach((id) => {
      const agent = AGENTS.find((a) => a.id === id)
      if (!agent) return
      resilience += agent.impact?.resilience || 0
      energy = Math.max(40, energy + (agent.impact?.energy || 0))
      revenue = Math.max(40, revenue + (agent.impact?.revenue || 0))
      crowding += agent.impact?.crowding || 0
      narrative = Math.max(30, narrative + (agent.impact?.narrative || 0))
      detection = Math.max(30, detection + (agent.impact?.detection || 0))
      availability = Math.max(40, availability + (agent.impact?.availability || 0))
      coverage = Math.max(50, coverage + ((agent.id === 'alerts' ? -30 : 0)))
    })

    const clampedResilience = Math.max(40, Math.min(100, resilience))
    const overloadRisk = Math.min(99, Math.max(5, crowding))

    return {
      resilience: clampedResilience,
      coverage,
      revenue,
      crowdingRisk: overloadRisk,
      energy,
      narrative,
      detection,
      availability
    }
  }, [downAgents])

  const outageCopy = downAgents.length
    ? `${downAgents.length} agent${downAgents.length > 1 ? 's' : ''} deliberately taken down`
    : 'All agents healthy — test a failure to see fallbacks'

  return (
    <div className="space-y-6 animate-in">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center shadow-lg">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold text-white drop-shadow">Resilience Lab</h1>
              <p className="text-slate-200 text-sm">{outageCopy}</p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-200">
            <span className="badge border border-emerald-500/50 bg-emerald-500/15 text-emerald-100">
              Local constraints always active
            </span>
            <span className="badge border border-blue-500/50 bg-blue-500/15 text-blue-100">
              No backend calls — instant demo
            </span>
            <span className="badge border border-purple-500/50 bg-purple-500/15 text-purple-100">
              Multi-agent shutdown demo
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={chaos} className="btn btn-secondary">
            <Repeat className="w-4 h-4" />
            Chaos Mode
          </button>
          <button onClick={reset} className="btn btn-ghost">
            <RefreshCcw className="w-4 h-4" />
            Reset
          </button>
          <button onClick={runLocalRules} className="btn btn-primary">
            <ClipboardCheck className="w-4 h-4" />
            Apply Local Rules
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard label="Overall Resilience" value={impact.resilience} accent='linear-gradient(90deg,#10b981,#22d3ee)' />
        <MetricCard label="Safety & Constraint Coverage" value={impact.coverage} accent='linear-gradient(90deg,#6366f1,#a855f7)' />
        <MetricCard label="Revenue/Branding Protection" value={impact.revenue} accent='linear-gradient(90deg,#f97316,#f59e0b)' />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="col-span-2 space-y-3">
          {AGENTS.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              isDown={downAgents.includes(agent.id)}
              onToggle={() => toggleAgent(agent.id)}
            />
          ))}
        </div>

        <div className="space-y-4">
          <div className="card bg-slate-900/85 border border-slate-700/60">
            <div className="card-header flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-300" />
              <h3 className="font-semibold text-white text-sm">Local Constraint Rules</h3>
            </div>
            <div className="card-body space-y-2">
              {rulebook.map((rule, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/25 text-emerald-100 flex items-center justify-center text-xs border border-emerald-500/40">
                    {idx + 1}
                  </div>
                  <p className="text-sm text-slate-100">{rule}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="card bg-slate-900/85 border border-slate-700/60">
            <div className="card-header flex items-center gap-2">
              <ServerCrash className="w-4 h-4 text-red-300" />
              <h3 className="font-semibold text-white text-sm">What breaks?</h3>
            </div>
            <div className="card-body space-y-3 text-sm text-slate-100">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-300" />
                <span>{impact.crowdingRisk}% risk of crowding if demand + alerting are down.</span>
              </div>
              <div className="flex items-center gap-2">
                <PlugZap className="w-4 h-4 text-amber-300" />
                <span>Energy savings drops to {impact.energy}% if optimizer is off.</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-200" />
                <span>Narratives fall back to rule-based summaries (LLM off).</span>
              </div>
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-purple-200" />
                <span>Depot move reliability {impact.availability}% with rule-based shunting.</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-200" />
                <span>Detection coverage {impact.detection}% if alerting agent fails.</span>
              </div>
            </div>
          </div>

          {decisions.length > 0 && (
            <div className="card bg-slate-900/90 border border-emerald-500/40">
              <div className="card-header flex items-center gap-2">
                <ClipboardCheck className="w-4 h-4 text-emerald-300" />
                <h3 className="font-semibold text-white text-sm">Local Rule Decisions</h3>
              </div>
              <div className="card-body space-y-3">
                {decisions.map((item, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-slate-800/70 border border-slate-700/70">
                    <p className="text-xs uppercase tracking-wide text-emerald-300">{item.title}</p>
                    <p className="text-sm text-slate-100 mt-1">{item.decision}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

