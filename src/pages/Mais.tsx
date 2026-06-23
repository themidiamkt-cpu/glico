import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'

interface MenuItem {
  label: string
  description: string
  icon: string
  to: string
  color: string
}

const menu: MenuItem[] = [
  {
    label: 'Esteira',
    description: 'Progressao de corrida semanal',
    icon: '🏃',
    to: '/esteira',
    color: 'bg-emerald-50',
  },
  {
    label: 'Peso e Medidas',
    description: 'Registro de peso e cintura',
    icon: '⚖️',
    to: '/peso',
    color: 'bg-blue-50',
  },
  {
    label: 'Relatorio',
    description: 'Resumo semanal em PDF',
    icon: '📊',
    to: '/relatorio',
    color: 'bg-amber-50',
  },
]

export default function Mais() {
  const navigate = useNavigate()
  const { user, profile } = useAuth()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <Layout title="Mais">
      {/* Profile card */}
      <div className="card mb-6 flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center flex-shrink-0">
          <span className="text-white text-2xl font-bold">
            {(profile?.nome ?? user?.email ?? 'U')[0].toUpperCase()}
          </span>
        </div>
        <div>
          <p className="font-bold text-gray-900">{profile?.nome ?? 'Perfil'}</p>
          <p className="text-sm text-muted">{user?.email}</p>
        </div>
      </div>

      {/* Metas */}
      <div className="card mb-4">
        <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-3">Metas</p>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-primary-50 rounded-2xl p-3 text-center">
            <p className="text-lg font-bold text-primary">82-85</p>
            <p className="text-xs text-muted">kg meta</p>
          </div>
          <div className="bg-primary-50 rounded-2xl p-3 text-center">
            <p className="text-lg font-bold text-primary">&lt;95</p>
            <p className="text-xs text-muted">cintura meta (cm)</p>
          </div>
        </div>
        <p className="text-xs text-muted text-center mt-2">Prazo: 01/09</p>
      </div>

      {/* Menu */}
      <div className="space-y-2 mb-6">
        {menu.map(item => (
          <button
            key={item.to}
            onClick={() => navigate(item.to)}
            className="card w-full text-left flex items-center gap-4 active:scale-[0.98] transition-transform"
          >
            <div className={`w-12 h-12 rounded-2xl ${item.color} flex items-center justify-center text-2xl flex-shrink-0`}>
              {item.icon}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900">{item.label}</p>
              <p className="text-xs text-muted">{item.description}</p>
            </div>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M9 18L15 12L9 6" stroke="#8A8A8A" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        ))}
      </div>

      {/* Aviso medico */}
      <div className="bg-amber-50 rounded-2xl p-4 mb-6">
        <p className="text-xs text-amber-800 leading-relaxed text-center">
          Este app e um auxiliar pessoal de acompanhamento. Nao substitui o acompanhamento medico.
          Consulte seu medico regularmente.
        </p>
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="w-full py-3 rounded-2xl border border-border text-danger text-sm font-semibold"
      >
        Sair da conta
      </button>
    </Layout>
  )
}
