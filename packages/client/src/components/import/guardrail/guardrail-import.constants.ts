import Brain from "@/assets/img/BRAIN.png";
import Database from "@/assets/img/DATABASE.svg";
import Gliner from "@/assets/img/HUGGINGFACE_COLOR.svg";
import Python from "@/assets/img/PYTHON.svg";
export const GUARDRAIL_CONNECTION = {
	description: {
		General:
			"Basic information used to identify the guardrail in the catalog.",
		Settings:
			"Configure how the guardrail evaluates content and which supporting engines it uses.",
		Credentials:
			"Provide any credentials required by the selected guardrail provider.",
	},
	GUARDRAIL: [
		{
			name: "SQL Query Policy",
			disable: false,
			icon: Database,
			form: "sql-query-policy",
			description:
				"Parse SQL into an AST and enforce database-aware policies for operations, identifiers, and risky query structures.",
			fields: [],
			advanced: [],
		},
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
					hidden: true,
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
					hidden: true,
					required: false,
					category: "Settings",
				},
			],
		},
		{
			name: "On Topic",
			disable: false,
			icon: Python,
			description:
				"Checks whether a prompt is on-topic by performing a similarity search against a pre-loaded vector database of example on-topic content. Prompts whose best similarity score falls below the configured threshold are rejected.",
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
					key: "VECTOR_ENGINE_ID",
					label: "Vector Database",
					value: "",
					type: "select",
					options: [],
					optionRule: {
						pixel: `MyEngines(engineTypes=['VECTOR']);`,
						optionDisplay: "engine_name",
						optionValue: "engine_id",
					},
					disabled: false,
					required: true,
					category: "Settings",
					helperText:
						"The vector database pre-loaded with on-topic example prompts/documents used for similarity search.",
				},
				{
					key: "SCORE_IS_DISTANCE",
					label: "Similarity Metric",
					value: "true",
					type: "select",
					options: [
						{ value: "true", display: "L2 Distance" },
						{ value: "false", display: "Cosine" },
					],
					disabled: false,
					required: true,
					category: "Settings",
					helperText:
						"Whether the vector database's Score is a distance (L2) or a similarity (Cosine).",
				},
				{
					key: "DEFAULT_THRESHOLD",
					label: "Default Threshold",
					value: "0.5",
					type: "number",
					disabled: false,
					required: false,
					category: "Settings",
					helperText:
						"Minimum similarity score (0-1) for a prompt to be considered on-topic. Defaults to 0.5.",
				},
				{
					key: "LIMIT",
					label: "Nearest Neighbour Limit",
					value: "5",
					type: "number",
					disabled: false,
					required: false,
					category: "Settings",
					helperText:
						"Number of nearest neighbours retrieved from the vector database per query. Defaults to 5.",
				},
				{
					key: "GUARDRAIL_TYPE",
					label: "Guardrail Type",
					value: "EMBEDDED_ON_TOPIC",
					type: "text",
					disabled: true,
					hidden: true,
					required: false,
					category: "Settings",
				},
			],
		},
		{
			name: "Aggressive / Self-Harm",
			disable: false,
			icon: Brain,
			description:
				"Detects aggressive, violent, or self-harm content in user prompts by routing the check through a configured LLM.",
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
					key: "MODEL_ENGINE_ID",
					label: "Model Engine",
					value: "",
					type: "select",
					options: [],
					optionRule: {
						pixel: `MyEngines(engineTypes=['MODEL']);`,
						optionDisplay: "engine_name",
						optionValue: "engine_id",
					},
					disabled: false,
					required: true,
					category: "Settings",
					helperText:
						"The LLM used to evaluate whether a prompt contains aggressive or self-harm content.",
				},
				{
					key: "SYSTEM_PROMPT",
					label: "System Prompt Override",
					value: "",
					type: "textarea",
					disabled: false,
					required: false,
					category: "Settings",
					helperText:
						"Optional SAFE/UNSAFE classifier instructions. Leave empty to use the built-in self-harm and aggression prompt.",
				},
				{
					key: "BLOCKED_MESSAGE",
					label: "Blocked Message Override",
					value: "",
					type: "textarea",
					disabled: false,
					required: false,
					category: "Settings",
					helperText:
						"Optional message returned when a pipeline is configured to respond on guardrail failure. Leave empty to use the built-in crisis response.",
				},
				{
					key: "FAIL_OPEN",
					label: "On Judge Error",
					value: "false",
					type: "select",
					options: [
						{ value: "false", display: "Block the call" },
						{ value: "true", display: "Allow the call" },
					],
					disabled: false,
					required: true,
					category: "Settings",
					helperText:
						"Choose whether the protected operation is allowed when the judge model is unavailable or errors.",
				},
				{
					key: "GUARDRAIL_TYPE",
					label: "Guardrail Type",
					value: "EMBEDDED_AGGRESSIVE_SELF_HARM",
					type: "text",
					disabled: true,
					hidden: true,
					required: false,
					category: "Settings",
				},
			],
		},
		{
			name: "Policy Compliance",
			disable: false,
			icon: Brain,
			description:
				"Uses an LLM judge to classify prompts, responses, or function data against a configurable policy.",
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
					key: "MODEL_ENGINE_ID",
					label: "Model Engine",
					value: "",
					type: "select",
					options: [],
					optionRule: {
						pixel: `MyEngines(engineTypes=['MODEL']);`,
						optionDisplay: "engine_name",
						optionValue: "engine_id",
					},
					disabled: false,
					required: true,
					category: "Settings",
					helperText:
						"The LLM judge that classifies selected content as SAFE or UNSAFE.",
				},
				{
					key: "POLICY_DESCRIPTION",
					label: "Default Policy",
					value: "",
					type: "textarea",
					disabled: false,
					required: true,
					category: "Settings",
					helperText:
						"Describe precisely what should be classified as UNSAFE. A pipeline can override this policy for an individual use case.",
				},
				{
					key: "SYSTEM_PROMPT",
					label: "System Prompt Override",
					value: "",
					type: "textarea",
					disabled: false,
					required: false,
					category: "Settings",
					helperText: `Optional judge instructions. Use \${POLICY_DESCRIPTION} where the configured or per-call policy should be inserted.`,
				},
				{
					key: "BLOCKED_MESSAGE",
					label: "Blocked Message",
					value: "",
					type: "textarea",
					disabled: false,
					required: false,
					category: "Settings",
					helperText:
						"Optional message returned when an input pipeline responds instead of throwing on a policy failure.",
				},
				{
					key: "FAIL_OPEN",
					label: "On Judge Error",
					value: "false",
					type: "select",
					options: [
						{ value: "false", display: "Block the call" },
						{ value: "true", display: "Allow the call" },
					],
					disabled: false,
					required: true,
					category: "Settings",
					helperText:
						"Block is recommended for sends and other irreversible operations. Allow preserves availability if the judge fails.",
				},
				{
					key: "GUARDRAIL_TYPE",
					label: "Guardrail Type",
					value: "EMBEDDED_POLICY_COMPLIANCE",
					type: "text",
					disabled: true,
					hidden: true,
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
					hidden: true,
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
					hidden: true,
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
					hidden: true,
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
					hidden: true,
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
					hidden: true,
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
					hidden: true,
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
					hidden: true,
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
					hidden: true,
					required: false,
					category: "Settings",
				},
			],
		},
	].sort((left, right) =>
		left.name.localeCompare(right.name, undefined, { sensitivity: "base" }),
	),
};
