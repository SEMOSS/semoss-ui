import { beforeEach, describe, expect, it, vi } from "vitest";
import { saveMicrosoftItem } from "@semoss/connectors";
import type { InsightActions } from "@/lib/pixel";
import {
	applyTwinUpdate,
	checkTwinUpdates,
	dismissTwinUpdate,
	listTwinUpdates,
	removeTwinCopy,
	type TwinUpdate,
} from "./twin-updates";

vi.mock("@semoss/connectors", () => ({ saveMicrosoftItem: vi.fn() }));
const save = vi.mocked(saveMicrosoftItem);

const THREAD: TwinUpdate = {
	id: "copy-1",
	twinId: "twin-1",
	kind: "email",
	change: "changed",
	path: "public/emails/Email thread - Budget.md",
	key: "conversation:conv-1",
	count: 3,
	latestFrom: "Dana Lee",
	latestAt: "2026-11-18T15:00:00Z",
	copiedAt: "2026-11-12T17:00:00Z",
};
const FILE: TwinUpdate = {
	id: "copy-2",
	twinId: "twin-1",
	kind: "file",
	change: "gone",
	path: "public/files/Old pricing.xlsx",
	key: "item-1",
	driveId: "b!drive",
	copiedAt: "2026-11-12T17:00:00Z",
};
/** Every file the twin holds, as the listing names them. */
const HELD = [
	{ path: "/public/emails/Email thread - Budget.md" },
	{ path: "/public/files/Old pricing.xlsx" },
];
const COPY_OVER =
	'Copy(sourceType=["INSIGHT"], sourceFilePath=["Email thread - Budget (2).md"], target=["twin-1"], targetType=["PROJECT"], targetFilePath=["public/emails/Email thread - Budget.md"], override=[true]);';
const LISTING =
	'SearchAppAssets(project=["twin-1"], filePath=["/public"], search=["."], options=["regex"]);';

/**
 * A transport that answers each statement, by its whole text or by its
 * reactor, or with what a function makes of it, and remembers what ran. An
 * Error is thrown, as a refused reactor is.
 */
function transport(
	answers: Record<string, unknown> | ((statement: string) => unknown),
) {
	const run = vi.fn(async (statement: string) => {
		const answer =
			typeof answers === "function"
				? answers(statement)
				: statement in answers
					? answers[statement]
					: answers[statement.slice(0, statement.indexOf("("))];
		if (answer instanceof Error) throw answer;
		return {
			pixelReturn: [
				{ output: answer ?? true, operationType: ["OPERATION"] },
			],
		};
	});
	const ran = (): string[] => run.mock.calls.map(([statement]) => statement);
	return { actions: { run } as unknown as InsightActions, ran };
}

beforeEach(() => {
	save.mockReset();
	save.mockResolvedValue({
		path: "Email thread - Budget (2).md",
		name: "Email thread - Budget (2).md",
		service: "outlook-mail",
	});
});

describe("what waits for the owner", () => {
	it("lists the updates and the last check, leaving out a copy that is not one file in a twin's folders", async () => {
		const { actions, ran } = transport({
			WorkListTwinUpdates: {
				updates: [
					THREAD,
					// nothing here may reach the reactor that removes files
					{ ...FILE, id: "bad-1", path: "public/files/" },
					{
						...FILE,
						id: "bad-2",
						path: "public/files/../../secret.txt",
					},
					{ ...FILE, id: "bad-3", path: "/public/files/Plan.docx" },
					{ ...FILE, id: "bad-4", path: "twin-sources.json" },
					{ ...FILE, id: "bad-5", path: "public/meetings/Sync.md" },
					FILE,
				],
				lastCheck: { id: "job-1", status: "done", progress: 100 },
			},
		});

		const found = await listTwinUpdates(actions);
		expect(ran()).toEqual(["WorkListTwinUpdates();"]);
		expect(found.updates.map((update) => update.id)).toEqual([
			"copy-1",
			"copy-2",
		]);
		expect(found.lastCheck).toMatchObject({ id: "job-1", status: "done" });
	});

	it("reads no check as none", async () => {
		const { actions } = transport({ WorkListTwinUpdates: { updates: [] } });
		expect(await listTwinUpdates(actions)).toEqual({
			updates: [],
			lastCheck: null,
		});
	});
});

describe("checking now", () => {
	it("starts the check and reads its job until it is over, saying how far it is", async () => {
		const polls = [
			{ id: "job-1", status: "running", step: "files", progress: 65 },
			{ id: "job-1", status: "done", progress: 100 },
		];
		const { actions, ran } = transport((statement) =>
			statement.startsWith("BrainGetJob")
				? polls.shift()
				: { id: "job-1", status: "running", step: "twins" },
		);
		const steps: (string | null | undefined)[] = [];

		await checkTwinUpdates(
			actions,
			(check) => steps.push(check.step),
			async () => undefined,
		);
		expect(ran()).toEqual([
			"WorkCheckTwinUpdates();",
			'BrainGetJob(jobId=["job-1"]);',
			'BrainGetJob(jobId=["job-1"]);',
		]);
		expect(steps).toEqual(["twins", "files"]);
	});

	it("says why a check failed", async () => {
		const { actions } = transport({
			WorkCheckTwinUpdates: {
				id: "job-1",
				status: "failed",
				error: "Microsoft 365 did not answer",
			},
		});
		await expect(checkTwinUpdates(actions)).rejects.toThrow(
			"Microsoft 365 did not answer",
		);
	});

	it("passes on the server's own error when Microsoft 365 needs a sign in", async () => {
		const { actions } = transport({
			WorkCheckTwinUpdates: new Error('{"type":"microsoft"}'),
		});
		await expect(checkTwinUpdates(actions)).rejects.toThrow(
			'{"type":"microsoft"}',
		);
	});
});

describe("updating a copy", () => {
	it("saves the item again, writes it over the copy under the copy's own name, then settles it", async () => {
		const { actions, ran } = transport({
			SearchAppAssets: HELD,
			Copy: { targetFilePath: "public/emails/Email thread - Budget.md" },
		});

		await applyTwinUpdate(actions, "insight-1", THREAD);
		expect(save).toHaveBeenCalledWith("insight-1", {
			kind: "email",
			conversationId: "conv-1",
		});
		expect(ran()).toEqual([
			LISTING,
			COPY_OVER,
			'WorkSettleTwinUpdate(updateId=["copy-1"], action=["applied"]);',
		]);
	});

	it("reads a file again from the drive its copy recorded, and a chat by its id", async () => {
		// the server answers a copy with the path it wrote
		const { actions } = transport((statement) =>
			statement.startsWith("SearchAppAssets")
				? [...HELD, { path: "/public/teams-chats/Chat - Hiring.md" }]
				: {
						targetFilePath: /targetFilePath=\["([^"]+)"\]/.exec(
							statement,
						)?.[1],
					},
		);

		await applyTwinUpdate(actions, "insight-1", {
			...FILE,
			change: "changed",
		});
		expect(save).toHaveBeenLastCalledWith("insight-1", {
			kind: "file",
			itemId: "item-1",
			driveId: "b!drive",
			name: "Old pricing.xlsx",
		});
		await applyTwinUpdate(actions, "insight-1", {
			...THREAD,
			kind: "chat",
			path: "public/teams-chats/Chat - Hiring.md",
			key: "19:abc@thread.v2",
		});
		expect(save).toHaveBeenLastCalledWith("insight-1", {
			kind: "chat",
			chatId: "19:abc@thread.v2",
		});
	});

	it("does not bring back a copy the owner removed: its suggestion is dropped and nothing is written", async () => {
		const { actions, ran } = transport({ SearchAppAssets: [HELD[1]] });

		await expect(
			applyTwinUpdate(actions, "insight-1", THREAD),
		).rejects.toThrow("no longer in your Digital Twin");
		expect(save).not.toHaveBeenCalled();
		expect(ran()).toEqual([
			LISTING,
			'WorkSettleTwinUpdate(updateId=["copy-1"], action=["dismissed"]);',
		]);
	});

	it("leaves the suggestion waiting when the item cannot be read or the copy is not written", async () => {
		const failing = transport({ SearchAppAssets: HELD });
		save.mockRejectedValueOnce(
			new Error("That email is no longer in the mailbox."),
		);
		await expect(
			applyTwinUpdate(failing.actions, "insight-1", THREAD),
		).rejects.toThrow("no longer in the mailbox");
		expect(failing.ran()).toEqual([LISTING]);

		const refused = transport({
			SearchAppAssets: HELD,
			Copy: new Error("You cannot edit this project"),
		});
		await expect(
			applyTwinUpdate(refused.actions, "insight-1", THREAD),
		).rejects.toThrow("cannot edit");
		expect(refused.ran()).toEqual([LISTING, COPY_OVER]);
	});
});

describe("removing and keeping a copy", () => {
	it("removes the one file and settles its suggestion", async () => {
		const { actions, ran } = transport({ SearchAppAssets: HELD });

		await removeTwinCopy(actions, FILE);
		expect(ran()).toEqual([
			LISTING,
			'DeleteAppAssets(project=["twin-1"], filePath=["/public/files/Old pricing.xlsx"]);',
			'WorkSettleTwinUpdate(updateId=["copy-2"], action=["dismissed"]);',
		]);
	});

	it("only settles the suggestion of a copy that is already gone", async () => {
		const { actions, ran } = transport({ SearchAppAssets: [HELD[0]] });

		await removeTwinCopy(actions, FILE);
		expect(ran()).toEqual([
			LISTING,
			'WorkSettleTwinUpdate(updateId=["copy-2"], action=["dismissed"]);',
		]);
	});

	it.each([
		"",
		"public/files/",
		"public/files",
		"public/files/a/b.docx",
		"public/files/../x",
		// the folder above: removing it would take every copy in the twin
		"public/files/..",
		"public/files/.",
		"/public/files/Plan.docx",
		"public/About me.md",
	])("never asks the server to remove or write over %j", async (path) => {
		const { actions, ran } = transport({ SearchAppAssets: HELD });

		await expect(
			removeTwinCopy(actions, { ...FILE, path }),
		).rejects.toThrow("not a copy");
		await expect(
			applyTwinUpdate(actions, "insight-1", { ...THREAD, path }),
		).rejects.toThrow("not a copy");
		expect(ran()).toEqual([]);
		expect(save).not.toHaveBeenCalled();
	});

	it("keeps a copy as it is by settling its suggestion", async () => {
		const { actions, ran } = transport({});

		await dismissTwinUpdate(actions, THREAD);
		expect(ran()).toEqual([
			'WorkSettleTwinUpdate(updateId=["copy-1"], action=["dismissed"]);',
		]);
	});
});
