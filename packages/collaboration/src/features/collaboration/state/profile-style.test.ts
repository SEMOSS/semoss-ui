import { describe, expect, it } from "vitest";
import type { ProfileStyle } from "./collaboration.types";
import { agreedStyle } from "./profile-style";

const style: ProfileStyle = {
	summary: "Short and friendly.",
	source: "learned",
	confirmed: true,
	examples: ["Thanks, will do."],
	variants: {
		internal: { summary: "Casual.", examples: ["Hey team"] },
		external: { summary: "  ", examples: [] },
	},
	pending: { summary: "Not agreed yet.", examples: [], variants: {} },
	learnedAt: "2026-10-29T10:00:00.000Z",
};

describe("agreedStyle", () => {
	it("never includes a proposal still to be reviewed", () => {
		const agreed = agreedStyle(style);
		expect(agreed.pending).toBeUndefined();
		expect(agreed.learnedAt).toBeUndefined();
		expect(JSON.stringify(agreed)).not.toContain("Not agreed yet");
	});

	it("keeps the agreed summary, examples, and variants that have a summary", () => {
		const agreed = agreedStyle(style);
		expect(agreed.summary).toBe("Short and friendly.");
		expect(agreed.examples).toEqual(["Thanks, will do."]);
		expect(Object.keys(agreed.variants ?? {})).toEqual(["internal"]);
	});

	it("leaves a style saved before variants existed unchanged", () => {
		const legacy: ProfileStyle = {
			summary: "Plain.",
			source: "you",
			confirmed: true,
			examples: [],
		};
		expect(agreedStyle(legacy)).toEqual(legacy);
	});
});
