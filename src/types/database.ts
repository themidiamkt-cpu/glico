export type GlucoseContexto =
  | 'jejum'
  | 'pre_treino'
  | 'pos_treino'
  | 'pre_refeicao'
  | 'pos_refeicao_1h30'
  | 'antes_dormir'
  | 'aleatorio'

export type TreinoTipo = 'A' | 'B' | 'C' | 'D' | 'E' | 'corrida'
export type TreinoFase = 'base' | 'consolidacao' | 'alvo'
export type RefeicaoTipo =
  | 'cafe'
  | 'pre_treino'
  | 'pos_treino'
  | 'almoco'
  | 'cafe_tarde'
  | 'jantar'
  | 'ceia'

export interface Profile {
  id: string
  nome: string | null
  altura_cm: number | null
  peso_inicial_kg: number | null
  data_nascimento: string | null
  tipo_diabetes: string | null
  hba1c_inicial: number | null
  medicacao: string | null
  objetivo: string | null
  created_at: string
}

export interface GlucoseReading {
  id: string
  user_id: string
  medido_em: string
  valor_mg_dl: number
  contexto: GlucoseContexto
  refeicao_ou_treino: string | null
  como_se_sentiu: string | null
  observacao: string | null
  created_at: string
}

export interface WeightLog {
  id: string
  user_id: string
  data: string
  peso_kg: number | null
  cintura_cm: number | null
  pescoco_cm: number | null
  created_at: string
}

export interface WorkoutLog {
  id: string
  user_id: string
  data: string
  semana: number | null
  fase: TreinoFase | null
  treino: TreinoTipo | null
  concluido: boolean
  duracao_min: number | null
  observacao: string | null
  created_at: string
}

export interface ExerciseLog {
  id: string
  workout_log_id: string
  exercicio: string
  carga_kg: number | null
  series: number | null
  reps: number | null
}

export interface DailyChecklist {
  id: string
  user_id: string
  data: string
  agua_litros: number | null
  treino_feito: boolean
  whey: boolean
  creatina: boolean
  caminhada_pos_refeicao: boolean
  sem_doce: boolean
  created_at: string
}

export interface MealLog {
  id: string
  user_id: string
  medido_em: string
  refeicao: RefeicaoTipo
  descricao: string | null
  created_at: string
}

// Supabase generic type
export interface Database {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Partial<Profile>; Update: Partial<Profile> }
      glucose_readings: { Row: GlucoseReading; Insert: Omit<GlucoseReading, 'id' | 'created_at'>; Update: Partial<GlucoseReading> }
      weight_logs: { Row: WeightLog; Insert: Omit<WeightLog, 'id' | 'created_at'>; Update: Partial<WeightLog> }
      workout_logs: { Row: WorkoutLog; Insert: Omit<WorkoutLog, 'id' | 'created_at'>; Update: Partial<WorkoutLog> }
      exercise_logs: { Row: ExerciseLog; Insert: Omit<ExerciseLog, 'id'>; Update: Partial<ExerciseLog> }
      daily_checklist: { Row: DailyChecklist; Insert: Omit<DailyChecklist, 'id' | 'created_at'>; Update: Partial<DailyChecklist> }
      meal_logs: { Row: MealLog; Insert: Omit<MealLog, 'id' | 'created_at'>; Update: Partial<MealLog> }
    }
    Enums: {
      glucose_contexto: GlucoseContexto
      treino_tipo: TreinoTipo
      treino_fase: TreinoFase
      refeicao_tipo: RefeicaoTipo
    }
  }
}

// Helpers
export const contextoLabels: Record<GlucoseContexto, string> = {
  jejum: 'Jejum',
  pre_treino: 'Pré-treino',
  pos_treino: 'Pós-treino',
  pre_refeicao: 'Pré-refeição',
  pos_refeicao_1h30: 'Pós-refeição (1h30)',
  antes_dormir: 'Antes de dormir',
  aleatorio: 'Aleatório',
}

export const treinoLabels: Record<TreinoTipo, string> = {
  A: 'Treino A',
  B: 'Treino B',
  C: 'Treino C',
  D: 'Treino D',
  E: 'Treino E',
  corrida: 'Corrida',
}

export const faseLabels: Record<TreinoFase, string> = {
  base: 'Fase Base',
  consolidacao: 'Fase Consolidação',
  alvo: 'Fase Alvo',
}

export const refeicaoLabels: Record<RefeicaoTipo, string> = {
  cafe: 'Café da manhã',
  pre_treino: 'Pré-treino',
  pos_treino: 'Pós-treino',
  almoco: 'Almoço',
  cafe_tarde: 'Café da tarde',
  jantar: 'Jantar',
  ceia: 'Ceia',
}

export function getWeekFase(semana: number): TreinoFase {
  if (semana <= 4) return 'base'
  if (semana <= 8) return 'consolidacao'
  return 'alvo'
}
