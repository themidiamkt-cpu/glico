import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Login() {
  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')

  const handle = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    if (mode === 'login') {
      const { error } = await signIn(email, password)
      if (error) {
        setError('E-mail ou senha incorretos.')
      } else {
        navigate('/dashboard')
      }
    } else {
      const { error } = await signUp(email, password)
      if (error) {
        setError(error.message.includes('already') ? 'Este e-mail já está cadastrado.' : 'Erro ao criar conta. Tente novamente.')
      } else {
        setSuccess('Conta criada! Verifique seu e-mail para confirmar (ou faça login direto).')
        setMode('login')
      }
    }
    setLoading(false)
  }

  return (
    <div className="min-h-dvh bg-app flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-3xl mb-4 shadow-card-md">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <path d="M16 4L16 28M16 4C16 4 10 11 10 17C10 20.314 12.686 23 16 23C19.314 23 22 20.314 22 17C22 11 16 4 16 4Z"
                stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="rgba(255,255,255,0.15)" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Glico</h1>
          <p className="text-muted mt-1 text-sm">Seu companheiro de saúde diário</p>
        </div>

        {/* Card */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-1">
            {mode === 'login' ? 'Entrar' : 'Criar conta'}
          </h2>
          <p className="text-muted text-sm mb-6">
            {mode === 'login' ? 'Bem-vindo de volta.' : 'Comece a acompanhar sua saúde.'}
          </p>

          <form onSubmit={handle} className="space-y-4">
            <div>
              <label className="label">E-mail</label>
              <input
                type="email"
                className="input-field"
                placeholder="seu@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div>
              <label className="label">Senha</label>
              <input
                type="password"
                className="input-field"
                placeholder={mode === 'signup' ? 'Mínimo 8 caracteres' : '••••••••'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={mode === 'signup' ? 8 : undefined}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 text-red-700 text-sm px-4 py-3 rounded-2xl">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm px-4 py-3 rounded-2xl">
                {success}
              </div>
            )}

            <button type="submit" className="btn-primary mt-2" disabled={loading}>
              {loading ? 'Aguarde...' : mode === 'login' ? 'Entrar' : 'Criar conta'}
            </button>
          </form>

          <button
            onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); setSuccess('') }}
            className="w-full text-center text-sm text-muted mt-4 py-2"
          >
            {mode === 'login'
              ? <>Não tem conta? <span className="text-primary font-medium">Criar conta</span></>
              : <>Já tem conta? <span className="text-primary font-medium">Entrar</span></>}
          </button>
        </div>

        <p className="text-center text-xs text-muted mt-8 px-4 leading-relaxed">
          Este app organiza seus dados de saúde, mas não substitui o acompanhamento médico. Decisões de medicação são sempre do seu médico.
        </p>
      </div>
    </div>
  )
}
