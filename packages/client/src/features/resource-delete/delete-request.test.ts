import { describe, expect, it } from "vitest";
import { getDeleteRequest } from "./delete-request";

describe("getDeleteRequest", () => {
	it.each([
		"DATABASE",
		"STORAGE",
		"MODEL",
		"VECTOR",
		"GUARDRAIL",
		"FUNCTION",
	] as const)("deletes a %s with DeleteEngine", (type) => {
		expect(getDeleteRequest(type, "engine-1")).toEqual({
			pixel: "DeleteEngine(engine=['engine-1']);",
			entityLabel: "engine",
		});
	});

	it("deletes each project type with its own pixel", () => {
		expect(getDeleteRequest("PROJECT", "p-1", "WORKSPACE")).toEqual({
			pixel: "DeleteWorkspace(workspaceId=['p-1']);",
			entityLabel: "agent",
		});
		expect(getDeleteRequest("PROJECT", "p-1", "SKILL")).toEqual({
			pixel: "DeleteSkill(skillId=['p-1']);",
			entityLabel: "skill",
		});
		expect(getDeleteRequest("PROJECT", "p-1", "NOTEBOOK")).toEqual({
			pixel: "DeleteProject(project=['p-1']);",
			entityLabel: "notebook",
		});
		expect(getDeleteRequest("PROJECT", "p-1", "CODE")).toEqual({
			pixel: "DeleteProject(project=['p-1']);",
			entityLabel: "app",
		});
	});

	it("has no request for a type deleted another way", () => {
		expect(getDeleteRequest("WORKSPACE", "p-1")).toBeNull();
	});
});
