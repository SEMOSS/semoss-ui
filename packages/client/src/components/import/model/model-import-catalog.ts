import {
	AWS_BEDROCK_ANTHROPIC_FORM_CONFIG,
	GOOGLE_ANTHROPIC_FORM_CONFIG,
	type ModelFormConfig,
	type ModelVersionDefinition,
	type ModelVersionsByProvider,
	withModelTokenLimits,
} from "./model-import.constants";

/**
 * One importable model as returned by the ListStaticModelCatalog pixel: a
 * meta/model.json entry paired with the exact model id a serving host uses
 * for it. Everything but key/modelId is optional - the catalog is sparse.
 */
export interface CatalogModelEntry {
	key: string;
	modelId: string;
	name?: string;
	description?: string;
	family?: string;
	provider?: string;
	releaseDate?: string;
	contextLimit?: number;
	outputLimit?: number;
	inputModalities?: string[];
	outputModalities?: string[];
	reasoning?: boolean;
	toolCall?: boolean;
}

export type CatalogModelsByHost = Record<string, CatalogModelEntry[]>;

/**
 * Which catalog serving host feeds each Add-Model provider tab. Tabs not
 * listed here (Azure OpenAI, Self Hosted, Embedded, Model Router) stay fully
 * hand-curated - the catalog cannot produce their model ids.
 */
const CATALOG_HOST_BY_PROVIDER: Record<string, string> = {
	OpenAI: "openai",
	Anthropic: "anthropic",
	"Google Gemini": "google",
	"AWS Bedrock": "bedrock",
	"NVIDIA NIM": "nvidia",
	Perplexity: "perplexity",
};

const CARD_PRESENTATION_BY_PROVIDER: Record<
	string,
	{ icon: string; modelBrand?: string }
> = {
	OpenAI: { icon: "/src/assets/img/OPEN_AI.svg", modelBrand: "OPEN_AI" },
	Anthropic: { icon: "/src/assets/img/CLAUDE_AI.svg", modelBrand: "CLAUDE" },
	"Google Gemini": {
		icon: "/src/assets/img/GEMINI_COLOR.svg",
		modelBrand: "GEMINI",
	},
	"AWS Bedrock": { icon: "/src/assets/img/BEDROCK.svg" },
	"NVIDIA NIM": { icon: "/src/assets/img/NEMO.png", modelBrand: "NEMO" },
	Perplexity: {
		icon: "/src/assets/img/PERPLEXITY.svg",
		modelBrand: "PERPLEXITY",
	},
};

interface PixelResponse {
	pixelReturn: {
		output: unknown;
		operationType: string | string[];
	}[];
}

/**
 * Fetch the catalog's importable models grouped by serving host. Returns null
 * on any failure - an older server without the reactor, a missing catalog
 * file, a network error - so the caller can fall back to the hardcoded cards.
 */
export const fetchCatalogModels = async (
	runQuery: (pixel: string) => Promise<PixelResponse>,
): Promise<CatalogModelsByHost | null> => {
	try {
		const response = await runQuery("ListStaticModelCatalog()");
		const { output, operationType } = response.pixelReturn[0];
		if (operationType.indexOf("ERROR") > -1) {
			return null;
		}
		return (output as CatalogModelsByHost) ?? null;
	} catch {
		return null;
	}
};

// hardcoded gemini ids and Vertex "@date" ids should collide with their
// catalog spellings, so compare case-insensitively with @ treated as - and
// Vertex's "@default"/"@latest" qualifiers treated as the bare id
const normalizeCardName = (name: string) =>
	name
		.trim()
		.toLowerCase()
		.replace(/@(default|latest)$/, "")
		.replace(/@/g, "-");

/**
 * Anthropic models hosted on another provider's tab need that tab's
 * AnthropicClient init script, not the tab's default engine - a Vertex
 * Claude card submitted with the Gemini init would not start.
 */
const ANTHROPIC_HOSTED_FORM_CONFIG: Record<string, ModelFormConfig> = {
	"Google Gemini": GOOGLE_ANTHROPIC_FORM_CONFIG,
	"AWS Bedrock": AWS_BEDROCK_ANTHROPIC_FORM_CONFIG,
};

/**
 * A card name and the progressively more generic ids it also answers to,
 * most specific first - qualifier prefixes, ":0"-style version suffixes, and
 * date suffixes peeled off the way the server's catalog lookup does, so
 * "anthropic.claude-opus-4-6-v1" can borrow the release date the catalog
 * holds under "claude-opus-4-6".
 */
const nameVariants = (name: string): string[] => {
	const variants = new Set<string>([normalizeCardName(name)]);
	for (const variant of variants) {
		let remainder = variant;
		while (true) {
			const stripped = remainder.replace(/^[a-z][a-z-]*\.(?=.)/, "");
			if (stripped === remainder) break;
			remainder = stripped;
			variants.add(remainder);
		}
	}
	for (const variant of variants) {
		variants.add(variant.replace(/-v\d+(?::\d+)?$/, ""));
	}
	for (const variant of variants) {
		variants.add(variant.replace(/-\d{4}-?\d{2}-?\d{2}$/, ""));
	}
	return [...variants];
};

/**
 * Release dates for every id and alias the catalog response knows, across all
 * hosts, so hardcoded cards can be dated too. On alias collisions the newest
 * date wins - close enough for ordering a card grid.
 */
const buildReleaseDates = (
	catalog: CatalogModelsByHost,
): Map<string, string> => {
	const dates = new Map<string, string>();
	for (const entries of Object.values(catalog)) {
		if (!Array.isArray(entries)) continue;
		for (const entry of entries) {
			if (!entry?.releaseDate) continue;
			const aliases = new Set([
				...nameVariants(entry.modelId ?? ""),
				...nameVariants(entry.key ?? ""),
			]);
			for (const alias of aliases) {
				if (!alias) continue;
				const existing = dates.get(alias);
				if (!existing || entry.releaseDate > existing) {
					dates.set(alias, entry.releaseDate);
				}
			}
		}
	}
	return dates;
};

const lookupReleaseDate = (
	name: string,
	dates: Map<string, string>,
): string | undefined => {
	for (const variant of nameVariants(name)) {
		const date = dates.get(variant);
		if (date) return date;
	}
	return undefined;
};

const toModelVersion = (
	entry: CatalogModelEntry,
	provider: string,
): ModelVersionDefinition => {
	const anthropicHosted =
		entry.provider === "anthropic"
			? ANTHROPIC_HOSTED_FORM_CONFIG[provider]
			: undefined;
	const presentation = anthropicHosted
		? CARD_PRESENTATION_BY_PROVIDER.Anthropic
		: CARD_PRESENTATION_BY_PROVIDER[provider];
	const card: ModelVersionDefinition = {
		name: entry.modelId,
		display: entry.name || entry.modelId,
		icon: presentation?.icon ?? "",
		modelBrand: presentation?.modelBrand,
		embedding: false,
		description: entry.description,
	};
	if (entry.outputModalities?.includes("audio")) {
		card.audio = true;
	}
	if (entry.outputModalities?.includes("image")) {
		card.image = true;
	}
	if (entry.outputLimit && entry.contextLimit) {
		card.formConfig = withModelTokenLimits(
			anthropicHosted,
			entry.outputLimit,
			entry.contextLimit,
		);
	} else if (anthropicHosted) {
		card.formConfig = anthropicHosted;
	}
	return card;
};

/**
 * Merge catalog models into the hardcoded card lists. Hardcoded cards always
 * win on a name collision (they carry curated descriptions and form configs),
 * but the combined grid is ordered newest release first - hardcoded cards
 * borrow their release date from the catalog entry they matched, cards the
 * catalog cannot date sink to the end, and the "other-" catch-alls stay last.
 */
export const mergeCatalogModels = (
	hardcoded: ModelVersionsByProvider,
	catalog: CatalogModelsByHost,
): ModelVersionsByProvider => {
	const merged: ModelVersionsByProvider = { ...hardcoded };
	const releaseDates = buildReleaseDates(catalog);

	for (const [provider, host] of Object.entries(CATALOG_HOST_BY_PROVIDER)) {
		const entries = catalog[host];
		if (!Array.isArray(entries) || entries.length === 0) {
			continue;
		}

		const existing = hardcoded[provider] ?? [];
		const existingNames = new Set(
			existing.map((model) => normalizeCardName(model.name)),
		);
		const additions = entries
			.filter(
				(entry) =>
					entry?.modelId &&
					!existingNames.has(normalizeCardName(entry.modelId)),
			)
			.map((entry) => toModelVersion(entry, provider));
		if (additions.length === 0) {
			continue;
		}

		const curated = existing.filter(
			(model) => !model.name.startsWith("other-"),
		);
		const catchAll = existing.filter((model) =>
			model.name.startsWith("other-"),
		);
		// stable sort: dated cards newest first, undated keep their curated
		// order after every dated card
		const dated = [...curated, ...additions].sort((a, b) => {
			const dateA = lookupReleaseDate(a.name, releaseDates);
			const dateB = lookupReleaseDate(b.name, releaseDates);
			if (dateA && dateB) return dateB.localeCompare(dateA);
			if (dateA) return -1;
			if (dateB) return 1;
			return 0;
		});
		merged[provider] = [...dated, ...catchAll];
	}

	return merged;
};
