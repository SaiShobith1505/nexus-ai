export type Agent = {
  id: string;
  name: string;
  slug: string;
  category: string;
  summary: string;
  description: string;
  prompt: string;
  workflow: Record<string, unknown>;
  tools: Array<Record<string, unknown>>;
  pricing_model: string;
  price_cents: number;
  rating: number;
  review_count: number;
  is_featured: boolean;
  is_published: boolean;
  created_at: string;
};

export type ExecutionStep = { name: string; status: string; detail: string };

export type Execution = {
  id: string;
  agent_id: string;
  status: string;
  steps: ExecutionStep[];
  output: {
    summary?: string;
    recommendations?: string[];
    repo_analysis?: Record<string, unknown>;
    artifacts?: Array<{ type: string; name: string; content: string }>;
  };
  tokens_used: number;
  cost_cents: number;
  created_at?: string;
};

export type Notification = {
  id: string;
  kind: string;
  title: string;
  body: string;
  data: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
};

export type DashboardSummary = {
  agents: number;
  executions: number;
  tokens: number;
  revenue_cents: number;
  activity: Array<{ id: string; status: string; tokens: number; created_at: string }>;
};

export type AuthUser = { id: string; email: string; name: string; role: string; is_active: boolean };
