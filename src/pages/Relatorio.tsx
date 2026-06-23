import { useEffect, useState, useRef } from 'react'
import { format, subDays, startOfDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'
import type { GlucoseReading, WeightLog, WorkoutLog, DailyChecklist } from '../types/database'
import { contextoLabels } from '../types/database'

interface ReportData {
  glucose: GlucoseReading[]
  weights: WeightLog[]
  workouts: WorkoutLog[]
  checklists: DailyChecklist[]
}

function avg(nums: number[]) {
  return nums.length ? Math.round(nums.reduce((a, b) => a + b, 0) / nums.length) : null
}

export default function Relatorio() {
  const { user, profile } = useAuth()
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [printing, setPrinting] = useState(false)
  const reportRef = useRef<HTMLDivElement>(null)
  const since = startOfDay(subDays(new Date(), 6)).toISOString()
  const sinceDate = format(subDays(new Date(), 6), 'yyyy-MM-dd')
  const today = format(new Date(), 'yyyy-MM-dd')

  useEffect(() => {
    const load = async () => {
      if (!user) return
      const [g, w, wk, cl] = await Promise.all([
        supabase.from('glucose_readings').select('*').eq('user_id', user.id).gte('medido_em', since).order('medido_em'),
        supabase.from('weight_logs').select('*').eq('user_id', user.id).gte('data', sinceDate).order('data'),
        supabase.from('workout_logs').select('*').eq('user_id', user.id).gte('data', sinceDate).order('data'),
        supabase.from('daily_checklist').select('*').eq('user_id', user.id).gte('data', sinceDate).order('data'),
      ])
      setData({
        glucose: (g.data as GlucoseReading[]) || [],
        weights: (w.data as WeightLog[]) || [],
        workouts: (wk.data as WorkoutLog[]) || [],
        checklists: (cl.data as DailyChecklist[]) || [],
      })
      setLoading(false)
    }
    load()
  }, [user])

  const handlePrint = async () => {
    setPrinting(true)
    const { default: jsPDF } = await import('jspdf')
    const { default: html2canvas } = await import('html2canvas')

    if (!reportRef.current) { setPrinting(false); return }

    const canvas = await html2canvas(reportRef.current, {
      scale: 2,
      backgroundColor: '#F5F3F0',
      useCORS: true,
    })

    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const pageWidth = 210
    const pageHeight = (canvas.height * pageWidth) / canvas.width

    let heightLeft = pageHeight
    let position = 0

    pdf.addImage(imgData, 'PNG', 0, position, pageWidth, pageHeight)
    heightLeft -= 297

    while (heightLeft > 0) {
      position = heightLeft - pageHeight
      pdf.addPage()
      pdf.addImage(imgData, 'PNG', 0, position, pageWidth, pageHeight)
      heightLeft -= 297
    }

    const dateStr = format(new Date(), 'yyyy-MM-dd')
    pdf.save(`glico-relatorio-${dateStr}.pdf`)
    setPrinting(false)
  }

  if (loading) {
    return (
      <Layout title="Relatório Semanal">
        <div className="flex items-center justify-center h-40">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    )
  }

  if (!data) return null

  // Compute stats
  const byContexto: Record<string, number[]> = {}
  data.glucose.forEach(r => {
    if (!byContexto[r.contexto]) byContexto[r.contexto] = []
    byContexto[r.contexto].push(r.valor_mg_dl)
  })

  const allValues = data.glucose.map(r => r.valor_mg_dl)
  const globalAvg = avg(allValues)
  const outOfRange = data.glucose.filter(r => r.valor_mg_dl > 180 || r.valor_mg_dl < 70)
  const highReadings = data.glucose.filter(r => r.valor_mg_dl > 250)

  const workoutsDone = data.workouts.filter(w => w.concluido).length
  const totalWorkouts = data.workouts.length

  const checklistScore = data.checklists.length > 0
    ? (() => {
        const keys: (keyof DailyChecklist)[] = ['agua_litros', 'treino_feito', 'whey', 'caminhada_pos_refeicao', 'sem_doce']
        const possible = data.checklists.length * keys.length
        const done = data.checklists.reduce((acc, cl) => {
          return acc + keys.filter(k => !!cl[k]).length
        }, 0)
        return Math.round((done / possible) * 100)
      })()
    : null

  const latestWeight = data.weights[data.weights.length - 1]
  const firstWeight = data.weights[0]
  const weekWeightDiff = latestWeight?.peso_kg && firstWeight?.peso_kg && latestWeight.id !== firstWeight.id
    ? (latestWeight.peso_kg - firstWeight.peso_kg).toFixed(1)
    : null
  const weekWaistDiff = latestWeight?.cintura_cm && firstWeight?.cintura_cm && latestWeight.id !== firstWeight.id
    ? (latestWeight.cintura_cm - firstWeight.cintura_cm).toFixed(1)
    : null

  return (
    <Layout
      title="Relatório Semanal"
      headerRight={
        <button
          onClick={handlePrint}
          disabled={printing}
          className="bg-primary text-white text-sm font-semibold px-4 py-2 rounded-2xl active:scale-95 transition-all disabled:opacity-50"
        >
          {printing ? 'Gerando...' : 'Baixar PDF'}
        </button>
      }
    >
      <div ref={reportRef} className="space-y-4">
        {/* Header */}
        <div className="card bg-primary text-white">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 32 32" fill="none">
                <path d="M16 4L16 28M16 4C16 4 10 11 10 17C10 20.314 12.686 23 16 23C19.314 23 22 20.314 22 17C22 11 16 4 16 4Z"
                  stroke="white" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <p className="text-white/70 text-xs">Relatório Semanal</p>
              <p className="font-bold text-white">Glico</p>
            </div>
          </div>
          <p className="text-white font-semibold mt-2">
            {format(subDays(new Date(), 6), "d 'de' MMM", { locale: ptBR })} a {format(new Date(), "d 'de' MMM 'de' yyyy", { locale: ptBR })}
          </p>
          {profile?.nome && <p className="text-white/80 text-sm mt-0.5">Paciente: {profile.nome}</p>}
          {profile?.medicacao && <p className="text-white/70 text-xs mt-1">Medicação: {profile.medicacao}</p>}
          <p className="text-white/50 text-xs mt-3 leading-relaxed">
            Este relatório é gerado automaticamente pelo app Glico e não substitui a avaliação médica. Use como referência na sua consulta.
          </p>
        </div>

        {/* Glicemia por contexto */}
        <div className="card">
          <p className="text-muted text-xs font-medium uppercase tracking-wide mb-4">Glicemia por contexto</p>
          {Object.keys(byContexto).length === 0 ? (
            <p className="text-muted text-sm">Nenhum registro de glicemia na semana.</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(byContexto).map(([ctx, vals]) => {
                const a = avg(vals)!
                const label = contextoLabels[ctx as keyof typeof contextoLabels] ?? ctx
                return (
                  <div key={ctx} className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900">{label}</p>
                        <p className="text-sm font-bold text-gray-900">{a} mg/dL</p>
                      </div>
                      <div className="mt-1 h-1.5 bg-border rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${a < 70 ? 'bg-danger' : a <= 130 ? 'bg-success' : a <= 180 ? 'bg-warning' : 'bg-danger'}`}
                          style={{ width: `${Math.min((a / 400) * 100, 100)}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted mt-0.5">{vals.length} leitura{vals.length > 1 ? 's' : ''} · min {Math.min(...vals)} / max {Math.max(...vals)}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {globalAvg && (
            <div className="mt-4 pt-4 border-t border-border flex justify-between">
              <span className="text-sm font-medium text-gray-700">Média geral da semana</span>
              <span className="text-sm font-bold text-gray-900">{globalAvg} mg/dL</span>
            </div>
          )}
        </div>

        {/* Alertas */}
        {(outOfRange.length > 0 || highReadings.length > 0) && (
          <div className="card">
            <p className="text-muted text-xs font-medium uppercase tracking-wide mb-3">Leituras fora da faixa</p>
            {outOfRange.slice(0, 8).map(r => (
              <div key={r.id} className={`flex items-center justify-between py-2 border-b border-border last:border-0 ${r.valor_mg_dl < 70 ? 'text-danger' : 'text-warning'}`}>
                <span className="text-sm">{format(new Date(r.medido_em), "dd/MM HH:mm")} · {contextoLabels[r.contexto]}</span>
                <span className="text-sm font-bold">{r.valor_mg_dl}</span>
              </div>
            ))}
            {outOfRange.length > 8 && (
              <p className="text-muted text-xs mt-2">+ {outOfRange.length - 8} outras leituras</p>
            )}
          </div>
        )}

        {/* Peso */}
        <div className="card">
          <p className="text-muted text-xs font-medium uppercase tracking-wide mb-3">Peso e Medidas</p>
          {data.weights.length === 0 ? (
            <p className="text-muted text-sm">Nenhum registro de peso na semana.</p>
          ) : (
            <div className="space-y-2">
              {latestWeight?.peso_kg && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-700">Peso atual</span>
                  <span className="text-sm font-bold">
                    {latestWeight.peso_kg} kg
                    {weekWeightDiff && (
                      <span className={`ml-2 text-xs font-normal ${Number(weekWeightDiff) < 0 ? 'text-success' : 'text-warning'}`}>
                        ({Number(weekWeightDiff) > 0 ? '+' : ''}{weekWeightDiff} na semana)
                      </span>
                    )}
                  </span>
                </div>
              )}
              {latestWeight?.cintura_cm && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-700">Cintura</span>
                  <span className="text-sm font-bold">
                    {latestWeight.cintura_cm} cm
                    {weekWaistDiff && (
                      <span className={`ml-2 text-xs font-normal ${Number(weekWaistDiff) < 0 ? 'text-success' : 'text-warning'}`}>
                        ({Number(weekWaistDiff) > 0 ? '+' : ''}{weekWaistDiff} na semana)
                      </span>
                    )}
                  </span>
                </div>
              )}
              {profile?.hba1c_inicial && (
                <div className="flex justify-between pt-2 border-t border-border">
                  <span className="text-sm text-gray-700">HbA1c inicial</span>
                  <span className="text-sm font-bold">{profile.hba1c_inicial}%</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Treinos */}
        <div className="card">
          <p className="text-muted text-xs font-medium uppercase tracking-wide mb-3">Treinos</p>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-700">Treinos concluídos</span>
            <span className="text-sm font-bold">{workoutsDone}/{totalWorkouts}</span>
          </div>
          {data.workouts.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {data.workouts.map(w => (
                <div key={w.id} className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${
                  w.concluido ? 'bg-primary text-white' : 'bg-border text-muted'
                }`}>
                  {format(new Date(w.data + 'T12:00'), 'dd/MM')} · {w.treino === 'corrida' ? 'Corrida' : `Treino ${w.treino}`}
                  {w.concluido ? ' ✓' : ''}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted text-sm">Nenhum treino registrado na semana.</p>
          )}
        </div>

        {/* Checklist adesão */}
        <div className="card">
          <p className="text-muted text-xs font-medium uppercase tracking-wide mb-3">Adesão ao programa</p>
          {checklistScore !== null ? (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-700">Índice geral de adesão</span>
                <span className={`text-lg font-bold ${checklistScore >= 70 ? 'text-success' : checklistScore >= 40 ? 'text-warning' : 'text-danger'}`}>
                  {checklistScore}%
                </span>
              </div>
              <div className="h-2 bg-border rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${checklistScore >= 70 ? 'bg-success' : checklistScore >= 40 ? 'bg-warning' : 'bg-danger'}`}
                  style={{ width: `${checklistScore}%` }}
                />
              </div>
              <div className="mt-3 space-y-1">
                {(['agua_litros', 'treino_feito', 'whey', 'caminhada_pos_refeicao', 'sem_doce'] as (keyof DailyChecklist)[]).map(key => {
                  const doneCount = data.checklists.filter(c => !!c[key]).length
                  const labels: Record<string, string> = {
                    agua_litros: 'Hidratação (2L)',
                    treino_feito: 'Treino realizado',
                    whey: 'Whey tomado',
                    caminhada_pos_refeicao: 'Caminhada pós-refeição',
                    sem_doce: 'Sem doce',
                  }
                  return (
                    <div key={key} className="flex justify-between text-xs">
                      <span className="text-gray-600">{labels[key]}</span>
                      <span className="text-muted">{doneCount}/{data.checklists.length} dias</span>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <p className="text-muted text-sm">Nenhum checklist registrado.</p>
          )}
        </div>

        {/* Footer disclaimer */}
        <div className="card bg-primary-50">
          <p className="text-xs text-primary leading-relaxed">
            <strong>Importante:</strong> este relatório é gerado pelo app Glico e tem fins informativos. Ele não substitui a avaliação médica. Decisões sobre ajuste de medicação, metas glicêmicas e outros tratamentos são de responsabilidade exclusiva do seu médico endocrinologista.
          </p>
        </div>

        <div className="text-center text-xs text-muted pb-6">
          Gerado em {format(new Date(), "d 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })} pelo Glico
        </div>
      </div>
    </Layout>
  )
}
