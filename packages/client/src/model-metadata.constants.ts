export type ModelMetadataOption = {
	label: string;
	value: string;
};

export const MODEL_PROVIDER_OPTIONS: ModelMetadataOption[] = [
	{ label: "OpenAI", value: "OPENAI" },
	{ label: "Anthropic", value: "ANTHROPIC" },
	{ label: "Google", value: "GOOGLE" },
	{ label: "Amazon", value: "AMAZON" },
	{ label: "Meta", value: "META" },
	{ label: "NVIDIA", value: "NVIDIA" },
	{ label: "Mistral AI", value: "MISTRAL_AI" },
	{ label: "Perplexity", value: "PERPLEXITY" },
	{ label: "Microsoft", value: "MICROSOFT" },
	{ label: "Stability AI", value: "STABILITY_AI" },
	{ label: "Databricks / MosaicML", value: "DATABRICKS" },
	{ label: "Replit", value: "REPLIT" },
	{
		label: "Technology Innovation Institute",
		value: "TII",
	},
	{ label: "Hugging Face", value: "HUGGING_FACE" },
	{ label: "Other / Custom", value: "OTHER" },
];

export const SERVING_PROVIDER_OPTIONS: ModelMetadataOption[] = [
	{ label: "OpenAI", value: "OPENAI" },
	{ label: "Anthropic", value: "ANTHROPIC" },
	{ label: "Azure OpenAI", value: "AZURE_OPENAI" },
	{ label: "AWS Bedrock", value: "AWS_BEDROCK" },
	{ label: "Google Vertex AI", value: "GOOGLE_VERTEX" },
	{ label: "NVIDIA NIM", value: "NVIDIA_NIM" },
	{ label: "Perplexity", value: "PERPLEXITY" },
	{ label: "Self-hosted / Custom Endpoint", value: "SELF_HOSTED" },
	{ label: "Local / Embedded", value: "LOCAL" },
];

export const getOptionLabels = (options: ModelMetadataOption[]) =>
	Object.fromEntries(options.map(({ label, value }) => [value, label]));
