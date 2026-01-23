import {
  AnalysisResult,
  OptimizationResult,
  PromptTemplate,
} from '../components/PromptAssist/types';

class PromptAssistService {
  private baseUrl = 'http://127.0.0.1:8000';

  setBaseUrl(url: string) {
    this.baseUrl = url;
  }

  async analyzePrompt(
    text: string,
    useLLM = false
  ): Promise<AnalysisResult> {
    const response = await fetch(`${this.baseUrl}/api/prompt/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text, use_llm: useLLM }),
    });

    if (!response.ok) {
      throw new Error('Analysis request failed');
    }

    return response.json();
  }

  async optimizePrompt(text: string): Promise<OptimizationResult> {
    const response = await fetch(`${this.baseUrl}/api/prompt/optimize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      throw new Error('Optimization request failed');
    }

    return response.json();
  }

  async getTemplates(): Promise<PromptTemplate[]> {
    // Mock templates for now - can be replaced with API call
    return [
      {
        id: '1',
        name: 'Data Analysis',
        description: 'Analyze datasets with specific metrics',
        category: 'data_analysis',
        template:
          'You are a data analyst. Analyze the following dataset focusing on:\n1. Key trends and patterns\n2. Statistical insights\n3. Actionable recommendations\n\nFormat the response as bullet points.',
        tags: ['analysis', 'data', 'statistics'],
      },
      {
        id: '2',
        name: 'Code Generation',
        description: 'Generate clean, documented code',
        category: 'code_generation',
        template:
          'You are an expert programmer. Write clean, well-documented code that:\n1. Follows best practices\n2. Includes error handling\n3. Has clear comments\n\nProvide the code with explanations.',
        tags: ['code', 'programming', 'development'],
      },
      {
        id: '3',
        name: 'Summarization',
        description: 'Create concise summaries',
        category: 'summarization',
        template:
          'You are a professional summarizer. Create a concise summary that:\n1. Captures key points\n2. Maintains context\n3. Is easy to understand\n\nKeep it under 200 words.',
        tags: ['summary', 'brief', 'concise'],
      },
    ];
  }
}

export const promptAssistService = new PromptAssistService();
