/**
 * API client configuration and endpoints wrapper for FinTrack (SIH26102).
 */

export interface User {
  id: string;
  email: string;
  full_name: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface Hierarchy {
  id: string;
  name: string;
  description?: string | null;
  initial_budget: number;
  owner_id: string;
  status: string;
  created_at: string;
}

export interface RoadmapVersion {
  id: string;
  hierarchy_id: string;
  version_no: number;
  extracted_json: {
    categories?: Record<
      string,
      {
        amount?: number;
        expected_progress?: number;
        progress_unit?: string;
        expected_range?: [number, number];
        timeline_days?: number | null;
      }
    >;
    [key: string]: any;
  };
  approved_by?: string | null;
  created_at: string;
}

export interface Node {
  id: string;
  hierarchy_id: string;
  parent_id: string | null;
  path: string;
  user_id: string;
  role: string;
  allocated_budget: number;
  status: string;
  created_at?: string;
  children?: Node[];
}

export interface NodeCreationRequest {
  id: string;
  parent_id: string;
  requested_by: string;
  template_category?: string | null;
  justification_text: string;
  status: string;
  approver_ids?: string[] | null;
  decided_at?: string | null;
}

export interface Expense {
  id: string;
  node_id: string;
  category: string;
  amount: number;
  progress_value?: number | null;
  progress_unit?: string | null;
  status: string;
  uploaded_at: string;
}

export interface Document {
  id: string;
  node_id: string;
  expense_id?: string | null;
  doc_type: string;
  file_url: string;
  parsed_data?: Record<string, any> | null;
  verified_by?: string | null;
  verified_at?: string | null;
  uploaded_at: string;
}

export interface Alert {
  id: string;
  node_id?: string | null;
  expense_id?: string | null;
  layer: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  escalated_to_node_id?: string | null;
  resolved: boolean;
  created_at: string;
}

class ApiClient {
  private baseUrl: string = '';

  private getToken(): string | null {
    return localStorage.getItem('fintrack_token');
  }

  public setToken(token: string) {
    localStorage.setItem('fintrack_token', token);
  }

  public removeToken() {
    localStorage.removeItem('fintrack_token');
    localStorage.removeItem('fintrack_user');
  }

  public getCurrentUser(): User | null {
    const userStr = localStorage.getItem('fintrack_user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  public setCurrentUser(user: User) {
    localStorage.setItem('fintrack_user', JSON.stringify(user));
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorMsg = `Request failed (${response.status})`;
      try {
        const errJson = await response.json();
        errorMsg = errJson.detail || errJson.message || errorMsg;
      } catch {
        // use fallback errorMsg
      }
      throw new Error(errorMsg);
    }

    return response.json();
  }

  // --- Auth Endpoints ---
  async login(payload: { email: string; password: string }): Promise<AuthResponse> {
    const res = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    this.setToken(res.access_token);
    this.setCurrentUser(res.user);
    return res;
  }

  async register(payload: {
    email: string;
    password: string;
    full_name: string;
    aadhaar_ref?: string;
  }): Promise<AuthResponse> {
    const res = await this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    this.setToken(res.access_token);
    this.setCurrentUser(res.user);
    return res;
  }

  // --- Hierarchies Endpoints ---
  async getHierarchies(): Promise<Hierarchy[]> {
    return this.request<Hierarchy[]>('/hierarchies');
  }

  async createHierarchy(formData: FormData): Promise<Hierarchy> {
    return this.request<Hierarchy>('/hierarchies', {
      method: 'POST',
      body: formData,
    });
  }

  async getLatestRoadmap(hierarchyId: string): Promise<RoadmapVersion> {
    return this.request<RoadmapVersion>(`/hierarchies/${hierarchyId}/roadmap/latest`);
  }

  async submitRoadmapReview(
    hierarchyId: string,
    payload: { edited_json: Record<string, any> }
  ): Promise<RoadmapVersion> {
    return this.request<RoadmapVersion>(`/hierarchies/${hierarchyId}/roadmap/review`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // --- Nodes Endpoints ---
  async getNodeTree(hierarchyId: string): Promise<Node[]> {
    return this.request<Node[]>(`/nodes/${hierarchyId}/tree`);
  }

  async createNode(payload: {
    hierarchy_id: string;
    parent_id?: string | null;
    role: string;
    allocated_budget: number;
    user_id?: string;
  }): Promise<Node> {
    return this.request<Node>('/nodes', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async requestNewNode(
    parentNodeId: string,
    payload: {
      template_category?: string;
      justification_text: string;
      allocated_budget: number;
      role: string;
    }
  ): Promise<NodeCreationRequest> {
    return this.request<NodeCreationRequest>(`/nodes`, {
      method: 'POST',
      body: JSON.stringify({
        parent_id: parentNodeId,
        ...payload,
      }),
    });
  }

  async decideNodeRequest(
    requestId: string,
    payload: { approve: boolean; reason?: string }
  ): Promise<NodeCreationRequest> {
    return this.request<NodeCreationRequest>(`/nodes/requests/${requestId}/decision`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // --- Expenses & Document Upload Endpoints ---
  async getNodeExpenses(nodeId: string): Promise<Expense[]> {
    return this.request<Expense[]>(`/nodes/${nodeId}/expenses`);
  }

  async uploadExpense(nodeId: string, formData: FormData): Promise<Expense> {
    return this.request<Expense>(`/nodes/${nodeId}/expenses`, {
      method: 'POST',
      body: formData,
    });
  }

  // --- Verification Endpoints ---
  async verifyDocument(documentId: string): Promise<Document> {
    return this.request<Document>(`/documents/${documentId}/verify`, {
      method: 'POST',
    });
  }

  async rejectDocument(documentId: string, reason: string): Promise<Document> {
    return this.request<Document>(`/documents/${documentId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  // --- Alerts Endpoints ---
  async getAlerts(params?: { hierarchy_id?: string; node_id?: string; resolved?: boolean }): Promise<Alert[]> {
    const query = new URLSearchParams();
    if (params?.hierarchy_id) query.append('hierarchy_id', params.hierarchy_id);
    if (params?.node_id) query.append('node_id', params.node_id);
    if (params?.resolved !== undefined) query.append('resolved', String(params.resolved));
    const qs = query.toString() ? `?${query.toString()}` : '';
    return this.request<Alert[]>(`/alerts${qs}`);
  }

  async resolveAlert(alertId: string): Promise<Alert> {
    return this.request<Alert>(`/alerts/${alertId}/resolve`, {
      method: 'POST',
    });
  }
}

export const api = new ApiClient();
