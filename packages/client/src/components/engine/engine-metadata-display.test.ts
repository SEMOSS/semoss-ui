import { describe, expect, it } from "vitest";
import {
	buildReasoningConfigPayload,
	getDefaultEffortWarning,
	getEffortOptions,
	getMandatoryReasoningWarning,
	getModalityWarning,
	getReasoningSupportWarning,
	getTokenLimitWarning,
	getUnlistedModalities,
	hasCatalogEntry,
	type ModelSettingsValues,
	normalizeCatalogModalities,
	normalizeCatalogTokenLimit,
	pickNearestEffort,
	sortEfforts,
	toModelSettingsValues,
	toReasoningConfig,
} from "./engine-metadata-display";

describe("normalizeCatalogModalities", () => {
	it("uppercases and dedupes the catalog's values", () => {
		expect(
			normalizeCatalogModalities(["text", "image", " pdf ", "TEXT"]),
		).toEqual(["TEXT", "IMAGE", "PDF"]);
	});

	it("drops values outside the known modalities", () => {
		expect(normalizeCatalogModalities(["text", "hologram"])).toEqual([
			"TEXT",
		]);
	});

	it("returns nothing for a missing list", () => {
		expect(normalizeCatalogModalities(undefined)).toEqual([]);
		expect(normalizeCatalogModalities(null)).toEqual([]);
	});
});

describe("getUnlistedModalities", () => {
	it("reports selections the catalog does not list", () => {
		expect(
			getUnlistedModalities(["TEXT", "IMAGE", "AUDIO"], ["TEXT", "PDF"]),
		).toEqual(["IMAGE", "AUDIO"]);
	});

	it("stays silent when the catalog has no entry for the model", () => {
		expect(getUnlistedModalities(["TEXT", "IMAGE"], [])).toEqual([]);
	});

	it("stays silent for modalities the catalog cannot express", () => {
		// Embedding models are recorded in meta/model.json with a text output,
		// so VECTOR must never be flagged as unsupported.
		expect(getUnlistedModalities(["VECTOR", "FILE"], ["TEXT"])).toEqual([]);
	});

	it("never flags a cleared modality", () => {
		expect(getUnlistedModalities([], ["TEXT", "IMAGE"])).toEqual([]);
	});
});

describe("getModalityWarning", () => {
	it("names a single unlisted modality", () => {
		expect(
			getModalityWarning("input", ["TEXT", "AUDIO"], ["TEXT", "IMAGE"]),
		).toBe(
			"The model catalog does not list Audio as input for this model. You can still keep it enabled, but the provider may reject requests that use it.",
		);
	});

	it("lists several unlisted modalities", () => {
		expect(
			getModalityWarning("output", ["IMAGE", "AUDIO", "VIDEO"], ["TEXT"]),
		).toBe(
			"The model catalog does not list Image, Audio or Video as output for this model. You can still keep them enabled, but the provider may reject requests that use them.",
		);
	});

	it("says nothing when every selection is listed", () => {
		expect(getModalityWarning("input", ["TEXT"], ["TEXT", "IMAGE"])).toBe(
			"",
		);
	});
});

describe("normalizeCatalogTokenLimit", () => {
	it("keeps a real limit", () => {
		expect(normalizeCatalogTokenLimit(200000)).toBe(200000);
	});

	it("rejects missing and non-integer values", () => {
		expect(normalizeCatalogTokenLimit(undefined)).toBeNull();
		expect(normalizeCatalogTokenLimit(null)).toBeNull();
		expect(normalizeCatalogTokenLimit("not a number")).toBeNull();
		expect(normalizeCatalogTokenLimit(1024.5)).toBeNull();
	});

	it("rejects the output placeholder below the given minimum", () => {
		// meta/model.json uses 0 or 1 for "not a text completion model".
		expect(normalizeCatalogTokenLimit(1, 2)).toBeNull();
		expect(normalizeCatalogTokenLimit(0, 2)).toBeNull();
		expect(normalizeCatalogTokenLimit(2, 2)).toBe(2);
	});
});

describe("getTokenLimitWarning", () => {
	it("warns once the value exceeds the catalog limit", () => {
		expect(getTokenLimitWarning("context window", "300000", 200000)).toBe(
			"The model catalog lists a context window of 200,000 tokens for this model. You can still save a higher value, but the provider may reject requests that exceed its own limit.",
		);
	});

	it("says nothing at or below the catalog limit", () => {
		expect(getTokenLimitWarning("context window", "200000", 200000)).toBe(
			"",
		);
		expect(getTokenLimitWarning("context window", "1000", 200000)).toBe("");
	});

	it("says nothing without a catalog limit or a usable value", () => {
		expect(getTokenLimitWarning("max output", "999999", null)).toBe("");
		expect(getTokenLimitWarning("max output", "", 64000)).toBe("");
	});
});

describe("hasCatalogEntry", () => {
	it("treats an empty map as no entry", () => {
		expect(hasCatalogEntry({})).toBe(false);
		expect(hasCatalogEntry(undefined)).toBe(false);
	});

	it("treats any populated entry as a hit", () => {
		expect(hasCatalogEntry({ id: "gpt-5" })).toBe(true);
	});
});

describe("toReasoningConfig", () => {
	it("keeps a populated config", () => {
		expect(toReasoningConfig({ mandatory: true })).toEqual({
			mandatory: true,
		});
	});

	it("treats empty, missing, and non-objects as no config", () => {
		expect(toReasoningConfig({})).toBeNull();
		expect(toReasoningConfig(null)).toBeNull();
		expect(toReasoningConfig(undefined)).toBeNull();
		expect(toReasoningConfig(["medium"])).toBeNull();
	});
});

describe("toModelSettingsValues", () => {
	it("reads the config into the form fields", () => {
		const values = toModelSettingsValues({
			reasoning: true,
			reasoningConfig: {
				default_effort: "Medium",
				mandatory: true,
				supported_efforts: ["high", "medium", "low", "medium"],
			},
		});

		expect(values.reasoning).toBe("true");
		expect(values.reasoningMandatory).toBe(true);
		expect(values.reasoningDefaultEffort).toBe("medium");
		expect(values.reasoningSupportedEfforts).toEqual([
			"high",
			"medium",
			"low",
		]);
	});

	it("keeps an unset reasoning column distinct from a false one", () => {
		expect(toModelSettingsValues({ reasoning: null }).reasoning).toBe("");
		expect(toModelSettingsValues({ reasoning: false }).reasoning).toBe(
			"false",
		);
	});
});

describe("getReasoningSupportWarning", () => {
	it("warns when nothing on record supports reasoning", () => {
		expect(getReasoningSupportWarning(true, false, false)).toBe(
			"This model is not on record as supporting reasoning. You can still enable it, but the provider may reject or ignore reasoning requests.",
		);
		expect(getReasoningSupportWarning(true, null, undefined)).not.toBe("");
	});

	it("stays silent when either the metadata or the catalog says true", () => {
		expect(getReasoningSupportWarning(true, true, false)).toBe("");
		expect(getReasoningSupportWarning(true, null, true)).toBe("");
	});

	it("never warns about turning reasoning off", () => {
		expect(getReasoningSupportWarning(false, false, false)).toBe("");
	});
});

describe("getMandatoryReasoningWarning", () => {
	it("warns when a mandatory model has reasoning switched off", () => {
		expect(getMandatoryReasoningWarning(false, true)).toBe(
			"Reasoning is mandatory for this model. Turning it off is expected to make requests fail unless the provider has since made it optional.",
		);
	});

	it("stays silent while reasoning is on or the config is optional", () => {
		expect(getMandatoryReasoningWarning(true, true)).toBe("");
		expect(getMandatoryReasoningWarning(false, false)).toBe("");
	});
});

describe("sortEfforts", () => {
	it("orders weakest to strongest regardless of the stored order", () => {
		expect(sortEfforts(["max", "high", "medium", "low"])).toEqual([
			"low",
			"medium",
			"high",
			"max",
		]);
	});

	it("puts unknown values last, keeping their relative order", () => {
		expect(sortEfforts(["zeta", "high", "alpha", "low"])).toEqual([
			"low",
			"high",
			"zeta",
			"alpha",
		]);
	});
});

describe("getEffortOptions", () => {
	it("offers only what the stored config named", () => {
		expect(getEffortOptions(["low", "high"], [""])).toEqual([
			"low",
			"high",
		]);
	});

	it("keeps a stored default that is not in the supported list", () => {
		expect(getEffortOptions(["low"], ["ultra"])).toEqual(["low", "ultra"]);
	});

	it("dedupes across the lists", () => {
		expect(getEffortOptions(["medium"], ["medium"])).toEqual(["medium"]);
	});

	it("offers nothing when the config named nothing", () => {
		expect(getEffortOptions([], [""])).toEqual([]);
	});
});

describe("pickNearestEffort", () => {
	it("keeps a default that is still selected", () => {
		expect(pickNearestEffort("medium", ["low", "medium", "high"])).toBe(
			"medium",
		);
	});

	it("moves to the nearest remaining effort, weaker side on a tie", () => {
		expect(pickNearestEffort("medium", ["low", "high", "max"])).toBe("low");
		expect(pickNearestEffort("low", ["high", "max"])).toBe("high");
	});

	it("never invents a default, and clears when nothing is selected", () => {
		expect(pickNearestEffort("", ["low", "high"])).toBe("");
		expect(pickNearestEffort("medium", [])).toBe("");
	});
});

describe("getDefaultEffortWarning", () => {
	it("warns when the default is not supported", () => {
		expect(getDefaultEffortWarning("xhigh", ["low", "medium"])).toBe(
			"X-High is not one of the supported efforts, so the provider may fall back to its own default.",
		);
	});

	it("stays silent when either side is unset or the default is listed", () => {
		expect(getDefaultEffortWarning("", ["low"])).toBe("");
		expect(getDefaultEffortWarning("low", [])).toBe("");
		expect(getDefaultEffortWarning("low", ["low"])).toBe("");
	});
});

describe("buildReasoningConfigPayload", () => {
	const values: ModelSettingsValues = {
		...toModelSettingsValues(undefined),
		reasoningDefaultEffort: "high",
		reasoningSupportedEfforts: ["high", "low"],
	};

	it("rewrites the edited keys and preserves the rest", () => {
		expect(
			buildReasoningConfigPayload(
				{
					default_effort: "medium",
					default_enabled: true,
					mandatory: true,
					supported_efforts: ["medium"],
					supports_max_tokens: false,
				},
				values,
			),
		).toEqual({
			default_effort: "high",
			default_enabled: true,
			// Not editable in the form, so it round trips untouched.
			mandatory: true,
			supported_efforts: ["high", "low"],
			supports_max_tokens: false,
		});
	});

	it("clears a default effort the form unset", () => {
		expect(
			buildReasoningConfigPayload(
				{ default_effort: "medium" },
				{ ...values, reasoningDefaultEffort: "" },
			),
		).toEqual({
			default_effort: null,
			supported_efforts: ["high", "low"],
		});
	});

	it("invents nothing for a model without a stored config", () => {
		expect(buildReasoningConfigPayload(null, values)).toBeNull();
	});
});
