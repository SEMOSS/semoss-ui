import type {
	CategoryTexts,
	ImportableModels,
	ModelVersionDefinition,
} from "./model-import.constants";

/** Jev uses TypeSafe's evaluation API and does not take chat settings. */
export const JEV_CATEGORY_TEXT: CategoryTexts[string] = {
	General:
		"Connect Jev by TypeSafe to classify, score, and evaluate text or structured data with typed answers.",
	Credentials:
		"Enter your TypeSafe API key. The base URL must be the API root, without /v1/systemone.",
	Settings:
		"Choose whether to retain evaluation inputs and results in the engine's inference logs.",
};

/** Configuration consumed by the shared import form and CreateModelEngine. */
export const JEV_PROVIDER: ImportableModels["providers"][number] = {
	name: "Jev",
	types: [
		{
			model_types: ["evaluation"],
			fields: [
				{
					key: "NAME",
					label: "Catalog Name",
					type: "text",
					required: true,
					category: "General",
					rules: {
						pattern: {
							value: /^[\w\-\s]+$/,
							message:
								"Use letters, numbers, spaces, underscores, or dashes.",
						},
						custom_rules: {
							value: 'CheckEngineName ( "[VALUE]") ;',
							message: "This catalog name is already in use.",
						},
					},
				},
				{
					key: "MODEL",
					label: "Model ID",
					type: "text",
					required: true,
					disabled: true,
					category: "General",
				},
				{
					key: "DESCRIPTION",
					label: "Description",
					type: "textarea",
					required: false,
					default:
						"Jev by TypeSafe: classification, scoring, and yes/no evaluations with structured answers.",
					category: "General",
				},
				{
					key: "MODEL_TYPE",
					label: "Model Type",
					type: "hidden",
					required: true,
					default: "TYPESAFE",
					category: "General",
				},
				{
					key: "MODEL_BRAND",
					label: "Model Brand",
					type: "hidden",
					required: true,
					default: "TYPESAFE",
					category: "General",
				},
				{
					key: "VAR_NAME",
					label: "Variable Name",
					type: "hidden",
					required: true,
					default: "myModel",
					category: "General",
				},
				{
					key: "API_KEY",
					label: "TypeSafe API Key",
					type: "password",
					required: true,
					category: "Credentials",
				},
				{
					key: "BASE_URL",
					label: "API Base URL",
					type: "url",
					required: true,
					default: "https://api.typesafe.ai",
					helperText: "Use the API root, without /v1/systemone.",
					category: "Credentials",
				},
				{
					key: "KEEP_INPUT_OUTPUT",
					label: "Record Evaluation Inputs and Results",
					type: "select",
					required: true,
					options: ["true", "false"],
					optionLabels: { true: "Yes", false: "No" },
					default: "true",
					category: "Settings",
				},
				{
					key: "INIT_MODEL_ENGINE",
					label: "Init Script",
					type: "hidden",
					required: true,
					// SMSS substitutes these properties when initializing Python.
					default:
						// biome-ignore lint/suspicious/noTemplateCurlyInString: engine-side SMSS placeholders
						"from genai_client import TypeSafeClientWrapper;${VAR_NAME} = TypeSafeClientWrapper(api_key='${API_KEY}', model='${MODEL}', base_url='${BASE_URL}')",
					category: "Settings",
				},
			],
			advanced: [],
		},
	],
};

const JEV_CARD_DEFAULTS = {
	icon: "/src/assets/img/TYPESAFE.png",
	modelBrand: "TYPESAFE",
	modelType: "evaluation",
	embedding: false,
	skipCatalogMetadata: true,
	link: "https://docs.typesafe.ai/models",
} satisfies Partial<ModelVersionDefinition>;

/** Public model IDs and aliases documented at https://docs.typesafe.ai/models. */
export const JEV_MODEL_VERSIONS: ModelVersionDefinition[] = [
	{
		...JEV_CARD_DEFAULTS,
		name: "jev-latest",
		display: "Jev Latest",
		description:
			"TypeSafe's latest stable model for typed evaluations. Updates with stable releases.",
	},
	{
		...JEV_CARD_DEFAULTS,
		name: "jev-1.13.0",
		display: "Jev 1.13",
		description:
			"Pin TypeSafe evaluations to Jev 1.13.0. Upgrade on your own schedule.",
	},
	{
		...JEV_CARD_DEFAULTS,
		name: "jev-preview",
		display: "Jev Preview",
		description:
			"TypeSafe's newest Jev, including preview builds. May change ahead of the stable release.",
	},
	{
		...JEV_CARD_DEFAULTS,
		name: "other-jev-model",
		display: "Custom Jev Model",
		description:
			"Use another TypeSafe Jev version or alias with your own model ID and endpoint.",
		formConfig: {
			fieldOverrides: [
				{
					key: "MODEL",
					patch: {
						default: "",
						value: "",
						disabled: false,
						helperText:
							"Enter a Jev model ID or alias from TypeSafe.",
					},
				},
			],
		},
	},
];
