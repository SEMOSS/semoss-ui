// Removed unused import (was: import { link } from "fs");

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

// TODO: Move to backend and fetch via API
export const IMPORTABLE_MODELS = {
	categoryTexts: {
		OpenAI: {
			General:
				"Choose between hosted OpenAI services for managed reliability, or custom-deployed environments for greater control over API usage and performance.",
			Settings:
				"Configure your model type, deployment parameters, and response behavior to align with your specific OpenAI integration.",
			Credentials:
				"Enter your OpenAI API key to securely authenticate and enable access to the OpenAI endpoints.",
		},
		"Azure OpenAI": {
			General:
				"Connect your Azure OpenAI instance for enterprise-grade security, scalability, and integration within the Azure ecosystem.",
			Settings:
				"Provide your Azure resource name, deployment ID, and API version to configure the Azure OpenAI endpoint correctly.",
			Credentials:
				"Enter your Azure API key and endpoint URL to securely authenticate your Azure OpenAI connection.",
		},
		"AWS Bedrock": {
			General:
				"Use AWS Bedrock to access and deploy foundational models with full AWS ecosystem integration and managed security.",
			Settings:
				"Specify your AWS region, model ID, and inference configuration parameters to customize model behavior and performance.",
			Credentials:
				"Enter your AWS access key, secret key, and session token (if required) to securely authenticate with AWS Bedrock.",
		},
		"Google Vertex AI": {
			General:
				"Integrate with Google Vertex AI for scalable, production-ready machine learning workflows with Google Cloud infrastructure.",
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
		"OpenAI-Compatible": {
			General:
				"Integrate with any OpenAI-compatible API endpoint for self-hosted or third-party model services.",
			Settings:
				"Define your base URL, model route, and API parameters to ensure compatibility with OpenAI’s API schema.",
			Credentials:
				"Enter your API key or authentication header details to securely connect with the compatible API service.",
		},
	},

	providers: [
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
							type: "select",
							options: ["Open_AI"],
							disabled: true,
							required: true,
							default: "Open_AI",
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
							key: "MODEL",
							label: "Model",
							type: "text",
							required: true,
							value: "gpt-3.5-turbo",
							category: "General",
						},
						{
							key: "VAR_NAME",
							label: "Variable Name",
							type: "hidden",
							required: true,
							value: "openAIModel",
							category: "General",
						},
						{
							key: "CHAT_TYPE",
							label: "Chat Type",
							type: "select",
							options: [
								"chat-completion",
								"completion",
								"responses",
							],
							required: true,
							default: "chat-completion",
							category: "General",
						},
						{
							key: "MAX_TOKENS",
							label: "Max Completion Tokens",
							type: "number",
							required: false,
							category: "Settings",
						},
						{
							key: "MAX_INPUT_TOKENS",
							label: "Max Input Tokens",
							type: "number",
							required: false,
							category: "Settings",
						},
						{
							key: "CONTEXT_WINDOW",
							label: "Context Window",
							type: "number",
							required: true,
							default: 2048,
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
							required: false,
							disabled: true,
							default:
								"import genai_client;${VAR_NAME} = genai_client.OpenAiClient(model_name = '${MODEL}', api_key = '${OPEN_AI_KEY}', chat_type = '${CHAT_TYPE}', contextWindow=${CONTEXT_WINDOW})",
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
							type: "select",
							options: ["Open_AI"],
							required: true,
							default: "Open_AI",
							category: "General",
						},
						{
							key: "MODEL",
							label: "Model",
							type: "text",
							required: true,
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
							key: "VAR_NAME",
							label: "Variable Name",
							type: "text",
							required: true,
							value: "openAIEmbedderModel",
							category: "General",
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
							required: false,
							category: "Settings",
						},
						{
							key: "MAX_INPUT_TOKENS",
							label: "Max Input Tokens",
							type: "number",
							required: false,
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
								custom: {
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
							type: "select",
							options: ["Open_AI"],
							required: true,
							default: "Open_AI",
							category: "General",
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
							key: "MODEL",
							label: "Model",
							type: "text",
							required: true,
							value: "gpt-3.5-turbo",
							category: "General",
						},
						{
							key: "VAR_NAME",
							label: "Variable Name",
							type: "hidden",
							required: true,
							value: "azureOpenAIModel",
							category: "General",
						},
						{
							key: "CHAT_TYPE",
							label: "Chat Type",
							type: "select",
							options: [
								"chat-completion",
								"completion",
								"responses",
							],
							required: true,
							default: "chat-completion",
							category: "General",
						},
						{
							key: "INIT_MODEL_ENGINE",
							label: "Init Script",
							type: "text",
							required: false,
							default:
								"import genai_client;${VAR_NAME} = genai_client.AzureOpenAiClient(api_key = '${OPEN_AI_KEY}', endpoint = '${ENDPOINT}', model_name = '${MODEL}', chat_type = '${CHAT_TYPE}', api_version = '${API_VERSION}')",
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
							key: "MAX_TOKENS",
							label: "Max Completion Tokens",
							type: "number",
							required: false,
							category: "Settings",
						},
						{
							key: "MAX_INPUT_TOKENS",
							label: "Max Input Tokens",
							type: "number",
							required: false,
							category: "Settings",
						},
						{
							key: "CONTEXT_WINDOW",
							label: "Context Window",
							type: "number",
							required: false,
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
								required: true,
								pattern: {
									value: /^[\w\-\s]+$/,
									message:
										"Catalog names can only contain alphanumeric characters and dashes.",
								},
								custom: {
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
							type: "select",
							options: ["Open_AI"],
							required: true,
							default: "Open_AI",
							category: "General",
						},
						{
							key: "AI_MODEL",
							label: "AI Model",
							type: "select",
							options: ["text-embedding-ada-002"],
							required: true,
							default: "text-embedding-ada-002",
							category: "General",
							disabled: false,
						},
						{
							key: "OPEN_AI_KEY",
							label: "Azure Open AI API Key",
							type: "password",
							required: true,
							category: "Credentials",
						},
						{
							key: "ENDPOINT",
							label: "Azure Endpoint",
							type: "url",
							category: "Credentials",
							required: true,
						},
						{
							key: "API_VERSION",
							label: "API version",
							type: "text",
							required: true,
							category: "Credentials",
						},
						{
							key: "VAR_NAME",
							label: "Variable Name",
							type: "text",
							required: true,
							category: "General",
						},
						{
							key: "INIT_MODEL_ENGINE",
							label: "Init Script",
							type: "text",
							required: true,
							default:
								"from genai_client import AzureOpenAiEmbedder;${VAR_NAME} = AzureOpenAiEmbedder(model_name = '${MODEL}', endpoint = '${ENDPOINT}', api_key = '${OPEN_AI_KEY}', api_version = '${API_VERSION}')",
							category: "Settings",
						},
						{
							key: "MAX_TOKENS",
							label: "Max Tokens",
							type: "number",
							required: true,
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
								required: true,
								pattern: {
									value: /^[\w\-\s]+$/,
									message:
										"Catalog names can only contain alphanumeric characters and dashes.",
								},
								custom: {
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
							required: true,
							value: "BEDROCK",
							category: "General",
						},
						{
							key: "AWS_ACCESS_KEY",
							label: "AWS Access Key ID",
							type: "password",
							required: false,
							category: "Credentials",
						},
						{
							key: "AWS_SECRET_KEY",
							label: "AWS Secret Access Key",
							type: "password",
							required: false,
							category: "Credentials",
						},
						{
							key: "AWS_REGION",
							label: "Region",
							type: "text",
							required: true,
							category: "Credentials",
						},
						{
							key: "MODEL",
							label: "Model ID",
							type: "text",
							required: true,
							category: "General",
						},
						{
							key: "CONTEXT_WINDOW",
							label: "Context Window",
							type: "number",
							required: false,
							category: "Settings",
						},
						{
							key: "MAX_TOKENS",
							label: "Max Completion Tokens",
							type: "number",
							required: false,
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
							key: "VAR_NAME",
							label: "Variable Name",
							type: "hidden",
							required: true,
							value: "awsBedrockModel",
							category: "General",
						},
						{
							key: "INIT_MODEL_ENGINE",
							label: "Init Script",
							type: "text",
							required: true,
							default:
								"import genai_client;${VAR_NAME} = genai_client.BedrockClient(modelId = '${MODEL}', secret_key = '${AWS_SECRET_KEY}', access_key = '${AWS_ACCESS_KEY}', region='${AWS_REGION}')",
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
								required: true,
								pattern: {
									value: /^[\w\-\s]+$/,
									message:
										"Catalog names can only contain alphanumeric characters and dashes.",
								},
								custom: {
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
							type: "select",
							options: ["Bedrock"],
							required: true,
							default: "Bedrock",
							category: "General",
						},
						{
							key: "MODEL",
							label: "Model",
							type: "text",
							required: true,
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
							key: "VAR_NAME",
							label: "Variable Name",
							type: "hidden",
							required: true,
							value: "awsBedrockModel",
							category: "General",
						},
						{
							key: "INIT_MODEL_ENGINE",
							label: "Init Script",
							type: "text",
							required: true,
							default:
								"import genai_client;${VAR_NAME} = genai_client.BedrockClient(modelId = '${MODEL}', secret_key = '${AWS_SECRET_KEY}', access_key = '${AWS_ACCESS_KEY}', region='${AWS_REGION}')",
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
							key: "MAX_TOKENS",
							label: "Max Completion Tokens",
							type: "number",
							required: false,
							category: "Settings",
						},
						{
							key: "MAX_INPUT_TOKENS",
							label: "Max Input Tokens",
							type: "number",
							required: false,
							category: "Settings",
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
								custom: {
									value: 'CheckEngineName ( "[VALUE]") ;',
									message:
										"This Catalog name has already been used, please try another.",
								},
							},
						},
						{
							key: "MODEL_TYPE",
							label: "Type",
							type: "select",
							options: ["VERTEX"],
							required: true,
							disabled: true,
							default: "VERTEX",
							category: "General",
						},
						{
							key: "MODEL",
							label: "Model",
							type: "text",
							required: true,
							category: "General",
						},
						{
							key: "MODEL_TYPE",
							label: "Model Type",
							type: "select",
							options: ["Open_AI"],
							required: true,
							default: "Open_AI",
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
							key: "VAR_NAME",
							label: "Variable Name",
							type: "hidden",
							required: true,
							value: "googleVertexAIModel",
							category: "General",
						},
						{
							key: "CHAT_TYPE",
							label: "Chat Type",
							type: "select",
							options: [
								"chat",
								"code",
								"codechat",
								"generative",
								"text",
							],
							required: true,
							default: "text",
							category: "General",
						},
						{
							key: "SERVICE_ACCOUNT_CREDENTIALS",
							label: "Service Account Credentials",
							type: "text",
							required: false,
							category: "Settings",
						},
						{
							key: "INIT_MODEL_ENGINE",
							label: "Init Script",
							type: "text",
							required: true,
							default:
								"import genai_client;${VAR_NAME} = genai_client.VertexClient(model_name = '${MODEL}', service_account_key_file = '${SERVICE_ACCOUNT_FILE}', region='${GCP_REGION}', chat_type='${CHAT_TYPE}', project='${PROJECT}')",
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
							key: "MAX_TOKENS",
							label: "Max Completion Tokens",
							type: "number",
							required: false,
							category: "Settings",
						},
						{
							key: "MAX_INPUT_TOKENS",
							label: "Max Input Tokens",
							type: "number",
							required: false,
							category: "Settings",
						},
						{
							key: "CONTEXT_WINDOW",
							label: "Context Window",
							type: "number",
							required: false,
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
								required: true,
								pattern: {
									value: /^[\w\-\s]+$/,
									message:
										"Catalog names can only contain alphanumeric characters and dashes.",
								},
								custom: {
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
							required: true,
							value: "VERTEX",
							category: "General",
						},
						{
							key: "PROJECT_ID",
							label: "Project ID",
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
							key: "SERVICE_ACCOUNT_JSON",
							label: "Service Account (JSON)",
							type: "textarea",
							required: true,
							category: "Credentials",
						},
						{
							key: "MODEL",
							label: "Model Name",
							type: "text",
							required: true,
							category: "General",
						},
						{
							key: "KEEP_INPUT_OUTPUT",
							label: "Record Text to Embed",
							type: "boolean",
							required: false,
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
								required: true,
								pattern: {
									value: /^[\w\-\s]+$/,
									message:
										"Catalog names can only contain alphanumeric characters and dashes.",
								},
								custom: {
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
							required: true,
							value: "OPEN_AI",
							category: "General",
						},
						{
							key: "OPEN_AI_KEY",
							label: "OPEN AI Key",
							type: "password",
							required: true,
							category: "Credentials",
						},
						{
							key: "MODEL",
							label: "Model Name",
							type: "text",
							required: true,
							value: "mistralai/mixtral-8x7b-instruct-v0.1",
							category: "General",
						},
						{
							key: "VAR_NAME",
							label: "Variable Name",
							type: "hidden",
							required: true,
							value: "nvidiaNimModel",
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
							key: "INIT_MODEL_ENGINE",
							label: "Init Script",
							type: "text",
							category: "Settings",
							default:
								"import genai_client;${VAR_NAME} = genai_client.OpenAiClient(endpoint = 'https://integrate.api.nvidia.com/v1', model_name='${MODEL_TYPE}', chat_type = '${CHAT_TYPE}', api_key='${OPEN_AI_KEY}', template={ \"mixtral.default.nocontext\":\"[INST] $question [/INST]\"},  template_name='mixtral.default.nocontext')",
							required: false,
						},
						{
							key: "MAX_TOKENS",
							label: "Max Completion Tokens",
							type: "number",
							required: false,
							category: "Settings",
						},
						{
							key: "MAX_INPUT_TOKENS",
							label: "Max Input Tokens",
							type: "number",
							required: false,
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
							key: "CONTEXT_WINDOW",
							label: "Context Window",
							type: "number",
							required: false,
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
								required: true,
								pattern: {
									value: /^[\w\-\s]+$/,
									message:
										"Catalog names can only contain alphanumeric characters and dashes.",
								},
								custom: {
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
							required: true,
							value: "OPEN_AI",
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
							key: "MODEL",
							label: "Model Name",
							type: "text",
							required: true,
							category: "General",
						},
						{
							key: "KEEP_INPUT_OUTPUT",
							label: "Record Text to Embed",
							type: "boolean",
							required: false,
							category: "Settings",
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
								custom: {
									value: 'CheckEngineName ( "[VALUE]") ;',
									message:
										"This Catalog name has already been used, please try another.",
								},
							},
						},
						{
							key: "MODEL_TYPE",
							label: "Model Type",
							type: "select",
							required: true,
							options: ["TEXT_GENERATION", "FAST_CHAT"],
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
							required: true,
							category: "General",
						},
						{
							key: "VAR_NAME",
							label: "Variable Name",
							type: "hidden",
							required: true,
							value: "compatabileOpenAIModel",
							category: "General",
						},
						{
							key: "INIT_MODEL_ENGINE",
							label: "Init Script",
							type: "text",
							required: false,
							default: "",
							category: "Settings",
						},
						{
							key: "MAX_TOKENS",
							label: "Max Completion Tokens",
							type: "number",
							required: false,
							category: "Settings",
						},
						{
							key: "MAX_INPUT_TOKENS",
							label: "Max Input Tokens",
							type: "number",
							required: false,
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
							key: "CONTEXT_WINDOW",
							label: "Context Window",
							type: "number",
							required: false,
							category: "Settings",
						},
						{
							key: "INIT_MODEL_ENGINE",
							label: "Init Script",
							type: "text",
							required: false,
							default:
								"import genai_client;${VAR_NAME} = genai_client.OpenAiClient(model_name = '${MODEL}', api_key = '${OPEN_AI_KEY}', deployment_type = '${DEPLOYMENT_TYPE}')",
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
								required: true,
								pattern: {
									value: /^[\w\-\s]+$/,
									message:
										"Catalog names can only contain alphanumeric characters and dashes.",
								},
								custom: {
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
							required: true,
							value: "OPEN_AI",
							category: "General",
						},
						{
							key: "API_KEY",
							label: "API Key",
							type: "password",
							required: false,
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
							key: "MODEL",
							label: "Model Name",
							type: "text",
							required: true,
							category: "General",
						},
						{
							key: "KEEP_INPUT_OUTPUT",
							label: "Record Text to Embed",
							type: "boolean",
							required: false,
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
							required: true,
							value: "EMBEDDED",
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
							key: "MODEL",
							label: "Model Name",
							type: "text",
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
							value: "embeddedModel",
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
							key: "INIT_MODEL_ENGINE",
							label: "Init Script",
							type: "text",
							category: "Settings",
							default:
								"import genai_client;${VAR_NAME} = genai_client.OpenAiClient(endpoint = 'https://integrate.api.nvidia.com/v1', model_name='${MODEL_TYPE}', chat_type = '${CHAT_TYPE}', api_key='${OPEN_AI_KEY}', template={ \"mixtral.default.nocontext\":\"[INST] $question [/INST]\"},  template_name='mixtral.default.nocontext')",
							required: false,
						},
						{
							key: "MAX_TOKENS",
							label: "Max Completion Tokens",
							type: "number",
							required: false,
							category: "Settings",
						},
						{
							key: "MAX_INPUT_TOKENS",
							label: "Max Input Tokens",
							type: "number",
							required: false,
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
							key: "CONTEXT_WINDOW",
							label: "Context Window",
							type: "number",
							required: false,
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
								required: true,
								pattern: {
									value: /^[\w\-\s]+$/,
									message:
										"Catalog names can only contain alphanumeric characters and dashes.",
								},
								custom: {
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
							required: true,
							value: "OPEN_AI",
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
							key: "MODEL",
							label: "Model Name",
							type: "text",
							required: true,
							category: "General",
						},
						{
							key: "KEEP_INPUT_OUTPUT",
							label: "Record Text to Embed",
							type: "boolean",
							required: false,
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
export const MODEL_VERSIONS = {
	OpenAI: [
		{
			name: "gpt-5",
			display: "GPT-5",
			icon: "/src/assets/img/OPEN_AI.png",
			description:
				"Previous intelligent reasoning model for coding and agentic tasks with configurable reasoning effort.",
			link: "https://platform.openai.com/docs/models/gpt-5",
		},
		{
			name: "gpt-5.1",
			display: "GPT-5.1",
			icon: "/src/assets/img/OPEN_AI.png",
			description:
				"The best model for coding and agentic tasks with configurable reasoning effort.",
			link: "https://platform.openai.com/docs/models/gpt-5.1",
		},
		{
			name: "gpt-5-mini",
			display: "GPT-5 Mini",
			icon: "/src/assets/img/OPEN_AI.png",
			description:
				"A faster, cost-efficient GPT-5 variant optimized for well-defined tasks and precise prompts.",
			link: "https://platform.openai.com/docs/models/gpt-5-mini",
		},
		{
			name: "gpt-5-nano",
			display: "GPT-5 nano",
			icon: "/src/assets/img/OPEN_AI.png",
			description:
				"Fastest, most cost-efficient GPT-5 variant ideal for high-volume summarization and classification.",
			link: "https://platform.openai.com/docs/models/gpt-5-nano",
		},
		{
			name: "gpt-4",
			display: "GPT 4",
			icon: "/src/assets/img/OPEN_AI.png",
			description:
				"Older high-intelligence GPT model still available for Chat Completions.",
			link: "https://platform.openai.com/docs/models/gpt-4",
		},
		{
			name: "gpt-3.5-Turbo",
			display: "GPT 3.5 Turbo",
			icon: "/src/assets/img/OPEN_AI.png",
			description:
				"Legacy GPT model for economical natural language and code generation across chat and non-chat tasks.",
			link: "https://platform.openai.com/docs/models/gpt-3.5-turbo",
		},
		{
			name: "gpt-4o",
			display: "GPT-4o",
			icon: "/src/assets/img/OPEN_AI.png",
			description: "Fast, intelligent, flexible GPT model",
			link: "https://platform.openai.com/docs/models/gpt-4o",
		},
		{
			name: "dall-e-3",
			display: "DALL E 3",
			icon: "/src/assets/img/OPEN_AI.png",
			description:
				"Previous generation image model that creates new images from natural language prompts in specified sizes.",
			link: "https://platform.openai.com/docs/models/dall-e-3",
		},
		{
			name: "dall-e-2",
			display: "DALL E 2",
			icon: "/src/assets/img/OPEN_AI.png",
			description:
				"Earlier image generation model offering more granular prompt control and higher parallel request throughput.",
			link: "https://platform.openai.com/docs/models/dall-e-2",
		},
		{
			name: "gpt-audio",
			display: "gpt-audio",
			icon: "/src/assets/img/OPEN_AI.png",
			audio: true,
			disable: true,
			description:
				"First generally available GPT audio model supporting audio input and output via Chat Completions.",
			link: "https://platform.openai.com/docs/models/gpt-audio",
		},
		{
			name: "gpt-image-1",
			display: "GPT Image 1",
			icon: "/src/assets/img/OPEN_AI.png",
			image: true,
			disable: true,
			description:
				"State-of-the-art multimodal image generation model accepting text and image inputs to produce images.",
			link: "https://platform.openai.com/docs/models/gpt-image-1",
		},
		{
			name: "text-davinci",
			display: "Text Davinci",
			icon: "/src/assets/img/OPEN_AI.png",
			embedding: true,
			description:
				"Deprecated high-capacity GPT-3 family text model retained for compatibility with older completions workflows.",
			link: "https://platform.openai.com/docs/models/text-davinci",
		},
		{
			name: "text-embedding-3-large",
			display: "text-embedding-3-large",
			icon: "/src/assets/img/OPEN_AI.png",
			embedding: true,
			description:
				"Most capable multilingual embedding model for semantic search, clustering, recommendations, anomaly detection, and classification.",
			link: "https://platform.openai.com/docs/models/text-embedding-3-large",
		},
		{
			name: "text-embedding-3-small",
			display: "text-embedding-3-small",
			icon: "/src/assets/img/OPEN_AI.png",
			embedding: true,
			description:
				"Smaller, cost-efficient embedding model for semantic similarity, search, and lightweight classification tasks.",
			link: "https://platform.openai.com/docs/models/text-embedding-3-small",
		},
	],
	"Azure OpenAI": [
		{
			name: "azure-openai",
			display: "Azure Open AI",
			icon: "/src/assets/img/OPEN_AI.png",
			embedding: false,
			link: "https://learn.microsoft.com/azure/ai-services/openai/concepts/models",
		},
		{
			name: "azure-open-ai-ada-embedder",
			display: "Azure Open AI ADA Embedding",
			icon: "/src/assets/img/OPEN_AI.png",
			embedding: true,
			link: "https://learn.microsoft.com/azure/ai-services/openai/concepts/models#embeddings",
		},
	],
	"AWS Bedrock": [
		{
			name: "anthropic.claude-3-opus-20240229-v1:0",
			display: "Claude 3 Opus",
			icon: "/src/assets/img/CLAUDE_AI.png",
			embedding: false,
			link: "https://docs.anthropic.com/en/docs/models-overview",
		},
		{
			name: "anthropic.claude-3-sonnet-20240229-v1:0",
			display: "Claude 3 Sonnet",
			icon: "/src/assets/img/CLAUDE_AI.png",
			embedding: false,
		},
		{
			name: "anthropic.claude-3-haiku-20240307-v1:0",
			display: "Claude 3 Haiku",
			icon: "/src/assets/img/CLAUDE_AI.png",
			embedding: false,
		},
		{
			name: "anthropic.claude-v2",
			display: "Claude 2.0",
			icon: "/src/assets/img/CLAUDE_AI.png",
			embedding: false,
		},

		{
			name: "ai21.j2-ultra-v1",
			display: "Jurassic-2 Ultra",
			icon: "/src/assets/img/CLAUDE_AI.png",
			embedding: false,
		},
		{
			name: "ai21.j2-mid-v1",
			display: "Jurassic-2 Mid",
			icon: "/src/assets/img/CLAUDE_AI.png",
			embedding: false,
		},

		{
			name: "amazon.titan-text-express-v1",
			display: "Titan Text G1 Express",
			icon: "/src/assets/img/CLAUDE_AI.png",
			embedding: false,
		},
		{
			name: "amazon.titan-text-lite-v1",
			display: "Titan Text Lite",
			icon: "/src/assets/img/CLAUDE_AI.png",
			embedding: false,
		},
		{
			name: "amazon.titan-embed-text-v1",
			display: "Titan Embeddings (text)",
			icon: "/src/assets/img/CLAUDE_AI.png",
			embedding: true,
		},
	],
	"Google Vertex AI": [
		{
			name: "gemini-2.5-pro",
			display: "Gemini 2.5 Pro",
			icon: "/src/assets/img/VERTEX_AI.png",
			embedding: false,
		},
		{
			name: "gemini-pro",
			display: "Gemini Pro",
			icon: "/src/assets/img/VERTEX_AI.png",
			embedding: false,
		},
		{
			name: "gemini-ultra",
			display: "Gemini Ultra",
			icon: "/src/assets/img/VERTEX_AI.png",
			embedding: false,
		},
		{
			name: "gemma-2b",
			display: "Gemma 2b",
			icon: "/src/assets/img/VERTEX_AI.png",
			embedding: false,
		},
		{
			name: "llama-2-7b",
			display: "Llama 2-7b",
			icon: "/src/assets/img/VERTEX_AI.png",
			embedding: false,
		},
		{
			name: "llama-2-70b",
			display: "Llama 2-70b",
			icon: "/src/assets/img/VERTEX_AI.png",
			embedding: false,
		},
		{
			name: "text-bison",
			display: "PaLM 2 Bison",
			icon: "/src/assets/img/VERTEX_AI.png",
			embedding: false,
		},
		{
			name: "text-bison-32k",
			display: "PaLM 2 Bison (32k)",
			icon: "/src/assets/img/VERTEX_AI.png",
			embedding: false,
		},
		{
			name: "code-bison",
			display: "Code Generation Bison",
			icon: "/src/assets/img/VERTEX_AI.png",
			embedding: false,
		},
		{
			name: "mistral-7b",
			display: "Mistral",
			icon: "/src/assets/img/VERTEX_AI.png",
			embedding: false,
		},
	],
	"NVIDIA NIM": [
		{
			name: "embed-qa-4",
			display: "EMBED QA 4",
			icon: "/src/assets/img/NEMO.png",
			embedding: false,
		},
		{
			name: "rerank-qa-mistral-4b",
			display: "Rerank QA Mistral 4B",
			icon: "/src/assets/img/NEMO.png",
			embedding: false,
		},
	],
	"OpenAI-Compatible": [
		{
			name: "bert",
			display: "Bert",
			icon: "/src/assets/img/BERT.png",
			embedding: false,
		},
		{
			name: "dolly",
			display: "Dolly",
			icon: "/src/assets/img/DOLLY_AI.jpg",
			embedding: false,
		},
		{
			name: "Eleuther GPTJ",
			display: "Eleuther GPTJ",
			icon: "/src/assets/img/ELEUTHER_AI.png",
			embedding: false,
		},
		{
			name: "Falcon",
			display: "Falcon",
			icon: "/src/assets/img/FALCON_AI.png",
			embedding: false,
		},
		{
			name: "Flan T5 Large",
			display: "Flan T5 Large",
			icon: "/src/assets/img/FLAN.jpg",
			embedding: false,
		},
		{
			name: "Flan T5 XXL",
			display: "Flan T5 XXL",
			icon: "/src/assets/img/FLAN.jpg",
			embedding: false,
		},
		{
			name: "Guanaco",
			display: "Guanaco",
			icon: "/src/assets/img/BRAIN.png",
			embedding: false,
		},
		{
			name: "Llama2 7B",
			display: "Llama2 7B",
			icon: "/src/assets/img/META.png",
			embedding: false,
		},
		{
			name: "Llama2 13B",
			display: "Llama2 13B",
			icon: "/src/assets/img/META.png",
			embedding: false,
		},
		{
			name: "Llama2 70B",
			display: "Llama2 70B",
			icon: "/src/assets/img/META.png",
			embedding: false,
		},
		{
			name: "Mosaic ML",
			display: "Mosaic ML",
			icon: "/src/assets/img/MOSAIC.png",
			embedding: false,
		},
		{
			name: "Replit code model – 3b",
			display: "Replit code model – 3b",
			icon: "/src/assets/img/REPLIT_CODE.png",
			embedding: false,
		},
		{
			name: "StableBeluga2",
			display: "StableBeluga2",
			icon: "/src/assets/img/BRAIN.png",
			embedding: false,
		},
		{
			name: "Vicuna",
			display: "Vicuna",
			icon: "/src/assets/img/VICUNA.jpg",
			embedding: false,
		},
		{
			name: "Wizard 13B",
			display: "Wizard 13B",
			icon: "/src/assets/img/BRAIN.png",
			embedding: false,
		},
		{
			name: "Wizard Coder",
			display: "Wizard Coder",
			icon: "/src/assets/img/BRAIN.png",
			embedding: false,
		},
	],
	Embedded: [
		{
			name: "NeMo",
			display: "NeMo",
			icon: "/src/assets/img/NEMO.png",
			embedding: false,
			disable: true,
		},
		{
			name: "Orca",
			display: "Orca",
			icon: "/src/assets/img/ORCA.png",
			embedding: false,
		},
		{
			name: "AWS TITAN TEXT EMBEDDINGS",
			display: "AWS TITAN TEXT EMBEDDINGS",
			icon: "/src/assets/img/Amazon_Titan.png",
			embedding: false,
			disable: true,
		},
		{
			name: "Stablity AI",
			display: "Stablity AI",
			icon: "/src/assets/img/STABILITY_AI.png",
			embedding: false,
			disable: true,
		},
		{
			name: "Replit Code Model",
			display: "Replit Code Model",
			icon: "/src/assets/img/REPLIT_CODE.png",
			embedding: false,
			disable: true,
		},
	],
};

export const Custom_Model_Image = [
	{ name: "OpenAI", imgURL: "/src/assets/img/OPEN_AI.png" },
	{ name: "Azure OpenAI", imgURL: "/src/assets/img/OPEN_AI.png" },
	{ name: "AWS Bedrock", imgURL: "/src/assets/img/CLAUDE_AI.png" },
	{ name: "Google Vertex AI", imgURL: "/src/assets/img/VERTEX_AI.png" },
	{ name: "NVIDIA NIM", imgURL: "/src/assets/img/NEMO.png" },
	{ name: "OpenAI-Compatible", imgURL: "/src/assets/img/OPEN_AI.png" },
	{ name: "Embedded", imgURL: "/src/assets/img/OPEN_AI.png" },
];
