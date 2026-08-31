import AWS_COMPREHEND from "@/assets/img/AWS_COMPREHEND.png";
import AWS_POLLY from "@/assets/img/AWS_POLLY.png";
import AWS_TEXTRACT from "@/assets/img/AWS_TEXTRACT.png";
import AWS_TRANSCRIBE from "@/assets/img/AWS_TRANSCRIBE.png";
import AZURE_SPEECH_TO_TEXT from "@/assets/img/AZURE_SPEECH_TO_TEXT.png";
import BING_SEARCH from "@/assets/img/BING_SEARCH.svg";
import BRAVE_SEARCH from "@/assets/img/BRAVE_SEARCH.svg";
import EXCHANGE_IMAP from "@/assets/img/EXCHANGE_IMAP.svg";
import EXCHANGE_POP3 from "@/assets/img/EXCHANGE_POP3.svg";
import EXCHANGE_SMTP from "@/assets/img/EXCHANGE_SMTP.svg";
import GOOGLE_OCR from "@/assets/img/GOOGLE_OCR.png";
import GOOGLE_SPEECH_TO_TEXT from "@/assets/img/GOOGLE_SPEECH_TO_TEXT.png";
import IMAP from "@/assets/img/IMAP.svg";
import POP3 from "@/assets/img/POP3.svg";
import PYTHON from "@/assets/img/PYTHON.svg";
import RESTAPI from "@/assets/img/REST-API.svg";
import SERVICE_NOW from "@/assets/img/SERVICE_NOW.svg";
import SMTP from "@/assets/img/SMTP.svg";

export const FUNCTION_CONNECTIONS = {
	description: {
		General:
			"Choose between hosted OpenAI services for managed reliability, or custom-deployed environments for greater control over API usage and performance.",
		Settings:
			"Configure your model type, deployment parameters, and response behavior to align with your specific OpenAI integration.",
		Credentials:
			"Enter your OpenAI API key to securely authenticate and enable access to the OpenAI endpoints.",
		"Function Metadata":
			"What a model sees when it picks this function out of a tool list: the name it calls, what the function says it does, and the parameters it takes. Every function type fills these in for itself, so set them only to override that wording.",
	},
	Functions: [
		{
			name: "AWS Comprehend",
			disable: false,
			icon: AWS_COMPREHEND,
			description: "Natural language processing using Amazon Comprehend",
			link: "https://docs.aws.amazon.com/comprehend/latest/dg/what-is.html",
			fields: [
				{
					key: "FUNCTION_TYPE",
					label: "Function Type",
					value: "AWS_COMPREHEND",
					type: "text",
					disabled: true,
					hidden: true,
					required: true,
					category: "General",
				},
				{
					key: "NAME",
					label: "Catalog Name",
					value: "",
					type: "text",
					disabled: false,
					required: true,
					rules: {
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
					key: "ACCESS_KEY",
					label: "Access Key",
					value: "",
					type: "text",
					disabled: false,
					required: true,
					category: "Credentials",
				},
				{
					key: "SECRET_KEY",
					label: "Secret Key",
					value: "",
					type: "text",
					disabled: false,
					required: true,
					category: "Credentials",
				},
				{
					key: "REGION",
					label: "Region",
					value: "",
					type: "text",
					disabled: false,
					required: true,
					category: "Settings",
				},
			],
		},
		{
			name: "AWS Image Text Extraction",
			disable: false,
			icon: AWS_TEXTRACT,
			description: "Extracts text from images using Amazon Textract",
			link: "https://docs.aws.amazon.com/textract/latest/dg/what-is.html",
			fields: [
				{
					key: "FUNCTION_TYPE",
					label: "Function Type",
					value: "AWS_TEXTRACT",
					type: "select",
					options: [
						{
							display: "AWS TEXTRACT",
							value: "AWS_TEXTRACT",
						},
						{
							display: "AWS REKOGNITION",
							value: "AWS_REKOGNITION",
						},
					],
					disabled: false,
					hidden: false,
					required: true,
					category: "General",
				},
				{
					key: "NAME",
					label: "Catalog Name",
					value: "",
					type: "text",
					disabled: false,
					required: true,
					rules: {
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
					key: "ACCESS_KEY",
					label: "Access Key",
					value: "",
					type: "text",
					disabled: false,
					required: true,
					category: "Credentials",
				},
				{
					key: "SECRET_KEY",
					label: "Secret Key",
					value: "",
					type: "password",
					disabled: false,
					required: true,
					category: "Credentials",
				},
				{
					key: "REGION",
					label: "Region",
					value: "",
					type: "text",
					disabled: false,
					required: true,
					category: "Settings",
				},
				{
					key: "S3BUCKETENGINEID",
					label: "S3 Bucket Engine Id",
					value: "",
					type: "text",
					disabled: false,
					required: true,
					category: "Settings",
				},
			],
		},
		{
			name: "AWS Polly",
			disable: false,
			icon: AWS_POLLY,
			description: "Converts text to lifelike speech using Amazon Polly",
			link: "https://docs.aws.amazon.com/polly/latest/dg/what-is.html",
			fields: [
				{
					key: "FUNCTION_TYPE",
					label: "Function Type",
					value: "AWS_POLLY",
					type: "text",
					disabled: true,
					hidden: true,
					required: true,
					category: "General",
				},
				{
					key: "NAME",
					label: "Catalog Name",
					rules: {
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
					value: "",
					type: "text",
					disabled: false,
					required: true,
					category: "General",
				},
				{
					key: "ACCESS_KEY",
					label: "Access Key",
					value: "",
					type: "text",
					disabled: false,
					required: true,
					category: "Credentials",
				},
				{
					key: "SECRET_KEY",
					label: "Secret Key",
					value: "",
					type: "password",
					disabled: false,
					required: true,
					category: "Credentials",
				},
				{
					key: "REGION",
					label: "Region",
					value: "",
					type: "text",
					disabled: false,
					required: true,
					category: "Settings",
				},
			],
		},
		{
			name: "AWS Transcribe",
			disable: false,
			icon: AWS_TRANSCRIBE,
			description: "Converts speech to text using Amazon Transcribe",
			link: "https://docs.aws.amazon.com/transcribe/latest/dg/what-is.html",
			fields: [
				{
					key: "FUNCTION_TYPE",
					label: "Function Type",
					value: "AWS_TRANSCRIBE",
					type: "text",
					disabled: true,
					hidden: true,
					required: true,
					category: "General",
				},
				{
					key: "NAME",
					label: "Catalog Name",
					value: "",
					type: "text",
					disabled: false,
					required: true,
					rules: {
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
					key: "ACCESS_KEY",
					label: "Access Key",
					value: "",
					type: "text",
					disabled: false,
					required: true,
					category: "Credentials",
				},
				{
					key: "SECRET_KEY",
					label: "Secret Key",
					value: "",
					type: "password",
					disabled: false,
					required: true,
					category: "Credentials",
				},
				{
					key: "REGION",
					label: "Region",
					value: "",
					type: "text",
					disabled: false,
					required: true,
					category: "Settings",
				},
				{
					key: "S3BUCKETENGINEID",
					label: "S3 Bucket Engine Id",
					value: "",
					type: "text",
					disabled: false,
					required: true,
					category: "Settings",
				},
			],
		},
		{
			name: "Azure Document Intelligence",
			disable: false,
			icon: RESTAPI,
			description:
				"Extracts text and data from documents using Azure Document Intelligence",
			link: "https://learn.microsoft.com/en-us/azure/cognitive-services/form-recognizer/overview",
			fields: [
				{
					key: "FUNCTION_TYPE",
					label: "Function Type",
					value: "AZURE_DOCUMENT_INTELLIGENCE_CUSTOM_EMBEDDINGS",
					type: "text",
					disabled: true,
					hidden: true,
					required: true,
					category: "General",
				},
				{
					key: "NAME",
					label: "Catalog Name",
					value: "",
					type: "text",
					disabled: false,
					required: true,
					rules: {
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
					key: "URL",
					label: "URL",
					value: "",
					type: "text",
					disabled: false,
					required: true,
					category: "Credentials",
				},
				{
					key: "API_KEY",
					label: "API Key",
					value: "",
					type: "text",
					disabled: false,
					required: true,
					category: "Credentials",
				},
			],
		},
		{
			name: "Azure Speech To Text",
			disable: false,
			icon: AZURE_SPEECH_TO_TEXT,
			description: "Converts speech to text using Azure Speech to Text",
			link: "https://learn.microsoft.com/en-us/azure/ai-services/speech-service/index-text-to-speech",
			fields: [
				{
					key: "FUNCTION_TYPE",
					label: "Function Type",
					value: "AZURE_SPEECH_TO_TEXT",
					type: "text",
					disabled: true,
					hidden: true,
					required: true,
					category: "General",
				},
				{
					key: "NAME",
					label: "Catalog Name",
					value: "",
					type: "text",
					disabled: false,
					required: true,
					rules: {
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
					key: "SPEECH_KEY",
					label: "Speech Key",
					value: "",
					type: "text",
					disabled: false,
					required: true,
					category: "Credentials",
				},
				{
					key: "SPEECH_REGION",
					label: "Speech region",
					value: "",
					type: "text",
					disabled: false,
					required: true,
					category: "Settings",
				},
			],
		},
		{
			name: "Bing Web Search (Foundry)",
			disable: false,
			icon: BING_SEARCH,
			description:
				"Ground answers in the public web through the Foundry web_search tool. Returns a written answer with citations rather than a result list.",
			link: "https://learn.microsoft.com/en-us/azure/foundry-classic/agents/how-to/tools-classic/bing-grounding?view=azure-python-preview&tabs=python&pivots=overview",
			notice: "This calls a model deployment that reads the web for you, so a search costs a model call plus a grounding tool call and returns prose with citations. For raw title/url/snippet results, use Brave Web Search instead.",
			fields: [
				{
					key: "FUNCTION_TYPE",
					label: "Function Type",
					value: "BING_SEARCH",
					type: "text",
					disabled: true,
					hidden: true,
					required: true,
					category: "General",
				},
				{
					key: "NAME",
					label: "Catalog Name",
					value: "",
					type: "text",
					disabled: false,
					required: true,
					rules: {
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
					key: "ENDPOINT",
					label: "Resource Endpoint",
					value: "",
					type: "text",
					disabled: false,
					required: true,
					helperText:
						"The Azure OpenAI resource, ie https://YOUR-RESOURCE.openai.azure.com. The /openai/v1/responses path is added if you leave it off. See learn.microsoft.com/azure/foundry/openai/how-to/web-search",
					category: "Credentials",
				},
				{
					key: "MODEL",
					label: "Model Deployment Name",
					value: "",
					type: "text",
					disabled: false,
					required: true,
					helperText:
						"The deployment that performs the search, ie gpt-5.5. Must be GPT-4 or later.",
					category: "Credentials",
				},
				{
					key: "AUTH_TYPE",
					label: "Authentication Type",
					value: "api_key",
					type: "select",
					options: [
						{
							display: "API Key",
							value: "api_key",
						},
						{
							display: "Microsoft Entra ID",
							value: "entra",
						},
					],
					disabled: false,
					required: true,
					helperText:
						"API key sends the value below on the api-key header. Entra ID sends it as a bearer token.",
					category: "Credentials",
				},
				{
					key: "API_KEY",
					label: "API Key or Entra Token",
					value: "",
					type: "password",
					disabled: false,
					required: true,
					helperText:
						"For Entra ID the token scope must be https://ai.azure.com/.default",
					category: "Credentials",
				},
				{
					key: "ALLOWED_DOMAINS",
					label: "Allowed Domains",
					value: "",
					type: "text",
					disabled: false,
					required: false,
					helperText:
						"Comma separated list, up to 100, ie who.int,cdc.gov. Subdomains are included. Leave blank to search the whole web.",
					category: "Settings",
				},
				{
					key: "BLOCKED_DOMAINS",
					label: "Blocked Domains",
					value: "",
					type: "text",
					disabled: false,
					required: false,
					helperText:
						"Comma separated list of domains to exclude from results.",
					category: "Settings",
				},
				{
					key: "SEARCH_CONTEXT_SIZE",
					label: "Search Context Size",
					value: "medium",
					type: "select",
					options: [
						{
							display: "low",
							value: "low",
						},
						{
							display: "medium",
							value: "medium",
						},
						{
							display: "high",
							value: "high",
						},
					],
					disabled: false,
					required: false,
					helperText:
						"How much web content the model reads before answering. Higher is more thorough and more expensive.",
					category: "Settings",
				},
				{
					key: "REASONING_EFFORT",
					label: "Reasoning Effort",
					value: "",
					type: "text",
					disabled: false,
					required: false,
					helperText:
						"Only for reasoning model deployments, ie low, medium, high. Higher lets the model search repeatedly and take longer. Leave blank for a plain lookup.",
					category: "Settings",
				},
				{
					key: "COUNTRY",
					label: "Country",
					value: "",
					type: "text",
					disabled: false,
					required: false,
					helperText:
						"Two letter country code to search from, ie US. Leave blank for no country preference.",
					category: "Settings",
				},
				{
					key: "REGION",
					label: "Region",
					value: "",
					type: "text",
					disabled: false,
					required: false,
					helperText:
						"Region or state name, ie Illinois. Only used alongside a country.",
					category: "Settings",
				},
				{
					key: "CITY",
					label: "City",
					value: "",
					type: "text",
					disabled: false,
					required: false,
					helperText: "City name, ie Chicago.",
					category: "Settings",
				},
				{
					key: "TIMEZONE",
					label: "Time Zone",
					value: "",
					type: "text",
					disabled: false,
					required: false,
					helperText:
						"IANA time zone identifier, ie America/Chicago. Helps the model resolve words like today.",
					category: "Settings",
				},
				{
					key: "INSTRUCTION",
					label: "Search Instruction",
					value: "",
					type: "text",
					disabled: false,
					required: false,
					helperText:
						"Prepended to every query to push the model to actually search rather than answer from memory. Leave blank to use the built in instruction.",
					category: "Settings",
				},
				{
					key: "FUNCTION_NAME",
					label: "Function Name",
					value: "",
					type: "text",
					disabled: false,
					required: true,
					helperText:
						"Becomes the MCP tool name, so name it for what it does, ie web_research.",
					category: "Function Metadata",
				},
				{
					key: "FUNCTION_DESCRIPTION",
					label: "Function Description",
					value: "",
					type: "text",
					disabled: false,
					required: false,
					helperText:
						"Leave blank to use the built in description of what a grounded search returns.",
					category: "Function Metadata",
				},
				{
					key: "FUNCTION_PARAMETERS",
					label: "Function Parameters",
					value: [],
					type: "parameter-list",
					disabled: false,
					required: false,
					helperText:
						"Leave empty to use the built in search parameters: query and country.",
					category: "Function Metadata",
				},
				{
					key: "FUNCTION_REQUIRED_PARAMETERS",
					label: "Function Required Parameters",
					value: [],
					type: "string-list",
					disabled: false,
					required: false,
					helperText:
						"List the names of parameters above that must be provided when calling this function.",
					category: "Function Metadata",
				},
			],
		},
		{
			name: "Brave Web Search",
			disable: false,
			icon: BRAVE_SEARCH,
			description:
				"Search the public web and get back ranked results as title, url, and snippet. Gives a model web search it does not have on its own.",
			link: "https://api-dashboard.search.brave.com/app/documentation/web-search/get-started",
			fields: [
				{
					key: "FUNCTION_TYPE",
					label: "Function Type",
					value: "BRAVE_SEARCH",
					type: "text",
					disabled: true,
					hidden: true,
					required: true,
					category: "General",
				},
				{
					key: "NAME",
					label: "Catalog Name",
					value: "",
					type: "text",
					disabled: false,
					required: true,
					rules: {
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
					key: "API_KEY",
					label: "Subscription Token",
					value: "",
					type: "password",
					disabled: false,
					required: true,
					helperText:
						"The token for the Brave Search API plan, sent as the X-Subscription-Token header.",
					category: "Credentials",
				},
				{
					key: "ENDPOINT",
					label: "Search Endpoint",
					value: "https://api.search.brave.com/res/v1/web/search",
					type: "text",
					disabled: false,
					required: false,
					helperText:
						"Change this only when routing through a proxy that mirrors the Brave web search route.",
					category: "Credentials",
				},
				{
					key: "COUNT",
					label: "Default Result Count",
					value: "5",
					type: "number",
					disabled: false,
					required: false,
					helperText:
						"Results returned when the caller does not ask for a specific number. A single search is capped at 20.",
					category: "Settings",
				},
				{
					key: "COUNTRY",
					label: "Country",
					value: "",
					type: "text",
					disabled: false,
					required: false,
					helperText:
						"Two letter country code to search from, ie US. Leave blank for no country preference.",
					category: "Settings",
				},
				{
					key: "SEARCH_LANGUAGE",
					label: "Search Language",
					value: "",
					type: "text",
					disabled: false,
					required: false,
					helperText:
						"Two letter language code the results should be written in, ie en. Leave blank for any language.",
					category: "Settings",
				},
				{
					key: "UI_LANGUAGE",
					label: "Response Metadata Language",
					value: "",
					type: "text",
					disabled: false,
					required: false,
					helperText:
						"Language for labels in the response itself, ie en-US. Rarely needs setting.",
					category: "Settings",
				},
				{
					key: "SAFE_SEARCH",
					label: "Safe Search",
					value: "moderate",
					type: "select",
					options: [
						{
							display: "off",
							value: "off",
						},
						{
							display: "moderate",
							value: "moderate",
						},
						{
							display: "strict",
							value: "strict",
						},
					],
					disabled: false,
					required: false,
					helperText:
						"How aggressively adult content is filtered out of the results.",
					category: "Settings",
				},
				{
					key: "FRESHNESS",
					label: "Default Freshness",
					value: "",
					type: "text",
					disabled: false,
					required: false,
					helperText:
						"Restricts every search to recent results. Use pd for the last day, pw week, pm month, py year, or a YYYY-MM-DDtoYYYY-MM-DD range. Leave blank for no restriction.",
					category: "Settings",
				},
				{
					key: "EXTRA_SNIPPETS",
					label: "Extra Snippets",
					value: "false",
					type: "select",
					options: [
						{
							display: "false",
							value: "false",
						},
						{
							display: "true",
							value: "true",
						},
					],
					disabled: false,
					required: false,
					helperText:
						"Return up to five additional excerpts per result. More grounding per source, at the cost of more tokens. Requires a plan that includes it.",
					category: "Settings",
				},
				{
					key: "SNIPPET_LENGTH",
					label: "Snippet Character Limit",
					value: "",
					type: "number",
					disabled: false,
					required: false,
					helperText:
						"Trims each result snippet to this many characters so a wide search cannot fill up a model's context. Leave blank to return the full snippet.",
					category: "Settings",
				},
				{
					key: "FUNCTION_NAME",
					label: "Function Name",
					value: "",
					type: "text",
					disabled: false,
					required: true,
					helperText:
						"Becomes the MCP tool name, so name it for what it does, ie web_search.",
					category: "Function Metadata",
				},
				{
					key: "FUNCTION_DESCRIPTION",
					label: "Function Description",
					value: "",
					type: "text",
					disabled: false,
					required: false,
					helperText:
						"Leave blank to use the built in description of what a web search returns.",
					category: "Function Metadata",
				},
				{
					key: "FUNCTION_PARAMETERS",
					label: "Function Parameters",
					value: [],
					type: "parameter-list",
					disabled: false,
					required: false,
					helperText:
						"Leave empty to use the built in search parameters: query, limit, page, country, freshness, and safeSearch.",
					category: "Function Metadata",
				},
				{
					key: "FUNCTION_REQUIRED_PARAMETERS",
					label: "Function Required Parameters",
					value: [],
					type: "string-list",
					disabled: false,
					required: false,
					helperText:
						"List the names of parameters above that must be provided when calling this function.",
					category: "Function Metadata",
				},
			],
		},
		{
			name: "Exchange Mailbox (IMAP)",
			disable: false,
			icon: EXCHANGE_IMAP,
			description:
				"Read the email in a Microsoft 365 mailbox over IMAP, signing in with an Azure app registration rather than a mailbox password.",
			notice: "Exchange Online does not accept a mailbox password over IMAP, so this needs an app registration with the IMAP.AccessAsApp permission and admin consent, plus an Exchange grant for this mailbox (New-ServicePrincipal and Add-MailboxPermission). Without the mailbox grant a token is still issued and the sign in still fails.",
			fields: [
				{
					key: "FUNCTION_TYPE",
					label: "Function Type",
					value: "EXCHANGE_IMAP",
					type: "text",
					disabled: true,
					hidden: true,
					required: true,
					category: "General",
				},
				{
					key: "NAME",
					label: "Catalog Name",
					value: "",
					type: "text",
					disabled: false,
					required: true,
					rules: {
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
					key: "IMAP_USERNAME",
					label: "Mailbox Address",
					value: "",
					type: "text",
					disabled: false,
					required: true,
					helperText:
						"The mailbox to read, ie reports@yourdomain.com. Exchange has to have been told to let this application open this mailbox.",
					category: "Credentials",
				},
				{
					key: "EXCHANGE_TENANT",
					label: "Tenant Id",
					value: "",
					type: "text",
					disabled: false,
					required: true,
					helperText:
						"The directory (tenant) id of the Azure app registration, or the tenant domain.",
					category: "Credentials",
				},
				{
					key: "EXCHANGE_CLIENT_ID",
					label: "Client Id",
					value: "",
					type: "text",
					disabled: false,
					required: true,
					helperText:
						"The application (client) id of the app registration.",
					category: "Credentials",
				},
				{
					key: "EXCHANGE_CLIENT_SECRET",
					label: "Client Secret",
					value: "",
					type: "password",
					disabled: false,
					required: true,
					helperText:
						"A client secret on the app registration. Secrets expire, so the engine stops reading when it does.",
					category: "Credentials",
				},
				{
					key: "EXCHANGE_SCOPE",
					label: "Token Scope",
					value: "",
					type: "text",
					disabled: false,
					required: false,
					helperText:
						"Optional. Defaults to https://outlook.office365.com/.default, which asks for whatever application permissions the app registration was granted.",
					category: "Credentials",
				},
				{
					key: "IMAP_HOST",
					label: "IMAP Host",
					value: "outlook.office365.com",
					type: "text",
					disabled: false,
					required: false,
					helperText:
						"Leave as is for Microsoft 365. Only change this for a different endpoint, such as a sovereign cloud.",
					category: "Credentials",
				},
				{
					key: "IMAP_PORT",
					label: "IMAP Port",
					value: "993",
					type: "number",
					disabled: false,
					required: false,
					helperText:
						"993, the encrypted IMAP port Exchange Online serves.",
					category: "Credentials",
				},
				{
					key: "DEFAULT_FOLDER",
					label: "Default Folder",
					value: "INBOX",
					type: "text",
					disabled: false,
					required: false,
					helperText:
						"The folder read when the caller does not name one.",
					category: "Settings",
				},
				{
					key: "ALLOWED_FOLDERS",
					label: "Allowed Folders",
					value: "",
					type: "text",
					disabled: false,
					required: false,
					helperText:
						"Comma separated list, ie INBOX,Archive. A call naming anything else is rejected. Leave blank to allow any folder of the mailbox.",
					category: "Settings",
				},
				{
					key: "MAX_MESSAGES",
					label: "Maximum Messages Per Call",
					value: "25",
					type: "number",
					disabled: false,
					required: false,
					helperText:
						"The most messages one call can return. Also caps how many messages a single mark, move, or delete can touch.",
					category: "Settings",
				},
				{
					key: "DEFAULT_MESSAGES",
					label: "Messages Returned By Default",
					value: "10",
					type: "number",
					disabled: false,
					required: false,
					helperText:
						"Used when the caller does not ask for a number. Cannot be more than the maximum above.",
					category: "Settings",
				},
				{
					key: "MAX_BODY_CHARS",
					label: "Maximum Body Characters",
					value: "10000",
					type: "number",
					disabled: false,
					required: false,
					helperText:
						"A longer message body comes back truncated, so one newsletter cannot fill a model's context window.",
					category: "Settings",
				},
				{
					key: "ALLOWED_SENDER_DOMAINS",
					label: "Allowed Sender Domains",
					value: "",
					type: "text",
					disabled: false,
					required: false,
					helperText:
						"Comma separated list, ie semoss.org. Subdomains are included. Mail from anyone else is not returned at all. Leave blank to surface every message.",
					category: "Settings",
				},
				{
					key: "ALLOW_ATTACHMENT_DOWNLOAD",
					label: "Allow Attachment Download",
					value: "false",
					type: "select",
					options: [
						{
							display: "false",
							value: "false",
						},
						{
							display: "true",
							value: "true",
						},
					],
					disabled: false,
					required: false,
					helperText:
						"When true, a caller can save the attachments of a message into the files of the insight making the call so they can be opened. When false the attachment names are listed but nothing is written.",
					category: "Settings",
				},
				{
					key: "MAX_ATTACHMENT_SIZE",
					label: "Maximum Attachment Size (bytes)",
					value: "5242880",
					type: "number",
					disabled: false,
					required: false,
					helperText:
						"An attachment larger than this is skipped rather than written. Only applies when attachment download is on.",
					category: "Settings",
				},
				{
					key: "MARK_AS_READ",
					label: "Mark Returned Messages As Read",
					value: "false",
					type: "select",
					options: [
						{
							display: "false",
							value: "false",
						},
						{
							display: "true",
							value: "true",
						},
					],
					disabled: false,
					required: false,
					helperText:
						"Leave false to read the mailbox without changing it. True marks every message this engine returns as read, which the owner of the mailbox will see.",
					category: "Settings",
				},
				{
					key: "ALLOW_FLAG_CHANGES",
					label: "Allow Marking Read Or Unread",
					value: "false",
					type: "select",
					options: [
						{
							display: "false",
							value: "false",
						},
						{
							display: "true",
							value: "true",
						},
					],
					disabled: false,
					required: false,
					helperText:
						"When true, a caller can mark a message read or unread by its uid. Leave false for an engine that only reads.",
					category: "Settings",
				},
				{
					key: "ALLOW_MOVE",
					label: "Allow Moving Messages",
					value: "false",
					type: "select",
					options: [
						{
							display: "false",
							value: "false",
						},
						{
							display: "true",
							value: "true",
						},
					],
					disabled: false,
					required: false,
					helperText:
						"When true, a caller can move a message to another folder. IMAP has no move, so this copies the message and then deletes the original.",
					category: "Settings",
				},
				{
					key: "ALLOW_DELETE",
					label: "Allow Deleting Messages",
					value: "false",
					type: "select",
					options: [
						{
							display: "false",
							value: "false",
						},
						{
							display: "true",
							value: "true",
						},
					],
					disabled: false,
					required: false,
					helperText:
						"When true, a caller can delete a message. There is no undo on the mail server, so leave this off unless deleting is the point of the engine.",
					category: "Settings",
				},
				{
					key: "CONNECTION_TIMEOUT",
					label: "Connection Timeout (ms)",
					value: "10000",
					type: "number",
					disabled: false,
					required: false,
					helperText:
						"How long to wait for the mail server to accept a connection.",
					category: "Settings",
				},
				{
					key: "READ_TIMEOUT",
					label: "Read Timeout (ms)",
					value: "30000",
					type: "number",
					disabled: false,
					required: false,
					helperText:
						"How long to wait on the mail server once connected.",
					category: "Settings",
				},
				{
					key: "FUNCTION_NAME",
					label: "Function Name",
					value: "",
					type: "text",
					disabled: false,
					required: true,
					helperText:
						"Becomes the MCP tool name, so name it for what it does, ie read_shared_inbox.",
					category: "Function Metadata",
				},
				{
					key: "FUNCTION_DESCRIPTION",
					label: "Function Description",
					value: "",
					type: "text",
					disabled: false,
					required: false,
					helperText:
						"Leave blank to use the built in description. Set it when this mailbox holds one kind of mail, so a model knows what it is reading.",
					category: "Function Metadata",
				},
				{
					key: "FUNCTION_PARAMETERS",
					label: "Function Parameters",
					value: [],
					type: "parameter-list",
					disabled: false,
					required: false,
					helperText:
						"Leave empty to use the built in parameters: folder, limit, from, subject, sinceDays, unreadOnly, and includeBody, plus action and uid for whichever changes are allowed above.",
					category: "Function Metadata",
				},
				{
					key: "FUNCTION_REQUIRED_PARAMETERS",
					label: "Function Required Parameters",
					value: [],
					type: "string-list",
					disabled: false,
					required: false,
					helperText:
						"List the names of parameters above that must be provided when calling this function.",
					category: "Function Metadata",
				},
			],
		},
		{
			name: "Exchange Mailbox (POP3)",
			disable: false,
			icon: EXCHANGE_POP3,
			description:
				"Read the email in a Microsoft 365 mailbox over POP3, signing in with an Azure app registration rather than a mailbox password. One inbox, no folders, and no record of what has been read.",
			notice: "Exchange Online does not accept a mailbox password over POP3, so this needs an app registration with the POP.AccessAsApp permission and admin consent, plus an Exchange grant for this mailbox. That permission is separate from the IMAP one. On a Microsoft 365 mailbox the IMAP engine is usually the better choice, since the same token reaches it and it keeps folders and read state.",
			fields: [
				{
					key: "FUNCTION_TYPE",
					label: "Function Type",
					value: "EXCHANGE_POP3",
					type: "text",
					disabled: true,
					hidden: true,
					required: true,
					category: "General",
				},
				{
					key: "NAME",
					label: "Catalog Name",
					value: "",
					type: "text",
					disabled: false,
					required: true,
					rules: {
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
					key: "POP3_USERNAME",
					label: "Mailbox Address",
					value: "",
					type: "text",
					disabled: false,
					required: true,
					helperText:
						"The mailbox to read, ie reports@yourdomain.com. Exchange has to have been told to let this application open this mailbox.",
					category: "Credentials",
				},
				{
					key: "EXCHANGE_TENANT",
					label: "Tenant Id",
					value: "",
					type: "text",
					disabled: false,
					required: true,
					helperText:
						"The directory (tenant) id of the Azure app registration, or the tenant domain.",
					category: "Credentials",
				},
				{
					key: "EXCHANGE_CLIENT_ID",
					label: "Client Id",
					value: "",
					type: "text",
					disabled: false,
					required: true,
					helperText:
						"The application (client) id of the app registration.",
					category: "Credentials",
				},
				{
					key: "EXCHANGE_CLIENT_SECRET",
					label: "Client Secret",
					value: "",
					type: "password",
					disabled: false,
					required: true,
					helperText:
						"A client secret on the app registration. Secrets expire, so the engine stops reading when it does.",
					category: "Credentials",
				},
				{
					key: "EXCHANGE_SCOPE",
					label: "Token Scope",
					value: "",
					type: "text",
					disabled: false,
					required: false,
					helperText:
						"Optional. Defaults to https://outlook.office365.com/.default, which asks for whatever application permissions the app registration was granted.",
					category: "Credentials",
				},
				{
					key: "POP3_HOST",
					label: "POP3 Host",
					value: "outlook.office365.com",
					type: "text",
					disabled: false,
					required: false,
					helperText:
						"Leave as is for Microsoft 365. Only change this for a different endpoint, such as a sovereign cloud.",
					category: "Credentials",
				},
				{
					key: "POP3_PORT",
					label: "POP3 Port",
					value: "995",
					type: "number",
					disabled: false,
					required: false,
					helperText:
						"995, the encrypted POP3 port Exchange Online serves.",
					category: "Credentials",
				},
				{
					key: "MAX_MESSAGES",
					label: "Maximum Messages Per Call",
					value: "25",
					type: "number",
					disabled: false,
					required: false,
					helperText: "The most messages one call can return.",
					category: "Settings",
				},
				{
					key: "DEFAULT_MESSAGES",
					label: "Messages Returned By Default",
					value: "10",
					type: "number",
					disabled: false,
					required: false,
					helperText:
						"Used when the caller does not ask for a number. Cannot be more than the maximum above.",
					category: "Settings",
				},
				{
					key: "MAX_BODY_CHARS",
					label: "Maximum Body Characters",
					value: "10000",
					type: "number",
					disabled: false,
					required: false,
					helperText:
						"A longer message body comes back truncated, so one newsletter cannot fill a model's context window.",
					category: "Settings",
				},
				{
					key: "ALLOWED_SENDER_DOMAINS",
					label: "Allowed Sender Domains",
					value: "",
					type: "text",
					disabled: false,
					required: false,
					helperText:
						"Comma separated list, ie semoss.org. Subdomains are included. Mail from anyone else is not returned at all. Leave blank to surface every message.",
					category: "Settings",
				},
				{
					key: "ALLOW_ATTACHMENT_DOWNLOAD",
					label: "Allow Attachment Download",
					value: "false",
					type: "select",
					options: [
						{
							display: "false",
							value: "false",
						},
						{
							display: "true",
							value: "true",
						},
					],
					disabled: false,
					required: false,
					helperText:
						"When true, a caller can save the attachments of a message into the files of the insight making the call so they can be opened. When false the attachment names are listed but nothing is written.",
					category: "Settings",
				},
				{
					key: "MAX_ATTACHMENT_SIZE",
					label: "Maximum Attachment Size (bytes)",
					value: "5242880",
					type: "number",
					disabled: false,
					required: false,
					helperText:
						"An attachment larger than this is skipped rather than written. Only applies when attachment download is on.",
					category: "Settings",
				},
				{
					key: "CONNECTION_TIMEOUT",
					label: "Connection Timeout (ms)",
					value: "10000",
					type: "number",
					disabled: false,
					required: false,
					helperText:
						"How long to wait for the mail server to accept a connection.",
					category: "Settings",
				},
				{
					key: "READ_TIMEOUT",
					label: "Read Timeout (ms)",
					value: "30000",
					type: "number",
					disabled: false,
					required: false,
					helperText:
						"How long to wait on the mail server once connected.",
					category: "Settings",
				},
				{
					key: "FUNCTION_NAME",
					label: "Function Name",
					value: "",
					type: "text",
					disabled: false,
					required: true,
					helperText:
						"Becomes the MCP tool name, so name it for what it does, ie drain_alerts_inbox.",
					category: "Function Metadata",
				},
				{
					key: "FUNCTION_DESCRIPTION",
					label: "Function Description",
					value: "",
					type: "text",
					disabled: false,
					required: false,
					helperText:
						"Leave blank to use the built in description. Set it when this mailbox holds one kind of mail, so a model knows what it is reading.",
					category: "Function Metadata",
				},
				{
					key: "FUNCTION_PARAMETERS",
					label: "Function Parameters",
					value: [],
					type: "parameter-list",
					disabled: false,
					required: false,
					helperText:
						"Leave empty to use the built in search parameters: limit, from, subject, sinceDays, and includeBody.",
					category: "Function Metadata",
				},
				{
					key: "FUNCTION_REQUIRED_PARAMETERS",
					label: "Function Required Parameters",
					value: [],
					type: "string-list",
					disabled: false,
					required: false,
					helperText:
						"List the names of parameters above that must be provided when calling this function.",
					category: "Function Metadata",
				},
			],
		},
		{
			name: "Exchange Send (SMTP)",
			disable: false,
			icon: EXCHANGE_SMTP,
			description:
				"Send email as a Microsoft 365 mailbox, signing in with an Azure app registration rather than a mailbox password.",
			notice: "Sending is immediate and cannot be recalled. On top of the usual recipient limits below, Exchange needs four things to line up: the SMTP.SendAsApp application permission with admin consent, an Exchange grant for this mailbox, SMTP AUTH enabled for both the tenant and the mailbox, and a sender address that matches the mailbox signed in to.",
			fields: [
				{
					key: "FUNCTION_TYPE",
					label: "Function Type",
					value: "EXCHANGE_SMTP",
					type: "text",
					disabled: true,
					hidden: true,
					required: true,
					category: "General",
				},
				{
					key: "NAME",
					label: "Catalog Name",
					value: "",
					type: "text",
					disabled: false,
					required: true,
					rules: {
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
					key: "SMTP_HOST",
					label: "SMTP Host",
					value: "smtp.office365.com",
					type: "text",
					disabled: false,
					required: true,
					helperText:
						"Leave as is for Microsoft 365. Only change this for a different endpoint, such as a sovereign cloud.",
					category: "Credentials",
				},
				{
					key: "SMTP_PORT",
					label: "SMTP Port",
					value: "587",
					type: "number",
					disabled: false,
					required: true,
					helperText:
						"587, the submission port Exchange Online serves.",
					category: "Credentials",
				},
				{
					key: "SMTP_SECURITY",
					label: "Connection Security",
					value: "starttls",
					type: "select",
					options: [
						{
							display: "STARTTLS",
							value: "starttls",
						},
						{
							display: "SSL",
							value: "ssl",
						},
						{
							display: "None",
							value: "none",
						},
					],
					disabled: false,
					required: true,
					helperText:
						"STARTTLS, which is what Exchange Online serves on the submission port. It is required rather than optional, so a server that drops it cannot downgrade the message to plaintext.",
					category: "Credentials",
				},
				{
					key: "SMTP_USERNAME",
					label: "Mailbox Address",
					value: "",
					type: "text",
					disabled: false,
					required: true,
					helperText:
						"The mailbox to send as, ie reports@yourdomain.com. Exchange has to have been told to let this application use it.",
					category: "Credentials",
				},
				{
					key: "EXCHANGE_TENANT",
					label: "Tenant Id",
					value: "",
					type: "text",
					disabled: false,
					required: true,
					helperText:
						"The directory (tenant) id of the Azure app registration, or the tenant domain.",
					category: "Credentials",
				},
				{
					key: "EXCHANGE_CLIENT_ID",
					label: "Client Id",
					value: "",
					type: "text",
					disabled: false,
					required: true,
					helperText:
						"The application (client) id of the app registration.",
					category: "Credentials",
				},
				{
					key: "EXCHANGE_CLIENT_SECRET",
					label: "Client Secret",
					value: "",
					type: "password",
					disabled: false,
					required: true,
					helperText:
						"A client secret on the app registration. Secrets expire, so the engine stops sending when it does.",
					category: "Credentials",
				},
				{
					key: "EXCHANGE_SCOPE",
					label: "Token Scope",
					value: "",
					type: "text",
					disabled: false,
					required: false,
					helperText:
						"Optional. Defaults to https://outlook.office365.com/.default, which asks for whatever application permissions the app registration was granted.",
					category: "Credentials",
				},
				{
					key: "SMTP_SENDER",
					label: "Sender Address",
					value: "",
					type: "text",
					disabled: false,
					required: true,
					helperText:
						"The address every email is sent from, which Exchange requires to be the mailbox signed in to above, so these normally match.",
					category: "Credentials",
				},
				{
					key: "SMTP_SENDER_NAME",
					label: "Sender Display Name",
					value: "",
					type: "text",
					disabled: false,
					required: false,
					helperText:
						"Shown next to the sender address in the recipient's inbox, ie SEMOSS Notifications.",
					category: "Credentials",
				},
				{
					key: "ALLOWED_RECIPIENT_DOMAINS",
					label: "Allowed Recipient Domains",
					value: "",
					type: "text",
					disabled: false,
					required: false,
					helperText:
						"Comma separated list, ie semoss.org. Subdomains are included. Leave blank to allow any recipient.",
					category: "Settings",
				},
				{
					key: "DEFAULT_TO",
					label: "Default To Recipients",
					value: "",
					type: "text",
					disabled: false,
					required: false,
					helperText:
						"Comma separated addresses used when the caller does not pass any. Set this to pin the engine to a fixed distribution list.",
					category: "Settings",
				},
				{
					key: "DEFAULT_CC",
					label: "Default CC Recipients",
					value: "",
					type: "text",
					disabled: false,
					required: false,
					helperText:
						"Comma separated addresses copied when the caller does not pass a cc list.",
					category: "Settings",
				},
				{
					key: "DEFAULT_BCC",
					label: "Default BCC Recipients",
					value: "",
					type: "text",
					disabled: false,
					required: false,
					helperText:
						"Comma separated addresses blind copied when the caller does not pass a bcc list.",
					category: "Settings",
				},
				{
					key: "SUBJECT_PREFIX",
					label: "Subject Prefix",
					value: "",
					type: "text",
					disabled: false,
					required: false,
					helperText:
						"Prepended to every subject line, ie [SEMOSS]. Leave blank to send the subject as written.",
					category: "Settings",
				},
				{
					key: "HTML",
					label: "Default Body Format",
					value: "false",
					type: "select",
					options: [
						{
							display: "Plain text",
							value: "false",
						},
						{
							display: "HTML",
							value: "true",
						},
					],
					disabled: false,
					required: false,
					helperText:
						"How the message body is sent when the caller does not say. The caller can override this per email.",
					category: "Settings",
				},
				{
					key: "MAX_RECIPIENTS",
					label: "Maximum Recipients Per Email",
					value: "25",
					type: "number",
					disabled: false,
					required: false,
					helperText:
						"Total across to, cc, and bcc. A call asking for more than this is rejected before anything is sent.",
					category: "Settings",
				},
				{
					key: "ALLOW_SENDER_OVERRIDE",
					label: "Allow Sender Override",
					value: "false",
					type: "select",
					options: [
						{
							display: "false",
							value: "false",
						},
						{
							display: "true",
							value: "true",
						},
					],
					disabled: false,
					required: false,
					helperText:
						"Leave false to send everything as the sender address above. Set to true only when the relay accepts sending on behalf of other addresses.",
					category: "Settings",
				},
				{
					key: "ALLOW_ATTACHMENTS",
					label: "Allow Attachments",
					value: "false",
					type: "select",
					options: [
						{
							display: "false",
							value: "false",
						},
						{
							display: "true",
							value: "true",
						},
					],
					disabled: false,
					required: false,
					helperText:
						"When true, a caller can attach files that already exist in the insight making the call. No other file on the server can be attached.",
					category: "Settings",
				},
				{
					key: "CONNECTION_TIMEOUT",
					label: "Connection Timeout (ms)",
					value: "10000",
					type: "number",
					disabled: false,
					required: false,
					helperText:
						"How long to wait for the mail server to accept a connection.",
					category: "Settings",
				},
				{
					key: "READ_TIMEOUT",
					label: "Read Timeout (ms)",
					value: "30000",
					type: "number",
					disabled: false,
					required: false,
					helperText:
						"How long to wait on the mail server once connected.",
					category: "Settings",
				},
				{
					key: "FUNCTION_NAME",
					label: "Function Name",
					value: "",
					type: "text",
					disabled: false,
					required: true,
					helperText:
						"Becomes the MCP tool name, so name it for what it does, ie send_as_reports_mailbox.",
					category: "Function Metadata",
				},
				{
					key: "FUNCTION_DESCRIPTION",
					label: "Function Description",
					value: "",
					type: "text",
					disabled: false,
					required: false,
					helperText:
						"Leave blank to use the built in description. Set it when this engine mails a specific audience, so a model knows who it is writing to.",
					category: "Function Metadata",
				},
				{
					key: "FUNCTION_PARAMETERS",
					label: "Function Parameters",
					value: [],
					type: "parameter-list",
					disabled: false,
					required: false,
					helperText:
						"Leave empty to use the built in email parameters: to, cc, bcc, subject, message, and html.",
					category: "Function Metadata",
				},
				{
					key: "FUNCTION_REQUIRED_PARAMETERS",
					label: "Function Required Parameters",
					value: [],
					type: "string-list",
					disabled: false,
					required: false,
					helperText:
						"List the names of parameters above that must be provided when calling this function.",
					category: "Function Metadata",
				},
			],
		},
		{
			name: "Google OCR",
			disable: false,
			icon: GOOGLE_OCR,
			description:
				"Extracts text from images using Google Cloud Vision OCR",
			link: "https://cloud.google.com/vision/docs/ocr",
			fields: [
				{
					key: "FUNCTION_TYPE",
					label: "Function Type",
					value: "GOOGLE_OCR",

					type: "text",
					disabled: true,
					hidden: true,
					required: true,
					category: "General",
				},
				{
					key: "NAME",
					label: "Catalog Name",
					value: "",
					type: "text",
					disabled: false,
					required: true,
					rules: {
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
					key: "PROJECT_ID",
					label: "Project Id",
					value: "",
					type: "text",
					disabled: false,
					required: true,
					category: "Credentials",
				},
				{
					key: "PROCESSOR_ID",
					label: "Processor Id",
					value: "",
					type: "text",
					disabled: false,
					required: true,
					category: "Settings",
				},
				{
					key: "REGION",
					label: "Region",
					value: "",
					type: "text",
					disabled: false,
					required: true,
					category: "Settings",
				},
				{
					key: "FILE",
					label: "Upload Service Account File",
					value: null,
					type: "file-upload",
					disabled: false,
					secondary: true,
					required: true,
					category: "Settings",
				},
				{
					key: "GOOGLE_BUCKET_ENGINEID",
					label: "Google Bucket Engine Id",
					value: "",
					type: "text",
					disabled: false,
					required: true,
					category: "Settings",
				},
			],
		},
		{
			name: "Google Speech To Text",
			disable: false,
			icon: GOOGLE_SPEECH_TO_TEXT,
			description: "Converts speech to text using Google Speech-to-Text",
			link: "https://cloud.google.com/speech-to-text/docs",
			fields: [
				{
					key: "FUNCTION_TYPE",
					label: "Function Type",
					value: "GOOGLE_SPEECH_TO_TEXT",

					type: "text",
					disabled: true,
					hidden: true,
					required: true,
					category: "General",
				},
				{
					key: "NAME",
					label: "Catalog Name",
					value: "",
					type: "text",
					disabled: false,
					required: true,
					rules: {
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
					key: "GOOGLE_BUCKET_ENGINEID",
					label: "Google Bucket Engine Id",
					value: "",
					type: "text",
					disabled: false,
					required: true,
					category: "Credentials",
				},
				{
					key: "FILE",
					label: "Upload Service Account File",
					value: null,
					type: "file-upload",
					disabled: false,
					secondary: true,
					required: true,
					category: "Settings",
				},
			],
		},
		{
			name: "IMAP Mailbox",
			disable: false,
			icon: IMAP,
			description:
				"Read the email in an IMAP mailbox, which keeps folders and tracks what has been read, and optionally mark, move, or delete a message.",
			notice: "Reading is safe by default, since the folder is opened read only. The mark, move, and delete settings below let a caller change the mailbox for everyone who reads it, and a delete cannot be undone.",
			fields: [
				{
					key: "FUNCTION_TYPE",
					label: "Function Type",
					value: "IMAP",
					type: "text",
					disabled: true,
					hidden: true,
					required: true,
					category: "General",
				},
				{
					key: "NAME",
					label: "Catalog Name",
					value: "",
					type: "text",
					disabled: false,
					required: true,
					rules: {
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
					key: "IMAP_HOST",
					label: "IMAP Host",
					value: "",
					type: "text",
					disabled: false,
					required: true,
					helperText:
						"The mail server hostname, ie outlook.office365.com or an internal server.",
					category: "Credentials",
				},
				{
					key: "IMAP_PORT",
					label: "IMAP Port",
					value: "993",
					type: "number",
					disabled: false,
					required: true,
					helperText:
						"993 for SSL, 143 for a server that starts in the clear.",
					category: "Credentials",
				},
				{
					key: "IMAP_SECURITY",
					label: "Connection Security",
					value: "ssl",
					type: "select",
					options: [
						{
							display: "SSL",
							value: "ssl",
						},
						{
							display: "STARTTLS",
							value: "starttls",
						},
						{
							display: "None",
							value: "none",
						},
					],
					disabled: false,
					required: true,
					helperText:
						"The server certificate has to be trusted and match the host either way. Only use None for an internal server that does no encryption at all.",
					category: "Credentials",
				},
				{
					key: "IMAP_USERNAME",
					label: "Username",
					value: "",
					type: "text",
					disabled: false,
					required: true,
					helperText:
						"The mailbox to sign in to, usually the full email address. Both the username and password are required - a mailbox cannot be read anonymously.",
					category: "Credentials",
				},
				{
					key: "IMAP_PASSWORD",
					label: "Password",
					value: "",
					type: "password",
					disabled: false,
					required: true,
					helperText:
						"Many providers need an app password rather than the account password.",
					category: "Credentials",
				},
				{
					key: "DEFAULT_FOLDER",
					label: "Default Folder",
					value: "INBOX",
					type: "text",
					disabled: false,
					required: false,
					helperText:
						"The folder read when the caller does not name one.",
					category: "Settings",
				},
				{
					key: "ALLOWED_FOLDERS",
					label: "Allowed Folders",
					value: "",
					type: "text",
					disabled: false,
					required: false,
					helperText:
						"Comma separated list, ie INBOX,Archive. A call naming anything else is rejected. Leave blank to allow any folder of the mailbox.",
					category: "Settings",
				},
				{
					key: "MAX_MESSAGES",
					label: "Maximum Messages Per Call",
					value: "25",
					type: "number",
					disabled: false,
					required: false,
					helperText:
						"The most messages one call can return. Also caps how many messages a single mark, move, or delete can touch.",
					category: "Settings",
				},
				{
					key: "DEFAULT_MESSAGES",
					label: "Messages Returned By Default",
					value: "10",
					type: "number",
					disabled: false,
					required: false,
					helperText:
						"Used when the caller does not ask for a number. Cannot be more than the maximum above.",
					category: "Settings",
				},
				{
					key: "MAX_BODY_CHARS",
					label: "Maximum Body Characters",
					value: "10000",
					type: "number",
					disabled: false,
					required: false,
					helperText:
						"A longer message body comes back truncated, so one newsletter cannot fill a model's context window.",
					category: "Settings",
				},
				{
					key: "ALLOWED_SENDER_DOMAINS",
					label: "Allowed Sender Domains",
					value: "",
					type: "text",
					disabled: false,
					required: false,
					helperText:
						"Comma separated list, ie semoss.org. Subdomains are included. Mail from anyone else is not returned at all. Leave blank to surface every message.",
					category: "Settings",
				},
				{
					key: "ALLOW_ATTACHMENT_DOWNLOAD",
					label: "Allow Attachment Download",
					value: "false",
					type: "select",
					options: [
						{
							display: "false",
							value: "false",
						},
						{
							display: "true",
							value: "true",
						},
					],
					disabled: false,
					required: false,
					helperText:
						"When true, a caller can save the attachments of a message into the files of the insight making the call so they can be opened. When false the attachment names are listed but nothing is written.",
					category: "Settings",
				},
				{
					key: "MAX_ATTACHMENT_SIZE",
					label: "Maximum Attachment Size (bytes)",
					value: "5242880",
					type: "number",
					disabled: false,
					required: false,
					helperText:
						"An attachment larger than this is skipped rather than written. Only applies when attachment download is on.",
					category: "Settings",
				},
				{
					key: "MARK_AS_READ",
					label: "Mark Returned Messages As Read",
					value: "false",
					type: "select",
					options: [
						{
							display: "false",
							value: "false",
						},
						{
							display: "true",
							value: "true",
						},
					],
					disabled: false,
					required: false,
					helperText:
						"Leave false to read the mailbox without changing it. True marks every message this engine returns as read, which the owner of the mailbox will see.",
					category: "Settings",
				},
				{
					key: "ALLOW_FLAG_CHANGES",
					label: "Allow Marking Read Or Unread",
					value: "false",
					type: "select",
					options: [
						{
							display: "false",
							value: "false",
						},
						{
							display: "true",
							value: "true",
						},
					],
					disabled: false,
					required: false,
					helperText:
						"When true, a caller can mark a message read or unread by its uid. Leave false for an engine that only reads.",
					category: "Settings",
				},
				{
					key: "ALLOW_MOVE",
					label: "Allow Moving Messages",
					value: "false",
					type: "select",
					options: [
						{
							display: "false",
							value: "false",
						},
						{
							display: "true",
							value: "true",
						},
					],
					disabled: false,
					required: false,
					helperText:
						"When true, a caller can move a message to another folder. IMAP has no move, so this copies the message and then deletes the original.",
					category: "Settings",
				},
				{
					key: "ALLOW_DELETE",
					label: "Allow Deleting Messages",
					value: "false",
					type: "select",
					options: [
						{
							display: "false",
							value: "false",
						},
						{
							display: "true",
							value: "true",
						},
					],
					disabled: false,
					required: false,
					helperText:
						"When true, a caller can delete a message. There is no undo on the mail server, so leave this off unless deleting is the point of the engine.",
					category: "Settings",
				},
				{
					key: "CONNECTION_TIMEOUT",
					label: "Connection Timeout (ms)",
					value: "10000",
					type: "number",
					disabled: false,
					required: false,
					helperText:
						"How long to wait for the mail server to accept a connection.",
					category: "Settings",
				},
				{
					key: "READ_TIMEOUT",
					label: "Read Timeout (ms)",
					value: "30000",
					type: "number",
					disabled: false,
					required: false,
					helperText:
						"How long to wait on the mail server once connected.",
					category: "Settings",
				},
				{
					key: "FUNCTION_NAME",
					label: "Function Name",
					value: "",
					type: "text",
					disabled: false,
					required: true,
					helperText:
						"Becomes the MCP tool name, so name it for what it does, ie read_reports_inbox.",
					category: "Function Metadata",
				},
				{
					key: "FUNCTION_DESCRIPTION",
					label: "Function Description",
					value: "",
					type: "text",
					disabled: false,
					required: false,
					helperText:
						"Leave blank to use the built in description. Set it when this mailbox holds one kind of mail, so a model knows what it is reading.",
					category: "Function Metadata",
				},
				{
					key: "FUNCTION_PARAMETERS",
					label: "Function Parameters",
					value: [],
					type: "parameter-list",
					disabled: false,
					required: false,
					helperText:
						"Leave empty to use the built in parameters: folder, limit, from, subject, sinceDays, unreadOnly, and includeBody, plus action and uid for whichever changes are allowed above.",
					category: "Function Metadata",
				},
				{
					key: "FUNCTION_REQUIRED_PARAMETERS",
					label: "Function Required Parameters",
					value: [],
					type: "string-list",
					disabled: false,
					required: false,
					helperText:
						"List the names of parameters above that must be provided when calling this function.",
					category: "Function Metadata",
				},
			],
		},
		{
			name: "Local Python Function",
			disable: false,
			icon: PYTHON,
			description:
				"Run a custom Python function stored within the engine. Useful for executing local Python logic as a callable function.",
			notice: "After creating this engine, upload your Python file and any supporting files from the engine Edit page.",
			fields: [
				{
					key: "FUNCTION_TYPE",
					label: "Function Type",
					value: "LOCAL_PYTHON",
					type: "text",
					disabled: true,
					hidden: true,
					required: true,
					category: "General",
				},
				{
					key: "NAME",
					label: "Catalog Name",
					value: "",
					type: "text",
					disabled: false,
					required: true,
					rules: {
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
					key: "PYTHON_FILE_NAME",
					label: "Python File Name",
					value: "",
					type: "text",
					disabled: false,
					required: true,
					helperText:
						"Enter only the file name (e.g., my_function.py). Upload the file itself from the engine Edit page after the engine is created.",
					category: "Settings",
				},
				{
					key: "FUNCTION_NAME",
					label: "Function Name",
					value: "",
					type: "text",
					disabled: false,
					required: true,
					category: "Function Metadata",
				},
				{
					key: "FUNCTION_DESCRIPTION",
					label: "Function Description",
					value: "",
					type: "text",
					disabled: false,
					required: true,
					category: "Function Metadata",
				},
				{
					key: "FUNCTION_PARAMETERS",
					label: "Function Parameters",
					value: [],
					type: "parameter-list",
					disabled: false,
					required: false,
					helperText:
						"Define each parameter with a name, type, and description.",
					category: "Function Metadata",
				},
				{
					key: "FUNCTION_REQUIRED_PARAMETERS",
					label: "Function Required Parameters",
					value: [],
					type: "string-list",
					disabled: false,
					required: false,
					helperText:
						"List the names of parameters above that must be provided when calling this function.",
					category: "Function Metadata",
				},
			],
		},
		{
			name: "POP3 Mailbox",
			disable: false,
			icon: POP3,
			description:
				"Read the email in a POP3 mailbox. One inbox, no folders, and no record of what has already been read, so it suits a mailbox something drains rather than a person's mail.",
			notice: "Whatever is in the mailbox can come back to whoever calls this, attachments included. Use the sender domain, message count, and body length settings below to bound what it can surface. Nothing here deletes mail.",
			fields: [
				{
					key: "FUNCTION_TYPE",
					label: "Function Type",
					value: "POP3",
					type: "text",
					disabled: true,
					hidden: true,
					required: true,
					category: "General",
				},
				{
					key: "NAME",
					label: "Catalog Name",
					value: "",
					type: "text",
					disabled: false,
					required: true,
					rules: {
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
					key: "POP3_HOST",
					label: "POP3 Host",
					value: "",
					type: "text",
					disabled: false,
					required: true,
					helperText:
						"The mail server hostname, ie pop.gmail.com or an internal server.",
					category: "Credentials",
				},
				{
					key: "POP3_PORT",
					label: "POP3 Port",
					value: "995",
					type: "number",
					disabled: false,
					required: true,
					helperText:
						"995 for SSL, 110 for a server that starts in the clear.",
					category: "Credentials",
				},
				{
					key: "POP3_SECURITY",
					label: "Connection Security",
					value: "ssl",
					type: "select",
					options: [
						{
							display: "SSL",
							value: "ssl",
						},
						{
							display: "STARTTLS",
							value: "starttls",
						},
						{
							display: "None",
							value: "none",
						},
					],
					disabled: false,
					required: true,
					helperText:
						"The server certificate has to be trusted and match the host either way. Only use None for an internal server that does no encryption at all.",
					category: "Credentials",
				},
				{
					key: "POP3_USERNAME",
					label: "Username",
					value: "",
					type: "text",
					disabled: false,
					required: true,
					helperText:
						"The mailbox to sign in to, usually the full email address. Both the username and password are required - a mailbox cannot be read anonymously.",
					category: "Credentials",
				},
				{
					key: "POP3_PASSWORD",
					label: "Password",
					value: "",
					type: "password",
					disabled: false,
					required: true,
					helperText:
						"Many providers need an app password rather than the account password.",
					category: "Credentials",
				},
				{
					key: "MAX_MESSAGES",
					label: "Maximum Messages Per Call",
					value: "25",
					type: "number",
					disabled: false,
					required: false,
					helperText: "The most messages one call can return.",
					category: "Settings",
				},
				{
					key: "DEFAULT_MESSAGES",
					label: "Messages Returned By Default",
					value: "10",
					type: "number",
					disabled: false,
					required: false,
					helperText:
						"Used when the caller does not ask for a number. Cannot be more than the maximum above.",
					category: "Settings",
				},
				{
					key: "MAX_BODY_CHARS",
					label: "Maximum Body Characters",
					value: "10000",
					type: "number",
					disabled: false,
					required: false,
					helperText:
						"A longer message body comes back truncated, so one newsletter cannot fill a model's context window.",
					category: "Settings",
				},
				{
					key: "ALLOWED_SENDER_DOMAINS",
					label: "Allowed Sender Domains",
					value: "",
					type: "text",
					disabled: false,
					required: false,
					helperText:
						"Comma separated list, ie semoss.org. Subdomains are included. Mail from anyone else is not returned at all. Leave blank to surface every message.",
					category: "Settings",
				},
				{
					key: "ALLOW_ATTACHMENT_DOWNLOAD",
					label: "Allow Attachment Download",
					value: "false",
					type: "select",
					options: [
						{
							display: "false",
							value: "false",
						},
						{
							display: "true",
							value: "true",
						},
					],
					disabled: false,
					required: false,
					helperText:
						"When true, a caller can save the attachments of a message into the files of the insight making the call so they can be opened. When false the attachment names are listed but nothing is written.",
					category: "Settings",
				},
				{
					key: "MAX_ATTACHMENT_SIZE",
					label: "Maximum Attachment Size (bytes)",
					value: "5242880",
					type: "number",
					disabled: false,
					required: false,
					helperText:
						"An attachment larger than this is skipped rather than written. Only applies when attachment download is on.",
					category: "Settings",
				},
				{
					key: "CONNECTION_TIMEOUT",
					label: "Connection Timeout (ms)",
					value: "10000",
					type: "number",
					disabled: false,
					required: false,
					helperText:
						"How long to wait for the mail server to accept a connection.",
					category: "Settings",
				},
				{
					key: "READ_TIMEOUT",
					label: "Read Timeout (ms)",
					value: "30000",
					type: "number",
					disabled: false,
					required: false,
					helperText:
						"How long to wait on the mail server once connected.",
					category: "Settings",
				},
				{
					key: "FUNCTION_NAME",
					label: "Function Name",
					value: "",
					type: "text",
					disabled: false,
					required: true,
					helperText:
						"Becomes the MCP tool name, so name it for what it does, ie read_alerts_inbox.",
					category: "Function Metadata",
				},
				{
					key: "FUNCTION_DESCRIPTION",
					label: "Function Description",
					value: "",
					type: "text",
					disabled: false,
					required: false,
					helperText:
						"Leave blank to use the built in description. Set it when this mailbox holds one kind of mail, so a model knows what it is reading.",
					category: "Function Metadata",
				},
				{
					key: "FUNCTION_PARAMETERS",
					label: "Function Parameters",
					value: [],
					type: "parameter-list",
					disabled: false,
					required: false,
					helperText:
						"Leave empty to use the built in search parameters: limit, from, subject, sinceDays, and includeBody.",
					category: "Function Metadata",
				},
				{
					key: "FUNCTION_REQUIRED_PARAMETERS",
					label: "Function Required Parameters",
					value: [],
					type: "string-list",
					disabled: false,
					required: false,
					helperText:
						"List the names of parameters above that must be provided when calling this function.",
					category: "Function Metadata",
				},
			],
		},
		{
			name: "REST",
			disable: false,
			icon: RESTAPI,
			description: "Connect to any RESTful API endpoint",
			link: " https://restfulapi.net/",
			fields: [
				{
					key: "FUNCTION_TYPE",
					label: "Function Type",
					value: "REST",
					type: "text",
					disabled: true,
					hidden: true,
					required: true,
					category: "General",
				},
				{
					key: "NAME",
					label: "Catalog Name",
					value: "",
					type: "text",
					disabled: false,
					required: true,
					rules: {
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
					key: "URL",
					label: "URL",
					value: "",
					type: "text",
					disabled: false,
					required: true,
					category: "Credentials",
				},
				{
					key: "HTTP_METHOD",
					label: "Http Method",
					value: "POST",
					type: "select",
					options: [
						{
							display: "GET",
							value: "GET",
						},
						{
							display: "HEAD",
							value: "HEAD",
						},
						{
							display: "POST",
							value: "POST",
						},
						{
							display: "PUT",
							value: "PUT",
						},
					],
					disabled: false,
					required: true,
					category: "Credentials",
				},
				{
					key: "CONTENT_TYPE",
					label: "POST Message Body Type",
					value: "json",
					type: "select",
					options: [
						{
							display: "json",
							value: "json",
						},
						{
							display: "x-www-form-urlencoded",
							value: "x-www-form-urlencoded",
						},
					],
					disabled: false,
					required: true,
					category: "Settings",
				},
				{
					key: "HEADERS",
					label: "Http Headers",
					value: "",
					type: "text",
					disabled: false,
					required: false,
					category: "Settings",
				},
				{
					key: "FUNCTION_NAME",
					label: "Function Name",
					value: "",
					type: "text",
					disabled: false,
					required: true,
					category: "Function Metadata",
				},
				{
					key: "FUNCTION_DESCRIPTION",
					label: "Function Description",
					value: "",
					type: "text",
					disabled: false,
					required: true,
					category: "Function Metadata",
				},
				{
					key: "FUNCTION_PARAMETERS",
					label: "Function Parameters",
					value: [],
					type: "parameter-list",
					disabled: false,
					required: false,
					helperText:
						"Define each parameter with a name, type, and description.",
					category: "Function Metadata",
				},
				{
					key: "FUNCTION_REQUIRED_PARAMETERS",
					label: "Function Required Parameters",
					value: [],
					type: "string-list",
					disabled: false,
					required: false,
					helperText:
						"List the names of parameters above that must be provided when calling this function.",
					category: "Function Metadata",
				},
			],
		},
		{
			name: "ServiceNow",
			disable: false,
			icon: SERVICE_NOW,
			description: "Query records from a ServiceNow table",
			link: "https://developer.servicenow.com/dev.do#!/reference/api/latest/rest/c_TableAPI",
			fields: [
				{
					key: "FUNCTION_TYPE",
					label: "Function Type",
					value: "SERVICE_NOW",
					type: "text",
					disabled: true,
					hidden: true,
					required: true,
					category: "General",
				},
				{
					key: "NAME",
					label: "Catalog Name",
					value: "",
					type: "text",
					disabled: false,
					required: true,
					rules: {
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
					key: "ENDPOINT",
					label: "Instance URL",
					value: "",
					type: "text",
					disabled: false,
					required: true,
					helperText:
						"The base URL of the ServiceNow instance, ie https://myinstance.service-now.com",
					category: "Credentials",
				},
				{
					key: "AUTH_TYPE",
					label: "Authentication Type",
					value: "oauth",
					type: "select",
					options: [
						{
							display: "OAuth",
							value: "oauth",
						},
						{
							display: "Basic",
							value: "basic",
						},
					],
					disabled: false,
					required: true,
					helperText:
						"Fill in the fields below that match the type selected here.",
					category: "Credentials",
				},
				{
					key: "OAUTH_CLIENT",
					label: "OAuth Client ID",
					value: "",
					type: "text",
					disabled: false,
					required: false,
					helperText:
						"Required when the authentication type is OAuth.",
					category: "Credentials",
				},
				{
					key: "OAUTH_SECRET",
					label: "OAuth Client Secret",
					value: "",
					type: "password",
					disabled: false,
					required: false,
					helperText:
						"Required when the authentication type is OAuth.",
					category: "Credentials",
				},
				{
					key: "OAUTH_GRANT_TYPE",
					label: "OAuth Grant Type",
					value: "client_credentials",
					type: "select",
					options: [
						{
							display: "client_credentials",
							value: "client_credentials",
						},
						{
							display: "password",
							value: "password",
						},
					],
					disabled: false,
					required: false,
					helperText:
						"The password grant also requires the username and password below.",
					category: "Credentials",
				},
				{
					key: "OAUTH_ENDPOINT",
					label: "OAuth Token URL",
					value: "",
					type: "text",
					disabled: false,
					required: false,
					helperText:
						"Must be a full URL. Leave blank to use <Instance URL>/oauth_token.do",
					category: "Credentials",
				},
				{
					key: "BASIC_USERNAME",
					label: "Username",
					value: "",
					type: "text",
					disabled: false,
					required: false,
					helperText:
						"Required for basic authentication or the OAuth password grant.",
					category: "Credentials",
				},
				{
					key: "BASIC_PASSWORD",
					label: "Password",
					value: "",
					type: "password",
					disabled: false,
					required: false,
					helperText:
						"Required for basic authentication or the OAuth password grant.",
					category: "Credentials",
				},
				{
					key: "DEFAULT_TABLE",
					label: "Default Table",
					value: "",
					type: "text",
					disabled: false,
					required: false,
					helperText:
						"The table queried when the caller does not name one, ie incident. Leave blank to require the table on every request.",
					category: "Settings",
				},
				{
					key: "TABLE_API_PATH",
					label: "Table API Path",
					value: "/api/now/table/",
					type: "text",
					disabled: false,
					required: false,
					helperText:
						"Change this only when the table is served by a scoped app scripted REST API instead of the standard table API.",
					category: "Settings",
				},
				{
					key: "LIMIT",
					label: "Default Record Limit",
					value: "25",
					type: "number",
					disabled: false,
					required: false,
					helperText:
						"Maximum records returned when the caller does not ask for a specific limit.",
					category: "Settings",
				},
				{
					key: "FIELDS",
					label: "Default Fields",
					value: "",
					type: "text",
					disabled: false,
					required: false,
					helperText:
						"Comma separated list of fields to return. Leave blank to return every field.",
					category: "Settings",
				},
				{
					key: "DISPLAY_VALUE",
					label: "Display Values",
					value: "true",
					type: "select",
					options: [
						{
							display: "true (readable display value)",
							value: "true",
						},
						{
							display: "false (raw database value)",
							value: "false",
						},
						{
							display: "all (both values)",
							value: "all",
						},
					],
					disabled: false,
					required: false,
					helperText:
						"How reference and choice fields are returned on each record.",
					category: "Settings",
				},
				{
					key: "EXCLUDE_REFERENCE_LINK",
					label: "Exclude Reference Links",
					value: "true",
					type: "select",
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
					disabled: false,
					required: false,
					helperText:
						"Leave as true to keep the response small by dropping the link objects on reference fields.",
					category: "Settings",
				},
				{
					key: "FUNCTION_NAME",
					label: "Function Name",
					value: "",
					type: "text",
					disabled: false,
					required: true,
					category: "Function Metadata",
				},
				{
					key: "FUNCTION_DESCRIPTION",
					label: "Function Description",
					value: "",
					type: "text",
					disabled: false,
					required: true,
					category: "Function Metadata",
				},
				{
					key: "FUNCTION_PARAMETERS",
					label: "Function Parameters",
					value: [],
					type: "parameter-list",
					disabled: false,
					required: false,
					helperText:
						"Leave empty to use the built in table query parameters such as query, fields, limit, and orderBy.",
					category: "Function Metadata",
				},
				{
					key: "FUNCTION_REQUIRED_PARAMETERS",
					label: "Function Required Parameters",
					value: [],
					type: "string-list",
					disabled: false,
					required: false,
					helperText:
						"List the names of parameters above that must be provided when calling this function.",
					category: "Function Metadata",
				},
			],
		},
		{
			name: "SMTP Email",
			disable: false,
			icon: SMTP,
			description:
				"Send email through an SMTP server whose credentials live on this engine rather than in social.properties.",
			notice: "Sending is immediate and cannot be recalled. Use the recipient domain, recipient count, and sender override settings below to bound what this engine is allowed to send.",
			fields: [
				{
					key: "FUNCTION_TYPE",
					label: "Function Type",
					value: "SMTP",
					type: "text",
					disabled: true,
					hidden: true,
					required: true,
					category: "General",
				},
				{
					key: "NAME",
					label: "Catalog Name",
					value: "",
					type: "text",
					disabled: false,
					required: true,
					rules: {
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
					key: "SMTP_HOST",
					label: "SMTP Host",
					value: "",
					type: "text",
					disabled: false,
					required: true,
					helperText:
						"The mail server hostname, ie smtp.office365.com or an internal relay.",
					category: "Credentials",
				},
				{
					key: "SMTP_PORT",
					label: "SMTP Port",
					value: "587",
					type: "number",
					disabled: false,
					required: true,
					helperText:
						"587 for STARTTLS, 465 for SSL, 25 for a relay that does no encryption.",
					category: "Credentials",
				},
				{
					key: "SMTP_SECURITY",
					label: "Connection Security",
					value: "starttls",
					type: "select",
					options: [
						{
							display: "STARTTLS",
							value: "starttls",
						},
						{
							display: "SSL",
							value: "ssl",
						},
						{
							display: "None",
							value: "none",
						},
					],
					disabled: false,
					required: true,
					helperText:
						"STARTTLS is required rather than optional, so a server that drops it cannot downgrade the message to plaintext. Only use None for an internal relay.",
					category: "Credentials",
				},
				{
					key: "SMTP_USERNAME",
					label: "Username",
					value: "",
					type: "text",
					disabled: false,
					required: false,
					helperText:
						"Leave the username and password both blank for a relay that does not authenticate.",
					category: "Credentials",
				},
				{
					key: "SMTP_PASSWORD",
					label: "Password",
					value: "",
					type: "password",
					disabled: false,
					required: false,
					helperText:
						"Required whenever a username is set. Many providers need an app password rather than the account password.",
					category: "Credentials",
				},
				{
					key: "SMTP_SENDER",
					label: "Sender Address",
					value: "",
					type: "text",
					disabled: false,
					required: true,
					helperText:
						"The address every email is sent from. Most relays reject a sender that does not match the authenticated account.",
					category: "Credentials",
				},
				{
					key: "SMTP_SENDER_NAME",
					label: "Sender Display Name",
					value: "",
					type: "text",
					disabled: false,
					required: false,
					helperText:
						"Shown next to the sender address in the recipient's inbox, ie SEMOSS Notifications.",
					category: "Credentials",
				},
				{
					key: "ALLOWED_RECIPIENT_DOMAINS",
					label: "Allowed Recipient Domains",
					value: "",
					type: "text",
					disabled: false,
					required: false,
					helperText:
						"Comma separated list, ie semoss.org. Subdomains are included. Leave blank to allow any recipient.",
					category: "Settings",
				},
				{
					key: "DEFAULT_TO",
					label: "Default To Recipients",
					value: "",
					type: "text",
					disabled: false,
					required: false,
					helperText:
						"Comma separated addresses used when the caller does not pass any. Set this to pin the engine to a fixed distribution list.",
					category: "Settings",
				},
				{
					key: "DEFAULT_CC",
					label: "Default CC Recipients",
					value: "",
					type: "text",
					disabled: false,
					required: false,
					helperText:
						"Comma separated addresses copied when the caller does not pass a cc list.",
					category: "Settings",
				},
				{
					key: "DEFAULT_BCC",
					label: "Default BCC Recipients",
					value: "",
					type: "text",
					disabled: false,
					required: false,
					helperText:
						"Comma separated addresses blind copied when the caller does not pass a bcc list.",
					category: "Settings",
				},
				{
					key: "SUBJECT_PREFIX",
					label: "Subject Prefix",
					value: "",
					type: "text",
					disabled: false,
					required: false,
					helperText:
						"Prepended to every subject line, ie [SEMOSS]. Leave blank to send the subject as written.",
					category: "Settings",
				},
				{
					key: "HTML",
					label: "Default Body Format",
					value: "false",
					type: "select",
					options: [
						{
							display: "Plain text",
							value: "false",
						},
						{
							display: "HTML",
							value: "true",
						},
					],
					disabled: false,
					required: false,
					helperText:
						"How the message body is sent when the caller does not say. The caller can override this per email.",
					category: "Settings",
				},
				{
					key: "MAX_RECIPIENTS",
					label: "Maximum Recipients Per Email",
					value: "25",
					type: "number",
					disabled: false,
					required: false,
					helperText:
						"Total across to, cc, and bcc. A call asking for more than this is rejected before anything is sent.",
					category: "Settings",
				},
				{
					key: "ALLOW_SENDER_OVERRIDE",
					label: "Allow Sender Override",
					value: "false",
					type: "select",
					options: [
						{
							display: "false",
							value: "false",
						},
						{
							display: "true",
							value: "true",
						},
					],
					disabled: false,
					required: false,
					helperText:
						"Leave false to send everything as the sender address above. Set to true only when the relay accepts sending on behalf of other addresses.",
					category: "Settings",
				},
				{
					key: "ALLOW_ATTACHMENTS",
					label: "Allow Attachments",
					value: "false",
					type: "select",
					options: [
						{
							display: "false",
							value: "false",
						},
						{
							display: "true",
							value: "true",
						},
					],
					disabled: false,
					required: false,
					helperText:
						"When true, a caller can attach files that already exist in the insight making the call. No other file on the server can be attached.",
					category: "Settings",
				},
				{
					key: "CONNECTION_TIMEOUT",
					label: "Connection Timeout (ms)",
					value: "10000",
					type: "number",
					disabled: false,
					required: false,
					helperText:
						"How long to wait for the mail server to accept a connection.",
					category: "Settings",
				},
				{
					key: "READ_TIMEOUT",
					label: "Read Timeout (ms)",
					value: "30000",
					type: "number",
					disabled: false,
					required: false,
					helperText:
						"How long to wait on the mail server once connected.",
					category: "Settings",
				},
				{
					key: "FUNCTION_NAME",
					label: "Function Name",
					value: "",
					type: "text",
					disabled: false,
					required: true,
					helperText:
						"Becomes the MCP tool name, so name it for what it does, ie send_email.",
					category: "Function Metadata",
				},
				{
					key: "FUNCTION_DESCRIPTION",
					label: "Function Description",
					value: "",
					type: "text",
					disabled: false,
					required: false,
					helperText:
						"Leave blank to use the built in description. Set it when this engine mails a specific audience, so a model knows who it is writing to.",
					category: "Function Metadata",
				},
				{
					key: "FUNCTION_PARAMETERS",
					label: "Function Parameters",
					value: [],
					type: "parameter-list",
					disabled: false,
					required: false,
					helperText:
						"Leave empty to use the built in email parameters: to, cc, bcc, subject, message, and html.",
					category: "Function Metadata",
				},
				{
					key: "FUNCTION_REQUIRED_PARAMETERS",
					label: "Function Required Parameters",
					value: [],
					type: "string-list",
					disabled: false,
					required: false,
					helperText:
						"List the names of parameters above that must be provided when calling this function.",
					category: "Function Metadata",
				},
			],
		},
	],
};
