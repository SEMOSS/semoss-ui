import { describe, expect, it } from "vitest";
import { parseAppLogLine } from "./parse-app-log-line";

describe("parseAppLogLine", () => {
	it("parses structured application log lines", () => {
		expect(
			parseAppLogLine(
				"[ERROR] 2026-09-23 11:00:00 p.c.Logger:42 [user=user-1] failed",
			),
		).toEqual({
			raw: "[ERROR] 2026-09-23 11:00:00 p.c.Logger:42 [user=user-1] failed",
			level: "ERROR",
			timestamp: "2026-09-23 11:00:00",
			source: "p.c.Logger:42",
			message: "failed",
		});
	});

	it("preserves stack traces and unknown lines", () => {
		expect(
			parseAppLogLine("\tat example.Stack.method(Stack.java:1)"),
		).toEqual({
			raw: "\tat example.Stack.method(Stack.java:1)",
			level: "OTHER",
		});
	});
});
