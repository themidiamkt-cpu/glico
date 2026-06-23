import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'
import type { WeightLog } from '../types/database'

export default function Peso() {
  const { user, profile } = useAuth()
  const [logs, setLogs] = useState<WeightLog[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ data: format(new Date(), 'yyyy-MM-dd'), peso_kg: '', cintura_cm: '', pescoco_cm: '' })
  const [saving, setSaving] = useState(false)

  const load = async () => {
    if (!user) return
    const { data } = await supabase
      .from('weight_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('data', { ascending: false })
      .limit(30)
    if (data) setLogs(data as WeightLog[])
    setLoading(false)
  }

  useEffect(() => { load() }, [user])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setSaving(true)
    const { data } = await supabase.from('weight_logs').insert({
      user_id: user.id,
      data: form.data,
      peso_kg: form.peso_kg ? Number(form.peso_kg) : null,
      cintura_cm: form.cintura_cm ? Number(form.cintura_cm) : null,
      pescoco_cm: form.pescoco_cm ? Number(form.pescoco_cm) : null,
    }).select().single()

    if (data) {
      setLogs(prev => [data as WeightLog, ...prev].sort((a, b) => b.data.localeCompare(a.data)))
      setShowForm(false)
      setForm({ data: format(new Date(), 'yyyy-MM-dd'), peso_kg: '', cintura_cm: '', pescoco_cm: '' })
    }
    setSaving(false)
  }

  const latest = logs[0]
  const initial = profile?.peso_inicial_kg
  const weightDiff = latest?.peso_kg && initial ? (latest.peso_kg - initial).toFixed(1) : null

  // First weight log (oldest)
  const oldest = logs[logs.length - 1]
  const waistDiff = latest?.cintura_cm && oldest?.cintura_cm && oldest.id !== latest.id
    ? (latest.cintura_cm - oldest.cintura_cm).toFixed(1)
    : null

  // Chart data (asc order)
  const chartWeight = [...logs].reverse().filter(l => l.peso_kg).map(l => ({
    date: format(new Date(l.data + 'T12:00'), 'dd/MM'),
    peso: l.peso_kg,
    cintura: l.cintura_cm,
  }))

  return (
    <Layout
      title="Peso e Medidas"
      headerRight={
        <button
          onClick={() => setShowForm(true)}
          className="bg-primary text-white text-sm font-semibold px-4 py-2 rounded-2xl active:scale-95 transition-all"
        >
          + Registrar
        </button>
      }
    >
      {/* New entry modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end">
          <div className="bg-surface rounded-t-3xl w-full max-w-lg mx-auto p-5 pb-10 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold">Registrar medidas</h2>
              <button onClick={() => setShowForm(false)} className="p-2 rounded-xl active:bg-border">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6L18 18" stroke="#8A8A8A" strokeWidth="2" strokeLinecap="round" /></svg>
              </button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="label">Data</label>
                <input type="date" className="input-field" value={form.data} onChange={e => setForm(p => ({ ...p, data: e.target.value }))} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="label">Peso (kg)</label>
                  <input type="number" step="0.1" className="input-field" placeholder="92.0"
                    value={form.peso_kg} onChange={e => setForm(p => ({ ...p, peso_kg: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Cintura (cm)</label>
                  <input type="number" step="0.5" className="input-field" placeholder="95"
                    value={form.cintura_cm} onChange={e => setForm(p => ({ ...p, cintura_cm: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Pescoço (cm)</label>
                  <input type="number" step="0.5" className="input-field" placeholder="38"
                    value={form.pescoco_cm} onChange={e => setForm(p => ({ ...p, pescoco_cm: e.target.value }))} />
                </div>
              </div>

              <div className="bg-primary-50 rounded-2xl p-3 text-xs text-primary">
                Medida a cintura todo domingo, em jejum, na altura do umbigo.
              </div>

              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Current stats */}
          {latest && (
            <div className="card mb-4">
              <p className="text-muted text-xs font-medium uppercase tracking-wide mb-3">Medidas atuais</p>
              <div className="grid grid-cols-3 gap-4">
                {latest.peso_kg && (
                  <div>
                    <p className="text-3xl font-bold text-gray-900">{latest.peso_kg}</p>
                    <p className="text-xs text-muted">kg</p>
                    {weightDiff && (
                      <p className={`text-xs font-medium mt-1 ${Number(weightDiff) < 0 ? 'text-success' : 'text-warning'}`}>
                        {Number(weightDiff) > 0 ? '+' : ''}{weightDiff} kg
                      </p>
                    )}
                  </div>
                )}
                {latest.cintura_cm && (
                  <div>
                    <p className="text-3xl font-bold text-gray-900">{latest.cintura_cm}</p>
                    <p className="text-xs text-muted">cm cintura</p>
                    {waistDiff && (
                      <p className={`text-xs font-medium mt-1 ${Number(waistDiff) < 0 ? 'text-success' : 'text-warning'}`}>
                        {Number(waistDiff) > 0 ? '+' : ''}{waistDiff} cm
                      </p>
                    )}
                  </div>
                )}
                {latest.pescoco_cm && (
                  <div>
                    <p className="text-3xl font-bold text-gray-900">{latest.pescoco_cm}</p>
                    <p className="text-xs text-muted">cm pescoço</p>
                  </div>
                )}
              </div>
              <p className="text-xs text-muted mt-3">
                Atualizado em {format(new Date(latest.data + 'T12:00'), "d 'de' MMMM", { locale: ptBR })}
              </p>
            </div>
          )}

          {/* Weight chart */}
          {chartWeight.length > 1 && (
            <div className="card mb-4">
              <p className="text-muted text-xs font-medium uppercase tracking-wide mb-3">Evolução do peso</p>
              <ResponsiveContainer width="100%" height={140}>
                <LineChart data={chartWeight}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E0D8" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#8A8A8A' }} axisLine={false} tickLine={false} />
                  <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10, fill: '#8A8A8A' }} axisLine={false} tickLine={false} width={35} />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E5E0D8', boxShadow: 'none' }}
                    formatter={(v: number) => [`${v} kg`, 'Peso']}
                  />
                  <Line type="monotone" dataKey="peso" stroke="#1B6B5E" strokeWidth={2.5} dot={{ r: 3, fill: '#1B6B5E' }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Waist chart */}
          {chartWeight.filter(d => d.cintura).length > 1 && (
            <div className="card mb-4">
              <p className="text-muted text-xs font-medium uppercase tracking-wide mb-3">Evolução da cintura</p>
              <ResponsiveContainer width="100%" height={120}>
                <LineChart data={chartWeight.filter(d => d.cintura)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E0D8" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#8A8A8A' }} axisLine={false} tickLine={false} />
                  <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10, fill: '#8A8A8A' }} axisLine={false} tickLine={false} width={35} />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E5E0D8', boxShadow: 'none' }}
                    formatter={(v: number) => [`${v} cm`, 'Cintura']}
                  />
                  <Line type="monotone" dataKey="cintura" stroke="#50A587" strokeWidth={2.5} dot={{ r: 3, fill: '#50A587' }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
              <p className="text-muted text-xs mt-2">A cintura é o principal marcador de gordura visceral para diabetes tipo 2.</p>
            </div>
          )}

          {/* History list */}
          {logs.length === 0 ? (
            <div className="card text-center py-12">
              <p className="text-4xl mb-3">⚖️</p>
              <p className="text-gray-500 font-medium">Nenhum registro ainda</p>
              <p className="text-muted text-sm mt-1 mb-5">Registre seu peso e medidas</p>
              <button onClick={() => setShowForm(true)} className="btn-primary">Registrar agora</button>
            </div>
          ) : (
            <div>
              <p className="text-muted text-xs font-medium uppercase tracking-wide mb-3">Histórico</p>
              <div className="space-y-2">
                {logs.map(log => (
                  <div key={log.id} className="card flex items-center gap-4">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900">
                        {format(new Date(log.data + 'T12:00'), "EEEE, d 'de' MMM", { locale: ptBR })}
                      </p>
                      <div className="flex gap-3 mt-1">
                        {log.peso_kg && <span className="text-xs text-muted">{log.peso_kg} kg</span>}
                        {log.cintura_cm && <span className="text-xs text-muted">Cintura: {log.cintura_cm} cm</span>}
                        {log.pescoco_cm && <span className="text-xs text-muted">Pescoço: {log.pescoco_cm} cm</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </Layout>
  )
}
