import Amazon_Titan from "@/assets/img/Amazon_Titan.png";
import BERT from "@/assets/img/BERT.png";
import BRAIN from "@/assets/img/BRAIN.png";
import CLAUDE from "@/assets/img/CLAUDE_AI.png";
import DOLLY from "@/assets/img/DOLLY_AI.jpg";
import ELEUTHER from "@/assets/img/ELEUTHER_AI.png";
import FALCON from "@/assets/img/FALCON_AI.png";
import FLAN from "@/assets/img/FLAN.jpg";
import META from "@/assets/img/META.png";
import MOSAIC from "@/assets/img/MOSAIC.png";
import NEMO from "@/assets/img/NEMO.png";
import OPEN_AI from "@/assets/img/OPEN_AI.png";
import AZURE_OPEN_AI from "@/assets/img/OPEN_AI.png";
import ORCA from "@/assets/img/ORCA.png";
import REPLIT from "@/assets/img/REPLIT_CODE.png";
import STABILITY_AI from "@/assets/img/STABILITY_AI.png";
import VERTEX from "@/assets/img/VERTEX_AI.png";
import VICUNA from "@/assets/img/VICUNA.jpg";
import ZIP from "@/assets/img/ZIP.png";

export const MODEL_CONNECTION = {
	MODEL: {
		"Commercially Hosted": [
			{
				OpenAI: [
					{
						name: "GPT-3.5",
						disable: false,
						icon: OPEN_AI,
						fields: [
							{
								fieldName: "NAME",
								label: "Catalog Name",
								defaultValue: "",
								options: {
									component: "text-field",
								},
								disabled: false,
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
								fieldName: "MODEL_TYPE",
								label: "Type",
								defaultValue: "OPEN_AI",
								options: {
									component: "select",
									options: [
										{
											display: "Open AI",
											value: "OPEN_AI",
										},
									],
								},
								disabled: false,
								rules: { required: true },
							},
							{
								fieldName: "OPEN_AI_KEY",
								label: "Open AI Key",
								defaultValue: "",
								options: {
									component: "password",
								},
								disabled: false,
								rules: { required: true },
							},
							{
								fieldName: "MODEL",
								label: "Model",
								defaultValue: "gpt-3.5-turbo",
								options: {
									component: "select",
									options: [
										{
											display: "gpt-3.5-turbo",
											value: "gpt-3.5-turbo",
										},
										{
											display: "gpt-4-32k",
											value: "gpt-4-32k",
										},
									],
								},
								disabled: true,
								hidden: true,
								rules: { required: true },
							},
							{
								fieldName: "VAR_NAME",
								label: "Variable Name",
								defaultValue: "modelVar",
								options: {
									component: "text-field",
								},
								disabled: false,
								advanced: true,
								rules: { required: true },
							},
                            {
								fieldName: "INIT_MODEL_ENGINE",
								label: "Init Script",
								defaultValue:
									"import genai_client;${VAR_NAME} = genai_client.OpenAiClient(model_name = '${MODEL}', api_key = '${OPEN_AI_KEY}', chat_type = '${CHAT_TYPE}')",
								options: {
									component: "text-field",
								},
								disabled: false,
                                advanced: true,							
								rules: { required: true },                                
							},
							{
								fieldName: "CHAT_TYPE",
								label: "Chat Type",
								defaultValue: "chat-completion",
								options: {
									component: "select",
									options: [
										{
											display: "chat-completion",
											value: "chat-completion",
										},
										{
											display: "completion",
											value: "completion",
										},
									],
								},
								disabled: false,
								rules: { required: true },
							},							
							{
								fieldName: "KEEP_CONVERSATION_HISTORY",
								label: "Keep Conversation History",
								defaultValue: "false",
								options: {
									component: "select",
									options: [
										{
											display: "true",
											value: "true",
										},
										{
											display: "false",
											value: "false",
										},
									],
								},
								disabled: false,
								rules: { required: true },
							},
							{
								fieldName: "KEEP_INPUT_OUTPUT",
								label: "Record Questions and Responses",
								defaultValue: "false",
								options: {
									component: "select",
									options: [
										{
											display: "true",
											value: "true",
										},
										{
											display: "false",
											value: "false",
										},
									],
								},
								disabled: false,
								rules: { required: true },
							},
							{
								fieldName: "MAX_TOKENS",
								label: "Max Tokens",
								rules: { required: false },
								defaultValue: "",
								options: {
									component: "text-field",
								},
								disabled: false,
							},
							{
								fieldName: "MAX_INPUT_TOKENS",
								label: "Max Input Tokens",
								rules: { required: false },
								defaultValue: "",
								options: {
									component: "text-field",
								},
								disabled: false,
							},
						],
					},
					{
						name: "GPT-4",
						disable: false,
						icon: OPEN_AI,
						fields: [
							{
								fieldName: "NAME",
								label: "Catalog Name",
								defaultValue: "",
								options: {
									component: "text-field",
								},
								disabled: false,
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
								fieldName: "MODEL_TYPE",
								label: "Type",
								defaultValue: "OPEN_AI",
								options: {
									component: "select",
									options: [
										{
											display: "Open AI",
											value: "OPEN_AI",
										},
									],
								},
								disabled: false,
								rules: { required: true },
							},
							{
								fieldName: "OPEN_AI_KEY",
								label: "Open AI Key",
								defaultValue: "",
								options: {
									component: "password",
								},
								disabled: false,
								rules: { required: true },
							},
							{
								fieldName: "MODEL",
								label: "Model",
								defaultValue: "gpt-4-32k",
								options: {
									component: "select",
									options: [
										{
											display: "gpt-4-32k",
											value: "gpt-4-32k",
										},
									],
								},
								disabled: true,
								hidden: true,
								rules: { required: true },
							},
							{
								fieldName: "VAR_NAME",
								label: "Variable Name",
								defaultValue: "modelVar",
								options: {
									component: "text-field",
								},
								disabled: false,
								rules: { required: true },
							},
							{
								fieldName: "CHAT_TYPE",
								label: "Chat Type",
								defaultValue: "chat-completion",
								options: {
									component: "select",
									options: [
										{
											display: "chat-completion",
											value: "chat-completion",
										},
										{
											display: "completion",
											value: "completion",
										},
									],
								},
								disabled: false,
								rules: { required: true },
							},
							{
								fieldName: "INIT_MODEL_ENGINE",
								label: "Init Script",
								defaultValue:
									"import genai_client;${VAR_NAME} = genai_client.OpenAiClient(model_name = '${MODEL}', api_key = '${OPEN_AI_KEY}', chat_type = '${CHAT_TYPE}')",
								options: {
									component: "text-field",
								},
								disabled: false,
								rules: { required: true },
							},
							{
								fieldName: "KEEP_CONVERSATION_HISTORY",
								label: "Keep Conversation History",
								defaultValue: "false",
								options: {
									component: "select",
									options: [
										{
											display: "true",
											value: "true",
										},
										{
											display: "false",
											value: "false",
										},
									],
								},
								disabled: false,
								rules: { required: true },
							},
							{
								fieldName: "KEEP_INPUT_OUTPUT",
								label: "Record Questions and Responses",
								defaultValue: "false",
								options: {
									component: "select",
									options: [
										{
											display: "true",
											value: "true",
										},
										{
											display: "false",
											value: "false",
										},
									],
								},
								disabled: false,
								rules: { required: true },
							},
							{
								fieldName: "MAX_TOKENS",
								label: "Max Tokens",
								rules: { required: false },
								defaultValue: "",
								options: {
									component: "text-field",
								},
								disabled: false,
							},
							{
								fieldName: "MAX_INPUT_TOKENS",
								label: "Max Input Tokens",
								rules: { required: false },
								defaultValue: "",
								options: {
									component: "text-field",
								},
								disabled: false,
							},
						],
					},
					{
						name: "Text-Davinci",
						disable: false,
						icon: OPEN_AI,
						fields: [
							{
								fieldName: "NAME",
								label: "Catalog Name",
								defaultValue: "",
								options: {
									component: "text-field",
								},
								disabled: false,
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
								fieldName: "MODEL_TYPE",
								label: "Type",
								defaultValue: "OPEN_AI",
								options: {
									component: "select",
									options: [
										{
											display: "Open AI",
											value: "OPEN_AI",
										},
									],
								},
								disabled: false,
								rules: { required: true },
							},
							{
								fieldName: "OPEN_AI_KEY",
								label: "Open AI Key",
								defaultValue: "",
								options: {
									component: "password",
								},
								disabled: false,
								rules: { required: true },
							},
							{
								fieldName: "MODEL",
								label: "Model",
								defaultValue: "text-davinci",
								options: {
									component: "select",
									options: [
										{
											display: "text-davinci",
											value: "text-davinci",
										},
									],
								},
								disabled: true,
								hidden: true,
								rules: { required: true },
							},
							{
								fieldName: "VAR_NAME",
								label: "Variable Name",
								defaultValue: "modelVar",
								options: {
									component: "text-field",
								},
								disabled: false,
								rules: { required: true },
							},
							{
								fieldName: "INIT_MODEL_ENGINE",
								label: "Init Script",
								defaultValue:
									"from genai_client import OpenAiEmbedder;${VAR_NAME} = OpenAiEmbedder(model_name = '${MODEL}', api_key = '${OPEN_AI_KEY}')",
								options: {
									component: "text-field",
								},
								disabled: false,
								rules: { required: true },
							},
							{
								fieldName: "KEEP_INPUT_OUTPUT",
								label: "Record Questions and Responses",
								defaultValue: "false",
								options: {
									component: "select",
									options: [
										{
											display: "true",
											value: "true",
										},
										{
											display: "false",
											value: "false",
										},
									],
								},
								disabled: false,
								rules: { required: true },
							},
							{
								fieldName: "MAX_TOKENS",
								label: "Max Tokens",
								rules: { required: false },
								defaultValue: "",
								options: {
									component: "text-field",
								},
								disabled: false,
							},
							{
								fieldName: "MAX_INPUT_TOKENS",
								label: "Max Input Tokens",
								rules: { required: false },
								defaultValue: "",
								options: {
									component: "text-field",
								},
								disabled: false,
							},
						],
					},
					{
						name: "DALL E",
						disable: false,
						icon: OPEN_AI,
						fields: [
							{
								fieldName: "NAME",
								label: "Catalog Name",
								defaultValue: "",
								options: {
									component: "text-field",
								},
								disabled: false,
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
								fieldName: "MODEL_TYPE",
								label: "Type",
								defaultValue: "OPEN_AI",
								options: {
									component: "select",
									options: [
										{
											display: "Open AI",
											value: "OPEN_AI",
										},
									],
								},
								disabled: false,
								rules: { required: true },
							},
							{
								fieldName: "OPEN_AI_KEY",
								label: "Open AI Key",
								defaultValue: "",
								options: {
									component: "password",
								},
								disabled: false,
								rules: { required: true },
							},
							{
								fieldName: "MODEL",
								label: "Model",
								defaultValue: "dall e",
								options: {
									component: "select",
									options: [
										{
											display: "dall e",
											value: "dall e",
										},
									],
								},
								disabled: true,
								hidden: true,
								rules: { required: true },
							},
							{
								fieldName: "VAR_NAME",
								label: "Variable Name",
								defaultValue: "modelVar",
								options: {
									component: "text-field",
								},
								disabled: false,
								rules: { required: true },
							},
							{
								fieldName: "CHAT_TYPE",
								label: "Chat Type",
								defaultValue: "chat-completion",
								options: {
									component: "select",
									options: [
										{
											display: "chat-completion",
											value: "chat-completion",
										},
										{
											display: "completion",
											value: "completion",
										},
									],
								},
								disabled: false,
								rules: { required: true },
							},
							{
								fieldName: "INIT_MODEL_ENGINE",
								label: "Init Script",
								defaultValue: "",
								options: {
									component: "text-field",
								},
								disabled: false,
								rules: { required: true },
							},
							{
								fieldName: "KEEP_CONVERSATION_HISTORY",
								label: "Keep Conversation History",
								defaultValue: "false",
								options: {
									component: "select",
									options: [
										{
											display: "true",
											value: "true",
										},
										{
											display: "false",
											value: "false",
										},
									],
								},
								disabled: false,
								rules: { required: true },
							},
							{
								fieldName: "KEEP_INPUT_OUTPUT",
								label: "Record Questions and Responses",
								defaultValue: "false",
								options: {
									component: "select",
									options: [
										{
											display: "true",
											value: "true",
										},
										{
											display: "false",
											value: "false",
										},
									],
								},
								disabled: false,
								rules: { required: true },
							},
							{
								fieldName: "MAX_TOKENS",
								label: "Max Tokens",
								rules: { required: false },
								defaultValue: "",
								options: {
									component: "text-field",
								},
								disabled: false,
							},
							{
								fieldName: "MAX_INPUT_TOKENS",
								label: "Max Input Tokens",
								rules: { required: false },
								defaultValue: "",
								options: {
									component: "text-field",
								},
								disabled: false,
							},
						],
					},
				],
				Azure: [
					{
						name: "Azure Open AI",
						disable: false,
						icon: AZURE_OPEN_AI,
						fields: [
							{
								fieldName: "NAME",
								label: "Catalog Name",
								defaultValue: "",
								options: {
									component: "text-field",
								},
								disabled: false,
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
								fieldName: "MODEL_TYPE",
								label: "Type",
								defaultValue: "OPEN_AI",
								options: {
									component: "select",
									options: [
										{
											display: "Open AI",
											value: "OPEN_AI",
										},
									],
								},
								disabled: false,
								rules: { required: true },
							},
							{
								fieldName: "OPEN_AI_KEY",
								label: "Azure Open AI Key",
								defaultValue: "",
								options: {
									component: "password",
								},
								disabled: false,
								rules: { required: true },
							},
							{
								fieldName: "MODEL",
								label: "Deployment Name",
								defaultValue: "",
								options: {
									component: "text-field",
								},
								disabled: false,
								rules: { required: true },
							},
							{
								fieldName: "ENDPOINT",
								label: "Azure Endpoint",
								defaultValue: "",
								options: {
									component: "text-field",
								},
								disabled: false,
								rules: { required: true },
							},
							{
								fieldName: "VAR_NAME",
								label: "Variable Name",
								defaultValue: "modelVar",
								options: {
									component: "text-field",
								},
								disabled: false,
								rules: { required: true },
							},
							{
								fieldName: "CHAT_TYPE",
								label: "Chat Type",
								defaultValue: "chat-completion",
								options: {
									component: "select",
									options: [
										{
											display: "chat-completion",
											value: "chat-completion",
										},
										{
											display: "completion",
											value: "completion",
										},
									],
								},
								disabled: false,
								rules: { required: true },
							},
							{
								fieldName: "INIT_MODEL_ENGINE",
								label: "Init Script",
								defaultValue:
									"import genai_client;${VAR_NAME} = genai_client.AzureOpenAiClient(api_key = '${OPEN_AI_KEY}', endpoint = '${ENDPOINT}', model_name = '${MODEL}', chat_type = '${CHAT_TYPE}')",
								options: {
									component: "text-field",
								},
								disabled: false,
								rules: { required: true },
							},
							{
								fieldName: "KEEP_CONVERSATION_HISTORY",
								label: "Keep Conversation History",
								defaultValue: "false",
								options: {
									component: "select",
									options: [
										{
											display: "true",
											value: "true",
										},
										{
											display: "false",
											value: "false",
										},
									],
								},
								disabled: false,
								rules: { required: true },
							},
							{
								fieldName: "KEEP_INPUT_OUTPUT",
								label: "Record Questions and Responses",
								defaultValue: "false",
								options: {
									component: "select",
									options: [
										{
											display: "true",
											value: "true",
										},
										{
											display: "false",
											value: "false",
										},
									],
								},
								disabled: false,
								rules: { required: true },
							},
							{
								fieldName: "MAX_TOKENS",
								label: "Max Tokens",
								rules: { required: false },
								defaultValue: "",
								options: {
									component: "text-field",
								},
								disabled: false,
							},
							{
								fieldName: "MAX_INPUT_TOKENS",
								label: "Max Input Tokens",
								rules: { required: false },
								defaultValue: "",
								options: {
									component: "text-field",
								},
								disabled: false,
							},
						],
					},
					{
						name: "Azure Open AI ADA Embedder",
						disable: false,
						icon: AZURE_OPEN_AI,
						fields: [
							{
								fieldName: "NAME",
								label: "Catalog Name",
								defaultValue: "",
								options: {
									component: "text-field",
								},
								disabled: false,
								rules: {
									required: true,
									pattern: {
										value: /^[\w\-\s]+$/,
										message:
											"Catalog names can only contain alphanumeric characters and dashes.",
									},
									custom: {
										value: "CheckEngineName ( [VALUE] ) ;",
										message:
											"This Catalog name has already been used, please try another.",
									},
								},
							},
							{
								fieldName: "TAG",
								label: "Tag",
								defaultValue: "embeddings",
								options: {
									component: "text-field",
								},
								disabled: true,
								rules: { required: true },
							},
							{
								fieldName: "MODEL_TYPE",
								label: "Type",
								defaultValue: "OPEN_AI",
								options: {
									component: "select",
									options: [
										{
											display: "Open AI",
											value: "OPEN_AI",
										},
									],
								},
								disabled: false,
								rules: { required: true },
							},
							{
								fieldName: "MODEL",
								label: "Model",
								defaultValue: "text-embedding-ada-002",
								options: {
									component: "select",
									options: [
										{
											display: "text-embedding-ada-002",
											value: "text-embedding-ada-002",
										},
									],
								},
								disabled: false,
								rules: { required: true },
							},
							{
								fieldName: "OPEN_AI_KEY",
								label: "Azure Open AI API Key",
								defaultValue: "",
								options: {
									component: "password",
								},
								disabled: false,
								rules: { required: true },
							},
							{
								fieldName: "ENDPOINT",
								label: "Azure Endpoint",
								defaultValue: "",
								options: {
									component: "text-field",
								},
								disabled: false,
								rules: { required: true },
							},
							{
								fieldName: "API_VERSION",
								label: "API version",
								defaultValue: "",
								options: {
									component: "text-field",
								},
								disabled: false,
								rules: { required: true },
							},
							{
								fieldName: "VAR_NAME",
								label: "Variable Name",
								defaultValue: "modelVar",
								options: {
									component: "text-field",
								},
								disabled: false,
								rules: { required: true },
							},
							{
								fieldName: "INIT_MODEL_ENGINE",
								label: "Init Script",
								defaultValue:
									"from genai_client import AzureOpenAiEmbedder;${VAR_NAME} = AzureOpenAiEmbedder(model_name = '${MODEL}', endpoint = '${ENDPOINT}', api_key = '${OPEN_AI_KEY}', api_version = '${API_VERSION}')",
								options: {
									component: "text-field",
								},
								disabled: false,
								rules: { required: true },
							},
							{
								fieldName: "MAX_TOKENS",
								label: "Max Tokens",
								rules: { required: true },
								defaultValue: "4000",
								options: {
									component: "text-field",
								},
								disabled: false,
							},
						],
					},
				],
				"AWS Bedrock": [
					{
						name: "Claude",
						disable: false,
						icon: CLAUDE,
						fields: [
							{
								fieldName: "NAME",
								label: "Catalog Name",
								defaultValue: "",
								options: {
									component: "text-field",
								},
								disabled: false,
								rules: {
									required: "This field is required",
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
								fieldName: "MODEL_TYPE",
								label: "Type",
								defaultValue: "BEDROCK",
								options: {
									component: "select",
									options: [
										{
											display: "Bedrock",
											value: "BEDROCK",
										},
									],
								},
								disabled: false,
								rules: { required: true },
							},
							{
								fieldName: "MODEL",
								label: "Model",
								defaultValue: "",
								options: {
									component: "text-field",
								},
								disabled: false,
								rules: { required: true },
							},
							{
								fieldName: "AWS_REGION",
								label: "Aws Region",
								defaultValue: "us-east-1",
								options: {
									component: "text-field",
								},
								disabled: false,
								rules: { required: true },
							},
							{
								fieldName: "AWS_ACCESS_KEY",
								label: "Aws Access Key",
								defaultValue: "",
								options: {
									component: "text-field",
								},
								disabled: false,
								rules: { required: true },
							},
							{
								fieldName: "AWS_SECRET_KEY",
								label: "Aws Secret Key",
								defaultValue: "",
								options: {
									component: "password",
								},
								disabled: false,
								rules: { required: true },
							},
							{
								fieldName: "VAR_NAME",
								label: "Variable Name",
								defaultValue: "modelVar",
								options: {
									component: "text-field",
								},
								disabled: false,
								rules: { required: true },
							},
							{
								fieldName: "CHAT_TYPE",
								label: "Chat Type",
								defaultValue: "chat-completion",
								options: {
									component: "select",
									options: [
										{
											display: "chat-completion",
											value: "chat-completion",
										},
										{
											display: "completion",
											value: "completion",
										},
									],
								},
								disabled: false,
								rules: { required: true },
							},
							{
								fieldName: "INIT_MODEL_ENGINE",
								label: "Init Script",
								defaultValue:
									"import genai_client;${VAR_NAME} = genai_client.BedrockClient(modelId = '${MODEL}', secret_key = '${AWS_SECRET_KEY}', access_key = '${AWS_ACCESS_KEY}', region='${AWS_REGION}')",
								options: {
									component: "text-field",
								},
								disabled: false,
								rules: { required: true },
							},
							{
								fieldName: "KEEP_CONVERSATION_HISTORY",
								label: "Keep Conversation History",
								defaultValue: "false",
								options: {
									component: "select",
									options: [
										{
											display: "true",
											value: "true",
										},
										{
											display: "false",
											value: "false",
										},
									],
								},
								disabled: false,
								rules: { required: true },
							},
							{
								fieldName: "KEEP_INPUT_OUTPUT",
								label: "Record Questions and Responses",
								defaultValue: "false",
								options: {
									component: "select",
									options: [
										{
											display: "true",
											value: "true",
										},
										{
											display: "false",
											value: "false",
										},
									],
								},
								disabled: false,
								rules: { required: true },
							},
							{
								fieldName: "MAX_TOKENS",
								label: "Max Tokens",
								rules: { required: false },
								defaultValue: "",
								options: {
									component: "text-field",
								},
								disabled: false,
							},
							{
								fieldName: "MAX_INPUT_TOKENS",
								label: "Max Input Tokens",
								rules: { required: false },
								defaultValue: "",
								options: {
									component: "text-field",
								},
								disabled: false,
							},
						],
					},
				],
				"Google GCP": [
					{
						name: "Palm Bison",
						disable: false,
						icon: VERTEX,
						fields: [
							{
								fieldName: "NAME",
								label: "Catalog Name",
								defaultValue: "",
								options: {
									component: "text-field",
								},
								disabled: false,
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
								fieldName: "MODEL_TYPE",
								label: "Type",
								defaultValue: "VERTEX",
								options: {
									component: "select",
									options: [
										{
											display: "Vertex",
											value: "VERTEX",
										},
									],
								},
								disabled: true,
								rules: { required: true },
							},
							{
								fieldName: "MODEL",
								label: "Model",
								defaultValue: "text-bison",
								options: {
									component: "text-field",
								},
								disabled: false,
								rules: { required: true },
							},
							{
								fieldName: "GCP_REGION",
								label: "GCP Region",
								defaultValue: "",
								options: {
									component: "text-field",
								},
								disabled: false,
								rules: { required: true },
							},
							{
								fieldName: "VAR_NAME",
								label: "Variable Name",
								defaultValue: "modelVar",
								options: {
									component: "text-field",
								},
								disabled: false,
								rules: { required: true },
							},
							{
								fieldName: "CHAT_TYPE",
								label: "Chat Type",
								defaultValue: "text",
								options: {
									component: "select",
									options: [
										{
											display: "chat",
											value: "chat",
										},
										{
											display: "code",
											value: "code",
										},
										{
											display: "codechat",
											value: "codechat",
										},
										{
											display: "generative",
											value: "generative",
										},
										{
											display: "text",
											value: "text",
										},
									],
								},
								disabled: false,
								rules: { required: true },
							},
							{
								fieldName: "INIT_MODEL_ENGINE",
								label: "Init Script",
								defaultValue:
									"import genai_client;${VAR_NAME} = genai_client.VertexClient(model_name = '${MODEL}', service_account_key_file = '${SERVICE_ACCOUNT_FILE}', region='${GCP_REGION}', chat_type='${CHAT_TYPE}')",
								options: {
									component: "text-field",
								},
								disabled: false,
								rules: { required: true },
							},
							{
								fieldName: "KEEP_CONVERSATION_HISTORY",
								label: "Keep Conversation History",
								defaultValue: "false",
								options: {
									component: "select",
									options: [
										{
											display: "true",
											value: "true",
										},
										{
											display: "false",
											value: "false",
										},
									],
								},
								disabled: false,
								rules: { required: true },
							},
							{
								fieldName: "KEEP_INPUT_OUTPUT",
								label: "Record Questions and Responses",
								defaultValue: "false",
								options: {
									component: "select",
									options: [
										{
											display: "true",
											value: "true",
										},
										{
											display: "false",
											value: "false",
										},
									],
								},
								disabled: false,
								rules: { required: true },
							},
							{
								fieldName: "MAX_TOKENS",
								label: "Max Tokens",
								rules: { required: false },
								defaultValue: "",
								options: {
									component: "text-field",
								},
								disabled: false,
							},
							{
								fieldName: "MAX_INPUT_TOKENS",
								label: "Max Input Tokens",
								rules: { required: false },
								defaultValue: "",
								options: {
									component: "text-field",
								},
								disabled: false,
							},
						],
					},
					{
						name: "Palm Chat Bison",
						disable: false,
						icon: VERTEX,
						fields: [
							{
								fieldName: "NAME",
								label: "Catalog Name",
								defaultValue: "",
								options: {
									component: "text-field",
								},
								disabled: false,
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
								fieldName: "MODEL_TYPE",
								label: "Type",
								defaultValue: "VERTEX",
								options: {
									component: "select",
									options: [
										{
											display: "Vertex",
											value: "VERTEX",
										},
									],
								},
								disabled: true,
								rules: { required: true },
							},
							{
								fieldName: "MODEL",
								label: "Model",
								defaultValue: "text-bison",
								options: {
									component: "text-field",
								},
								disabled: false,
								rules: { required: true },
							},
							{
								fieldName: "GCP_REGION",
								label: "GCP Region",
								defaultValue: "",
								options: {
									component: "text-field",
								},
								disabled: false,
								rules: { required: true },
							},
							{
								fieldName: "VAR_NAME",
								label: "Variable Name",
								defaultValue: "modelVar",
								options: {
									component: "text-field",
								},
								disabled: false,
								rules: { required: true },
							},
							{
								fieldName: "CHAT_TYPE",
								label: "Chat Type",
								defaultValue: "text",
								options: {
									component: "select",
									options: [
										{
											display: "chat",
											value: "chat",
										},
										{
											display: "code",
											value: "code",
										},
										{
											display: "codechat",
											value: "codechat",
										},
										{
											display: "generative",
											value: "generative",
										},
										{
											display: "text",
											value: "text",
										},
									],
								},
								disabled: false,
								rules: { required: true },
							},
							{
								fieldName: "INIT_MODEL_ENGINE",
								label: "Init Script",
								defaultValue:
									"import genai_client;${VAR_NAME} = genai_client.VertexClient(model_name = '${MODEL}', service_account_key_file = '${SERVICE_ACCOUNT_FILE}', region='${GCP_REGION}', chat_type='${CHAT_TYPE}')",
								options: {
									component: "text-field",
								},
								disabled: false,
								rules: { required: true },
							},
							{
								fieldName: "KEEP_CONVERSATION_HISTORY",
								label: "Keep Conversation History",
								defaultValue: "false",
								options: {
									component: "select",
									options: [
										{
											display: "true",
											value: "true",
										},
										{
											display: "false",
											value: "false",
										},
									],
								},
								disabled: false,
								rules: { required: true },
							},
							{
								fieldName: "KEEP_INPUT_OUTPUT",
								label: "Record Questions and Responses",
								defaultValue: "false",
								options: {
									component: "select",
									options: [
										{
											display: "true",
											value: "true",
										},
										{
											display: "false",
											value: "false",
										},
									],
								},
								disabled: false,
								rules: { required: true },
							},
							{
								fieldName: "MAX_TOKENS",
								label: "Max Tokens",
								rules: { required: false },
								defaultValue: "",
								options: {
									component: "text-field",
								},
								disabled: false,
							},
							{
								fieldName: "MAX_INPUT_TOKENS",
								label: "Max Input Tokens",
								rules: { required: false },
								defaultValue: "",
								options: {
									component: "text-field",
								},
								disabled: false,
							},
						],
					},
					{
						name: "Palm Code Bison",
						disable: false,
						icon: VERTEX,
						fields: [
							{
								fieldName: "NAME",
								label: "Catalog Name",
								defaultValue: "",
								options: {
									component: "text-field",
								},
								disabled: false,
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
								fieldName: "MODEL_TYPE",
								label: "Type",
								defaultValue: "VERTEX",
								options: {
									component: "select",
									options: [
										{
											display: "Vertex",
											value: "VERTEX",
										},
									],
								},
								disabled: true,
								rules: { required: true },
							},
							{
								fieldName: "MODEL",
								label: "Model",
								defaultValue: "text-bison",
								options: {
									component: "text-field",
								},
								disabled: false,
								rules: { required: true },
							},
							{
								fieldName: "GCP_REGION",
								label: "GCP Region",
								defaultValue: "",
								options: {
									component: "text-field",
								},
								disabled: false,
								rules: { required: true },
							},
							{
								fieldName: "VAR_NAME",
								label: "Variable Name",
								defaultValue: "modelVar",
								options: {
									component: "text-field",
								},
								disabled: false,
								rules: { required: true },
							},
							{
								fieldName: "CHAT_TYPE",
								label: "Chat Type",
								defaultValue: "text",
								options: {
									component: "select",
									options: [
										{
											display: "chat",
											value: "chat",
										},
										{
											display: "code",
											value: "code",
										},
										{
											display: "codechat",
											value: "codechat",
										},
										{
											display: "generative",
											value: "generative",
										},
										{
											display: "text",
											value: "text",
										},
									],
								},
								disabled: false,
								rules: { required: true },
							},
							{
								fieldName: "INIT_MODEL_ENGINE",
								label: "Init Script",
								defaultValue:
									"import genai_client;${VAR_NAME} = genai_client.VertexClient(model_name = '${MODEL}', service_account_key_file = '${SERVICE_ACCOUNT_FILE}', region='${GCP_REGION}', chat_type='${CHAT_TYPE}')",
								options: {
									component: "text-field",
								},
								disabled: false,
								rules: { required: true },
							},
							{
								fieldName: "KEEP_CONVERSATION_HISTORY",
								label: "Keep Conversation History",
								defaultValue: "false",
								options: {
									component: "select",
									options: [
										{
											display: "true",
											value: "true",
										},
										{
											display: "false",
											value: "false",
										},
									],
								},
								disabled: false,
								rules: { required: true },
							},
							{
								fieldName: "KEEP_INPUT_OUTPUT",
								label: "Record Questions and Responses",
								defaultValue: "false",
								options: {
									component: "select",
									options: [
										{
											display: "true",
											value: "true",
										},
										{
											display: "false",
											value: "false",
										},
									],
								},
								disabled: false,
								rules: { required: true },
							},
							{
								fieldName: "MAX_TOKENS",
								label: "Max Tokens",
								rules: { required: false },
								defaultValue: "",
								options: {
									component: "text-field",
								},
								disabled: false,
							},
							{
								fieldName: "MAX_INPUT_TOKENS",
								label: "Max Input Tokens",
								rules: { required: false },
								defaultValue: "",
								options: {
									component: "text-field",
								},
								disabled: false,
							},
						],
					},
				],
				"NVIDIA NIM Models": [
					{
						name: "embed-qa-4",
						disable: false,
						icon: NEMO,
						fields: [
							{
								fieldName: "NAME",
								label: "Catalog Name",
								defaultValue: "",
								options: {
									component: "text-field",
								},
								disabled: false,
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
								fieldName: "MODEL_TYPE",
								label: "Type",
								defaultValue: "OPEN_AI",
								options: {
									component: "select",
									options: [
										{
											display: "Open AI",
											value: "OPEN_AI",
										},
									],
								},
								disabled: false,
								rules: { required: true },
							},
							{
								fieldName: "OPEN_AI_KEY",
								label: "Open AI Key",
								defaultValue: "",
								options: {
									component: "password",
								},
								disabled: false,
								rules: { required: true },
							},
							{
								fieldName: "MODEL",
								label: "Model",
								defaultValue:
									"mistralai/mixtral-8x7b-instruct-v0.1",
								options: {
									component: "select",
									options: [
										{
											display:
												"mistralai/mixtral-8x7b-instruct-v0.1",
											value: "mistralai/mixtral-8x7b-instruct-v0.1",
										},
									],
								},
								disabled: true,
								hidden: true,
								rules: { required: true },
							},
							{
								fieldName: "VAR_NAME",
								label: "Variable Name",
								defaultValue: "modelVar",
								options: {
									component: "text-field",
								},
								disabled: false,
								rules: { required: true },
							},
							{
								fieldName: "CHAT_TYPE",
								label: "Chat Type",
								defaultValue: "chat-completion",
								options: {
									component: "select",
									options: [
										{
											display: "chat-completion",
											value: "chat-completion",
										},
										{
											display: "completion",
											value: "completion",
										},
									],
								},
								disabled: false,
								rules: { required: true },
							},
							{
								fieldName: "INIT_MODEL_ENGINE",
								label: "Init Script",
								defaultValue:
									"import genai_client;${VAR_NAME} = genai_client.OpenAiClient(endpoint = 'https://integrate.api.nvidia.com/v1', model_name='${MODEL_TYPE}', chat_type = '${CHAT_TYPE}', api_key='${OPEN_AI_KEY}', template={ \"mixtral.default.nocontext\":\"[INST] $question [/INST]\"},  template_name='mixtral.default.nocontext')",
								options: {
									component: "text-field",
								},
								disabled: false,
								rules: { required: true },
							},
							{
								fieldName: "KEEP_CONVERSATION_HISTORY",
								label: "Keep Conversation History",
								defaultValue: "false",
								options: {
									component: "select",
									options: [
										{
											display: "true",
											value: "true",
										},
										{
											display: "false",
											value: "false",
										},
									],
								},
								disabled: false,
								rules: { required: true },
							},
							{
								fieldName: "KEEP_INPUT_OUTPUT",
								label: "Record Questions and Responses",
								defaultValue: "false",
								options: {
									component: "select",
									options: [
										{
											display: "true",
											value: "true",
										},
										{
											display: "false",
											value: "false",
										},
									],
								},
								disabled: false,
								rules: { required: true },
							},
							{
								fieldName: "MAX_TOKENS",
								label: "Max Tokens",
								rules: { required: false },
								defaultValue: "",
								options: {
									component: "text-field",
								},
								disabled: false,
							},
							{
								fieldName: "MAX_INPUT_TOKENS",
								label: "Max Input Tokens",
								rules: { required: false },
								defaultValue: "",
								options: {
									component: "text-field",
								},
								disabled: false,
							},
						],
					},
					{
						name: "rerank-qa-mistral-4b",
						disable: false,
						icon: NEMO,
						fields: [
							{
								fieldName: "NAME",
								label: "Catalog Name",
								defaultValue: "",
								options: {
									component: "text-field",
								},
								disabled: false,
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
								fieldName: "MODEL_TYPE",
								label: "Type",
								defaultValue: "OPEN_AI",
								options: {
									component: "select",
									options: [
										{
											display: "Open AI",
											value: "OPEN_AI",
										},
									],
								},
								disabled: false,
								rules: { required: true },
							},
							{
								fieldName: "OPEN_AI_KEY",
								label: "Open AI Key",
								defaultValue: "",
								options: {
									component: "password",
								},
								disabled: false,
								rules: { required: true },
							},
							{
								fieldName: "MODEL",
								label: "Model",
								defaultValue:
									"mistralai/mixtral-8x7b-instruct-v0.1",
								options: {
									component: "select",
									options: [
										{
											display:
												"mistralai/mixtral-8x7b-instruct-v0.1",
											value: "mistralai/mixtral-8x7b-instruct-v0.1",
										},
									],
								},
								disabled: true,
								hidden: true,
								rules: { required: true },
							},
							{
								fieldName: "VAR_NAME",
								label: "Variable Name",
								defaultValue: "modelVar",
								options: {
									component: "text-field",
								},
								disabled: false,
								rules: { required: true },
							},
							{
								fieldName: "CHAT_TYPE",
								label: "Chat Type",
								defaultValue: "chat-completion",
								options: {
									component: "select",
									options: [
										{
											display: "chat-completion",
											value: "chat-completion",
										},
										{
											display: "completion",
											value: "completion",
										},
									],
								},
								disabled: false,
								rules: { required: true },
							},
							{
								fieldName: "INIT_MODEL_ENGINE",
								label: "Init Script",
								defaultValue:
									"import genai_client;${VAR_NAME} = genai_client.OpenAiClient(endpoint = 'https://integrate.api.nvidia.com/v1', model_name='${MODEL_TYPE}', chat_type = '${CHAT_TYPE}', api_key='${OPEN_AI_KEY}', template={ \"mixtral.default.nocontext\":\"[INST] $question [/INST]\"},  template_name='mixtral.default.nocontext')",
								options: {
									component: "text-field",
								},
								disabled: false,
								rules: { required: true },
							},
							{
								fieldName: "KEEP_CONVERSATION_HISTORY",
								label: "Keep Conversation History",
								defaultValue: "false",
								options: {
									component: "select",
									options: [
										{
											display: "true",
											value: "true",
										},
										{
											display: "false",
											value: "false",
										},
									],
								},
								disabled: false,
								rules: { required: true },
							},
							{
								fieldName: "KEEP_INPUT_OUTPUT",
								label: "Record Questions and Responses",
								defaultValue: "false",
								options: {
									component: "select",
									options: [
										{
											display: "true",
											value: "true",
										},
										{
											display: "false",
											value: "false",
										},
									],
								},
								disabled: false,
								rules: { required: true },
							},
							{
								fieldName: "MAX_TOKENS",
								label: "Max Tokens",
								rules: { required: false },
								defaultValue: "",
								options: {
									component: "text-field",
								},
								disabled: false,
							},
							{
								fieldName: "MAX_INPUT_TOKENS",
								label: "Max Input Tokens",
								rules: { required: false },
								defaultValue: "",
								options: {
									component: "text-field",
								},
								disabled: false,
							},
						],
					},
				],
			},
		],
		"Locally Hosted": [
			{
				name: "Bert",
				disable: false,
				icon: BERT,
				fields: [
					{
						fieldName: "NAME",
						label: "Catalog Name",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
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
						fieldName: "MODEL",
						label: "Model",
						defaultValue: "Bert",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "MODEL_TYPE",
						label: "Type",
						defaultValue: "",
						options: {
							component: "select",
							options: [
								{
									display: "Text Generation",
									value: "TEXT_GENERATION",
								},
								{
									display: "vLLM (Fast Chat)",
									value: "FAST_CHAT",
								},
							],
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "ENDPOINT",
						label: "Endpoint",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "VAR_NAME",
						label: "Variable Name",
						defaultValue: "modelVar",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "CHAT_TYPE",
						label: "Chat Type",
						defaultValue: "chat-completion",
						options: {
							component: "select",
							options: [
								{
									display: "chat-completion",
									value: "chat-completion",
								},
								{
									display: "completion",
									value: "completion",
								},
							],
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "INIT_MODEL_ENGINE",
						label: "Init Script",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "KEEP_CONVERSATION_HISTORY",
						label: "Keep Conversation History",
						defaultValue: "false",
						options: {
							component: "select",
							options: [
								{
									display: "true",
									value: "true",
								},
								{
									display: "false",
									value: "false",
								},
							],
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "KEEP_INPUT_OUTPUT",
						label: "Record Questions and Responses",
						defaultValue: "false",
						options: {
							component: "select",
							options: [
								{
									display: "true",
									value: "true",
								},
								{
									display: "false",
									value: "false",
								},
							],
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "MAX_TOKENS",
						label: "Max Tokens",
						rules: { required: false },
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
					},
					{
						fieldName: "MAX_INPUT_TOKENS",
						label: "Max Input Tokens",
						rules: { required: false },
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
					},
				],
			},
			{
				name: "Dolly",
				disable: false,
				icon: DOLLY,
				fields: [
					{
						fieldName: "NAME",
						label: "Catalog Name",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
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
						fieldName: "MODEL",
						label: "Model",
						defaultValue: "Dolly",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "MODEL_TYPE",
						label: "Type",
						defaultValue: "",
						options: {
							component: "select",
							options: [
								{
									display: "Text Generation",
									value: "TEXT_GENERATION",
								},
								{
									display: "vLLM (Fast Chat)",
									value: "FAST_CHAT",
								},
							],
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "ENDPOINT",
						label: "Endpoint",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "VAR_NAME",
						label: "Variable Name",
						defaultValue: "modelVar",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "CHAT_TYPE",
						label: "Chat Type",
						defaultValue: "chat-completion",
						options: {
							component: "select",
							options: [
								{
									display: "chat-completion",
									value: "chat-completion",
								},
								{
									display: "completion",
									value: "completion",
								},
							],
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "INIT_MODEL_ENGINE",
						label: "Init Script",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "KEEP_CONVERSATION_HISTORY",
						label: "Keep Conversation History",
						defaultValue: "false",
						options: {
							component: "select",
							options: [
								{
									display: "true",
									value: "true",
								},
								{
									display: "false",
									value: "false",
								},
							],
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "KEEP_INPUT_OUTPUT",
						label: "Record Questions and Responses",
						defaultValue: "false",
						options: {
							component: "select",
							options: [
								{
									display: "true",
									value: "true",
								},
								{
									display: "false",
									value: "false",
								},
							],
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "MAX_TOKENS",
						label: "Max Tokens",
						rules: { required: false },
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
					},
					{
						fieldName: "MAX_INPUT_TOKENS",
						label: "Max Input Tokens",
						rules: { required: false },
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
					},
				],
			},
			{
				name: "Eleuther GPTJ",
				disable: false,
				icon: ELEUTHER,
				fields: [
					{
						fieldName: "NAME",
						label: "Catalog Name",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
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
						fieldName: "MODEL",
						label: "Model",
						defaultValue: "Eleuther GPTJ",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "MODEL_TYPE",
						label: "Type",
						defaultValue: "",
						options: {
							component: "select",
							options: [
								{
									display: "Text Generation",
									value: "TEXT_GENERATION",
								},
								{
									display: "vLLM (Fast Chat)",
									value: "FAST_CHAT",
								},
							],
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "ENDPOINT",
						label: "Endpoint",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "VAR_NAME",
						label: "Variable Name",
						defaultValue: "modelVar",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "CHAT_TYPE",
						label: "Chat Type",
						defaultValue: "chat-completion",
						options: {
							component: "select",
							options: [
								{
									display: "chat-completion",
									value: "chat-completion",
								},
								{
									display: "completion",
									value: "completion",
								},
							],
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "INIT_MODEL_ENGINE",
						label: "Init Script",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "KEEP_CONVERSATION_HISTORY",
						label: "Keep Conversation History",
						defaultValue: "false",
						options: {
							component: "select",
							options: [
								{
									display: "true",
									value: "true",
								},
								{
									display: "false",
									value: "false",
								},
							],
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "KEEP_INPUT_OUTPUT",
						label: "Record Questions and Responses",
						defaultValue: "false",
						options: {
							component: "select",
							options: [
								{
									display: "true",
									value: "true",
								},
								{
									display: "false",
									value: "false",
								},
							],
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "MAX_TOKENS",
						label: "Max Tokens",
						rules: { required: false },
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
					},
					{
						fieldName: "MAX_INPUT_TOKENS",
						label: "Max Input Tokens",
						rules: { required: false },
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
					},
				],
			},
			{
				name: "Falcon",
				disable: false,
				icon: FALCON,
				fields: [
					{
						fieldName: "NAME",
						label: "Catalog Name",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
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
						fieldName: "MODEL",
						label: "Model",
						defaultValue: "Falcon",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "MODEL_TYPE",
						label: "Type",
						defaultValue: "",
						options: {
							component: "select",
							options: [
								{
									display: "Text Generation",
									value: "TEXT_GENERATION",
								},
								{
									display: "vLLM (Fast Chat)",
									value: "FAST_CHAT",
								},
							],
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "ENDPOINT",
						label: "Endpoint",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "VAR_NAME",
						label: "Variable Name",
						defaultValue: "modelVar",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "CHAT_TYPE",
						label: "Chat Type",
						defaultValue: "chat-completion",
						options: {
							component: "select",
							options: [
								{
									display: "chat-completion",
									value: "chat-completion",
								},
								{
									display: "completion",
									value: "completion",
								},
							],
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "INIT_MODEL_ENGINE",
						label: "Init Script",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "KEEP_CONVERSATION_HISTORY",
						label: "Keep Conversation History",
						defaultValue: "false",
						options: {
							component: "select",
							options: [
								{
									display: "true",
									value: "true",
								},
								{
									display: "false",
									value: "false",
								},
							],
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "KEEP_INPUT_OUTPUT",
						label: "Record Questions and Responses",
						defaultValue: "false",
						options: {
							component: "select",
							options: [
								{
									display: "true",
									value: "true",
								},
								{
									display: "false",
									value: "false",
								},
							],
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "MAX_TOKENS",
						label: "Max Tokens",
						rules: { required: false },
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
					},
					{
						fieldName: "MAX_INPUT_TOKENS",
						label: "Max Input Tokens",
						rules: { required: false },
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
					},
				],
			},
			{
				name: "Flan T5 Large",
				disable: false,
				icon: FLAN,
				fields: [
					{
						fieldName: "NAME",
						label: "Catalog Name",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
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
						fieldName: "MODEL",
						label: "Model",
						defaultValue: "Flan T5 Large",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "MODEL_TYPE",
						label: "Type",
						defaultValue: "",
						options: {
							component: "select",
							options: [
								{
									display: "Text Generation",
									value: "TEXT_GENERATION",
								},
								{
									display: "vLLM (Fast Chat)",
									value: "FAST_CHAT",
								},
							],
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "ENDPOINT",
						label: "Endpoint",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "VAR_NAME",
						label: "Variable Name",
						defaultValue: "modelVar",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "CHAT_TYPE",
						label: "Chat Type",
						defaultValue: "chat-completion",
						options: {
							component: "select",
							options: [
								{
									display: "chat-completion",
									value: "chat-completion",
								},
								{
									display: "completion",
									value: "completion",
								},
							],
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "INIT_MODEL_ENGINE",
						label: "Init Script",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "KEEP_CONVERSATION_HISTORY",
						label: "Keep Conversation History",
						defaultValue: "false",
						options: {
							component: "select",
							options: [
								{
									display: "true",
									value: "true",
								},
								{
									display: "false",
									value: "false",
								},
							],
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "KEEP_INPUT_OUTPUT",
						label: "Record Questions and Responses",
						defaultValue: "false",
						options: {
							component: "select",
							options: [
								{
									display: "true",
									value: "true",
								},
								{
									display: "false",
									value: "false",
								},
							],
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "MAX_TOKENS",
						label: "Max Tokens",
						rules: { required: false },
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
					},
					{
						fieldName: "MAX_INPUT_TOKENS",
						label: "Max Input Tokens",
						rules: { required: false },
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
					},
				],
			},
			{
				name: "Flan T5 XXL",
				disable: false,
				icon: FLAN,
				fields: [
					{
						fieldName: "NAME",
						label: "Catalog Name",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
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
						fieldName: "MODEL",
						label: "Model",
						defaultValue: "Flan T5 XXL",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "MODEL_TYPE",
						label: "Type",
						defaultValue: "",
						options: {
							component: "select",
							options: [
								{
									display: "Text Generation",
									value: "TEXT_GENERATION",
								},
								{
									display: "vLLM (Fast Chat)",
									value: "FAST_CHAT",
								},
							],
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "ENDPOINT",
						label: "Endpoint",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "VAR_NAME",
						label: "Variable Name",
						defaultValue: "modelVar",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "CHAT_TYPE",
						label: "Chat Type",
						defaultValue: "chat-completion",
						options: {
							component: "select",
							options: [
								{
									display: "chat-completion",
									value: "chat-completion",
								},
								{
									display: "completion",
									value: "completion",
								},
							],
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "INIT_MODEL_ENGINE",
						label: "Init Script",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "KEEP_CONVERSATION_HISTORY",
						label: "Keep Conversation History",
						defaultValue: "false",
						options: {
							component: "select",
							options: [
								{
									display: "true",
									value: "true",
								},
								{
									display: "false",
									value: "false",
								},
							],
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "KEEP_INPUT_OUTPUT",
						label: "Record Questions and Responses",
						defaultValue: "false",
						options: {
							component: "select",
							options: [
								{
									display: "true",
									value: "true",
								},
								{
									display: "false",
									value: "false",
								},
							],
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "MAX_TOKENS",
						label: "Max Tokens",
						rules: { required: false },
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
					},
					{
						fieldName: "MAX_INPUT_TOKENS",
						label: "Max Input Tokens",
						rules: { required: false },
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
					},
				],
			},
			{
				name: "Guanaco",
				disable: false,
				icon: BRAIN,
				fields: [
					{
						fieldName: "NAME",
						label: "Catalog Name",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
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
						fieldName: "MODEL",
						label: "Model",
						defaultValue: "Guanaco",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "MODEL_TYPE",
						label: "Type",
						defaultValue: "",
						options: {
							component: "select",
							options: [
								{
									display: "Text Generation",
									value: "TEXT_GENERATION",
								},
								{
									display: "vLLM (Fast Chat)",
									value: "FAST_CHAT",
								},
							],
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "ENDPOINT",
						label: "Endpoint",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "VAR_NAME",
						label: "Variable Name",
						defaultValue: "modelVar",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "CHAT_TYPE",
						label: "Chat Type",
						defaultValue: "chat-completion",
						options: {
							component: "select",
							options: [
								{
									display: "chat-completion",
									value: "chat-completion",
								},
								{
									display: "completion",
									value: "completion",
								},
							],
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "INIT_MODEL_ENGINE",
						label: "Init Script",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "KEEP_CONVERSATION_HISTORY",
						label: "Keep Conversation History",
						defaultValue: "false",
						options: {
							component: "select",
							options: [
								{
									display: "true",
									value: "true",
								},
								{
									display: "false",
									value: "false",
								},
							],
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "KEEP_INPUT_OUTPUT",
						label: "Record Questions and Responses",
						defaultValue: "false",
						options: {
							component: "select",
							options: [
								{
									display: "true",
									value: "true",
								},
								{
									display: "false",
									value: "false",
								},
							],
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "MAX_TOKENS",
						label: "Max Tokens",
						rules: { required: false },
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
					},
					{
						fieldName: "MAX_INPUT_TOKENS",
						label: "Max Input Tokens",
						rules: { required: false },
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
					},
				],
			},
			{
				name: "Llama2 7B",
				disable: false,
				icon: META,
				fields: [
					{
						fieldName: "NAME",
						label: "Catalog Name",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
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
						fieldName: "MODEL",
						label: "Model",
						defaultValue: "meta-llama/Llama-2-7b",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "MODEL_TYPE",
						label: "Type",
						defaultValue: "",
						options: {
							component: "select",
							options: [
								{
									display: "Text Generation",
									value: "TEXT_GENERATION",
								},
								{
									display: "vLLM (Fast Chat)",
									value: "FAST_CHAT",
								},
							],
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "ENDPOINT",
						label: "Endpoint",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "VAR_NAME",
						label: "Variable Name",
						defaultValue: "modelVar",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "CHAT_TYPE",
						label: "Chat Type",
						defaultValue: "chat-completion",
						options: {
							component: "select",
							options: [
								{
									display: "chat-completion",
									value: "chat-completion",
								},
								{
									display: "completion",
									value: "completion",
								},
							],
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "INIT_MODEL_ENGINE",
						label: "Init Script",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "KEEP_CONVERSATION_HISTORY",
						label: "Keep Conversation History",
						defaultValue: "false",
						options: {
							component: "select",
							options: [
								{
									display: "true",
									value: "true",
								},
								{
									display: "false",
									value: "false",
								},
							],
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "KEEP_INPUT_OUTPUT",
						label: "Record Questions and Responses",
						defaultValue: "false",
						options: {
							component: "select",
							options: [
								{
									display: "true",
									value: "true",
								},
								{
									display: "false",
									value: "false",
								},
							],
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "MAX_TOKENS",
						label: "Max Tokens",
						rules: { required: false },
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
					},
					{
						fieldName: "MAX_INPUT_TOKENS",
						label: "Max Input Tokens",
						rules: { required: false },
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
					},
				],
			},
			{
				name: "Llama2 13B",
				disable: false,
				icon: META,
				fields: [
					{
						fieldName: "NAME",
						label: "Catalog Name",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
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
						fieldName: "MODEL",
						label: "Model",
						defaultValue: "meta-llama/Llama-2-13b",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "MODEL_TYPE",
						label: "Type",
						defaultValue: "",
						options: {
							component: "select",
							options: [
								{
									display: "Text Generation",
									value: "TEXT_GENERATION",
								},
								{
									display: "vLLM (Fast Chat)",
									value: "FAST_CHAT",
								},
							],
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "ENDPOINT",
						label: "Endpoint",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "VAR_NAME",
						label: "Variable Name",
						defaultValue: "modelVar",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "CHAT_TYPE",
						label: "Chat Type",
						defaultValue: "chat-completion",
						options: {
							component: "select",
							options: [
								{
									display: "chat-completion",
									value: "chat-completion",
								},
								{
									display: "completion",
									value: "completion",
								},
							],
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "INIT_MODEL_ENGINE",
						label: "Init Script",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "KEEP_CONVERSATION_HISTORY",
						label: "Keep Conversation History",
						defaultValue: "false",
						options: {
							component: "select",
							options: [
								{
									display: "true",
									value: "true",
								},
								{
									display: "false",
									value: "false",
								},
							],
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "KEEP_INPUT_OUTPUT",
						label: "Record Questions and Responses",
						defaultValue: "false",
						options: {
							component: "select",
							options: [
								{
									display: "true",
									value: "true",
								},
								{
									display: "false",
									value: "false",
								},
							],
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "MAX_TOKENS",
						label: "Max Tokens",
						rules: { required: false },
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
					},
					{
						fieldName: "MAX_INPUT_TOKENS",
						label: "Max Input Tokens",
						rules: { required: false },
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
					},
				],
			},
			{
				name: "Llama2 70B",
				disable: false,
				icon: META,
				fields: [
					{
						fieldName: "NAME",
						label: "Catalog Name",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
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
						fieldName: "MODEL",
						label: "Model",
						defaultValue: "meta-llama/Llama-2-70b",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "MODEL_TYPE",
						label: "Type",
						defaultValue: "",
						options: {
							component: "select",
							options: [
								{
									display: "Text Generation",
									value: "TEXT_GENERATION",
								},
								{
									display: "vLLM (Fast Chat)",
									value: "FAST_CHAT",
								},
							],
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "ENDPOINT",
						label: "Endpoint",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "VAR_NAME",
						label: "Variable Name",
						defaultValue: "modelVar",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "CHAT_TYPE",
						label: "Chat Type",
						defaultValue: "chat-completion",
						options: {
							component: "select",
							options: [
								{
									display: "chat-completion",
									value: "chat-completion",
								},
								{
									display: "completion",
									value: "completion",
								},
							],
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "INIT_MODEL_ENGINE",
						label: "Init Script",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "KEEP_CONVERSATION_HISTORY",
						label: "Keep Conversation History",
						defaultValue: "false",
						options: {
							component: "select",
							options: [
								{
									display: "true",
									value: "true",
								},
								{
									display: "false",
									value: "false",
								},
							],
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "KEEP_INPUT_OUTPUT",
						label: "Record Questions and Responses",
						defaultValue: "false",
						options: {
							component: "select",
							options: [
								{
									display: "true",
									value: "true",
								},
								{
									display: "false",
									value: "false",
								},
							],
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "MAX_TOKENS",
						label: "Max Tokens",
						rules: { required: false },
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
					},
					{
						fieldName: "MAX_INPUT_TOKENS",
						label: "Max Input Tokens",
						rules: { required: false },
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
					},
				],
			},
			{
				name: "Mosaic ML",
				disable: false,
				icon: MOSAIC,
				fields: [
					{
						fieldName: "NAME",
						label: "Catalog Name",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
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
						fieldName: "MODEL",
						label: "Model",
						defaultValue: "Mosaic ML",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "MODEL_TYPE",
						label: "Type",
						defaultValue: "",
						options: {
							component: "select",
							options: [
								{
									display: "Text Generation",
									value: "TEXT_GENERATION",
								},
								{
									display: "vLLM (Fast Chat)",
									value: "FAST_CHAT",
								},
							],
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "ENDPOINT",
						label: "Endpoint",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "VAR_NAME",
						label: "Variable Name",
						defaultValue: "modelVar",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "CHAT_TYPE",
						label: "Chat Type",
						defaultValue: "chat-completion",
						options: {
							component: "select",
							options: [
								{
									display: "chat-completion",
									value: "chat-completion",
								},
								{
									display: "completion",
									value: "completion",
								},
							],
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "INIT_MODEL_ENGINE",
						label: "Init Script",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "KEEP_CONVERSATION_HISTORY",
						label: "Keep Conversation History",
						defaultValue: "false",
						options: {
							component: "select",
							options: [
								{
									display: "true",
									value: "true",
								},
								{
									display: "false",
									value: "false",
								},
							],
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "KEEP_INPUT_OUTPUT",
						label: "Record Questions and Responses",
						defaultValue: "false",
						options: {
							component: "select",
							options: [
								{
									display: "true",
									value: "true",
								},
								{
									display: "false",
									value: "false",
								},
							],
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "MAX_TOKENS",
						label: "Max Tokens",
						rules: { required: false },
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
					},
					{
						fieldName: "MAX_INPUT_TOKENS",
						label: "Max Input Tokens",
						rules: { required: false },
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
					},
				],
			},
			{
				name: "Replit code model – 3b",
				disable: false,
				icon: REPLIT,
				fields: [
					{
						fieldName: "NAME",
						label: "Catalog Name",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
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
						fieldName: "MODEL",
						label: "Model",
						defaultValue: "Replit code model – 3b",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "MODEL_TYPE",
						label: "Type",
						defaultValue: "",
						options: {
							component: "select",
							options: [
								{
									display: "Text Generation",
									value: "TEXT_GENERATION",
								},
								{
									display: "vLLM (Fast Chat)",
									value: "FAST_CHAT",
								},
							],
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "ENDPOINT",
						label: "Endpoint",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "VAR_NAME",
						label: "Variable Name",
						defaultValue: "modelVar",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "CHAT_TYPE",
						label: "Chat Type",
						defaultValue: "chat-completion",
						options: {
							component: "select",
							options: [
								{
									display: "chat-completion",
									value: "chat-completion",
								},
								{
									display: "completion",
									value: "completion",
								},
							],
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "INIT_MODEL_ENGINE",
						label: "Init Script",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "KEEP_CONVERSATION_HISTORY",
						label: "Keep Conversation History",
						defaultValue: "false",
						options: {
							component: "select",
							options: [
								{
									display: "true",
									value: "true",
								},
								{
									display: "false",
									value: "false",
								},
							],
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "KEEP_INPUT_OUTPUT",
						label: "Record Questions and Responses",
						defaultValue: "false",
						options: {
							component: "select",
							options: [
								{
									display: "true",
									value: "true",
								},
								{
									display: "false",
									value: "false",
								},
							],
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "MAX_TOKENS",
						label: "Max Tokens",
						rules: { required: false },
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
					},
					{
						fieldName: "MAX_INPUT_TOKENS",
						label: "Max Input Tokens",
						rules: { required: false },
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
					},
				],
			},
			{
				name: "StableBeluga2",
				disable: false,
				icon: BRAIN,
				fields: [
					{
						fieldName: "NAME",
						label: "Catalog Name",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
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
						fieldName: "MODEL",
						label: "Model",
						defaultValue: "StableBeluga2",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "MODEL_TYPE",
						label: "Type",
						defaultValue: "",
						options: {
							component: "select",
							options: [
								{
									display: "Text Generation",
									value: "TEXT_GENERATION",
								},
								{
									display: "vLLM (Fast Chat)",
									value: "FAST_CHAT",
								},
							],
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "ENDPOINT",
						label: "Endpoint",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "VAR_NAME",
						label: "Variable Name",
						defaultValue: "modelVar",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "CHAT_TYPE",
						label: "Chat Type",
						defaultValue: "chat-completion",
						options: {
							component: "select",
							options: [
								{
									display: "chat-completion",
									value: "chat-completion",
								},
								{
									display: "completion",
									value: "completion",
								},
							],
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "INIT_MODEL_ENGINE",
						label: "Init Script",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "KEEP_CONVERSATION_HISTORY",
						label: "Keep Conversation History",
						defaultValue: "false",
						options: {
							component: "select",
							options: [
								{
									display: "true",
									value: "true",
								},
								{
									display: "false",
									value: "false",
								},
							],
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "KEEP_INPUT_OUTPUT",
						label: "Record Questions and Responses",
						defaultValue: "false",
						options: {
							component: "select",
							options: [
								{
									display: "true",
									value: "true",
								},
								{
									display: "false",
									value: "false",
								},
							],
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "MAX_TOKENS",
						label: "Max Tokens",
						rules: { required: false },
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
					},
					{
						fieldName: "MAX_INPUT_TOKENS",
						label: "Max Input Tokens",
						rules: { required: false },
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
					},
				],
			},
			{
				name: "Vicuna",
				disable: false,
				icon: VICUNA,
				fields: [
					{
						fieldName: "NAME",
						label: "Catalog Name",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
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
						fieldName: "MODEL",
						label: "Model",
						defaultValue: "Vicuna",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "MODEL_TYPE",
						label: "Type",
						defaultValue: "",
						options: {
							component: "select",
							options: [
								{
									display: "Text Generation",
									value: "TEXT_GENERATION",
								},
								{
									display: "vLLM (Fast Chat)",
									value: "FAST_CHAT",
								},
							],
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "ENDPOINT",
						label: "Endpoint",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "VAR_NAME",
						label: "Variable Name",
						defaultValue: "modelVar",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "CHAT_TYPE",
						label: "Chat Type",
						defaultValue: "chat-completion",
						options: {
							component: "select",
							options: [
								{
									display: "chat-completion",
									value: "chat-completion",
								},
								{
									display: "completion",
									value: "completion",
								},
							],
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "INIT_MODEL_ENGINE",
						label: "Init Script",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "KEEP_CONVERSATION_HISTORY",
						label: "Keep Conversation History",
						defaultValue: "false",
						options: {
							component: "select",
							options: [
								{
									display: "true",
									value: "true",
								},
								{
									display: "false",
									value: "false",
								},
							],
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "KEEP_INPUT_OUTPUT",
						label: "Record Questions and Responses",
						defaultValue: "false",
						options: {
							component: "select",
							options: [
								{
									display: "true",
									value: "true",
								},
								{
									display: "false",
									value: "false",
								},
							],
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "MAX_TOKENS",
						label: "Max Tokens",
						rules: { required: false },
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
					},
					{
						fieldName: "MAX_INPUT_TOKENS",
						label: "Max Input Tokens",
						rules: { required: false },
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
					},
				],
			},
			{
				name: "Wizard 13B",
				disable: false,
				icon: BRAIN,
				fields: [
					{
						fieldName: "NAME",
						label: "Catalog Name",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
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
						fieldName: "MODEL",
						label: "Model",
						defaultValue: "Wizard 13B",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "MODEL_TYPE",
						label: "Type",
						defaultValue: "",
						options: {
							component: "select",
							options: [
								{
									display: "Text Generation",
									value: "TEXT_GENERATION",
								},
								{
									display: "vLLM (Fast Chat)",
									value: "FAST_CHAT",
								},
							],
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "ENDPOINT",
						label: "Endpoint",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "VAR_NAME",
						label: "Variable Name",
						defaultValue: "modelVar",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "CHAT_TYPE",
						label: "Chat Type",
						defaultValue: "chat-completion",
						options: {
							component: "select",
							options: [
								{
									display: "chat-completion",
									value: "chat-completion",
								},
								{
									display: "completion",
									value: "completion",
								},
							],
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "INIT_MODEL_ENGINE",
						label: "Init Script",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "KEEP_CONVERSATION_HISTORY",
						label: "Keep Conversation History",
						defaultValue: "false",
						options: {
							component: "select",
							options: [
								{
									display: "true",
									value: "true",
								},
								{
									display: "false",
									value: "false",
								},
							],
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "KEEP_INPUT_OUTPUT",
						label: "Record Questions and Responses",
						defaultValue: "false",
						options: {
							component: "select",
							options: [
								{
									display: "true",
									value: "true",
								},
								{
									display: "false",
									value: "false",
								},
							],
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "MAX_TOKENS",
						label: "Max Tokens",
						rules: { required: false },
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
					},
					{
						fieldName: "MAX_INPUT_TOKENS",
						label: "Max Input Tokens",
						rules: { required: false },
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
					},
				],
			},
			{
				name: "Wizard Coder",
				disable: false,
				icon: BRAIN,
				fields: [
					{
						fieldName: "NAME",
						label: "Catalog Name",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
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
						fieldName: "MODEL",
						label: "Model",
						defaultValue: "WizardLM/WizardCoder-15B-V1.0",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "MODEL_TYPE",
						label: "Type",
						defaultValue: "",
						options: {
							component: "select",
							options: [
								{
									display: "Text Generation",
									value: "TEXT_GENERATION",
								},
								{
									display: "vLLM (Fast Chat)",
									value: "FAST_CHAT",
								},
							],
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "ENDPOINT",
						label: "Endpoint",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "VAR_NAME",
						label: "Variable Name",
						defaultValue: "modelVar",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "CHAT_TYPE",
						label: "Chat Type",
						defaultValue: "chat-completion",
						options: {
							component: "select",
							options: [
								{
									display: "chat-completion",
									value: "chat-completion",
								},
								{
									display: "completion",
									value: "completion",
								},
							],
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "INIT_MODEL_ENGINE",
						label: "Init Script",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "KEEP_CONVERSATION_HISTORY",
						label: "Keep Conversation History",
						defaultValue: "false",
						options: {
							component: "select",
							options: [
								{
									display: "true",
									value: "true",
								},
								{
									display: "false",
									value: "false",
								},
							],
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "KEEP_INPUT_OUTPUT",
						label: "Record Questions and Responses",
						defaultValue: "false",
						options: {
							component: "select",
							options: [
								{
									display: "true",
									value: "true",
								},
								{
									display: "false",
									value: "false",
								},
							],
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "MAX_TOKENS",
						label: "Max Tokens",
						rules: { required: false },
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
					},
					{
						fieldName: "MAX_INPUT_TOKENS",
						label: "Max Input Tokens",
						rules: { required: false },
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
					},
				],
			},
		],
		Embedded: [
			{
				name: "NeMo",
				disable: true,
				icon: NEMO,
				fields: [],
			},
			{
				name: "Orca",
				disable: false,
				icon: ORCA,
				fields: [
					{
						fieldName: "NAME",
						label: "Catalog Name",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
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
						fieldName: "MODEL",
						label: "Model",
						defaultValue: "Orca",
						options: {
							component: "text-field",
						},
						disabled: true,
						rules: { required: true },
					},
					{
						fieldName: "MODEL_TYPE",
						label: "Type",
						defaultValue: "",
						options: {
							component: "select",
							options: [
								{
									display: "Embedded",
									value: "EMBEDDED",
								},
							],
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "ENDPOINT",
						label: "Endpoint",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "VAR_NAME",
						label: "Variable Name",
						defaultValue: "modelVar",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "CHAT_TYPE",
						label: "Chat Type",
						defaultValue: "chat-completion",
						options: {
							component: "select",
							options: [
								{
									display: "chat-completion",
									value: "chat-completion",
								},
								{
									display: "completion",
									value: "completion",
								},
							],
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "INIT_MODEL_ENGINE",
						label: "Init Script",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "KEEP_CONVERSATION_HISTORY",
						label: "Keep Conversation History",
						defaultValue: "false",
						options: {
							component: "select",
							options: [
								{
									display: "true",
									value: "true",
								},
								{
									display: "false",
									value: "false",
								},
							],
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "KEEP_INPUT_OUTPUT",
						label: "Record Questions and Responses",
						defaultValue: "false",
						options: {
							component: "select",
							options: [
								{
									display: "true",
									value: "true",
								},
								{
									display: "false",
									value: "false",
								},
							],
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "MAX_TOKENS",
						label: "Max Tokens",
						rules: { required: false },
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
					},
					{
						fieldName: "MAX_INPUT_TOKENS",
						label: "Max Input Tokens",
						rules: { required: false },
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
					},
				],
			},
			{
				name: "AWS TITAN TEXT EMBEDDINGS",
				disable: true,
				icon: Amazon_Titan,
				fields: [
					{
						fieldName: "NAME",
						label: "Name",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "MODEL_TYPE",
						label: "Type",
						defaultValue: "AWS_TITAN_TEXT_EMBEDDINGS",
						options: {
							component: "select",
							options: [
								{
									display: "AWS TITAN TEXT EMBEDDINGS",
									value: "AWS_TITAN_TEXT_EMBEDDINGS",
								},
							],
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "MODEL",
						label: "Model",
						defaultValue: "amazon.titan-embed-text-v2:0",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "VAR_NAME",
						label: "Variable Name",
						defaultValue: "modelVar",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "INIT_MODEL_ENGINE",
						label: "Init Script",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "AWS_REGION",
						label: "Aws Region",
						defaultValue: "us-east-1",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "AWS_ACCESS_KEY",
						label: "Aws Access Key",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "AWS_SECRET_KEY",
						label: "Aws Secret Key",
						defaultValue: "",
						options: {
							component: "password",
						},
						disabled: false,
						rules: { required: true },
					},
				],
			},
			{
				name: "Stablity AI",
				disable: true,
				icon: STABILITY_AI,
				fields: [
					{
						fieldName: "NAME",
						label: "Catalog Name",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
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
						fieldName: "MODEL",
						label: "Model",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: true,
						rules: { required: true },
					},
					{
						fieldName: "MODEL_TYPE",
						label: "Type",
						defaultValue: "",
						options: {
							component: "select",
							options: [
								{
									display: "Embedded",
									value: "EMBEDDED",
								},
							],
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "ENDPOINT",
						label: "Endpoint",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "VAR_NAME",
						label: "Variable Name",
						defaultValue: "modelVar",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "CHAT_TYPE",
						label: "Chat Type",
						defaultValue: "chat-completion",
						options: {
							component: "select",
							options: [
								{
									display: "chat-completion",
									value: "chat-completion",
								},
								{
									display: "completion",
									value: "completion",
								},
							],
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "INIT_MODEL_ENGINE",
						label: "Init Script",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "KEEP_CONVERSATION_HISTORY",
						label: "Keep Conversation History",
						defaultValue: "false",
						options: {
							component: "select",
							options: [
								{
									display: "true",
									value: "true",
								},
								{
									display: "false",
									value: "false",
								},
							],
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "KEEP_INPUT_OUTPUT",
						label: "Record Questions and Responses",
						defaultValue: "false",
						options: {
							component: "select",
							options: [
								{
									display: "true",
									value: "true",
								},
								{
									display: "false",
									value: "false",
								},
							],
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "MAX_TOKENS",
						label: "Max Tokens",
						rules: { required: false },
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
					},
					{
						fieldName: "MAX_INPUT_TOKENS",
						label: "Max Input Tokens",
						rules: { required: false },
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
					},
				],
			},
			{
				name: "Replit Code Model",
				disable: true,
				icon: REPLIT,
				fields: [
					{
						fieldName: "NAME",
						label: "Catalog Name",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
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
						fieldName: "MODEL",
						label: "Model",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: true,
						rules: { required: true },
					},
					{
						fieldName: "MODEL_TYPE",
						label: "Type",
						defaultValue: "",
						options: {
							component: "select",
							options: [
								{
									display: "Embedded",
									value: "EMBEDDED",
								},
							],
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "ENDPOINT",
						label: "Endpoint",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "VAR_NAME",
						label: "Variable Name",
						defaultValue: "modelVar",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "CHAT_TYPE",
						label: "Chat Type",
						defaultValue: "chat-completion",
						options: {
							component: "select",
							options: [
								{
									display: "chat-completion",
									value: "chat-completion",
								},
								{
									display: "completion",
									value: "completion",
								},
							],
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "INIT_MODEL_ENGINE",
						label: "Init Script",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "KEEP_CONVERSATION_HISTORY",
						label: "Keep Conversation History",
						defaultValue: "false",
						options: {
							component: "select",
							options: [
								{
									display: "true",
									value: "true",
								},
								{
									display: "false",
									value: "false",
								},
							],
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "KEEP_INPUT_OUTPUT",
						label: "Record Questions and Responses",
						defaultValue: "false",
						options: {
							component: "select",
							options: [
								{
									display: "true",
									value: "true",
								},
								{
									display: "false",
									value: "false",
								},
							],
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "MAX_TOKENS",
						label: "Max Tokens",
						rules: { required: false },
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
					},
					{
						fieldName: "MAX_INPUT_TOKENS",
						label: "Max Input Tokens",
						rules: { required: false },
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
					},
				],
			},
		],
		"File Uploads": [
			{
				name: "ZIP",
				disable: false,
				icon: ZIP,
				fields: [
					{
						fieldName: "ZIP",
						label: "Zip File",
						defaultValue: null,
						options: {
							component: "zip-upload",
						},
						disabled: false,
						rules: { required: true },
					},
				],
			},
		],
	},
};

export const ENGINE_IMAGES = {
	MODEL: [
		{
			name: "OPEN_AI",
			icon: OPEN_AI,
		},
		{
			name: "GPT-3.5",
			icon: OPEN_AI,
		},
		{
			name: "GPT-4",
			icon: OPEN_AI,
		},
		{
			name: "Text-Davinci",
			icon: OPEN_AI,
		},
		{
			name: "DALL E",
			icon: OPEN_AI,
		},
		{
			name: "Azure Open AI",

			icon: AZURE_OPEN_AI,
		},
		{
			name: "Claude",
			icon: CLAUDE,
		},
		{
			name: "Palm Bison",
			icon: VERTEX,
		},
		{
			name: "Palm Chat Bison",
			icon: VERTEX,
		},
		{
			name: "Palm Code Bison",
			icon: VERTEX,
		},
		{
			name: "Wizard 13B",
			icon: BRAIN,
		},
		{
			name: "Llama2 7B",
			icon: META,
		},
		{
			name: "Llama2 13B",
			icon: META,
		},
		{
			name: "Llama2 70B",
			icon: META,
		},
		{
			name: "Falcon",
			icon: FALCON,
		},
		{
			name: "StableBeluga2",
			icon: BRAIN,
		},
		{
			name: "Guanaco",
			icon: BRAIN,
		},
		{
			name: "Vicuna",
			icon: VICUNA,
		},
		{
			name: "Mosaic ML",
			icon: MOSAIC,
		},
		{
			name: "Dolly",
			icon: DOLLY,
		},
		{
			name: "Replit code model – 3b",
			icon: REPLIT,
		},
		{
			name: "Flan T5 Large",
			icon: FLAN,
		},
		{
			name: "Flan T5 XXL",
			icon: FLAN,
		},
		{
			name: "Bert",
			icon: BERT,
		},
		{
			name: "Eleuther GPTJ",
			icon: ELEUTHER,
		},
		{
			name: "Wizard Coder",
			icon: BRAIN,
		},
		{
			name: "NeMo",
			icon: NEMO,
		},
		{
			name: "Orca",
			icon: ORCA,
		},
		{
			name: "AWS_TITAN_TEXT_EMBEDDINGS",
			icon: Amazon_Titan,
		},
		{
			name: "Stablity AI",
			icon: STABILITY_AI,
		},
		{
			name: "Replit Code Model",
			icon: REPLIT,
		},
		{
			name: "NeMo",
			icon: NEMO,
		},
		{
			name: "ZIP",
			icon: ZIP,
		},
	],
};
