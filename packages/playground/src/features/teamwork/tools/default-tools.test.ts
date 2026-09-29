import { describe, expect, test } from "vitest";
import { getDefaultToolMode, setDefaultToolMode } from "./default-tools";
import { FOLDER_TOOL_NAMES } from "./folder-tools";

describe("default tool modes", () => {
	test("a tool the setting does not name runs its usual way", () => {
		expect(getDefaultToolMode(undefined, FOLDER_TOOL_NAMES.READ)).toBe(
			"auto",
		);
		expect(getDefaultToolMode({}, FOLDER_TOOL_NAMES.WRITE)).toBe("ask");
		expect(
			getDefaultToolMode(
				{ [FOLDER_TOOL_NAMES.WRITE]: "sometimes" },
				FOLDER_TOOL_NAMES.WRITE,
			),
		).toBe("ask");
	});

	test("stores only the tools set apart from their usual way", () => {
		const setting = setDefaultToolMode(
			undefined,
			FOLDER_TOOL_NAMES.DELETE,
			"disabled",
		);
		expect(setting).toEqual({ [FOLDER_TOOL_NAMES.DELETE]: "disabled" });

		const next = setDefaultToolMode(
			setting,
			FOLDER_TOOL_NAMES.WRITE,
			"auto",
		);
		expect(next).toEqual({
			[FOLDER_TOOL_NAMES.WRITE]: "auto",
			[FOLDER_TOOL_NAMES.DELETE]: "disabled",
		});
		expect(
			setDefaultToolMode(next, FOLDER_TOOL_NAMES.DELETE, "ask"),
		).toEqual({ [FOLDER_TOOL_NAMES.WRITE]: "auto" });
	});
});
