import { NavLink } from 'react-router-dom'

const nav = [
  {
    to: '/dashboard',
    label: 'Início',
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          d="M3 9.5L12 3L21 9.5V20C21 20.5523 20.5523 21 20 21H15V15H9V21H4C3.44772 21 3 20.5523 3 20V9.5Z"
          fill={active ? '#1B6B5E' : 'none'}
          stroke={active ? '#1B6B5E' : '#8A8A8A'}
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    to: '/glicemia',
    label: 'Glicemia',
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          d="M12 2L12 22M12 2C12 2 7 8 7 13C7 15.7614 9.23858 18 12 18C14.7614 18 17 15.7614 17 13C17 8 12 2 12 2Z"
          stroke={active ? '#1B6B5E' : '#8A8A8A'}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill={active ? '#E8F4F1' : 'none'}
        />
      </svg>
    ),
  },
  {
    to: '/treino',
    label: 'Treino',
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="6" width="4" height="12" rx="2" stroke={active ? '#1B6B5E' : '#8A8A8A'} strokeWidth="1.8" fill={active ? '#E8F4F1' : 'none'} />
        <rect x="17" y="6" width="4" height="12" rx="2" stroke={active ? '#1B6B5E' : '#8A8A8A'} strokeWidth="1.8" fill={active ? '#E8F4F1' : 'none'} />
        <line x1="7" y1="12" x2="10" y2="12" stroke={active ? '#1B6B5E' : '#8A8A8A'} strokeWidth="2" strokeLinecap="round" />
        <line x1="14" y1="12" x2="17" y2="12" stroke={active ? '#1B6B5E' : '#8A8A8A'} strokeWidth="2" strokeLinecap="round" />
        <rect x="9" y="9" width="6" height="6" rx="1.5" stroke={active ? '#1B6B5E' : '#8A8A8A'} strokeWidth="1.8" fill={active ? '#1B6B5E' : 'none'} />
      </svg>
    ),
  },
  {
    to: '/alimentacao',
    label: 'Alimentação',
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          d="M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8zM6 1v3M10 1v3M14 1v3"
          stroke={active ? '#1B6B5E' : '#8A8A8A'}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill={active ? '#E8F4F1' : 'none'}
        />
      </svg>
    ),
  },
  {
    to: '/mais',
    label: 'Mais',
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <circle cx="5" cy="12" r="1.5" fill={active ? '#1B6B5E' : '#8A8A8A'} />
        <circle cx="12" cy="12" r="1.5" fill={active ? '#1B6B5E' : '#8A8A8A'} />
        <circle cx="19" cy="12" r="1.5" fill={active ? '#1B6B5E' : '#8A8A8A'} />
      </svg>
    ),
  },
]

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-surface border-t border-border z-50"
         style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      <div className="flex items-stretch max-w-lg mx-auto">
        {nav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className="flex-1 flex flex-col items-center justify-center py-2.5 gap-1 min-h-[56px]"
          >
            {({ isActive }) => (
              <>
                {item.icon(isActive)}
                <span className={`text-[10px] font-medium leading-none ${isActive ? 'text-primary' : 'text-muted'}`}>
                  {item.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
