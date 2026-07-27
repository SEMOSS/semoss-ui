//Drag and Drop Data

import { Terminal } from "lucide-react";
//Add Storage
import AMAZON_S3 from "@/assets/img/AMAZON_S3.png";
import APACHE_JENA from "@/assets/img/APACHE_JENA.svg";
//Connect to an External Database
import ASTER from "@/assets/img/ASTER.png";
import ATHENA from "@/assets/img/ATHENA.svg";
import AWS_COMPREHEND from "@/assets/img/AWS_COMPREHEND.png";
import AWS_POLLY from "@/assets/img/AWS_POLLY.png";
import AWS_TEXTRACT from "@/assets/img/AWS_TEXTRACT.png";
import AWS_TRANSCRIBE from "@/assets/img/AWS_TRANSCRIBE.png";
import AZURE_BLOB from "@/assets/img/AZURE_BLOB.svg";
//Commercial Models
import AZURE_OPEN_AI from "@/assets/img/AZURE_OPEN_AI.svg";
import AZURE_SPEECH_TO_TEXT from "@/assets/img/AZURE_SPEECH_TO_TEXT.png";
import BEDROCK from "@/assets/img/BEDROCK.svg";
import BIGQUERY from "@/assets/img/BIGQUERY.svg";
import BLOCKS from "@/assets/img/BLOCKS.svg";
import BLOCKS_SELECTED from "@/assets/img/BLOCKS_SELECTED.svg";
//Local Models
import BRAIN from "@/assets/img/BRAIN.png";
import CASSANDRA from "@/assets/img/CASSANDRA.svg";
import CEPH from "@/assets/img/CEPH.png";
import CHROMADB from "@/assets/img/CHROMADB.png";
import CLAUDE from "@/assets/img/CLAUDE_AI.svg";
import CLICKHOUSE from "@/assets/img/CLICKHOUSE.svg";
import CSV from "@/assets/img/CSV.svg";
import DATABRICKS from "@/assets/img/DATABRICKS.svg";
import DATASTAX from "@/assets/img/DATASTAX.png";
import DB2 from "@/assets/img/DB2.png";
import DERBY from "@/assets/img/DERBY.png";
import DREAMHOST from "@/assets/img/DREAMHOST.png";
import DROPBOX from "@/assets/img/DROPBOX.png";
import ELASTIC_SEARCH from "@/assets/img/ELASTIC_SEARCH.svg";
import EXCEL from "@/assets/img/EXCEL.svg";
import FALCON from "@/assets/img/FALCON_AI.png";
import FILES from "@/assets/img/FILES.svg";
import FILES_SELECTED from "@/assets/img/FILES_SELECTED.svg";
import FLAN from "@/assets/img/FLAN.jpg";
import GEMINI from "@/assets/img/GEMINI_COLOR.svg";
import GOOGLE_CLOUD from "@/assets/img/GOOGLE_CLOUD_STORAGE.svg";
import GOOGLE_DRIVE from "@/assets/img/GOOGLE_DRIVE.png";
import GOOGLE_OCR from "@/assets/img/GOOGLE_OCR.png";
import GOOGLE_SPEECH_TO_TEXT from "@/assets/img/GOOGLE_SPEECH_TO_TEXT.png";
import H2_DB from "@/assets/img/H2_DB.png";
import HIVE from "@/assets/img/HIVE.svg";
import GLINER from "@/assets/img/HUGGINGFACE_COLOR.svg";
import HUGGINGFACE from "@/assets/img/HUGGINGFACE_COLOR.svg";
import IMPALA from "@/assets/img/IMPALA.svg";
import LAYERS from "@/assets/img/LAYERS.svg";
import LAYERS_SELECTED from "@/assets/img/LAYERS_SELECTED.svg";
import LOCAL_FILE_SYSTEM from "@/assets/img/LOCAL_FILE_SYSTEM.png";
import MARIA_DB from "@/assets/img/MARIA_DB.svg";
import META from "@/assets/img/META_COLOR.svg";
//Vector
import MICROSOFT from "@/assets/img/MICROSOFT.png";
import MILVUS from "@/assets/img/MILVUS.png";
import MINIO from "@/assets/img/MINIO.png";
import MOSAIC from "@/assets/img/MOSAIC.png";
import MYSQL from "@/assets/img/MYSQL.svg";
import NEMO from "@/assets/img/NEMO.png";
import NEO4J from "@/assets/img/NEO4J.svg";
import NETWORK_FILE_SYSTEM from "@/assets/img/NETWORK_FILE_SYSTEM.png";
import NOTEBOOK from "@/assets/img/NOTEBOOK.svg";
import NOTEBOOK_SELECTED from "@/assets/img/NOTEBOOK_SELECTED.svg";
import ONEDRIVE from "@/assets/img/ONEDRIVE.png";
import OPEN_AI from "@/assets/img/OPEN_AI.svg";
import OPEN_SEARCH from "@/assets/img/OPEN_SEARCH.png";
import ORACLE from "@/assets/img/ORACLE.svg";
//Embedded Models
import ORCA from "@/assets/img/ORCA.png";
import PERPLEXITY from "@/assets/img/PERPLEXITY.svg";
import PHOENIX from "@/assets/img/PHOENIX.png";
import PINECONE from "@/assets/img/PINECONE.png";
import POSTGRES from "@/assets/img/POSTGRES.svg";
import DETOXIFY from "@/assets/img/PYTHON.svg";
import PYTHON from "@/assets/img/PYTHON.svg";
import RDF4J from "@/assets/img/RDF4J.svg";
import REDSHIFT from "@/assets/img/REDSHIFT.svg";
import REPLIT from "@/assets/img/REPLIT_CODE.png";
// Functions
import REST_API from "@/assets/img/REST-API.svg";
import SAP_HANA from "@/assets/img/SAP_HANA.svg";
import SEMOSS from "@/assets/img/SEMOSS_BLUE_LOGO.svg";
import SETTINGS_SELECTED from "@/assets/img/SETTING_SELECTED.svg";
//Sidebar icons
import SETTINGS from "@/assets/img/SETTINGS.svg";
import SFTP from "@/assets/img/SFTP.png";
import SNOWFLAKE from "@/assets/img/SNOWFLAKE.svg";
import SQL_SERVER from "@/assets/img/SQL_SERVER.svg";
import SQLITE from "@/assets/img/SQLITE.svg";
import STABILITY_AI from "@/assets/img/STABILITY_AI.png";
import TERADATA from "@/assets/img/TERADATA.png";
import TIBCO from "@/assets/img/TIBCO.png";
import TINKER from "@/assets/img/TINKER.png";
import TRINO from "@/assets/img/TRINO.jpg";
import TSV from "@/assets/img/TSV.svg";
import VARIABLES from "@/assets/img/VARIABLE.svg";
import VARIABLES_SELECTED from "@/assets/img/VARIABLES_SELECTED.svg";
import WEVIATE from "@/assets/img/WEVIATE.png";
import ZIP from "@/assets/img/ZIP.svg";

// TODO: Get rid of this and throw it into Connection Options
export const stepsOne = [
	{
		name: "Connect to Database",
		description:
			"In today's data-driven world, the ability to effortlessly establish connections with various database types is pivotal for unlocking the full potential of your applications and analytical processes. Whether you're a developer, data analyst, or business professional, this page serves as your gateway to understanding the array of database options at your disposal.",
		disabled: false,
		data: "DATABASE",
	},
	{
		name: "Copy Database",
		description: "",
		disabled: true,
		data: "COPY_DATABASE", // DOES NOT MATTER AT THE MOMENT, Tie this into one DS
	},
	{
		name: "Build Database",
		description: "",
		disabled: true,
		data: "BUILD_DATABASE", // DOES NOT MATTER AT THE MOMENT, Tie this into one DS
	},
	{
		name: "Connect to Model",
		description:
			"In an era fueled by information, the seamless interlinking of various databases stands as a cornerstone for unlocking the untapped potential of LLM applications. Whether you're a seasoned AI practitioner, a language aficionado, or an industry visionary, this page serves as your guiding star to grasp the spectrum of database options available within the LLM landscape.",
		disabled: false,
		data: "MODEL",
	},
	{
		name: "Connect to Storage",
		description: "",
		disabled: false,
		data: "STORAGE",
	},
	{
		name: "Connect to Vector Database",
		description: "",
		disabled: false,
		data: "VECTOR",
	},
	{
		name: "Connect to Function",
		description:
			"In an era fueled by information, the seamless interlinking of various databases stands as a cornerstone for unlocking the untapped potential of LLM applications. Whether you're a seasoned AI practitioner, a language aficionado, or an industry visionary, this page serves as your guiding star to grasp the spectrum of database options available within the LLM landscape.",
		disabled: false,
		data: "FUNCTION",
	},
];

export type EngineFields = {
	name: string;
	fields: {
		fieldName: string;
		label: string;
		defaultValue: string;
		options: {
			component: string;
			options?: { value: string; display: string }[];
			pixel?: string; // Pixel to populate options for select
		};
		disabled: boolean;
		rules: Record<string, unknown>; // react hook form
		pixel?: string; // used to populate default value
	}[];
}[];

// TODO: Type out Connection Options
export const CONNECTION_OPTIONS = {
	// Model connection options were moved to components/import/model/model-import.constants.ts
	// to support the new shadcn model import flow.
	FUNCTION: {
		Function: [
			{
				name: "AWS Image Text Extraction",
				disable: false,
				icon: AWS_TEXTRACT,
				fields: [
					{
						fieldName: "FUNCTION_TYPE",
						label: "Function Type",
						defaultValue: "AWS_TEXTRACT",
						options: {
							component: "select",
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
						},
						disabled: false,
						hidden: false,
						rules: { required: true },
					},
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
						fieldName: "ACCESS_KEY",
						label: "Access Key",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "SECRET_KEY",
						label: "Secret Key",
						defaultValue: "",
						options: {
							component: "password",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "REGION",
						label: "Region",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "S3BUCKETENGINEID",
						label: "S3 Bucket Engine Id",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "FUNCTION_NAME",
						label: "Function Name (metadata)",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "FUNCTION_DESCRIPTION",
						label: "Function Description (metadata)",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "FUNCTION_REQUIRED_PARAMETERS",
						label: "Function Required Parameters",
						defaultValue: '["isFilePresentInS3","filePath"]',
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
				],
			},
			{
				name: "AWS Polly",
				disable: false,
				icon: AWS_POLLY,
				fields: [
					{
						fieldName: "FUNCTION_TYPE",
						label: "Function Type",
						defaultValue: "AWS_POLLY",

						options: {
							component: "text-field",
						},
						disabled: true,
						rules: { required: true },
					},
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
						fieldName: "ACCESS_KEY",
						label: "Access Key",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "SECRET_KEY",
						label: "Secret Key",
						defaultValue: "",
						options: {
							component: "password",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "REGION",
						label: "Region",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "FUNCTION_NAME",
						label: "Function Name (metadata)",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "FUNCTION_DESCRIPTION",
						label: "Function Description (metadata)",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "FUNCTION_REQUIRED_PARAMETERS",
						label: "Function Required Parameters",
						defaultValue: '["extractedText","nameOfTheAudioFile"]',
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
				],
			},
			{
				name: "AWS Transcribe",
				disable: false,
				icon: AWS_TRANSCRIBE,
				fields: [
					{
						fieldName: "FUNCTION_TYPE",
						label: "Function Type",
						defaultValue: "AWS_Transcribe",

						options: {
							component: "text-field",
						},
						disabled: true,
						rules: { required: true },
					},
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
						fieldName: "ACCESS_KEY",
						label: "Access Key",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "SECRET_KEY",
						label: "Secret Key",
						defaultValue: "",
						options: {
							component: "password",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "REGION",
						label: "Region",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "S3BUCKETENGINEID",
						label: "S3 Bucket Engine Id",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "FUNCTION_NAME",
						label: "Function Name (metadata)",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "FUNCTION_DESCRIPTION",
						label: "Function Description (metadata)",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "FUNCTION_REQUIRED_PARAMETERS",
						label: "Function Required Parameters",
						defaultValue: '["isFilePresentInS3","filePath"]',
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
				],
			},
			{
				name: "AWS Comprehend",
				disable: false,
				icon: AWS_COMPREHEND,
				fields: [
					{
						fieldName: "FUNCTION_TYPE",
						label: "Function Type",
						defaultValue: "AWS_COMPREHEND",
						options: {
							component: "text-field",
						},
						disabled: true,
						rules: { required: true },
					},
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
						fieldName: "ACCESS_KEY",
						label: "Access Key",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "SECRET_KEY",
						label: "Secret Key",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "REGION",
						label: "Region",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "FUNCTION_REQUIRED_PARAMETERS",
						label: "Function Required Parameters",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "FUNCTION_NAME",
						label: "Function Name (metadata)",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "FUNCTION_DESCRIPTION",
						label: "Function Description (metadata)",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
				],
			},
			{
				name: "Azure Document Intelligence",
				disable: false,
				icon: REST_API,
				fields: [
					{
						fieldName: "FUNCTION_TYPE",
						label: "Function Type",
						defaultValue:
							"AZURE_DOCUMENT_INTELLIGENCE_CUSTOM_EMBEDDINGS",
						options: {
							component: "text-field",
						},
						disabled: true,
						rules: { required: true },
					},
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
						fieldName: "URL",
						label: "URL",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "API_KEY",
						label: "API Key",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
				],
			},
			{
				name: "Azure Speech To Text",
				disable: false,
				icon: AZURE_SPEECH_TO_TEXT,
				fields: [
					{
						fieldName: "FUNCTION_TYPE",
						label: "Function Type",
						defaultValue: "AZURE SPEECH TO TEXT",
						options: {
							component: "text-field",
						},
						disabled: true,
						rules: { required: true },
					},
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
						fieldName: "SPEECH_KEY",
						label: "Speech Key",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "SPEECH_REGION",
						label: "Speech region",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "FUNCTION_REQUIRED_PARAMETERS",
						label: "Function Required Parameters",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "FUNCTION_NAME",
						label: "Function Name (metadata)",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "FUNCTION_DESCRIPTION",
						label: "Function Description (metadata)",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
				],
			},
			{
				name: "Google Speech To Text",
				disable: false,
				icon: GOOGLE_SPEECH_TO_TEXT,
				fields: [
					{
						fieldName: "FUNCTION_TYPE",
						label: "Function Type",
						defaultValue: "GOOGLE_SPEECH_TO_TEXT",

						options: {
							component: "text-field",
						},
						disabled: true,
						rules: { required: true },
					},
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
						fieldName: "FILE",
						label: "Upload Service Account File",
						defaultValue: null,
						options: {
							component: "file-upload",
						},
						disabled: true,
						secondary: true,
						rules: { required: true },
					},
					{
						fieldName: "GOOGLE_BUCKET_ENGINEID",
						label: "Google Bucket Engine Id",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "FUNCTION_NAME",
						label: "Function Name (metadata)",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "FUNCTION_DESCRIPTION",
						label: "Function Description (metadata)",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "FUNCTION_REQUIRED_PARAMETERS",
						label: "Function Required Parameters",
						defaultValue: '["isFilePresentInBucket","filePath"]',
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
				],
			},
			{
				name: "Google OCR",
				disable: false,
				icon: GOOGLE_OCR,
				fields: [
					{
						fieldName: "FUNCTION_TYPE",
						label: "Function Type",
						defaultValue: "GOOGLE_OCR",

						options: {
							component: "text-field",
						},
						disabled: true,
						rules: { required: true },
					},
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
						fieldName: "PROJECT_ID",
						label: "Project Id",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "PROCESSOR_ID",
						label: "Processor Id",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "REGION",
						label: "Region",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "FILE",
						label: "Upload Service Account File",
						defaultValue: null,
						options: {
							component: "file-upload",
						},
						disabled: true,
						secondary: true,
						rules: { required: true },
					},
					{
						fieldName: "GOOGLE_BUCKET_ENGINEID",
						label: "Google Bucket Engine Id",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "FUNCTION_NAME",
						label: "Function Name (metadata)",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "FUNCTION_DESCRIPTION",
						label: "Function Description (metadata)",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "FUNCTION_REQUIRED_PARAMETERS",
						label: "Function Required Parameters",
						defaultValue: '["isFilePresentInBucket","filePath"]',
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
				],
			},
			{
				name: "REST",
				disable: false,
				icon: REST_API,
				fields: [
					{
						fieldName: "FUNCTION_TYPE",
						label: "Function Type",
						defaultValue: "REST",
						options: {
							component: "text-field",
						},
						disabled: true,
						rules: { required: true },
					},
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
						fieldName: "URL",
						label: "URL",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "HTTP_METHOD",
						label: "Http Method",
						defaultValue: "POST",
						options: {
							component: "select",
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
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "CONTENT_TYPE",
						label: "POST Message Body Type",
						defaultValue: "json",
						options: {
							component: "select",
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
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "HEADERS",
						label: "Http Headers",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "FUNCTION_PARAMETERS",
						label: "Function Parameters",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "FUNCTION_REQUIRED_PARAMETERS",
						label: "Function Required Parameters",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "FUNCTION_NAME",
						label: "Function Name (metadata)",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "FUNCTION_DESCRIPTION",
						label: "Function Description (metadata)",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
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
							component: "file-upload",
						},
						disabled: true,
						rules: { required: true },
					},
				],
			},
		],
	},
	VECTOR: {
		Connections: [
			{
				name: "Azure AI Search",
				disable: false,
				icon: MICROSOFT,
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
						fieldName: "VECTOR_TYPE",
						label: "Type",
						defaultValue: "AZURE_AI_SEARCH",
						options: {
							component: "text-field",
						},
						disabled: true,
						hidden: true,
						rules: { required: true },
					},
					{
						fieldName: "EMBEDDER_ENGINE_ID",
						label: "Embedder",
						defaultValue: "",
						options: {
							component: "select",
							options: [],
							pixel: `MyEngines ( metaKeys = [] , metaFilters = [{ "tag" : "embeddings" }] , engineTypes = [ 'MODEL' ] ) ;`,
							optionDisplay: "engine_name",
							optionValue: "engine_id",
						},
						disabled: false,
						rules: { required: true },
						helperText:
							"The registered model engine responsible for converting input strings into fixed-size vectors, known as embeddings, capturing semantic information for downstream machine learning and natural language processing tasks.",
					},
					{
						fieldName: "INDEX_CLASSES",
						label: "Index Classes",
						defaultValue: "default",
						options: {
							component: "text-field",
						},
						disabled: true,
						hidden: true,
						rules: { required: true },
					},
					{
						fieldName: "CHUNKING_STRATEGY",
						label: "Chunking Strategy",
						defaultValue: "ALL",
						options: {
							component: "select",
							options: [
								{
									display: "Token",
									value: "ALL",
								},
								{
									display: "Page by page",
									value: "PAGE_BY_PAGE",
								},
								{
									display: "Markdown",
									value: "MARKDOWN",
								},
							],
						},
						disabled: false,
						hidden: false,
						rules: { required: true },
						displayRules: {
							hideOtherFields: [
								{
									fieldName: "CONTENT_LENGTH",
									value: ["PAGE_BY_PAGE", "MARKDOWN"],
								},
							],
						},
					},
					{
						fieldName: "CONTENT_LENGTH",
						label: "Content Length",
						defaultValue: "512",
						options: {
							component: "number",
						},
						disabled: false,
						rules: { required: true, min: 0 },
						helperText:
							"The content length represents the upper limit of tokens within a chunk, as determined by the embedder's tokenizer.",
					},
					{
						fieldName: "CONTENT_OVERLAP",
						label: "Content Overlap",
						defaultValue: "20",
						options: {
							component: "number",
						},
						disabled: false,
						rules: { required: true, min: 0 },
						helperText:
							"The number of tokens from prior chunks that are carried over into the current chunk when processing content.",
					},
					{
						fieldName: "HOSTNAME",
						label: "Host Name",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "API_KEY",
						label: "API Key",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "API_VERSION",
						label: "API Version",
						defaultValue: "2024-07-01",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},

					{
						fieldName: "INDEX_NAME",
						label: "Index Name",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: {
							required: true,
							pattern: {
								value: /^[a-z0-9](?:[a-z0-9-]{0,126}[a-z0-9])?$/,
								message:
									"Index name must only contain lowercase letters, digits or dashes, cannot start or end with dashes and is limited to 128 characters",
							},
						},
					},

					{
						fieldName: "DIMENSION_SIZE",
						label: "Embedding Dimension Size",
						defaultValue: "1024",
						options: {
							component: "number",
						},
						disabled: false,
						rules: { required: true, min: 0 },
					},
					{
						fieldName: "METHOD_NAME",
						label: "Method Name",
						defaultValue: "hnsw",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
						advanced: true,
					},
					{
						fieldName: "SPACE_TYPE",
						label: "Space Type",
						defaultValue: "l2",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
						advanced: true,
					},
					{
						fieldName: "INDEX_ENGINE",
						label: "Index Engine",
						defaultValue: "lucene",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
						advanced: true,
					},
					{
						fieldName: "EF_CONSTRUCTION",
						label: "EF Construction",
						defaultValue: "128",
						options: {
							component: "number",
						},
						disabled: false,
						rules: { required: true, min: 0 },
						advanced: true,
					},
					{
						fieldName: "M_VALUE",
						label: "M Value",
						defaultValue: "10",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: {
							required: true,
							pattern: {
								value: /^(4|5|6|7|8|9|10)$/,
								message:
									"Permitted values are between 4 and 10",
							},
						},
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
						fieldName: "EMBEDDINGS",
						label: "Embeddings",
						defaultValue: null,
						options: {
							component: "file-upload",
						},
						disabled: true,
						secondary: true,
						rules: {},
					},
					{
						fieldName: "DISTANCE_METHOD",
						label: "Distance Method",
						defaultValue: "euclidean",
						options: {
							component: "select",
							options: [
								{
									display: "Cosine similarity",
									value: "cosine",
								},
								{
									display: "Squared Euclidean (L2) distance",
									value: "euclidean",
								},
							],
						},
						disabled: false,
						rules: { required: false },
						advanced: true,
						helperText: "",
					},
					{
						fieldName: "RETAIN_EXTRACTED_TEXT",
						label: "Retain Extracted Text",
						defaultValue: "false",
						options: {
							component: "select",
							options: [
								{
									display: "False",
									value: "false",
								},
								{
									display: "True",
									value: "true",
								},
							],
						},
						disabled: false,
						rules: { required: false },
						advanced: true,
					},
				],
			},
			{
				name: "Chroma",
				disable: false,
				icon: CHROMADB,
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
						fieldName: "VECTOR_TYPE",
						label: "Type",
						defaultValue: "CHROMA",
						options: {
							component: "text-field",
						},
						hidden: true,
						disabled: true,
						rules: { required: true },
					},
					{
						fieldName: "DESCRIPTION",
						label: "Description",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "TAGS",
						label: "Tags",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "EMBEDDER_ENGINE_ID",
						label: "Embedder",
						defaultValue: "",
						options: {
							component: "select",
							options: [],
							pixel: `MyEngines ( metaKeys = [] , metaFilters = [{ "tag" : "embeddings" }] , engineTypes = [ 'MODEL' ] ) ;`,
							optionDisplay: "engine_name",
							optionValue: "engine_id",
						},
						disabled: false,
						rules: { required: true },
						helperText:
							"The registered model engine responsible for converting input strings into fixed-size vectors, known as embeddings, capturing semantic information for downstream machine learning and natural language processing tasks.",
					},
					{
						fieldName: "INDEX_CLASSES",
						label: "Index Classes",
						defaultValue: "default",
						options: {
							component: "text-field",
						},
						hidden: true,
						disabled: true,
						rules: { required: true },
					},
					{
						fieldName: "CHUNKING_STRATEGY",
						label: "Chunking Strategy",
						defaultValue: "ALL",
						options: {
							component: "select",
							options: [
								{
									display: "Token",
									value: "ALL",
								},
								{
									display: "Page by page",
									value: "PAGE_BY_PAGE",
								},
								{
									display: "Markdown",
									value: "MARKDOWN",
								},
							],
						},
						disabled: false,
						hidden: false,
						rules: { required: true },
						displayRules: {
							hideOtherFields: [
								{
									fieldName: "CONTENT_LENGTH",
									value: ["PAGE_BY_PAGE", "MARKDOWN"],
								},
							],
						},
					},
					{
						fieldName: "CONTENT_LENGTH",
						label: "Content Length",
						defaultValue: "512",
						options: {
							component: "number",
						},
						disabled: false,
						rules: { required: true, min: 0 },
						helperText:
							"The content length represents the upper limit of tokens within a chunk, as determined by the embedder's tokenizer.",
					},
					{
						fieldName: "CONTENT_OVERLAP",
						label: "Content Overlap",
						defaultValue: "20",
						options: {
							component: "number",
						},
						disabled: false,
						rules: { required: true, min: 0 },
						helperText:
							"The number of tokens from prior chunks that are carried over into the current chunk when processing content.",
					},
					{
						fieldName: "HOSTNAME",
						label: "Host Name",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "API_KEY",
						label: "API Key",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "CHROMA_COLLECTION_NAME",
						label: "Collection Name",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "KEEP_INPUT_OUTPUT",
						label: "Record Questions and Responses",
						defaultValue: "true",
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
						fieldName: "EMBEDDINGS",
						label: "Embeddings",
						defaultValue: null,
						options: {
							component: "file-upload",
						},
						disabled: true,
						secondary: true,
						rules: {},
					},
					{
						fieldName: "DISTANCE_METHOD",
						label: "Distance Method",
						defaultValue: "cosine",
						options: {
							component: "select",
							options: [
								{
									display: "Cosine Similarity",
									value: "cosine",
								},
								{
									display: "Euclidean Distance",
									value: "l2",
								},
								{
									display: "Inner Product",
									value: "ip",
								},
							],
						},
						disabled: false,
						rules: { required: false },
						advanced: true,
						helperText: "",
					},
				],
			},
			{
				name: "Elastic Search",
				disable: false,
				icon: ELASTIC_SEARCH,
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
						fieldName: "VECTOR_TYPE",
						label: "Type",
						defaultValue: "ELASTIC_SEARCH",
						options: {
							component: "text-field",
						},
						disabled: true,
						hidden: true,
						rules: { required: true },
					},
					{
						fieldName: "DESCRIPTION",
						label: "Description",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "TAGS",
						label: "Tags",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "EMBEDDER_ENGINE_ID",
						label: "Embedder",
						defaultValue: "",
						options: {
							component: "select",
							options: [],
							pixel: `MyEngines ( metaKeys = [] , metaFilters = [{ "tag" : "embeddings" }] , engineTypes = [ 'MODEL' ] ) ;`,
							optionDisplay: "engine_name",
							optionValue: "engine_id",
						},
						disabled: false,
						rules: { required: true },
						helperText:
							"The registered model engine responsible for converting input strings into fixed-size vectors, known as embeddings, capturing semantic information for downstream machine learning and natural language processing tasks.",
					},
					{
						fieldName: "INDEX_CLASSES",
						label: "Index Classes",
						defaultValue: "default",
						options: {
							component: "text-field",
						},
						disabled: true,
						hidden: true,
						rules: { required: true },
					},
					{
						fieldName: "CHUNKING_STRATEGY",
						label: "Chunking Strategy",
						defaultValue: "ALL",
						options: {
							component: "select",
							options: [
								{
									display: "Token",
									value: "ALL",
								},
								{
									display: "Page by page",
									value: "PAGE_BY_PAGE",
								},
								{
									display: "Markdown",
									value: "MARKDOWN",
								},
							],
						},
						disabled: false,
						hidden: false,
						rules: { required: true },
						displayRules: {
							hideOtherFields: [
								{
									fieldName: "CONTENT_LENGTH",
									value: ["PAGE_BY_PAGE", "MARKDOWN"],
								},
							],
						},
					},
					{
						fieldName: "CONTENT_LENGTH",
						label: "Content Length",
						defaultValue: "512",
						options: {
							component: "number",
						},
						disabled: false,
						rules: { required: true, min: 0 },
						helperText:
							"The content length represents the upper limit of tokens within a chunk, as determined by the embedder's tokenizer.",
					},
					{
						fieldName: "CONTENT_OVERLAP",
						label: "Content Overlap",
						defaultValue: "20",
						options: {
							component: "number",
						},
						disabled: false,
						rules: { required: true, min: 0 },
						helperText:
							"The number of tokens from prior chunks that are carried over into the current chunk when processing content.",
					},
					{
						fieldName: "HOSTNAME",
						label: "Host Name",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "USERNAME",
						label: "Username",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "PASSWORD",
						label: "Password",
						defaultValue: "",
						options: {
							component: "password",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "API_KEY",
						label: "API Key",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "API_KEY_ID",
						label: "API Key ID",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "INDEX_NAME",
						label: "Index Name",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "KEEP_INPUT_OUTPUT",
						label: "Record Questions and Responses",
						defaultValue: "true",
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
						fieldName: "EMBEDDINGS",
						label: "Embeddings",
						defaultValue: null,
						options: {
							component: "file-upload",
						},
						disabled: true,
						secondary: true,
						rules: {},
					},
					{
						fieldName: "DIMENSION_SIZE",
						label: "Embedding Dimension Size",
						defaultValue: "-1",
						options: {
							component: "number",
						},
						disabled: false,
						rules: { required: true, min: -1 },
						advanced: true,
					},
					{
						fieldName: "DISTANCE_METHOD",
						label: "Distance Method",
						defaultValue: "cosine",
						options: {
							component: "select",
							options: [
								{
									display: "Cosine Similarity",
									value: "cosine",
								},
								{
									display: "Euclidean Distance",
									value: "l2_norm",
								},
								{
									display: "Dot Product",
									value: "dot_product",
								},
								{
									display: "Max Inner  Product",
									value: "max_inner_product",
								},
							],
						},
						disabled: false,
						rules: { required: false },
						advanced: true,
						helperText: "",
					},
					{
						fieldName: "METHOD_NAME",
						label: "Method Name",
						defaultValue: "hnsw",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
						advanced: true,
					},
					{
						fieldName: "SPACE_TYPE",
						label: "Space Type",
						defaultValue: "l2",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
						advanced: true,
					},
					{
						fieldName: "INDEX_ENGINE",
						label: "Index Engine",
						defaultValue: "lucene",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
						advanced: true,
					},
					{
						fieldName: "EF_CONSTRUCTION",
						label: "EF Construction",
						defaultValue: "128",
						options: {
							component: "number",
						},
						disabled: false,
						rules: { required: true, min: 0 },
						advanced: true,
					},
					{
						fieldName: "M_VALUE",
						label: "M Value",
						defaultValue: "24",
						options: {
							component: "number",
						},
						disabled: false,
						rules: { required: true, min: 0 },
						advanced: true,
					},
				],
			},
			{
				name: "FAISS",
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
						fieldName: "VECTOR_TYPE",
						label: "Type",
						defaultValue: "FAISS",
						options: {
							component: "text-field",
						},
						hidden: true,
						disabled: true,
						rules: { required: true },
					},
					{
						fieldName: "DESCRIPTION",
						label: "Description",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "TAGS",
						label: "Tags",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "EMBEDDER_ENGINE_ID",
						label: "Embedder",
						defaultValue: "",
						options: {
							component: "select",
							options: [],
							pixel: `MyEngines ( metaKeys = [] , metaFilters = [{ "tag" : "embeddings" }] , engineTypes = [ 'MODEL' ] ) ;`,
							optionDisplay: "engine_name",
							optionValue: "engine_id",
						},
						disabled: false,
						rules: { required: true },
						helperText:
							"The registered model engine responsible for converting input strings into fixed-size vectors, known as embeddings, capturing semantic information for downstream machine learning and natural language processing tasks.",
					},
					{
						fieldName: "INDEX_CLASSES",
						label: "Index Classes",
						defaultValue: "default",
						options: {
							component: "text-field",
						},
						hidden: true,
						disabled: true,
						rules: { required: true },
					},
					{
						fieldName: "CHUNKING_STRATEGY",
						label: "Chunking Strategy",
						defaultValue: "ALL",
						options: {
							component: "select",
							options: [
								{
									display: "Token",
									value: "ALL",
								},
								{
									display: "Page by page",
									value: "PAGE_BY_PAGE",
								},
								{
									display: "Markdown",
									value: "MARKDOWN",
								},
							],
						},
						disabled: false,
						hidden: false,
						rules: { required: true },
						displayRules: {
							hideOtherFields: [
								{
									fieldName: "CONTENT_LENGTH",
									value: ["PAGE_BY_PAGE", "MARKDOWN"],
								},
							],
						},
					},
					{
						fieldName: "CONTENT_LENGTH",
						label: "Content Length",
						defaultValue: "512",
						options: {
							component: "number",
						},
						disabled: false,
						rules: { required: true, min: 0 },
						helperText:
							"The content length represents the upper limit of tokens within a chunk, as determined by the embedder's tokenizer.",
					},
					{
						fieldName: "CONTENT_OVERLAP",
						label: "Content Overlap",
						defaultValue: "20",
						options: {
							component: "number",
						},
						disabled: false,
						rules: { required: true, min: 0 },
						helperText:
							"The number of tokens from prior chunks that are carried over into the current chunk when processing content.",
					},
					{
						fieldName: "KEEP_INPUT_OUTPUT",
						label: "Record Questions and Responses",
						defaultValue: "true",
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
						fieldName: "EMBEDDINGS",
						label: "Embeddings",
						defaultValue: null,
						options: {
							component: "file-upload",
						},
						disabled: true,
						secondary: true,
						rules: {},
					},
					{
						fieldName: "DISTANCE_METHOD",
						label: "Distance Method",
						defaultValue: "Squared Euclidean (L2) distance",
						options: {
							component: "select",
							options: [
								{
									display: "Squared Euclidean (L2) distance",
									value: "Squared Euclidean (L2) distance",
								},
								{
									display: "cosine similarity",
									value: "cosine similarity",
								},
							],
						},
						disabled: false,
						rules: { required: false },
						advanced: true,
						helperText: "",
					},
				],
			},
			{
				name: "Milvus",
				disable: false,
				icon: MILVUS,
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
						fieldName: "VECTOR_TYPE",
						label: "Type",
						defaultValue: "MILVUS",
						options: {
							component: "text-field",
						},
						disabled: true,
						hidden: true,
						rules: { required: true },
					},
					{
						fieldName: "DESCRIPTION",
						label: "Description",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "TAGS",
						label: "Tags",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "EMBEDDER_ENGINE_ID",
						label: "Embedder",
						defaultValue: "",
						options: {
							component: "select",
							options: [],
							pixel: `MyEngines ( metaKeys = [] , metaFilters = [{ "tag" : "embeddings" }] , engineTypes = [ 'MODEL' ] ) ;`,
							optionDisplay: "engine_name",
							optionValue: "engine_id",
						},
						disabled: false,
						rules: { required: true },
						helperText:
							"The registered model engine responsible for converting input strings into fixed-size vectors, known as embeddings, capturing semantic information for downstream machine learning and natural language processing tasks.",
					},
					{
						fieldName: "INDEX_CLASSES",
						label: "Index Classes",
						defaultValue: "default",
						options: {
							component: "text-field",
						},
						disabled: true,
						hidden: true,
						rules: { required: true },
					},
					{
						fieldName: "CHUNKING_STRATEGY",
						label: "Chunking Strategy",
						defaultValue: "ALL",
						options: {
							component: "select",
							options: [
								{
									display: "Token",
									value: "ALL",
								},
								{
									display: "Page by page",
									value: "PAGE_BY_PAGE",
								},
								{
									display: "Markdown",
									value: "MARKDOWN",
								},
							],
						},
						disabled: false,
						hidden: false,
						rules: { required: true },
						displayRules: {
							hideOtherFields: [
								{
									fieldName: "CONTENT_LENGTH",
									value: ["PAGE_BY_PAGE", "MARKDOWN"],
								},
							],
						},
					},
					{
						fieldName: "CONTENT_LENGTH",
						label: "Content Length",
						defaultValue: "512",
						options: {
							component: "number",
						},
						disabled: false,
						rules: { required: true, min: 0 },
						helperText:
							"The content length represents the upper limit of tokens within a chunk, as determined by the embedder's tokenizer.",
					},
					{
						fieldName: "CONTENT_OVERLAP",
						label: "Content Overlap",
						defaultValue: "20",
						options: {
							component: "number",
						},
						disabled: false,
						rules: { required: true, min: 0 },
						helperText:
							"The number of tokens from prior chunks that are carried over into the current chunk when processing content.",
					},
					{
						fieldName: "HOSTNAME",
						label: "Host Name",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "DATABASE_NAME",
						label: "Database",
						defaultValue: "default_database",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
						helperText:
							"Only update this value if you have a dedicated cluster",
					},
					{
						fieldName: "COLLECTION_NAME",
						label: "Collection",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "API_KEY",
						label: "API Key",
						defaultValue: "",
						options: {
							component: "password",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "DIMENSION_SIZE",
						label: "Embedding Dimension Size",
						defaultValue: "0",
						options: {
							component: "number",
						},
						disabled: false,
						rules: { required: true, min: 1 },
						advanced: false,
					},
					{
						fieldName: "KEEP_INPUT_OUTPUT",
						label: "Record Questions and Responses",
						defaultValue: "true",
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
						fieldName: "EMBEDDINGS",
						label: "Embeddings",
						defaultValue: null,
						options: {
							component: "file-upload",
						},
						disabled: true,
						secondary: true,
						rules: {},
					},
					{
						fieldName: "DISTANCE_METHOD",
						label: "Distance Method",
						defaultValue: "COSINE",
						options: {
							component: "select",
							options: [
								{
									display: "Cosine Similarity",
									value: "COSINE",
								},
								{
									display: "Euclidean Distance",
									value: "L2",
								},
								{
									display: "Inner Product",
									value: "ip ",
								},
							],
						},
						disabled: false,
						rules: { required: false },
						advanced: true,
						helperText: "",
					},
					{
						fieldName: "INDEX_TYPE",
						label: "Index Type",
						defaultValue: "HNSW",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
						advanced: true,
					},
					{
						fieldName: "EF_CONSTRUCTION",
						label: "EF Construction",
						defaultValue: "128",
						options: {
							component: "number",
						},
						disabled: false,
						rules: { required: true, min: 0 },
						advanced: true,
					},
					{
						fieldName: "M_VALUE",
						label: "M Value",
						defaultValue: "24",
						options: {
							component: "number",
						},
						disabled: false,
						rules: { required: true, min: 0 },
						advanced: true,
					},
				],
			},
			{
				name: "Open Search",
				disable: false,
				icon: OPEN_SEARCH,
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
						fieldName: "VECTOR_TYPE",
						label: "Type",
						defaultValue: "OPEN_SEARCH",
						options: {
							component: "text-field",
						},
						disabled: true,
						hidden: true,
						rules: { required: true },
					},
					{
						fieldName: "DESCRIPTION",
						label: "Description",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "TAGS",
						label: "Tags",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "EMBEDDER_ENGINE_ID",
						label: "Embedder",
						defaultValue: "",
						options: {
							component: "select",
							options: [],
							pixel: `MyEngines ( metaKeys = [] , metaFilters = [{ "tag" : "embeddings" }] , engineTypes = [ 'MODEL' ] ) ;`,
							optionDisplay: "engine_name",
							optionValue: "engine_id",
						},
						disabled: false,
						rules: { required: true },
						helperText:
							"The registered model engine responsible for converting input strings into fixed-size vectors, known as embeddings, capturing semantic information for downstream machine learning and natural language processing tasks.",
					},
					{
						fieldName: "INDEX_CLASSES",
						label: "Index Classes",
						defaultValue: "default",
						options: {
							component: "text-field",
						},
						disabled: true,
						hidden: true,
						rules: { required: true },
					},
					{
						fieldName: "CHUNKING_STRATEGY",
						label: "Chunking Strategy",
						defaultValue: "ALL",
						options: {
							component: "select",
							options: [
								{
									display: "Token",
									value: "ALL",
								},
								{
									display: "Page by page",
									value: "PAGE_BY_PAGE",
								},
								{
									display: "Markdown",
									value: "MARKDOWN",
								},
							],
						},
						disabled: false,
						hidden: false,
						rules: { required: true },
						displayRules: {
							hideOtherFields: [
								{
									fieldName: "CONTENT_LENGTH",
									value: ["PAGE_BY_PAGE", "MARKDOWN"],
								},
							],
						},
					},
					{
						fieldName: "CONTENT_LENGTH",
						label: "Content Length",
						defaultValue: "512",
						options: {
							component: "number",
						},
						disabled: false,
						rules: { required: true, min: 0 },
						helperText:
							"The content length represents the upper limit of tokens within a chunk, as determined by the embedder's tokenizer.",
					},
					{
						fieldName: "CONTENT_OVERLAP",
						label: "Content Overlap",
						defaultValue: "20",
						options: {
							component: "number",
						},
						disabled: false,
						rules: { required: true, min: 0 },
						helperText:
							"The number of tokens from prior chunks that are carried over into the current chunk when processing content.",
					},
					{
						fieldName: "HOSTNAME",
						label: "Host Name",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "USERNAME",
						label: "Username",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "PASSWORD",
						label: "Password",
						defaultValue: "",
						options: {
							component: "password",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "INDEX_NAME",
						label: "Index Name",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "DIMENSION_SIZE",
						label: "Embedding Dimension Size",
						defaultValue: "0",
						options: {
							component: "number",
						},
						disabled: false,
						rules: { required: true, min: 1 },
						advanced: false,
					},
					{
						fieldName: "KEEP_INPUT_OUTPUT",
						label: "Record Questions and Responses",
						defaultValue: "true",
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
						fieldName: "EMBEDDINGS",
						label: "Embeddings",
						defaultValue: null,
						options: {
							component: "file-upload",
						},
						disabled: true,
						secondary: true,
						rules: {},
					},
					{
						fieldName: "DISTANCE_METHOD",
						label: "Distance Method",
						defaultValue: "cosinesimil",
						options: {
							component: "select",
							options: [
								{
									display: "Cosine Similarity",
									value: "cosinesimil",
								},
								{
									display: "Euclidean Distance",
									value: "l2",
								},
								{
									display: "Inner Product",
									value: "innerproduct ",
								},
							],
						},
						disabled: false,
						rules: { required: false },
						advanced: true,
						helperText: "",
					},
					{
						fieldName: "METHOD_NAME",
						label: "Method Name",
						defaultValue: "hnsw",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
						advanced: true,
					},
					{
						fieldName: "INDEX_ENGINE",
						label: "Index Engine",
						defaultValue: "lucene",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
						advanced: true,
					},
					{
						fieldName: "EF_CONSTRUCTION",
						label: "EF Construction",
						defaultValue: "128",
						options: {
							component: "number",
						},
						disabled: false,
						rules: { required: true, min: 0 },
						advanced: true,
					},
					{
						fieldName: "M_VALUE",
						label: "M Value",
						defaultValue: "24",
						options: {
							component: "number",
						},
						disabled: false,
						rules: { required: true, min: 0 },
						advanced: true,
					},
				],
			},
			{
				name: "PGVector",
				disable: false,
				icon: POSTGRES,
				fields: [
					{
						fieldName: "VECTOR_TYPE",
						label: "Type",
						defaultValue: "PGVECTOR",
						options: {
							component: "text-field",
						},
						disabled: true,
						hidden: true,
						rules: { required: true },
					},
					{
						fieldName: "RDBMS_TYPE",
						label: "Driver Name",
						defaultValue: "POSTGRES",
						options: {
							component: "text-field",
						},
						disabled: true,
						hidden: true,
						rules: { required: true },
					},
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
						fieldName: "DESCRIPTION",
						label: "Description",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "DATABASE_TAGS",
						label: "Tags",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "hostname",
						label: "Host Name",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "port",
						label: "Port",
						defaultValue: "5432",
						options: {
							component: "number",
						},
						disabled: false,
						rules: { required: false, min: 0 },
					},
					{
						fieldName: "database",
						label: "Database",
						defaultValue: "postgres",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "schema",
						label: "Schema",
						defaultValue: "public",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "USERNAME",
						label: "Username",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "PASSWORD",
						label: "Password",
						defaultValue: "",
						options: {
							component: "password",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "additional",
						label: "Additional Parameters",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "CONNECTION_URL",
						label: "JDBC Url",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "EMBEDDER_ENGINE_ID",
						label: "Embedder",
						defaultValue: "",
						options: {
							component: "select",
							options: [],
							pixel: `MyEngines ( metaKeys = [] , metaFilters = [{ "tag" : "embeddings" }] , engineTypes = [ 'MODEL' ] ) ;`,
							optionDisplay: "engine_name",
							optionValue: "engine_id",
						},
						disabled: false,
						rules: { required: true },
						helperText:
							"The registered model engine responsible for converting input strings into fixed-size vectors, known as embeddings, capturing semantic information for downstream machine learning and natural language processing tasks.",
					},
					{
						fieldName: "PGVECTOR_TABLE_NAME",
						label: "PGVector Table Name",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "CHUNKING_STRATEGY",
						label: "Chunking Strategy",
						defaultValue: "ALL",
						options: {
							component: "select",
							options: [
								{
									display: "Token",
									value: "ALL",
								},
								{
									display: "Page by page",
									value: "PAGE_BY_PAGE",
								},
								{
									display: "Markdown",
									value: "MARKDOWN",
								},
							],
						},
						disabled: false,
						hidden: false,
						rules: { required: true },
						displayRules: {
							hideOtherFields: [
								{
									fieldName: "CONTENT_LENGTH",
									value: ["PAGE_BY_PAGE", "MARKDOWN"],
								},
							],
						},
					},
					{
						fieldName: "CONTENT_LENGTH",
						label: "Content Length",
						defaultValue: "512",
						options: {
							component: "number",
						},
						disabled: false,
						rules: { required: true, min: 0 },
						helperText:
							"The content length represents the upper limit of tokens within a chunk, as determined by the embedder's tokenizer.",
					},
					{
						fieldName: "CONTENT_OVERLAP",
						label: "Content Overlap",
						defaultValue: "20",
						options: {
							component: "number",
						},
						disabled: false,
						rules: { required: true, min: 0 },
						helperText:
							"The number of tokens from prior chunks that are carried over into the current chunk when processing content.",
					},
					{
						fieldName: "KEEP_INPUT_OUTPUT",
						label: "Record Questions and Responses",
						defaultValue: "true",
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
						fieldName: "EMBEDDINGS",
						label: "Embeddings",
						defaultValue: null,
						options: {
							component: "file-upload",
						},
						disabled: true,
						secondary: true,
						rules: {},
					},
					{
						fieldName: "DISTANCE_METHOD",
						label: "Distance Method",
						defaultValue: "Squared Euclidean (L2) distance",
						options: {
							component: "select",
							options: [
								{
									display: "Squared Euclidean (L2) distance",
									value: "Squared Euclidean (L2) distance",
								},
								{
									display: "cosine similarity",
									value: "cosine similarity",
								},
							],
						},
						disabled: false,
						rules: { required: false },
						advanced: true,
						helperText: "",
					},
					{
						fieldName: "FETCH_SIZE",
						label: "Fetch Size",
						defaultValue: "",
						rules: { required: false, min: 0 },
						options: {
							component: "number",
						},
						disabled: false,
						advanced: true,
					},
					{
						fieldName: "CONNECTION_TIMEOUT",
						label: "Connection Timeout",
						defaultValue: "",
						rules: { required: false, min: 0 },
						options: {
							component: "number",
						},
						disabled: false,
						advanced: true,
					},
					{
						fieldName: "USE_CONNECTION_POOLING",
						label: "Use Connection Pooling",
						defaultValue: false,
						rules: { required: false },
						options: {
							component: "checkbox",
						},
						disabled: false,
						advanced: true,
					},
					{
						fieldName: "POOL_MIN_SIZE",
						label: "Pool Min Size",
						defaultValue: "",
						rules: { required: false, min: 0 },
						options: {
							component: "number",
						},
						disabled: false,
						advanced: true,
					},
					{
						fieldName: "POOL_MAX_SIZE",
						label: "Pool Max Size",
						defaultValue: "",
						rules: { required: false, min: 0 },
						options: {
							component: "number",
						},
						disabled: false,
						advanced: true,
					},
				],
			},
			{
				name: "Pinecone",
				disable: false,
				icon: PINECONE,
				fields: [
					{
						fieldName: "NAME",
						label: "Name",
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
						fieldName: "VECTOR_TYPE",
						label: "Type",
						defaultValue: "PINECONE",
						options: {
							component: "text-field",
						},
						disabled: true,
						hidden: true,
						rules: { required: true },
					},
					{
						fieldName: "DESCRIPTION",
						label: "Description",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "TAGS",
						label: "Tags",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "EMBEDDER_ENGINE_ID",
						label: "Embedder",
						defaultValue: "",
						options: {
							component: "select",
							options: [],
							pixel: `MyEngines ( metaKeys = [] , metaFilters = [{ "tag" : "embeddings" }] , engineTypes = [ 'MODEL' ] ) ;`,
							optionDisplay: "engine_name",
							optionValue: "engine_id",
						},
						disabled: false,
						rules: { required: true },
						helperText:
							"The registered model engine responsible for converting input strings into fixed-size vectors, known as embeddings, capturing semantic information for downstream machine learning and natural language processing tasks.",
					},
					{
						fieldName: "INDEX_CLASSES",
						label: "Index Classes",
						defaultValue: "default",
						options: {
							component: "text-field",
						},
						disabled: true,
						hidden: true,
						rules: { required: true },
					},
					{
						fieldName: "CHUNKING_STRATEGY",
						label: "Chunking Strategy",
						defaultValue: "ALL",
						options: {
							component: "select",
							options: [
								{
									display: "Token",
									value: "ALL",
								},
								{
									display: "Page by page",
									value: "PAGE_BY_PAGE",
								},
								{
									display: "Markdown",
									value: "MARKDOWN",
								},
							],
						},
						disabled: false,
						hidden: false,
						rules: { required: true },
						displayRules: {
							hideOtherFields: [
								{
									fieldName: "CONTENT_LENGTH",
									value: ["PAGE_BY_PAGE", "MARKDOWN"],
								},
							],
						},
					},
					{
						fieldName: "CONTENT_LENGTH",
						label: "Content Length",
						defaultValue: "512",
						options: {
							component: "number",
						},
						disabled: false,
						rules: { required: true, min: 0 },
						helperText:
							"The content length represents the upper limit of tokens within a chunk, as determined by the embedder's tokenizer.",
					},
					{
						fieldName: "CONTENT_OVERLAP",
						label: "Content Overlap",
						defaultValue: "20",
						options: {
							component: "number",
						},
						disabled: false,
						rules: { required: true, min: 0 },
						helperText:
							"The number of tokens from prior chunks that are carried over into the current chunk when processing content.",
					},
					{
						fieldName: "HOSTNAME",
						label: "Host Name",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "API_KEY",
						label: "API Key",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "NAMESPACE",
						label: "Namespace",
						defaultValue: null,
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "KEEP_INPUT_OUTPUT",
						label: "Record Questions and Responses",
						defaultValue: "true",
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
						fieldName: "EMBEDDINGS",
						label: "Embeddings",
						defaultValue: null,
						options: {
							component: "file-upload",
						},
						disabled: true,
						secondary: true,
						rules: {},
					},
					// right now, below is not used
					// BE does not create the index if it doesn't exist
					// {
					//     fieldName: 'DISTANCE_METHOD',
					//     label: 'Distance Method',
					//     defaultValue: 'cosine',
					//     options: {
					//         component: 'select',
					//         options: [
					//             {
					//                 display: 'Euclidean Distance',
					//                 value: 'euclidean',
					//             },
					//             {
					//                 display: 'Cosine Similarity',
					//                 value: 'cosine',
					//             },
					//             {
					//                 display: 'Dot Product',
					//                 value: 'dotproduct',
					//             },
					//         ],
					//     },
					//     disabled: false,
					//     rules: { required: false },
					//     advanced: true,
					//     helperText: '',
					// },
				],
			},
			{
				name: "Weaviate",
				disable: false,
				icon: WEVIATE,
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
						fieldName: "VECTOR_TYPE",
						label: "Type",
						defaultValue: "WEAVIATE",
						options: {
							component: "text-field",
						},
						disabled: true,
						hidden: true,
						rules: { required: true },
					},
					{
						fieldName: "DESCRIPTION",
						label: "Description",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "TAGS",
						label: "Tags",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "EMBEDDER_ENGINE_ID",
						label: "Embedder",
						defaultValue: "",
						options: {
							component: "select",
							options: [],
							pixel: `MyEngines ( metaKeys = [] , metaFilters = [{ "tag" : "embeddings" }] , engineTypes = [ 'MODEL' ] ) ;`,
							optionDisplay: "engine_name",
							optionValue: "engine_id",
						},
						disabled: false,
						rules: { required: true },
						helperText:
							"The registered model engine responsible for converting input strings into fixed-size vectors, known as embeddings, capturing semantic information for downstream machine learning and natural language processing tasks.",
					},
					{
						fieldName: "INDEX_CLASSES",
						label: "Index Classes",
						defaultValue: "default",
						options: {
							component: "text-field",
						},
						disabled: true,
						hidden: true,
						rules: { required: true },
					},
					{
						fieldName: "CHUNKING_STRATEGY",
						label: "Chunking Strategy",
						defaultValue: "ALL",
						options: {
							component: "select",
							options: [
								{
									display: "Token",
									value: "ALL",
								},
								{
									display: "Page by page",
									value: "PAGE_BY_PAGE",
								},
								{
									display: "Markdown",
									value: "MARKDOWN",
								},
							],
						},
						disabled: false,
						hidden: false,
						rules: { required: true },
						displayRules: {
							hideOtherFields: [
								{
									fieldName: "CONTENT_LENGTH",
									value: ["PAGE_BY_PAGE", "MARKDOWN"],
								},
							],
						},
					},
					{
						fieldName: "CONTENT_LENGTH",
						label: "Content Length",
						defaultValue: "512",
						options: {
							component: "number",
						},
						disabled: false,
						rules: { required: true, min: 0 },
						helperText:
							"The content length represents the upper limit of tokens within a chunk, as determined by the embedder's tokenizer.",
					},
					{
						fieldName: "CONTENT_OVERLAP",
						label: "Content Overlap",
						defaultValue: "20",
						options: {
							component: "number",
						},
						disabled: false,
						rules: { required: true, min: 0 },
						helperText:
							"The number of tokens from prior chunks that are carried over into the current chunk when processing content.",
					},
					{
						fieldName: "HOSTNAME",
						label: "Host Name",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "API_KEY",
						label: "API Key",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "WEAVIATE_CLASSNAME",
						label: "Weaviate Classname",
						defaultValue: "Vector_Table",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "AUTOCUT_DEFAULT",
						label: "Autocut default",
						defaultValue: "1",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "KEEP_INPUT_OUTPUT",
						label: "Record Questions and Responses",
						defaultValue: "true",
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
						fieldName: "EMBEDDINGS",
						label: "Embeddings",
						defaultValue: null,
						options: {
							component: "file-upload",
						},
						disabled: true,
						secondary: true,
						rules: {},
					},
					{
						fieldName: "DISTANCE_METHOD",
						label: "Distance Method",
						defaultValue: "Squared Euclidean (L2) distance",
						options: {
							component: "select",
							options: [
								{
									display: "Squared Euclidean (L2) distance",
									value: "Squared Euclidean (L2) distance",
								},
								{
									display: "cosine similarity",
									value: "cosine similarity",
								},
							],
						},
						disabled: false,
						rules: { required: false },
						advanced: true,
						helperText: "",
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
							component: "file-upload",
						},
						disabled: true,
						rules: { required: true },
					},
				],
			},
		],
	},
	DATABASE: {
		"File Uploads": [
			{
				name: "ZIP",
				description: "Drop a zip file",
				disable: false,
				icon: ZIP,
				fields: [
					{
						fieldName: "ZIP",
						label: "Zip File",
						defaultValue: null,
						options: {
							component: "file-upload",
						},
						disabled: true,
						rules: { required: true },
					},
				],
			},
			{
				name: "CSV",
				disable: true,
				icon: CSV,
				fields: [
					// baseUpload
					// PredictDataTypes
					{
						fieldName: "ZIP",
						label: "Zip File",
						defaultValue: null,
						options: {
							component: "file-upload",
						},
						disabled: true,
						rules: { required: true },
					},
				],
			},
			{
				name: "Excel",
				disable: true,
				icon: EXCEL,
				fields: [],
			},
			{
				name: "TSV",
				disable: true,
				icon: TSV,
				fields: [],
			},
			{
				name: "SQLite",
				disable: true,
				icon: SQLITE,
				fields: [],
			},
			{
				name: "H2",
				disable: true,
				icon: H2_DB,
				fields: [],
			},
			{
				name: "Neo4J",
				disable: true,
				icon: NEO4J,
				fields: [],
			},
			{
				name: "Tinker",
				disable: true,
				icon: TINKER,
				fields: [],
			},
		],
		Connections: [
			{
				name: "Aster",
				disable: false,
				icon: ASTER,
				fields: [
					{
						fieldName: "RDBMS_TYPE",
						label: "Driver Name",
						defaultValue: "ASTER_DB",
						options: {
							component: "text-field",
						},
						disabled: true,
						rules: { required: true },
						hidden: true,
					},
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
						fieldName: "DATABASE_DESCRIPTION",
						label: "Database Description",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "DATABASE_TAGS",
						label: "Tags",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "hostname",
						label: "Host Name",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "port",
						label: "Port",
						defaultValue: "",
						options: {
							component: "number",
						},
						disabled: false,
						rules: { required: false, min: 0 },
					},
					{
						fieldName: "schema",
						label: "Schema",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "USERNAME",
						label: "Username",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "PASSWORD",
						label: "Password",
						defaultValue: "",
						options: {
							component: "password",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "additional",
						label: "Additional Parameters",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "CONNECTION_URL",
						label: "JDBC Url",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "FETCH_SIZE",
						label: "Fetch Size",
						defaultValue: "",
						rules: { required: false, min: 0 },
						options: {
							component: "number",
						},
						disabled: false,
						advanced: true,
					},
					{
						fieldName: "CONNECTION_TIMEOUT",
						label: "Connection Timeout",
						defaultValue: "",
						rules: { required: false, min: 0 },
						options: {
							component: "number",
						},
						disabled: false,
						advanced: true,
					},
					{
						fieldName: "USE_CONNECTION_POOLING",
						label: "Use Connection Pooling",
						defaultValue: false,
						rules: { required: false },
						options: {
							component: "checkbox",
						},
						disabled: false,
						advanced: true,
					},
					{
						fieldName: "POOL_MIN_SIZE",
						label: "Pool Min Size",
						defaultValue: "",
						rules: { required: false, min: 0 },
						options: {
							component: "number",
						},
						disabled: false,
						advanced: true,
					},
					{
						fieldName: "POOL_MAX_SIZE",
						label: "Pool Max Size",
						defaultValue: "",
						rules: { required: false, min: 0 },
						options: {
							component: "number",
						},
						disabled: false,
						advanced: true,
					},
				],
			},
			{
				name: "Athena",
				disable: false,
				icon: ATHENA,
				fields: [
					{
						fieldName: "RDBMS_TYPE",
						label: "Driver Name",
						defaultValue: "ATHENA",
						options: {
							component: "text-field",
						},
						disabled: true,
						rules: { required: true },
						hidden: true,
					},
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
						fieldName: "DATABASE_DESCRIPTION",
						label: "Database Description",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "DATABASE_TAGS",
						label: "Tags",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "region",
						label: "Region",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "accessKey",
						label: "Access Key",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "secretKey",
						label: "Secret Key",
						defaultValue: "",
						options: {
							component: "password",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "output",
						label: "Output",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "schema",
						label: "Schema",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "additional",
						label: "Additional Parameters",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "CONNECTION_URL",
						label: "JDBC Url",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},

					{
						fieldName: "FETCH_SIZE",
						label: "Fetch Size",
						defaultValue: "",
						rules: { required: false, min: 0 },
						options: {
							component: "number",
						},
						disabled: false,
						advanced: true,
					},
					{
						fieldName: "CONNECTION_TIMEOUT",
						label: "Connection Timeout",
						defaultValue: "",
						rules: { required: false, min: 0 },
						options: {
							component: "number",
						},
						disabled: false,
						advanced: true,
					},
					{
						fieldName: "USE_CONNECTION_POOLING",
						label: "Use Connection Pooling",
						defaultValue: false,
						rules: { required: false },
						options: {
							component: "checkbox",
						},
						disabled: false,
						advanced: true,
					},
					{
						fieldName: "POOL_MIN_SIZE",
						label: "Pool Min Size",
						defaultValue: "",
						rules: { required: false, min: 0 },
						options: {
							component: "number",
						},
						disabled: false,
						advanced: true,
					},
					{
						fieldName: "POOL_MAX_SIZE",
						label: "Pool Max Size",
						defaultValue: "",
						rules: { required: false, min: 0 },
						options: {
							component: "number",
						},
						disabled: false,
						advanced: true,
					},
				],
			},
			{
				name: "BigQuery",
				disable: false,
				icon: BIGQUERY,
				fields: [
					{
						fieldName: "RDBMS_TYPE",
						label: "Driver Name",
						defaultValue: "BIG_QUERY",
						options: {
							component: "text-field",
						},
						disabled: true,
						rules: { required: true },
						hidden: true,
					},
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
						fieldName: "DATABASE_DESCRIPTION",
						label: "Database Description",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "DATABASE_TAGS",
						label: "Tags",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "hostname",
						label: "Host Name",
						defaultValue: "https://www.googleapis.com/bigquery/v2",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "port",
						label: "Port",
						defaultValue: "",
						options: {
							component: "number",
						},
						disabled: false,
						rules: { required: false, min: 0 },
					},
					{
						fieldName: "projectId",
						label: "Project",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "schema",
						label: "Schema",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "oauthType",
						label: "OAuth Type",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "oauthServiceAcctEmail",
						label: "OAuth Service Account",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "oauthPvtKeyPath",
						label: "OAuth Service Account Key",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "additional",
						label: "Additional Parameters",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "CONNECTION_URL",
						label: "JDBC Url",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
				],
			},
			{
				name: "Cassandra",
				disable: false,
				icon: CASSANDRA,
				fields: [
					{
						fieldName: "RDBMS_TYPE",
						label: "Driver Name",
						defaultValue: "CASSANDRA",
						options: {
							component: "text-field",
						},
						disabled: true,
						rules: { required: true },
						hidden: true,
					},
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
						fieldName: "DATABASE_DESCRIPTION",
						label: "Database Description",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "DATABASE_TAGS",
						label: "Tags",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "hostname",
						label: "Host Name",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "port",
						label: "Port",
						defaultValue: "9042",
						options: {
							component: "number",
						},
						disabled: false,
						rules: { required: false, min: 0 },
					},
					{
						fieldName: "schema",
						label: "Schema",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "USERNAME",
						label: "Username",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "PASSWORD",
						label: "Password",
						defaultValue: "",
						options: {
							component: "password",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "additional",
						label: "Additional Parameters",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "CONNECTION_URL",
						label: "JDBC Url",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},

					{
						fieldName: "FETCH_SIZE",
						label: "Fetch Size",
						defaultValue: "",
						rules: { required: false, min: 0 },
						options: {
							component: "number",
						},
						disabled: false,
						advanced: true,
					},
					{
						fieldName: "CONNECTION_TIMEOUT",
						label: "Connection Timeout",
						defaultValue: "",
						rules: { required: false, min: 0 },
						options: {
							component: "number",
						},
						disabled: false,
						advanced: true,
					},
					{
						fieldName: "USE_CONNECTION_POOLING",
						label: "Use Connection Pooling",
						defaultValue: false,
						rules: { required: false },
						options: {
							component: "checkbox",
						},
						disabled: false,
						advanced: true,
					},
					{
						fieldName: "POOL_MIN_SIZE",
						label: "Pool Min Size",
						defaultValue: "",
						rules: { required: false, min: 0 },
						options: {
							component: "number",
						},
						disabled: false,
						advanced: true,
					},
					{
						fieldName: "POOL_MAX_SIZE",
						label: "Pool Max Size",
						defaultValue: "",
						rules: { required: false, min: 0 },
						options: {
							component: "number",
						},
						disabled: false,
						advanced: true,
					},
				],
			},
			{
				name: "Clickhouse",
				disable: false,
				icon: CLICKHOUSE,
				fields: [
					{
						fieldName: "RDBMS_TYPE",
						label: "Driver Name",
						defaultValue: "CLICKHOUSE",
						options: {
							component: "text-field",
						},
						disabled: true,
						rules: { required: true },
						hidden: true,
					},
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
						fieldName: "DATABASE_DESCRIPTION",
						label: "Database Description",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "DATABASE_TAGS",
						label: "Tags",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "hostname",
						label: "Host Name",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "port",
						label: "Port",
						defaultValue: "9042",
						options: {
							component: "number",
						},
						disabled: false,
						rules: { required: false, min: 0 },
					},
					{
						fieldName: "database",
						label: "Database",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "schema",
						label: "Schema",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "USERNAME",
						label: "Username",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "PASSWORD",
						label: "Password",
						defaultValue: "",
						options: {
							component: "password",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "additional",
						label: "Additional Parameters",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "CONNECTION_URL",
						label: "JDBC Url",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},

					{
						fieldName: "FETCH_SIZE",
						label: "Fetch Size",
						defaultValue: "",
						rules: { required: false, min: 0 },
						options: {
							component: "number",
						},
						disabled: false,
						advanced: true,
					},
					{
						fieldName: "CONNECTION_TIMEOUT",
						label: "Connection Timeout",
						defaultValue: "",
						rules: { required: false, min: 0 },
						options: {
							component: "number",
						},
						disabled: false,
						advanced: true,
					},
					{
						fieldName: "USE_CONNECTION_POOLING",
						label: "Use Connection Pooling",
						defaultValue: false,
						rules: { required: false },
						options: {
							component: "checkbox",
						},
						disabled: false,
						advanced: true,
					},
					{
						fieldName: "POOL_MIN_SIZE",
						label: "Pool Min Size",
						defaultValue: "",
						rules: { required: false, min: 0 },
						options: {
							component: "number",
						},
						disabled: false,
						advanced: true,
					},
					{
						fieldName: "POOL_MAX_SIZE",
						label: "Pool Max Size",
						defaultValue: "",
						rules: { required: false, min: 0 },
						options: {
							component: "number",
						},
						disabled: false,
						advanced: true,
					},
				],
			},
			{
				name: "Databricks",
				disable: false,
				icon: DATABRICKS,
				fields: [
					{
						fieldName: "RDBMS_TYPE",
						label: "Driver Name",
						defaultValue: "DATABRICKS",
						options: {
							component: "text-field",
						},
						disabled: true,
						rules: { required: true },
						hidden: true,
					},
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
						fieldName: "DATABASE_DESCRIPTION",
						label: "Database Description",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "DATABASE_TAGS",
						label: "Tags",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "hostname",
						label: "Host Name",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "port",
						label: "Port",
						defaultValue: "",
						options: {
							component: "number",
						},
						disabled: false,
						rules: { required: false, min: 0 },
					},
					{
						fieldName: "httpPath",
						label: "HTTP Path",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "UID",
						label: "UID",
						defaultValue: "token",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "PWD",
						label: "Personal Access Token",
						defaultValue: "",
						options: {
							component: "password",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "database",
						label: "Database",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "schema",
						label: "Schema",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "additional",
						label: "Additional Parameters",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "CONNECTION_URL",
						label: "JDBC Url",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},

					{
						fieldName: "FETCH_SIZE",
						label: "Fetch Size",
						defaultValue: "",
						rules: { required: false, min: 0 },
						options: {
							component: "number",
						},
						disabled: false,
						advanced: true,
					},
					{
						fieldName: "CONNECTION_TIMEOUT",
						label: "Connection Timeout",
						defaultValue: "",
						rules: { required: false, min: 0 },
						options: {
							component: "number",
						},
						disabled: false,
						advanced: true,
					},
					{
						fieldName: "USE_CONNECTION_POOLING",
						label: "Use Connection Pooling",
						defaultValue: false,
						rules: { required: false },
						options: {
							component: "checkbox",
						},
						disabled: false,
						advanced: true,
					},
					{
						fieldName: "POOL_MIN_SIZE",
						label: "Pool Min Size",
						defaultValue: "",
						rules: { required: false, min: 0 },
						options: {
							component: "number",
						},
						disabled: false,
						advanced: true,
					},
					{
						fieldName: "POOL_MAX_SIZE",
						label: "Pool Max Size",
						defaultValue: "",
						rules: { required: false, min: 0 },
						options: {
							component: "number",
						},
						disabled: false,
						advanced: true,
					},
				],
			},
			{
				name: "DataStax",
				disable: true,
				icon: DATASTAX,
				fields: [
					{
						fieldName: "RDBMS_TYPE",
						label: "Driver Name",
						defaultValue: "DATASTAX",
						options: {
							component: "text-field",
						},
						disabled: true,
						rules: { required: true },
						hidden: true,
					},
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
						fieldName: "DATABASE_DESCRIPTION",
						label: "Database Description",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "DATABASE_TAGS",
						label: "Tags",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "hostname",
						label: "Host Name",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "port",
						label: "Port",
						defaultValue: "",
						options: {
							component: "number",
						},
						disabled: false,
						rules: { required: false, min: 0 },
					},
					{
						fieldName: "graph",
						label: "GRAPH",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "USERNAME",
						label: "Username",
						defaultValue: "token",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "PASSWORD",
						label: "Password",
						defaultValue: "token",
						options: {
							component: "password",
						},
						disabled: false,
						rules: { required: false },
					},
				],
			},
			{
				name: "DB2",
				disable: false,
				icon: DB2,
				fields: [
					{
						fieldName: "RDBMS_TYPE",
						label: "Driver Name",
						defaultValue: "DB2",
						options: {
							component: "text-field",
						},
						disabled: true,
						rules: { required: true },
						hidden: true,
					},
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
						fieldName: "DATABASE_DESCRIPTION",
						label: "Database Description",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "DATABASE_TAGS",
						label: "Tags",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "hostname",
						label: "Host Name",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "port",
						label: "Port",
						defaultValue: "446",
						options: {
							component: "number",
						},
						disabled: false,
						rules: { required: false, min: 0 },
					},
					{
						fieldName: "schema",
						label: "Schema",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "USERNAME",
						label: "Username",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "PASSWORD",
						label: "Password",
						defaultValue: "",
						options: {
							component: "password",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "additional",
						label: "Additional Parameters",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "CONNECTION_URL",
						label: "JDBC Url",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "FETCH_SIZE",
						label: "Fetch Size",
						defaultValue: "",
						rules: { required: false, min: 0 },
						options: {
							component: "number",
						},
						disabled: false,
						advanced: true,
					},
					{
						fieldName: "CONNECTION_TIMEOUT",
						label: "Connection Timeout",
						defaultValue: "",
						rules: { required: false, min: 0 },
						options: {
							component: "number",
						},
						disabled: false,
						advanced: true,
					},
					{
						fieldName: "USE_CONNECTION_POOLING",
						label: "Use Connection Pooling",
						defaultValue: false,
						rules: { required: false },
						options: {
							component: "checkbox",
						},
						disabled: false,
						advanced: true,
					},
					{
						fieldName: "POOL_MIN_SIZE",
						label: "Pool Min Size",
						defaultValue: "",
						rules: { required: false, min: 0 },
						options: {
							component: "number",
						},
						disabled: false,
						advanced: true,
					},
					{
						fieldName: "POOL_MAX_SIZE",
						label: "Pool Max Size",
						defaultValue: "",
						rules: { required: false, min: 0 },
						options: {
							component: "number",
						},
						disabled: false,
						advanced: true,
					},
				],
			},

			{
				name: "Derby",
				disable: false,
				icon: DERBY,
				fields: [
					{
						fieldName: "RDBMS_TYPE",
						label: "Driver Name",
						defaultValue: "DERBY",
						options: {
							component: "text-field",
						},
						disabled: true,
						rules: { required: true },
						hidden: true,
					},
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
						fieldName: "DATABASE_DESCRIPTION",
						label: "Database Description",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "DATABASE_TAGS",
						label: "Tags",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "hostname",
						label: "Host Name",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "port",
						label: "Port",
						defaultValue: "1527",
						options: {
							component: "number",
						},
						disabled: false,
						rules: { required: false, min: 0 },
					},
					{
						fieldName: "schema",
						label: "Schema",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "USERNAME",
						label: "Username",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "PASSWORD",
						label: "Password",
						defaultValue: "",
						options: {
							component: "password",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "additional",
						label: "Additional Parameters",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "CONNECTION_URL",
						label: "JDBC Url",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},

					{
						fieldName: "FETCH_SIZE",
						label: "Fetch Size",
						defaultValue: "",
						rules: { required: false, min: 0 },
						options: {
							component: "number",
						},
						disabled: false,
						advanced: true,
					},
					{
						fieldName: "CONNECTION_TIMEOUT",
						label: "Connection Timeout",
						defaultValue: "",
						rules: { required: false, min: 0 },
						options: {
							component: "number",
						},
						disabled: false,
						advanced: true,
					},
					{
						fieldName: "USE_CONNECTION_POOLING",
						label: "Use Connection Pooling",
						defaultValue: false,
						rules: { required: false },
						options: {
							component: "checkbox",
						},
						disabled: false,
						advanced: true,
					},
					{
						fieldName: "POOL_MIN_SIZE",
						label: "Pool Min Size",
						defaultValue: "",
						rules: { required: false, min: 0 },
						options: {
							component: "number",
						},
						disabled: false,
						advanced: true,
					},
					{
						fieldName: "POOL_MAX_SIZE",
						label: "Pool Max Size",
						defaultValue: "",
						rules: { required: false, min: 0 },
						options: {
							component: "number",
						},
						disabled: false,
						advanced: true,
					},
				],
			},

			{
				name: "Elastic Search",
				disable: false,
				icon: ELASTIC_SEARCH,
				fields: [
					{
						fieldName: "RDBMS_TYPE",
						label: "Driver Name",
						defaultValue: "ELASTIC_SEARCH",
						options: {
							component: "text-field",
						},
						disabled: true,
						rules: { required: true },
						hidden: true,
					},
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
						fieldName: "DATABASE_DESCRIPTION",
						label: "Database Description",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "DATABASE_TAGS",
						label: "Tags",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "hostname",
						label: "Host Name",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "port",
						label: "Port",
						defaultValue: "9200",
						options: {
							component: "number",
						},
						disabled: false,
						rules: { required: false, min: 0 },
					},
					{
						fieldName: "httpType",
						label: "HTTP Type",
						defaultValue: "https",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "USERNAME",
						label: "Username",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "PASSWORD",
						label: "Password",
						defaultValue: "",
						options: {
							component: "password",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "additional",
						label: "Additional Parameters",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "CONNECTION_URL",
						label: "JDBC Url",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
				],
			},
			{
				name: "H2",
				disable: false,
				icon: H2_DB,
				fields: [
					{
						fieldName: "RDBMS_TYPE",
						label: "Driver Name",
						defaultValue: "H2_DB",
						options: {
							component: "text-field",
						},
						disabled: true,
						rules: { required: true },
						hidden: true,
					},
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
						fieldName: "DATABASE_DESCRIPTION",
						label: "Database Description",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "DATABASE_TAGS",
						label: "Tags",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "hostname",
						label: "Host Name",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "port",
						label: "Port",
						defaultValue: "1000",
						options: {
							component: "number",
						},
						disabled: false,
						rules: { required: false, min: 0 },
					},
					{
						fieldName: "schema",
						label: "Schema",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "USERNAME",
						label: "Username",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "PASSWORD",
						label: "Password",
						defaultValue: "",
						options: {
							component: "password",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "additional",
						label: "Additional Parameters",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "CONNECTION_URL",
						label: "JDBC Url",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},

					{
						fieldName: "FETCH_SIZE",
						label: "Fetch Size",
						defaultValue: "",
						rules: { required: false, min: 0 },
						options: {
							component: "number",
						},
						disabled: false,
						advanced: true,
					},
					{
						fieldName: "CONNECTION_TIMEOUT",
						label: "Connection Timeout",
						defaultValue: "",
						rules: { required: false, min: 0 },
						options: {
							component: "number",
						},
						disabled: false,
						advanced: true,
					},
					{
						fieldName: "USE_CONNECTION_POOLING",
						label: "Use Connection Pooling",
						defaultValue: false,
						rules: { required: false },
						options: {
							component: "checkbox",
						},
						disabled: false,
						advanced: true,
					},
					{
						fieldName: "POOL_MIN_SIZE",
						label: "Pool Min Size",
						defaultValue: "",
						rules: { required: false, min: 0 },
						options: {
							component: "number",
						},
						disabled: false,
						advanced: true,
					},
					{
						fieldName: "POOL_MAX_SIZE",
						label: "Pool Max Size",
						defaultValue: "",
						rules: { required: false, min: 0 },
						options: {
							component: "number",
						},
						disabled: false,
						advanced: true,
					},
				],
			},

			{
				name: "Hive",
				disable: false,
				icon: HIVE,
				fields: [
					{
						fieldName: "RDBMS_TYPE",
						label: "Driver Name",
						defaultValue: "HIVE",
						options: {
							component: "text-field",
						},
						disabled: true,
						rules: { required: true },
						hidden: true,
					},
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
						fieldName: "DATABASE_DESCRIPTION",
						label: "Database Description",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "DATABASE_TAGS",
						label: "Tags",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "hostname",
						label: "Host Name",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "port",
						label: "Port",
						defaultValue: "1000",
						options: {
							component: "number",
						},
						disabled: false,
						rules: { required: false, min: 0 },
					},
					{
						fieldName: "schema",
						label: "Schema",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "USERNAME",
						label: "Username",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "PASSWORD",
						label: "Password",
						defaultValue: "",
						options: {
							component: "password",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "additional",
						label: "Additional Parameters",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "CONNECTION_URL",
						label: "JDBC Url",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},

					{
						fieldName: "FETCH_SIZE",
						label: "Fetch Size",
						defaultValue: "",
						rules: { required: false, min: 0 },
						options: {
							component: "number",
						},
						disabled: false,
						advanced: true,
					},
					{
						fieldName: "CONNECTION_TIMEOUT",
						label: "Connection Timeout",
						defaultValue: "",
						rules: { required: false, min: 0 },
						options: {
							component: "number",
						},
						disabled: false,
						advanced: true,
					},
					{
						fieldName: "USE_CONNECTION_POOLING",
						label: "Use Connection Pooling",
						defaultValue: false,
						rules: { required: false },
						options: {
							component: "checkbox",
						},
						disabled: false,
						advanced: true,
					},
					{
						fieldName: "POOL_MIN_SIZE",
						label: "Pool Min Size",
						defaultValue: "",
						rules: { required: false, min: 0 },
						options: {
							component: "number",
						},
						disabled: false,
						advanced: true,
					},
					{
						fieldName: "POOL_MAX_SIZE",
						label: "Pool Max Size",
						defaultValue: "",
						rules: { required: false, min: 0 },
						options: {
							component: "number",
						},
						disabled: false,
						advanced: true,
					},
				],
			},

			{
				name: "Impala",
				disable: false,
				icon: IMPALA,
				fields: [
					{
						fieldName: "RDBMS_TYPE",
						label: "Driver Name",
						defaultValue: "IMPALA",
						options: {
							component: "text-field",
						},
						disabled: true,
						rules: { required: true },
						hidden: true,
					},
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
						fieldName: "DATABASE_DESCRIPTION",
						label: "Database Description",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "DATABASE_TAGS",
						label: "Tags",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "hostname",
						label: "Host Name",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "port",
						label: "Port",
						defaultValue: "21050",
						options: {
							component: "number",
						},
						disabled: false,
						rules: { required: false, min: 0 },
					},
					{
						fieldName: "schema",
						label: "Schema",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "USERNAME",
						label: "Username",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "PASSWORD",
						label: "Password",
						defaultValue: "",
						options: {
							component: "password",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "additional",
						label: "Additional Parameters",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "CONNECTION_URL",
						label: "JDBC Url",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},

					{
						fieldName: "FETCH_SIZE",
						label: "Fetch Size",
						defaultValue: "",
						rules: { required: false, min: 0 },
						options: {
							component: "number",
						},
						disabled: false,
						advanced: true,
					},
					{
						fieldName: "CONNECTION_TIMEOUT",
						label: "Connection Timeout",
						defaultValue: "",
						rules: { required: false, min: 0 },
						options: {
							component: "number",
						},
						disabled: false,
						advanced: true,
					},
					{
						fieldName: "USE_CONNECTION_POOLING",
						label: "Use Connection Pooling",
						defaultValue: false,
						rules: { required: false },
						options: {
							component: "checkbox",
						},
						disabled: false,
						advanced: true,
					},
					{
						fieldName: "POOL_MIN_SIZE",
						label: "Pool Min Size",
						defaultValue: "",
						rules: { required: false, min: 0 },
						options: {
							component: "number",
						},
						disabled: false,
						advanced: true,
					},
					{
						fieldName: "POOL_MAX_SIZE",
						label: "Pool Max Size",
						defaultValue: "",
						rules: { required: false, min: 0 },
						options: {
							component: "number",
						},
						disabled: false,
						advanced: true,
					},
				],
			},
			{
				name: "MariaDB",
				disable: false,
				icon: MARIA_DB,
				fields: [
					{
						fieldName: "RDBMS_TYPE",
						label: "Driver Name",
						defaultValue: "MARIA_DB",
						options: {
							component: "text-field",
						},
						disabled: true,
						rules: { required: true },
						hidden: true,
					},
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
						fieldName: "DATABASE_DESCRIPTION",
						label: "Database Description",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "DATABASE_TAGS",
						label: "Tags",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "hostname",
						label: "Host Name",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "port",
						label: "Port",
						defaultValue: "3306",
						options: {
							component: "number",
						},
						disabled: false,
						rules: { required: false, min: 0 },
					},
					{
						fieldName: "schema",
						label: "Schema",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "USERNAME",
						label: "Username",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "PASSWORD",
						label: "Password",
						defaultValue: "",
						options: {
							component: "password",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "additional",
						label: "Additional Parameters",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "CONNECTION_URL",
						label: "JDBC Url",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},

					{
						fieldName: "FETCH_SIZE",
						label: "Fetch Size",
						defaultValue: "",
						rules: { required: false, min: 0 },
						options: {
							component: "number",
						},
						disabled: false,
						advanced: true,
					},
					{
						fieldName: "CONNECTION_TIMEOUT",
						label: "Connection Timeout",
						defaultValue: "",
						rules: { required: false, min: 0 },
						options: {
							component: "number",
						},
						disabled: false,
						advanced: true,
					},
					{
						fieldName: "USE_CONNECTION_POOLING",
						label: "Use Connection Pooling",
						defaultValue: false,
						rules: { required: false },
						options: {
							component: "checkbox",
						},
						disabled: false,
						advanced: true,
					},
					{
						fieldName: "POOL_MIN_SIZE",
						label: "Pool Min Size",
						defaultValue: "",
						rules: { required: false, min: 0 },
						options: {
							component: "number",
						},
						disabled: false,
						advanced: true,
					},
					{
						fieldName: "POOL_MAX_SIZE",
						label: "Pool Max Size",
						defaultValue: "",
						rules: { required: false, min: 0 },
						options: {
							component: "number",
						},
						disabled: false,
						advanced: true,
					},
				],
			},
			{
				name: "MySQL",
				disable: false,
				icon: MYSQL,
				fields: [
					{
						fieldName: "RDBMS_TYPE",
						label: "Driver Name",
						defaultValue: "MYSQL",
						options: {
							component: "text-field",
						},
						disabled: true,
						rules: { required: true },
						hidden: true,
					},
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
						fieldName: "DATABASE_DESCRIPTION",
						label: "Database Description",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "DATABASE_TAGS",
						label: "Tags",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "hostname",
						label: "Host Name",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "port",
						label: "Port",
						defaultValue: "3306",
						options: {
							component: "number",
						},
						disabled: false,
						rules: { required: false, min: 0 },
					},
					{
						fieldName: "schema",
						label: "Schema",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "USERNAME",
						label: "Username",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "PASSWORD",
						label: "Password",
						defaultValue: "",
						options: {
							component: "password",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "additional",
						label: "Additional Parameters",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "CONNECTION_URL",
						label: "JDBC Url",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "FETCH_SIZE",
						label: "Fetch Size",
						defaultValue: "",
						rules: { required: false, min: 0 },
						options: {
							component: "number",
						},
						disabled: false,
						advanced: true,
					},
					{
						fieldName: "CONNECTION_TIMEOUT",
						label: "Connection Timeout",
						defaultValue: "",
						rules: { required: false, min: 0 },
						options: {
							component: "number",
						},
						disabled: false,
						advanced: true,
					},
					{
						fieldName: "USE_CONNECTION_POOLING",
						label: "Use Connection Pooling",
						defaultValue: false,
						rules: { required: false },
						options: {
							component: "checkbox",
						},
						disabled: false,
						advanced: true,
					},
					{
						fieldName: "POOL_MIN_SIZE",
						label: "Pool Min Size",
						defaultValue: "",
						rules: { required: false, min: 0 },
						options: {
							component: "number",
						},
						disabled: false,
						advanced: true,
					},
					{
						fieldName: "POOL_MAX_SIZE",
						label: "Pool Max Size",
						defaultValue: "",
						rules: { required: false, min: 0 },
						options: {
							component: "number",
						},
						disabled: false,
						advanced: true,
					},
				],
			},
			{
				name: "Open Search",
				disable: false,
				icon: OPEN_SEARCH,
				fields: [
					{
						fieldName: "RDBMS_TYPE",
						label: "Driver Name",
						defaultValue: "OPEN_SEARCH",
						options: {
							component: "text-field",
						},
						disabled: true,
						rules: { required: true },
						hidden: true,
					},
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
						fieldName: "DATABASE_DESCRIPTION",
						label: "Database Description",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "DATABASE_TAGS",
						label: "Tags",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "hostname",
						label: "Host Name",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "port",
						label: "Port",
						defaultValue: "9200",
						options: {
							component: "number",
						},
						disabled: false,
						rules: { required: false, min: 0 },
					},
					{
						fieldName: "httpPath",
						label: "HTTP Path",
						defaultValue: "https",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "USERNAME",
						label: "Username",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "PASSWORD",
						label: "Password",
						defaultValue: "",
						options: {
							component: "password",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "additional",
						label: "Additional Parameters",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "CONNECTION_URL",
						label: "JDBC Url",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
				],
			},
			{
				name: "Oracle",
				disable: false,
				icon: ORACLE,
				fields: [
					{
						fieldName: "RDBMS_TYPE",
						label: "Driver Name",
						defaultValue: "ORACLE",
						options: {
							component: "text-field",
						},
						disabled: true,
						rules: { required: true },
						hidden: true,
					},
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
						fieldName: "DATABASE_DESCRIPTION",
						label: "Database Description",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "DATABASE_TAGS",
						label: "Tags",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "hostname",
						label: "Host Name",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "port",
						label: "Port",
						defaultValue: "",
						options: {
							component: "number",
						},
						disabled: false,
						rules: { required: false, min: 0 },
					},
					{
						fieldName: "service",
						label: "SID Service",
						defaultValue: "1521",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "USERNAME",
						label: "Username",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "PASSWORD",
						label: "Password",
						defaultValue: "",
						options: {
							component: "password",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "additional",
						label: "Additional Parameters",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "CONNECTION_URL",
						label: "JDBC Url",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},

					{
						fieldName: "FETCH_SIZE",
						label: "Fetch Size",
						defaultValue: "",
						rules: { required: false, min: 0 },
						options: {
							component: "number",
						},
						disabled: false,
						advanced: true,
					},
					{
						fieldName: "CONNECTION_TIMEOUT",
						label: "Connection Timeout",
						defaultValue: "",
						rules: { required: false, min: 0 },
						options: {
							component: "number",
						},
						disabled: false,
						advanced: true,
					},
					{
						fieldName: "USE_CONNECTION_POOLING",
						label: "Use Connection Pooling",
						defaultValue: false,
						rules: { required: false },
						options: {
							component: "checkbox",
						},
						disabled: false,
						advanced: true,
					},
					{
						fieldName: "POOL_MIN_SIZE",
						label: "Pool Min Size",
						defaultValue: "",
						rules: { required: false, min: 0 },
						options: {
							component: "number",
						},
						disabled: false,
						advanced: true,
					},
					{
						fieldName: "POOL_MAX_SIZE",
						label: "Pool Max Size",
						defaultValue: "",
						rules: { required: false, min: 0 },
						options: {
							component: "number",
						},
						disabled: false,
						advanced: true,
					},
				],
			},
			{
				name: "Phoenix",
				disable: false,
				icon: PHOENIX,
				fields: [
					{
						fieldName: "RDBMS_TYPE",
						label: "Driver Name",
						defaultValue: "PHOENIX",
						options: {
							component: "text-field",
						},
						disabled: true,
						rules: { required: true },
						hidden: true,
					},
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
						fieldName: "DATABASE_DESCRIPTION",
						label: "Database Description",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "DATABASE_TAGS",
						label: "Tags",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "hostname",
						label: "Host Name",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "port",
						label: "Port",
						defaultValue: "8765",
						options: {
							component: "number",
						},
						disabled: false,
						rules: { required: false, min: 0 },
					},
					{
						fieldName: "schema",
						label: "Schema",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "USERNAME",
						label: "Username",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "PASSWORD",
						label: "Password",
						defaultValue: "",
						options: {
							component: "password",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "additional",
						label: "Additional Parameters",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "CONNECTION_URL",
						label: "JDBC Url",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},

					{
						fieldName: "FETCH_SIZE",
						label: "Fetch Size",
						defaultValue: "",
						rules: { required: false, min: 0 },
						options: {
							component: "number",
						},
						disabled: false,
						advanced: true,
					},
					{
						fieldName: "CONNECTION_TIMEOUT",
						label: "Connection Timeout",
						defaultValue: "",
						rules: { required: false, min: 0 },
						options: {
							component: "number",
						},
						disabled: false,
						advanced: true,
					},
					{
						fieldName: "USE_CONNECTION_POOLING",
						label: "Use Connection Pooling",
						defaultValue: false,
						rules: { required: false },
						options: {
							component: "checkbox",
						},
						disabled: false,
						advanced: true,
					},
					{
						fieldName: "POOL_MIN_SIZE",
						label: "Pool Min Size",
						defaultValue: "",
						rules: { required: false, min: 0 },
						options: {
							component: "number",
						},
						disabled: false,
						advanced: true,
					},
					{
						fieldName: "POOL_MAX_SIZE",
						label: "Pool Max Size",
						defaultValue: "",
						rules: { required: false, min: 0 },
						options: {
							component: "number",
						},
						disabled: false,
						advanced: true,
					},
				],
			},
			{
				name: "Postgres",
				disable: false,
				icon: POSTGRES,
				fields: [
					{
						fieldName: "RDBMS_TYPE",
						label: "Driver Name",
						defaultValue: "POSTGRES",
						options: {
							component: "text-field",
						},
						disabled: true,
						rules: { required: true },
						hidden: true,
					},
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
						fieldName: "DATABASE_DESCRIPTION",
						label: "Database Description",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "DATABASE_TAGS",
						label: "Tags",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "hostname",
						label: "Host Name",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "port",
						label: "Port",
						defaultValue: "5432",
						options: {
							component: "number",
						},
						disabled: false,
						rules: { required: false, min: 0 },
					},
					{
						fieldName: "database",
						label: "Database",
						defaultValue: "postgres",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "schema",
						label: "Schema",
						defaultValue: "public",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "USERNAME",
						label: "Username",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "PASSWORD",
						label: "Password",
						defaultValue: "",
						options: {
							component: "password",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "additional",
						label: "Additional Parameters",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "CONNECTION_URL",
						label: "JDBC Url",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},

					{
						fieldName: "FETCH_SIZE",
						label: "Fetch Size",
						defaultValue: "",
						rules: { required: false, min: 0 },
						options: {
							component: "number",
						},
						disabled: false,
						advanced: true,
					},
					{
						fieldName: "CONNECTION_TIMEOUT",
						label: "Connection Timeout",
						defaultValue: "",
						rules: { required: false, min: 0 },
						options: {
							component: "number",
						},
						disabled: false,
						advanced: true,
					},
					{
						fieldName: "USE_CONNECTION_POOLING",
						label: "Use Connection Pooling",
						defaultValue: false,
						rules: { required: false },
						options: {
							component: "checkbox",
						},
						disabled: false,
						advanced: true,
					},
					{
						fieldName: "POOL_MIN_SIZE",
						label: "Pool Min Size",
						defaultValue: "",
						rules: { required: false, min: 0 },
						options: {
							component: "number",
						},
						disabled: false,
						advanced: true,
					},
					{
						fieldName: "POOL_MAX_SIZE",
						label: "Pool Max Size",
						defaultValue: "",
						rules: { required: false, min: 0 },
						options: {
							component: "number",
						},
						disabled: false,
						advanced: true,
					},
				],
			},
			{
				name: "Redshift",
				disable: false,
				icon: REDSHIFT,
				fields: [
					{
						fieldName: "RDBMS_TYPE",
						label: "Driver Name",
						defaultValue: "REDSHIFT",
						options: {
							component: "text-field",
						},
						disabled: true,
						rules: { required: true },
						hidden: true,
					},
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
						fieldName: "DATABASE_DESCRIPTION",
						label: "Database Description",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "DATABASE_TAGS",
						label: "Tags",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "hostname",
						label: "Host Name",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "port",
						label: "Port",
						defaultValue: "5439",
						options: {
							component: "number",
						},
						disabled: false,
						rules: { required: false, min: 0 },
					},
					{
						fieldName: "database",
						label: "Database",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "schema",
						label: "Schema",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "USERNAME",
						label: "Username",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "PASSWORD",
						label: "Password",
						defaultValue: "",
						options: {
							component: "password",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "additional",
						label: "Additional Parameters",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "CONNECTION_URL",
						label: "JDBC Url",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},

					{
						fieldName: "FETCH_SIZE",
						label: "Fetch Size",
						defaultValue: "",
						rules: { required: false, min: 0 },
						options: {
							component: "number",
						},
						disabled: false,
						advanced: true,
					},
					{
						fieldName: "CONNECTION_TIMEOUT",
						label: "Connection Timeout",
						defaultValue: "",
						rules: { required: false, min: 0 },
						options: {
							component: "number",
						},
						disabled: false,
						advanced: true,
					},
					{
						fieldName: "USE_CONNECTION_POOLING",
						label: "Use Connection Pooling",
						defaultValue: false,
						rules: { required: false },
						options: {
							component: "checkbox",
						},
						disabled: false,
						advanced: true,
					},
					{
						fieldName: "POOL_MIN_SIZE",
						label: "Pool Min Size",
						defaultValue: "",
						rules: { required: false, min: 0 },
						options: {
							component: "number",
						},
						disabled: false,
						advanced: true,
					},
					{
						fieldName: "POOL_MAX_SIZE",
						label: "Pool Max Size",
						defaultValue: "",
						rules: { required: false, min: 0 },
						options: {
							component: "number",
						},
						disabled: false,
						advanced: true,
					},
				],
			},
			{
				name: "SAP Hana",
				disable: false,
				icon: SAP_HANA,
				fields: [
					{
						fieldName: "RDBMS_TYPE",
						label: "Driver Name",
						defaultValue: "SAP_HANA",
						options: {
							component: "text-field",
						},
						disabled: true,
						rules: { required: true },
						hidden: true,
					},
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
								value: 'CheckEngineName ( "[VALUE]" ) ;',
								message:
									"This Catalog name has already been used, please try another.",
							},
						},
					},
					{
						fieldName: "DATABASE_DESCRIPTION",
						label: "Database Description",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "DATABASE_TAGS",
						label: "Tags",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "hostname",
						label: "Host Name",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "port",
						label: "Port",
						defaultValue: "30015",
						options: {
							component: "number",
						},
						disabled: false,
						rules: { required: false, min: 0 },
					},
					{
						fieldName: "schema",
						label: "Schema",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "USERNAME",
						label: "Username",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "PASSWORD",
						label: "Password",
						defaultValue: "",
						options: {
							component: "password",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "additional",
						label: "Additional Parameters",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "CONNECTION_URL",
						label: "JDBC Url",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},

					{
						fieldName: "FETCH_SIZE",
						label: "Fetch Size",
						defaultValue: "",
						rules: { required: false, min: 0 },
						options: {
							component: "number",
						},
						disabled: false,
						advanced: true,
					},
					{
						fieldName: "CONNECTION_TIMEOUT",
						label: "Connection Timeout",
						defaultValue: "",
						rules: { required: false, min: 0 },
						options: {
							component: "number",
						},
						disabled: false,
						advanced: true,
					},
					{
						fieldName: "USE_CONNECTION_POOLING",
						label: "Use Connection Pooling",
						defaultValue: false,
						rules: { required: false },
						options: {
							component: "checkbox",
						},
						disabled: false,
						advanced: true,
					},
					{
						fieldName: "POOL_MIN_SIZE",
						label: "Pool Min Size",
						defaultValue: "",
						rules: { required: false, min: 0 },
						options: {
							component: "number",
						},
						disabled: false,
						advanced: true,
					},
					{
						fieldName: "POOL_MAX_SIZE",
						label: "Pool Max Size",
						defaultValue: "",
						rules: { required: false, min: 0 },
						options: {
							component: "number",
						},
						disabled: false,
						advanced: true,
					},
				],
			},
			{
				name: "SEMOSS",
				disable: false,
				icon: SEMOSS,
				fields: [
					{
						fieldName: "RDBMS_TYPE",
						label: "Driver Name",
						defaultValue: "SEMOSS",
						options: {
							component: "text-field",
						},
						disabled: true,
						rules: { required: true },
						hidden: true,
					},
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
						fieldName: "DATABASE_DESCRIPTION",
						label: "Database Description",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "DATABASE_TAGS",
						label: "Tags",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "hostname",
						label: "Host Name",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "port",
						label: "Port",
						defaultValue: "443",
						options: {
							component: "number",
						},
						disabled: false,
						rules: { required: false, min: 0 },
					},
					{
						fieldName: "project",
						label: "Project Id",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "insight",
						label: "Insight Id",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "endpoint",
						label: "Endpoint",
						defaultValue: "Monolith",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "protocol",
						label: "Protocol",
						defaultValue: "https",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "sub_url",
						label: "Sub URL",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "USERNAME",
						label: "Username",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "PASSWORD",
						label: "Password",
						defaultValue: "",
						options: {
							component: "password",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "additional",
						label: "Additional Parameters",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "CONNECTION_URL",
						label: "JDBC Url",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},

					{
						fieldName: "FETCH_SIZE",
						label: "Fetch Size",
						defaultValue: "",
						rules: { required: false, min: 0 },
						options: {
							component: "number",
						},
						disabled: false,
						advanced: true,
					},
					{
						fieldName: "CONNECTION_TIMEOUT",
						label: "Connection Timeout",
						defaultValue: "",
						rules: { required: false, min: 0 },
						options: {
							component: "number",
						},
						disabled: false,
						advanced: true,
					},
					{
						fieldName: "USE_CONNECTION_POOLING",
						label: "Use Connection Pooling",
						defaultValue: false,
						rules: { required: false },
						options: {
							component: "checkbox",
						},
						disabled: false,
						advanced: true,
					},
					{
						fieldName: "POOL_MIN_SIZE",
						label: "Pool Min Size",
						defaultValue: "",
						rules: { required: false, min: 0 },
						options: {
							component: "number",
						},
						disabled: false,
						advanced: true,
					},
					{
						fieldName: "POOL_MAX_SIZE",
						label: "Pool Max Size",
						defaultValue: "",
						rules: { required: false, min: 0 },
						options: {
							component: "number",
						},
						disabled: false,
						advanced: true,
					},
				],
			},
			{
				name: "Snowflake",
				disable: false,
				icon: SNOWFLAKE,
				fields: [
					{
						fieldName: "RDBMS_TYPE",
						label: "Driver Name",
						defaultValue: "SNOWFLAKE",
						options: {
							component: "text-field",
						},
						disabled: true,
						rules: { required: true },
						hidden: true,
					},
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
						fieldName: "DATABASE_DESCRIPTION",
						label: "Database Description",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "DATABASE_TAGS",
						label: "Tags",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "hostname",
						label: "Host Name",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "port",
						label: "Port",
						defaultValue: "443",
						options: {
							component: "number",
						},
						disabled: false,
						rules: { required: false, min: 0 },
					},
					{
						fieldName: "warehouse",
						label: "Warehouse",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "role",
						label: "Role",
						defaultValue: "PUBLIC",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "database",
						label: "Database",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},

					{
						fieldName: "schema",
						label: "Schema",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "USERNAME",
						label: "Username",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "PASSWORD",
						label: "Password",
						defaultValue: "",
						options: {
							component: "password",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "additional",
						label: "Additional Parameters",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "CONNECTION_URL",
						label: "JDBC Url",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},

					{
						fieldName: "FETCH_SIZE",
						label: "Fetch Size",
						defaultValue: "",
						rules: { required: false, min: 0 },
						options: {
							component: "number",
						},
						disabled: false,
						advanced: true,
					},
					{
						fieldName: "CONNECTION_TIMEOUT",
						label: "Connection Timeout",
						defaultValue: "",
						rules: { required: false, min: 0 },
						options: {
							component: "number",
						},
						disabled: false,
						advanced: true,
					},
					{
						fieldName: "USE_CONNECTION_POOLING",
						label: "Use Connection Pooling",
						defaultValue: false,
						rules: { required: false },
						options: {
							component: "checkbox",
						},
						disabled: false,
						advanced: true,
					},
					{
						fieldName: "POOL_MIN_SIZE",
						label: "Pool Min Size",
						defaultValue: "",
						rules: { required: false, min: 0 },
						options: {
							component: "number",
						},
						disabled: false,
						advanced: true,
					},
					{
						fieldName: "POOL_MAX_SIZE",
						label: "Pool Max Size",
						defaultValue: "",
						rules: { required: false, min: 0 },
						options: {
							component: "number",
						},
						disabled: false,
						advanced: true,
					},
				],
			},
			{
				name: "SQL Server",
				disable: false,
				icon: SQL_SERVER,
				fields: [
					{
						fieldName: "RDBMS_TYPE",
						label: "Driver Name",
						defaultValue: "SQL_SERVER",
						options: {
							component: "text-field",
						},
						disabled: true,
						rules: { required: true },
						hidden: true,
					},
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
						fieldName: "DATABASE_DESCRIPTION",
						label: "Database Description",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "DATABASE_TAGS",
						label: "Tags",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "hostname",
						label: "Host Name",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "port",
						label: "Port",
						defaultValue: "1433",
						options: {
							component: "number",
						},
						disabled: false,
						rules: { required: false, min: 0 },
					},
					{
						fieldName: "database",
						label: "Database",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "schema",
						label: "Schema",
						defaultValue: "dbo",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "USERNAME",
						label: "Username",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "PASSWORD",
						label: "Password",
						defaultValue: "",
						options: {
							component: "password",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "additional",
						label: "Additional Parameters",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "CONNECTION_URL",
						label: "JDBC Url",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},

					{
						fieldName: "FETCH_SIZE",
						label: "Fetch Size",
						defaultValue: "",
						rules: { required: false, min: 0 },
						options: {
							component: "number",
						},
						disabled: false,
						advanced: true,
					},
					{
						fieldName: "CONNECTION_TIMEOUT",
						label: "Connection Timeout",
						defaultValue: "",
						rules: { required: false, min: 0 },
						options: {
							component: "number",
						},
						disabled: false,
						advanced: true,
					},
					{
						fieldName: "USE_CONNECTION_POOLING",
						label: "Use Connection Pooling",
						defaultValue: false,
						rules: { required: false },
						options: {
							component: "checkbox",
						},
						disabled: false,
						advanced: true,
					},
					{
						fieldName: "POOL_MIN_SIZE",
						label: "Pool Min Size",
						defaultValue: "",
						rules: { required: false, min: 0 },
						options: {
							component: "number",
						},
						disabled: false,
						advanced: true,
					},
					{
						fieldName: "POOL_MAX_SIZE",
						label: "Pool Max Size",
						defaultValue: "",
						rules: { required: false, min: 0 },
						options: {
							component: "number",
						},
						disabled: false,
						advanced: true,
					},
				],
			},

			{
				name: "SQLITE",
				disable: false,
				icon: SQLITE,
				fields: [
					{
						fieldName: "RDBMS_TYPE",
						label: "Driver Name",
						defaultValue: "SQLITE",
						options: {
							component: "text-field",
						},
						disabled: true,
						rules: { required: true },
						hidden: true,
					},
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
						fieldName: "DATABASE_DESCRIPTION",
						label: "Database Description",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "DATABASE_TAGS",
						label: "Tags",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "hostname",
						label: "Host Name",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "port",
						label: "Port",
						defaultValue: "1000",
						options: {
							component: "number",
						},
						disabled: false,
						rules: { required: false, min: 0 },
					},
					{
						fieldName: "USERNAME",
						label: "Username",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "PASSWORD",
						label: "Password",
						defaultValue: "",
						options: {
							component: "password",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "additional",
						label: "Additional Parameters",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "CONNECTION_URL",
						label: "JDBC Url",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},

					{
						fieldName: "FETCH_SIZE",
						label: "Fetch Size",
						defaultValue: "",
						rules: { required: false, min: 0 },
						options: {
							component: "number",
						},
						disabled: false,
						advanced: true,
					},
					{
						fieldName: "CONNECTION_TIMEOUT",
						label: "Connection Timeout",
						defaultValue: "",
						rules: { required: false, min: 0 },
						options: {
							component: "number",
						},
						disabled: false,
						advanced: true,
					},
					{
						fieldName: "USE_CONNECTION_POOLING",
						label: "Use Connection Pooling",
						defaultValue: false,
						rules: { required: false },
						options: {
							component: "checkbox",
						},
						disabled: false,
						advanced: true,
					},
					{
						fieldName: "POOL_MIN_SIZE",
						label: "Pool Min Size",
						defaultValue: "",
						rules: { required: false, min: 0 },
						options: {
							component: "number",
						},
						disabled: false,
						advanced: true,
					},
					{
						fieldName: "POOL_MAX_SIZE",
						label: "Pool Max Size",
						defaultValue: "",
						rules: { required: false, min: 0 },
						options: {
							component: "number",
						},
						disabled: false,
						advanced: true,
					},
				],
			},
			{
				name: "Teradata",
				disable: false,
				icon: TERADATA,
				fields: [
					{
						fieldName: "RDBMS_TYPE",
						label: "Driver Name",
						defaultValue: "TERADATA",
						options: {
							component: "text-field",
						},
						disabled: true,
						rules: { required: true },
						hidden: true,
					},
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
						fieldName: "DATABASE_DESCRIPTION",
						label: "Database Description",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "DATABASE_TAGS",
						label: "Tags",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "hostname",
						label: "Host Name",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "database",
						label: "Database",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "USERNAME",
						label: "Username",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "PASSWORD",
						label: "Password",
						defaultValue: "",
						options: {
							component: "password",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "additional",
						label: "Additional Parameters",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "CONNECTION_URL",
						label: "JDBC Url",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},

					{
						fieldName: "FETCH_SIZE",
						label: "Fetch Size",
						defaultValue: "",
						rules: { required: false, min: 0 },
						options: {
							component: "number",
						},
						disabled: false,
						advanced: true,
					},
					{
						fieldName: "CONNECTION_TIMEOUT",
						label: "Connection Timeout",
						defaultValue: "",
						rules: { required: false, min: 0 },
						options: {
							component: "number",
						},
						disabled: false,
						advanced: true,
					},
					{
						fieldName: "USE_CONNECTION_POOLING",
						label: "Use Connection Pooling",
						defaultValue: false,
						rules: { required: false },
						options: {
							component: "checkbox",
						},
						disabled: false,
						advanced: true,
					},
					{
						fieldName: "POOL_MIN_SIZE",
						label: "Pool Min Size",
						defaultValue: "",
						rules: { required: false, min: 0 },
						options: {
							component: "number",
						},
						disabled: false,
						advanced: true,
					},
					{
						fieldName: "POOL_MAX_SIZE",
						label: "Pool Max Size",
						defaultValue: "",
						rules: { required: false, min: 0 },
						options: {
							component: "number",
						},
						disabled: false,
						advanced: true,
					},
				],
			},
			{
				name: "Tibco",
				disable: false,
				icon: TIBCO,
				fields: [
					{
						fieldName: "RDBMS_TYPE",
						label: "Driver Name",
						defaultValue: "TIBCO",
						options: {
							component: "text-field",
						},
						disabled: true,
						rules: { required: true },
						hidden: true,
					},
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
						fieldName: "DATABASE_DESCRIPTION",
						label: "Database Description",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "DATABASE_TAGS",
						label: "Tags",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "hostname",
						label: "Host Name",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "port",
						label: "Port",
						defaultValue: "1433",
						options: {
							component: "number",
						},
						disabled: false,
						rules: { required: true, min: 0 },
					},
					{
						fieldName: "schema",
						label: "Schema",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "USERNAME",
						label: "Username",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "PASSWORD",
						label: "Password",
						defaultValue: "",
						options: {
							component: "password",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "additional",
						label: "Additional Parameters",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "CONNECTION_URL",
						label: "JDBC Url",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},

					{
						fieldName: "FETCH_SIZE",
						label: "Fetch Size",
						defaultValue: "",
						rules: { required: false, min: 0 },
						options: {
							component: "number",
						},
						disabled: false,
						advanced: true,
					},
					{
						fieldName: "CONNECTION_TIMEOUT",
						label: "Connection Timeout",
						defaultValue: "",
						rules: { required: false, min: 0 },
						options: {
							component: "number",
						},
						disabled: false,
						advanced: true,
					},
					{
						fieldName: "USE_CONNECTION_POOLING",
						label: "Use Connection Pooling",
						defaultValue: false,
						rules: { required: false },
						options: {
							component: "checkbox",
						},
						disabled: false,
						advanced: true,
					},
					{
						fieldName: "POOL_MIN_SIZE",
						label: "Pool Min Size",
						defaultValue: "",
						rules: { required: false, min: 0 },
						options: {
							component: "number",
						},
						disabled: false,
						advanced: true,
					},
					{
						fieldName: "POOL_MAX_SIZE",
						label: "Pool Max Size",
						defaultValue: "",
						rules: { required: false, min: 0 },
						options: {
							component: "number",
						},
						disabled: false,
						advanced: true,
					},
				],
			},
			{
				name: "Trino",
				disable: false,
				icon: TRINO,
				fields: [
					{
						fieldName: "RDBMS_TYPE",
						label: "Driver Name",
						defaultValue: "TRINO",
						options: {
							component: "text-field",
						},
						disabled: true,
						rules: { required: true },
						hidden: true,
					},
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
						fieldName: "DATABASE_DESCRIPTION",
						label: "Database Description",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "DATABASE_TAGS",
						label: "Tags",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "hostname",
						label: "Host Name",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "port",
						label: "Port",
						defaultValue: "1433",
						options: {
							component: "number",
						},
						disabled: false,
						rules: { required: true, min: 0 },
					},
					{
						fieldName: "catalog",
						label: "Catalog",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "schema",
						label: "Schema",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "USERNAME",
						label: "Username",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "PASSWORD",
						label: "Password",
						defaultValue: "",
						options: {
							component: "password",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "additional",
						label: "Additional Parameters",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "CONNECTION_URL",
						label: "JDBC Url",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "FETCH_SIZE",
						label: "Fetch Size",
						defaultValue: "",
						rules: { required: false, min: 0 },
						options: {
							component: "number",
						},
						disabled: false,
						advanced: true,
					},
					{
						fieldName: "CONNECTION_TIMEOUT",
						label: "Connection Timeout",
						defaultValue: "",
						rules: { required: false, min: 0 },
						options: {
							component: "number",
						},
						disabled: false,
						advanced: true,
					},
					{
						fieldName: "USE_CONNECTION_POOLING",
						label: "Use Connection Pooling",
						defaultValue: false,
						rules: { required: false },
						options: {
							component: "checkbox",
						},
						disabled: false,
						advanced: true,
					},
					{
						fieldName: "POOL_MIN_SIZE",
						label: "Pool Min Size",
						defaultValue: "",
						rules: { required: false, min: 0 },
						options: {
							component: "number",
						},
						disabled: false,
						advanced: true,
					},
					{
						fieldName: "POOL_MAX_SIZE",
						label: "Pool Max Size",
						defaultValue: "",
						rules: { required: false, min: 0 },
						options: {
							component: "number",
						},
						disabled: false,
						advanced: true,
					},
				],
			},
		],
	},
	STORAGE: {
		Storage: [
			{
				name: "Amazon S3",
				disable: false,
				icon: AMAZON_S3,
				fields: [
					{
						fieldName: "STORAGE_TYPE",
						label: "Storage Type",
						defaultValue: "AMAZON_S3",
						hidden: true,
						options: {
							component: "text-field",
						},
						disabled: true,
						rules: { required: true },
					},
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
						fieldName: "S3_REGION",
						label: "Region",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "S3_BUCKET",
						label: "Bucket",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "S3_ACCESS_KEY",
						label: "Access Key",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "S3_SECRET_KEY",
						label: "Secret Key",
						defaultValue: "",
						options: {
							component: "password",
						},
						disabled: false,
						rules: { required: false },
					},
				],
			},
			{
				name: "CEPH",
				disable: false,
				icon: CEPH,
				fields: [
					{
						fieldName: "STORAGE_TYPE",
						label: "Storage Type",
						defaultValue: "CEPH",
						hidden: true,
						options: {
							component: "text-field",
						},
						disabled: true,
						rules: { required: true },
					},
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
						fieldName: "CEPH_ACCESS_KEY",
						label: "Access Key",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "CEPH_SECRET_KEY",
						label: "Secret Key",
						defaultValue: "",
						options: {
							component: "password",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "CEPH_ENDPOINT",
						label: "Endpoint",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "CEPH_BUCKET",
						label: "Root Bucket Path",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
				],
			},
			{
				name: "Dreamhost",
				disable: true,
				icon: DREAMHOST,
				fields: [
					{
						fieldName: "STORAGE_TYPE",
						label: "Storage Type",
						defaultValue: "",
						hidden: true,
						options: {
							component: "text-field",
						},
						disabled: true,
						rules: { required: true },
					},
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
						fieldName: "S3_REGION",
						label: "S3 Region",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "S3_ACCESS_KEY",
						label: "S3 Access Key",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "S3_SECRET_KEY",
						label: "S3 Secret Key",
						defaultValue: "",
						options: {
							component: "password",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "S3_ENDPOINT",
						label: "S3 Endpoint",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
				],
			},
			{
				name: "Dropbox",
				disable: false,
				icon: DROPBOX,
				fields: [
					{
						fieldName: "STORAGE_TYPE",
						label: "Storage Type",
						defaultValue: "DROPBOX",
						hidden: true,
						options: {
							component: "text-field",
						},
						disabled: true,
						rules: { required: true },
					},
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
						fieldName: "S3_REGION",
						label: "S3 Region",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "S3_ACCESS_KEY",
						label: "S3 Access Key",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "S3_SECRET_KEY",
						label: "S3 Secret Key",
						defaultValue: "",
						options: {
							component: "password",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "S3_ENDPOINT",
						label: "S3 Endpoint",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
				],
			},
			{
				name: "Google Cloud",
				disable: false,
				icon: GOOGLE_CLOUD,
				fields: [
					{
						fieldName: "STORAGE_TYPE",
						label: "Storage Type",
						defaultValue: "GOOGLE_CLOUD_STORAGE",
						hidden: true,
						options: {
							component: "text-field",
						},
						disabled: true,
						rules: { required: true },
					},
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
						fieldName: "GCS_REGION",
						label: "Region",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "GCS_SERVICE_ACCOUNT_FILE",
						label: "Service Account File",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "GCS_BUCKET",
						label: "Bucket",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
				],
			},
			{
				name: "Google Drive",
				disable: true,
				icon: GOOGLE_DRIVE,
				fields: [],
			},
			{
				name: "Local File System",
				disable: false,
				icon: LOCAL_FILE_SYSTEM,
				fields: [
					{
						fieldName: "STORAGE_TYPE",
						label: "Storage Type",
						defaultValue: "LOCAL_FILE_SYSTEM",
						hidden: true,
						options: {
							component: "text-field",
						},
						disabled: true,
						rules: { required: true },
					},
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
						fieldName: "PATH_PREFIX",
						label: "Local Path Prefix",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
				],
			},
			{
				name: "Microsoft Azure Blob Storage",
				disable: false,
				icon: AZURE_BLOB,
				fields: [
					{
						fieldName: "STORAGE_TYPE",
						label: "Storage Type",
						defaultValue: "MICROSOFT_AZURE_BLOB_STORAGE",
						hidden: true,
						options: {
							component: "text-field",
						},
						disabled: true,
						rules: { required: true },
					},
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
						fieldName: "AZ_ACCOUNT_NAME",
						label: "Account Name",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "AZ_PRIMARY_KEY",
						label: "Primary Key",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "AZ_CONN_STRING",
						label: "Connection String",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "AZ_GENERATE_DYNAMIC_SAS",
						label: "Generate Dynamic SAS",
						defaultValue: "false",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
				],
			},
			{
				name: "Microsoft OneDrive",
				disable: true,
				icon: ONEDRIVE,
				fields: [
					{
						fieldName: "STORAGE_TYPE",
						label: "Storage Type",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: true,
						rules: { required: true },
					},
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
						fieldName: "S3_REGION",
						label: "S3 Region",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "S3_ACCESS_KEY",
						label: "S3 Access Key",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "S3_SECRET_KEY",
						label: "S3 Secret Key",
						defaultValue: "",
						options: {
							component: "password",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "S3_ENDPOINT",
						label: "S3 Endpoint",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
				],
			},
			{
				name: "MinIO",
				disable: false,
				icon: MINIO,
				fields: [
					{
						fieldName: "STORAGE_TYPE",
						label: "Storage Type",
						defaultValue: "MINIO",
						hidden: true,
						options: {
							component: "text-field",
						},
						disabled: true,
						rules: { required: true },
					},
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
						fieldName: "MINIO_REGION",
						label: "Region",
						defaultValue: "us-east-1",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "MINIO_ACCESS_KEY",
						label: "Access Key",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "MINIO_SECRET_KEY",
						label: "Secret Key",
						defaultValue: "",
						options: {
							component: "password",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "MINIO_ENDPOINT",
						label: "Endpoint",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "MINIO_BUCKET",
						label: "Root Bucket Path",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
				],
			},
			{
				name: "Network File System",
				disable: false,
				icon: NETWORK_FILE_SYSTEM,
				fields: [
					{
						fieldName: "STORAGE_TYPE",
						label: "Storage Type",
						defaultValue: "SMB_CIFS",
						hidden: true,
						options: {
							component: "text-field",
						},
						disabled: true,
						rules: { required: true },
					},
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
						fieldName: "NETWORK_DOMAIN",
						label: "Network Domain",
						defaultValue: "US",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "USERNAME",
						label: "Username",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "PASSWORD",
						label: "Password",
						defaultValue: "",
						options: {
							component: "password",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "PATH_PREFIX",
						label: "Network Path Prefix",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
				],
			},

			{
				name: "SFTP",
				disable: false,
				icon: SFTP,
				fields: [
					{
						fieldName: "STORAGE_TYPE",
						label: "Storage Type",
						defaultValue: "SFTP",
						hidden: true,
						options: {
							component: "text-field",
						},
						disabled: true,
						rules: { required: true },
					},
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
						fieldName: "HOSTNAME",
						label: "Host",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "PORT",
						label: "Port",
						defaultValue: "22",
						options: {
							component: "number",
						},
						disabled: false,
						rules: { required: true, min: 0 },
					},
					{
						fieldName: "USERNAME",
						label: "Username",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "PASSWORD",
						label: "Password",
						defaultValue: "",
						options: {
							component: "password",
						},
						disabled: false,
						rules: { required: false },
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
							component: "file-upload",
						},
						disabled: true,
						rules: { required: true },
					},
				],
			},
		],
	},
};

export const ENGINE_IMAGES = {
	MODEL: [
		// Stable provider/brand keys (keep alphabetical)
		{
			name: "AZURE_OPEN_AI",
			icon: AZURE_OPEN_AI,
		},
		{
			name: "BEDROCK",
			icon: BEDROCK,
		},
		{
			name: "BRAIN",
			icon: BRAIN,
		},
		{
			name: "CLAUDE",
			icon: CLAUDE,
		},
		{
			name: "GEMINI",
			icon: GEMINI,
		},
		{
			name: "HUGGINGFACE",
			icon: HUGGINGFACE,
		},
		{
			name: "META",
			icon: META,
		},
		{
			name: "NEMO",
			icon: NEMO,
		},
		{
			name: "OPEN_AI",
			icon: OPEN_AI,
		},
		{
			name: "PERPLEXITY",
			icon: PERPLEXITY,
		},
		{
			name: "TEXT_EMBEDDINGS",
			icon: HUGGINGFACE,
		},
		{
			name: "TEXT_GENERATION",
			icon: HUGGINGFACE,
		},
		{
			name: "VERTEX",
			icon: GEMINI,
		},
		// Self-hosted / long-tail brand keys (keep alphabetical)
		{
			name: "FALCON",
			icon: FALCON,
		},
		{
			name: "FLAN_T5_LARGE",
			icon: FLAN,
		},
		{
			name: "MOSAIC_ML",
			icon: MOSAIC,
		},
		{
			name: "ORCA",
			icon: ORCA,
		},
		{
			name: "REPLIT_CODE_MODEL",
			icon: REPLIT,
		},
		{
			name: "STABLITY_AI",
			icon: STABILITY_AI,
		},
	],
	FUNCTION: [
		{
			name: "AWS_POLLY",
			icon: AWS_POLLY,
		},
		{
			name: "AWS_TEXTRACT",
			icon: AWS_TEXTRACT,
		},
		{
			name: "AWS_TEXTRACT_CUSTOM_EMBEDDINGS",
			icon: AWS_TEXTRACT,
		},
		{
			name: "AWS_TRANSCRIBE",
			icon: AWS_TRANSCRIBE,
		},
		{
			name: "AWS_TRANSCRIBE_CUSTOM_EMBEDDINGS",
			icon: AWS_TRANSCRIBE,
		},
		{
			name: "AWS_Transcribe",
			icon: AWS_TRANSCRIBE,
		},
		{
			name: "AZURE_DOCUMENT_INTELLIGENCE_CUSTOM_EMBEDDINGS",
			icon: REST_API,
		},
		{
			name: "AZUREOCR",
			icon: REST_API,
		},
		{
			name: "GOOGLE_OCR",
			icon: GOOGLE_OCR,
		},
		{
			name: "GOOGLE_OCR_CUSTOM_EMBEDDINGS",
			icon: GOOGLE_OCR,
		},
		{
			name: "GOOGLE_SPEECH_TO_TEXT",
			icon: GOOGLE_SPEECH_TO_TEXT,
		},
		{
			name: "IMAGE_DESCRIPTION",
			icon: BRAIN,
		},
		{
			name: "LOCAL_PYTHON",
			icon: PYTHON,
		},
		{
			name: "LOCAL_PYTHON_CUSTOM_EMBEDDINGS",
			icon: PYTHON,
		},
		{
			name: "OPENAI_TRANSCRIBE",
			icon: OPEN_AI,
		},
		{
			name: "REST",
			icon: REST_API,
		},
		{
			name: "ZIP",
			icon: ZIP,
		},
	],
	GUARDRAIL: [
		{
			name: "DETOXIFY",
			icon: DETOXIFY,
		},
		{
			name: "DETOXIFY",
			icon: DETOXIFY,
		},
		{
			name: "EMBEDDED_DETOXIFY",
			icon: DETOXIFY,
		},
		{
			name: "EMBEDDED_GLINER",
			icon: GLINER,
		},
		{
			name: "EMBEDDED_LAKERA_GUARD",
			icon: BRAIN,
		},
		{
			name: "EMBEDDED_MICROSOFT_CONTENT_MODERATION",
			icon: MICROSOFT,
		},
		{
			name: "EMBEDDED_NVIDIA_NEMO",
			icon: NEMO,
		},
		{
			name: "EMBEDDED_OPENAI_MODERATION",
			icon: OPEN_AI,
		},
		{
			name: "EMBEDDED_PERSPECTIVE_API",
			icon: BRAIN,
		},
		{
			name: "EMBEDDED_PROMPTGUARD_META",
			icon: META,
		},
		{
			name: "LOCAL_PYTHON",
			icon: PYTHON,
		},
		{
			name: "EMBEDDED_REBUFF",
			icon: BRAIN,
		},
		{
			name: "GLINER",
			icon: GLINER,
		},
		{
			name: "GLINER",
			icon: GLINER,
		},
	],
	VECTOR: [
		{
			name: "AWS_S3",
			icon: AMAZON_S3,
		},
		{
			name: "AZURE_AI_SEARCH",
			icon: MICROSOFT,
		},
		{
			name: "CHROMA",
			icon: CHROMADB,
		},
		{
			name: "ELASTIC_SEARCH",
			icon: ELASTIC_SEARCH,
		},
		{
			name: "FAISS",
			icon: META,
		},
		{
			name: "MILVUS",
			icon: MILVUS,
		},
		{
			name: "OPEN_SEARCH",
			icon: OPEN_SEARCH,
		},
		{
			name: "PGVECTOR",
			icon: POSTGRES,
		},
		{
			name: "PINECONE",
			icon: PINECONE,
		},
		{
			name: "PROXY",
			icon: REST_API,
		},
		{
			name: "WEAVIATE",
			icon: WEVIATE,
		},
		{
			name: "ZIP",
			icon: ZIP,
		},
	],
	DATABASE: [
		{
			name: "APACHE_JENA",
			icon: APACHE_JENA,
		},
		{
			name: "ASTER_DB",
			icon: ASTER,
		},
		{
			name: "ATHENA",
			icon: ATHENA,
		},
		{
			name: "BIG_QUERY",
			icon: BIGQUERY,
		},
		{
			name: "CASSANDRA",
			icon: CASSANDRA,
		},
		{
			name: "CLICKHOUSE",
			icon: CLICKHOUSE,
		},
		{
			name: "CSV",
			icon: CSV,
		},
		{
			name: "DATABRICKS",
			icon: DATABRICKS,
		},
		{
			name: "DATASTAX",
			icon: DATASTAX,
		},
		{
			name: "DB2",
			icon: DB2,
		},
		{
			name: "DERBY",
			icon: DERBY,
		},
		{
			name: "ELASTIC_SEARCH",
			icon: ELASTIC_SEARCH,
		},
		{
			name: "EXCEL",
			icon: EXCEL,
		},
		{
			name: "H2",
			icon: H2_DB,
		},
		{
			name: "H2_DB",
			icon: H2_DB,
		},
		{
			name: "HIVE",
			icon: HIVE,
		},
		{
			name: "IMPALA",
			icon: IMPALA,
		},
		{
			name: "JENA",
			icon: APACHE_JENA,
		},
		{
			name: "JENA_TDB",
			icon: APACHE_JENA,
		},
		{
			name: "MARIA_DB",
			icon: MARIA_DB,
		},
		{
			name: "MYSQL",
			icon: MYSQL,
		},
		{
			name: "NEO4J",
			icon: NEO4J,
		},
		{
			name: "OPEN_SEARCH",
			icon: OPEN_SEARCH,
		},
		{
			name: "ORACLE",
			icon: ORACLE,
		},
		{
			name: "PHOENIX",
			icon: PHOENIX,
		},
		{
			name: "POSTGRES",
			icon: POSTGRES,
		},
		{
			name: "RDF4J",
			icon: RDF4J,
		},
		{
			name: "REDSHIFT",
			icon: REDSHIFT,
		},
		{
			name: "SAP_HANA",
			icon: SAP_HANA,
		},
		{
			name: "SEMOSS",
			icon: SEMOSS,
		},
		{
			name: "SESAME",
			icon: RDF4J,
		},
		{
			name: "SNOWFLAKE",
			icon: SNOWFLAKE,
		},
		{
			name: "SQL_SERVER",
			icon: SQL_SERVER,
		},
		{
			name: "SQLITE",
			icon: SQLITE,
		},
		{
			name: "SQLITE",
			icon: SQLITE,
		},
		{
			name: "TERADATA",
			icon: TERADATA,
		},
		{
			name: "TIBCO",
			icon: TIBCO,
		},
		{
			name: "TINKER",
			icon: TINKER,
		},
		{
			name: "TRINO",
			icon: TRINO,
		},
		{
			name: "TSV",
			icon: TSV,
		},
		{
			name: "ZIP",
			icon: ZIP,
		},
	],
	STORAGE: [
		{
			name: "AMAZON_S3",
			icon: AMAZON_S3,
		},
		{
			name: "AMAZON_S3_NATIVE",
			icon: AMAZON_S3,
		},
		{
			name: "CEPH",
			icon: CEPH,
		},
		{
			name: "DREAMHOST",
			icon: DREAMHOST,
		},
		{
			name: "DROPBOX",
			icon: DROPBOX,
		},
		{
			name: "GOOGLE_CLOUD_NATIVE_STORAGE",
			icon: GOOGLE_CLOUD,
		},
		{
			name: "GOOGLE_CLOUD_STORAGE",
			icon: GOOGLE_CLOUD,
		},
		{
			name: "GOOGLE_DRIVE_STORAGE",
			icon: GOOGLE_DRIVE,
		},
		{
			name: "LOCAL_FILE_SYSTEM",
			icon: LOCAL_FILE_SYSTEM,
		},
		{
			name: "MICROSOFT_AZURE_BLOB_STORAGE",
			icon: AZURE_BLOB,
		},
		{
			name: "MICROSOFT_AZURE_NATIVE_BLOB_STORAGE",
			icon: AZURE_BLOB,
		},
		{
			name: "MICROSOFT_ONEDRIVE",
			icon: ONEDRIVE,
		},
		{
			name: "MINIO",
			icon: MINIO,
		},
		{
			name: "NETWORK_FILE_SYSTEM",
			icon: NETWORK_FILE_SYSTEM,
		},
		{
			name: "SFTP",
			icon: SFTP,
		},
		{
			name: "ZIP",
			icon: ZIP,
		},
	],
};

export const SIDEBAR_MENU = {
	MENU: [
		{
			name: "Settings",
			icon: { default: SETTINGS, active: SETTINGS_SELECTED },
		},
		{
			name: "Notebooks",
			icon: { default: NOTEBOOK, active: NOTEBOOK_SELECTED },
		},
		{
			name: "Files",
			icon: { default: FILES, active: FILES_SELECTED },
		},
		{
			name: "Variables",
			icon: { default: VARIABLES, active: VARIABLES_SELECTED },
		},
		{
			name: "Blocks",
			icon: { default: BLOCKS, active: BLOCKS_SELECTED },
		},
		{
			name: "Layers",
			icon: { default: LAYERS, active: LAYERS_SELECTED },
		},
		{
			name: "Terminal",
			icon: {
				default: NOTEBOOK,
				active: NOTEBOOK_SELECTED,
				component: Terminal,
				tooltip: "Terminal",
			},
		},
	],
};
