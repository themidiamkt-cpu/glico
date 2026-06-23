import { useEffect, useState, useRef } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'
import type { WorkoutLog, ExerciseLog, TreinoTipo } from '../types/database'
import { treinoLabels } from '../types/database'
import {
  WEEKLY_SCHEDULE,
  WORKOUT_TEMPLATES,
  WORKOUT_NAMES,
  getTodayTreinos,
  getWeekFaseInfo,
  DAY_NAMES,
  DAY_NAMES_FULL,
} from '../lib/workoutProgram'

// =============================================
// Image Carousel Component
// =============================================
function ImageCarousel({ images, onAdd, onDelete }: {
  images: string[]
  onAdd: (file: File) => Promise<void>
  onDelete: (url: string) => Promise<void>
}) {
  const [lightbox, setLightbox] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    await onAdd(file)
    setUploading(false)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <>
      {lightbox && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button className="absolute top-4 right-4 text-white p-2" onClick={() => setLightbox(null)}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6L18 18" stroke="white" strokeWidth="2.5" strokeLinecap="round" /></svg>
          </button>
          <img src={lightbox} className="max-w-full max-h-full rounded-2xl object-contain" alt="" />
        </div>
      )}

      <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {images.map((url, i) => (
          <div key={i} className="relative flex-shrink-0">
            <img
              src={url}
              alt={`Imagem ${i + 1}`}
              className="w-20 h-20 rounded-2xl object-cover cursor-pointer active:scale-95 transition-transform"
              onClick={() => setLightbox(url)}
            />
            <button
              onClick={() => onDelete(url)}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-danger rounded-full flex items-center justify-center shadow"
            >
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M9 3L3 9M3 3L9 9" stroke="white" strokeWidth="1.8" strokeLinecap="round" /></svg>
            </button>
          </div>
        ))}

        {/* Add photo button */}
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-20 h-20 rounded-2xl border-2 border-dashed border-border bg-app flex-shrink-0 flex flex-col items-center justify-center gap-1 active:scale-95 transition-transform disabled:opacity-50"
        >
          {uploading ? (
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 5V19M5 12H19" stroke="#8A8A8A" strokeWidth="2" strokeLinecap="round" /></svg>
              <span className="text-[10px] text-muted font-medium">Foto</span>
            </>
          )}
        </button>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFile}
        />
      </div>
    </>
  )
}

// =============================================
// Exercise Row
// =============================================
interface ExerciseRowProps {
  ex: ExerciseLog & { imagens?: string[] }
  workoutLogId: string
  userId: string
  onUpdate: (updated: ExerciseLog & { imagens?: string[] }) => void
}

function ExerciseRow({ ex, workoutLogId, userId, onUpdate }: ExerciseRowProps) {
  const [editing, setEditing] = useState(false)
  const [carga, setCarga] = useState(String(ex.carga_kg ?? ''))
  const [series, setSeries] = useState(String(ex.series ?? ''))
  const [reps, setReps] = useState(String(ex.reps ?? ''))
  const images = ex.imagens ?? []

  const saveValues = async () => {
    const { data } = await supabase
      .from('exercise_logs')
      .update({
        carga_kg: carga ? Number(carga) : null,
        series: series ? Number(series) : null,
        reps: reps ? Number(reps) : null,
      })
      .eq('id', ex.id)
      .select()
      .single()
    if (data) onUpdate({ ...ex, ...data, imagens: ex.imagens })
    setEditing(false)
  }

  const uploadImage = async (file: File) => {
    const ext = file.name.split('.').pop()
    const path = `${userId}/${workoutLogId}/${ex.id}/${Date.now()}.${ext}`
    const { data: uploaded, error } = await supabase.storage
      .from('exercise-images')
      .upload(path, file, { upsert: true })
    if (error || !uploaded) return

    const { data: urlData } = supabase.storage
      .from('exercise-images')
      .getPublicUrl(uploaded.path)

    const newImages = [...images, urlData.publicUrl]
    await supabase.from('exercise_logs').update({ imagens: newImages }).eq('id', ex.id)
    onUpdate({ ...ex, imagens: newImages })
  }

  const deleteImage = async (url: string) => {
    const newImages = images.filter(u => u !== url)
    await supabase.from('exercise_logs').update({ imagens: newImages }).eq('id', ex.id)
    onUpdate({ ...ex, imagens: newImages })
  }

  return (
    <div className="bg-app rounded-2xl p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <p className="font-semibold text-sm text-gray-900">{ex.exercicio}</p>
          {!editing ? (
            <div className="flex items-center gap-2 mt-0.5">
              {ex.series && ex.reps && (
                <span className="text-xs text-muted">{ex.series}×{ex.reps} reps</span>
              )}
              {ex.carga_kg && (
                <span className="badge-info text-xs px-2 py-0.5">{ex.carga_kg} kg</span>
              )}
              {!ex.carga_kg && !ex.series && (
                <span className="text-xs text-muted italic">Sem dados ainda</span>
              )}
            </div>
          ) : (
            <div className="flex gap-2 mt-2">
              <input
                type="number" placeholder="Séries" className="input-field py-2 text-sm flex-1"
                value={series} onChange={e => setSeries(e.target.value)}
              />
              <input
                type="number" placeholder="Reps" className="input-field py-2 text-sm flex-1"
                value={reps} onChange={e => setReps(e.target.value)}
              />
              <input
                type="number" step="0.5" placeholder="Kg" className="input-field py-2 text-sm flex-1"
                value={carga} onChange={e => setCarga(e.target.value)}
              />
            </div>
          )}
        </div>
        <button
          onClick={() => editing ? saveValues() : setEditing(true)}
          className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            editing ? 'bg-primary text-white' : 'bg-surface border border-border text-gray-700'
          }`}
        >
          {editing ? 'Salvar' : 'Editar'}
        </button>
      </div>

      {/* Image carousel */}
      {(images.length > 0 || true) && (
        <ImageCarousel
          images={images}
          onAdd={uploadImage}
          onDelete={deleteImage}
        />
      )}
    </div>
  )
}

// =============================================
// Main Treino Page
// =============================================
export default function Treino() {
  const { user } = useAuth()
  const [logs, setLogs] = useState<WorkoutLog[]>([])
  const [exercises, setExercises] = useState<Record<string, (ExerciseLog & { imagens?: string[] })[]>>({})
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [showNewForm, setShowNewForm] = useState(false)
  const [startingTreino, setStartingTreino] = useState<TreinoTipo | null>(null)

  // Current week stored in localStorage
  const [currentWeek, setCurrentWeek] = useState<number>(() => {
    const saved = localStorage.getItem('glico_current_week')
    return saved ? Number(saved) : 1
  })
  const [editingWeek, setEditingWeek] = useState(false)

  const todayTreinos = getTodayTreinos()
  const { fase, descricao: faseDescricao } = getWeekFaseInfo(currentWeek)
  const dow = new Date().getDay()

  const saveWeek = (w: number) => {
    const clamped = Math.min(12, Math.max(1, w))
    setCurrentWeek(clamped)
    localStorage.setItem('glico_current_week', String(clamped))
    setEditingWeek(false)
  }

  const load = async () => {
    if (!user) return
    const { data } = await supabase
      .from('workout_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('data', { ascending: false })
      .limit(40)
    if (data) setLogs(data as WorkoutLog[])
    setLoading(false)
  }

  const loadExercises = async (wlId: string) => {
    const { data } = await supabase
      .from('exercise_logs')
      .select('*')
      .eq('workout_log_id', wlId)
    if (data) setExercises(prev => ({ ...prev, [wlId]: data as (ExerciseLog & { imagens?: string[] })[] }))
  }

  useEffect(() => { load() }, [user])

  const toggleExpand = async (id: string) => {
    const next = expanded === id ? null : id
    setExpanded(next)
    if (next && !exercises[next]) await loadExercises(next)
  }

  const startWorkout = async (treino: TreinoTipo) => {
    if (!user) return
    setStartingTreino(treino)
    const { fase } = getWeekFaseInfo(currentWeek)
    const { data: newLog } = await supabase
      .from('workout_logs')
      .insert({
        user_id: user.id,
        data: format(new Date(), 'yyyy-MM-dd'),
        semana: currentWeek,
        fase,
        treino,
        concluido: false,
      })
      .select()
      .single()

    if (newLog) {
      // Create exercise entries from template
      const template = WORKOUT_TEMPLATES[treino]
      const exEntries = template.map(t => ({
        workout_log_id: newLog.id,
        exercicio: t.nome,
        carga_kg: null,
        series: t.series,
        reps: null,
        imagens: [],
      }))
      const { data: exData } = await supabase
        .from('exercise_logs')
        .insert(exEntries)
        .select()

      setLogs(prev => [newLog as WorkoutLog, ...prev])
      if (exData) setExercises(prev => ({ ...prev, [newLog.id]: exData as (ExerciseLog & { imagens?: string[] })[] }))
      setExpanded(newLog.id)
      setShowNewForm(false)
    }
    setStartingTreino(null)
  }

  const markDone = async (log: WorkoutLog) => {
    await supabase.from('workout_logs').update({ concluido: true }).eq('id', log.id)
    setLogs(prev => prev.map(l => l.id === log.id ? { ...l, concluido: true } : l))
  }

  const updateExercise = (wlId: string, updated: ExerciseLog & { imagens?: string[] }) => {
    setExercises(prev => ({
      ...prev,
      [wlId]: (prev[wlId] || []).map(e => e.id === updated.id ? updated : e),
    }))
  }

  // Group logs by week
  const grouped: Record<number, WorkoutLog[]> = {}
  logs.forEach(l => {
    const w = l.semana ?? 0
    if (!grouped[w]) grouped[w] = []
    grouped[w].push(l)
  })
  const weekNumbers = Object.keys(grouped).map(Number).sort((a, b) => b - a)

  return (
    <Layout title="Treino">
      {/* ---- Today's workout recommendation ---- */}
      <div className="card mb-4">
        {/* Week + phase header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-muted text-xs font-medium uppercase tracking-wide">Programa 12 semanas</p>
            <div className="flex items-center gap-2 mt-1">
              {editingWeek ? (
                <div className="flex items-center gap-2">
                  <input
                    type="number" min="1" max="12"
                    className="input-field py-1.5 text-sm w-16 text-center"
                    defaultValue={currentWeek}
                    autoFocus
                    onBlur={e => saveWeek(Number(e.target.value))}
                    onKeyDown={e => e.key === 'Enter' && saveWeek(Number((e.target as HTMLInputElement).value))}
                  />
                  <span className="text-sm text-muted">de 12</span>
                </div>
              ) : (
                <button onClick={() => setEditingWeek(true)} className="flex items-center gap-1.5">
                  <span className="text-xl font-bold text-gray-900">Semana {currentWeek}</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="#8A8A8A" strokeWidth="2" strokeLinecap="round" /></svg>
                </button>
              )}
            </div>
            <p className="text-xs text-muted mt-0.5">{faseDescricao}</p>
          </div>
          <div className="text-right">
            <span className={`badge-info text-xs px-3 py-1 capitalize`}>{fase.replace('_', ' ')}</span>
            <p className="text-xs text-muted mt-1">{currentWeek}/12</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-border rounded-full mb-5">
          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(currentWeek / 12) * 100}%` }} />
        </div>

        {/* Today */}
        <div className="mb-4">
          <p className="text-muted text-xs font-medium uppercase tracking-wide mb-2">
            Hoje — {DAY_NAMES_FULL[dow]}
          </p>
          {todayTreinos.length > 0 ? (
            <div className="space-y-2">
              {todayTreinos.map(treino => (
                <div key={treino} className="flex items-center justify-between bg-primary-50 rounded-2xl p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                      <span className="text-white font-bold text-sm">
                        {treino === 'corrida' ? '🏃' : treino}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{treinoLabels[treino]}</p>
                      <p className="text-xs text-muted">{WORKOUT_NAMES[treino]}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => startWorkout(treino)}
                    disabled={startingTreino === treino}
                    className="bg-primary text-white text-xs font-semibold px-4 py-2.5 rounded-xl active:scale-95 transition-all disabled:opacity-50"
                  >
                    {startingTreino === treino ? '...' : 'Iniciar'}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-border/40 rounded-2xl p-4 text-center">
              <p className="text-muted text-sm">Dia de descanso</p>
            </div>
          )}
        </div>

        {/* Weekly grid */}
        <div className="grid grid-cols-7 gap-1">
          {[0,1,2,3,4,5,6].map(d => {
            const treinos = WEEKLY_SCHEDULE[d] ?? []
            const isToday = d === dow
            return (
              <div key={d} className={`rounded-xl p-1.5 text-center ${isToday ? 'bg-primary' : 'bg-app'}`}>
                <p className={`text-[10px] font-medium mb-1 ${isToday ? 'text-white/70' : 'text-muted'}`}>{DAY_NAMES[d]}</p>
                {treinos.length > 0 ? (
                  treinos.map(t => (
                    <p key={t} className={`text-[11px] font-bold leading-tight ${isToday ? 'text-white' : 'text-primary'}`}>
                      {t === 'corrida' ? '🏃' : t}
                    </p>
                  ))
                ) : (
                  <p className="text-[11px] text-muted">-</p>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ---- History ---- */}
      {loading ? (
        <div className="flex justify-center h-24 items-center">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : logs.length === 0 ? (
        <div className="card text-center py-8">
          <p className="text-4xl mb-3">🏋️</p>
          <p className="text-muted text-sm">Nenhum treino registrado ainda.</p>
          <p className="text-muted text-xs mt-1">Clique em "Iniciar" em um dos treinos acima.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {weekNumbers.map(week => (
            <div key={week}>
              <div className="flex items-center gap-2 mb-2">
                <p className="text-xs font-semibold text-muted uppercase tracking-wide">
                  {week > 0 ? `Semana ${week}` : 'Sem semana'}
                </p>
                <div className="flex-1 h-px bg-border" />
              </div>
              <div className="space-y-2">
                {grouped[week].map(log => {
                  const exList = exercises[log.id] || []
                  const isOpen = expanded === log.id
                  return (
                    <div key={log.id} className="card">
                      {/* Header row */}
                      <div
                        className="flex items-center gap-3 cursor-pointer"
                        onClick={() => toggleExpand(log.id)}
                      >
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                          log.concluido ? 'bg-primary' : 'bg-primary-50'
                        }`}>
                          <span className={`font-bold text-lg ${log.concluido ? 'text-white' : 'text-primary'}`}>
                            {log.treino === 'corrida' ? '🏃' : log.treino}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-gray-900">{treinoLabels[log.treino as TreinoTipo]}</p>
                            {log.concluido && <span className="badge-success text-xs">Feito ✓</span>}
                          </div>
                          <p className="text-xs text-muted truncate">
                            {format(new Date(log.data + 'T12:00'), "EEE, d 'de' MMM", { locale: ptBR })}
                            {log.duracao_min ? ` · ${log.duracao_min} min` : ''}
                            {exList.length > 0 ? ` · ${exList.length} exercícios` : ''}
                          </p>
                        </div>
                        <svg
                          width="20" height="20" viewBox="0 0 24 24" fill="none"
                          className={`flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                        >
                          <path d="M6 9L12 15L18 9" stroke="#8A8A8A" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                      </div>

                      {/* Expanded: exercises */}
                      {isOpen && (
                        <div className="mt-4 pt-4 border-t border-border space-y-3">
                          {!log.concluido && (
                            <button onClick={() => markDone(log)} className="btn-secondary py-2.5 text-sm">
                              Marcar como concluído
                            </button>
                          )}

                          {exList.length === 0 ? (
                            <p className="text-muted text-sm text-center py-2">Carregando exercícios...</p>
                          ) : (
                            <div className="space-y-2">
                              {exList.map(ex => (
                                <ExerciseRow
                                  key={ex.id}
                                  ex={ex}
                                  workoutLogId={log.id}
                                  userId={user!.id}
                                  onUpdate={(updated) => updateExercise(log.id, updated)}
                                />
                              ))}
                            </div>
                          )}

                          {log.observacao && (
                            <p className="text-muted text-sm italic border-t border-border pt-3">{log.observacao}</p>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  )
}
