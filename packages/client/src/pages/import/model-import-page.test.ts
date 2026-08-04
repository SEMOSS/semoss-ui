import { describe, expect, it } from "vitest";
import type {
	FieldDefinition,
	ModelVersionDefinition,
} from "@/components/import/model/model-import.constants";
import {
	buildModelMetadataFields,
	getStaticModelMetadataLookup,
	mergeModelMetadataFields,
} from "./model-import-page";

const GPT_5: ModelVersionDefinition = {
	name: "gpt-5",
	display: "GPT-5",
	icon: "/src/assets/img/OPEN_AI.svg",
};

const GPT_5_STATIC_METADATA = {
	description: "A model for coding, reasoning, and agentic workflows.",
	input_modalities: ["text", "image", "pdf"],
	output_modalities: ["text"],
	context_length: 400000,
	max_input_tokens: 272000,
	max_output_tokens: 128000,
	family: "gpt",
	attachment: true,
	reasoning: true,
	tool_call: true,
	structured_output: true,
	temperature: false,
	knowledge_cutoff: "2024-09-30",
	release_date: "2025-08-07",
	supported_parameters: ["reasoning_effort", "tools"],
	reasoning_config: {
		default_effort: "high",
		default_enabled: false,
		mandatory: false,
		supported_efforts: ["max", "high", "medium", "low"],
		supports_max_tokens: true,
	},
	benchmarks: [{ name: "SWE-Bench", score: 74.9 }],
};

const getField = (fields: FieldDefinition[], key: string) => {
	const field = fields.find((candidate) => candidate.key === key);
	expect(field, `${key} field should exist`).toBeDefined();
	return field as FieldDefinition;
};

describe("static model metadata defaults", () => {
	it("looks up models using the catalog model key", () => {
		expect(getStaticModelMetadataLookup(GPT_5)).toEqual({
			key: "gpt-5",
			modelId: "gpt-5",
		});
	});

	it("maps GPT-5 metadata into visible defaults and persisted hidden fields", () => {
		const metadataFields = buildModelMetadataFields(
			"OpenAI",
			GPT_5,
			GPT_5_STATIC_METADATA,
		);
		const fields: FieldDefinition[] = [
			{
				key: "CONTEXT_WINDOW",
				label: "Context Window",
				type: "number",
				required: true,
				category: "Settings",
				default: 128000,
				helperText: "Existing field settings are preserved.",
			},
			{
				key: "MAX_TOKENS",
				label: "Max Tokens",
				type: "number",
				required: true,
				category: "Settings",
				default: 64000,
			},
		];
		const advanced: FieldDefinition[] = [];

		mergeModelMetadataFields(fields, advanced, metadataFields);

		expect(getField(fields, "CONTEXT_WINDOW")).toMatchObject({
			default: 400000,
			helperText: "Existing field settings are preserved.",
		});
		expect(getField(fields, "CAPABILITY").default).toBe("TEXT_GENERATION");
		expect(getField(fields, "DESCRIPTION")).toMatchObject({
			type: "textarea",
			category: "General",
			default: GPT_5_STATIC_METADATA.description,
		});
		expect(getField(fields, "INPUT_MODALITIES").default).toEqual([
			"TEXT",
			"IMAGE",
			"PDF",
		]);
		expect(getField(fields, "INPUT_MODALITIES").disabledOptions).toEqual([
			"AUDIO",
			"VIDEO",
			"VECTOR",
			"FILE",
		]);
		expect(getField(fields, "OUTPUT_MODALITIES").default).toEqual(["TEXT"]);
		expect(getField(fields, "OUTPUT_MODALITIES").disabledOptions).toEqual([
			"IMAGE",
			"AUDIO",
			"VIDEO",
			"VECTOR",
			"FILE",
			"PDF",
		]);
		expect(getField(fields, "MAX_TOKENS").default).toBe(128000);
		expect(getField(fields, "MAX_INPUT_TOKENS").default).toBe(272000);
		expect(getField(fields, "FAMILY").default).toBe("gpt");
		expect(getField(fields, "ATTACHMENT").default).toBe(true);
		expect(getField(fields, "REASONING").default).toBe(true);
		expect(getField(fields, "TOOL_CALL").default).toBe(true);
		expect(getField(fields, "STRUCTURED_OUTPUT").default).toBe(true);
		expect(getField(fields, "TEMPERATURE").default).toBe(false);
		expect(getField(fields, "KNOWLEDGE_CUTOFF").default).toBe("2024-09-30");
		expect(getField(fields, "RELEASE_DATE").default).toBe("2025-08-07");
		expect(getField(fields, "SUPPORTED_PARAMETERS").default).toBe(
			JSON.stringify(GPT_5_STATIC_METADATA.supported_parameters),
		);
		expect(getField(fields, "REASONING_CONFIG").default).toBe(
			JSON.stringify(GPT_5_STATIC_METADATA.reasoning_config),
		);
		expect(getField(fields, "BENCHMARKS").default).toBe(
			JSON.stringify(GPT_5_STATIC_METADATA.benchmarks),
		);
	});

	it("leaves every modality enabled when static metadata is unavailable", () => {
		const fields = buildModelMetadataFields("OpenAI", GPT_5, null);

		expect(
			getField(fields, "INPUT_MODALITIES").disabledOptions,
		).toBeUndefined();
		expect(
			getField(fields, "OUTPUT_MODALITIES").disabledOptions,
		).toBeUndefined();
		expect(
			fields.some((field) => field.key === "SUPPORTED_PARAMETERS"),
		).toBe(false);
		expect(fields.some((field) => field.key === "REASONING_CONFIG")).toBe(
			false,
		);
		expect(getField(fields, "DESCRIPTION").default).toBe("");
	});
});
