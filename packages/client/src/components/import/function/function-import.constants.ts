import AWS_COMPREHEND from "@/assets/img/AWS_COMPREHEND.png";
import AWS_POLLY from "@/assets/img/AWS_POLLY.png";
import AWS_TEXTRACT from "@/assets/img/AWS_TEXTRACT.png";
import AWS_TRANSCRIBE from "@/assets/img/AWS_TRANSCRIBE.png";
import AZURE_SPEECH_TO_TEXT from "@/assets/img/AZURE_SPEECH_TO_TEXT.png";
import BING_SEARCH from "@/assets/img/BING_SEARCH.svg";
import BRAVE_SEARCH from "@/assets/img/BRAVE_SEARCH.svg";
import GOOGLE_OCR from "@/assets/img/GOOGLE_OCR.png";
import GOOGLE_SPEECH_TO_TEXT from "@/assets/img/GOOGLE_SPEECH_TO_TEXT.png";
import PYTHON from "@/assets/img/PYTHON.svg";
import RESTAPI from "@/assets/img/REST-API.svg";
import SERVICE_NOW from "@/assets/img/SERVICE_NOW.svg";

export const FUNCTION_CONNECTIONS = {
	description: {
		General:
			"Choose between hosted OpenAI services for managed reliability, or custom-deployed environments for greater control over API usage and performance.",
		Settings:
			"Configure your model type, deployment parameters, and response behavior to align with your specific OpenAI integration.",
		Credentials:
			"Enter your OpenAI API key to securely authenticate and enable access to the OpenAI endpoints.",
	},
	Functions: [
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
					label: "Function Name (metadata)",
					value: "",
					type: "text",
					disabled: false,
					required: true,
					helperText:
						"Becomes the MCP tool name, so name it for what it does, ie web_search.",
					category: "Settings",
				},
				{
					key: "FUNCTION_DESCRIPTION",
					label: "Function Description (metadata)",
					value: "",
					type: "text",
					disabled: false,
					required: false,
					helperText:
						"Leave blank to use the built in description of what a web search returns.",
					category: "Settings",
				},
				{
					key: "FUNCTION_PARAMETERS",
					label: "Function Parameters (metadata)",
					value: [],
					type: "parameter-list",
					disabled: false,
					required: false,
					helperText:
						"Leave empty to use the built in search parameters: query, limit, page, country, freshness, and safeSearch.",
					category: "Settings",
				},
				{
					key: "FUNCTION_REQUIRED_PARAMETERS",
					label: "Function Required Parameters (metadata)",
					value: [],
					type: "string-list",
					disabled: false,
					required: false,
					helperText:
						"List the names of parameters above that must be provided when calling this function.",
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
					label: "Function Name (metadata)",
					value: "",
					type: "text",
					disabled: false,
					required: true,
					helperText:
						"Becomes the MCP tool name, so name it for what it does, ie web_research.",
					category: "Settings",
				},
				{
					key: "FUNCTION_DESCRIPTION",
					label: "Function Description (metadata)",
					value: "",
					type: "text",
					disabled: false,
					required: false,
					helperText:
						"Leave blank to use the built in description of what a grounded search returns.",
					category: "Settings",
				},
				{
					key: "FUNCTION_PARAMETERS",
					label: "Function Parameters (metadata)",
					value: [],
					type: "parameter-list",
					disabled: false,
					required: false,
					helperText:
						"Leave empty to use the built in search parameters: query and country.",
					category: "Settings",
				},
				{
					key: "FUNCTION_REQUIRED_PARAMETERS",
					label: "Function Required Parameters (metadata)",
					value: [],
					type: "string-list",
					disabled: false,
					required: false,
					helperText:
						"List the names of parameters above that must be provided when calling this function.",
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
					label: "Function Name (metadata)",
					value: "",
					type: "text",
					disabled: false,
					required: true,
					category: "Settings",
				},
				{
					key: "FUNCTION_DESCRIPTION",
					label: "Function Description (metadata)",
					value: "",
					type: "text",
					disabled: false,
					required: true,
					category: "Settings",
				},
				{
					key: "FUNCTION_PARAMETERS",
					label: "Function Parameters (metadata)",
					value: [],
					type: "parameter-list",
					disabled: false,
					required: false,
					helperText:
						"Define each parameter with a name, type, and description.",
					category: "Settings",
				},
				{
					key: "FUNCTION_REQUIRED_PARAMETERS",
					label: "Function Required Parameters (metadata)",
					value: [],
					type: "string-list",
					disabled: false,
					required: false,
					helperText:
						"List the names of parameters above that must be provided when calling this function.",
					category: "Settings",
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
					label: "Function Name (metadata)",
					value: "",
					type: "text",
					disabled: false,
					required: true,
					category: "Settings",
				},
				{
					key: "FUNCTION_DESCRIPTION",
					label: "Function Description (metadata)",
					value: "",
					type: "text",
					disabled: false,
					required: true,
					category: "Settings",
				},
				{
					key: "FUNCTION_PARAMETERS",
					label: "Function Parameters (metadata)",
					value: [],
					type: "parameter-list",
					disabled: false,
					required: false,
					helperText:
						"Define each parameter with a name, type, and description.",
					category: "Settings",
				},
				{
					key: "FUNCTION_REQUIRED_PARAMETERS",
					label: "Function Required Parameters (metadata)",
					value: [],
					type: "string-list",
					disabled: false,
					required: false,
					helperText:
						"List the names of parameters above that must be provided when calling this function.",
					category: "Settings",
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
					label: "Function Name (metadata)",
					value: "",
					type: "text",
					disabled: false,
					required: true,
					category: "Settings",
				},
				{
					key: "FUNCTION_DESCRIPTION",
					label: "Function Description (metadata)",
					value: "",
					type: "text",
					disabled: false,
					required: true,
					category: "Settings",
				},
				{
					key: "FUNCTION_PARAMETERS",
					label: "Function Parameters (metadata)",
					value: [],
					type: "parameter-list",
					disabled: false,
					required: false,
					helperText:
						"Leave empty to use the built in table query parameters such as query, fields, limit, and orderBy.",
					category: "Settings",
				},
				{
					key: "FUNCTION_REQUIRED_PARAMETERS",
					label: "Function Required Parameters (metadata)",
					value: [],
					type: "string-list",
					disabled: false,
					required: false,
					helperText:
						"List the names of parameters above that must be provided when calling this function.",
					category: "Settings",
				},
			],
		},
	],
};
