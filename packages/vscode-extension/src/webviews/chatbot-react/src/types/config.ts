// Semoss Assistant configuration type definitions & defaults.
// Defines model, MCP server, preference, integration, and validation shapes
// consumed by the webview + extension for persistence and runtime behavior.

export interface LLMModel {
	name: string;
	provider: "openai" | "anthropic" | "ollama" | "azure" | "local";
	model: string;
	apiKey?: string;
	baseUrl?: string;
	endpoint?: string;
	deployment?: string;
	temperature?: number;
	maxTokens?: number;
	enabled: boolean;
	customHeaders?: Record<string, string>;
}

export interface MCPToolConfig {
	name: string;
	command: string;
	description?: string;
	timeout?: number;
	env?: Record<string, string>;
}

export interface MCPServer {
	name: string;
	command: string;
	args?: string[];
	env?: Record<string, string>;
	enabled: boolean;
	description?: string;
	workingDirectory?: string;
	timeout?: number;
	tools?: MCPToolConfig[];
}

export interface ChatPreferences {
	defaultModel: string;
	autoSave: boolean;
	persistHistory: boolean;
	maxHistoryLength: number;
	enableTypingIndicator: boolean;
}

export interface UIPreferences {
	theme: "light" | "dark" | "auto";
	fontSize: number;
	fontFamily: string;
	showLineNumbers: boolean;
	wordWrap: boolean;
}

export interface CodePreferences {
	autoComplete: boolean;
	syntaxHighlighting: boolean;
	enableInlineChat: boolean;
	defaultLanguage: string;
}

export interface SecurityPreferences {
	requireApiKeyConfirmation: boolean;
	maskApiKeys: boolean;
	enableTelemetry: boolean;
}

export interface Preferences {
	chat: ChatPreferences;
	ui: UIPreferences;
	code: CodePreferences;
	security: SecurityPreferences;
}

export interface KeyboardShortcuts {
	openChat: string;
	clearChat: string;
	openSettings: string;
	toggleModel: string;
	executeCommand: string;
	multilineInput: string;
}

export interface CustomCommand {
	name: string;
	description: string;
	prompt: string;
	requiresSelection?: boolean;
	category?: string;
}

export interface SemossIntegration {
	enableAutoDeployment: boolean;
	defaultInstance: string;
	zipExclusions: string[];
}

export interface GitHubIntegration {
	enablePullRequests: boolean;
	defaultBranch: string;
	autoCommit: boolean;
}

export interface VSCodeIntegration {
	enableInlineCompletions: boolean;
	enableHover: boolean;
	enableCodeLens: boolean;
}

export interface Integrations {
	semoss: SemossIntegration;
	github: GitHubIntegration;
	vscode: VSCodeIntegration;
}

export interface SemossConfig {
	models: LLMModel[];
	mcpServers: MCPServer[];
	preferences: Preferences;
	shortcuts: KeyboardShortcuts;
	customCommands: CustomCommand[];
	integrations: Integrations;
}

// Model provider configurations
export interface ModelProvider {
	name: string;
	displayName: string;
	description: string;
	apiKeyRequired: boolean;
	baseUrlRequired: boolean;
	supportsStreaming: boolean;
	supportsFunctions: boolean;
	models: ModelInfo[];
}

export interface ModelInfo {
	id: string;
	name: string;
	description: string;
	contextLength: number;
	pricing?: {
		input: number;
		output: number;
		currency: string;
	};
}

// MCP Protocol interfaces
export interface MCPTool {
	name: string;
	description: string;
	inputSchema: Record<string, unknown>;
	server: string;
}

export interface MCPResource {
	uri: string;
	name: string;
	description?: string;
	mimeType?: string;
	server: string;
}

export interface MCPMessage {
	role: "user" | "assistant" | "system";
	content: string;
	timestamp: number;
	model?: string;
	tokens?: number;
}

// Configuration validation
export interface ConfigValidationError {
	field: string;
	message: string;
	type: "error" | "warning";
}

export interface ConfigValidationResult {
	valid: boolean;
	errors: ConfigValidationError[];
	warnings: ConfigValidationError[];
}

// Default configurations
export const DEFAULT_MODELS: LLMModel[] = [
	// No default models - users must configure their own
];

export const DEFAULT_PREFERENCES: Preferences = {
	chat: {
		defaultModel: "", // No default model - will be set when user adds first model
		autoSave: true,
		persistHistory: true,
		maxHistoryLength: 1000,
		enableTypingIndicator: true,
	},
	ui: {
		theme: "auto",
		fontSize: 14,
		fontFamily: "Segoe UI",
		showLineNumbers: true,
		wordWrap: true,
	},
	code: {
		autoComplete: true,
		syntaxHighlighting: true,
		enableInlineChat: true,
		defaultLanguage: "javascript",
	},
	security: {
		requireApiKeyConfirmation: true,
		maskApiKeys: true,
		enableTelemetry: false,
	},
};

export const MODEL_PROVIDERS: ModelProvider[] = [
	{
		name: "openai",
		displayName: "OpenAI",
		description: "OpenAI GPT models including GPT-4 and GPT-3.5",
		apiKeyRequired: true,
		baseUrlRequired: false,
		supportsStreaming: true,
		supportsFunctions: true,
		models: [
			{
				id: "gpt-4",
				name: "GPT-4",
				description: "Most capable model, great for complex tasks",
				contextLength: 8192,
				pricing: { input: 0.03, output: 0.06, currency: "USD" },
			},
			{
				id: "gpt-3.5-turbo",
				name: "GPT-3.5 Turbo",
				description: "Fast and efficient for most tasks",
				contextLength: 4096,
				pricing: { input: 0.001, output: 0.002, currency: "USD" },
			},
		],
	},
	{
		name: "anthropic",
		displayName: "Anthropic",
		description: "Claude models with excellent reasoning capabilities",
		apiKeyRequired: true,
		baseUrlRequired: false,
		supportsStreaming: true,
		supportsFunctions: false,
		models: [
			{
				id: "claude-3-sonnet-20240229",
				name: "Claude 3 Sonnet",
				description: "Balanced performance and speed",
				contextLength: 200000,
				pricing: { input: 0.003, output: 0.015, currency: "USD" },
			},
		],
	},
	{
		name: "ollama",
		displayName: "Ollama",
		description: "Local models running on your machine",
		apiKeyRequired: false,
		baseUrlRequired: true,
		supportsStreaming: true,
		supportsFunctions: false,
		models: [
			{
				id: "llama2",
				name: "Llama 2",
				description: "Open source model from Meta",
				contextLength: 4096,
			},
			{
				id: "codellama",
				name: "Code Llama",
				description: "Specialized for code generation",
				contextLength: 4096,
			},
		],
	},
];
