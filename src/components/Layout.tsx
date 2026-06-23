import { ReactNode } from 'react'
import BottomNav from './BottomNav'

interface LayoutProps {
  children: ReactNode
  title?: string
  headerRight?: ReactNode
  noNav?: boolean
  noPadding?: boolean
}

export default function Layout({ children, title, headerRight, noNav, noPadding }: LayoutProps) {
  return (
    <div className="flex flex-col min-h-dvh max-w-lg mx-auto">
      {title && (
        <header className="sticky top-0 z-40 bg-app/90 backdrop-blur-sm border-b border-border/50 px-5 pt-safe">
          <div className="flex items-center justify-between h-14">
            <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
            {headerRight && <div>{headerRight}</div>}
          </div>
        </header>
      )}

      <main className={`flex-1 ${noPadding ? '' : 'px-4 py-5'} ${!noNav ? 'pb-24' : ''}`}>
        {children}
      </main>

      {!noNav && <BottomNav />}
    </div>
  )
}
