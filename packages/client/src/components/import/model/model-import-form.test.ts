import { describe, expect, it } from "vitest";
import type { FieldDefinition } from "./model-import.constants";
import { getUnlistedOptionWarning } from "./model-import-form";

const INPUT_MODALITIES: FieldDefinition = {
	key: "INPUT_MODALITIES",
	label: "Input Modalities",
	type: "multiselect",
	required: true,
	category: "Settings",
	options: ["TEXT", "IMAGE", "AUDIO", "VIDEO", "VECTOR", "FILE", "PDF"],
	warningOptions: ["AUDIO", "VIDEO"],
};

describe("getUnlistedOptionWarning", () => {
	it("warns about every selected option the catalog does not list", () => {
		const warning = getUnlistedOptionWarning(INPUT_MODALITIES, [
			"TEXT",
			"AUDIO",
			"VIDEO",
		]);

		expect(warning).toBe(
			"The model catalog does not list AUDIO or VIDEO among Input Modalities for this model. You can still keep them selected, but the provider may reject requests that use them.",
		);
	});

	it("stays quiet for selections the catalog lists", () => {
		expect(
			getUnlistedOptionWarning(INPUT_MODALITIES, [
				"TEXT",
				"IMAGE",
				"PDF",
			]),
		).toBe("");
	});

	it("stays quiet when the catalog says nothing about the field", () => {
		expect(
			getUnlistedOptionWarning(
				{ ...INPUT_MODALITIES, warningOptions: undefined },
				["AUDIO", "VIDEO"],
			),
		).toBe("");
	});

	it("uses option labels when the field defines them", () => {
		const warning = getUnlistedOptionWarning(
			{
				...INPUT_MODALITIES,
				optionLabels: { AUDIO: "Audio" },
			},
			["AUDIO"],
		);

		expect(warning).toBe(
			"The model catalog does not list Audio among Input Modalities for this model. You can still keep it selected, but the provider may reject requests that use it.",
		);
	});
});
