export type ReportStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface Report {
  id: number;
  user_id: number;
  module_id: number;
  report_type: string;
  status: ReportStatus;
  input_data: Record<string, any>;
  api_response?: Record<string, any>;
  generated_html?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  user?: {
    id: number;
    business_name: string;
    email: string;
  };
  module?: {
    name: string;
    display_name: string;
  };
}

export interface CreateReportInput {
  module_id: number;
  report_type: string;
  input_data: {
    codice_fiscale: string;
    [key: string]: any;
  };
}