import { describe, expect, it } from "vitest";
import { buildEditWorkspacePixel } from "./pixel";
import { AGENT_FORM_DEFAULT_VALUES } from "./types";

describe("buildEditWorkspacePixel", () => {
	it("preserves Pixel hook bindings in the EditWorkspace payload", () => {
		const pixel = buildEditWorkspacePixel("agent-1", {
			...AGENT_FORM_DEFAULT_VALUES,
			hooks: [
				{
					kind: "pixel",
					pixel: "LogMessage(message=hookOutput);",
					events: ["afterRun"],
					bindings: { hookOutput: "result.finalText" },
				},
			],
		});

		expect(pixel).toContain('"bindings":{"hookOutput":"result.finalText"}');
	});
});
