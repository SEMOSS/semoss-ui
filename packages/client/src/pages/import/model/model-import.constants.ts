import { default as OPEN_AI } from "@/assets/img/OPEN_AI.png";

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
			icon: OPEN_AI,
			embedding: false,
		},
		{
			name: "text-davinci",
			display: "Text Davinci",
			icon: OPEN_AI,
			embedding: true,
		},
		{
			name: "dall-e",
			display: "DALL·E",
			embedding: false,
			icon: OPEN_AI,
		},
	],
	Azure: [
		{
			name: "azure-openai-gpt-4",
			display: "Azure Open AI",
			embedding: false,
		},
		{
			name: "azure-openai-embedding",
			display: "Azure Open AI Embedding",
			embedding: true,
		},
	],
};
