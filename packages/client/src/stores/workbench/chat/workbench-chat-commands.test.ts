import { describe, expect, it } from "vitest";
import {
	getSlashSuggestions,
	parseSlashCommands,
} from "./workbench-chat-commands";

describe("parseSlashCommands", () => {
	it("applies a leading command and keeps the message", () => {
		const result = parseSlashCommands("/effort high\nbuild the page");

		expect(result.effort).toBe("high");
		expect(result.text).toBe("build the page");
		expect(result.feedback).toHaveLength(1);
		expect(result.errors).toHaveLength(0);
	});

	it("resets effort with auto and thinking with default", () => {
		const result = parseSlashCommands("/effort auto\n/thinking default");

		expect(result.effort).toBeNull();
		expect(result.thinking).toBeNull();
		expect(result.text).toBe("");
		expect(result.feedback).toHaveLength(2);
	});

	it("parses thinking on/off and permission modes case-insensitively", () => {
		expect(parseSlashCommands("/thinking on").thinking).toBe(true);
		expect(parseSlashCommands("/THINKING off").thinking).toBe(false);
		expect(parseSlashCommands("/mode plan").permissionMode).toBe("plan");
		expect(parseSlashCommands("/mode acceptedits").permissionMode).toBe(
			"acceptEdits",
		);
	});

	it("flags /compact without consuming other text", () => {
		const result = parseSlashCommands("/compact");

		expect(result.compact).toBe(true);
		expect(result.text).toBe("");
	});

	it("reports a bad argument instead of sending it to the agent", () => {
		const result = parseSlashCommands("/effort supermax\nhello");

		expect(result.effort).toBeUndefined();
		expect(result.errors).toEqual([
			"Usage: /effort auto|low|medium|high|max",
		]);
		expect(result.text).toBe("hello");
	});

	it("leaves unknown slash lines in the message", () => {
		const result = parseSlashCommands("/deploy prod");

		expect(result.text).toBe("/deploy prod");
		expect(result.feedback).toHaveLength(0);
		expect(result.errors).toHaveLength(0);
	});

	it("detects ultrathink without removing it", () => {
		const result = parseSlashCommands("ULTRATHINK about this bug");

		expect(result.ultrathink).toBe(true);
		expect(result.text).toBe("ULTRATHINK about this bug");
	});
});

describe("getSlashSuggestions", () => {
	it("lists all commands for a bare slash and filters by prefix", () => {
		expect(getSlashSuggestions("/").length).toBeGreaterThanOrEqual(4);
		expect(getSlashSuggestions("/ef").map((entry) => entry.label)).toEqual([
			"/effort",
		]);
	});

	it("lists argument options after a completed command name", () => {
		const options = getSlashSuggestions("/effort ");

		expect(options.map((entry) => entry.label)).toEqual([
			"auto",
			"low",
			"medium",
			"high",
			"max",
		]);
		expect(options[0].insertText).toBe("/effort auto");
	});

	it("closes once the draft is a complete command", () => {
		expect(getSlashSuggestions("/compact")).toEqual([]);
		expect(getSlashSuggestions("/effort high")).toEqual([]);
	});

	it("stays closed for non-command drafts", () => {
		expect(getSlashSuggestions("hello /effort")).toEqual([]);
		expect(getSlashSuggestions("/effort high\nmore")).toEqual([]);
	});

	it("marks complete commands executable and argful ones open-ended", () => {
		// The composer executes an accepted suggestion immediately unless its
		// insertText ends with a space (meaning an argument still follows).
		const entries = getSlashSuggestions("/");
		const compact = entries.find((entry) => entry.label === "/compact");
		const effort = entries.find((entry) => entry.label === "/effort");

		expect(compact?.insertText).toBe("/compact");
		expect(effort?.insertText).toBe("/effort ");
		expect(
			getSlashSuggestions("/effort ").every(
				(entry) => !entry.insertText.endsWith(" "),
			),
		).toBe(true);
	});
});
