import { expect, it, vi } from "vitest";
import type { InsightActions } from "@/lib/pixel";
import { getTwinKind } from "./twin-kind";

// the agent's own row in the twin list, and in the list of twins the person created
const ROW =
	'MyProjects(projectType=["WORKSPACE"], metaFilters=[{"digital_twin":["true"]}], noMeta=[true], project=["agent-1"], limit=[1]);';
const MINE =
	'MyProjects(projectType=["WORKSPACE"], metaFilters=[{"digital_twin":["true"]}], noMeta=[true], project=["agent-1"], limit=[1], createdByMe=[true]);';

const row = (owner?: string | null) => ({
	project_id: "agent-1",
	project_name: "Renewals",
	digital_twin_owner_name: owner,
});

/** A server that answers each pixel from `answers`; an Error is a refusal. */
function server(answers: Record<string, unknown>) {
	const run = vi.fn(async (pixel: string) => {
		const output = answers[pixel];
		if (output instanceof Error) throw output;
		return { pixelReturn: [{ output, operationType: ["OPERATION"] }] };
	});
	return { run, actions: { run } as unknown as InsightActions };
}

it("asks for the agent's own row in the twin list and among the twins the person created, and nothing else", async () => {
	const { run, actions } = server({ [ROW]: [], [MINE]: [] });
	await expect(getTwinKind(actions, "agent-1")).resolves.toEqual({
		kind: "agent",
	});
	expect(run.mock.calls.map(([pixel]) => pixel).sort()).toEqual(
		[ROW, MINE].sort(),
	);
});

it("tells a twin shared with the person, with whose it is when the server knows", async () => {
	await expect(
		getTwinKind(
			server({ [ROW]: [row(" Dana Ortiz ")], [MINE]: [] }).actions,
			"agent-1",
		),
	).resolves.toEqual({ kind: "sharedTwin", ownerName: "Dana Ortiz" });
	await expect(
		getTwinKind(
			server({ [ROW]: [row(null)], [MINE]: [] }).actions,
			"agent-1",
		),
	).resolves.toEqual({ kind: "sharedTwin", ownerName: undefined });
});

it("tells a twin the person created from one shared with them", async () => {
	await expect(
		getTwinKind(
			server({ [ROW]: [row("Robin Hale")], [MINE]: [row("Robin Hale")] })
				.actions,
			"agent-1",
		),
	).resolves.toEqual({ kind: "ownTwin" });
});

it("takes a row for another project as no answer about this agent", async () => {
	const other = { ...row("Dana Ortiz"), project_id: "agent-2" };
	await expect(
		getTwinKind(
			server({ [ROW]: [other], [MINE]: [other] }).actions,
			"agent-1",
		),
	).resolves.toEqual({ kind: "agent" });
});

it("fails when either list cannot be read, so the chat says no more than it knows", async () => {
	await expect(
		getTwinKind(
			server({ [ROW]: [row()], [MINE]: new Error("Offline") }).actions,
			"agent-1",
		),
	).rejects.toThrow("Offline");
	await expect(
		getTwinKind(
			server({ [ROW]: { rows: "not a list" }, [MINE]: [] }).actions,
			"agent-1",
		),
	).rejects.toThrow(/unexpected shape/);
});
