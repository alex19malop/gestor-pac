export interface Parcela {
  id: string
  user_id: string
  municipio: string | null
  nombre_parcela: string | null
  pol: number | null
  par: number | null
  rec: number | null
  sup_total: number | null
  sup_srr: number | null
  sr: string | null
  lab_anterior: string | null
  cultivo_anterior: string | null
  cultivo_actual: string | null
  variedad: string | null
  laboreo_actual: string | null
  notas: string | null
  created_at: string
  updated_at: string
}

export type ParcelaInsert = Omit<Parcela, 'id' | 'created_at' | 'updated_at'>
export type ParcelaUpdate = Partial<Omit<Parcela, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
