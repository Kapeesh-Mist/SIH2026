/**
 * API client configuration and endpoints wrapper for FinTrack.
 */

export interface HealthStatus {
  status: string;
  app_name: string;
  version: string;
  environment: string;
  timestamp: string;
  database: string;
  details?: Record<string, any>;
}

export interface ProjectSummary {
  id: string;
  project_code: string;
  title: string;
  department: string;
  sanction_date: string;
  total_sanctioned_budget: number;
  disbursed_budget: number;
  utilized_budget: number;
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD';
  progress_percentage: number;
  sub_projects?: Array<{
    id: string;
    project_code: string;
    title: string;
    allocated_budget: number;
    utilized_budget: number;
    status: string;
    progress_percentage: number;
  }>;
  recent_expenses?: Array<{
    invoice_number: string;
    vendor: string;
    amount: number;
    date: string;
    category: string;
    status: string;
  }>;
  active_anomalies?: Array<{
    id: string;
    type: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    description: string;
    date_flagged: string;
  }>;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export const apiClient = {
  /**
   * Fetch backend system health check
   */
  async getHealth(): Promise<HealthStatus> {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Health check failed with status: ${response.status}`);
    }

    return response.json();
  },

  /**
   * Fetch container readiness probe
   */
  async getReadiness(): Promise<{ ready: boolean; services: Record<string, boolean> }> {
    const response = await fetch(`${API_BASE_URL}/ready`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Readiness check failed with status: ${response.status}`);
    }

    return response.json();
  },
};
