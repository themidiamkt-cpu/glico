import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'

interface TreadmillProgression {
  id: string
  semana_inicio: number
  semana_fim: number
  caminhada: string
  corrida: string
  observacao: string | null
}

interface EsteiraSessao {
  id: string
  data: string
  duracao_min: number | null
  concluido: boolean
  observacao: string | null
  dia_semana: string | null
  foco: string | null
}

export default function Esteira() {
  const { user } = useAuth()
  const [progressoes, setProgressoes] = useState<TreadmillProgression[]>([])
  const [sessoes, setSessoes] = useState<EsteiraSessao[]>([])
  const [loading, setLoading] = useState(true)
  const [logging, setLogging] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [duracao, setDuracao] = useState('')
  const [obs, setObs] = useState('')

  const [currentWeek, setCurrentWeek] = useState<number>(() => {
    const saved = localStorage.getItem('glico_current_week')
    return saved ? Number(saved) : 1
  })
  const [editingWeek, setEditingWeek] = useState(false)

  const saveWeek = (w: number) => {
    const clamped = Math.min(12, Math.max(1, w))
    setCurrentWeek(clamped)
    localStorage.setItem('glico_current_week', String(clamped))
    setEditingWeek(false)
  }

  const currentProg = progressoes.find(
    p => currentWeek >= p.semana_inicio && currentWeek <= p.semana_fim
  )

  const load = async () => {
    if (!user) return
    const [progRes, sesRes] = await Promise.all([
      supabase.from('treadmill_progression').select('*').eq('user_id', user.id).order('semana_inicio'),
      supabase.from('workout_logs').select('*').eq('user_id', user.id).eq('treino', 'corrida').order('data', { ascending: false }).limit(20),
    ])
    if (progRes.data) setProgressoes(progRes.data as TreadmillProgression[])
    if (sesRes.data) setSessoes(sesRes.data as EsteiraSessao[])
    setLoading(false)
  }

  useEffect(() => { load() }, [user])

  const logSession = async () => {
    if (!user) return
    setLogging(true)
    const { data } = await supabase
      .from('workout_logs')
      .insert({
        user_id: user.id,
        data: format(new Date(), 'yyyy-MM-dd'),
        semana: currentWeek,
        fase: currentWeek <= 4 ? 'base' : currentWeek <= 8 ? 'consolidacao' : 'alvo',
        treino: 'corrida',
        concluido: true,
        duracao_min: duracao ? Number(duracao) : null,
        observacao: obs || null,
        esteira_feita: true,
        foco: currentProg ? `Sem ${currentProg.semana_inicio}-${currentProg.semana_fim}` : null,
      })
      .select()
      .single()
    if (data) setSessoes(prev => [data as EsteiraSessao, ...prev])
    setDuracao('')
    setObs('')
    setShowForm(false)
    setLogging(false)
  }

  return (
    <Layout title="Esteira">
      {/* Semana atual */}
      <div className="card mb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-muted text-xs font-medium uppercase tracking-wide">Progressão 12 semanas</p>
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
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="#8A8A8A" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>
              )}
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-primary-50 flex items-center justify-center text-2xl">
            🏃
          </div>
        </div>

        <div className="h-1.5 bg-border rounded-full mb-4">
          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(currentWeek / 12) * 100}%` }} />
        </div>

        {/* Protocolo atual */}
        {loading ? (
          <div className="h-16 flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : currentProg ? (
          <div className="space-y-2">
            <div className="bg-primary-50 rounded-2xl p-3">
              <p className="text-xs text-muted font-medium mb-1.5">Aquecimento / Caminhada</p>
              <p className="text-sm font-semibold text-gray-900">{currentProg.caminhada}</p>
            </div>
            <div className="bg-primary rounded-2xl p-3">
              <p className="text-xs text-white/70 font-medium mb-1.5">Corrida</p>
              <p className="text-sm font-semibold text-white">{currentProg.corrida}</p>
            </div>
            {currentProg.observacao && (
              <p className="text-xs text-muted italic px-1">{currentProg.observacao}</p>
            )}
          </div>
        ) : (
          <p className="text-muted text-sm text-center py-2">Nenhuma progressao configurada para esta semana.</p>
        )}
      </div>

      {/* Registrar sessao */}
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary w-full mb-4"
        >
          Registrar sessao de hoje
        </button>
      ) : (
        <div className="card mb-4 space-y-3">
          <p className="font-semibold text-gray-900">Sessao de hoje</p>
          <div>
            <label className="label-field">Duracao (min)</label>
            <input
              type="number"
              className="input-field"
              placeholder="Ex: 35"
              value={duracao}
              onChange={e => setDuracao(e.target.value)}
            />
          </div>
          <div>
            <label className="label-field">Observacao (opcional)</label>
            <input
              type="text"
              className="input-field"
              placeholder="Como foi? Velocidade, sensacao..."
              value={obs}
              onChange={e => setObs(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowForm(false)} className="btn-secondary flex-1 py-2.5 text-sm">
              Cancelar
            </button>
            <button onClick={logSession} disabled={logging} className="btn-primary flex-1 py-2.5 text-sm disabled:opacity-50">
              {logging ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>
      )}

      {/* Tabela de progressao completa */}
      <div className="card mb-4">
        <p className="font-semibold text-gray-900 mb-3">Programa completo</p>
        <div className="space-y-2">
          {progressoes.map(p => {
            const isActive = currentWeek >= p.semana_inicio && currentWeek <= p.semana_fim
            return (
              <div
                key={p.id}
                className={`rounded-2xl p-3 ${isActive ? 'bg-primary text-white' : 'bg-app border border-border'}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-bold uppercase tracking-wide ${isActive ? 'text-white/70' : 'text-muted'}`}>
                    Semanas {p.semana_inicio} - {p.semana_fim}
                  </span>
                  {isActive && (
                    <span className="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full font-semibold">
                      Agora
                    </span>
                  )}
                </div>
                <p className={`text-xs ${isActive ? 'text-white' : 'text-gray-700'}`}>
                  {p.corrida}
                </p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Historico */}
      <div>
        <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">Historico de sessoes</p>
        {sessoes.length === 0 ? (
          <div className="card text-center py-6">
            <p className="text-3xl mb-2">🏃</p>
            <p className="text-muted text-sm">Nenhuma sessao registrada.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sessoes.map(s => (
              <div key={s.id} className="card flex items-center gap-3">
                <div className="w-10 h-10 bg-primary rounded-2xl flex items-center justify-center text-lg flex-shrink-0">
                  🏃
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm">
                    {format(new Date(s.data + 'T12:00'), "EEE, d 'de' MMM", { locale: ptBR })}
                  </p>
                  <p className="text-xs text-muted">
                    {s.duracao_min ? `${s.duracao_min} min` : 'Sem duracao'}
                    {s.foco ? ` · ${s.foco}` : ''}
                  </p>
                  {s.observacao && (
                    <p className="text-xs text-muted italic mt-0.5 truncate">{s.observacao}</p>
                  )}
                </div>
                <span className="badge-success text-xs flex-shrink-0">Feito</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
