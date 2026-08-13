import Gliner from "@/assets/img/HUGGINGFACE_COLOR.svg";
import Python from "@/assets/img/PYTHON.svg";
export const GUARDRAIL_CONNECTION = {
	description: {
		General:
			"Basic information about the storage catalog such as name, description, tags, type of storage, and high-level metadata.",
		Settings:
			"Configure your storage provider, index structure, dimensionality, and similarity metric to optimize retrieval accuracy and performance.",
		Credentials:
			"Provide your storage API key or connection details to securely enable indexing and search operations.",
	},
	GUARDRAIL: [
		{
			name: "Gliner",
			disable: false,
			icon: Gliner,
			description:
				"Leverage Gliner to implement advanced guardrail capabilities, ensuring safe and compliant AI interactions through content filtering and moderation.",
			fields: [
				{
					key: "MODEL_NAME",
					label: "Catalog Name",
					value: "",
					type: "text",
					disabled: false,
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
					key: "NER_LABELS",
					label: "NER Labels",
					value: "",
					type: "tags",
					disabled: false,
					required: false,
					category: "General",
				},
				{
					key: "DEFAULT_THRESHOLD",
					label: "Default Threshold",
					value: "",
					type: "number",
					disabled: false,
					required: false,
					category: "Settings",
				},
				{
					key: "GUARDRAIL_TYPE",
					label: "Guardrail Type",
					value: "EMBEDDED_GLINER",
					type: "text",
					disabled: true,
					required: false,
					category: "Settings",
				},
			],
		},
		{
			name: "Detoxify",
			disable: false,
			icon: Python,
			description:
				"Utilize Detoxify to enhance your AI systems with robust content moderation capabilities, ensuring safe and responsible interactions by filtering harmful or inappropriate content effectively.",
			fields: [
				{
					key: "MODEL_NAME",
					label: "Catalog Name",
					value: "",
					type: "text",
					disabled: false,
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
					key: "DEFAULT_THRESHOLD",
					label: "DEFAULT THRESHOLD",
					value: "",
					type: "number",
					disabled: false,
					required: false,
					category: "Settings",
				},
				{
					key: "GUARDRAIL_TYPE",
					label: "Guardrail Type",
					value: "EMBEDDED_DETOXIFY",
					type: "text",
					disabled: true,
					required: false,
					category: "Settings",
				},
			],
		},
		{
			name: "Local Python Guardrail",
			disable: false,
			icon: Python,
			description:
				"Run a custom local Python guardrail function that returns pass/fail, an optional modified prompt, and optional detailed metadata.",
			notice: "After creating this guardrail engine, upload your Python file and any supporting files from the guardrail Edit page. The function named in 'Guardrail Function Name' must return a dict with 'pass' (boolean), plus optional 'returnPrompt' (string) if masking is supported and optional 'fullDetails' (object).",
			fields: [
				{
					key: "MODEL_NAME",
					label: "Catalog Name",
					value: "",
					type: "text",
					disabled: false,
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
					key: "GUARDRAIL_TYPE",
					label: "Guardrail Type",
					value: "LOCAL_PYTHON",
					type: "text",
					disabled: true,
					required: false,
					category: "Settings",
				},
				{
					key: "PYTHON_FILE_NAME",
					label: "Python File Name",
					value: "",
					type: "text",
					disabled: false,
					required: true,
					helperText:
						"Enter only the file name (e.g., my_guardrail.py). Upload the file itself from the guardrail Edit page after the engine is created.",
					category: "Settings",
				},
				{
					key: "FUNCTION_NAME",
					label: "Guardrail Function Name",
					value: "",
					type: "text",
					disabled: false,
					required: true,
					helperText:
						"Name of the Python function in your file that will be invoked as the guardrail. It must return a dict with 'pass' plus optional 'returnPrompt' (if masking is supported) and 'fullDetails'.",
					category: "Settings",
				},
				{
					key: "FUNCTION_DESCRIPTION",
					label: "Guardrail Function Description (metadata)",
					value: "",
					type: "text",
					disabled: false,
					required: true,
					category: "Settings",
				},
				{
					key: "FUNCTION_PARAMETERS",
					label: "Guardrail Function Parameters (metadata)",
					value: [],
					type: "parameter-list",
					disabled: false,
					required: false,
					helperText:
						"Define each parameter with a name, type, and description. Add a 'prompt' parameter for prompt-text guardrails.",
					category: "Settings",
				},
				{
					key: "FUNCTION_REQUIRED_PARAMETERS",
					label: "Guardrail Function Required Parameters (metadata)",
					value: [],
					type: "string-list",
					disabled: false,
					required: false,
					helperText:
						"List the parameter names above that must be supplied when the guardrail is executed.",
					category: "Settings",
				},
			],
		},
		{
			name: "Perspective API",
			disable: true,
			description:
				"Detects and scores toxic, abusive, and harassing language in text.",
			fields: [
				{
					key: "MODEL_NAME",
					label: "Catalog Name",
					value: "",
					type: "text",
					disabled: false,
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
					key: "LABELS",
					label: "Labels",
					value: "",
					type: "tags",
					disabled: false,
					required: false,
					category: "General",
				},
				{
					key: "DEFAULT_THRESHOLD",
					label: "Default Threshold",
					value: "",
					type: "number",
					disabled: false,
					required: false,
					category: "Settings",
				},
				{
					key: "GUARDRAIL_TYPE",
					label: "Guardrail Type",
					value: "EMBEDDED_PERSPECTIVE_API",
					type: "text",
					disabled: true,
					required: false,
					category: "Settings",
				},
			],
		},
		{
			name: "OpenAI Moderation",
			disable: true,
			description:
				"Classifies content to identify policy-violating or unsafe text.",
			fields: [
				{
					key: "MODEL_NAME",
					label: "Catalog Name",
					value: "",
					type: "text",
					disabled: false,
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
					key: "CATEGORIES",
					label: "Categories",
					value: "",
					type: "tags",
					disabled: false,
					required: false,
					category: "General",
				},
				{
					key: "DEFAULT_THRESHOLD",
					label: "Default Threshold",
					value: "",
					type: "number",
					disabled: false,
					required: false,
					category: "Settings",
				},
				{
					key: "GUARDRAIL_TYPE",
					label: "Guardrail Type",
					value: "EMBEDDED_OPENAI_MODERATION",
					type: "text",
					disabled: true,
					required: false,
					category: "Settings",
				},
			],
		},
		{
			name: "Microsoft Content Moderation",
			disable: true,
			description:
				"Classifies content to identify policy-violating or unsafe text.",
			fields: [
				{
					key: "MODEL_NAME",
					label: "Catalog Name",
					value: "",
					type: "text",
					disabled: false,
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
					key: "CATEGORIES",
					label: "Categories",
					value: "",
					type: "tags",
					disabled: false,
					required: false,
					category: "General",
				},
				{
					key: "DEFAULT_THRESHOLD",
					label: "Default Threshold",
					value: "",
					type: "number",
					disabled: false,
					required: false,
					category: "Settings",
				},
				{
					key: "GUARDRAIL_TYPE",
					label: "Guardrail Type",
					value: "EMBEDDED_MICROSOFT_CONTENT_MODERATION",
					type: "text",
					disabled: true,
					required: false,
					category: "Settings",
				},
			],
		},
		{
			name: "NVIDIA NEMO GUARDRAILS",
			disable: true,
			description:
				"Classifies content to identify policy-violating or unsafe text.",
			fields: [
				{
					key: "MODEL_NAME",
					label: "Catalog Name",
					value: "",
					type: "text",
					disabled: false,
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
					key: "RULES",
					label: "Rules",
					value: "",
					type: "text",
					disabled: false,
					required: false,
					category: "General",
				},
				{
					key: "ACTION",
					label: "Action",
					value: "",
					type: "text",
					disabled: false,
					required: false,
					category: "General",
				},
				{
					key: "DEFAULT_THRESHOLD",
					label: "Default Threshold",
					value: "",
					type: "number",
					disabled: false,
					required: false,
					category: "Settings",
				},
				{
					key: "GUARDRAIL_TYPE",
					label: "Guardrail Type",
					value: "EMBEDDED_NVIDIA_NEMO",
					type: "text",
					disabled: true,
					required: false,
					category: "Settings",
				},
			],
		},
		{
			name: "REBUFF (Prompt Injection)",
			disable: true,
			description:
				"Detects and scores toxic, abusive, and harassing language in text.",
			fields: [
				{
					key: "MODEL_NAME",
					label: "Catalog Name",
					value: "",
					type: "text",
					disabled: false,
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
					key: "ACTION",
					label: "Action",
					value: "",
					type: "tags",
					disabled: false,
					required: false,
					category: "General",
					helperText:
						"Defines what the system should do when this guardrail is triggered (e.g., block, mask, warn, or log).",
				},
				{
					key: "DEFAULT_THRESHOLD",
					label: "Default Threshold",
					value: "",
					type: "number",
					disabled: false,
					required: false,
					category: "Settings",
				},
				{
					key: "GUARDRAIL_TYPE",
					label: "Guardrail Type",
					value: "EMBEDDED_REBUFF",
					type: "text",
					disabled: true,
					required: false,
					category: "Settings",
				},
			],
		},
		{
			name: "Lakera Guard",
			disable: true,
			description:
				" Provides real-time content moderation to ensure safe and compliant AI interactions.",
			fields: [
				{
					key: "MODEL_NAME",
					label: "Catalog Name",
					value: "",
					type: "text",
					disabled: false,
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
					key: "CATEGORIES",
					label: "Categories",
					value: "",
					type: "tags",
					disabled: false,
					required: false,
					category: "General",
				},
				{
					key: "DEFAULT_THRESHOLD",
					label: "Default Threshold",
					value: "",
					type: "number",
					disabled: false,
					required: false,
					category: "Settings",
				},
				{
					key: "GUARDRAIL_TYPE",
					label: "Guardrail Type",
					value: "EMBEDDED_LAKERA_GUARD",
					type: "text",
					disabled: true,
					required: false,
					category: "Settings",
				},
			],
		},
		{
			name: "PromptGuard (META)",
			disable: true,
			description:
				"Classifies content to identify policy-violating or unsafe text.",
			fields: [
				{
					key: "MODEL_NAME",
					label: "Catalog Name",
					value: "",
					type: "text",
					disabled: false,
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
					key: "DEFAULT_THRESHOLD",
					label: "Default Threshold",
					value: "",
					type: "number",
					disabled: false,
					required: false,
					category: "Settings",
				},
				{
					key: "GUARDRAIL_TYPE",
					label: "Guardrail Type",
					value: "EMBEDDED_PROMPTGUARD_META",
					type: "text",
					disabled: true,
					required: false,
					category: "Settings",
				},
			],
		},
	],
};
