import { EngineSubtypeIcon } from "@semoss/shared";
import { buildInitials as getInitials } from "@semoss/utility/text";

// Provider labels shown in UI tabs/section headers are display names (e.g. "Google Gemini"),
// while engine subtypes are keys like "VERTEX", so we translate here.
// Only the top provider labels are mapped.
const MODEL_PROVIDER_SUBTYPE_BY_NAME: Record<string, string> = {
	OpenAI: "OPEN_AI",
	"Google Gemini": "VERTEX",
	Jev: "TYPESAFE",
	"Azure OpenAI": "AZURE_OPEN_AI",
	Anthropic: "CLAUDE",
	"AWS Bedrock": "BEDROCK",
	"NVIDIA NIM": "NEMO",
	"Self Hosted": "HUGGINGFACE",
	Perplexity: "PERPLEXITY",
	Embedded: "BRAIN",
	"Model Router": "MODEL_ROUTER",
};

interface ProviderIconProps {
	/** The provider's display name, as the import tabs show it */
	provider: string;
}

/**
 * A model provider's icon, or its initials when the provider has no known
 * engine subtype.
 */
export const ProviderIcon = ({ provider }: ProviderIconProps) => {
	const subtype = MODEL_PROVIDER_SUBTYPE_BY_NAME[provider];

	if (subtype) {
		return (
			<EngineSubtypeIcon
				engineType="MODEL"
				engineSubtype={subtype}
				alt=""
				className="size-5 rounded-sm object-contain"
			/>
		);
	}

	return (
		<div
			aria-hidden="true"
			className="flex size-5 shrink-0 items-center justify-center rounded-sm bg-muted font-medium text-muted-foreground text-xs"
		>
			{getInitials(provider, 2)}
		</div>
	);
};
