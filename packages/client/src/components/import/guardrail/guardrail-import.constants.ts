import Detoxify from "@/assets/img/DETOXIFY.png";
import Gliner from "@/assets/img/GLINER.png";
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
			icon: Detoxify,
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
