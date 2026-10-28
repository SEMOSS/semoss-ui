import { describe, expect, it } from "vitest";
import {
	deriveServedModelName,
	formatEta,
	formatServingDuration,
	MAX_SERVED_MODEL_NAME_LENGTH,
	SERVED_MODEL_STATE_LABELS,
	servedModelNameProblem,
	servingLabel,
} from "./model-serving-labels";

describe("served model names", () => {
	it("are suggested from the catalog entry's repository", () => {
		expect(deriveServedModelName("allenai/OLMo-2-0425-1B-Instruct")).toBe(
			"olmo-2-0425-1b-instruct",
		);
		expect(
			deriveServedModelName("allenai/OLMo-2-0425-1B-Instruct@minio"),
		).toBe("olmo-2-0425-1b-instruct-minio");
		expect(deriveServedModelName("example/1b-model")).toBe(
			"model-1b-model",
		);
	});

	it("are cut to the length SEMOSS accepts, without a dash at the end", () => {
		const name = deriveServedModelName(
			`example/${"a".repeat(MAX_SERVED_MODEL_NAME_LENGTH - 1)}-b-${"c".repeat(20)}`,
		);

		expect(name).toHaveLength(MAX_SERVED_MODEL_NAME_LENGTH - 1);
		expect(name.endsWith("-")).toBe(false);
		expect(servedModelNameProblem(name, [])).toBeNull();
	});

	it("are refused when KServe would not take them or they are taken", () => {
		expect(servedModelNameProblem("Olmo", [])).toMatch(/lowercase letters/);
		expect(servedModelNameProblem("olmo-", [])).toMatch(
			/not ending with a dash/,
		);
		expect(servedModelNameProblem("a".repeat(46), [])).toBe(
			"Use at most 45 characters.",
		);
		expect(servedModelNameProblem("olmo-2-1b", ["olmo-2-1b"])).toBe(
			"A served model named olmo-2-1b already exists.",
		);
		expect(
			servedModelNameProblem("olmo-2-1b", ["olmo-2-1b-instruct"]),
		).toBeNull();
	});
});

describe("serving words", () => {
	it("put a value the client does not know in words", () => {
		expect(servingLabel(SERVED_MODEL_STATE_LABELS, "WAITING_FOR_GPU")).toBe(
			"Waiting for GPU",
		);
		expect(
			servingLabel(SERVED_MODEL_STATE_LABELS, "HIBERNATING_SOON"),
		).toBe("Hibernating soon");
		expect(servingLabel(SERVED_MODEL_STATE_LABELS, null)).toBe("Unknown");
	});

	it("round a start's remaining time up to whole minutes", () => {
		expect(formatEta(null)).toBeNull();
		expect(formatEta(30)).toBe("under a minute left");
		expect(formatEta(90)).toBe("about 2 min left");
		expect(formatEta(3_700)).toBe("about 1 h 2 min left");
	});

	it("give a step's length in seconds, minutes and hours", () => {
		expect(formatServingDuration(45)).toBe("45 s");
		expect(formatServingDuration(200)).toBe("3 min 20 s");
		expect(formatServingDuration(120)).toBe("2 min");
		expect(formatServingDuration(3_600)).toBe("1 h");
	});
});
