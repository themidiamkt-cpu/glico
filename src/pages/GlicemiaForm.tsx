import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import type { GlucoseContexto } from '../types/database'
import { contextoLabels } from '../types/database'

type SavedReading = {
  valor: number
  contexto: GlucoseContexto
}

interface Alert {
  type: 'danger' | 'warning' | 'info'
  title: string
  message: string
}

function classifyGlucose(valor: number, contexto: GlucoseContexto): {
  label: string
  badge: string
  alert: Alert | null
} {
  // Aviso universal: foco na tendência
  const trendMessage = 'Com HbA1c em processo de melhora, o foco é na tendência semanal, não em valores isolados.'

  if (valor < 70) {
    return {
      label: 'Hipoglicemia',
      badge: 'badge-danger',
      alert: {
        type: 'danger',
        title: 'Glicemia baixa',
        message: 'Se sentir tremor, suor frio ou confusão, ingira carboidrato rápido (suco, mel, bala) e estabilize antes de prosseguir. Se estiver na academia, interrompa o treino.',
      },
    }
  }

  if (contexto === 'jejum') {
    if (valor <= 130) return { label: 'Na faixa de referência', badge: 'badge-success', alert: null }
    if (valor <= 180) return { label: 'Acima da faixa', badge: 'badge-warning', alert: { type: 'info', title: 'Atenção', message: trendMessage } }
    if (valor <= 250) return { label: 'Alto', badge: 'badge-warning', alert: { type: 'warning', title: 'Glicemia elevada', message: trendMessage } }
    return {
      label: 'Muito alto',
      badge: 'badge-danger',
      alert: {
        type: 'warning',
        title: 'Glicemia muito elevada',
        message: 'Se for treinar e sentir mal-estar, sede intensa ou tontura, prefira uma atividade mais leve hoje. ' + trendMessage,
      },
    }
  }

  if (contexto === 'pre_treino') {
    if (valor < 100) return {
      label: 'Cuidado para treinar',
      badge: 'badge-warning',
      alert: { type: 'warning', title: 'Glicemia baixa para treino', message: 'Considere ingerir um carboidrato leve antes de treinar para evitar hipoglicemia durante o exercício.' },
    }
    if (valor > 300) return {
      label: 'Muito alto para treinar',
      badge: 'badge-danger',
      alert: { type: 'danger', title: 'Evite treino intenso hoje', message: 'Acima de 300 mg/dL com mal-estar, prefira descansar ou fazer uma caminhada leve. Consulte seu médico se isso se repetir.' },
    }
    if (valor > 250) return {
      label: 'Alto - cuidado',
      badge: 'badge-warning',
      alert: { type: 'warning', title: 'Glicemia elevada', message: 'Se sentir mal-estar, sede ou tontura durante o treino, interrompa e hidrate-se. Pegar mais leve hoje pode ser uma boa ideia.' },
    }
    return { label: 'OK para treinar', badge: 'badge-success', alert: null }
  }

  if (contexto === 'pos_refeicao_1h30') {
    if (valor <= 180) return { label: 'Na faixa de referência', badge: 'badge-success', alert: null }
    if (valor <= 250) return { label: 'Acima da faixa', badge: 'badge-warning', alert: { type: 'info', title: 'Acima da faixa', message: trendMessage } }
    return { label: 'Alto', badge: 'badge-warning', alert: { type: 'info', title: 'Elevado', message: trendMessage } }
  }

  // Geral
  if (valor <= 180) return { label: 'Na faixa', badge: 'badge-success', alert: null }
  if (valor <= 250) return { label: 'Acima da faixa', badge: 'badge-warning', alert: { type: 'info', title: 'Atenção', message: trendMessage } }
  return {
    label: 'Alto',
    badge: 'badge-warning',
    alert: { type: 'warning', title: 'Glicemia elevada', message: trendMessage },
  }
}

const contextoOptions: GlucoseContexto[] = [
  'jejum', 'pre_treino', 'pos_treino', 'pre_refeicao', 'pos_refeicao_1h30', 'antes_dormir', 'aleatorio',
]

const sentimentos = ['😊 Bem', '😐 Normal', '😓 Cansado', '🤢 Mal-estar', '💧 Muita sede', '😵 Tontura']

export default function GlicemiaForm() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const now = new Date()

  const [valor, setValor] = useState('')
  const [contexto, setContexto] = useState<GlucoseContexto>('jejum')
  const [horario, setHorario] = useState(format(now, "yyyy-MM-dd'T'HH:mm"))
  const [sentimento, setSentimento] = useState('')
  const [refeicao, setRefeicao] = useState('')
  const [observacao, setObservacao] = useState('')
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState<SavedReading | null>(null)
  const [error, setError] = useState('')

  const valorNum = Number(valor)
  const classification = valor && valorNum > 0 ? classifyGlucose(valorNum, contexto) : null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !valor) return
    setLoading(true)
    setError('')

    const { error: err } = await supabase.from('glucose_readings').insert({
      user_id: user.id,
      medido_em: new Date(horario).toISOString(),
      valor_mg_dl: valorNum,
      contexto,
      refeicao_ou_treino: refeicao || null,
      como_se_sentiu: sentimento || null,
      observacao: observacao || null,
    })

    if (err) {
      setError('Erro ao salvar. Tente novamente.')
    } else {
      setSaved({ valor: valorNum, contexto })
    }
    setLoading(false)
  }

  if (saved) {
    const cls = classifyGlucose(saved.valor, saved.contexto)
    return (
      <div className="min-h-dvh bg-app flex flex-col items-center justify-center px-5 max-w-lg mx-auto">
        <div className="card w-full text-center py-8">
          <div className={`text-5xl font-bold mb-2 ${saved.valor < 70 ? 'text-danger' : saved.valor <= 130 ? 'text-success' : 'text-warning'}`}>
            {saved.valor} <span className="text-xl font-normal text-muted">mg/dL</span>
          </div>
          <span className={`${cls.badge} text-sm px-3 py-1.5`}>{cls.label}</span>

          {cls.alert && (
            <div className={`mt-5 text-left rounded-2xl p-4 text-sm ${
              cls.alert.type === 'danger' ? 'bg-red-50 text-red-800' :
              cls.alert.type === 'warning' ? 'bg-amber-50 text-amber-800' :
              'bg-primary-50 text-primary-800'
            }`}>
              <p className="font-semibold mb-1">{cls.alert.title}</p>
              <p className="leading-relaxed">{cls.alert.message}</p>
            </div>
          )}

          <p className="text-muted text-xs mt-4 leading-relaxed px-2">
            As faixas de referência acima (jejum: 80-130 mg/dL; pós-refeição: abaixo de 180 mg/dL) são orientações gerais. Seu alvo exato é definido pelo seu médico.
          </p>

          <div className="flex gap-3 mt-6">
            <button onClick={() => { setSaved(null); setValor(''); setObservacao(''); setSentimento('') }} className="btn-secondary flex-1">
              Novo registro
            </button>
            <button onClick={() => navigate('/dashboard')} className="btn-primary flex-1">
              Início
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-app max-w-lg mx-auto">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-app/90 backdrop-blur-sm border-b border-border/50 px-5 pt-safe">
        <div className="flex items-center h-14">
          <button onClick={() => navigate(-1)} className="mr-3 p-1 -ml-1 rounded-xl active:bg-border">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M15 18L9 12L15 6" stroke="#1A1A1A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <h1 className="text-lg font-semibold">Registrar Glicemia</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="px-5 py-5 space-y-5 pb-10">
        {/* Valor - destaque */}
        <div className="card">
          <label className="label">Valor (mg/dL)</label>
          <div className="relative">
            <input
              type="number"
              className="input-field text-3xl font-bold text-center pr-16 py-5"
              placeholder="0"
              value={valor}
              onChange={e => setValor(e.target.value)}
              min="20"
              max="600"
              required
              autoFocus
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted text-sm">mg/dL</span>
          </div>

          {/* Live classification preview */}
          {classification && (
            <div className={`mt-3 flex items-center justify-between p-3 rounded-2xl ${
              valorNum < 70 ? 'bg-red-50' : valorNum <= 130 ? 'bg-emerald-50' : valorNum <= 250 ? 'bg-amber-50' : 'bg-red-50'
            }`}>
              <span className={`text-sm font-semibold ${
                valorNum < 70 ? 'text-danger' : valorNum <= 130 ? 'text-success' : valorNum <= 250 ? 'text-warning' : 'text-danger'
              }`}>{classification.label}</span>
              <span className="text-xs text-muted">{contexto.replace(/_/g, ' ')}</span>
            </div>
          )}
        </div>

        {/* Contexto */}
        <div>
          <label className="label">Quando foi medido?</label>
          <div className="grid grid-cols-2 gap-2">
            {contextoOptions.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => setContexto(c)}
                className={`py-3 px-3 rounded-2xl text-sm font-medium text-left transition-all active:scale-95 ${
                  contexto === c
                    ? 'bg-primary text-white shadow-card'
                    : 'bg-surface text-gray-700 shadow-card border border-border'
                }`}
              >
                {contextoLabels[c]}
              </button>
            ))}
          </div>
        </div>

        {/* Horário */}
        <div>
          <label className="label">Horário</label>
          <input
            type="datetime-local"
            className="input-field"
            value={horario}
            onChange={e => setHorario(e.target.value)}
          />
        </div>

        {/* Como se sentiu */}
        <div>
          <label className="label">Como você está se sentindo?</label>
          <div className="flex flex-wrap gap-2">
            {sentimentos.map(s => (
              <button
                key={s}
                type="button"
                onClick={() => setSentimento(sentimento === s ? '' : s)}
                className={`py-2 px-3 rounded-2xl text-sm font-medium transition-all active:scale-95 ${
                  sentimento === s
                    ? 'bg-primary text-white'
                    : 'bg-surface text-gray-700 shadow-card border border-border'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Refeição ou treino */}
        <div>
          <label className="label">Refeição ou treino relacionado <span className="text-muted font-normal">(opcional)</span></label>
          <input
            className="input-field"
            placeholder="Ex: Almoço com arroz e frango, Treino A..."
            value={refeicao}
            onChange={e => setRefeicao(e.target.value)}
          />
        </div>

        {/* Observação */}
        <div>
          <label className="label">Observação <span className="text-muted font-normal">(opcional)</span></label>
          <textarea
            className="input-field resize-none"
            placeholder="Algo que queira registrar..."
            rows={2}
            value={observacao}
            onChange={e => setObservacao(e.target.value)}
          />
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 text-sm p-3 rounded-2xl">{error}</div>
        )}

        <button type="submit" className="btn-primary" disabled={loading || !valor}>
          {loading ? 'Salvando...' : 'Salvar registro'}
        </button>

        <p className="text-center text-xs text-muted leading-relaxed pb-4">
          Este app não substitui o acompanhamento médico. Decisões de medicação são do seu médico.
        </p>
      </form>
    </div>
  )
}
