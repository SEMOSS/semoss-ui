import AWS_COMPREHEND from "@/assets/img/AWS_COMPREHEND.png";
import AWS_POLLY from "@/assets/img/AWS_POLLY.png";
import AWS_TEXTRACT from "@/assets/img/AWS_TEXTRACT.png";
import AWS_TRANSCRIBE from "@/assets/img/AWS_TRANSCRIBE.png";
import AZURE_SPEECH_TO_TEXT from "@/assets/img/AZURE_SPEECH_TO_TEXT.png";
import GOOGLE_OCR from "@/assets/img/GOOGLE_OCR.png";
import GOOGLE_SPEECH_TO_TEXT from "@/assets/img/GOOGLE_SPEECH_TO_TEXT.png";
import RESTAPI from "@/assets/img/rest-api.svg";
import ZIP from "@/assets/img/ZIP.png";

export const FUNCTION_CONNECTION = {
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
				icon: RESTAPI,
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
				icon: RESTAPI,
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
}

export const ENGINE_IMAGES = {
    FUNCTION: [
            {
                name: "REST",
                icon: RESTAPI,
            },
            {
                name: "ZIP",
                icon: ZIP,
            },
            {
                name: "AZUREOCR",
                icon: RESTAPI,
            },
            {
                name: "AWS - Image Text Extraction",
                icon: AWS_TEXTRACT,
            },
            {
                name: "AWS POLLY",
                icon: AWS_POLLY,
            },
            {
                name: "AWS Transcribe",
                icon: AWS_TRANSCRIBE,
            },
            {
                name: "Google Speech To Text",
                icon: GOOGLE_SPEECH_TO_TEXT,
            },
            {
                name: "Google OCR",
                icon: GOOGLE_OCR,
            },
        ],
}