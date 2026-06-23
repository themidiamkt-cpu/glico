import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'
import type { GlucoseReading } from '../types/database'
import { contextoLabels } from '../types/database'

function valueBadge(v: number) {
  if (v < 70) return 'badge-danger'
  if (v <= 130) return 'badge-success'
  if (v <= 180) return 'badge-warning'
  return 'badge-danger'
}

function valueLabel(v: number) {
  if (v < 70) return 'Hipo'
  if (v <= 130) return 'Alvo'
  if (v <= 180) return 'Atenção'
  return 'Alto'
}

export default function GlicemiaList() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [readings, setReadings] = useState<GlucoseReading[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      if (!user) return
      const { data } = await supabase
        .from('glucose_readings')
        .select('*')
        .eq('user_id', user.id)
        .order('medido_em', { ascending: false })
        .limit(60)
      if (data) setReadings(data as GlucoseReading[])
      setLoading(false)
    }
    load()
  }, [user])

  // Chart: last 14 readings ordered asc for display
  const chartData = [...readings]
    .slice(0, 20)
    .reverse()
    .map(r => ({
      label: format(new Date(r.medido_em), 'dd/MM HH:mm'),
      value: r.valor_mg_dl,
      contexto: r.contexto,
    }))

  // Stats
  const values = readings.map(r => r.valor_mg_dl)
  const avg = values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : null
  const min = values.length ? Math.min(...values) : null
  const max = values.length ? Math.max(...values) : null
  const fastingReadings = readings.filter(r => r.contexto === 'jejum')
  const fastingAvg = fastingReadings.length
    ? Math.round(fastingReadings.reduce((a, r) => a + r.valor_mg_dl, 0) / fastingReadings.length)
    : null

  return (
    <Layout
      title="Glicemia"
      headerRight={
        <button
          onClick={() => navigate('/glicemia/nova')}
          className="bg-primary text-white text-sm font-semibold px-4 py-2 rounded-2xl active:scale-95 transition-all"
        >
          + Novo
        </button>
      }
    >
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Stats */}
          {readings.length > 0 && (
            <div className="card mb-4">
              <p className="text-muted text-xs font-medium uppercase tracking-wide mb-3">Resumo ({readings.length} registros)</p>
              <div className="grid grid-cols-4 gap-2 text-center">
                {[
                  { label: 'Média', val: avg },
                  { label: 'Jejum', val: fastingAvg },
                  { label: 'Min', val: min },
                  { label: 'Max', val: max },
                ].map(s => (
                  <div key={s.label}>
                    <p className="text-xl font-bold text-gray-900">{s.val ?? '-'}</p>
                    <p className="text-xs text-muted">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Chart */}
          {chartData.length > 2 && (
            <div className="card mb-4">
              <p className="text-muted text-xs font-medium uppercase tracking-wide mb-3">Últimas medições</p>
              <ResponsiveContainer width="100%" height={140}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E0D8" />
                  <XAxis dataKey="label" tick={false} axisLine={false} tickLine={false} />
                  <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10, fill: '#8A8A8A' }} axisLine={false} tickLine={false} width={35} />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E5E0D8', boxShadow: 'none' }}
                    formatter={(v: number) => [`${v} mg/dL`, 'Glicemia']}
                  />
                  <ReferenceLine y={70} stroke="#DC2626" strokeDasharray="3 3" />
                  <ReferenceLine y={180} stroke="#D97706" strokeDasharray="3 3" />
                  <Line type="monotone" dataKey="value" stroke="#1B6B5E" strokeWidth={2.5} dot={{ r: 3, fill: '#1B6B5E' }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
              <p className="text-muted text-xs mt-2">Linhas de referência: 70 (hipo) e 180 mg/dL. Alvo real definido pelo seu médico.</p>
            </div>
          )}

          {/* List */}
          {readings.length === 0 ? (
            <div className="card text-center py-12">
              <p className="text-4xl mb-3">💉</p>
              <p className="text-gray-500 font-medium">Nenhum registro ainda</p>
              <p className="text-muted text-sm mt-1 mb-5">Registre sua primeira glicemia</p>
              <button onClick={() => navigate('/glicemia/nova')} className="btn-primary">
                Registrar agora
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {readings.map(r => (
                <div key={r.id} className="card flex items-center gap-3 py-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                    r.valor_mg_dl < 70 ? 'bg-red-50' :
                    r.valor_mg_dl <= 130 ? 'bg-emerald-50' :
                    r.valor_mg_dl <= 180 ? 'bg-amber-50' : 'bg-red-50'
                  }`}>
                    <span className={`text-lg font-bold ${
                      r.valor_mg_dl < 70 ? 'text-danger' :
                      r.valor_mg_dl <= 130 ? 'text-success' :
                      r.valor_mg_dl <= 180 ? 'text-warning' : 'text-danger'
                    }`}>{r.valor_mg_dl}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-semibold ${valueBadge(r.valor_mg_dl)} px-2 py-0.5 rounded-full`}>
                        {valueLabel(r.valor_mg_dl)}
                      </span>
                      <span className="text-xs text-muted truncate">{contextoLabels[r.contexto]}</span>
                    </div>
                    <p className="text-xs text-muted mt-0.5">
                      {format(new Date(r.medido_em), "EEEE, d MMM · HH:mm", { locale: ptBR })}
                    </p>
                    {r.como_se_sentiu && (
                      <p className="text-xs text-muted truncate">{r.como_se_sentiu}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </Layout>
  )
}
