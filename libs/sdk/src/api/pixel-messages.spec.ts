import { describe, expect, it } from "vitest";
import { readPixelMessages } from "./pixel-messages";

describe("readPixelMessages", () => {
	it("splits the success messages from the warnings, in order", () => {
		expect(
			readPixelMessages({
				additionalOutput: [
					{ output: "Closed engine a", operationType: ["SUCCESS"] },
					{
						output: "Could not tell the cluster",
						operationType: ["WARNING"],
					},
					{ output: "Closed engine b", operationType: ["SUCCESS"] },
				],
			}),
		).toEqual({
			success: ["Closed engine a", "Closed engine b"],
			warnings: ["Could not tell the cluster"],
		});
	});

	it("skips entries that are not text messages", () => {
		expect(
			readPixelMessages({
				additionalOutput: [
					null,
					"loose text",
					{ output: { rows: 1 }, operationType: ["SUCCESS"] },
					{ output: "no type" },
					{ output: "other", operationType: ["CODE_EXECUTION"] },
				],
			}),
		).toEqual({ success: [], warnings: [] });
	});

	it("reads nothing from a statement without additional output", () => {
		expect(readPixelMessages(undefined)).toEqual({
			success: [],
			warnings: [],
		});
		expect(readPixelMessages({})).toEqual({ success: [], warnings: [] });
	});
});
