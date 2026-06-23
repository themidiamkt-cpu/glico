import type { TreinoTipo, TreinoFase } from '../types/database'

// =============================================
// Programa híbrido 12 semanas
// 5x musculação (A-E) + 3x corrida
// =============================================

export const WEEKLY_SCHEDULE: Record<number, TreinoTipo[]> = {
  0: ['corrida'],     // Domingo
  1: ['A'],           // Segunda
  2: ['B'],           // Terça
  3: ['corrida'],     // Quarta
  4: ['C'],           // Quinta
  5: ['D'],           // Sexta
  6: ['E', 'corrida'], // Sábado (força + corrida leve)
}

export interface ExerciseTemplate {
  nome: string
  grupo: string
  series: number
  reps: string
  dica?: string
}

export const WORKOUT_TEMPLATES: Record<TreinoTipo, ExerciseTemplate[]> = {
  A: [
    { nome: 'Supino Reto', grupo: 'Peito', series: 4, reps: '8-10', dica: 'Desça até tocar o peito, suba controlado' },
    { nome: 'Supino Inclinado', grupo: 'Peito', series: 3, reps: '10-12' },
    { nome: 'Crucifixo', grupo: 'Peito', series: 3, reps: '12-15' },
    { nome: 'Desenvolvimento com Halteres', grupo: 'Ombros', series: 4, reps: '10-12' },
    { nome: 'Elevação Lateral', grupo: 'Ombros', series: 3, reps: '12-15' },
    { nome: 'Tríceps Pulley (corda)', grupo: 'Tríceps', series: 3, reps: '12-15' },
    { nome: 'Tríceps Francês', grupo: 'Tríceps', series: 3, reps: '10-12' },
  ],
  B: [
    { nome: 'Puxada Frontal', grupo: 'Costas', series: 4, reps: '8-10', dica: 'Puxe até o queixo, retorne devagar' },
    { nome: 'Remada Curvada (barra)', grupo: 'Costas', series: 4, reps: '8-10' },
    { nome: 'Remada Unilateral (halter)', grupo: 'Costas', series: 3, reps: '10-12 cada' },
    { nome: 'Pullover', grupo: 'Costas', series: 3, reps: '12-15' },
    { nome: 'Rosca Direta', grupo: 'Bíceps', series: 3, reps: '10-12' },
    { nome: 'Rosca Martelo', grupo: 'Bíceps', series: 3, reps: '12-15' },
    { nome: 'Rosca Concentrada', grupo: 'Bíceps', series: 2, reps: '12-15 cada' },
  ],
  C: [
    { nome: 'Agachamento Livre', grupo: 'Quadríceps', series: 4, reps: '8-10', dica: 'Desça até paralelo, joelhos alinhados' },
    { nome: 'Leg Press 45°', grupo: 'Quadríceps', series: 4, reps: '10-15' },
    { nome: 'Mesa Flexora', grupo: 'Posterior', series: 4, reps: '10-12' },
    { nome: 'Cadeira Extensora', grupo: 'Quadríceps', series: 3, reps: '12-15' },
    { nome: 'Afundo com Halteres', grupo: 'Glúteos', series: 3, reps: '12 cada' },
    { nome: 'Panturrilha em Pé', grupo: 'Panturrilha', series: 4, reps: '15-20' },
    { nome: 'Abdominal (prancha)', grupo: 'Core', series: 3, reps: '45-60s' },
  ],
  D: [
    { nome: 'Desenvolvimento Arnold', grupo: 'Ombros', series: 4, reps: '10-12' },
    { nome: 'Elevação Lateral', grupo: 'Ombros', series: 4, reps: '12-15' },
    { nome: 'Elevação Frontal', grupo: 'Ombros', series: 3, reps: '12-15' },
    { nome: 'Rosca Scott', grupo: 'Bíceps', series: 3, reps: '10-12' },
    { nome: 'Rosca 21', grupo: 'Bíceps', series: 3, reps: '21' },
    { nome: 'Tríceps Corda', grupo: 'Tríceps', series: 3, reps: '12-15' },
    { nome: 'Mergulho (banco)', grupo: 'Tríceps', series: 3, reps: '12-15' },
    { nome: 'Abdominal Crunch', grupo: 'Core', series: 4, reps: '20-25' },
  ],
  E: [
    { nome: 'Stiff (terra)', grupo: 'Posterior', series: 4, reps: '10-12', dica: 'Costas retas, sinta o alongamento' },
    { nome: 'Cadeira Adutora', grupo: 'Glúteos', series: 3, reps: '12-15' },
    { nome: 'Elevação Pélvica', grupo: 'Glúteos', series: 4, reps: '12-15' },
    { nome: 'Panturrilha Sentado', grupo: 'Panturrilha', series: 4, reps: '15-20' },
    { nome: 'Supino Inclinado Halter', grupo: 'Peito', series: 3, reps: '10-12' },
    { nome: 'Remada Cavalinho', grupo: 'Costas', series: 3, reps: '10-12' },
    { nome: 'Prancha Lateral', grupo: 'Core', series: 3, reps: '30-40s cada' },
  ],
  corrida: [
    { nome: 'Aquecimento (caminhada 5 min)', grupo: 'Cardio', series: 1, reps: '5 min' },
    { nome: 'Tiro 1: corrida moderada', grupo: 'Cardio', series: 1, reps: '8-10 min' },
    { nome: 'Recuperação ativa', grupo: 'Cardio', series: 1, reps: '2 min' },
    { nome: 'Tiro 2: corrida moderada', grupo: 'Cardio', series: 1, reps: '8-10 min' },
    { nome: 'Recuperação ativa', grupo: 'Cardio', series: 1, reps: '2 min' },
    { nome: 'Tiro 3 (opcional): corrida leve', grupo: 'Cardio', series: 1, reps: '5-8 min' },
    { nome: 'Volta à calma (caminhada)', grupo: 'Cardio', series: 1, reps: '5 min' },
  ],
}

export const WORKOUT_NAMES: Record<TreinoTipo, string> = {
  A: 'Peito + Ombros + Tríceps',
  B: 'Costas + Bíceps',
  C: 'Pernas',
  D: 'Ombros + Braços',
  E: 'Posterior + Glúteos + Core',
  corrida: 'Corrida / Esteira',
}

export function getTodayTreinos(): TreinoTipo[] {
  const dow = new Date().getDay()
  return WEEKLY_SCHEDULE[dow] ?? []
}

export function getWeekFaseInfo(semana: number): { fase: TreinoFase; descricao: string } {
  if (semana <= 4) return { fase: 'base', descricao: 'Foco em técnica, volume moderado' }
  if (semana <= 8) return { fase: 'consolidacao', descricao: 'Aumento de carga e volume' }
  return { fase: 'alvo', descricao: 'Intensidade máxima, pico de performance' }
}

export const DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
export const DAY_NAMES_FULL = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
