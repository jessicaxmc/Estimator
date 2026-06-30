import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type LabourRate = {
  id: string;
  name: string;
  hourly_rate: number;
  created_at: string;
};

export type Material = {
  id: string;
  name: string;
  unit_cost: number;
  unit: string;
  created_at: string;
};

export type LabourLine = {
  line_id: string;
  rate_id: string;
  name: string;
  hourly_rate: number;
  hours: number;
};

export type MaterialLine = {
  line_id: string;
  material_id: string;
  name: string;
  unit_cost: number;
  qty: number;
};

export type Estimate = {
  id: string;
  job_name: string;
  client_name: string | null;
  markup_pct: number;
  labour_items: LabourLine[];
  material_items: MaterialLine[];
  total: number;
  created_at: string;
  updated_at: string;
};
