-- Create parcelas table for agricultural parcel management
CREATE TABLE IF NOT EXISTS parcelas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  municipio TEXT,
  nombre_parcela TEXT,
  pol INT,
  par INT,
  rec INT,
  sup_total FLOAT,
  sup_srr FLOAT,
  sr TEXT,
  lab_anterior TEXT,
  cultivo_anterior TEXT,
  cultivo_actual TEXT,
  variedad TEXT,
  laboreo_actual TEXT,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE parcelas ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own parcelas
CREATE POLICY "parcelas_select_own" ON parcelas 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "parcelas_insert_own" ON parcelas 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "parcelas_update_own" ON parcelas 
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "parcelas_delete_own" ON parcelas 
  FOR DELETE USING (auth.uid() = user_id);
