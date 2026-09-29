import { describe, expect, test } from "vitest";
import type { App } from "@/types";
import {
	addSpecialistToRoster,
	getAvailableSpecialists,
} from "./orchestrator-roster-field";

const workspace = (id: string): App => ({
	project_id: id,
	project_name: id,
	project_date_created: "2026-01-01",
	project_type: "WORKSPACE",
	user_permission: 2,
});

describe("Orchestrator roster", () => {
	test("excludes self references and selected specialists", () => {
		const available = getAvailableSpecialists(
			[
				workspace("orchestrator-agent"),
				workspace("pptx-agent"),
				workspace("research-agent"),
			],
			"orchestrator-agent",
			[{ workspaceId: "pptx-agent" }],
		);

		expect(available.map((entry) => entry.project_id)).toEqual([
			"research-agent",
		]);
	});

	test("rejects blank, duplicate, and self-referencing additions", () => {
		const roster = [{ workspaceId: "pptx-agent" }];

		expect(addSpecialistToRoster(roster, "", "orchestrator-agent")).toBe(
			roster,
		);
		expect(
			addSpecialistToRoster(roster, "pptx-agent", "orchestrator-agent"),
		).toBe(roster);
		expect(
			addSpecialistToRoster(
				roster,
				"orchestrator-agent",
				"orchestrator-agent",
			),
		).toBe(roster);
	});

	test("appends an accessible specialist without mutating the roster", () => {
		const roster = [{ workspaceId: "pptx-agent" }];
		const next = addSpecialistToRoster(
			roster,
			"research-agent",
			"orchestrator-agent",
		);

		expect(next).toEqual([
			{ workspaceId: "pptx-agent" },
			{ workspaceId: "research-agent" },
		]);
		expect(roster).toEqual([{ workspaceId: "pptx-agent" }]);
	});
});
