import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'

type Tab = 'receitas' | 'cardapio' | 'compras'

interface Recipe {
  id: string
  nome: string
  categoria: string
  ingredientes: string | null
  modo_preparo: string | null
  observacao: string | null
}

interface MealPlan {
  id: string
  dia_semana: string
  refeicao: string
  descricao: string | null
  recipe_id: string | null
}

interface ShoppingItem {
  id: string
  categoria: string
  item: string
  quantidade: string | null
  comprado: boolean
}

const DIAS = ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo']
const DIA_LABELS: Record<string, string> = {
  segunda: 'Segunda', terca: 'Terca', quarta: 'Quarta', quinta: 'Quinta',
  sexta: 'Sexta', sabado: 'Sabado', domingo: 'Domingo',
}
const REFEICAO_LABELS: Record<string, string> = {
  cafe: 'Cafe da manha', pre_treino: 'Pre-treino', pos_treino: 'Pos-treino',
  almoco: 'Almoco', cafe_tarde: 'Lanche da tarde', jantar: 'Jantar', ceia: 'Ceia',
}
const REFEICAO_ORDER = ['cafe', 'pre_treino', 'almoco', 'pos_treino', 'cafe_tarde', 'jantar', 'ceia']

const CATEGORIA_LABELS: Record<string, string> = {
  proteinas: 'Proteinas', carboidratos: 'Carboidratos',
  frutas: 'Frutas', saladas_legumes: 'Saladas e Legumes', temperos: 'Temperos e Extras',
}

const CAT_ICONS: Record<string, string> = {
  cafe: '☕', pre_treino: '⚡', pos_treino: '💪', almoco: '🍽️',
  cafe_tarde: '🥗', jantar: '🌙', ceia: '🥛',
}

// =============================================
// Receitas
// =============================================
function Receitas({ recipes }: { recipes: Recipe[] }) {
  const [selected, setSelected] = useState<Recipe | null>(null)

  const categorias = Array.from(new Set(recipes.map(r => r.categoria)))

  const catIcon: Record<string, string> = {
    cafe: '☕', almoco: '🍽️', jantar: '🌙', lanche: '🥗',
    pre_treino: '⚡', pos_treino: '💪', preparo: '🥘',
  }

  if (selected) {
    return (
      <div>
        <button
          onClick={() => setSelected(null)}
          className="flex items-center gap-2 text-muted text-sm mb-4"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          Voltar
        </button>
        <div className="card space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary-50 flex items-center justify-center text-2xl">
              {catIcon[selected.categoria] ?? '🍳'}
            </div>
            <div>
              <h2 className="font-bold text-gray-900">{selected.nome}</h2>
              <span className="text-xs text-muted capitalize">{selected.categoria.replace('_', ' ')}</span>
            </div>
          </div>
          {selected.ingredientes && (
            <div>
              <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">Ingredientes</p>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{selected.ingredientes}</p>
            </div>
          )}
          {selected.modo_preparo && (
            <div className="border-t border-border pt-4">
              <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">Modo de preparo</p>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{selected.modo_preparo}</p>
            </div>
          )}
          {selected.observacao && (
            <div className="bg-primary-50 rounded-2xl p-3">
              <p className="text-xs text-primary font-medium">{selected.observacao}</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (recipes.length === 0) {
    return (
      <div className="card text-center py-10">
        <p className="text-4xl mb-3">🍳</p>
        <p className="text-muted text-sm">Nenhuma receita cadastrada.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {categorias.map(cat => (
        <div key={cat}>
          <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2 px-1">
            {catIcon[cat] ?? ''} {cat.replace('_', ' ')}
          </p>
          <div className="space-y-2">
            {recipes.filter(r => r.categoria === cat).map(r => (
              <button
                key={r.id}
                onClick={() => setSelected(r)}
                className="card w-full text-left flex items-center gap-3 active:scale-[0.98] transition-transform"
              >
                <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center text-lg flex-shrink-0">
                  {catIcon[r.categoria] ?? '🍳'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm">{r.nome}</p>
                  {r.observacao && (
                    <p className="text-xs text-muted truncate">{r.observacao}</p>
                  )}
                </div>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M9 18L15 12L9 6" stroke="#8A8A8A" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// =============================================
// Cardapio
// =============================================
function Cardapio({ meals }: { meals: MealPlan[] }) {
  const todayIdx = new Date().getDay()
  const diaHoje = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'][todayIdx]
  const [diaSelected, setDiaSelected] = useState(diaHoje)

  const diasComDados = DIAS.filter(d => meals.some(m => m.dia_semana === d))
  const refeicoesDia = meals
    .filter(m => m.dia_semana === diaSelected)
    .sort((a, b) => REFEICAO_ORDER.indexOf(a.refeicao) - REFEICAO_ORDER.indexOf(b.refeicao))

  return (
    <div>
      {/* Seletor de dia */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 mb-4">
        {diasComDados.map(d => (
          <button
            key={d}
            onClick={() => setDiaSelected(d)}
            className={`flex-shrink-0 px-4 py-2 rounded-2xl text-xs font-semibold transition-all ${
              diaSelected === d
                ? 'bg-primary text-white'
                : 'bg-surface border border-border text-gray-700'
            }`}
          >
            {DIA_LABELS[d]}
          </button>
        ))}
      </div>

      {/* Refeicoes do dia */}
      <div className="space-y-2">
        {refeicoesDia.length === 0 ? (
          <div className="card text-center py-8">
            <p className="text-muted text-sm">Nenhuma refeicao para este dia.</p>
          </div>
        ) : (
          refeicoesDia.map(m => (
            <div key={m.id} className="card flex gap-3">
              <div className="w-10 h-10 rounded-2xl bg-primary-50 flex items-center justify-center text-lg flex-shrink-0">
                {CAT_ICONS[m.refeicao] ?? '🍽️'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-primary uppercase tracking-wide">
                  {REFEICAO_LABELS[m.refeicao] ?? m.refeicao}
                </p>
                <p className="text-sm text-gray-800 mt-0.5 leading-snug">{m.descricao ?? 'Sem descricao'}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

// =============================================
// Lista de compras
// =============================================
function ListaCompras({ items: initialItems, userId }: { items: ShoppingItem[], userId: string }) {
  const [items, setItems] = useState(initialItems)
  const [toggling, setToggling] = useState<string | null>(null)

  // Sync when initialItems change
  useEffect(() => { setItems(initialItems) }, [initialItems])

  const toggle = async (item: ShoppingItem) => {
    setToggling(item.id)
    const newVal = !item.comprado
    await supabase.from('shopping_items').update({ comprado: newVal }).eq('id', item.id)
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, comprado: newVal } : i))
    setToggling(null)
  }

  const resetAll = async () => {
    await supabase.from('shopping_items').update({ comprado: false }).eq('user_id', userId)
    setItems(prev => prev.map(i => ({ ...i, comprado: false })))
  }

  const total = items.length
  const done = items.filter(i => i.comprado).length

  const categorias = Array.from(new Set(items.map(i => i.categoria)))

  return (
    <div>
      {/* Progress */}
      <div className="card mb-4">
        <div className="flex items-center justify-between mb-2">
          <p className="font-semibold text-gray-900">{done} de {total} itens</p>
          {done > 0 && (
            <button onClick={resetAll} className="text-xs text-muted underline">
              Resetar tudo
            </button>
          )}
        </div>
        <div className="h-2 bg-border rounded-full">
          <div
            className="h-full bg-primary rounded-full transition-all"
            style={{ width: total > 0 ? `${(done / total) * 100}%` : '0%' }}
          />
        </div>
        {done === total && total > 0 && (
          <p className="text-xs text-primary font-semibold mt-2 text-center">Lista completa!</p>
        )}
      </div>

      {/* Items por categoria */}
      <div className="space-y-4">
        {categorias.map(cat => {
          const catItems = items.filter(i => i.categoria === cat)
          return (
            <div key={cat}>
              <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2 px-1">
                {CATEGORIA_LABELS[cat] ?? cat}
              </p>
              <div className="space-y-1.5">
                {catItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => toggle(item)}
                    disabled={toggling === item.id}
                    className={`card w-full text-left flex items-center gap-3 active:scale-[0.98] transition-all ${
                      item.comprado ? 'opacity-50' : ''
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                      item.comprado ? 'bg-primary border-primary' : 'border-border'
                    }`}>
                      {item.comprado && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                          <path d="M5 13L9 17L19 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1">
                      <span className={`text-sm font-medium ${item.comprado ? 'line-through text-muted' : 'text-gray-900'}`}>
                        {item.item}
                      </span>
                      {item.quantidade && (
                        <span className="text-xs text-muted ml-2">{item.quantidade}</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// =============================================
// Main
// =============================================
export default function Alimentacao() {
  const { user } = useAuth()
  const [tab, setTab] = useState<Tab>('cardapio')
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [meals, setMeals] = useState<MealPlan[]>([])
  const [items, setItems] = useState<ShoppingItem[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    if (!user) return
    const [recRes, mealRes, shopRes] = await Promise.all([
      supabase.from('recipes').select('*').eq('user_id', user.id),
      supabase.from('meal_plan').select('*').eq('user_id', user.id),
      supabase.from('shopping_items').select('*').eq('user_id', user.id).order('categoria').order('item'),
    ])
    if (recRes.data) setRecipes(recRes.data as Recipe[])
    if (mealRes.data) setMeals(mealRes.data as MealPlan[])
    if (shopRes.data) setItems(shopRes.data as ShoppingItem[])
    setLoading(false)
  }

  useEffect(() => { load() }, [user])

  const tabs: { key: Tab; label: string }[] = [
    { key: 'cardapio', label: 'Cardapio' },
    { key: 'receitas', label: 'Receitas' },
    { key: 'compras', label: 'Compras' },
  ]

  return (
    <Layout title="Alimentacao">
      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-2.5 rounded-2xl text-sm font-semibold transition-all ${
              tab === t.key
                ? 'bg-primary text-white shadow-sm'
                : 'bg-surface border border-border text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {tab === 'cardapio' && <Cardapio meals={meals} />}
          {tab === 'receitas' && <Receitas recipes={recipes} />}
          {tab === 'compras' && user && <ListaCompras items={items} userId={user.id} />}
        </>
      )}
    </Layout>
  )
}
