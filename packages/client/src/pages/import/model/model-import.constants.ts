export type FieldType =
	| "text"
	| "hidden"
	| "password"
	| "url"
	| "select"
	| "number"
	| "boolean"
	| "textarea";

export interface FieldDefinition {
	key: string;
	label: string;
	type: FieldType;
	required: boolean;
	// optional extras seen in the constants
	value?: string;
	options?: string[];
	default?: string | number | boolean;
}

export interface ModelTypeDefinition {
	model_types: string[]; // e.g. ["llm"] | ["embedding"]
	fields: FieldDefinition[];
	advanced: FieldDefinition[];
}

export interface ProviderDefinition {
	name: string;
	types: ModelTypeDefinition[];
}

export interface ImportableModels {
	providers: ProviderDefinition[];
}

// TODO: Move to backend and fetch via API
export const IMPORTABLE_MODELS = {
	providers: [
		{
			name: "OpenAI",
			types: [
				{
					model_types: ["llm"],
					fields: [
						{
							key: "CATALOG_NAME",
							label: "Catalog Name",
							type: "text",
							required: true,
						},
						{
							key: "MODEL_TYPE",
							label: "Model Type",
							type: "hidden",
							required: true,
							value: "OPEN_AI",
						},
						{
							key: "API_KEY",
							label: "API Key",
							type: "password",
							required: true,
						},
						{
							key: "ENDPOINT",
							label: "API Endpoint (if needed)",
							type: "url",
							required: false,
						},
						{
							key: "MODEL",
							label: "Model Name",
							type: "text",
							required: true,
						},
						{
							key: "CHAT_TYPE",
							label: "Completion Type",
							type: "select",
							options: ["chat-completion", "completion"],
							required: true,
							default: "chat-completion",
						},
						{
							key: "CONTEXT_WINDOW",
							label: "Context Window",
							type: "number",
							required: false,
						},
						{
							key: "MAX_TOKENS",
							label: "Max Completion Tokens",
							type: "number",
							required: false,
						},
						{
							key: "KEEP_INPUT_OUTPUT",
							label: "Record Questions and Responses",
							type: "boolean",
							required: false,
						},
						{
							key: "KEEP_CONVERSATION_HISTORY",
							label: "Keep Conversation History",
							type: "boolean",
							required: false,
						},
					],
					advanced: [
						{
							key: "VAR_NAME",
							label: "Variable Name",
							type: "text",
							required: false,
						},
						{
							key: "INIT_MODEL_ENGINE",
							label: "Init Script",
							type: "textarea",
							required: false,
						},
					],
				},
				{
					model_types: ["embedding"],
					fields: [
						{
							key: "CATALOG_NAME",
							label: "Catalog Name",
							type: "text",
							required: true,
						},
						{
							key: "MODEL_TYPE",
							label: "Model Type",
							type: "hidden",
							required: true,
							value: "OPEN_AI",
						},
						{
							key: "API_KEY",
							label: "API Key",
							type: "password",
							required: true,
						},
						{
							key: "ENDPOINT",
							label: "API Endpoint (if needed)",
							type: "url",
							required: false,
						},
						{
							key: "MODEL",
							label: "Model Name",
							type: "text",
							required: true,
						},
						{
							key: "KEEP_INPUT_OUTPUT",
							label: "Record Text to Embed",
							type: "boolean",
							required: false,
						},
					],
					advanced: [
						{
							key: "VAR_NAME",
							label: "Variable Name",
							type: "text",
							required: false,
						},
						{
							key: "INIT_MODEL_ENGINE",
							label: "Init Script",
							type: "textarea",
							required: false,
						},
					],
				},
			],
		},
		{
			name: "Azure OpenAI",
			types: [
				{
					model_types: ["llm"],
					fields: [
						{
							key: "CATALOG_NAME",
							label: "Catalog Name",
							type: "text",
							required: true,
						},
						{
							key: "MODEL_TYPE",
							label: "Model Type",
							type: "hidden",
							required: true,
							value: "OPEN_AI",
						},
						{
							key: "API_KEY",
							label: "API Key",
							type: "password",
							required: true,
						},
						{
							key: "ENDPOINT",
							label: "Endpoint",
							type: "url",
							required: true,
						},
						{
							key: "MODEL",
							label: "Model Name",
							type: "text",
							required: true,
						},
						{
							key: "DEPLOYMENT_NAME",
							label: "Deployment Name",
							type: "text",
							required: true,
						},
						{
							key: "CHAT_TYPE",
							label: "Completion Type",
							type: "select",
							options: ["chat-completion", "completion"],
							required: true,
							default: "chat-completion",
						},
						{
							key: "CONTEXT_WINDOW",
							label: "Context Window",
							type: "number",
							required: false,
						},
						{
							key: "MAX_TOKENS",
							label: "Max Completion Tokens",
							type: "number",
							required: false,
						},
						{
							key: "KEEP_INPUT_OUTPUT",
							label: "Record Questions and Responses",
							type: "boolean",
							required: false,
						},
						{
							key: "KEEP_CONVERSATION_HISTORY",
							label: "Keep Conversation History",
							type: "boolean",
							required: false,
						},
					],
					advanced: [
						{
							key: "VAR_NAME",
							label: "Variable Name",
							type: "text",
							required: false,
						},
						{
							key: "INIT_MODEL_ENGINE",
							label: "Init Script",
							type: "textarea",
							required: false,
						},
					],
				},
				{
					model_types: ["embedding"],
					fields: [
						{
							key: "CATALOG_NAME",
							label: "Catalog Name",
							type: "text",
							required: true,
						},
						{
							key: "MODEL_TYPE",
							label: "Model Type",
							type: "hidden",
							required: true,
							value: "OPEN_AI",
						},
						{
							key: "API_KEY",
							label: "API Key",
							type: "password",
							required: true,
						},
						{
							key: "ENDPOINT",
							label: "Endpoint",
							type: "url",
							required: true,
						},
						{
							key: "MODEL",
							label: "Model Name",
							type: "text",
							required: true,
						},
						{
							key: "DEPLOYMENT_NAME",
							label: "Deployment Name",
							type: "text",
							required: true,
						},
						{
							key: "KEEP_INPUT_OUTPUT",
							label: "Record Text to Embed",
							type: "boolean",
							required: false,
						},
					],
					advanced: [
						{
							key: "VAR_NAME",
							label: "Variable Name",
							type: "text",
							required: false,
						},
						{
							key: "INIT_MODEL_ENGINE",
							label: "Init Script",
							type: "textarea",
							required: false,
						},
					],
				},
			],
		},
		{
			name: "AWS Bedrock",
			types: [
				{
					model_types: ["llm"],
					fields: [
						{
							key: "CATALOG_NAME",
							label: "Catalog Name",
							type: "text",
							required: true,
						},
						{
							key: "MODEL_TYPE",
							label: "Model Type",
							type: "hidden",
							required: true,
							value: "BEDROCK",
						},
						{
							key: "AWS_ACCESS_KEY",
							label: "AWS Access Key ID",
							type: "password",
							required: false,
						},
						{
							key: "AWS_SECRET_KEY",
							label: "AWS Secret Access Key",
							type: "password",
							required: false,
						},
						{
							key: "AWS_REGION",
							label: "Region",
							type: "text",
							required: true,
						},
						{
							key: "MODEL",
							label: "Model ID",
							type: "text",
							required: true,
						},
						{
							key: "CONTEXT_WINDOW",
							label: "Context Window",
							type: "number",
							required: false,
						},
						{
							key: "MAX_TOKENS",
							label: "Max Completion Tokens",
							type: "number",
							required: false,
						},
						{
							key: "KEEP_INPUT_OUTPUT",
							label: "Record Questions and Responses",
							type: "boolean",
							required: false,
						},
						{
							key: "KEEP_CONVERSATION_HISTORY",
							label: "Keep Conversation History",
							type: "boolean",
							required: false,
						},
					],
					advanced: [
						{
							key: "VAR_NAME",
							label: "Variable Name",
							type: "text",
							required: false,
						},
						{
							key: "INIT_MODEL_ENGINE",
							label: "Init Script",
							type: "textarea",
							required: false,
						},
					],
				},
				{
					model_types: ["embedding"],
					fields: [
						{
							key: "CATALOG_NAME",
							label: "Catalog Name",
							type: "text",
							required: true,
						},
						{
							key: "MODEL_TYPE",
							label: "Model Type",
							type: "hidden",
							required: true,
							value: "BEDROCK",
						},
						{
							key: "AWS_ACCESS_KEY",
							label: "AWS Access Key ID",
							type: "password",
							required: false,
						},
						{
							key: "AWS_SECRET_KEY",
							label: "AWS Secret Access Key",
							type: "password",
							required: false,
						},
						{
							key: "AWS_REGION",
							label: "Region",
							type: "text",
							required: true,
						},
						{
							key: "MODEL",
							label: "Model ID",
							type: "text",
							required: true,
						},
						{
							key: "KEEP_INPUT_OUTPUT",
							label: "Record Text to Embed",
							type: "boolean",
							required: false,
						},
					],
					advanced: [
						{
							key: "VAR_NAME",
							label: "Variable Name",
							type: "text",
							required: false,
						},
						{
							key: "INIT_MODEL_ENGINE",
							label: "Init Script",
							type: "textarea",
							required: false,
						},
					],
				},
			],
		},
		{
			name: "Google Vertex AI",
			types: [
				{
					model_types: ["llm"],
					fields: [
						{
							key: "CATALOG_NAME",
							label: "Catalog Name",
							type: "text",
							required: true,
						},
						{
							key: "MODEL_TYPE",
							label: "Model Type",
							type: "hidden",
							required: true,
							value: "VERTEX",
						},
						{
							key: "PROJECT_ID",
							label: "Project ID",
							type: "text",
							required: true,
						},
						{
							key: "GCP_REGION",
							label: "GCP Region",
							type: "text",
							required: true,
						},
						{
							key: "SERVICE_ACCOUNT_JSON",
							label: "Service Account (JSON)",
							type: "textarea",
							required: true,
						},
						{
							key: "MODEL",
							label: "Model Name",
							type: "text",
							required: true,
						},
						{
							key: "CONTEXT_WINDOW",
							label: "Context Window",
							type: "number",
							required: false,
						},
						{
							key: "MAX_TOKENS",
							label: "Max Completion Tokens",
							type: "number",
							required: false,
						},
						{
							key: "KEEP_INPUT_OUTPUT",
							label: "Record Questions and Responses",
							type: "boolean",
							required: false,
						},
						{
							key: "KEEP_CONVERSATION_HISTORY",
							label: "Keep Conversation History",
							type: "boolean",
							required: false,
						},
					],
					advanced: [
						{
							key: "VAR_NAME",
							label: "Variable Name",
							type: "text",
							required: false,
						},
						{
							key: "INIT_MODEL_ENGINE",
							label: "Init Script",
							type: "textarea",
							required: false,
						},
					],
				},
				{
					model_types: ["embedding"],
					fields: [
						{
							key: "CATALOG_NAME",
							label: "Catalog Name",
							type: "text",
							required: true,
						},
						{
							key: "MODEL_TYPE",
							label: "Model Type",
							type: "hidden",
							required: true,
							value: "VERTEX",
						},
						{
							key: "PROJECT_ID",
							label: "Project ID",
							type: "text",
							required: true,
						},
						{
							key: "GCP_REGION",
							label: "GCP Region",
							type: "text",
							required: true,
						},
						{
							key: "SERVICE_ACCOUNT_JSON",
							label: "Service Account (JSON)",
							type: "textarea",
							required: true,
						},
						{
							key: "MODEL",
							label: "Model Name",
							type: "text",
							required: true,
						},
						{
							key: "KEEP_INPUT_OUTPUT",
							label: "Record Text to Embed",
							type: "boolean",
							required: false,
						},
					],
					advanced: [
						{
							key: "VAR_NAME",
							label: "Variable Name",
							type: "text",
							required: false,
						},
						{
							key: "INIT_MODEL_ENGINE",
							label: "Init Script",
							type: "textarea",
							required: false,
						},
					],
				},
			],
		},
		{
			name: "NVIDIA NIM",
			types: [
				{
					model_types: ["llm"],
					fields: [
						{
							key: "CATALOG_NAME",
							label: "Catalog Name",
							type: "text",
							required: true,
						},
						{
							key: "MODEL_TYPE",
							label: "Model Type",
							type: "hidden",
							required: true,
							value: "OPEN_AI",
						},
						{
							key: "API_KEY",
							label: "API Key",
							type: "password",
							required: true,
						},
						{
							key: "ENDPOINT",
							label: "Endpoint",
							type: "url",
							required: true,
						},
						{
							key: "MODEL",
							label: "Model Name",
							type: "text",
							required: true,
						},
						{
							key: "CHAT_TYPE",
							label: "Completion Type",
							type: "select",
							options: ["chat-completion", "completion"],
							required: true,
							default: "chat-completion",
						},
						{
							key: "CONTEXT_WINDOW",
							label: "Context Window",
							type: "number",
							required: false,
						},
						{
							key: "MAX_TOKENS",
							label: "Max Completion Tokens",
							type: "number",
							required: false,
						},
						{
							key: "KEEP_INPUT_OUTPUT",
							label: "Record Questions and Responses",
							type: "boolean",
							required: false,
						},
						{
							key: "KEEP_CONVERSATION_HISTORY",
							label: "Keep Conversation History",
							type: "boolean",
							required: false,
						},
					],
					advanced: [
						{
							key: "VAR_NAME",
							label: "Variable Name",
							type: "text",
							required: false,
						},
						{
							key: "INIT_MODEL_ENGINE",
							label: "Init Script",
							type: "textarea",
							required: false,
						},
					],
				},
				{
					model_types: ["embedding"],
					fields: [
						{
							key: "CATALOG_NAME",
							label: "Catalog Name",
							type: "text",
							required: true,
						},
						{
							key: "MODEL_TYPE",
							label: "Model Type",
							type: "hidden",
							required: true,
							value: "OPEN_AI",
						},
						{
							key: "API_KEY",
							label: "API Key",
							type: "password",
							required: true,
						},
						{
							key: "ENDPOINT",
							label: "Endpoint",
							type: "url",
							required: true,
						},
						{
							key: "MODEL",
							label: "Model Name",
							type: "text",
							required: true,
						},
						{
							key: "KEEP_INPUT_OUTPUT",
							label: "Record Text to Embed",
							type: "boolean",
							required: false,
						},
					],
					advanced: [
						{
							key: "VAR_NAME",
							label: "Variable Name",
							type: "text",
							required: false,
						},
						{
							key: "INIT_MODEL_ENGINE",
							label: "Init Script",
							type: "textarea",
							required: false,
						},
					],
				},
			],
		},
		{
			name: "OpenAI-Compatible",
			types: [
				{
					model_types: ["llm"],
					fields: [
						{
							key: "CATALOG_NAME",
							label: "Catalog Name",
							type: "text",
							required: true,
						},
						{
							key: "MODEL_TYPE",
							label: "Model Type",
							type: "hidden",
							required: true,
							value: "OPEN_AI",
						},
						{
							key: "API_KEY",
							label: "API Key",
							type: "password",
							required: false,
						},
						{
							key: "ENDPOINT",
							label: "Endpoint",
							type: "url",
							required: true,
						},
						{
							key: "MODEL",
							label: "Model Name",
							type: "text",
							required: true,
						},
						{
							key: "CONTEXT_WINDOW",
							label: "Context Window",
							type: "number",
							required: false,
						},
						{
							key: "MAX_TOKENS",
							label: "Max Completion Tokens",
							type: "number",
							required: false,
						},
						{
							key: "KEEP_INPUT_OUTPUT",
							label: "Record Questions and Responses",
							type: "boolean",
							required: false,
						},
						{
							key: "KEEP_CONVERSATION_HISTORY",
							label: "Keep Conversation History",
							type: "boolean",
							required: false,
						},
					],
					advanced: [
						{
							key: "VAR_NAME",
							label: "Variable Name",
							type: "text",
							required: false,
						},
						{
							key: "INIT_MODEL_ENGINE",
							label: "Init Script",
							type: "textarea",
							required: false,
						},
					],
				},
				{
					model_types: ["embedding"],
					fields: [
						{
							key: "CATALOG_NAME",
							label: "Catalog Name",
							type: "text",
							required: true,
						},
						{
							key: "MODEL_TYPE",
							label: "Model Type",
							type: "hidden",
							required: true,
							value: "OPEN_AI",
						},
						{
							key: "API_KEY",
							label: "API Key",
							type: "password",
							required: false,
						},
						{
							key: "ENDPOINT",
							label: "Endpoint",
							type: "url",
							required: true,
						},
						{
							key: "MODEL",
							label: "Model Name",
							type: "text",
							required: true,
						},
						{
							key: "KEEP_INPUT_OUTPUT",
							label: "Record Text to Embed",
							type: "boolean",
							required: false,
						},
					],
					advanced: [
						{
							key: "VAR_NAME",
							label: "Variable Name",
							type: "text",
							required: false,
						},
						{
							key: "INIT_MODEL_ENGINE",
							label: "Init Script",
							type: "textarea",
							required: false,
						},
					],
				},
			],
		},
	],
};

// TODO: Move to backend and fetch via API
// TODO: Can we pull icon from an image url
export const MODEL_VERSIONS = {
	OpenAI: [
		{
			name: "gpt-3.5",
			display: "GPT 3.5",
			icon: "/src/assets/img/OPEN_AI.png",
			embedding: false,
		},
		{
			name: "gpt-4",
			display: "GPT 4",
			icon: "/src/assets/img/OPEN_AI.png",
			embedding: false,
		},
		{
			name: "text-davinci",
			display: "Text Davinci",
			icon: "/src/assets/img/OPEN_AI.png",
			embedding: true,
		},
		{
			name: "dall-e",
			display: "DALL·E",
			icon: "/src/assets/img/OPEN_AI.png",
			embedding: false,
		},
	],
	"Azure OpenAI": [
		{
			name: "azure-openai",
			display: "Azure Open AI",
			icon: "/src/assets/img/OPEN_AI.png",
			embedding: false,
		},
		{
			name: "azure-openai-embedding",
			display: "Azure Open AI Embedding",
			icon: "/src/assets/img/OPEN_AI.png",
			embedding: true,
		},
	],
	"AWS Bedrock": [
		{
			name: "amazon.titan-embed-text-v1",
			display: "Claude",
			icon: "/src/assets/img/CLAUDE_AI.png",
			embedding: true,
		},
	],
	"Google Vertex AI": [
		{
			name: "palm-bison",
			display: "Palm Bison",
			icon: "/src/assets/img/GOOGLE.png",
			embedding: false,
		},
		{
			name: "palm-chat-bison",
			display: "Palm Chat Bison",
			icon: "/src/assets/img/GOOGLE.png",
			embedding: false,
		},
		{
			name: "palm-code-bison",
			display: "Palm Code Bison",
			icon: "/src/assets/img/GOOGLE.png",
			embedding: false,
		},
		{
			name: "gemini",
			display: "Gemini",
			icon: "/src/assets/img/GOOGLE.png",
			embedding: false,
		},
	],
	"NVIDIA NIM": [
		{
			name: "gemini-pro",
			display: "NVIDIA NIM",
			icon: "/src/assets/img/NEMO.png",
			embedding: false,
		},
	],
	"OpenAI-Compatible": [
		{
			name: "openai-compatible",
			display: "OpenAI-Compatible",
			icon: "/src/assets/img/OPEN_AI.png",
			embedding: false,
		},
		{
			name: "openai-compatible-embedding",
			display: "OpenAI-Compatible Embedding",
			icon: "/src/assets/img/OPEN_AI.png",
			embedding: true,
		},
	],
};
