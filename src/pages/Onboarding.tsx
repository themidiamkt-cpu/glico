import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

export default function Onboarding() {
  const { user, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    nome: '',
    data_nascimento: '',
    altura_cm: '',
    peso_inicial_kg: '',
    hba1c_inicial: '',
    medicacao: 'Glifage (metformina) 500 mg 2x ao dia',
    objetivo: '',
  })

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setLoading(true)

    await supabase.from('profiles').upsert({
      id: user.id,
      nome: form.nome || null,
      data_nascimento: form.data_nascimento || null,
      altura_cm: form.altura_cm ? Number(form.altura_cm) : null,
      peso_inicial_kg: form.peso_inicial_kg ? Number(form.peso_inicial_kg) : null,
      hba1c_inicial: form.hba1c_inicial ? Number(form.hba1c_inicial) : null,
      medicacao: form.medicacao || null,
      objetivo: form.objetivo || null,
      tipo_diabetes: 'tipo_2',
    })

    await refreshProfile()
    navigate('/dashboard')
    setLoading(false)
  }

  return (
    <div className="min-h-dvh bg-app flex flex-col px-5 py-10 max-w-lg mx-auto">
      <div className="mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-primary rounded-2xl mb-4 shadow-card">
          <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
            <path d="M16 4L16 28M16 4C16 4 10 11 10 17C10 20.314 12.686 23 16 23C19.314 23 22 20.314 22 17C22 11 16 4 16 4Z"
              stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Vamos configurar seu perfil</h1>
        <p className="text-muted text-sm mt-1">Só algumas informações para personalizar seu acompanhamento.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 pb-10">
        <div>
          <label className="label">Como posso te chamar?</label>
          <input className="input-field" placeholder="Seu nome" value={form.nome} onChange={e => set('nome', e.target.value)} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Data de nascimento</label>
            <input type="date" className="input-field" value={form.data_nascimento} onChange={e => set('data_nascimento', e.target.value)} />
          </div>
          <div>
            <label className="label">Altura (cm)</label>
            <input type="number" className="input-field" placeholder="171" value={form.altura_cm} onChange={e => set('altura_cm', e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Peso atual (kg)</label>
            <input type="number" step="0.1" className="input-field" placeholder="92" value={form.peso_inicial_kg} onChange={e => set('peso_inicial_kg', e.target.value)} />
          </div>
          <div>
            <label className="label">HbA1c atual (%)</label>
            <input type="number" step="0.1" className="input-field" placeholder="13" value={form.hba1c_inicial} onChange={e => set('hba1c_inicial', e.target.value)} />
          </div>
        </div>

        <div>
          <label className="label">Medicação em uso</label>
          <input className="input-field" value={form.medicacao} onChange={e => set('medicacao', e.target.value)} />
        </div>

        <div>
          <label className="label">Objetivo principal</label>
          <input className="input-field" placeholder="Ex: Perder gordura e controlar a glicemia" value={form.objetivo} onChange={e => set('objetivo', e.target.value)} />
        </div>

        <div className="bg-primary-50 rounded-2xl p-4 text-sm text-primary-700">
          <strong>Lembrete importante:</strong> este app organiza e acompanha seus dados, mas não substitui o acompanhamento médico. Decisões sobre medicação são do seu médico.
        </div>

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Salvando...' : 'Começar a usar o Glico'}
        </button>

        <button type="button" onClick={() => navigate('/dashboard')} className="btn-ghost text-center w-full">
          Pular por agora
        </button>
      </form>
    </div>
  )
}
