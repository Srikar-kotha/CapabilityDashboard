export type CapabilityType = 'AI' | 'Non-AI';
export type AccessType = 'shared_path' | 'url';

export interface Capability {
  id: string;
  name: string;
  short_description: string;
  long_description: string;
  area_of_impact: string[];
  capability_type: CapabilityType;
  how_to_access: string;
  prerequisites: string;
  where_to_execute: string;
  executable_path: string;
  estimated_savings: string;
  point_of_contact: string;
  implemented_team: string;
  access_type: AccessType;
  shared_path_location: string;
  url_location: string;
  last_updated: string;
  created_at: string;
  updated_at: string;
  metrics?: CapabilityMetrics;
}

export interface CapabilityMetrics {
  id: string;
  capability_id: string;
  avg_hours_saved_per_run: number;
  total_runs: number;
  ytd_hours_saved: number;
  ytd_financial_savings: number;
  weekly_savings: number;
  monthly_savings: number;
  quarterly_savings: number;
  yearly_savings: number;
  financial_savings: number;
  operational_efficiency_gain_pct: number;
  automation_accuracy_pct: number;
  last_execution_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface Database {
  public: {
    Tables: {
      capabilities: {
        Row: Capability;
        Insert: Omit<Capability, 'id' | 'created_at' | 'updated_at' | 'metrics'>;
        Update: Partial<Omit<Capability, 'id' | 'created_at' | 'updated_at' | 'metrics'>>;
      };
      capability_metrics: {
        Row: CapabilityMetrics;
        Insert: Omit<CapabilityMetrics, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<CapabilityMetrics, 'id' | 'created_at' | 'updated_at'>>;
      };
    };
  };
}

export interface WizardFormData {
  // Step 2A
  name: string;
  short_description: string;
  area_of_impact: string[];
  capability_type: CapabilityType;
  ytd_hours_saved: string;
  ytd_financial_savings: string;
  // Step 2B
  long_description: string;
  how_to_access: string;
  prerequisites: string;
  where_to_execute: string;
  executable_path: string;
  estimated_savings: string;
  point_of_contact: string;
  implemented_team: string;
  // Step 2C
  access_type: AccessType;
  shared_path_location: string;
  url_location: string;
  // Step 2D metrics
  avg_hours_saved_per_run: string;
  total_runs: string;
  monthly_savings: string;
  weekly_savings: string;
  quarterly_savings: string;
  yearly_savings: string;
  financial_savings: string;
  operational_efficiency_gain_pct: string;
  automation_accuracy_pct: string;
}
