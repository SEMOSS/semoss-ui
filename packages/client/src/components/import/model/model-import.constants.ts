// Removed unused import (was: import { link } from "fs");
// biome-ignore-all lint/suspicious/noTemplateCurlyInString: TODO
export type FieldType =
	| "text"
	| "hidden"
	| "password"
	| "url"
	| "select"
	| "number"
	| "boolean"
	| "textarea"
	| "file-upload";

export type categoryType = "General" | "Credentials" | "Settings";

export interface FieldRules {
	pattern: {
		value: RegExp;
		message: string;
	};
	custom_rules: {
		value: string;
		message: string;
	};
}

export interface FieldDefinition {
	key: string;
	label: string;
	type: FieldType;
	required: boolean;
	category: categoryType;
	// optional extras seen in the constants
	value?: string;
	options?: string[];
	disabled?: boolean;
	default?: string | number | boolean;
	rules?: FieldRules;
	helperText?: string;
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

export interface CategoryText {
	General: string;
	Settings: string;
	Credentials: string;
}

export interface CategoryTexts {
	[provider: string]: CategoryText;
}

export interface ModelFieldOverride {
	key: string;
	remove?: boolean;
	patch?: Partial<FieldDefinition>;
	replace?: FieldDefinition;
}

export interface AppendedModelField {
	field: FieldDefinition;
	insertAfterKey?: string;
}

export interface ModelFormConfig {
	fieldOverrides?: ModelFieldOverride[];
	appendFields?: AppendedModelField[];
	advancedFieldOverrides?: ModelFieldOverride[];
	appendAdvancedFields?: AppendedModelField[];
}

export interface ModelVersionDefinition {
	name: string;
	display: string;
	icon: string;
	modelBrand?: string;
	description?: string;
	link?: string;
	embedding?: boolean;
	disable?: boolean;
	audio?: boolean;
	image?: boolean;
	formConfig?: ModelFormConfig;
}

export type ModelVersionsByProvider = Record<string, ModelVersionDefinition[]>;
export const UNKNOWN_MODEL_BRAND = "HUGGINGFACE";

export const OTHER_MODEL_FORM_CONFIG_BY_PROVIDER: Record<
	string,
	ModelFormConfig
> = {
	OpenAI: {
		fieldOverrides: [
			{
				key: "MODEL",
				patch: { default: "", value: "", disabled: false },
			},
			{
				key: "INIT_MODEL_ENGINE",
				patch: { disabled: false },
			},
		],
	},
	"Google Gemini": {
		fieldOverrides: [
			{
				key: "MODEL",
				patch: { default: "", value: "", disabled: false },
			},
			{
				key: "INIT_MODEL_ENGINE",
				patch: { disabled: false },
			},
		],
	},
	"Azure OpenAI": {
		fieldOverrides: [
			{
				key: "MODEL",
				patch: { default: "", value: "", disabled: false },
			},
			{
				key: "INIT_MODEL_ENGINE",
				patch: { disabled: false },
			},
		],
	},
	Anthropic: {
		fieldOverrides: [
			{
				key: "MODEL",
				patch: { default: "", value: "", disabled: false },
			},
			{
				key: "INIT_MODEL_ENGINE",
				patch: { disabled: false },
			},
		],
	},
	"AWS Bedrock": {
		fieldOverrides: [
			{
				key: "MODEL",
				patch: { default: "", value: "", disabled: false },
			},
			{
				key: "AWS_REGION",
				patch: { default: "us-east-1" },
			},
			{
				key: "INIT_MODEL_ENGINE",
				patch: { disabled: false },
			},
		],
	},
	"NVIDIA NIM": {
		fieldOverrides: [
			{
				key: "MODEL",
				patch: { default: "", value: "", disabled: false },
			},
			{
				key: "INIT_MODEL_ENGINE",
				patch: { disabled: false },
			},
		],
	},
	"Self Hosted": {
		fieldOverrides: [
			{
				key: "MODEL",
				patch: { default: "", value: "", disabled: false },
			},
			{
				key: "INIT_MODEL_ENGINE",
				patch: { disabled: false },
			},
		],
	},
	Perplexity: {
		fieldOverrides: [
			{
				key: "MODEL",
				patch: { default: "", value: "", disabled: false },
			},
			{
				key: "INIT_MODEL_ENGINE",
				patch: { disabled: false },
			},
		],
	},
	Embedded: {
		fieldOverrides: [
			{
				key: "MODEL",
				patch: { default: "", value: "", disabled: false },
			},
			{
				key: "INIT_MODEL_ENGINE",
				patch: { disabled: false },
			},
		],
	},
};

export const IMPORTABLE_MODELS = {
	categoryTexts: {
		Anthropic: {
			General:
				"Connect directly to Anthropic-hosted Claude models for native provider configuration and branding.",
			Settings:
				"Set model parameters like max tokens and context window to tune Claude behavior for your workload.",
			Credentials:
				"Enter your Anthropic API key to securely authenticate requests to Anthropic endpoints.",
		},
		"AWS Bedrock": {
			General:
				"Use AWS Bedrock to access and deploy foundational models with full AWS ecosystem integration and managed security.",
			Settings:
				"Specify your AWS region, model ID, and inference configuration parameters to customize model behavior and performance.",
			Credentials:
				"Enter your AWS access key, secret key, and session token (if required) to securely authenticate with AWS Bedrock.",
		},
		"Azure OpenAI": {
			General:
				"Connect your Azure OpenAI instance for enterprise-grade security, scalability, and integration within the Azure ecosystem.",
			Settings:
				"Provide your Azure resource name, deployment ID, and API version to configure the Azure OpenAI endpoint correctly.",
			Credentials:
				"Enter your Azure API key and endpoint URL to securely authenticate your Azure OpenAI connection.",
		},
		"Google Gemini": {
			General:
				"Integrate with Google Gemini for scalable, production-ready machine learning workflows with Google Cloud infrastructure.",
			Settings:
				"Set your project ID, model name, and region to correctly route API calls within your Vertex AI environment.",
			Credentials:
				"Upload or reference your Google service account key to securely authenticate with Vertex AI endpoints.",
		},
		"NVIDIA NIM": {
			General:
				"Leverage NVIDIA NIM for high-performance model inference optimized for GPU acceleration and enterprise deployment.",
			Settings:
				"Configure your model container, runtime parameters, and deployment endpoint to align with your NIM environment.",
			Credentials:
				"Provide your NVIDIA API token or authentication file to securely connect and access NVIDIA NIM services.",
		},
		OpenAI: {
			General:
				"Choose between hosted OpenAI services for managed reliability, or custom-deployed environments for greater control over API usage and performance.",
			Settings:
				"Configure your model type, deployment parameters, and response behavior to align with your specific OpenAI integration.",
			Credentials:
				"Enter your OpenAI API key to securely authenticate and enable access to the OpenAI endpoints.",
		},
		"Self Hosted": {
			General:
				"Integrate with any OpenAI-compatible API endpoint for self-hosted or third-party model services.",
			Settings:
				"Define your base URL, model route, and API parameters to ensure compatibility with OpenAI’s API schema.",
			Credentials:
				"Enter your API key or authentication header details to securely connect with the compatible API service.",
		},
		Perplexity: {
			General:
				"Connect to Perplexity-hosted Sonar models for search-grounded and reasoning-focused chat workflows.",
			Settings:
				"Set your model, token limits, and init configuration for OpenAI-compatible Perplexity API usage.",
			Credentials:
				"Enter your Perplexity API key and verify the fixed endpoint for secure access to Perplexity models.",
		},
	},

	providers: [
		{
			name: "Anthropic",
			types: [
				{
					model_types: ["llm"],
					fields: [
						{
							key: "NAME",
							label: "Catalog Name",
							type: "text",
							required: true,
							category: "General",
							rules: {
								pattern: {
									value: /^[\w\-\s]+$/,
									message:
										"Catalog names can only contain alphanumeric characters and dashes.",
								},
								custom_rules: {
									value: 'CheckEngineName ( "[VALUE]") ;',
									message:
										"This Catalog name has already been used, please try another.",
								},
							},
						},
						{
							key: "MODEL_TYPE",
							label: "Model Type",
							type: "hidden",
							disabled: true,
							required: true,
							default: "ANTHROPIC",
							category: "General",
						},
						{
							key: "MODEL_BRAND",
							label: "Model Brand",
							type: "hidden",
							disabled: true,
							required: true,
							default: "CLAUDE",
							category: "General",
						},
						{
							key: "MODEL",
							label: "Model ID",
							type: "text",
							disabled: true,
							required: true,
							category: "General",
						},
						{
							key: "PROVIDER",
							label: "Provider",
							type: "text",
							required: true,
							disabled: true,
							default: "anthropic",
							value: "anthropic",
							category: "General",
						},
						{
							key: "VAR_NAME",
							label: "Variable Name",
							type: "hidden",
							required: true,
							disabled: true,
							value: "myModel",
							category: "General",
						},
						{
							key: "API_KEY",
							label: "API Key",
							type: "password",
							required: true,
							category: "Credentials",
							helperText:
								"https://console.anthropic.com/settings/keys",
						},
						{
							key: "MAX_TOKENS",
							label: "Max Tokens (Max Completion Tokens)",
							type: "number",
							required: true,
							default: 64000,
							rules: {
								pattern: {
									value: /^[1-9]\d*$/,
									message:
										"Max Token must be a positive integer",
								},
							},
							category: "Settings",
						},
						{
							key: "CONTEXT_WINDOW",
							label: "Context Window",
							type: "number",
							required: true,
							default: 200000,
							rules: {
								pattern: {
									value: /^[1-9]\d*$/,
									message:
										"Context Window must be a positive integer",
								},
							},
							category: "Settings",
						},
						{
							key: "KEEP_INPUT_OUTPUT",
							label: "Record Questions and Responses",
							type: "select",
							options: ["true", "false"],
							required: true,
							default: "true",
							category: "Settings",
						},
						{
							key: "KEEP_CONVERSATION_HISTORY",
							label: "Keep Conversation History",
							type: "select",
							options: ["true", "false"],
							required: true,
							default: "true",
							category: "Settings",
						},
						{
							key: "INIT_MODEL_ENGINE",
							label: "Init Script",
							type: "text",
							required: true,
							disabled: true,
							default:
								"import genai_client;${VAR_NAME} = genai_client.AnthropicClient(model_name = '${MODEL}', api_key = '${API_KEY}', provider = '${PROVIDER}', context_window = ${CONTEXT_WINDOW}, max_tokens = ${MAX_TOKENS})",
							category: "Settings",
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
							key: "NAME",
							label: "Catalog Name",
							type: "text",
							required: true,
							category: "General",
							rules: {
								pattern: {
									value: /^[\w\-\s]+$/,
									message:
										"Catalog names can only contain alphanumeric characters and dashes.",
								},
								custom_rules: {
									value: 'CheckEngineName ( "[VALUE]") ;',
									message:
										"This Catalog name has already been used, please try another.",
								},
							},
						},
						{
							key: "MODEL_TYPE",
							label: "Model Type",
							type: "hidden",
							disabled: true,
							required: true,
							default: "BEDROCK",
							category: "General",
						},
						{
							key: "MODEL_BRAND",
							label: "Model Brand",
							type: "hidden",
							disabled: true,
							required: true,
							default: "BEDROCK",
							category: "General",
						},
						{
							key: "MODEL",
							label: "Model ID",
							type: "text",
							disabled: true,
							required: true,
							category: "General",
						},
						{
							key: "VAR_NAME",
							label: "Variable Name",
							type: "hidden",
							required: true,
							disabled: true,
							value: "myModel",
							category: "General",
						},
						{
							key: "AWS_REGION",
							label: "Region",
							type: "text",
							required: true,
							default: "us-east-1",
							category: "Credentials",
						},
						{
							key: "AWS_ACCESS_KEY",
							label: "AWS Access Key",
							type: "password",
							required: true,
							category: "Credentials",
						},
						{
							key: "AWS_SECRET_KEY",
							label: "AWS Secret Access Key",
							type: "password",
							required: true,
							category: "Credentials",
						},
						{
							key: "CONTEXT_WINDOW",
							label: "Context Window",
							type: "number",
							required: true,
							rules: {
								pattern: {
									value: /^[1-9]\d*$/,
									message:
										"Context Window must be a positive integer",
								},
							},
							category: "Settings",
						},
						{
							key: "MAX_TOKENS",
							label: "Max Completion Tokens",
							type: "number",
							required: true,
							rules: {
								pattern: {
									value: /^[1-9]\d*$/,
									message:
										"Max Token must be a positive integer",
								},
							},
							category: "Settings",
						},
						{
							key: "KEEP_INPUT_OUTPUT",
							label: "Record Questions and Responses",
							type: "select",
							options: ["true", "false"],
							required: true,
							default: "true",
							category: "Settings",
						},
						{
							key: "KEEP_CONVERSATION_HISTORY",
							label: "Keep Conversation History",
							type: "select",
							options: ["true", "false"],
							required: true,
							default: "true",
							category: "Settings",
						},
						{
							key: "INIT_MODEL_ENGINE",
							label: "Init Script",
							type: "text",
							required: true,
							disabled: true,
							default:
								"import genai_client;${VAR_NAME} = genai_client.BedrockClient(modelId = '${MODEL}', region='${AWS_REGION}', access_key = '${AWS_ACCESS_KEY}', secret_key = '${AWS_SECRET_KEY}', context_window = ${CONTEXT_WINDOW}, max_tokens = ${MAX_TOKENS})",
							category: "Settings",
						},
					],
					advanced: [],
				},
				{
					model_types: ["embedding"],
					fields: [
						{
							key: "NAME",
							label: "Catalog Name",
							type: "text",
							required: true,
							category: "General",
							rules: {
								pattern: {
									value: /^[\w\-\s]+$/,
									message:
										"Catalog names can only contain alphanumeric characters and dashes.",
								},
								custom_rules: {
									value: 'CheckEngineName ( "[VALUE]") ;',
									message:
										"This Catalog name has already been used, please try another.",
								},
							},
						},
						{
							key: "TAG",
							label: "Tag",
							type: "text",
							disabled: true,
							required: true,
							value: "embeddings",
							category: "General",
						},
						{
							key: "MODEL_TYPE",
							label: "Model Type",
							type: "hidden",
							disabled: true,
							required: true,
							default: "BEDROCK",
							category: "General",
						},
						{
							key: "MODEL_BRAND",
							label: "Model Brand",
							type: "hidden",
							disabled: true,
							required: true,
							default: "BEDROCK",
							category: "General",
						},
						{
							key: "MODEL",
							label: "Model",
							type: "text",
							disabled: true,
							required: true,
							category: "General",
						},
						{
							key: "VAR_NAME",
							label: "Variable Name",
							type: "hidden",
							required: true,
							disabled: true,
							value: "myModel",
							category: "General",
						},
						{
							key: "AWS_REGION",
							label: "Aws Region",
							type: "text",
							required: true,
							default: "us-east-1",
							category: "Credentials",
						},
						{
							key: "AWS_ACCESS_KEY",
							label: "AWS Access Key",
							type: "text",
							required: true,
							category: "Credentials",
						},
						{
							key: "AWS_SECRET_KEY",
							label: "AWS Secret Key",
							type: "password",
							required: true,
							category: "Credentials",
						},
						{
							key: "KEEP_INPUT_OUTPUT",
							label: "Record Questions and Responses",
							type: "select",
							options: ["true", "false"],
							required: true,
							default: "true",
							category: "Settings",
						},
						{
							key: "KEEP_CONVERSATION_HISTORY",
							label: "Keep Conversation History",
							type: "select",
							options: ["true", "false"],
							required: true,
							default: "true",
							category: "Settings",
						},
						{
							key: "INIT_MODEL_ENGINE",
							label: "Init Script",
							type: "text",
							required: true,
							disabled: true,
							default:
								"import genai_client;${VAR_NAME} = genai_client.BedrockEmbedder(modelId = '${MODEL}', region='${AWS_REGION}', access_key = '${AWS_ACCESS_KEY}', secret_key = '${AWS_SECRET_KEY}')",
							category: "Settings",
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
							key: "NAME",
							label: "Catalog Name",
							type: "text",
							required: true,
							rules: {
								required: true,
								pattern: {
									value: /^[\w\-\s]+$/,
									message:
										"Catalog names can only contain alphanumeric characters and dashes.",
								},
								custom_rules: {
									value: 'CheckEngineName ( "[VALUE]") ;',
									message:
										"This Catalog name has already been used, please try another.",
								},
							},
							category: "General",
						},
						{
							key: "MODEL_TYPE",
							label: "Model Type",
							type: "hidden",
							disabled: true,
							required: true,
							default: "AZURE_OPEN_AI",
							category: "General",
						},
						{
							key: "MODEL_BRAND",
							label: "Model Brand",
							type: "hidden",
							disabled: true,
							required: true,
							default: "AZURE_OPEN_AI",
							category: "General",
						},
						{
							key: "MODEL",
							label: "Model",
							type: "text",
							disabled: false,
							required: true,
							category: "General",
						},
						{
							key: "VAR_NAME",
							label: "Variable Name",
							type: "hidden",
							required: true,
							disabled: true,
							value: "myModel",
							category: "General",
						},
						{
							key: "CHAT_TYPE",
							label: "Chat Type",
							type: "select",
							options: ["chat-completion", "responses"],
							required: true,
							default: "responses",
							category: "General",
						},
						{
							key: "ENDPOINT",
							label: "Azure Endpoint",
							type: "url",
							required: true,
							category: "Credentials",
						},
						{
							key: "OPEN_AI_KEY",
							label: "Azure Open AI Key",
							type: "password",
							required: true,
							category: "Credentials",
						},
						{
							key: "API_VERSION",
							label: "API Version",
							type: "text",
							required: true,
							category: "Credentials",
						},
						{
							key: "MAX_TOKENS",
							label: "Max Tokens (Max Completion Tokens)",
							type: "number",
							required: true,
							default: 16400,
							rules: {
								pattern: {
									value: /^[1-9]\d*$/,
									message:
										"Max Token must be a positive integer",
								},
							},
							category: "Settings",
						},
						{
							key: "CONTEXT_WINDOW",
							label: "Context Window",
							type: "number",
							required: true,
							default: 128000,
							rules: {
								pattern: {
									value: /^[1-9]\d*$/,
									message:
										"Context Window must be a positive integer",
								},
							},
							category: "Settings",
						},
						{
							key: "KEEP_INPUT_OUTPUT",
							label: "Record Questions and Responses",
							type: "select",
							options: ["true", "false"],
							required: true,
							default: "true",
							category: "Settings",
						},
						{
							key: "KEEP_CONVERSATION_HISTORY",
							label: "Keep Conversation History",
							type: "select",
							options: ["true", "false"],
							required: true,
							default: "true",
							category: "Settings",
						},
						{
							key: "INIT_MODEL_ENGINE",
							label: "Init Script",
							type: "text",
							required: true,
							disabled: true,
							default:
								"import genai_client;${VAR_NAME} = genai_client.AzureOpenAiClient(api_key = '${OPEN_AI_KEY}', endpoint = '${ENDPOINT}', model_name = '${MODEL}', chat_type = '${CHAT_TYPE}', api_version = '${API_VERSION}', context_window = ${CONTEXT_WINDOW}, max_tokens = ${MAX_TOKENS})",
							category: "Settings",
						},
					],
				},
				{
					model_types: ["embedding"],
					fields: [
						{
							key: "NAME",
							label: "Catalog Name",
							type: "text",
							required: true,
							category: "General",
							rules: {
								pattern: {
									value: /^[\w\-\s]+$/,
									message:
										"Catalog names can only contain alphanumeric characters and dashes.",
								},
								custom_rules: {
									value: 'CheckEngineName ( "[VALUE]") ;',
									message:
										"This Catalog name has already been used, please try another.",
								},
							},
						},
						{
							key: "TAG",
							label: "Tag",
							type: "text",
							disabled: true,
							required: true,
							value: "embeddings",
							category: "General",
						},
						{
							key: "MODEL_TYPE",
							label: "Model Type",
							type: "hidden",
							disabled: true,
							required: true,
							default: "AZURE_OPEN_AI",
							category: "General",
						},
						{
							key: "MODEL_BRAND",
							label: "Model Brand",
							type: "hidden",
							disabled: true,
							required: true,
							default: "AZURE_OPEN_AI",
							category: "General",
						},
						{
							key: "MODEL",
							label: "Model",
							type: "select",
							options: [
								"text-embedding-3-small",
								"text-embedding-3-large",
								"text-embedding-ada-002",
							],
							required: true,
							default: "text-embedding-3-small",
							category: "General",
							disabled: false,
						},
						{
							key: "VAR_NAME",
							label: "Variable Name",
							type: "hidden",
							required: true,
							disabled: true,
							value: "myModel",
							category: "General",
						},
						{
							key: "ENDPOINT",
							label: "Azure Endpoint",
							type: "url",
							category: "Credentials",
							required: true,
						},
						{
							key: "OPEN_AI_KEY",
							label: "Azure Open AI API Key",
							type: "password",
							required: true,
							category: "Credentials",
						},
						{
							key: "API_VERSION",
							label: "API Version",
							type: "text",
							required: true,
							category: "Credentials",
						},
						{
							key: "INIT_MODEL_ENGINE",
							label: "Init Script",
							type: "text",
							required: true,
							disabled: true,
							default:
								"from genai_client import AzureOpenAiEmbedder;${VAR_NAME} = AzureOpenAiEmbedder(model_name = '${MODEL}', endpoint = '${ENDPOINT}', api_key = '${OPEN_AI_KEY}', api_version = '${API_VERSION}')",
							category: "Settings",
						},
					],
				},
			],
		},
		{
			name: "Embedded",
			types: [
				{
					model_types: ["llm"],
					fields: [
						{
							key: "NAME",
							label: "Catalog Name",
							type: "text",
							required: true,
							category: "General",
						},
						{
							key: "MODEL_TYPE",
							label: "Model Type",
							type: "hidden",
							disabled: true,
							required: true,
							default: "EMBEDDED",
							category: "General",
						},
						{
							key: "MODEL_BRAND",
							label: "Model Brand",
							type: "hidden",
							disabled: true,
							required: true,
							default: "OPEN_AI",
							category: "General",
						},
						{
							key: "MODEL",
							label: "Model Name",
							type: "text",
							disabled: false,
							required: true,
							value: "",
							category: "General",
						},
						{
							key: "TYPE",
							label: "Type",
							type: "select",
							options: ["Embedded"],
							required: true,
							default: "Embedded",
							category: "General",
						},
						{
							key: "VAR_NAME",
							label: "Variable Name",
							type: "hidden",
							required: true,
							disabled: true,
							value: "myModel",
							category: "General",
						},
						{
							key: "CHAT_TYPE",
							label: "Completion Type",
							type: "select",
							options: ["chat-completion", "completion"],
							required: true,
							default: "chat-completion",
							category: "General",
						},
						{
							key: "Endpoint",
							label: "Endpoint",
							type: "text",
							required: true,
							category: "Credentials",
						},
						{
							key: "MAX_TOKENS",
							label: "Max Completion Tokens",
							type: "number",
							required: true,
							rules: {
								pattern: {
									value: /^[1-9]\d*$/,
									message:
										"Max Token must be a positive integer",
								},
							},
							category: "Settings",
						},
						{
							key: "KEEP_INPUT_OUTPUT",
							label: "Record Questions and Responses",
							type: "select",
							options: ["true", "false"],
							required: true,
							default: "true",
							category: "Settings",
						},
						{
							key: "KEEP_CONVERSATION_HISTORY",
							label: "Keep Conversation History",
							type: "select",
							options: ["true", "false"],
							required: true,
							default: "true",
							category: "Settings",
						},
						{
							key: "INIT_MODEL_ENGINE",
							label: "Init Script",
							type: "text",
							category: "Settings",
							default:
								"import genai_client;${VAR_NAME} = genai_client.OpenAiClient(endpoint = 'https://integrate.api.nvidia.com/v1', model_name='${MODEL_TYPE}', chat_type = '${CHAT_TYPE}', api_key='${OPEN_AI_KEY}', template={ \"mixtral.default.nocontext\":\"[INST] $question [/INST]\"}, template_name='mixtral.default.nocontext', context_window = ${CONTEXT_WINDOW}, max_tokens = ${MAX_TOKENS})",
							required: true,
							disabled: true,
						},
					],
				},
				{
					model_types: ["embedding"],
					fields: [
						{
							key: "NAME",
							label: "Catalog Name",
							type: "text",
							required: true,
							category: "General",
							rules: {
								required: true,
								pattern: {
									value: /^[\w\-\s]+$/,
									message:
										"Catalog names can only contain alphanumeric characters and dashes.",
								},
								custom_rules: {
									value: 'CheckEngineName ( "[VALUE]") ;',
									message:
										"This Catalog name has already been used, please try another.",
								},
							},
						},
						{
							key: "MODEL_TYPE",
							label: "Model Type",
							type: "hidden",
							disabled: true,
							required: true,
							default: "OPEN_AI",
							category: "General",
						},
						{
							key: "MODEL_BRAND",
							label: "Model Brand",
							type: "hidden",
							disabled: true,
							required: true,
							default: "OPEN_AI",
							category: "General",
						},
						{
							key: "MODEL",
							label: "Model Name",
							type: "text",
							disabled: true,
							required: true,
							category: "General",
						},
						{
							key: "API_KEY",
							label: "API Key",
							type: "password",
							required: true,
							category: "Credentials",
						},
						{
							key: "ENDPOINT",
							label: "Endpoint",
							type: "url",
							required: true,
							category: "Credentials",
						},
						{
							key: "KEEP_INPUT_OUTPUT",
							label: "Record Questions and Responses",
							type: "select",
							options: ["true", "false"],
							required: true,
							default: "true",
							category: "Settings",
						},
					],
				},
			],
		},
		{
			name: "Google Gemini",
			types: [
				{
					model_types: ["llm"],
					fields: [
						{
							key: "NAME",
							label: "Catalog Name",
							type: "text",
							required: true,
							category: "General",
							rules: {
								pattern: {
									value: /^[\w\-\s]+$/,
									message:
										"Catalog names can only contain alphanumeric characters and dashes.",
								},
								custom_rules: {
									value: 'CheckEngineName ( "[VALUE]") ;',
									message:
										"This Catalog name has already been used, please try another.",
								},
							},
						},
						{
							key: "MODEL_TYPE",
							label: "Model Type",
							type: "hidden",
							disabled: true,
							required: true,
							default: "VERTEX",
							category: "General",
						},
						{
							key: "MODEL_BRAND",
							label: "Model Brand",
							type: "hidden",
							disabled: true,
							required: true,
							default: "GEMINI",
							category: "General",
						},
						{
							key: "MODEL",
							label: "Model",
							type: "text",
							disabled: true,
							required: true,
							category: "General",
						},
						{
							key: "VAR_NAME",
							label: "Variable Name",
							type: "hidden",
							required: true,
							disabled: true,
							value: "myModel",
							category: "General",
						},
						{
							key: "PROJECT",
							label: "Project",
							type: "text",
							required: true,
							category: "Credentials",
						},
						{
							key: "GCP_REGION",
							label: "GCP Region",
							type: "text",
							required: true,
							category: "Credentials",
						},
						{
							key: "SERVICE_ACCOUNT_CREDENTIALS",
							label: "Service Account Credentials",
							type: "text",
							required: true,
							category: "Credentials",
						},
						{
							key: "MAX_TOKENS",
							label: "Max Tokens (Max Completion Tokens)",
							type: "number",
							required: true,
							default: 65500,
							rules: {
								pattern: {
									value: /^[1-9]\d*$/,
									message:
										"Max Token must be a positive integer",
								},
							},
							category: "Settings",
						},
						{
							key: "CONTEXT_WINDOW",
							label: "Context Window",
							type: "number",
							required: true,
							default: 128000,
							rules: {
								pattern: {
									value: /^[1-9]\d*$/,
									message:
										"Context Window must be a positive integer",
								},
							},
							category: "Settings",
						},
						{
							key: "KEEP_INPUT_OUTPUT",
							label: "Record Questions and Responses",
							type: "select",
							options: ["true", "false"],
							required: true,
							default: "true",
							category: "Settings",
						},
						{
							key: "KEEP_CONVERSATION_HISTORY",
							label: "Keep Conversation History",
							type: "select",
							options: ["true", "false"],
							required: true,
							default: "true",
							category: "Settings",
						},
						{
							key: "INIT_MODEL_ENGINE",
							label: "Init Script",
							type: "text",
							required: true,
							disabled: true,
							default:
								"import genai_client;${VAR_NAME} = genai_client.GoogleGenAiTextClient(model_name = '${MODEL}', region='${GCP_REGION}', project='${PROJECT}', service_account_credentials = ${SERVICE_ACCOUNT_CREDENTIALS}, context_window = ${CONTEXT_WINDOW}, max_tokens = ${MAX_TOKENS})",
							category: "Settings",
						},
					],
				},
				{
					model_types: ["embedding"],
					fields: [
						{
							key: "NAME",
							label: "Catalog Name",
							type: "text",
							required: true,
							category: "General",
							rules: {
								pattern: {
									value: /^[\w\-\s]+$/,
									message:
										"Catalog names can only contain alphanumeric characters and dashes.",
								},
								custom_rules: {
									value: 'CheckEngineName ( "[VALUE]") ;',
									message:
										"This Catalog name has already been used, please try another.",
								},
							},
						},
						{
							key: "MODEL_TYPE",
							label: "Model Type",
							type: "hidden",
							disabled: true,
							required: true,
							default: "VERTEX",
							category: "General",
						},
						{
							key: "MODEL_BRAND",
							label: "Model Brand",
							type: "hidden",
							disabled: true,
							required: true,
							default: "GEMINI",
							category: "General",
						},
						{
							key: "MODEL",
							label: "Model Name",
							type: "text",
							disabled: true,
							required: true,
							category: "General",
						},
						{
							key: "VAR_NAME",
							label: "Variable Name",
							type: "hidden",
							required: true,
							disabled: true,
							value: "myModel",
							category: "General",
						},
						{
							key: "PROJECT",
							label: "Project",
							type: "text",
							required: true,
							category: "Credentials",
						},
						{
							key: "GCP_REGION",
							label: "GCP Region",
							type: "text",
							required: true,
							category: "Credentials",
						},
						{
							key: "SERVICE_ACCOUNT_CREDENTIALS",
							label: "Service Account (JSON)",
							type: "textarea",
							required: true,
							category: "Credentials",
						},
						{
							key: "KEEP_INPUT_OUTPUT",
							label: "Record Questions and Responses",
							type: "select",
							options: ["true", "false"],
							required: true,
							default: "true",
							category: "Settings",
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
							key: "NAME",
							label: "Catalog Name",
							type: "text",
							required: true,
							category: "General",
							rules: {
								pattern: {
									value: /^[\w\-\s]+$/,
									message:
										"Catalog names can only contain alphanumeric characters and dashes.",
								},
								custom_rules: {
									value: 'CheckEngineName ( "[VALUE]") ;',
									message:
										"This Catalog name has already been used, please try another.",
								},
							},
						},
						{
							key: "MODEL_TYPE",
							label: "Model Type",
							type: "hidden",
							disabled: true,
							required: true,
							default: "OPEN_AI",
							category: "General",
						},
						{
							key: "MODEL_BRAND",
							label: "Model Brand",
							type: "hidden",
							disabled: true,
							required: true,
							default: "NEMO",
							category: "General",
						},
						{
							key: "MODEL",
							label: "Model Name",
							type: "text",
							disabled: true,
							required: true,
							category: "General",
						},
						{
							key: "VAR_NAME",
							label: "Variable Name",
							type: "hidden",
							required: true,
							disabled: true,
							value: "myModel",
							category: "General",
						},
						{
							key: "CHAT_TYPE",
							label: "Completion Type",
							type: "select",
							options: ["chat-completion", "completion"],
							required: true,
							default: "chat-completion",
							category: "General",
						},
						{
							key: "OPEN_AI_KEY",
							label: "API Key",
							type: "password",
							required: true,
							category: "Credentials",
						},
						{
							key: "MAX_TOKENS",
							label: "Max Completion Tokens",
							type: "number",
							required: true,
							default: 16400,
							rules: {
								pattern: {
									value: /^[1-9]\d*$/,
									message:
										"Max Token must be a positive integer",
								},
							},
							category: "Settings",
						},
						{
							key: "MAX_INPUT_TOKENS",
							label: "Max Input Tokens",
							type: "number",
							required: true,
							default: 128000,
							rules: {
								pattern: {
									value: /^[1-9]\d*$/,
									message:
										"Max Input Tokens must be a positive integer",
								},
							},
							category: "Settings",
						},
						{
							key: "CONTEXT_WINDOW",
							label: "Context Window",
							type: "number",
							required: true,
							default: 128000,
							rules: {
								pattern: {
									value: /^[1-9]\d*$/,
									message:
										"Context Window must be a positive integer",
								},
							},
							category: "Settings",
						},
						{
							key: "KEEP_INPUT_OUTPUT",
							label: "Record Questions and Responses",
							type: "select",
							options: ["true", "false"],
							required: true,
							default: "true",
							category: "Settings",
						},
						{
							key: "KEEP_CONVERSATION_HISTORY",
							label: "Keep Conversation History",
							type: "select",
							options: ["true", "false"],
							required: true,
							default: "true",
							category: "Settings",
						},
						{
							key: "INIT_MODEL_ENGINE",
							label: "Init Script",
							type: "text",
							category: "Settings",
							default:
								"import genai_client;${VAR_NAME} = genai_client.OpenAiClient(endpoint = 'https://integrate.api.nvidia.com/v1', model_name='${MODEL_TYPE}', chat_type = '${CHAT_TYPE}', api_key='${OPEN_AI_KEY}', template={ \"mixtral.default.nocontext\":\"[INST] $question [/INST]\"}, template_name='mixtral.default.nocontext', context_window = ${CONTEXT_WINDOW}, max_tokens = ${MAX_TOKENS})",
							required: true,
							disabled: true,
						},
					],
				},
				{
					model_types: ["embedding"],
					fields: [
						{
							key: "NAME",
							label: "Catalog Name",
							type: "text",
							required: true,
							category: "General",
							rules: {
								pattern: {
									value: /^[\w\-\s]+$/,
									message:
										"Catalog names can only contain alphanumeric characters and dashes.",
								},
								custom_rules: {
									value: 'CheckEngineName ( "[VALUE]") ;',
									message:
										"This Catalog name has already been used, please try another.",
								},
							},
						},
						{
							key: "MODEL_TYPE",
							label: "Model Type",
							type: "hidden",
							disabled: true,
							required: true,
							default: "OPEN_AI",
							category: "General",
						},
						{
							key: "MODEL_BRAND",
							label: "Model Brand",
							type: "hidden",
							disabled: true,
							required: true,
							default: "NEMO",
							category: "General",
						},
						{
							key: "MODEL",
							label: "Model Name",
							type: "text",
							disabled: true,
							required: true,
							category: "General",
						},
						{
							key: "API_KEY",
							label: "API Key",
							type: "password",
							required: true,
							category: "Credentials",
						},
						{
							key: "ENDPOINT",
							label: "Endpoint",
							type: "url",
							required: true,
							category: "Credentials",
						},
						{
							key: "KEEP_INPUT_OUTPUT",
							label: "Record Questions and Responses",
							type: "select",
							options: ["true", "false"],
							required: true,
							default: "true",
							category: "Settings",
						},
						{
							key: "KEEP_CONVERSATION_HISTORY",
							label: "Keep Conversation History",
							type: "select",
							options: ["true", "false"],
							required: true,
							default: "true",
							category: "Settings",
						},
					],
				},
			],
		},
		{
			name: "OpenAI",
			types: [
				{
					model_types: ["llm"],
					fields: [
						{
							key: "NAME",
							label: "Catalog Name",
							type: "text",
							required: true,
							category: "General",
							rules: {
								pattern: {
									value: /^[\w\-\s]+$/,
									message:
										"Catalog names can only contain alphanumeric characters and dashes.",
								},
								custom_rules: {
									value: 'CheckEngineName ( "[VALUE]") ;',
									message:
										"This Catalog name has already been used, please try another.",
								},
							},
						},
						{
							key: "MODEL_TYPE",
							label: "Model Type",
							type: "hidden",
							disabled: true,
							required: true,
							default: "OPEN_AI",
							category: "General",
						},
						{
							key: "MODEL_BRAND",
							label: "Model Brand",
							type: "hidden",
							disabled: true,
							required: true,
							default: "OPEN_AI",
							category: "General",
						},
						{
							key: "MODEL",
							label: "Model",
							type: "text",
							disabled: true,
							required: true,
							category: "General",
						},
						{
							key: "VAR_NAME",
							label: "Variable Name",
							type: "hidden",
							required: true,
							disabled: true,
							value: "myModel",
							category: "General",
						},
						{
							key: "CHAT_TYPE",
							label: "Chat Type",
							type: "select",
							options: ["chat-completion", "responses"],
							required: true,
							default: "responses",
							category: "General",
						},
						{
							key: "OPEN_AI_KEY",
							label: "Open AI Key",
							type: "password",
							required: true,
							category: "Credentials",
							helperText: "https://platform.openai.com/api-keys",
						},
						{
							key: "MAX_TOKENS",
							label: "Max Tokens (Max Completion Tokens)",
							type: "number",
							required: true,
							default: 16400,
							rules: {
								pattern: {
									value: /^[1-9]\d*$/,
									message:
										"Max Token must be a positive integer",
								},
							},
							category: "Settings",
						},
						{
							key: "CONTEXT_WINDOW",
							label: "Context Window",
							type: "number",
							required: true,
							default: 128000,
							rules: {
								pattern: {
									value: /^[1-9]\d*$/,
									message:
										"Context Window must be a positive integer",
								},
							},
							category: "Settings",
						},
						{
							key: "KEEP_INPUT_OUTPUT",
							label: "Record Questions and Responses",
							type: "select",
							options: ["true", "false"],
							required: true,
							default: "true",
							category: "Settings",
						},
						{
							key: "KEEP_CONVERSATION_HISTORY",
							label: "Keep Conversation History",
							type: "select",
							options: ["true", "false"],
							required: true,
							default: "true",
							category: "Settings",
						},
						{
							key: "INIT_MODEL_ENGINE",
							label: "Init Script",
							type: "text",
							required: true,
							disabled: true,
							default:
								"import genai_client;${VAR_NAME} = genai_client.OpenAiClient(model_name = '${MODEL}', api_key = '${OPEN_AI_KEY}', chat_type = '${CHAT_TYPE}', context_window = ${CONTEXT_WINDOW}, max_tokens = ${MAX_TOKENS})",
							category: "Settings",
						},
					],
				},
				{
					model_types: ["embedding"],
					fields: [
						{
							key: "NAME",
							label: "Catalog Name",
							type: "text",
							required: true,
							category: "General",
							rules: {
								pattern: {
									value: /^[\w\-\s]+$/,
									message:
										"Catalog names can only contain alphanumeric characters and dashes.",
								},
								custom_rules: {
									value: 'CheckEngineName ( "[VALUE]") ;',
									message:
										"This Catalog name has already been used, please try another.",
								},
							},
						},
						{
							key: "TAG",
							label: "Tag",
							type: "text",
							disabled: true,
							required: true,
							value: "embeddings",
							category: "General",
						},
						{
							key: "MODEL_TYPE",
							label: "Model Type",
							type: "hidden",
							disabled: true,
							required: true,
							default: "OPEN_AI",
							category: "General",
						},
						{
							key: "MODEL_BRAND",
							label: "Model Brand",
							type: "hidden",
							disabled: true,
							required: true,
							default: "OPEN_AI",
							category: "General",
						},
						{
							key: "MODEL",
							label: "Model",
							type: "text",
							disabled: true,
							required: true,
							category: "General",
						},
						{
							key: "VAR_NAME",
							label: "Variable Name",
							type: "hidden",
							required: true,
							disabled: true,
							value: "myModel",
							category: "General",
						},
						{
							key: "OPEN_AI_KEY",
							label: "OpenAI API Key",
							type: "password",
							required: true,
							category: "Credentials",
						},
						{
							key: "KEEP_INPUT_OUTPUT",
							label: "Record Questions and Responses",
							type: "select",
							options: ["true", "false"],
							required: true,
							default: "true",
							category: "Settings",
						},
						{
							key: "MAX_TOKENS",
							label: "Max Tokens",
							type: "number",
							required: true,
							rules: {
								pattern: {
									value: /^[1-9]\d*$/,
									message:
										"Max Token must be a positive integer",
								},
							},
							category: "Settings",
						},
						{
							key: "INIT_MODEL_ENGINE",
							label: "Init Script",
							type: "text",
							required: true,
							disabled: true,
							default:
								"from genai_client import OpenAiEmbedder;${VAR_NAME} = OpenAiEmbedder(model_name = '${MODEL}', api_key = '${OPEN_AI_KEY}')",
							category: "Settings",
						},
					],
				},
			],
		},
		{
			name: "Self Hosted",
			types: [
				{
					model_types: ["llm"],
					fields: [
						{
							key: "NAME",
							label: "Catalog Name",
							type: "text",
							required: true,
							category: "General",
							rules: {
								pattern: {
									value: /^[\w\-\s]+$/,
									message:
										"Catalog names can only contain alphanumeric characters and dashes.",
								},
								custom_rules: {
									value: 'CheckEngineName ( "[VALUE]") ;',
									message:
										"This Catalog name has already been used, please try another.",
								},
							},
						},
						{
							key: "MODEL_TYPE",
							label: "Model Type",
							type: "hidden",
							disabled: true,
							required: true,
							default: "TEXT_GENERATION",
							category: "General",
						},
						{
							key: "MODEL_BRAND",
							label: "Model Brand",
							type: "hidden",
							disabled: true,
							required: true,
							default: "OPEN_AI",
							category: "General",
						},
						{
							key: "CHAT_TYPE",
							label: "Chat Type",
							type: "select",
							options: ["chat-completion", "completion"],
							required: true,
							default: "chat-completion",
							category: "General",
						},
						{
							key: "DEPLOYMENT_TYPE",
							label: "Deployment Type",
							type: "select",
							options: ["vLLM", "TGI"],
							required: true,
							default: "vLLM",
							category: "General",
						},
						{
							key: "MODEL",
							label: "Model Name",
							type: "text",
							disabled: false,
							required: true,
							category: "General",
						},
						{
							key: "VAR_NAME",
							label: "Variable Name",
							type: "hidden",
							required: true,
							disabled: true,
							value: "myModel",
							category: "General",
						},
						{
							key: "ENDPOINT",
							label: "Endpoint",
							type: "url",
							required: true,
							category: "Credentials",
						},
						{
							key: "MAX_TOKENS",
							label: "Max Completion Tokens",
							type: "number",
							required: true,
							rules: {
								pattern: {
									value: /^[1-9]\d*$/,
									message:
										"Max Token must be a positive integer",
								},
							},
							category: "Settings",
						},
						{
							key: "CONTEXT_WINDOW",
							label: "Context Window",
							type: "number",
							required: true,
							rules: {
								pattern: {
									value: /^[1-9]\d*$/,
									message:
										"Context Window must be a positive integer",
								},
							},
							category: "Settings",
						},
						{
							key: "KEEP_INPUT_OUTPUT",
							label: "Record Questions and Responses",
							type: "select",
							options: ["true", "false"],
							required: true,
							default: "true",
							category: "Settings",
						},
						{
							key: "KEEP_CONVERSATION_HISTORY",
							label: "Keep Conversation History",
							type: "select",
							options: ["true", "false"],
							required: true,
							default: "true",
							category: "Settings",
						},
						{
							key: "INIT_MODEL_ENGINE",
							label: "Init Script",
							type: "text",
							required: true,
							disabled: true,
							helperText:
								"Note: Self Hosted is connected using the OpenAI specification.",
							default:
								"import genai_client;${VAR_NAME} = genai_client.OpenAiClient(model_name = '${MODEL}', api_key = '${OPEN_AI_KEY}', deployment_type = '${DEPLOYMENT_TYPE}', context_window = ${CONTEXT_WINDOW}, max_tokens = ${MAX_TOKENS})",
							category: "Settings",
						},
					],
				},
				{
					model_types: ["embedding"],
					fields: [
						{
							key: "NAME",
							label: "Catalog Name",
							type: "text",
							required: true,
							category: "General",
							rules: {
								pattern: {
									value: /^[\w\-\s]+$/,
									message:
										"Catalog names can only contain alphanumeric characters and dashes.",
								},
								custom_rules: {
									value: 'CheckEngineName ( "[VALUE]") ;',
									message:
										"This Catalog name has already been used, please try another.",
								},
							},
						},
						{
							key: "MODEL_TYPE",
							label: "Model Type",
							type: "hidden",
							disabled: true,
							required: true,
							default: "OPEN_AI",
							category: "General",
						},
						{
							key: "MODEL_BRAND",
							label: "Model Brand",
							type: "hidden",
							disabled: true,
							required: true,
							default: "OPEN_AI",
							category: "General",
						},
						{
							key: "DEPLOYMENT_TYPE",
							label: "Deployment Type",
							type: "select",
							options: ["vLLM", "TGI"],
							required: true,
							default: "vLLM",
							category: "General",
						},
						{
							key: "MODEL",
							label: "Model Name",
							type: "text",
							disabled: false,
							required: true,
							category: "General",
						},
						{
							key: "ENDPOINT",
							label: "Endpoint",
							type: "url",
							required: true,
							category: "Credentials",
						},
						{
							key: "KEEP_INPUT_OUTPUT",
							label: "Record Questions and Responses",
							type: "select",
							options: ["true", "false"],
							required: true,
							default: "true",
							category: "Settings",
						},
					],
				},
			],
		},
		{
			name: "Perplexity",
			types: [
				{
					model_types: ["llm"],
					fields: [
						{
							key: "NAME",
							label: "Catalog Name",
							type: "text",
							required: true,
							category: "General",
							rules: {
								pattern: {
									value: /^[\w\-\s]+$/,
									message:
										"Catalog names can only contain alphanumeric characters and dashes.",
								},
								custom_rules: {
									value: 'CheckEngineName ( "[VALUE]") ;',
									message:
										"This Catalog name has already been used, please try another.",
								},
							},
						},
						{
							key: "MODEL_TYPE",
							label: "Model Type",
							type: "hidden",
							disabled: true,
							required: true,
							default: "OPEN_AI",
							category: "General",
						},
						{
							key: "MODEL_BRAND",
							label: "Model Brand",
							type: "hidden",
							disabled: true,
							required: true,
							default: "PERPLEXITY",
							category: "General",
						},
						{
							key: "MODEL",
							label: "Model ID",
							type: "text",
							disabled: true,
							required: true,
							category: "General",
						},
						{
							key: "VAR_NAME",
							label: "Variable Name",
							type: "hidden",
							required: true,
							disabled: true,
							value: "myModel",
							category: "General",
						},
						{
							key: "OPEN_AI_KEY",
							label: "Perplexity API Key",
							type: "password",
							required: true,
							category: "Credentials",
						},
						{
							key: "ENDPOINT",
							label: "Endpoint",
							type: "url",
							required: true,
							disabled: true,
							default: "https://api.perplexity.ai",
							value: "https://api.perplexity.ai",
							category: "Credentials",
						},
						{
							key: "MAX_TOKENS",
							label: "Max Completion Tokens",
							type: "number",
							required: true,
							default: 16400,
							rules: {
								pattern: {
									value: /^[1-9]\d*$/,
									message:
										"Max Token must be a positive integer",
								},
							},
							category: "Settings",
						},
						{
							key: "CONTEXT_WINDOW",
							label: "Context Window",
							type: "number",
							required: true,
							default: 128000,
							rules: {
								pattern: {
									value: /^[1-9]\d*$/,
									message:
										"Context Window must be a positive integer",
								},
							},
							category: "Settings",
						},
						{
							key: "KEEP_INPUT_OUTPUT",
							label: "Record Questions and Responses",
							type: "select",
							options: ["true", "false"],
							required: true,
							default: "true",
							category: "Settings",
						},
						{
							key: "KEEP_CONVERSATION_HISTORY",
							label: "Keep Conversation History",
							type: "select",
							options: ["true", "false"],
							required: true,
							default: "true",
							category: "Settings",
						},
						{
							key: "INIT_MODEL_ENGINE",
							label: "Init Script",
							type: "text",
							required: true,
							disabled: true,
							helperText:
								"Note: Perplexity is connected using the OpenAI specification.",
							default:
								"import genai_client;${VAR_NAME} = genai_client.OpenAiClient(endpoint = '${ENDPOINT}', model_name='${MODEL}', chat_type = 'chat-completion', api_key='${OPEN_AI_KEY}', context_window = ${CONTEXT_WINDOW}, max_tokens = ${MAX_TOKENS})",
							category: "Settings",
						},
					],
				},
			],
		},
	],
};

// https://platform.openai.com/docs/models
// https://console.cloud.google.com/vertex-ai/model-garden
// https://aws.amazon.com/bedrock/model-choice/
// https://build.nvidia.com/models
interface AnthropicProviderFormConfigOptions {
	initModelEngine: string;
	provider: string;
	providerFieldType?: FieldType;
	replaceOpenAiKeyWithApiKey?: boolean;
	removeApiVersion?: boolean;
	removeChatType?: boolean;
	useCustomModelInput?: boolean;
}

const buildAnthropicProviderFormConfig = ({
	initModelEngine,
	provider,
	providerFieldType = "hidden",
	replaceOpenAiKeyWithApiKey = false,
	removeApiVersion = false,
	removeChatType = false,
	useCustomModelInput = false,
}: AnthropicProviderFormConfigOptions): ModelFormConfig => ({
	fieldOverrides: [
		...(useCustomModelInput
			? [
					{
						key: "MODEL",
						patch: {
							default: "",
							value: "",
							disabled: false,
							helperText:
								"Enter your Azure deployment name for this model.",
						},
					} satisfies ModelFieldOverride,
				]
			: []),
		...(replaceOpenAiKeyWithApiKey
			? [
					{
						key: "OPEN_AI_KEY",
						replace: {
							key: "API_KEY",
							label: "API Key",
							type: "password",
							required: true,
							category: "Credentials",
						},
					} satisfies ModelFieldOverride,
				]
			: []),
		...(removeApiVersion
			? [
					{
						key: "API_VERSION",
						remove: true,
					} satisfies ModelFieldOverride,
				]
			: []),
		...(removeChatType
			? [{ key: "CHAT_TYPE", remove: true } satisfies ModelFieldOverride]
			: []),
		{
			key: "INIT_MODEL_ENGINE",
			patch: {
				default: initModelEngine,
				value: initModelEngine,
				disabled: true,
			},
		},
	],
	appendFields: [
		{
			insertAfterKey: "MODEL",
			field: {
				key: "PROVIDER",
				label: "Provider",
				type: providerFieldType,
				required: true,
				disabled: true,
				default: provider,
				value: provider,
				category: "General",
			},
		},
	],
});

const AWS_BEDROCK_ANTHROPIC_INIT_MODEL_ENGINE =
	"import genai_client;${VAR_NAME} = genai_client.AnthropicClient(model_name = '${MODEL}', provider = '${PROVIDER}', aws_region='${AWS_REGION}', aws_access_key='${AWS_ACCESS_KEY}', aws_secret_key='${AWS_SECRET_KEY}', context_window = ${CONTEXT_WINDOW}, max_tokens = ${MAX_TOKENS})";

const AZURE_ANTHROPIC_INIT_MODEL_ENGINE =
	"import genai_client;${VAR_NAME} = genai_client.AnthropicClient(model_name = '${MODEL}', provider = '${PROVIDER}', endpoint = '${ENDPOINT}', api_key = '${API_KEY}', context_window = ${CONTEXT_WINDOW}, max_tokens = ${MAX_TOKENS})";

const GOOGLE_ANTHROPIC_INIT_MODEL_ENGINE =
	"import genai_client;${VAR_NAME} = genai_client.AnthropicClient(model_name = '${MODEL}', provider = '${PROVIDER}', region='${GCP_REGION}', project='${PROJECT}', service_account_credentials = ${SERVICE_ACCOUNT_CREDENTIALS}, context_window = ${CONTEXT_WINDOW}, max_tokens = ${MAX_TOKENS})";

const AWS_BEDROCK_ANTHROPIC_FORM_CONFIG = buildAnthropicProviderFormConfig({
	initModelEngine: AWS_BEDROCK_ANTHROPIC_INIT_MODEL_ENGINE,
	provider: "bedrock",
	providerFieldType: "text",
});

const AZURE_ANTHROPIC_FORM_CONFIG = buildAnthropicProviderFormConfig({
	initModelEngine: AZURE_ANTHROPIC_INIT_MODEL_ENGINE,
	provider: "azure",
	providerFieldType: "text",
	replaceOpenAiKeyWithApiKey: true,
	removeApiVersion: true,
	removeChatType: true,
	useCustomModelInput: true,
});

const GOOGLE_ANTHROPIC_FORM_CONFIG = buildAnthropicProviderFormConfig({
	initModelEngine: GOOGLE_ANTHROPIC_INIT_MODEL_ENGINE,
	provider: "google",
	providerFieldType: "text",
});

const withModelTokenLimits = (
	baseFormConfig: ModelFormConfig | undefined,
	maxTokens: number,
	contextWindow: number,
): ModelFormConfig => {
	const existingFieldOverrides = (
		baseFormConfig?.fieldOverrides ?? []
	).filter(
		(override) =>
			override.key !== "MAX_TOKENS" && override.key !== "CONTEXT_WINDOW",
	);

	return {
		...(baseFormConfig ?? {}),
		fieldOverrides: [
			...existingFieldOverrides,
			{
				key: "MAX_TOKENS",
				patch: { default: maxTokens },
			},
			{
				key: "CONTEXT_WINDOW",
				patch: { default: contextWindow },
			},
		],
	};
};
export const MODEL_VERSIONS: ModelVersionsByProvider = {
	Anthropic: [
		{
			name: "claude-haiku-4-5-20251001",
			display: "Claude Haiku 4.5",
			icon: "/src/assets/img/CLAUDE_AI.svg",
			modelBrand: "CLAUDE",
			embedding: false,
			link: "https://docs.anthropic.com/en/docs/models-overview",
			description:
				"Fast Claude model with near-frontier intelligence for low-latency generation and lightweight assistant workflows.",
			formConfig: withModelTokenLimits(undefined, 64000, 200000),
		},
		{
			name: "claude-sonnet-4-6",
			display: "Claude Sonnet 4.6",
			icon: "/src/assets/img/CLAUDE_AI.svg",
			modelBrand: "CLAUDE",
			embedding: false,
			link: "https://docs.anthropic.com/en/docs/models-overview",
			description:
				"Balanced Claude model combining speed and intelligence for general enterprise workloads.",
			formConfig: withModelTokenLimits(undefined, 64000, 1000000),
		},
		{
			name: "claude-opus-4-6",
			display: "Claude Opus 4.6",
			icon: "/src/assets/img/CLAUDE_AI.svg",
			modelBrand: "CLAUDE",
			embedding: false,
			link: "https://docs.anthropic.com/en/docs/models-overview",
			description:
				"Most intelligent Claude model for complex reasoning, coding, and advanced agentic workflows.",
			formConfig: withModelTokenLimits(undefined, 128000, 1000000),
		},
		{
			name: "claude-opus-4-7",
			display: "Claude Opus 4.7",
			icon: "/src/assets/img/CLAUDE_AI.svg",
			modelBrand: "CLAUDE",
			embedding: false,
			link: "https://docs.anthropic.com/en/docs/models-overview",
			description:
				"Frontier Claude Opus model with advanced software engineering, superior vision, and long-running agentic capabilities.",
			formConfig: withModelTokenLimits(undefined, 128000, 1000000),
		},
		{
			name: "other-anthropic-model",
			display: "Other Anthropic Model",
			icon: "/src/assets/img/CLAUDE_AI.svg",
			modelBrand: "CLAUDE",
			embedding: false,
			link: "https://docs.anthropic.com/en/docs/models-overview",
			description:
				"Configure any Anthropic Claude model not listed above by entering your preferred model ID and custom init script.",
			formConfig: OTHER_MODEL_FORM_CONFIG_BY_PROVIDER.Anthropic,
		},
	],
	"AWS Bedrock": [
		{
			name: "anthropic.claude-haiku-4-5-20251001-v1:0",
			display: "Claude Haiku 4.5 (Bedrock)",
			icon: "/src/assets/img/CLAUDE_AI.svg",
			modelBrand: "CLAUDE",
			embedding: false,
			link: "https://docs.anthropic.com/en/docs/models-overview",
			description:
				"Fast Claude model with near-frontier intelligence served through AWS Bedrock.",
			formConfig: withModelTokenLimits(
				AWS_BEDROCK_ANTHROPIC_FORM_CONFIG,
				64000,
				200000,
			),
		},
		{
			name: "anthropic.claude-sonnet-4-20250514-v1:0",
			display: "Claude Sonnet 4 (Bedrock)",
			icon: "/src/assets/img/CLAUDE_AI.svg",
			modelBrand: "CLAUDE",
			embedding: false,
			link: "https://docs.anthropic.com/en/docs/models-overview",
			description:
				"Earlier Sonnet 4 model for balanced intelligence and speed on AWS Bedrock.",
			formConfig: withModelTokenLimits(
				AWS_BEDROCK_ANTHROPIC_FORM_CONFIG,
				64000,
				200000,
			),
		},
		{
			name: "anthropic.claude-sonnet-4-5-20250929-v1:0",
			display: "Claude Sonnet 4.5 (Bedrock)",
			icon: "/src/assets/img/CLAUDE_AI.svg",
			modelBrand: "CLAUDE",
			embedding: false,
			link: "https://docs.anthropic.com/en/docs/models-overview",
			description:
				"High-capability Claude model for advanced reasoning and coding on AWS Bedrock.",
			formConfig: withModelTokenLimits(
				AWS_BEDROCK_ANTHROPIC_FORM_CONFIG,
				64000,
				200000,
			),
		},
		{
			name: "anthropic.claude-sonnet-4-6",
			display: "Claude Sonnet 4.6 (Bedrock)",
			icon: "/src/assets/img/CLAUDE_AI.svg",
			modelBrand: "CLAUDE",
			embedding: false,
			link: "https://docs.anthropic.com/en/docs/models-overview",
			description:
				"Balanced Claude model on Bedrock for strong reasoning, coding, and high-throughput production use cases.",
			formConfig: withModelTokenLimits(
				AWS_BEDROCK_ANTHROPIC_FORM_CONFIG,
				64000,
				1000000,
			),
		},
		{
			name: "anthropic.claude-opus-4-6-v1",
			display: "Claude Opus 4.6 (Bedrock)",
			icon: "/src/assets/img/CLAUDE_AI.svg",
			modelBrand: "CLAUDE",
			embedding: false,
			link: "https://docs.anthropic.com/en/docs/models-overview",
			description:
				"Most intelligent Claude model hosted on Bedrock for complex reasoning and coding tasks.",
			formConfig: withModelTokenLimits(
				AWS_BEDROCK_ANTHROPIC_FORM_CONFIG,
				128000,
				1000000,
			),
		},
		{
			name: "anthropic.claude-opus-4-7",
			display: "Claude Opus 4.7 (Bedrock)",
			icon: "/src/assets/img/CLAUDE_AI.svg",
			modelBrand: "CLAUDE",
			embedding: false,
			link: "https://docs.aws.amazon.com/bedrock/latest/userguide/model-card-anthropic-claude-opus-4-7.html",
			description:
				"Frontier Claude Opus model on Bedrock with advanced software engineering, superior vision, and long-running agentic capabilities.",
			formConfig: withModelTokenLimits(
				AWS_BEDROCK_ANTHROPIC_FORM_CONFIG,
				128000,
				1000000,
			),
		},
		{
			name: "amazon.nova-2-multimodal-embeddings-v1:0",
			display: "Amazon Nova 2 Multimodal Embeddings",
			icon: "/src/assets/img/BEDROCK.svg",
			embedding: true,
			link: "https://docs.aws.amazon.com/bedrock/latest/userguide/model-ids.html",
			description:
				"Amazon Nova multimodal embedding model for text, image, audio, and video representation use cases.",
		},
		{
			name: "amazon.nova-2-lite-v1:0",
			display: "Amazon Nova 2 Lite",
			icon: "/src/assets/img/BEDROCK.svg",
			embedding: false,
			link: "https://docs.aws.amazon.com/bedrock/latest/userguide/model-ids.html",
			description:
				"Amazon Nova 2 Lite model for efficient multimodal generation and general-purpose assistant workloads.",
			formConfig: withModelTokenLimits(undefined, 65000, 1000000),
		},
		{
			name: "amazon.nova-2-sonic-v1:0",
			display: "Amazon Nova 2 Sonic",
			icon: "/src/assets/img/BEDROCK.svg",
			embedding: false,
			audio: true,
			link: "https://docs.aws.amazon.com/bedrock/latest/userguide/model-ids.html",
			description:
				"Amazon Nova 2 Sonic model for speech and text interaction workflows on Bedrock.",
			formConfig: withModelTokenLimits(undefined, 65000, 1000000),
		},
		{
			name: "amazon.nova-canvas-v1:0",
			display: "Amazon Nova Canvas",
			icon: "/src/assets/img/BEDROCK.svg",
			embedding: false,
			image: true,
			link: "https://docs.aws.amazon.com/bedrock/latest/userguide/model-ids.html",
			description:
				"Amazon Nova Canvas image generation model for text-to-image and visual content creation tasks.",
		},
		{
			name: "amazon.nova-lite-v1:0",
			display: "Amazon Nova Lite",
			icon: "/src/assets/img/BEDROCK.svg",
			embedding: false,
			link: "https://docs.aws.amazon.com/bedrock/latest/userguide/model-ids.html",
			description:
				"Amazon Nova Lite model for low-latency multimodal generation and cost-sensitive workloads.",
			formConfig: withModelTokenLimits(undefined, 10000, 300000),
		},
		{
			name: "amazon.nova-micro-v1:0",
			display: "Amazon Nova Micro",
			icon: "/src/assets/img/BEDROCK.svg",
			embedding: false,
			link: "https://docs.aws.amazon.com/bedrock/latest/userguide/model-ids.html",
			description:
				"Amazon Nova Micro model optimized for fast text generation and lightweight production tasks.",
			formConfig: withModelTokenLimits(undefined, 10000, 128000),
		},
		{
			name: "amazon.nova-premier-v1:0",
			display: "Amazon Nova Premier",
			icon: "/src/assets/img/BEDROCK.svg",
			embedding: false,
			link: "https://docs.aws.amazon.com/bedrock/latest/userguide/model-ids.html",
			description:
				"Amazon Nova Premier model for high-capability multimodal reasoning and enterprise workflows.",
			formConfig: withModelTokenLimits(undefined, 10000, 1000000),
		},
		{
			name: "amazon.nova-pro-v1:0",
			display: "Amazon Nova Pro",
			icon: "/src/assets/img/BEDROCK.svg",
			embedding: false,
			link: "https://docs.aws.amazon.com/bedrock/latest/userguide/model-ids.html",
			description:
				"Amazon Nova Pro model balancing quality, speed, and multimodal support for production assistants.",
			formConfig: withModelTokenLimits(undefined, 10000, 300000),
		},
		{
			name: "amazon.nova-reel-v1:0",
			display: "Amazon Nova Reel",
			icon: "/src/assets/img/BEDROCK.svg",
			embedding: false,
			image: true,
			link: "https://docs.aws.amazon.com/bedrock/latest/userguide/model-ids.html",
			description:
				"Amazon Nova Reel model for video-focused generation workflows from text and image prompts.",
		},
		{
			name: "amazon.nova-reel-v1:1",
			display: "Amazon Nova Reel v1.1",
			icon: "/src/assets/img/BEDROCK.svg",
			embedding: false,
			image: true,
			link: "https://docs.aws.amazon.com/bedrock/latest/userguide/model-ids.html",
			description:
				"Updated Amazon Nova Reel model for video generation workflows on Bedrock.",
		},
		{
			name: "amazon.nova-sonic-v1:0",
			display: "Amazon Nova Sonic",
			icon: "/src/assets/img/BEDROCK.svg",
			embedding: false,
			audio: true,
			link: "https://docs.aws.amazon.com/bedrock/latest/userguide/model-ids.html",
			description:
				"Amazon Nova Sonic speech-centric model for voice and text conversational experiences.",
			formConfig: {
				fieldOverrides: [
					{
						key: "CONTEXT_WINDOW",
						patch: { default: 300000 },
					},
				],
			},
		},
		{
			name: "amazon.rerank-v1:0",
			display: "Amazon Rerank 1.0",
			icon: "/src/assets/img/BEDROCK.svg",
			embedding: false,
			link: "https://docs.aws.amazon.com/bedrock/latest/userguide/model-ids.html",
			description:
				"Amazon reranking model for improving search relevance and retrieval quality in RAG pipelines.",
		},
		{
			name: "amazon.titan-embed-text-v1",
			display: "Amazon Titan Embeddings G1 - Text",
			icon: "/src/assets/img/BEDROCK.svg",
			embedding: true,
			link: "https://docs.aws.amazon.com/bedrock/latest/userguide/model-ids.html",
			description:
				"Amazon Titan text embedding model for semantic search, clustering, and retrieval use cases.",
		},
		{
			name: "amazon.titan-image-generator-v2:0",
			display: "Amazon Titan Image Generator G1 v2",
			icon: "/src/assets/img/BEDROCK.svg",
			embedding: false,
			image: true,
			link: "https://docs.aws.amazon.com/bedrock/latest/userguide/model-ids.html",
			description:
				"Amazon Titan image generation model for text-to-image creation and visual asset workflows.",
		},
		{
			name: "amazon.titan-embed-image-v1",
			display: "Amazon Titan Multimodal Embeddings G1",
			icon: "/src/assets/img/BEDROCK.svg",
			embedding: true,
			link: "https://docs.aws.amazon.com/bedrock/latest/userguide/model-ids.html",
			description:
				"Amazon Titan multimodal embedding model for joint text-image semantic representation tasks.",
		},
		{
			name: "amazon.titan-embed-text-v2:0",
			display: "Amazon Titan Text Embeddings V2",
			icon: "/src/assets/img/BEDROCK.svg",
			embedding: true,
			link: "https://docs.aws.amazon.com/bedrock/latest/userguide/model-ids.html",
			description:
				"Amazon Titan V2 text embeddings model for large-scale semantic indexing and retrieval.",
		},
		{
			name: "amazon.titan-embed-g1-text-02",
			display: "Amazon Titan Text Embeddings v2",
			icon: "/src/assets/img/BEDROCK.svg",
			embedding: true,
			link: "https://docs.aws.amazon.com/bedrock/latest/userguide/model-ids.html",
			description:
				"Amazon Titan embedding model variant for text embedding workloads on Bedrock.",
		},
		{
			name: "amazon.titan-tg1-large",
			display: "Amazon Titan Text Large",
			icon: "/src/assets/img/BEDROCK.svg",
			embedding: false,
			link: "https://docs.aws.amazon.com/bedrock/latest/userguide/model-ids.html",
			description:
				"Amazon Titan large text generation model for long-form and higher-quality language tasks.",
		},
		{
			name: "amazon.titan-e1m-medium",
			display: "Amazon Titan Text/Image Embeddings",
			icon: "/src/assets/img/BEDROCK.svg",
			embedding: true,
			link: "https://docs.aws.amazon.com/bedrock/latest/userguide/model-ids.html",
			description:
				"Amazon Titan text-image embedding model for multimodal search and retrieval applications.",
		},
		{
			name: "other-aws-bedrock-model",
			display: "Other AWS Bedrock Model",
			icon: "/src/assets/img/BEDROCK.svg",
			modelBrand: "BEDROCK",
			embedding: false,
			link: "https://docs.aws.amazon.com/bedrock/latest/userguide/model-ids.html",
			description:
				"Configure any AWS Bedrock model not listed above by entering the model ID and custom init script details.",
			formConfig: OTHER_MODEL_FORM_CONFIG_BY_PROVIDER["AWS Bedrock"],
		},
		{
			name: "other-aws-bedrock-embedding-model",
			display: "Other AWS Bedrock Embedding Model",
			icon: "/src/assets/img/BEDROCK.svg",
			modelBrand: "BEDROCK",
			embedding: true,
			link: "https://docs.aws.amazon.com/bedrock/latest/userguide/model-ids.html",
			description:
				"Configure any AWS Bedrock embedding model not listed above by entering the model ID and custom init script details.",
			formConfig: OTHER_MODEL_FORM_CONFIG_BY_PROVIDER["AWS Bedrock"],
		},
	],
	"Azure OpenAI": [
		{
			name: "azure-openai",
			display: "Azure Open AI",
			icon: "/src/assets/img/AZURE_OPEN_AI.svg",
			embedding: false,
			link: "https://learn.microsoft.com/azure/ai-services/openai/concepts/models",
			description:
				"Enterprise-grade OpenAI models deployed on Azure with enhanced security, compliance, and regional availability for production workloads.",
			formConfig: {
				fieldOverrides: [
					{
						key: "MODEL",
						patch: {
							label: "Model (Deployment Name)",
							default: "",
							value: "",
							disabled: false,
							helperText:
								"Enter your Azure deployment name for this model.",
						},
					},
				],
			},
		},
		{
			name: "azure-open-ai-embeddings",
			display: "Azure OpenAI Embeddings",
			icon: "/src/assets/img/AZURE_OPEN_AI.svg",
			embedding: true,
			link: "https://learn.microsoft.com/azure/ai-services/openai/concepts/models#embeddings",
			description:
				"Azure-hosted text embedding model for semantic search, similarity matching, and content recommendations with enterprise security.",
		},
		{
			name: "claude-models",
			display: "Claude (Azure)",
			icon: "/src/assets/img/CLAUDE_AI.svg",
			modelBrand: "CLAUDE",
			embedding: false,
			link: "https://learn.microsoft.com/azure/ai-foundry/model-inference/concepts/models",
			description:
				"Fast Anthropic Claude model hosted on Azure AI inference endpoints.",
			formConfig: withModelTokenLimits(
				AZURE_ANTHROPIC_FORM_CONFIG,
				64000,
				200000,
			),
		},
		{
			name: "other-azure-openai-model",
			display: "Other Azure OpenAI Model",
			icon: "/src/assets/img/AZURE_OPEN_AI.svg",
			modelBrand: "AZURE_OPEN_AI",
			embedding: false,
			link: "https://learn.microsoft.com/azure/ai-services/openai/concepts/models",
			description:
				"Configure any Azure OpenAI chat/completion deployment by entering your custom deployment name and init script.",
			formConfig: OTHER_MODEL_FORM_CONFIG_BY_PROVIDER["Azure OpenAI"],
		},
		{
			name: "other-azure-openai-embedding-model",
			display: "Other Azure OpenAI Embedding Model",
			icon: "/src/assets/img/AZURE_OPEN_AI.svg",
			modelBrand: "AZURE_OPEN_AI",
			embedding: true,
			link: "https://learn.microsoft.com/azure/ai-services/openai/concepts/models#embeddings",
			description:
				"Configure a custom Azure OpenAI embedding deployment by entering your own deployment name and editing the init script as needed.",
			formConfig: {
				fieldOverrides: [
					{
						key: "MODEL",
						replace: {
							key: "MODEL",
							label: "Model (Deployment Name)",
							type: "text",
							required: true,
							default: "",
							value: "",
							category: "General",
							helperText:
								"Enter your Azure deployment name for this embedding model.",
						},
					},
					{
						key: "INIT_MODEL_ENGINE",
						patch: { disabled: false },
					},
				],
			},
		},
	],
	Embedded: [
		{
			name: "NeMo",
			display: "NeMo",
			icon: "/src/assets/img/NEMO.png",
			modelBrand: "NEMO",
			embedding: false,
			disable: true,
		},
		{
			name: "Orca",
			display: "Orca",
			icon: "/src/assets/img/ORCA.png",
			modelBrand: "ORCA",
			embedding: false,
		},
		{
			name: "Replit Code Model",
			display: "Replit Code Model",
			icon: "/src/assets/img/REPLIT_CODE.png",
			modelBrand: "REPLIT_CODE_MODEL",
			embedding: false,
			disable: true,
		},
		{
			name: "Stablity AI",
			display: "Stablity AI",
			icon: "/src/assets/img/STABILITY_AI.png",
			modelBrand: "STABLITY_AI",
			embedding: false,
			disable: true,
		},
		{
			name: "other-embedded-model",
			display: "Other Embedded Model",
			icon: "/src/assets/img/BRAIN.png",
			modelBrand: "HUGGINGFACE",
			embedding: false,
			description:
				"Configure any embedded model not listed above by supplying its model name and custom init script.",
			formConfig: OTHER_MODEL_FORM_CONFIG_BY_PROVIDER.Embedded,
		},
	],
	"Google Gemini": [
		{
			name: "claude-haiku-4-5@20251001",
			display: "Claude Haiku 4.5 (Vertex)",
			icon: "/src/assets/img/CLAUDE_AI.svg",
			modelBrand: "CLAUDE",
			embedding: false,
			link: "https://cloud.google.com/vertex-ai/generative-ai/docs/partner-models/claude",
			description:
				"Low-latency Anthropic Claude model served via Vertex AI partner model infrastructure.",
			formConfig: withModelTokenLimits(
				GOOGLE_ANTHROPIC_FORM_CONFIG,
				64000,
				200000,
			),
		},
		{
			name: "claude-sonnet-4-6",
			display: "Claude Sonnet 4.6 (Vertex)",
			icon: "/src/assets/img/CLAUDE_AI.svg",
			modelBrand: "CLAUDE",
			embedding: false,
			link: "https://cloud.google.com/vertex-ai/generative-ai/docs/partner-models/claude",
			description:
				"Anthropic Claude model served through Vertex AI partner models for enterprise workflows on GCP.",
			formConfig: withModelTokenLimits(
				GOOGLE_ANTHROPIC_FORM_CONFIG,
				64000,
				1000000,
			),
		},
		{
			name: "claude-opus-4-6",
			display: "Claude Opus 4.6 (Vertex)",
			icon: "/src/assets/img/CLAUDE_AI.svg",
			modelBrand: "CLAUDE",
			embedding: false,
			link: "https://cloud.google.com/vertex-ai/generative-ai/docs/partner-models/claude",
			description:
				"Anthropic Claude model served through Vertex AI partner models for enterprise workflows on GCP.",
			formConfig: withModelTokenLimits(
				GOOGLE_ANTHROPIC_FORM_CONFIG,
				128000,
				1000000,
			),
		},
		{
			name: "claude-opus-4-7",
			display: "Claude Opus 4.7 (Vertex)",
			icon: "/src/assets/img/CLAUDE_AI.svg",
			modelBrand: "CLAUDE",
			embedding: false,
			link: "https://docs.cloud.google.com/vertex-ai/generative-ai/docs/partner-models/claude/opus-4-7",
			description:
				"Frontier Claude Opus model on Vertex AI with advanced software engineering, superior vision, and long-running agentic capabilities.",
			formConfig: withModelTokenLimits(
				GOOGLE_ANTHROPIC_FORM_CONFIG,
				128000,
				1000000,
			),
		},
		{
			name: "gemini-3.1-pro-preview",
			display: "Gemini 3.1 Pro Preview",
			icon: "/src/assets/img/GEMINI_COLOR.svg",
			embedding: false,
			link: "https://cloud.google.com/vertex-ai/generative-ai/docs/models/gemini/3-1-pro",
			description:
				"Advanced intelligence model for complex problem-solving and agentic capabilities.",
			formConfig: withModelTokenLimits(undefined, 65536, 1048576),
		},
		{
			name: "gemini-3-flash-preview",
			display: "Gemini 3 Flash Preview",
			icon: "/src/assets/img/GEMINI_COLOR.svg",
			embedding: false,
			link: "https://cloud.google.com/vertex-ai/generative-ai/docs/models/gemini/3-flash",
			description:
				"High-performance model with pro-level intelligence at lower latency and cost.",
			formConfig: withModelTokenLimits(undefined, 65536, 1048576),
		},
		{
			name: "gemini-3.1-flash-lite-preview",
			display: "Gemini 3.1 Flash Lite Preview",
			icon: "/src/assets/img/GEMINI_COLOR.svg",
			embedding: false,
			link: "https://cloud.google.com/vertex-ai/generative-ai/docs/models/gemini/3-1-flash-lite",
			description:
				"Optimized preview model for high-volume, cost-sensitive tasks.",
			formConfig: withModelTokenLimits(undefined, 65536, 1048576),
		},
		{
			name: "gemini-3-pro-image-preview",
			display: "Gemini 3 Pro Image Preview",
			icon: "/src/assets/img/GEMINI_COLOR.svg",
			embedding: false,
			link: "https://cloud.google.com/vertex-ai/generative-ai/docs/models/gemini/3-pro-image",
			image: true,
			description:
				"High-fidelity image generation model with reasoning capabilities.",
			formConfig: withModelTokenLimits(undefined, 32768, 65536),
		},
		{
			name: "gemini-3.1-flash-image-preview",
			display: "Gemini 3.1 Flash Image Preview",
			icon: "/src/assets/img/GEMINI_COLOR.svg",
			embedding: false,
			link: "https://cloud.google.com/vertex-ai/generative-ai/docs/models/gemini/3-1-flash-image",
			image: true,
			description:
				"High-efficiency visual creation model for fast image generation workflows.",
			formConfig: withModelTokenLimits(undefined, 32768, 131072),
		},
		{
			name: "gemini-2.5-pro",
			display: "Gemini 2.5 Pro",
			icon: "/src/assets/img/GEMINI_COLOR.svg",
			embedding: false,
			link: "https://cloud.google.com/vertex-ai/generative-ai/docs/models/gemini/2-5-pro",
			description:
				"High-capability model for complex reasoning and coding with a large context window.",
			formConfig: withModelTokenLimits(undefined, 65536, 1048576),
		},
		{
			name: "gemini-2.5-flash",
			display: "Gemini 2.5 Flash",
			icon: "/src/assets/img/GEMINI_COLOR.svg",
			embedding: false,
			link: "https://cloud.google.com/vertex-ai/generative-ai/docs/models/gemini/2-5-flash",
			description:
				"Fast and capable model balancing intelligence and speed.",
			formConfig: withModelTokenLimits(undefined, 65536, 1048576),
		},
		{
			name: "gemini-2.5-flash-lite",
			display: "Gemini 2.5 Flash Lite",
			icon: "/src/assets/img/GEMINI_COLOR.svg",
			embedding: false,
			link: "https://cloud.google.com/vertex-ai/generative-ai/docs/models/gemini/2-5-flash-lite",
			description: "Optimized Gemini model for high-throughput tasks.",
			formConfig: withModelTokenLimits(undefined, 65536, 1048576),
		},
		{
			name: "gemini-2.0-flash-001",
			display: "Gemini 2.0 Flash 001",
			icon: "/src/assets/img/GEMINI_COLOR.svg",
			embedding: false,
			link: "https://cloud.google.com/vertex-ai/generative-ai/docs/models/gemini/2-0-flash",
			description:
				"Multimodal general-purpose model for broad production use.",
			formConfig: withModelTokenLimits(undefined, 8192, 1048576),
		},
		{
			name: "gemini-2.5-flash-image",
			display: "Gemini 2.5 Flash Image",
			icon: "/src/assets/img/GEMINI_COLOR.svg",
			embedding: false,
			link: "https://cloud.google.com/vertex-ai/generative-ai/docs/models/gemini/2-5-flash-image",
			image: true,
			description:
				"Production-ready image model for fast, high-quality asset generation.",
			formConfig: withModelTokenLimits(undefined, 32768, 65536),
		},
		{
			name: "other-google-gemini-model",
			display: "Other Google Gemini Model",
			icon: "/src/assets/img/GEMINI_COLOR.svg",
			modelBrand: "GEMINI",
			embedding: false,
			link: "https://cloud.google.com/vertex-ai/generative-ai/docs/models",
			description:
				"Configure any Vertex-hosted Gemini or partner model not listed above with a custom model ID and init script.",
			formConfig: OTHER_MODEL_FORM_CONFIG_BY_PROVIDER["Google Gemini"],
		},
	],
	"NVIDIA NIM": [
		{
			name: "embed-qa-4",
			display: "EMBED QA 4",
			icon: "/src/assets/img/NEMO.png",
			embedding: true,
			link: "https://build.nvidia.com/nvidia/embed-qa-4",
			description:
				"NVIDIA's question-answering embedding model optimized for semantic search and information retrieval tasks.",
		},
		{
			name: "rerank-qa-mistral-4b",
			display: "Rerank QA Mistral 4B",
			icon: "/src/assets/img/NEMO.png",
			embedding: false,
			link: "https://build.nvidia.com/nvidia/rerank-qa-mistral-4b",
			description:
				"NVIDIA's reranking model for improving search result relevance and document retrieval accuracy.",
		},
		{
			name: "other-nvidia-nim-model",
			display: "Other NVIDIA NIM Model",
			icon: "/src/assets/img/NEMO.png",
			modelBrand: "NEMO",
			embedding: false,
			link: "https://build.nvidia.com/models",
			description:
				"Configure any NVIDIA NIM model not listed above by entering the model name and updating init script parameters.",
			formConfig: OTHER_MODEL_FORM_CONFIG_BY_PROVIDER["NVIDIA NIM"],
		},
	],
	OpenAI: [
		{
			name: "chatgpt-image-latest",
			display: "chatgpt-image-latest",
			icon: "/src/assets/img/OPEN_AI.svg",
			image: true,
			description:
				"Image model used in ChatGPT for image generation and editing workflows.",
			link: "https://platform.openai.com/docs/models",
		},
		{
			name: "gpt-image-1.5",
			display: "GPT Image 1.5",
			icon: "/src/assets/img/OPEN_AI.svg",
			image: true,
			description:
				"State-of-the-art image generation model for high-quality image creation and editing.",
			link: "https://platform.openai.com/docs/models",
		},
		{
			name: "gpt-image-1",
			display: "GPT Image 1",
			icon: "/src/assets/img/OPEN_AI.svg",
			image: true,
			description:
				"Previous image generation model in the GPT Image family.",
			link: "https://platform.openai.com/docs/models/gpt-image-1",
		},
		{
			name: "gpt-image-1-mini",
			display: "gpt-image-1-mini",
			icon: "/src/assets/img/OPEN_AI.svg",
			image: true,
			description:
				"Cost-efficient GPT Image model for lower-cost image generation and editing use cases.",
			link: "https://platform.openai.com/docs/models",
		},
		{
			name: "gpt-4.1",
			display: "GPT-4.1",
			icon: "/src/assets/img/OPEN_AI.svg",
			description: "Smartest non-reasoning model.",
			link: "https://platform.openai.com/docs/models/gpt-4.1",
		},
		{
			name: "gpt-5",
			display: "GPT-5",
			icon: "/src/assets/img/OPEN_AI.svg",
			description:
				"Previous intelligent reasoning model for coding and agentic tasks with configurable reasoning effort.",
			link: "https://platform.openai.com/docs/models/gpt-5",
		},
		{
			name: "gpt-5-mini",
			display: "GPT-5 Mini",
			icon: "/src/assets/img/OPEN_AI.svg",
			description:
				"A faster, cost-efficient GPT-5 variant optimized for well-defined tasks and precise prompts.",
			link: "https://platform.openai.com/docs/models/gpt-5-mini",
		},
		{
			name: "gpt-5-nano",
			display: "GPT-5 nano",
			icon: "/src/assets/img/OPEN_AI.svg",
			description:
				"Fastest, most cost-efficient GPT-5 variant ideal for high-volume summarization and classification.",
			link: "https://platform.openai.com/docs/models/gpt-5-nano",
		},
		{
			name: "gpt-5.1",
			display: "GPT-5.1",
			icon: "/src/assets/img/OPEN_AI.svg",
			description:
				"The best model for coding and agentic tasks with configurable reasoning effort.",
			link: "https://platform.openai.com/docs/models/gpt-5.1",
		},
		{
			name: "gpt-5.4",
			display: "GPT-5.4",
			icon: "/src/assets/img/OPEN_AI.svg",
			description:
				"Best intelligence at scale for agentic, coding, and professional workflows.",
			link: "https://platform.openai.com/docs/models/gpt-5.4",
		},
		{
			name: "gpt-5.4-mini",
			display: "GPT-5.4 Mini",
			icon: "/src/assets/img/OPEN_AI.svg",
			description:
				"Strong mini model for coding, computer use, and subagent workflows.",
			link: "https://platform.openai.com/docs/models/gpt-5.4-mini",
		},
		{
			name: "gpt-5.4-nano",
			display: "GPT-5.4 Nano",
			icon: "/src/assets/img/OPEN_AI.svg",
			description:
				"Cheapest GPT-5.4-class model for simple high-volume tasks.",
			link: "https://platform.openai.com/docs/models/gpt-5.4-nano",
		},
		{
			name: "gpt-5.4-pro",
			display: "GPT-5.4 Pro",
			icon: "/src/assets/img/OPEN_AI.svg",
			description:
				"Version of GPT-5.4 tuned for smarter and more precise responses.",
			link: "https://platform.openai.com/docs/models/gpt-5.4-pro",
		},
		{
			name: "gpt-5.5",
			display: "GPT-5.5",
			icon: "/src/assets/img/OPEN_AI.svg",
			description:
				"Next-generation GPT-5 reasoning model with a 1.05M context window and advanced reasoning token support.",
			link: "https://developers.openai.com/api/docs/models/gpt-5.5",
			formConfig: withModelTokenLimits(undefined, 128000, 1050000),
		},
		{
			name: "gpt-audio",
			display: "gpt-audio",
			icon: "/src/assets/img/OPEN_AI.svg",
			audio: true,
			disable: true,
			description:
				"First generally available GPT audio model supporting audio input and output via Chat Completions.",
			link: "https://platform.openai.com/docs/models/gpt-audio",
		},
		{
			name: "text-embedding-3-large",
			display: "text-embedding-3-large",
			icon: "/src/assets/img/OPEN_AI.svg",
			embedding: true,
			description:
				"Most capable multilingual embedding model for semantic search, clustering, recommendations, anomaly detection, and classification.",
			link: "https://platform.openai.com/docs/models/text-embedding-3-large",
		},
		{
			name: "text-embedding-3-small",
			display: "text-embedding-3-small",
			icon: "/src/assets/img/OPEN_AI.svg",
			embedding: true,
			description:
				"Smaller, cost-efficient embedding model for semantic similarity, search, and lightweight classification tasks.",
			link: "https://platform.openai.com/docs/models/text-embedding-3-small",
		},
		{
			name: "other-openai-model",
			display: "Other OpenAI Model",
			icon: "/src/assets/img/OPEN_AI.svg",
			modelBrand: "OPEN_AI",
			embedding: false,
			link: "https://platform.openai.com/docs/models",
			description:
				"Configure any OpenAI model not listed above by entering the model ID and editing init script details.",
			formConfig: OTHER_MODEL_FORM_CONFIG_BY_PROVIDER.OpenAI,
		},
		{
			name: "other-openai-embeddings",
			display: "Other OpenAI Embedding Model",
			icon: "/src/assets/img/OPEN_AI.svg",
			modelBrand: "OPEN_AI",
			embedding: true,
			link: "https://developers.openai.com/api/docs/models",
			description:
				"Configure a custom OpenAI embedding model by entering any embedding model ID.",
			formConfig: {
				fieldOverrides: [
					{
						key: "MODEL",
						patch: { default: "", value: "", disabled: false },
					},
				],
			},
		},
	],
	"Self Hosted": [
		{
			name: "Falcon",
			display: "Falcon",
			icon: "/src/assets/img/FALCON_AI.png",
			modelBrand: "FALCON",
			embedding: false,
			link: "https://huggingface.co/tiiuae/falcon-40b",
			description:
				"TII's high-performance open-source model for general-purpose text generation and reasoning.",
			formConfig: {
				fieldOverrides: [
					{
						key: "CONTEXT_WINDOW",
						patch: { default: 2048 },
					},
				],
			},
		},
		{
			name: "Flan T5 Large",
			display: "Flan T5 Large",
			icon: "/src/assets/img/FLAN.jpg",
			modelBrand: "FLAN_T5_LARGE",
			embedding: false,
			link: "https://huggingface.co/google/flan-t5-large",
			description:
				"Google's instruction-tuned T5 variant for multi-task language understanding and generation.",
			formConfig: {
				fieldOverrides: [
					{
						key: "CONTEXT_WINDOW",
						patch: { default: 512 },
					},
				],
			},
		},
		{
			name: "Flan T5 XXL",
			display: "Flan T5 XXL",
			icon: "/src/assets/img/FLAN.jpg",
			modelBrand: "FLAN_T5_LARGE",
			embedding: false,
			link: "https://huggingface.co/google/flan-t5-xxl",
			description:
				"Largest Flan-T5 model offering superior performance on complex reasoning and instruction-following tasks.",
			formConfig: {
				fieldOverrides: [
					{
						key: "CONTEXT_WINDOW",
						patch: { default: 512 },
					},
				],
			},
		},
		{
			name: "Llama3 405B",
			display: "Llama3 405B",
			icon: "/src/assets/img/META_COLOR.svg",
			modelBrand: "META",
			embedding: false,
			link: "https://huggingface.co/meta-llama/Llama-3.1-405B-Instruct",
			description:
				"Meta's largest Llama 3.1 model for top-tier reasoning, complex instructions, and enterprise-grade tasks.",
			formConfig: {
				fieldOverrides: [
					{
						key: "CONTEXT_WINDOW",
						patch: { default: 128000 },
					},
				],
			},
		},
		{
			name: "Llama3 70B",
			display: "Llama3 70B",
			icon: "/src/assets/img/META_COLOR.svg",
			modelBrand: "META",
			embedding: false,
			link: "https://huggingface.co/meta-llama/Llama-3.1-70B-Instruct",
			description:
				"High-performance Llama 3.1 70B model balancing quality and speed for production reasoning workloads.",
			formConfig: {
				fieldOverrides: [
					{
						key: "CONTEXT_WINDOW",
						patch: { default: 128000 },
					},
				],
			},
		},
		{
			name: "Llama3 8B",
			display: "Llama3 8B",
			icon: "/src/assets/img/META_COLOR.svg",
			modelBrand: "META",
			embedding: false,
			link: "https://huggingface.co/meta-llama/Llama-3.1-8B-Instruct",
			description:
				"Meta's efficient Llama 3.1 8B model for chat, instruction following, and general text generation.",
			formConfig: {
				fieldOverrides: [
					{
						key: "CONTEXT_WINDOW",
						patch: { default: 128000 },
					},
				],
			},
		},
		{
			name: "Mosaic ML",
			display: "Mosaic ML",
			icon: "/src/assets/img/MOSAIC.png",
			modelBrand: "MOSAIC_ML",
			embedding: false,
			link: "https://huggingface.co/mosaicml/mpt-7b",
			description:
				"MosaicML's open-source MPT model for efficient training and deployment of language tasks.",
			formConfig: {
				fieldOverrides: [
					{
						key: "CONTEXT_WINDOW",
						patch: { default: 2048 },
					},
				],
			},
		},
		{
			name: "Replit code model – 3b",
			display: "Replit code model – 3b",
			icon: "/src/assets/img/REPLIT_CODE.png",
			modelBrand: "REPLIT_CODE_MODEL",
			embedding: false,
			link: "https://huggingface.co/replit/replit-code-v1-3b",
			description:
				"Replit's code-specialized model for code completion, generation, and programming assistance.",
			formConfig: {
				fieldOverrides: [
					{
						key: "CONTEXT_WINDOW",
						patch: { default: 2048 },
					},
				],
			},
		},
		{
			name: "other-self-hosted-model",
			display: "Other Self Hosted Model",
			icon: "/src/assets/img/HUGGINGFACE_COLOR.svg",
			modelBrand: "HUGGINGFACE",
			embedding: false,
			link: "https://platform.openai.com/docs/models",
			description:
				"Configure any OpenAI-compatible/self-hosted model not listed above with your own model name and init script.",
			formConfig: OTHER_MODEL_FORM_CONFIG_BY_PROVIDER["Self Hosted"],
		},
		{
			name: "other-self-hosted-embedding-model",
			display: "Other Self Hosted Embedding Model",
			icon: "/src/assets/img/HUGGINGFACE_COLOR.svg",
			modelBrand: "HUGGINGFACE",
			embedding: true,
			link: "https://platform.openai.com/docs/guides/embeddings",
			description:
				"Configure any OpenAI-compatible embedding model by providing your model name and endpoint.",
			formConfig: {
				fieldOverrides: [
					{
						key: "MODEL_TYPE",
						patch: {
							default: "TEXT_GENERATION",
							value: "TEXT_GENERATION",
						},
					},
					{
						key: "MODEL",
						patch: { default: "", value: "", disabled: false },
					},
					{
						key: "DEPLOYMENT_TYPE",
						patch: {
							options: ["TGI"],
							default: "TGI",
							value: "TGI",
							disabled: true,
						},
					},
				],
				appendFields: [
					{
						insertAfterKey: "MODEL",
						field: {
							key: "VAR_NAME",
							label: "Variable Name",
							type: "hidden",
							required: true,
							disabled: true,
							default: "myModel",
							value: "myModel",
							category: "General",
						},
					},
					{
						insertAfterKey: "KEEP_INPUT_OUTPUT",
						field: {
							key: "INIT_MODEL_ENGINE",
							label: "Init Script",
							type: "text",
							required: true,
							disabled: false,
							default:
								"import genai_client;${VAR_NAME} = genai_client.TextEmbeddingsInference(model_name='${MODEL}', endpoint = '${ENDPOINT}')",
							category: "Settings",
						},
					},
				],
			},
		},
	],
	Perplexity: [
		{
			name: "sonar",
			display: "Sonar",
			icon: "/src/assets/img/PERPLEXITY.svg",
			modelBrand: "PERPLEXITY",
			embedding: false,
			link: "https://docs.perplexity.ai/models/model-cards",
			description:
				"Perplexity's core Sonar model for fast, grounded conversational responses with web-aware context.",
			formConfig: withModelTokenLimits(undefined, 128000, 128000),
		},
		{
			name: "sonar-pro",
			display: "Sonar Pro",
			icon: "/src/assets/img/PERPLEXITY.svg",
			modelBrand: "PERPLEXITY",
			embedding: false,
			link: "https://docs.perplexity.ai/models/model-cards",
			description:
				"Higher-capability Sonar variant tuned for stronger instruction-following and more complex chat workloads.",
			formConfig: withModelTokenLimits(undefined, 128000, 200000),
		},
		{
			name: "sonar-reasoning-pro",
			display: "Sonar Reasoning Pro",
			icon: "/src/assets/img/PERPLEXITY.svg",
			modelBrand: "PERPLEXITY",
			embedding: false,
			link: "https://docs.perplexity.ai/models/model-cards",
			description:
				"Reasoning-optimized Sonar model for multi-step problem solving and analytical question answering.",
			formConfig: withModelTokenLimits(undefined, 128000, 128000),
		},
		{
			name: "sonar-deep-research",
			display: "Sonar Deep Research",
			icon: "/src/assets/img/PERPLEXITY.svg",
			modelBrand: "PERPLEXITY",
			embedding: false,
			link: "https://docs.perplexity.ai/models/model-cards",
			description:
				"Research-focused Sonar model designed for deeper synthesis across multiple sources and longer analyses.",
			formConfig: withModelTokenLimits(undefined, 128000, 128000),
		},
		{
			name: "other-perplexity-model",
			display: "Other Perplexity Model",
			icon: "/src/assets/img/PERPLEXITY.svg",
			modelBrand: "PERPLEXITY",
			embedding: false,
			link: "https://docs.perplexity.ai/models/model-cards",
			description:
				"Configure any Perplexity model not listed above with a custom model ID while keeping the fixed Perplexity endpoint.",
			formConfig: OTHER_MODEL_FORM_CONFIG_BY_PROVIDER.Perplexity,
		},
	],
};

export const Custom_Model_Image = [
	{ name: "OpenAI", imgURL: "/src/assets/img/OPEN_AI.svg" },
	{ name: "Google Gemini", imgURL: "/src/assets/img/GEMINI_COLOR.svg" },
	{ name: "Azure OpenAI", imgURL: "/src/assets/img/AZURE_OPEN_AI.svg" },
	{ name: "Anthropic", imgURL: "/src/assets/img/CLAUDE_AI.svg" },
	{ name: "AWS Bedrock", imgURL: "/src/assets/img/BEDROCK.svg" },
	{ name: "NVIDIA NIM", imgURL: "/src/assets/img/NEMO.png" },
	{
		name: "Self Hosted",
		imgURL: "/src/assets/img/HUGGINGFACE_COLOR.svg",
	},
	{ name: "Perplexity", imgURL: "/src/assets/img/PERPLEXITY.svg" },
	{ name: "Embedded", imgURL: "/src/assets/img/OPEN_AI.svg" },
];
