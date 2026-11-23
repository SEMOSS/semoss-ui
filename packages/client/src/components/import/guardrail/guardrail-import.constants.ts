import AggressiveSelfHarm from "@/assets/img/AGGRESSIVE_SELF_HARM.svg";
import Detoxify from "@/assets/img/DETOXIFY.svg";
import HuggingFace from "@/assets/img/HUGGINGFACE_COLOR.svg";
import OnTopic from "@/assets/img/ON_TOPIC.svg";
import PolicyCompliance from "@/assets/img/POLICY_COMPLIANCE.svg";
import Python from "@/assets/img/PYTHON.svg";
import SqlQueryPolicy from "@/assets/img/SQL_QUERY_POLICY.svg";
import TypeSafe from "@/assets/img/TYPESAFE.png";
import { CATALOG_NAME_KEY } from "@/components/import/shared/import-form.constants";
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
			icon: SqlQueryPolicy,
			form: "sql-query-policy",
			description:
				"Parse SQL into an AST and enforce database-aware policies for operations, identifiers, and risky query structures.",
			fields: [],
			advanced: [],
		},
		{
			name: "Jev Policy",
			disable: false,
			icon: TypeSafe,
			form: "jev-policy",
			description:
				"Have a Jev model by TypeSafe answer a typed yes or no or choice question about the text, and block or allow the call by its answer.",
			fields: [],
			advanced: [],
		},
		{
			name: "Gliner",
			disable: false,
			icon: HuggingFace,
			description:
				"Leverage Gliner to implement advanced guardrail capabilities, ensuring safe and compliant AI interactions through content filtering and moderation.",
			fields: [
				{
					key: CATALOG_NAME_KEY,
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
					key: "MODEL_NAME",
					label: "Model Repository",
					value: "urchade/gliner_multi-v2.1",
					type: "text",
					disabled: false,
					required: true,
					category: "Settings",
					helperText:
						"The Hugging Face repository of the GLiNER model to load, such as urchade/gliner_multi-v2.1.",
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
			icon: Detoxify,
			description:
				"Utilize Detoxify to enhance your AI systems with robust content moderation capabilities, ensuring safe and responsible interactions by filtering harmful or inappropriate content effectively.",
			fields: [
				{
					key: CATALOG_NAME_KEY,
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
			icon: OnTopic,
			description:
				"Checks whether a prompt is on-topic by performing a similarity search against a pre-loaded vector database of example on-topic content. Prompts whose best similarity score falls below the configured threshold are rejected.",
			fields: [
				{
					key: CATALOG_NAME_KEY,
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
					type: "engine",
					engineRule: { engineTypes: ["VECTOR"] },
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
			icon: AggressiveSelfHarm,
			description:
				"Detects aggressive, violent, or self-harm content in user prompts by routing the check through a configured LLM.",
			fields: [
				{
					key: CATALOG_NAME_KEY,
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
					type: "engine",
					engineRule: { engineTypes: ["MODEL"] },
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
					key: "JUDGE_ERROR_VERDICT",
					label: "When the Judge Fails",
					value: "BLOCK",
					type: "select",
					options: [
						{ value: "BLOCK", display: "Block the call" },
						{ value: "PASS", display: "Allow the call" },
					],
					disabled: false,
					required: true,
					category: "Settings",
					helperText:
						"Choose whether the protected operation is allowed when the judge model is unavailable, errors, or answers with neither SAFE nor UNSAFE.",
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
			icon: PolicyCompliance,
			description:
				"Uses an LLM judge to classify prompts, responses, or function data against a configurable policy.",
			fields: [
				{
					key: CATALOG_NAME_KEY,
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
					type: "engine",
					engineRule: { engineTypes: ["MODEL"] },
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
					key: "JUDGE_ERROR_VERDICT",
					label: "When the Judge Fails",
					value: "BLOCK",
					type: "select",
					options: [
						{ value: "BLOCK", display: "Block the call" },
						{ value: "PASS", display: "Allow the call" },
					],
					disabled: false,
					required: true,
					category: "Settings",
					helperText:
						"Block is recommended for sends and other irreversible operations. Allow preserves availability if the judge fails or answers with neither SAFE nor UNSAFE.",
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
					key: CATALOG_NAME_KEY,
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
			name: "Prompt Injection",
			disable: false,
			icon: HuggingFace,
			description:
				"Run a Hugging Face text-classification model on each prompt and block the labels you mark, such as prompt injection attempts.",
			fields: [
				{
					key: CATALOG_NAME_KEY,
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
					key: "MODEL_NAME",
					label: "Model Repository",
					value: "protectai/deberta-v3-base-prompt-injection-v2",
					type: "text",
					disabled: false,
					required: true,
					category: "Settings",
					helperText:
						"The Hugging Face repository of the text-classification model to load, such as protectai/deberta-v3-base-prompt-injection-v2.",
				},
				{
					key: "LABEL_DECISION_MAP",
					label: "Label Decisions",
					value: '{"SAFE":"PASS","INJECTION":"BLOCK"}',
					type: "textarea",
					disabled: false,
					required: true,
					category: "Settings",
					helperText:
						'A JSON object that maps each label the model returns to BLOCK or PASS, such as {"SAFE":"PASS","INJECTION":"BLOCK"}. Use the exact labels the model produces.',
				},
				{
					key: "DEFAULT_THRESHOLD",
					label: "Default Threshold",
					value: "",
					type: "number",
					disabled: false,
					required: false,
					category: "Settings",
					helperText:
						"The score at or above which a label marked BLOCK fails the check. Defaults to 0.7.",
				},
				{
					key: "DEFAULT_DECISION",
					label: "Unmapped Labels",
					value: "BLOCK",
					type: "select",
					options: [
						{ value: "BLOCK", display: "Block the call" },
						{ value: "PASS", display: "Allow the call" },
					],
					disabled: false,
					required: true,
					category: "Settings",
					helperText:
						"Choose what happens when the model returns a label that Label Decisions does not list.",
				},
				{
					key: "DEFAULT_MAX_LENGTH",
					label: "Max Length",
					value: "",
					type: "number",
					disabled: false,
					required: false,
					category: "Settings",
					helperText:
						"The most tokens of the prompt the model reads. Defaults to 512.",
				},
				{
					key: "GUARDRAIL_TYPE",
					label: "Guardrail Type",
					value: "EMBEDDED_PROMPT_INJECTION",
					type: "text",
					disabled: true,
					hidden: true,
					required: false,
					category: "Settings",
				},
			],
			advanced: [
				{
					key: "DEVICE",
					label: "Device",
					value: "",
					type: "text",
					disabled: false,
					required: false,
					category: "Settings",
					helperText:
						"The device the model runs on, such as cpu or cuda:0. Leave empty to choose automatically.",
				},
			],
		},
	].sort((left, right) =>
		left.name.localeCompare(right.name, undefined, { sensitivity: "base" }),
	),
};
