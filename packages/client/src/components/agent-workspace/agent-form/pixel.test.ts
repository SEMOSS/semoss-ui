import { describe, expect, it } from "vitest";
import { buildEditWorkspacePixel, getWorkspaceSaveWarning } from "./pixel";
import { AGENT_FORM_DEFAULT_VALUES } from "./types";

describe("buildEditWorkspacePixel", () => {
	it("persists the master switch and exact disabled default-tool names", () => {
		const pixel = buildEditWorkspacePixel("workspace-1", {
			...AGENT_FORM_DEFAULT_VALUES,
			useDefaultAgentTools: false,
			disabledDefaultTools: ["ReadFile", "WriteFile"],
		});

		expect(pixel).toContain("useDefaultAgentTools=false");
		expect(pixel).toContain(
			'disabledDefaultTools=["ReadFile","WriteFile"]',
		);
	});

	it("sends an empty disabled list so a previous policy can be cleared", () => {
		const pixel = buildEditWorkspacePixel(
			"workspace-1",
			AGENT_FORM_DEFAULT_VALUES,
		);

		expect(pixel).toContain("disabledDefaultTools=[]");
	});
});

describe("getWorkspaceSaveWarning", () => {
	it("returns a backend partial-save warning", () => {
		expect(
			getWorkspaceSaveWarning({ warning: "Config was not saved" }),
		).toBe("Config was not saved");
	});

	it("ignores missing and non-string warnings", () => {
		expect(getWorkspaceSaveWarning(null)).toBeUndefined();
		expect(getWorkspaceSaveWarning({ warning: true })).toBeUndefined();
	});
});
