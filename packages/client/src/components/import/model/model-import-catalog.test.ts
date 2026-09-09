import { describe, expect, it } from "vitest";
import type { ModelVersionsByProvider } from "./model-import.constants";
import {
	type CatalogModelEntry,
	fetchCatalogModels,
	mergeCatalogModels,
} from "./model-import-catalog";

const SONNET: CatalogModelEntry = {
	key: "claude-sonnet-5",
	modelId: "claude-sonnet-5",
	name: "Claude Sonnet 5",
	description: "Balanced Claude model.",
	provider: "anthropic",
	releaseDate: "2026-05-01",
	contextLimit: 1000000,
	outputLimit: 64000,
	inputModalities: ["text", "image"],
	outputModalities: ["text"],
};

const HARDCODED: ModelVersionsByProvider = {
	Anthropic: [
		{
			name: "claude-opus-4-6",
			display: "Claude Opus 4.6",
			icon: "/src/assets/img/CLAUDE_AI.svg",
		},
		{
			name: "other-anthropic-model",
			display: "Other Anthropic Model",
			icon: "/src/assets/img/CLAUDE_AI.svg",
		},
	],
	"Azure OpenAI": [
		{
			name: "azure-openai",
			display: "Azure OpenAI",
			icon: "/src/assets/img/OPEN_AI.svg",
		},
	],
};

describe("mergeCatalogModels", () => {
	it("orders dated cards newest first, undated after, other- cards last", () => {
		const merged = mergeCatalogModels(HARDCODED, { anthropic: [SONNET] });

		// the hardcoded opus card has no catalog date, so it sinks below the
		// dated addition but stays above the catch-all
		expect(merged.Anthropic.map((m) => m.name)).toEqual([
			"claude-sonnet-5",
			"claude-opus-4-6",
			"other-anthropic-model",
		]);
	});

	it("interleaves hardcoded cards by the date of the catalog entry they matched", () => {
		const merged = mergeCatalogModels(HARDCODED, {
			anthropic: [
				{
					key: "claude-opus-4-6",
					modelId: "claude-opus-4-6",
					releaseDate: "2026-06-01",
				},
				SONNET, // 2026-05-01
			],
		});

		// the opus catalog entry dedupes into the hardcoded card but donates
		// its release date, putting the curated card ahead of the addition
		expect(merged.Anthropic.map((m) => m.name)).toEqual([
			"claude-opus-4-6",
			"claude-sonnet-5",
			"other-anthropic-model",
		]);
	});

	it("dates qualified ids like Bedrock's from any host's catalog entries", () => {
		const merged = mergeCatalogModels(
			{
				"AWS Bedrock": [
					{
						name: "anthropic.claude-opus-4-6-v1",
						display: "Claude Opus 4.6 (Bedrock)",
						icon: "/src/assets/img/CLAUDE_AI.svg",
					},
					{
						name: "amazon.titan-embed-text-v1",
						display: "Titan Text Embeddings",
						icon: "/src/assets/img/BEDROCK.svg",
					},
				],
			},
			{
				bedrock: [
					{
						key: "nova-lite",
						modelId: "amazon.nova-lite-v1:0",
						name: "Amazon Nova Lite",
						releaseDate: "2024-12-03",
					},
				],
				anthropic: [
					{
						key: "claude-opus-4-6",
						modelId: "claude-opus-4-6",
						releaseDate: "2026-06-01",
					},
				],
			},
		);

		// the Bedrock claude card borrows claude-opus-4-6's date from the
		// anthropic host list; the undated titan card sinks to the end
		expect(merged["AWS Bedrock"].map((m) => m.name)).toEqual([
			"anthropic.claude-opus-4-6-v1",
			"amazon.nova-lite-v1:0",
			"amazon.titan-embed-text-v1",
		]);
	});

	it("maps catalog fields onto the card shape", () => {
		const merged = mergeCatalogModels(HARDCODED, { anthropic: [SONNET] });
		const card = merged.Anthropic.find((m) => m.name === "claude-sonnet-5");

		expect(card).toMatchObject({
			name: "claude-sonnet-5",
			display: "Claude Sonnet 5",
			description: "Balanced Claude model.",
			icon: "/src/assets/img/CLAUDE_AI.svg",
			modelBrand: "CLAUDE",
			embedding: false,
		});
		expect(card?.formConfig?.fieldOverrides).toEqual(
			expect.arrayContaining([
				{ key: "MAX_TOKENS", patch: { default: 64000 } },
				{ key: "CONTEXT_WINDOW", patch: { default: 1000000 } },
			]),
		);
	});

	it("skips token-limit defaults when the catalog has none", () => {
		const merged = mergeCatalogModels(HARDCODED, {
			anthropic: [
				{ ...SONNET, contextLimit: undefined, outputLimit: undefined },
			],
		});
		const card = merged.Anthropic.find((m) => m.name === "claude-sonnet-5");

		expect(card?.formConfig).toBeUndefined();
	});

	it("dedupes Vertex @default catalog ids against bare hardcoded names", () => {
		const merged = mergeCatalogModels(
			{
				"Google Gemini": [
					{
						name: "claude-sonnet-4-6",
						display: "Claude Sonnet 4.6 (Vertex)",
						icon: "/src/assets/img/CLAUDE_AI.svg",
					},
				],
			},
			{
				google: [
					{
						key: "claude-sonnet-4-6",
						modelId: "claude-sonnet-4-6@default",
						provider: "anthropic",
					},
				],
			},
		);

		expect(merged["Google Gemini"]).toHaveLength(1);
		expect(merged["Google Gemini"][0].display).toBe(
			"Claude Sonnet 4.6 (Vertex)",
		);
	});

	it("gives hosted anthropic models the tab's AnthropicClient form config and Claude branding", () => {
		const merged = mergeCatalogModels(
			{ "Google Gemini": [] },
			{
				google: [
					{
						key: "claude-sonnet-5",
						modelId: "claude-sonnet-5@default",
						name: "Claude Sonnet 5",
						provider: "anthropic",
						releaseDate: "2026-05-01",
						contextLimit: 1000000,
						outputLimit: 64000,
						outputModalities: ["text"],
					},
				],
			},
		);
		const card = merged["Google Gemini"][0];

		expect(card.icon).toBe("/src/assets/img/CLAUDE_AI.svg");
		expect(card.modelBrand).toBe("CLAUDE");
		const overrideKeys = card.formConfig?.fieldOverrides?.map((o) => o.key);
		expect(overrideKeys).toContain("INIT_MODEL_ENGINE");
		expect(overrideKeys).toContain("MAX_TOKENS");
		expect(overrideKeys).toContain("CONTEXT_WINDOW");
		expect(
			card.formConfig?.appendFields?.some(
				(f) => f.field.key === "PROVIDER",
			),
		).toBe(true);
	});

	it("drops catalog models a hardcoded card already covers, treating @ as -", () => {
		const merged = mergeCatalogModels(
			{
				"Google Gemini": [
					{
						name: "claude-haiku-4-5@20251001",
						display: "Claude Haiku 4.5",
						icon: "/src/assets/img/CLAUDE_AI.svg",
					},
				],
			},
			{
				google: [
					{
						key: "claude-haiku-4-5",
						modelId: "claude-haiku-4-5-20251001",
					},
				],
			},
		);

		expect(merged["Google Gemini"]).toHaveLength(1);
	});

	it("leaves providers without a catalog host untouched", () => {
		const merged = mergeCatalogModels(HARDCODED, { anthropic: [SONNET] });

		expect(merged["Azure OpenAI"]).toBe(HARDCODED["Azure OpenAI"]);
	});

	it("flags audio and image output modalities on the card", () => {
		const merged = mergeCatalogModels(HARDCODED, {
			anthropic: [
				{
					...SONNET,
					outputModalities: ["text", "audio", "image"],
				},
			],
		});
		const card = merged.Anthropic.find((m) => m.name === "claude-sonnet-5");

		expect(card?.audio).toBe(true);
		expect(card?.image).toBe(true);
	});
});

describe("fetchCatalogModels", () => {
	it("returns the pixel output on success", async () => {
		const catalog = { anthropic: [SONNET] };
		const result = await fetchCatalogModels(async () => ({
			pixelReturn: [{ output: catalog, operationType: ["OPERATION"] }],
		}));

		expect(result).toEqual(catalog);
	});

	it("returns null when the pixel errors", async () => {
		const result = await fetchCatalogModels(async () => ({
			pixelReturn: [
				{ output: "no such reactor", operationType: ["ERROR"] },
			],
		}));

		expect(result).toBeNull();
	});

	it("returns null when the request throws", async () => {
		const result = await fetchCatalogModels(async () => {
			throw new Error("network down");
		});

		expect(result).toBeNull();
	});
});
