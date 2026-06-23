import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { format, subDays, startOfDay, endOfDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'
import type { GlucoseReading, WeightLog, WorkoutLog, DailyChecklist } from '../types/database'

interface GlucoseSummary {
  lastReading: GlucoseReading | null
  fastingAvg7d: number | null
  trend: { date: string; value: number }[]
}

function glucoseColor(v: number) {
  if (v < 70) return 'text-danger'
  if (v <= 180) return 'text-success'
  if (v <= 250) return 'text-warning'
  return 'text-danger'
}

function glucoseBg(v: number) {
  if (v < 70) return 'bg-red-50'
  if (v <= 130) return 'bg-emerald-50'
  if (v <= 180) return 'bg-amber-50'
  return 'bg-red-50'
}

const checklistItems: { key: keyof DailyChecklist; label: string; emoji: string }[] = [
  { key: 'agua_litros', label: '2L de água', emoji: '💧' },
  { key: 'treino_feito', label: 'Treino feito', emoji: '🏋️' },
  { key: 'whey', label: 'Whey tomado', emoji: '🥤' },
  { key: 'caminhada_pos_refeicao', label: 'Caminhada pós-refeição', emoji: '🚶' },
  { key: 'sem_doce', label: 'Sem doce hoje', emoji: '🚫' },
]

export default function Dashboard() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()
  const today = format(new Date(), 'yyyy-MM-dd')

  const [glucose, setGlucose] = useState<GlucoseSummary>({ lastReading: null, fastingAvg7d: null, trend: [] })
  const [weightLog, setWeightLog] = useState<WeightLog | null>(null)
  const [initialWeight, setInitialWeight] = useState<WeightLog | null>(null)
  const [todayWorkout, setTodayWorkout] = useState<WorkoutLog | null>(null)
  const [checklist, setChecklist] = useState<DailyChecklist | null>(null)
  const [checklistId, setChecklistId] = useState<string | null>(null)
  const [loadingToggle, setLoadingToggle] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!user) return

    // Glucose: last reading + 7d fasting avg + trend
    const since = subDays(new Date(), 13).toISOString()
    const { data: readings } = await supabase
      .from('glucose_readings')
      .select('*')
      .eq('user_id', user.id)
      .gte('medido_em', since)
      .order('medido_em', { ascending: false })

    if (readings && readings.length > 0) {
      const last = readings[0] as GlucoseReading
      const fasting = (readings as GlucoseReading[]).filter(r => r.contexto === 'jejum')
      const avg7d = fasting.length > 0
        ? Math.round(fasting.reduce((s, r) => s + r.valor_mg_dl, 0) / fasting.length)
        : null

      // Build trend (all readings by date)
      const byDate: Record<string, number[]> = {}
      ;(readings as GlucoseReading[]).forEach(r => {
        const d = format(new Date(r.medido_em), 'dd/MM')
        if (!byDate[d]) byDate[d] = []
        byDate[d].push(r.valor_mg_dl)
      })
      const trend = Object.entries(byDate)
        .map(([date, vals]) => ({ date, value: Math.round(vals.reduce((s, v) => s + v, 0) / vals.length) }))
        .reverse()

      setGlucose({ lastReading: last, fastingAvg7d: avg7d, trend })
    }

    // Weight: most recent + initial
    const { data: weights } = await supabase
      .from('weight_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('data', { ascending: false })
      .limit(10)

    if (weights && weights.length > 0) {
      setWeightLog(weights[0] as WeightLog)
      setInitialWeight(weights[weights.length - 1] as WeightLog)
    }

    // Workout today
    const { data: wk } = await supabase
      .from('workout_logs')
      .select('*')
      .eq('user_id', user.id)
      .gte('data', format(startOfDay(new Date()), 'yyyy-MM-dd'))
      .lte('data', format(endOfDay(new Date()), 'yyyy-MM-dd'))
      .limit(1)

    if (wk && wk.length > 0) setTodayWorkout(wk[0] as WorkoutLog)

    // Checklist today
    const { data: cl } = await supabase
      .from('daily_checklist')
      .select('*')
      .eq('user_id', user.id)
      .eq('data', today)
      .single()

    if (cl) {
      setChecklist(cl as DailyChecklist)
      setChecklistId(cl.id)
    } else {
      // Auto-create today's checklist
      const { data: newCl } = await supabase
        .from('daily_checklist')
        .insert({ user_id: user.id, data: today })
        .select()
        .single()
      if (newCl) {
        setChecklist(newCl as DailyChecklist)
        setChecklistId(newCl.id)
      }
    }
  }, [user, today])

  useEffect(() => { load() }, [load])

  const toggleChecklist = async (key: keyof DailyChecklist) => {
    if (!user || !checklist) return
    setLoadingToggle(key as string)
    const current = checklist[key]
    const newVal = key === 'agua_litros'
      ? (current ? 0 : 2)
      : !current

    // Optimistic update
    setChecklist(prev => prev ? { ...prev, [key]: newVal } : prev)

    if (checklistId) {
      await supabase
        .from('daily_checklist')
        .update({ [key]: newVal })
        .eq('id', checklistId)
    }
    setLoadingToggle(null)
  }

  const markWorkoutDone = async () => {
    if (!todayWorkout) return
    await supabase
      .from('workout_logs')
      .update({ concluido: true })
      .eq('id', todayWorkout.id)
    setTodayWorkout(prev => prev ? { ...prev, concluido: true } : prev)
    // Also check checklist
    if (checklist && checklistId) {
      await supabase.from('daily_checklist').update({ treino_feito: true }).eq('id', checklistId)
      setChecklist(prev => prev ? { ...prev, treino_feito: true } : prev)
    }
  }

  const firstName = profile?.nome?.split(' ')[0] || 'Você'
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'
  const dateStr = format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })

  const weightDiff = weightLog && initialWeight && initialWeight.peso_kg && weightLog.peso_kg
    ? (weightLog.peso_kg - initialWeight.peso_kg).toFixed(1)
    : null

  return (
    <Layout
      noNav={false}
      headerRight={
        <button onClick={signOut} className="text-muted text-sm py-1 px-3 rounded-xl active:bg-border transition-colors">
          Sair
        </button>
      }
    >
      {/* Greeting */}
      <div className="mb-6">
        <p className="text-muted text-sm capitalize">{dateStr}</p>
        <h2 className="text-2xl font-bold text-gray-900 mt-0.5">{greeting}, {firstName} 👋</h2>
      </div>

      {/* Glicemia card */}
      <div className="card mb-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-muted text-xs font-medium uppercase tracking-wide">Última glicemia</p>
            {glucose.lastReading ? (
              <div className="flex items-baseline gap-2 mt-1">
                <span className={`text-4xl font-bold ${glucoseColor(glucose.lastReading.valor_mg_dl)}`}>
                  {glucose.lastReading.valor_mg_dl}
                </span>
                <span className="text-muted text-sm">mg/dL</span>
              </div>
            ) : (
              <p className="text-gray-400 text-sm mt-1">Nenhum registro ainda</p>
            )}
            {glucose.lastReading && (
              <p className="text-muted text-xs mt-1">
                {format(new Date(glucose.lastReading.medido_em), "HH:mm 'de' dd/MM")}
                {' · '}{glucose.lastReading.contexto.replace(/_/g, ' ')}
              </p>
            )}
          </div>
          {glucose.fastingAvg7d && (
            <div className="text-right">
              <p className="text-muted text-xs font-medium uppercase tracking-wide">Média jejum 7d</p>
              <p className="text-2xl font-bold text-gray-700 mt-1">{glucose.fastingAvg7d}</p>
              <p className="text-muted text-xs">mg/dL</p>
            </div>
          )}
        </div>

        {/* Trend chart */}
        {glucose.trend.length > 2 && (
          <div className="mt-3">
            <p className="text-muted text-xs mb-2">Tendência (média diária)</p>
            <ResponsiveContainer width="100%" height={60}>
              <LineChart data={glucose.trend}>
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#1B6B5E"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: '#1B6B5E' }}
                />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E5E0D8', boxShadow: 'none' }}
                  formatter={(v: number) => [`${v} mg/dL`, '']}
                  labelFormatter={(l) => l}
                />
              </LineChart>
            </ResponsiveContainer>
            <p className="text-muted text-xs mt-1">Foco na tendência, não no valor isolado.</p>
          </div>
        )}

        <button
          onClick={() => navigate('/glicemia/nova')}
          className="btn-primary mt-4"
        >
          Registrar glicemia
        </button>
      </div>

      {/* Peso card */}
      <div className="card mb-4">
        <p className="text-muted text-xs font-medium uppercase tracking-wide mb-3">Peso e medidas</p>
        <div className="flex gap-4">
          {weightLog?.peso_kg && (
            <div>
              <p className="text-2xl font-bold text-gray-900">{weightLog.peso_kg}<span className="text-base font-normal text-muted"> kg</span></p>
              <p className="text-xs text-muted">Peso atual</p>
              {weightDiff && (
                <p className={`text-xs font-medium mt-0.5 ${Number(weightDiff) < 0 ? 'text-success' : 'text-muted'}`}>
                  {Number(weightDiff) < 0 ? '' : '+'}{weightDiff} kg desde o início
                </p>
              )}
            </div>
          )}
          {weightLog?.cintura_cm && (
            <div className="border-l border-border pl-4">
              <p className="text-2xl font-bold text-gray-900">{weightLog.cintura_cm}<span className="text-base font-normal text-muted"> cm</span></p>
              <p className="text-xs text-muted">Cintura</p>
            </div>
          )}
          {!weightLog?.peso_kg && (
            <p className="text-gray-400 text-sm">Nenhum registro ainda</p>
          )}
        </div>
        {!weightLog && (
          <button onClick={() => navigate('/peso')} className="btn-secondary mt-3">
            Registrar peso
          </button>
        )}
      </div>

      {/* Treino card */}
      <div className="card mb-4">
        <p className="text-muted text-xs font-medium uppercase tracking-wide mb-3">Treino de hoje</p>
        {todayWorkout ? (
          <div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-primary-50 flex items-center justify-center">
                <span className="text-primary font-bold text-lg">
                  {todayWorkout.treino === 'corrida' ? '🏃' : todayWorkout.treino}
                </span>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">
                  {todayWorkout.treino === 'corrida' ? 'Corrida' : `Treino ${todayWorkout.treino}`}
                </p>
                <p className="text-muted text-xs">
                  Semana {todayWorkout.semana} · {todayWorkout.fase?.replace('_', ' ')}
                </p>
              </div>
              {todayWorkout.concluido && (
                <span className="badge-success">Feito ✓</span>
              )}
            </div>
            {!todayWorkout.concluido && (
              <button onClick={markWorkoutDone} className="btn-secondary mt-3">
                Marcar como concluído
              </button>
            )}
          </div>
        ) : (
          <div>
            <p className="text-gray-400 text-sm mb-3">Nenhum treino cadastrado para hoje.</p>
            <button onClick={() => navigate('/treino')} className="btn-secondary">
              Ir para Treino
            </button>
          </div>
        )}
      </div>

      {/* Checklist */}
      <div className="card mb-4">
        <p className="text-muted text-xs font-medium uppercase tracking-wide mb-1">Checklist do dia</p>
        <p className="text-muted text-xs mb-3">
          {checklist
            ? (() => {
                const done = checklistItems.filter(i => !!checklist[i.key]).length
                return `${done}/${checklistItems.length} itens`
              })()
            : 'Carregando...'}
        </p>
        <div className="divide-y divide-border">
          {checklistItems.map(item => {
            const checked = !!(checklist && checklist[item.key])
            return (
              <div key={item.key} className="toggle-row">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{item.emoji}</span>
                  <span className={`text-sm font-medium ${checked ? 'line-through text-muted' : 'text-gray-900'}`}>
                    {item.label}
                  </span>
                </div>
                <button
                  onClick={() => toggleChecklist(item.key)}
                  disabled={loadingToggle === item.key}
                  className={`w-12 h-7 rounded-full transition-colors duration-200 flex-shrink-0 ${
                    checked ? 'bg-primary' : 'bg-border'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 mx-1 ${
                    checked ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </Layout>
  )
}
