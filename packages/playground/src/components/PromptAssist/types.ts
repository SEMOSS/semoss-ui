export enum IssueType {
  VAGUE = 'vague',
  MISSING_CONTEXT = 'missing_context',
  INEFFICIENT = 'inefficient',
  AMBIGUOUS = 'ambiguous',
  MISSING_ROLE = 'missing_role',
  MISSING_FORMAT = 'missing_format',
}

export enum Severity {
  CRITICAL = 'critical',
  MEDIUM = 'medium',
  LOW = 'low',
}

export enum Impact {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

export interface PromptIssue {
  id: string;
  start: number;
  end: number;
  type: IssueType;
  severity: Severity;
  message: string;
  suggestion: string;
  impact?: Impact;
}

export interface AnalysisResult {
  issues: PromptIssue[];
  quality_score: number;
  token_count: number;
  estimated_improvement?: number;
}

export interface OptimizationResult {
  optimized_prompt: string;
  improvements: Array<{
    change: string;
    impact: Impact;
  }>;
  token_savings: number;
  quality_improvement: number;
  before_score: number;
  after_score: number;
}

export interface PromptAssistConfig {
  enabled: boolean;
  autoAnalyze: boolean;
  debounceMs: number;
  apiEndpoint: string;
  showQualityScore: boolean;
  useLLM: boolean;
}

export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  category: 'data_analysis' | 'code_generation' | 'summarization' | 'general';
  template: string;
  tags: string[];
}
