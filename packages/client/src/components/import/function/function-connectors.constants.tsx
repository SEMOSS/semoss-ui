import type { ComponentType } from "react";
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
import { AwsComprehendForm } from "./connectors/aws-comprehend-form";
import { AwsImageTextExtractionForm } from "./connectors/aws-image-text-extraction-form";
import { AwsPollyForm } from "./connectors/aws-polly-form";
import { AwsTranscribeForm } from "./connectors/aws-transcribe-form";
import { AzureDocumentIntelligenceForm } from "./connectors/azure-document-intelligence-form";
import { AzureSpeechToTextForm } from "./connectors/azure-speech-to-text-form";
import { BingWebSearchForm } from "./connectors/bing-web-search-form";
import { BraveWebSearchForm } from "./connectors/brave-web-search-form";
import { GoogleOcrForm } from "./connectors/google-ocr-form";
import { GoogleSpeechToTextForm } from "./connectors/google-speech-to-text-form";
import { LocalPythonFunctionForm } from "./connectors/local-python-function-form";
import { RestForm } from "./connectors/rest-form";
import { ServiceNowForm } from "./connectors/servicenow-form";

export interface FunctionConnector {
	/** Stable URL slug, used for `/function/new/:connector`. */
	slug: string;
	name: string;
	icon: string;
	description: string;
	/** Optional documentation link. */
	link?: string;
	/** Optional callout shown above the connector's form. */
	notice?: string;
	disable?: boolean;
	Component: ComponentType;
}

export const FUNCTION_CONNECTORS: FunctionConnector[] = [
	{
		slug: "aws-image-text-extraction",
		name: "AWS Image Text Extraction",
		icon: AWS_TEXTRACT,
		description: "Extracts text from images using Amazon Textract",
		link: "https://docs.aws.amazon.com/textract/latest/dg/what-is.html",
		Component: AwsImageTextExtractionForm,
	},
	{
		slug: "aws-polly",
		name: "AWS Polly",
		icon: AWS_POLLY,
		description: "Converts text to lifelike speech using Amazon Polly",
		link: "https://docs.aws.amazon.com/polly/latest/dg/what-is.html",
		Component: AwsPollyForm,
	},
	{
		slug: "aws-transcribe",
		name: "AWS Transcribe",
		icon: AWS_TRANSCRIBE,
		description: "Converts speech to text using Amazon Transcribe",
		link: "https://docs.aws.amazon.com/transcribe/latest/dg/what-is.html",
		Component: AwsTranscribeForm,
	},
	{
		slug: "aws-comprehend",
		name: "AWS Comprehend",
		icon: AWS_COMPREHEND,
		description: "Natural language processing using Amazon Comprehend",
		link: "https://docs.aws.amazon.com/comprehend/latest/dg/what-is.html",
		Component: AwsComprehendForm,
	},
	{
		slug: "azure-document-intelligence",
		name: "Azure Document Intelligence",
		icon: RESTAPI,
		description:
			"Extracts text and data from documents using Azure Document Intelligence",
		link: "https://learn.microsoft.com/en-us/azure/cognitive-services/form-recognizer/overview",
		Component: AzureDocumentIntelligenceForm,
	},
	{
		slug: "azure-speech-to-text",
		name: "Azure Speech To Text",
		icon: AZURE_SPEECH_TO_TEXT,
		description: "Converts speech to text using Azure Speech to Text",
		link: "https://learn.microsoft.com/en-us/azure/ai-services/speech-service/index-text-to-speech",
		Component: AzureSpeechToTextForm,
	},
	{
		slug: "brave-web-search",
		name: "Brave Web Search",
		icon: BRAVE_SEARCH,
		description:
			"Search the public web and get back ranked results as title, url, and snippet. Gives a model web search it does not have on its own.",
		link: "https://api-dashboard.search.brave.com/app/documentation/web-search/get-started",
		Component: BraveWebSearchForm,
	},
	{
		slug: "bing-web-search",
		name: "Bing Web Search (Foundry)",
		icon: BING_SEARCH,
		description:
			"Ground answers in the public web through the Foundry web_search tool. Returns a written answer with citations rather than a result list.",
		link: "https://learn.microsoft.com/en-us/azure/foundry-classic/agents/how-to/tools-classic/bing-grounding?view=azure-python-preview&tabs=python&pivots=overview",
		notice: "This calls a model deployment that reads the web for you, so a search costs a model call plus a grounding tool call and returns prose with citations. For raw title/url/snippet results, use Brave Web Search instead.",
		Component: BingWebSearchForm,
	},
	{
		slug: "google-speech-to-text",
		name: "Google Speech To Text",
		icon: GOOGLE_SPEECH_TO_TEXT,
		description: "Converts speech to text using Google Speech-to-Text",
		link: "https://cloud.google.com/speech-to-text/docs",
		Component: GoogleSpeechToTextForm,
	},
	{
		slug: "google-ocr",
		name: "Google OCR",
		icon: GOOGLE_OCR,
		description: "Extracts text from images using Google Cloud Vision OCR",
		link: "https://cloud.google.com/vision/docs/ocr",
		Component: GoogleOcrForm,
	},
	{
		slug: "local-python-function",
		name: "Local Python Function",
		icon: PYTHON,
		description:
			"Run a custom Python function stored within the engine. Useful for executing local Python logic as a callable function.",
		notice: "After creating this engine, upload your Python file and any supporting files from the engine Edit page.",
		Component: LocalPythonFunctionForm,
	},
	{
		slug: "rest",
		name: "REST",
		icon: RESTAPI,
		description: "Connect to any RESTful API endpoint",
		link: "https://restfulapi.net/",
		Component: RestForm,
	},
	{
		slug: "servicenow",
		name: "ServiceNow",
		icon: SERVICE_NOW,
		description: "Query records from a ServiceNow table",
		link: "https://developer.servicenow.com/dev.do#!/reference/api/latest/rest/c_TableAPI",
		Component: ServiceNowForm,
	},
];
