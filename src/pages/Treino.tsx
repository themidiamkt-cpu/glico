import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'
import type { WorkoutLog, ExerciseLog, TreinoTipo, TreinoFase } from '../types/database'
import { treinoLabels, faseLabels, getWeekFase } from '../types/database'

const treinos: TreinoTipo[] = ['A', 'B', 'C', 'D', 'E', 'corrida']

interface NewWorkout {
  semana: number
  treino: TreinoTipo
  duracao: string
  observacao: string
}

interface ExerciseEntry {
  exercicio: string
  carga_kg: string
  series: string
  reps: string
}

export default function Treino() {
  const { user } = useAuth()
  const [logs, setLogs] = useState<WorkoutLog[]>([])
  const [exercises, setExercises] = useState<Record<string, ExerciseLog[]>>({})
  const [loading, setLoading] = useState(true)
  const [showNewForm, setShowNewForm] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [addingExercise, setAddingExercise] = useState<string | null>(null)
  const [newExercise, setNewExercise] = useState<ExerciseEntry>({ exercicio: '', carga_kg: '', series: '', reps: '' })

  const [newWorkout, setNewWorkout] = useState<NewWorkout>({
    semana: 1,
    treino: 'A',
    duracao: '',
    observacao: '',
  })

  const load = async () => {
    if (!user) return
    const { data } = await supabase
      .from('workout_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('data', { ascending: false })
      .limit(30)
    if (data) setLogs(data as WorkoutLog[])
    setLoading(false)
  }

  const loadExercises = async (workoutLogId: string) => {
    const { data } = await supabase
      .from('exercise_logs')
      .select('*')
      .eq('workout_log_id', workoutLogId)
    if (data) setExercises(prev => ({ ...prev, [workoutLogId]: data as ExerciseLog[] }))
  }

  useEffect(() => { load() }, [user])

  const toggleExpand = async (id: string) => {
    const next = expanded === id ? null : id
    setExpanded(next)
    if (next && !exercises[next]) await loadExercises(next)
  }

  const handleCreateWorkout = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    const fase: TreinoFase = getWeekFase(newWorkout.semana)
    const { data } = await supabase.from('workout_logs').insert({
      user_id: user.id,
      data: format(new Date(), 'yyyy-MM-dd'),
      semana: newWorkout.semana,
      fase,
      treino: newWorkout.treino,
      concluido: false,
      duracao_min: newWorkout.duracao ? Number(newWorkout.duracao) : null,
      observacao: newWorkout.observacao || null,
    }).select().single()

    if (data) {
      setLogs(prev => [data as WorkoutLog, ...prev])
      setShowNewForm(false)
      setExpanded(data.id)
    }
  }

  const markDone = async (log: WorkoutLog) => {
    await supabase.from('workout_logs').update({ concluido: true }).eq('id', log.id)
    setLogs(prev => prev.map(l => l.id === log.id ? { ...l, concluido: true } : l))
  }

  const addExercise = async (workoutLogId: string) => {
    if (!newExercise.exercicio) return
    const { data } = await supabase.from('exercise_logs').insert({
      workout_log_id: workoutLogId,
      exercicio: newExercise.exercicio,
      carga_kg: newExercise.carga_kg ? Number(newExercise.carga_kg) : null,
      series: newExercise.series ? Number(newExercise.series) : null,
      reps: newExercise.reps ? Number(newExercise.reps) : null,
    }).select().single()

    if (data) {
      setExercises(prev => ({
        ...prev,
        [workoutLogId]: [...(prev[workoutLogId] || []), data as ExerciseLog],
      }))
      setNewExercise({ exercicio: '', carga_kg: '', series: '', reps: '' })
      setAddingExercise(null)
    }
  }

  // Group by week
  const grouped: Record<number, WorkoutLog[]> = {}
  logs.forEach(l => {
    const w = l.semana ?? 0
    if (!grouped[w]) grouped[w] = []
    grouped[w].push(l)
  })

  const weekNumbers = Object.keys(grouped).map(Number).sort((a, b) => b - a)

  return (
    <Layout
      title="Treino"
      headerRight={
        <button
          onClick={() => setShowNewForm(true)}
          className="bg-primary text-white text-sm font-semibold px-4 py-2 rounded-2xl active:scale-95 transition-all"
        >
          + Treino
        </button>
      }
    >
      {/* New workout modal */}
      {showNewForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end px-0">
          <div className="bg-surface rounded-t-3xl w-full max-w-lg mx-auto p-5 pb-10 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold">Registrar treino de hoje</h2>
              <button onClick={() => setShowNewForm(false)} className="p-2 rounded-xl active:bg-border">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6L18 18" stroke="#8A8A8A" strokeWidth="2" strokeLinecap="round" /></svg>
              </button>
            </div>
            <form onSubmit={handleCreateWorkout} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Semana (1-12)</label>
                  <input
                    type="number" min="1" max="12" className="input-field"
                    value={newWorkout.semana}
                    onChange={e => setNewWorkout(p => ({ ...p, semana: Number(e.target.value) }))}
                    required
                  />
                  <p className="text-xs text-muted mt-1">{faseLabels[getWeekFase(newWorkout.semana)]}</p>
                </div>
                <div>
                  <label className="label">Duração (min)</label>
                  <input type="number" className="input-field" placeholder="60"
                    value={newWorkout.duracao}
                    onChange={e => setNewWorkout(p => ({ ...p, duracao: e.target.value }))} />
                </div>
              </div>

              <div>
                <label className="label">Qual treino?</label>
                <div className="grid grid-cols-3 gap-2">
                  {treinos.map(t => (
                    <button
                      key={t} type="button"
                      onClick={() => setNewWorkout(p => ({ ...p, treino: t }))}
                      className={`py-3 rounded-2xl text-sm font-semibold transition-all active:scale-95 ${
                        newWorkout.treino === t ? 'bg-primary text-white' : 'bg-app text-gray-700 border border-border'
                      }`}
                    >
                      {t === 'corrida' ? '🏃 Corrida' : `Treino ${t}`}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">Observação</label>
                <input className="input-field" placeholder="Como foi o treino..."
                  value={newWorkout.observacao}
                  onChange={e => setNewWorkout(p => ({ ...p, observacao: e.target.value }))} />
              </div>

              <button type="submit" className="btn-primary">Salvar treino</button>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : logs.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-4xl mb-3">🏋️</p>
          <p className="text-gray-500 font-medium">Nenhum treino registrado</p>
          <p className="text-muted text-sm mt-1 mb-5">Registre seu primeiro treino do programa de 12 semanas</p>
          <button onClick={() => setShowNewForm(true)} className="btn-primary">Registrar treino</button>
        </div>
      ) : (
        <div className="space-y-5">
          {weekNumbers.map(week => (
            <div key={week}>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-sm font-semibold text-gray-700">
                  Semana {week} {week > 0 ? `· ${faseLabels[getWeekFase(week)]}` : ''}
                </h3>
                <div className="flex-1 h-px bg-border" />
              </div>
              <div className="space-y-2">
                {grouped[week].map(log => (
                  <div key={log.id} className="card">
                    <div className="flex items-center gap-3" onClick={() => toggleExpand(log.id)}>
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                        log.concluido ? 'bg-primary' : 'bg-primary-50'
                      }`}>
                        <span className={`text-lg font-bold ${log.concluido ? 'text-white' : 'text-primary'}`}>
                          {log.treino === 'corrida' ? '🏃' : log.treino}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-gray-900">{treinoLabels[log.treino as TreinoTipo]}</p>
                          {log.concluido && <span className="badge-success text-xs">Feito</span>}
                        </div>
                        <p className="text-xs text-muted">
                          {format(new Date(log.data + 'T12:00'), "EEEE, d 'de' MMM", { locale: ptBR })}
                          {log.duracao_min ? ` · ${log.duracao_min} min` : ''}
                        </p>
                      </div>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                        className={`transition-transform ${expanded === log.id ? 'rotate-180' : ''}`}>
                        <path d="M6 9L12 15L18 9" stroke="#8A8A8A" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    </div>

                    {expanded === log.id && (
                      <div className="mt-4 pt-4 border-t border-border">
                        {!log.concluido && (
                          <button onClick={() => markDone(log)} className="btn-secondary mb-4">
                            Marcar como concluído
                          </button>
                        )}

                        {/* Exercises */}
                        <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-3">Exercícios e cargas</p>
                        {(exercises[log.id] || []).length === 0 && (
                          <p className="text-muted text-sm mb-3">Nenhum exercício registrado.</p>
                        )}
                        <div className="space-y-2 mb-3">
                          {(exercises[log.id] || []).map(ex => (
                            <div key={ex.id} className="bg-app rounded-2xl p-3">
                              <p className="font-medium text-sm text-gray-900">{ex.exercicio}</p>
                              <p className="text-xs text-muted">
                                {ex.series && ex.reps ? `${ex.series}x${ex.reps} reps` : ''}
                                {ex.carga_kg ? ` · ${ex.carga_kg} kg` : ''}
                              </p>
                            </div>
                          ))}
                        </div>

                        {addingExercise === log.id ? (
                          <div className="bg-primary-50 rounded-2xl p-3 space-y-2">
                            <input className="input-field" placeholder="Exercício" value={newExercise.exercicio}
                              onChange={e => setNewExercise(p => ({ ...p, exercicio: e.target.value }))} />
                            <div className="grid grid-cols-3 gap-2">
                              <input className="input-field" placeholder="Séries" type="number"
                                value={newExercise.series}
                                onChange={e => setNewExercise(p => ({ ...p, series: e.target.value }))} />
                              <input className="input-field" placeholder="Reps" type="number"
                                value={newExercise.reps}
                                onChange={e => setNewExercise(p => ({ ...p, reps: e.target.value }))} />
                              <input className="input-field" placeholder="Kg" type="number" step="0.5"
                                value={newExercise.carga_kg}
                                onChange={e => setNewExercise(p => ({ ...p, carga_kg: e.target.value }))} />
                            </div>
                            <div className="flex gap-2">
                              <button onClick={() => addExercise(log.id)} className="btn-primary flex-1 py-2.5 text-sm">Adicionar</button>
                              <button onClick={() => setAddingExercise(null)} className="btn-ghost flex-1 py-2.5 text-sm">Cancelar</button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setAddingExercise(log.id)}
                            className="text-primary text-sm font-medium flex items-center gap-1.5 py-2"
                          >
                            <span className="text-lg leading-none">+</span> Adicionar exercício
                          </button>
                        )}

                        {log.observacao && (
                          <p className="text-muted text-sm mt-3 italic">{log.observacao}</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  )
}
