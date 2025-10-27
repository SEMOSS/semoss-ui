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
							type: "text",
							required: true,
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
							key: "INIT_MODEL_ENGINE",
							label: "Init Script",
							type: "text",
							required: false,
							default:
								"import genai_client;${VAR_NAME} = genai_client.OpenAiClient(model_name = '${MODEL}', api_key = '${OPEN_AI_KEY}', chat_type = '${CHAT_TYPE}')",
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
							default: "false",
							category: "Settings",
						},
						{
							key: "KEEP_CONVERSATION_HISTORY",
							label: "Keep Conversation History",
							type: "select",
							options: ["true", "false"],
							required: true,
							default: "false",
							category: "Settings",
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
							category: "General",
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
							type: "select",
							options: ["text-embedding-ada-002"],
							required: true,
							default: "text-embedding-ada-002",
							category: "General",
						},
						{
							key: "OPEN_AI_KEY",
							label: "Azure Open AI API Key",
							type: "password",
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
								"import genai_client;${VAR_NAME} = genai_client.OpenAiClient(model_name = '${MODEL}', api_key = '${OPEN_AI_KEY}', chat_type = '${CHAT_TYPE}')",
							category: "Settings",
						},
						{
							key: "KEEP_INPUT_OUTPUT",
							label: "Record Questions and Responses",
							type: "select",
							options: ["true", "false"],
							required: true,
							default: "false",
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
							key: "DEPLOYMENT_NAME",
							label: "Deployment Name",
							type: "text",
							required: true,
							category: "Credentials",
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
							type: "text",
							required: true,
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
							key: "INIT_MODEL_ENGINE",
							label: "Init Script",
							type: "text",
							required: false,
							default:
								"import genai_client;${VAR_NAME} = genai_client.AzureOpenAiClient(api_key = '${OPEN_AI_KEY}', endpoint = '${ENDPOINT}', model_name = '${MODEL}', chat_type = '${CHAT_TYPE}')",
							category: "Settings",
						},
						{
							key: "KEEP_INPUT_OUTPUT",
							label: "Record Questions and Responses",
							type: "select",
							options: ["true", "false"],
							required: false,
							default: "false",
							category: "Settings",
						},
						{
							key: "KEEP_CONVERSATION_HISTORY",
							label: "Keep Conversation History",
							type: "select",
							options: ["true", "false"],
							required: false,
							default: "false",
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
				{
					model_types: ["embedding"],
					fields: [
						{
							key: "CATALOG_NAME",
							label: "Catalog Name",
							type: "text",
							required: true,
							category: "General",
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
							key: "CATALOG_NAME",
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
							required: false,
							default: "false",
							category: "Settings",
						},
						{
							key: "KEEP_CONVERSATION_HISTORY",
							label: "Keep Conversation History",
							type: "select",
							options: ["true", "false"],
							required: false,
							default: "false",
							category: "Settings",
						},
					],
					advanced: [],
				},
				{
					model_types: ["embedding"],
					fields: [
						{
							key: "CATALOG_NAME",
							label: "Catalog Name",
							type: "text",
							required: true,
							category: "General",
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
							type: "select",
							options: ["text-embedding-ada-002"],
							required: true,
							default: "text-embedding-ada-002",
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
								"import genai_client;${VAR_NAME} = genai_client.BedrockClient(modelId = '${MODEL}', secret_key = '${AWS_SECRET_KEY}', access_key = '${AWS_ACCESS_KEY}', region='${AWS_REGION}')",
							category: "Settings",
						},
						{
							key: "KEEP_INPUT_OUTPUT",
							label: "Record Questions and Responses",
							type: "select",
							options: ["true", "false"],
							required: true,
							default: "false",
							category: "Settings",
						},
						{
							key: "KEEP_CONVERSATION_HISTORY",
							label: "Keep Conversation History",
							type: "select",
							options: ["true", "false"],
							required: true,
							default: "false",
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
							key: "CATALOG_NAME",
							label: "Catalog Name",
							type: "text",
							required: true,
							category: "General",
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
							key: "GCP_REGION",
							label: "GCP Region",
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
							key: "INIT_MODEL_ENGINE",
							label: "Init Script",
							type: "text",
							required: true,
							default:
								"import genai_client;${VAR_NAME} = genai_client.VertexClient(model_name = '${MODEL}', service_account_key_file = '${SERVICE_ACCOUNT_FILE}', region='${GCP_REGION}', chat_type='${CHAT_TYPE}')",
							category: "Settings",
						},
						{
							key: "KEEP_INPUT_OUTPUT",
							label: "Record Questions and Responses",
							type: "select",
							options: ["true", "false"],
							required: true,
							default: "false",
							category: "Settings",
						},
						{
							key: "KEEP_CONVERSATION_HISTORY",
							label: "Keep Conversation History",
							type: "select",
							options: ["true", "false"],
							required: true,
							default: "false",
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
				{
					model_types: ["embedding"],
					fields: [
						{
							key: "CATALOG_NAME",
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
							key: "CATALOG_NAME",
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
							type: "text",
							required: true,
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
							required: false,
							default: "false",
							category: "Settings",
						},
						{
							key: "KEEP_CONVERSATION_HISTORY",
							label: "Keep Conversation History",
							type: "select",
							options: ["true", "false"],
							required: false,
							default: "false",
							category: "Settings",
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
							category: "General",
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
							key: "CATALOG_NAME",
							label: "Catalog Name",
							type: "text",
							required: true,
							category: "General",
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
							key: "MODEL",
							label: "Model Name",
							type: "text",
							required: true,
							category: "General",
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
							required: false,
							default: "false",
							category: "Settings",
						},
						{
							key: "KEEP_CONVERSATION_HISTORY",
							label: "Keep Conversation History",
							type: "select",
							options: ["true", "false"],
							required: false,
							default: "false",
							category: "Settings",
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
							category: "General",
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
			name: "azure-open-ai-ada-embedder",
			display: "Azure Open AI ADA Embedding",
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
			icon: "/src/assets/img/VERTEX_AI.png",
			embedding: false,
		},
		{
			name: "palm-chat-bison",
			display: "Palm Chat Bison",
			icon: "/src/assets/img/VERTEX_AI.png",
			embedding: false,
		},
		{
			name: "palm-code-bison",
			display: "Palm Code Bison",
			icon: "/src/assets/img/VERTEX_AI.png",
			embedding: false,
		},
		{
			name: "gemini",
			display: "Gemini",
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
};

export const Custom_Model_Image = [
	{ name: "OpenAI", imgURL: "/src/assets/img/OPEN_AI.png" },
	{ name: "Azure OpenAI", imgURL: "/src/assets/img/OPEN_AI.png" },
	{ name: "AWS Bedrock", imgURL: "/src/assets/img/CLAUDE_AI.png" },
	{ name: "Google Vertex AI", imgURL: "/src/assets/img/VERTEX_AI.png" },
	{ name: "NVIDIA NIM", imgURL: "/src/assets/img/NEMO.png" },
	{ name: "OpenAI-Compatible", imgURL: "/src/assets/img/OPEN_AI.png" },
];
