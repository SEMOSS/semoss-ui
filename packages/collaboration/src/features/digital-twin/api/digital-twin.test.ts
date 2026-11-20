import { beforeEach, describe, expect, it, vi } from "vitest";
import { getCatalogImageValidationError } from "@semoss/sdk";
import type { InsightActions } from "@/lib/pixel";
import {
	addTwinKnowledge,
	copyToTwin,
	createTwin,
	deleteTwin,
	generateTwinAvatar,
	getMyTwin,
	getMyTwinAgent,
	getTwinChatWelcome,
	hasTwinFolder,
	indexTwinFiles,
	listTwins,
	meetingTranscriptFile,
	readMeetingTranscript,
	readTwinHoldings,
	readTwinNote,
	saveTwin,
	saveTwinChanges,
	saveTwinNote,
	saveTwinProfile,
	type TwinProfile,
	type TwinProfileCheckpoint,
	TwinSetupError,
	type TwinSource,
	twinSetupSteps,
} from "./digital-twin";

const upload = vi.hoisted(() => vi.fn());
vi.mock("@semoss/sdk", async (importOriginal) => ({
	...(await importOriginal<typeof import("@semoss/sdk")>()),
	uploadProjectImage: upload,
}));

const MINE =
	'MyProjects(projectType=["WORKSPACE"], metaFilters=[{"digital_twin":["true"]}], noMeta=[true], effectivePermissions=[1], createdByMe=[true]);';
const ALL =
	'MyProjects(projectType=["WORKSPACE"], metaFilters=[{"digital_twin":["true"]}], noMeta=[true]);';
// one twin's row in that list, the only read that names who a twin is of
const OWNER =
	'MyProjects(projectType=["WORKSPACE"], metaFilters=[{"digital_twin":["true"]}], noMeta=[true], project=["twin-1"], limit=[1]);';

// an agent as GetWorkspace answers, with everything the twin form does not show set
const WORKSPACE = {
	workspace_id: "twin-1",
	name: "Robin Twin",
	description: "Kept description",
	system_prompt: "Old instructions",
	mcp: [
		{ id: "vec-1", name: "policies", type: "VECTOR" },
		{ id: "db-1", name: "sales", type: "DATABASE" },
	],
	skills: [{ id: "skill-1", name: "Old skill" }],
	prompts: [{ id: "prompt-1", name: "Kept prompt", type: "PROMPT" }],
	config_json: {
		model_id: "model-1",
		use_default_agent_tools: false,
		greeting: "Old greeting",
		greeting_enabled: true,
		tool_policy: { default_tools: { disabled: ["WebSearch"] } },
		budgets: { max_turns: 12, max_reflections: 2, max_seconds: 600 },
		spawn_policy: {
			max_subagent_depth: 1,
			max_subagents_per_run: 3,
			max_spawns_per_turn: 2,
		},
		subagents: [{ workspaceId: "agent-2" }],
		hooks: [{ kind: "log_tools" }],
	},
};

// an email a viewer saved into the page's files, and a file uploaded there
const EMAIL: TwinSource = {
	path: "Budget review.md",
	name: "Budget review.md",
	service: "outlook-mail",
};
const UPLOAD: TwinSource = { path: "/Plan.docx", name: "Plan.docx" };

const PROFILE: TwinProfile = {
	name: "Robin R Twin",
	instructions: 'Answer as "Robin".',
	greeting: "Hello there",
	about: "",
	skills: ["skill-2"],
	toolboxes: [{ id: "db-2", name: "Pipeline", type: "DATABASE" }],
	image: null,
	usePersona: true,
};

/**
 * A transport that answers each statement, by its whole text or by its
 * reactor, and remembers what ran. An Error is thrown, as a refused reactor is.
 */
function transport(answers: Record<string, unknown>) {
	const run = vi.fn(async (statement: string) => {
		const answer =
			statement in answers
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
	upload.mockReset();
	upload.mockResolvedValue({});
});

describe("finding twins", () => {
	it("finds the signed-in person's own twin by the server's mark, ownership and who made it", async () => {
		const { actions, ran } = transport({
			[MINE]: [
				{
					project_id: "twin-1",
					project_name: "robin_twin",
					project_display_name: " Robin Twin ",
				},
			],
		});
		expect(await getMyTwin(actions)).toEqual({
			id: "twin-1",
			name: "Robin Twin",
		});
		expect(ran()).toEqual([MINE]);
	});

	it("answers null for someone with no twin, and names a twin without a display name by its project", async () => {
		expect(await getMyTwin(transport({ [MINE]: [] }).actions)).toBeNull();
		const { actions } = transport({
			[MINE]: [{ project_id: "twin-1", project_name: "Robin Twin" }],
		});
		expect(await getMyTwin(actions)).toEqual({
			id: "twin-1",
			name: "Robin Twin",
		});
	});

	it("lists all my twins separately from the twins shared with me", async () => {
		const mine = { project_id: "twin-1", project_name: "Robin Twin" };
		const other = { project_id: "twin-3", project_name: "Research Twin" };
		const { actions, ran } = transport({
			[MINE]: [mine, other],
			[ALL]: [
				mine,
				other,
				{
					project_id: "twin-2",
					project_name: "dana",
					project_display_name: "Dana Ortiz Twin",
					digital_twin_owner_name: " Dana Ortiz ",
				},
			],
		});
		expect(await listTwins(actions)).toEqual({
			mine: [
				{ id: "twin-1", name: "Robin Twin" },
				{ id: "twin-3", name: "Research Twin" },
			],
			shared: [
				{
					id: "twin-2",
					name: "Dana Ortiz Twin",
					ownerName: "Dana Ortiz",
				},
			],
		});
		expect([...ran()].sort()).toEqual([ALL, MINE].sort());
	});

	it("reads the selected twin instead of whichever twin is first", async () => {
		const { actions, ran } = transport({
			[MINE]: [
				{ project_id: "first", project_name: "First Twin" },
				{ project_id: "twin-1", project_name: "Robin Twin" },
			],
			GetWorkspace: WORKSPACE,
		});
		expect(await getMyTwinAgent(actions, "twin-1")).toMatchObject({
			workspace_id: "twin-1",
		});
		expect(ran()).toEqual([MINE, 'GetWorkspace(workspaceId=["twin-1"]);']);
		await expect(getMyTwin(actions)).rejects.toThrow("choose one");
	});

	it.each(["shared-twin", "deleted-twin", ""])(
		"does not fall back to an owned twin when %s is requested",
		async (id) => {
			const { actions, ran } = transport({
				[MINE]: [{ project_id: "twin-1", project_name: "Robin Twin" }],
			});
			await expect(getMyTwinAgent(actions, id)).rejects.toThrow(
				"not yours to manage",
			);
			expect(ran()).toEqual([MINE]);
		},
	);

	it("rejects a list of the wrong shape", async () => {
		await expect(
			getMyTwin(transport({ [MINE]: { rows: [] } }).actions),
		).rejects.toThrow(/unexpected shape/);
	});

	it.each(["manage", "add", "read"] as const)(
		"loads the twin with its %s chat capability, and whose twin it is beside it",
		async (access) => {
			const { actions, ran } = transport({
				GetWorkspace: {
					...WORKSPACE,
					digital_twin_file_access: access,
				},
				[OWNER]: [
					{
						project_id: "twin-1",
						project_name: "robin",
						digital_twin_owner_name: " Robin Hale ",
					},
				],
			});
			await expect(
				getTwinChatWelcome(actions, "twin-1"),
			).resolves.toEqual({
				agent: expect.objectContaining({
					workspace_id: "twin-1",
					name: "Robin Twin",
				}),
				fileAccess: access,
				ownerName: "Robin Hale",
			});
			expect(ran()).toEqual([
				'GetWorkspace(workspaceId=["twin-1"], includeDigitalTwinFileAccess=[true]);',
				OWNER,
			]);
		},
	);

	it.each([
		{ why: "the list is refused", rows: new Error("List unavailable") },
		{ why: "the list has another shape", rows: { rows: [] } },
		{
			why: "the list answers with another twin",
			rows: [
				{
					project_id: "another",
					project_name: "dana",
					digital_twin_owner_name: "Dana Ortiz",
				},
			],
		},
		{
			why: "the server cannot tell who made the twin",
			rows: [
				{
					project_id: "twin-1",
					project_name: "robin",
					digital_twin_owner_name: null,
				},
			],
		},
	])("opens the chat with no owner's name when $why", async ({ rows }) => {
		const { actions } = transport({
			GetWorkspace: { ...WORKSPACE, digital_twin_file_access: "read" },
			[OWNER]: rows,
		});
		const welcome = await getTwinChatWelcome(actions, "twin-1");
		expect(welcome.fileAccess).toBe("read");
		expect(welcome.ownerName).toBeUndefined();
	});

	it.each([
		{
			rows: [{ project_id: "twin-1", project_name: "Robin Twin" }],
			access: "add",
		},
		{
			rows: [{ project_id: "another", project_name: "Different Twin" }],
			access: "read",
		},
		{ rows: [], access: "read" },
		{ rows: new Error("Ownership unavailable"), access: "read" },
	])(
		"uses the verified capability for this twin on older servers: $access",
		async ({ rows, access }) => {
			const { actions, ran } = transport({
				GetWorkspace: { ...WORKSPACE, permission: "OWNER" },
				MyProjects: rows,
			});
			await expect(
				getTwinChatWelcome(actions, "twin-1"),
			).resolves.toMatchObject({ fileAccess: access });
			// after the twin and its owner's name, which are read together
			expect(ran()).toHaveLength(3);
			expect(ran()[2]).toBe(
				'MyProjects(projectType=["WORKSPACE"], metaFilters=[{"digital_twin":["true"]}], noMeta=[true], project=["twin-1"], createdByMe=[true], effectivePermissions=[1,2], limit=[1]);',
			);
		},
	);

	it("keeps chat available when the server returns an unknown capability", async () => {
		const { actions, ran } = transport({
			GetWorkspace: { ...WORKSPACE, digital_twin_file_access: "unknown" },
		});
		await expect(
			getTwinChatWelcome(actions, "twin-1"),
		).resolves.toMatchObject({ fileAccess: "read" });
		// the twin and its owner's name; no ownership read
		expect(ran()).toEqual([
			expect.stringMatching(/^GetWorkspace\(/),
			OWNER,
		]);
	});

	it("skips ownership reads for missing and inaccessible twins", async () => {
		const { actions, ran } = transport({
			GetWorkspace: new Error("Access denied"),
		});
		await expect(getTwinChatWelcome(actions, " ")).rejects.toThrow(
			"no Digital Twin",
		);
		expect(ran()).toHaveLength(0);
		await expect(getTwinChatWelcome(actions, "twin-1")).rejects.toThrow(
			"Access denied",
		);
		// the owner's name is asked for beside the twin, not after it
		expect(ran()).toEqual([
			expect.stringMatching(/^GetWorkspace\(/),
			OWNER,
		]);
	});
});

describe("creating a twin", () => {
	it("makes the agent, its files folder once, then its greeting and its image, in that order", async () => {
		const image = new File(["x"], "robin.png", { type: "image/png" });
		const { actions, ran } = transport({
			AddDigitalTwin: "twin-1",
			GetWorkspace: { ...WORKSPACE, name: PROFILE.name },
		});
		expect(await createTwin(actions, { ...PROFILE, image })).toBe("twin-1");
		expect(ran()).toEqual([
			'AddDigitalTwin(name=["Robin R Twin"], systemPrompt=["Answer as \\"Robin\\"."], mcp=[{"id":"db-2","name":"Pipeline","type":"DATABASE"}], skills=["skill-2"]);',
			'NewAppAssetsDirectory(project=["twin-1"], filePath=["/public"]);',
			'GetWorkspace(workspaceId=["twin-1"]);',
			expect.stringMatching(
				/^EditWorkspace\(workspaceId=\["twin-1"\], .*greeting="Hello there", greetingEnabled=true\);$/,
			),
		]);
		expect(upload).toHaveBeenCalledExactlyOnceWith("twin-1", image);
	});

	it("saves no profile without a greeting and uploads nothing without an image", async () => {
		const { actions, ran } = transport({ AddDigitalTwin: "twin-1" });
		await createTwin(actions, {
			...PROFILE,
			greeting: "",
			skills: [],
			toolboxes: [],
		});
		expect(ran()).toEqual([
			'AddDigitalTwin(name=["Robin R Twin"], systemPrompt=["Answer as \\"Robin\\"."], mcp=[], skills=[]);',
			'NewAppAssetsDirectory(project=["twin-1"], filePath=["/public"]);',
		]);
		expect(upload).not.toHaveBeenCalled();
	});

	it("tells its caller each step as it starts, and holds the step until the caller is done with it", async () => {
		const image = new File(["x"], "robin.png", { type: "image/png" });
		const { actions, ran } = transport({
			AddDigitalTwin: "twin-1",
			GetWorkspace: { ...WORKSPACE, name: PROFILE.name },
		});
		// how many server calls had gone out when each step was announced
		const seen: [string, number][] = [];
		let release = (): void => undefined;
		const created = createTwin(
			actions,
			{ ...PROFILE, image },
			{
				onStep: (step) => {
					seen.push([step, ran().length]);
					// the folder step is held, as a screen showing it would hold it
					if (step === "folder")
						return new Promise<void>((resolve) => {
							release = resolve;
						});
				},
			},
		);
		await vi.waitFor(() => expect(seen).toHaveLength(2));
		// the folder is asked for, but nothing after it starts while the caller holds the step
		await new Promise((resolve) => setTimeout(resolve, 20));
		expect(ran()).toHaveLength(2);
		release();
		expect(await created).toBe("twin-1");
		expect(seen).toEqual([
			["twin", 1],
			["folder", 2],
			["greeting", 3],
			["image", 4],
		]);
		expect(seen.map(([step]) => step)).toEqual(
			twinSetupSteps({ ...PROFILE, image }),
		);
	});

	it("lists only the steps a profile needs: no greeting, image or knowledge step without one", () => {
		expect(twinSetupSteps({ ...PROFILE, greeting: "" })).toEqual([
			"twin",
			"folder",
		]);
		// a note of nothing but space is no note
		expect(twinSetupSteps({ ...PROFILE, about: " \n" })).toEqual([
			"twin",
			"folder",
			"greeting",
		]);
		expect(
			twinSetupSteps({ ...PROFILE, about: "I run renewals." }, [EMAIL]),
		).toEqual(["twin", "folder", "greeting", "note", "knowledge"]);
		expect(twinSetupSteps(PROFILE)).toEqual(["twin", "folder", "greeting"]);
		expect(twinSetupSteps(PROFILE, [EMAIL])).toEqual([
			"twin",
			"folder",
			"greeting",
			"knowledge",
		]);
		// a new twin uses its owner's persona, so only switching it off is a step, before what it knows
		expect(
			twinSetupSteps({ ...PROFILE, usePersona: false }, [EMAIL]),
		).toEqual(["twin", "folder", "greeting", "persona", "knowledge"]);
	});

	it("switches the owner's persona off for a new twin they made without it, and names it when that fails", async () => {
		const OFF = 'WorkSetTwinPersona(project=["twin-9"], enabled=[false]);';
		const made = transport({
			AddDigitalTwin: "twin-9",
			GetWorkspace: { ...WORKSPACE, workspace_id: "twin-9" },
		});
		await createTwin(made.actions, { ...PROFILE, usePersona: false });
		expect(made.ran().at(-1)).toBe(OFF);
		// with it left on nothing is sent: a twin uses its owner's persona until it is switched off
		const kept = transport({
			AddDigitalTwin: "twin-9",
			GetWorkspace: { ...WORKSPACE, workspace_id: "twin-9" },
		});
		await createTwin(kept.actions, PROFILE);
		expect(kept.ran().join("\n")).not.toContain("WorkSetTwinPersona");

		const refused = transport({
			AddDigitalTwin: "twin-9",
			GetWorkspace: { ...WORKSPACE, workspace_id: "twin-9" },
			WorkSetTwinPersona: new Error("It is not yours."),
		});
		const failure = await createTwin(refused.actions, {
			...PROFILE,
			usePersona: false,
		}).catch((cause: unknown) => cause);
		expect(failure).toBeInstanceOf(TwinSetupError);
		expect((failure as TwinSetupError).twinId).toBe("twin-9");
		expect((failure as TwinSetupError).message).toBe(
			"Your Digital Twin was created, but your persona could not be switched off for it: It is not yours.",
		);
	});

	it("copies what the owner chose last, once the twin is whole, and says each one as it lands", async () => {
		const { actions, ran } = transport({
			AddDigitalTwin: "twin-1",
			Copy: { targetFilePath: "public/x" },
		});
		const steps: string[] = [];
		const landed: TwinSource[] = [];
		await createTwin(
			actions,
			{ ...PROFILE, greeting: "" },
			{
				knowledge: [EMAIL, UPLOAD],
				onStep: (step) => {
					steps.push(step);
				},
				onCopied: (source) => {
					landed.push(source);
				},
			},
		);
		expect(steps).toEqual(["twin", "folder", "knowledge"]);
		expect(landed).toEqual([EMAIL, UPLOAD]);
		expect(ran().slice(2)).toEqual([
			'Copy(sourceType=["INSIGHT"], sourceFilePath=["Budget review.md"], target=["twin-1"], targetType=["PROJECT"], targetFilePath=["public/emails/Budget review.md"]);',
			// a file from the owner's computer came from no viewer: it goes with the files
			'Copy(sourceType=["INSIGHT"], sourceFilePath=["/Plan.docx"], target=["twin-1"], targetType=["PROJECT"], targetFilePath=["public/files/Plan.docx"]);',
		]);
	});

	it("says which of what the owner chose could not be added, with the twin's id, after trying every one", async () => {
		const { actions, ran } = transport({
			AddDigitalTwin: "twin-1",
			Copy: { targetFilePath: "public/x" },
		});
		const copy = vi.mocked(actions.run);
		const run = copy.getMockImplementation();
		copy.mockImplementation(async (statement: string) => {
			if (statement.includes("Budget review.md"))
				throw new Error("The file is gone");
			return run?.(statement) as never;
		});
		const landed: TwinSource[] = [];
		const failure = await createTwin(
			actions,
			{ ...PROFILE, greeting: "" },
			{
				knowledge: [EMAIL, UPLOAD],
				onCopied: (source) => {
					landed.push(source);
				},
			},
		).catch((cause: unknown) => cause);
		expect(failure).toBeInstanceOf(TwinSetupError);
		expect((failure as TwinSetupError).message).toBe(
			'Your Digital Twin was created, but not everything you chose could be added: "Budget review.md": The file is gone.',
		);
		expect((failure as TwinSetupError).twinId).toBe("twin-1");
		// the one after the failure was still copied, and only it is reported as in
		expect(landed).toEqual([UPLOAD]);
		expect(ran()).toHaveLength(4);
	});

	it("saves the owner's note into the new twin's files folder, and names it when that fails", async () => {
		const { actions, ran } = transport({ AddDigitalTwin: "twin-1" });
		await createTwin(actions, {
			...PROFILE,
			greeting: "",
			about: "I run renewals.",
		});
		expect(ran().slice(1)).toEqual([
			'NewAppAssetsDirectory(project=["twin-1"], filePath=["/public"]);',
			'SaveAppAssets(project=["twin-1"], filePath=["/public/About me.md"], content=["I run renewals."]);',
		]);

		const refused = transport({
			AddDigitalTwin: "twin-1",
			SaveAppAssets: new Error("The disk is full."),
		});
		await expect(
			createTwin(refused.actions, {
				...PROFILE,
				greeting: "",
				about: "I run renewals.",
			}),
		).rejects.toMatchObject({
			twinId: "twin-1",
			message:
				"Your Digital Twin was created, but your note could not be saved: The disk is full.",
		});
	});

	it("says which step failed once the twin exists, with its id, and stops there", async () => {
		const { actions, ran } = transport({
			AddDigitalTwin: "twin-1",
			NewAppAssetsDirectory: new Error("The disk is full."),
		});
		const failure = await createTwin(actions, PROFILE).catch(
			(cause: unknown) => cause,
		);
		expect(failure).toBeInstanceOf(TwinSetupError);
		expect(failure).toMatchObject({
			twinId: "twin-1",
			message:
				"Your Digital Twin was created, but its files folder could not be made: The disk is full.",
		});
		expect(ran()).toHaveLength(2);
	});

	it("names a failed image upload, after the greeting was saved", async () => {
		upload.mockRejectedValue(new Error("Choose a PNG, JPEG, or GIF image"));
		const { actions } = transport({
			AddDigitalTwin: "twin-1",
			GetWorkspace: { ...WORKSPACE, name: PROFILE.name },
		});
		await expect(
			createTwin(actions, {
				...PROFILE,
				image: new File(["x"], "robin.bmp"),
			}),
		).rejects.toMatchObject({
			twinId: "twin-1",
			message:
				"Your Digital Twin was created, but its image could not be uploaded: Choose a PNG, JPEG, or GIF image.",
		});
	});

	it("fails as an ordinary error when the twin was not made, so it can be created again", async () => {
		const { actions, ran } = transport({
			AddDigitalTwin: new Error("You are not allowed to create an agent"),
		});
		const failure = await createTwin(actions, PROFILE).catch(
			(cause: unknown) => cause,
		);
		expect(failure).not.toBeInstanceOf(TwinSetupError);
		expect(failure).toMatchObject({
			message: "You are not allowed to create an agent",
		});
		expect(ran()).toHaveLength(1);
	});
});

describe("saving a twin", () => {
	it("touches only edited resources and distinguishes portraits with identical file metadata", async () => {
		const { actions, ran } = transport({});
		const saved: TwinProfileCheckpoint = {
			profile: PROFILE,
			about: "",
			usePersona: true,
		};
		const draft = {
			...PROFILE,
			skills: [...PROFILE.skills],
			toolboxes: PROFILE.toolboxes.map((entry) => ({ ...entry })),
		};
		await saveTwinChanges(actions, "twin-1", draft, saved);
		expect(ran()).toEqual([]);
		const options = { type: "image/png", lastModified: 1 };
		const first = new File(["x"], "portrait.png", options);
		const second = new File(["y"], "portrait.png", options);
		await saveTwinChanges(
			actions,
			"twin-1",
			{ ...draft, image: first },
			saved,
		);
		await saveTwinChanges(
			actions,
			"twin-1",
			{ ...draft, image: first, usePersona: false },
			saved,
		);
		await saveTwinChanges(
			actions,
			"twin-1",
			{ ...draft, image: second, usePersona: false },
			saved,
		);
		expect(upload.mock.calls).toEqual([
			["twin-1", first],
			["twin-1", second],
		]);
		expect(ran()).toEqual([
			'WorkSetTwinPersona(project=["twin-1"], enabled=[false]);',
		]);
	});

	it("overlays edits on the latest workspace settings if another window changed them", async () => {
		const { actions, ran } = transport({ GetWorkspace: WORKSPACE });
		const saved = { profile: PROFILE };
		await saveTwinChanges(
			actions,
			"twin-1",
			{ ...PROFILE, greeting: "Welcome back" },
			saved,
		);
		expect(ran()).toHaveLength(2);
		expect(ran()[1]).toContain(
			'greeting="Welcome back", greetingEnabled=true',
		);
		expect(ran()[1]).toContain('name="Robin Twin"');
		expect(ran()[1]).toContain('systemPrompt="Old instructions"');
		expect(ran()[1]).toContain('skills=["skill-1"]');
		expect(ran()[1]).toContain('"id":"db-1"');
	});

	it("finishes a partially saved rename without repeating the workspace edit", async () => {
		const answers: Record<string, unknown> = {
			GetWorkspace: WORKSPACE,
			SetProjectDisplayName: new Error("catalog unavailable"),
		};
		const { actions, ran } = transport(answers);
		const saved = { profile: PROFILE };
		const draft = { ...PROFILE, name: "New name" };
		await expect(
			saveTwinChanges(actions, "twin-1", draft, saved),
		).rejects.toThrow("catalog unavailable");
		delete answers.SetProjectDisplayName;
		await saveTwinChanges(actions, "twin-1", draft, saved);
		expect(ran().map((call) => call.split("(")[0])).toEqual([
			"GetWorkspace",
			"EditWorkspace",
			"SetProjectDisplayName",
			"SetProjectDisplayName",
		]);
	});

	it("restores the original values even after a partially applied edit or a lost reply", async () => {
		const answers: Record<string, unknown> = {
			GetWorkspace: WORKSPACE,
			EditWorkspace: { warning: "CONFIG_JSON locked" },
		};
		const { actions, ran } = transport(answers);
		const saved: TwinProfileCheckpoint = {
			profile: PROFILE,
			about: "",
			usePersona: true,
		};
		const changed = {
			...PROFILE,
			instructions: "New instructions",
			about: "New note",
			usePersona: false,
		};
		await expect(
			saveTwinChanges(actions, "twin-1", changed, saved),
		).rejects.toThrow("CONFIG_JSON locked");
		delete answers.EditWorkspace;
		answers.WorkSetTwinPersona = new Error("lost reply");
		await expect(
			saveTwinChanges(
				actions,
				"twin-1",
				{ ...changed, instructions: PROFILE.instructions },
				saved,
			),
		).rejects.toThrow("lost reply");
		expect(ran()[3]).toContain(
			`systemPrompt=${JSON.stringify(PROFILE.instructions)}`,
		);
		delete answers.WorkSetTwinPersona;
		const before = ran().length;
		await saveTwinChanges(actions, "twin-1", PROFILE, saved);
		expect(ran().slice(before)).toEqual([
			'DeleteAppAssets(project=["twin-1"], filePath=["/public/About me.md"]);',
			'WorkSetTwinPersona(project=["twin-1"], enabled=[true]);',
		]);
	});

	it("reconciles a note deletion that succeeded before its reply was lost", async () => {
		const { actions, ran } = transport({
			DeleteAppAssets: new Error("lost reply"),
			BrowseAppAssets: [],
		});
		const saved: TwinProfileCheckpoint = {
			profile: PROFILE,
			about: "Previous note",
		};
		await expect(
			saveTwinChanges(actions, "twin-1", PROFILE, saved),
		).rejects.toThrow("lost reply");
		await saveTwinChanges(actions, "twin-1", PROFILE, saved);
		expect(ran()).toEqual([
			'DeleteAppAssets(project=["twin-1"], filePath=["/public/About me.md"]);',
			'BrowseAppAssets(filePath=["/"], project=["twin-1"]);',
		]);
		expect(saved.about).toBe("");
	});

	it("saves the form's fields over the rest of the agent's configuration, and renames it", async () => {
		const { actions, ran } = transport({ GetWorkspace: WORKSPACE });
		await saveTwinProfile(actions, "twin-1", PROFILE);
		expect(ran()).toEqual([
			'GetWorkspace(workspaceId=["twin-1"]);',
			// the description, knowledge, prompts, model, tools, limits, subagents and hooks are the agent's own
			'EditWorkspace(workspaceId=["twin-1"], name="Robin R Twin", description="Kept description", systemPrompt="Answer as \\"Robin\\".", mcp=[{"id":"vec-1","name":"policies","type":"VECTOR"},{"id":"db-2","name":"Pipeline","type":"DATABASE"}], skills=["skill-2"], prompts=["prompt-1"], modelId="model-1", useDefaultAgentTools=false, disabledDefaultTools=["WebSearch"], maxTurns="12", maxReflections="2", maxSeconds="600", maxSubagentDepth="1", maxSubagentsPerRun="3", maxSpawnsPerTurn="2", subagents=[{"workspaceId":"agent-2"}], hooks=[{"kind":"log_tools"}], greeting="Hello there", greetingEnabled=true);',
			'SetProjectDisplayName(project=["twin-1"], name=["<encode>Robin R Twin</encode>"]);',
		]);
	});

	it("turns the greeting off when it is emptied, and leaves the display name alone when the name is the same", async () => {
		const { actions, ran } = transport({ GetWorkspace: WORKSPACE });
		await saveTwinProfile(actions, "twin-1", {
			...PROFILE,
			name: WORKSPACE.name,
			greeting: "",
		});
		const [, edit, ...rest] = ran();
		expect(edit).toContain('greeting="", greetingEnabled=false);');
		expect(rest).toEqual([]);
	});

	it("treats a save the server only half made as a failure", async () => {
		const { actions } = transport({
			GetWorkspace: WORKSPACE,
			EditWorkspace: {
				success: true,
				warning: "Workspace saved but CONFIG_JSON sync failed: locked",
			},
		});
		await expect(
			saveTwinProfile(actions, "twin-1", PROFILE),
		).rejects.toThrow("CONFIG_JSON sync failed");
	});

	it("uploads a newly chosen image after the profile, and says when only the upload failed", async () => {
		const image = new File(["x"], "robin.png", { type: "image/png" });
		const { actions, ran } = transport({ GetWorkspace: WORKSPACE });
		await saveTwin(actions, "twin-1", { ...PROFILE, image });
		expect(upload).toHaveBeenCalledExactlyOnceWith("twin-1", image);
		expect(ran()).toHaveLength(3);

		upload.mockRejectedValue(new Error("Too large"));
		await expect(
			saveTwin(actions, "twin-1", { ...PROFILE, image }),
		).rejects.toThrow(
			"Your changes were saved, but the image could not be uploaded: Too large.",
		);
	});
});

describe("the owner's note about themself", () => {
	const ROOT = 'BrowseAppAssets(filePath=["/"], project=["twin-1"]);';
	const HELD = 'BrowseAppAssets(filePath=["/public"], project=["twin-1"]);';
	const READ =
		'GetAppAssets(filePath=["/public/About me.md"], project=["twin-1"]);';
	const FOLDER = [{ name: "public", path: "/public", type: "directory" }];
	const NOTE = { name: "About me.md", path: "/public/About me.md" };

	it("reads the note the twin holds, looking for it first", async () => {
		const { actions, ran } = transport({
			[ROOT]: FOLDER,
			[HELD]: [{ name: "emails", type: "directory" }, NOTE],
			[READ]: "I run renewals.\n",
		});
		expect(await readTwinNote(actions, "twin-1")).toBe("I run renewals.\n");
		expect(ran()).toEqual([ROOT, HELD, READ]);
	});

	it("answers none without reading for a twin with no note or no files folder", async () => {
		const empty = transport({
			[ROOT]: FOLDER,
			// a folder of that name is not the note
			[HELD]: [{ ...NOTE, type: "directory" }],
		});
		expect(await readTwinNote(empty.actions, "twin-1")).toBe("");
		expect(empty.ran()).toEqual([ROOT, HELD]);

		const bare = transport({ [ROOT]: [] });
		expect(await readTwinNote(bare.actions, "twin-1")).toBe("");
		expect(bare.ran()).toEqual([ROOT]);
	});

	it("fails instead of answering none when the twin's files cannot be read", async () => {
		await expect(
			readTwinNote(
				transport({ [ROOT]: new Error("The server is restarting") })
					.actions,
				"twin-1",
			),
		).rejects.toThrow("The server is restarting");
		await expect(
			readTwinNote(
				transport({
					[ROOT]: FOLDER,
					[HELD]: [NOTE],
					[READ]: new Error("Could not read the file"),
				}).actions,
				"twin-1",
			),
		).rejects.toThrow("Could not read the file");
	});

	it("saves the note as written, whatever it says, and takes the file away for an empty one", async () => {
		const { actions, ran } = transport({});
		const note = 'Ask "Dana" instead.\n</encode>); DeleteWorkspace(';
		await saveTwinNote(actions, "twin-1", note);
		await saveTwinNote(actions, "twin-1", "  \n");
		expect(ran()).toEqual([
			// one quoted value: nothing in a note ends it early
			`SaveAppAssets(project=["twin-1"], filePath=["/public/About me.md"], content=[${JSON.stringify(note)}]);`,
			'DeleteAppAssets(project=["twin-1"], filePath=["/public/About me.md"]);',
		]);
	});

	it("writes the note with the profile only when it changed, and never when what the twin holds is not known", async () => {
		const noteCalls = (ran: () => string[]): string[] =>
			ran().filter((statement) => statement.includes("About me.md"));
		const { actions, ran } = transport({ GetWorkspace: WORKSPACE });
		const profile = { ...PROFILE, about: "I run renewals." };
		// the same note, and a note that could not be read
		await saveTwin(actions, "twin-1", profile, "I run renewals.");
		await saveTwin(actions, "twin-1", profile);
		// blank before and after is no change either
		await saveTwin(actions, "twin-1", { ...PROFILE, about: " " }, "");
		expect(noteCalls(ran)).toEqual([]);

		await saveTwin(actions, "twin-1", profile, "");
		await saveTwin(actions, "twin-1", PROFILE, "I run renewals.");
		expect(noteCalls(ran)).toEqual([
			'SaveAppAssets(project=["twin-1"], filePath=["/public/About me.md"], content=["I run renewals."]);',
			'DeleteAppAssets(project=["twin-1"], filePath=["/public/About me.md"]);',
		]);
	});

	it("switches the owner's persona for the twin only when that changed, and never when it is not known", async () => {
		const switches = (ran: () => string[]): string[] =>
			ran().filter((statement) =>
				statement.startsWith("WorkSetTwinPersona"),
			);
		const { actions, ran } = transport({ GetWorkspace: WORKSPACE });
		// unchanged, and for someone with no persona or whose persona could not be read
		await saveTwin(actions, "twin-1", PROFILE, undefined, true);
		await saveTwin(actions, "twin-1", { ...PROFILE, usePersona: false });
		expect(switches(ran)).toEqual([]);

		await saveTwin(
			actions,
			"twin-1",
			{ ...PROFILE, usePersona: false },
			undefined,
			true,
		);
		await saveTwin(actions, "twin-1", PROFILE, undefined, false);
		expect(switches(ran)).toEqual([
			'WorkSetTwinPersona(project=["twin-1"], enabled=[false]);',
			'WorkSetTwinPersona(project=["twin-1"], enabled=[true]);',
		]);
	});

	it("says the rest was saved when only the persona could not be switched", async () => {
		const { actions } = transport({
			GetWorkspace: WORKSPACE,
			WorkSetTwinPersona: new Error("It is not yours."),
		});
		await expect(
			saveTwin(
				actions,
				"twin-1",
				{ ...PROFILE, usePersona: false },
				undefined,
				true,
			),
		).rejects.toThrow(
			"Your changes were saved, but your persona could not be switched off for it: It is not yours.",
		);
		expect(upload).not.toHaveBeenCalled();
	});

	it("says the rest was saved when only the note could not be", async () => {
		const { actions } = transport({
			GetWorkspace: WORKSPACE,
			SaveAppAssets: new Error("The disk is full."),
		});
		await expect(
			saveTwin(actions, "twin-1", { ...PROFILE, about: "New" }, ""),
		).rejects.toThrow(
			"Your changes were saved, but your note could not be: The disk is full.",
		);
		expect(upload).not.toHaveBeenCalled();
	});
});

describe("a twin's files", () => {
	it.each([
		["outlook-mail", "public/emails/Budget review.md"],
		["teams-chats", "public/teams-chats/Budget review.md"],
		["onedrive", "public/files/Budget review.md"],
		["teams-files", "public/files/Budget review.md"],
	] as const)(
		"copies an item saved from %s to %s, without overwriting",
		async (service, target) => {
			const { actions, ran } = transport({
				Copy: { targetFilePath: "public/emails/Budget review (1).md" },
			});
			expect(
				await copyToTwin(actions, "twin-1", {
					path: "Budget review.md",
					name: "Budget review.md",
					service,
				}),
			).toEqual({ path: "public/emails/Budget review (1).md" });
			expect(ran()).toEqual([
				`Copy(sourceType=["INSIGHT"], sourceFilePath=["Budget review.md"], target=["twin-1"], targetType=["PROJECT"], targetFilePath=["${target}"]);`,
			]);
		},
	);

	it("adds a second batch to a twin that exists, holding each copy until its caller is done with the last", async () => {
		const { actions, ran } = transport({
			Copy: { targetFilePath: "public/x" },
		});
		let release = (): void => undefined;
		const added = addTwinKnowledge(
			actions,
			"twin-1",
			[EMAIL, UPLOAD],
			(source) =>
				source === EMAIL
					? new Promise<void>((resolve) => {
							release = resolve;
						})
					: undefined,
		);
		await vi.waitFor(() => expect(ran()).toHaveLength(1));
		await new Promise((resolve) => setTimeout(resolve, 20));
		expect(ran()).toHaveLength(1);
		release();
		await added;
		expect(ran()).toHaveLength(2);
	});

	it("knows the files folder is there from the project's top folder", async () => {
		const browse = 'BrowseAppAssets(filePath=["/"], project=["twin-1"]);';
		const withFolder = transport({
			[browse]: [
				{ name: "public", path: "/public", type: "directory" },
				{ name: "notes.md", path: "/notes.md" },
			],
		});
		expect(await hasTwinFolder(withFolder.actions, "twin-1")).toBe(true);
		expect(withFolder.ran()).toEqual([browse]);
		// a file of that name is not the folder
		const without = transport({
			[browse]: [{ name: "public", path: "/public" }],
		});
		expect(await hasTwinFolder(without.actions, "twin-1")).toBe(false);
	});

	it("deletes the twin as the agent it is", async () => {
		const { actions, ran } = transport({});
		await deleteTwin(actions, "twin-1");
		expect(ran()).toEqual(['DeleteWorkspace(workspaceId=["twin-1"]);']);
	});
});

describe("what a twin holds", () => {
	const ROOT = 'BrowseAppAssets(filePath=["/"], project=["twin-1"]);';
	const READ =
		'GetAppAssets(filePath=["/twin-sources.json"], project=["twin-1"]);';
	const LIST =
		'SearchAppAssets(project=["twin-1"], filePath=["/public"], search=["."], options=["regex"]);';
	const record = (sources: Record<string, string>): string =>
		`SaveAppAssets(project=["twin-1"], filePath=["/twin-sources.json"], content=["<encode>${JSON.stringify(sources)}</encode>"]);`;
	const copyOf = (name: string): string =>
		`Copy(sourceType=["INSIGHT"], sourceFilePath=["${name}"], target=["twin-1"], targetType=["PROJECT"], targetFilePath=["public/emails/${name}"]);`;
	// what tells the server a copy was just made, so a check compares it with now
	const noted = (name: string): string =>
		`WorkNoteTwinCopy(project=["twin-1"], filePath=["public/emails/${name}"]);`;
	const email = (name: string, itemKey: string): TwinSource => ({
		path: name,
		name,
		service: "outlook-mail",
		itemKey,
	});

	/**
	 * The four reactors a twin's copies go through, answering as the server
	 * does: a copy lands where it was asked to and is listed with a leading
	 * slash, and the record is a file at the top of the project.
	 */
	function twinServer(recorded?: string) {
		const state = { record: recorded, copies: [] as string[] };
		const run = vi.fn(async (statement: string) => {
			const copied = /targetFilePath=\["([^"]+)"\]/.exec(statement);
			const saved = /<encode>(.*)<\/encode>/.exec(statement);
			let output: unknown = true;
			if (statement.startsWith("Copy(") && copied?.[1]) {
				state.copies.push(copied[1]);
				output = { targetFilePath: copied[1] };
			} else if (statement === ROOT) {
				output = [
					{ name: "public", path: "/public/", type: "directory" },
					...(state.record === undefined
						? []
						: [
								{
									name: "twin-sources.json",
									path: "/twin-sources.json",
									type: "json",
								},
							]),
				];
			} else if (statement === READ) {
				output = state.record;
			} else if (statement.startsWith("SaveAppAssets(") && saved) {
				state.record = saved[1];
			} else if (statement === LIST) {
				output = state.copies.map((path) => ({
					name: path.split("/").pop(),
					path: `/${path}`,
				}));
			}
			return { pixelReturn: [{ output, operationType: ["OPERATION"] }] };
		});
		const ran = (): string[] =>
			run.mock.calls.map(([statement]) => statement);
		return { actions: { run } as unknown as InsightActions, ran, state };
	}

	it("records which item a copy came from beside the files folder, and keeps what was recorded before", async () => {
		const { actions, ran } = twinServer();
		expect(
			await copyToTwin(actions, "twin-1", email("A.md", "thread-a")),
		).toEqual({ path: "public/emails/A.md" });
		await copyToTwin(actions, "twin-1", email("B.md", "thread-b"));
		expect(ran()).toEqual([
			copyOf("A.md"),
			// nothing recorded yet, so nothing to read
			ROOT,
			record({ "public/emails/A.md": "thread-a" }),
			noted("A.md"),
			copyOf("B.md"),
			ROOT,
			READ,
			record({
				"public/emails/A.md": "thread-a",
				"public/emails/B.md": "thread-b",
			}),
			noted("B.md"),
		]);
	});

	it("records the drive a file was saved from beside its id, and still knows what the twin holds", async () => {
		const { actions, state } = twinServer();
		await copyToTwin(actions, "twin-1", {
			path: "Plan.docx",
			name: "Plan.docx",
			service: "teams-files",
			itemKey: "item-1",
			driveId: "b!drive",
		});
		// a file of the owner's own drive, read without one, records none
		await copyToTwin(actions, "twin-1", {
			path: "Mine.docx",
			name: "Mine.docx",
			service: "onedrive",
			itemKey: "item-2",
		});
		expect(JSON.parse(state.record ?? "")).toEqual({
			"public/files/Plan.docx": "item-1",
			"drive:item-1": "b!drive",
			"public/files/Mine.docx": "item-2",
		});
		// the drive's entry names no copy, so it marks nothing
		expect([
			...(await readTwinHoldings(actions, "twin-1")).itemKeys,
		]).toEqual(["item-1", "item-2"]);
	});

	it("copies into one twin one at a time, so no record is saved over another", async () => {
		const { actions, ran, state } = twinServer();
		await Promise.all([
			copyToTwin(actions, "twin-1", email("A.md", "thread-a")),
			copyToTwin(actions, "twin-1", email("B.md", "thread-b")),
			copyToTwin(actions, "twin-1", UPLOAD),
		]);
		expect(ran().map((statement) => statement.split("(")[0])).toEqual([
			"Copy",
			"BrowseAppAssets",
			"SaveAppAssets",
			"WorkNoteTwinCopy",
			"Copy",
			"BrowseAppAssets",
			"GetAppAssets",
			"SaveAppAssets",
			"WorkNoteTwinCopy",
			// a file from the owner's computer came from no list, so it has nothing to record or to tell
			"Copy",
		]);
		expect(JSON.parse(state.record ?? "")).toEqual({
			"public/emails/A.md": "thread-a",
			"public/emails/B.md": "thread-b",
		});
	});

	it("answers with the copy when where it came from could not be recorded, and starts over a record it cannot read", async () => {
		const unreadable = twinServer("not a list");
		await copyToTwin(
			unreadable.actions,
			"twin-1",
			email("A.md", "thread-a"),
		);
		expect(unreadable.ran().slice(-2)).toEqual([
			record({ "public/emails/A.md": "thread-a" }),
			noted("A.md"),
		]);

		const { actions, ran } = transport({
			Copy: { targetFilePath: "public/emails/A.md" },
			[ROOT]: [],
			SaveAppAssets: new Error("The disk is full."),
		});
		expect(
			await copyToTwin(actions, "twin-1", email("A.md", "thread-a")),
		).toEqual({
			path: "public/emails/A.md",
			recordError: "The disk is full.",
		});
		// a copy that is not in the record is not one the server could look up
		expect(
			ran().some((statement) => statement.startsWith("WorkNote")),
		).toBe(false);
	});

	it("answers with the copy all the same when the server could not be told of it", async () => {
		const { actions } = transport({
			Copy: { targetFilePath: "public/emails/A.md" },
			[ROOT]: [],
			WorkNoteTwinCopy: new Error("Collaboration is not enabled"),
		});
		expect(
			await copyToTwin(actions, "twin-1", email("A.md", "thread-a")),
		).toEqual({ path: "public/emails/A.md" });
	});

	it("knows what the twin holds from the record and the copies still there, after the copies on their way", async () => {
		const { actions, ran, state } = twinServer();
		const copying = copyToTwin(
			actions,
			"twin-1",
			email("A.md", "thread-a"),
		);
		// asked for while the copy runs: it is read once the copy is in
		const holdings = await readTwinHoldings(actions, "twin-1");
		await copying;
		expect(holdings.hasFolder).toBe(true);
		expect([...holdings.itemKeys]).toEqual(["thread-a"]);
		expect(ran().slice(4)).toEqual([ROOT, READ, LIST]);

		// a second copy of one item, then the owner deletes the first and the only copy of another
		await copyToTwin(actions, "twin-1", email("A (2).md", "thread-a"));
		await copyToTwin(actions, "twin-1", email("B.md", "thread-b"));
		state.copies = state.copies.filter(
			(path) =>
				!["public/emails/A.md", "public/emails/B.md"].includes(path),
		);
		expect([
			...(await readTwinHoldings(actions, "twin-1")).itemKeys,
		]).toEqual(["thread-a"]);
		// the copies that are gone leave the record, so a file that takes one's name later is not taken for it
		expect(JSON.parse(state.record ?? "")).toEqual({
			"public/emails/A (2).md": "thread-a",
		});
	});

	it("drops a removed copy from the record with the drive only it was in, and nothing when no file is listed", async () => {
		const { actions, ran, state } = twinServer(
			JSON.stringify({
				"public/files/Plan.docx": "item-1",
				"drive:item-1": "b!drive",
				"public/files/Deck.pptx": "item-2",
				"public/files/Deck (2).pptx": "item-2",
				"drive:item-2": "b!shared",
			}),
		);
		// the plan and the first deck were removed; the second copy of the deck is still there
		state.copies.push("public/files/Deck (2).pptx");
		await readTwinHoldings(actions, "twin-1");
		expect(JSON.parse(state.record ?? "")).toEqual({
			"public/files/Deck (2).pptx": "item-2",
			"drive:item-2": "b!shared",
		});
		// what is recorded matches what is there: nothing is saved again
		const saves = (): number =>
			ran().filter((statement) => statement.startsWith("SaveAppAssets"))
				.length;
		await readTwinHoldings(actions, "twin-1");
		expect(saves()).toBe(1);

		// a listing with no file in it may be one that failed: the record is left as it is
		state.copies = [];
		await readTwinHoldings(actions, "twin-1");
		expect(saves()).toBe(1);
	});

	it("still answers what the twin holds when the tidied record cannot be saved", async () => {
		const { actions } = transport({
			[ROOT]: [
				{ path: "/public/", name: "public", type: "directory" },
				{ path: "/twin-sources.json", name: "twin-sources.json" },
			],
			[LIST]: [{ path: "/public/emails/Kickoff.md" }],
			[READ]: {
				"public/emails/Kickoff.md": "conversation:hello",
				"public/emails/Gone.md": "conversation:gone",
			},
			SaveAppAssets: new Error("The disk is full."),
		});
		expect([
			...(await readTwinHoldings(actions, "twin-1")).itemKeys,
		]).toEqual(["conversation:hello"]);
	});

	it("skips the search when there is no files folder and lists uploads without a source record", async () => {
		const noFolder = transport({ [ROOT]: [] });
		expect(await readTwinHoldings(noFolder.actions, "twin-1")).toEqual({
			hasFolder: false,
			files: [],
			itemKeys: new Set(),
		});
		expect(noFolder.ran()).toEqual([ROOT]);

		const nothingRecorded = twinServer();
		nothingRecorded.state.copies.push("public/Plans/Trip.pdf");
		expect(
			await readTwinHoldings(nothingRecorded.actions, "twin-1"),
		).toEqual({
			hasFolder: true,
			files: [{ path: "/Plans/Trip.pdf", name: "Trip.pdf" }],
			itemKeys: new Set(),
		});
		expect(nothingRecorded.ran()).toEqual([ROOT, LIST]);
	});

	it("lists visible documents using their explorer paths, and excludes reserved files from the library and saved-item markers", async () => {
		const modified = "11/19/2026 15:42:01";
		const search = [
			{ path: "/public/emails", type: "directory" },
			{ path: "/public/emails/Kickoff.md", lastModified: modified },
			{ path: "public/Trips/agent-files-index.json" },
			{ path: "/public/agent-files-index.json" },
			{ path: "/public/placeholder.txt" },
			{ path: "/public/meetings/placeholder.txt" },
			{ path: "/public/.drafts/notes.md" },
			{ path: "/public/Trips/.source" },
			{ path: "/public/../secret.md" },
			{ path: "/outside.txt" },
		];
		const { actions } = transport({
			[ROOT]: [
				{ path: "/public/", name: "public", type: "directory" },
				{ path: "/twin-sources.json", name: "twin-sources.json" },
			],
			[LIST]: search,
			[READ]: {
				"public/emails/Kickoff.md": "conversation:hello",
				"public/placeholder.txt": "unused",
			},
		});
		expect(await readTwinHoldings(actions, "twin-1")).toEqual({
			hasFolder: true,
			files: [
				{
					name: "Kickoff.md",
					path: "/emails/Kickoff.md",
					lastModified: modified,
				},
				{
					name: "agent-files-index.json",
					path: "/Trips/agent-files-index.json",
				},
			],
			itemKeys: new Set(["conversation:hello"]),
		});
	});

	it("reports an unreadable listing instead of an empty library", async () => {
		const root = [{ name: "public", path: "/public/", type: "directory" }];
		const unreadableRoot = transport({ [ROOT]: true });
		await expect(
			readTwinHoldings(unreadableRoot.actions, "twin-1"),
		).rejects.toThrow();
		for (const invalid of [null, true, [{}], new Error("Access denied")]) {
			const { actions } = transport({ [ROOT]: root, [LIST]: invalid });
			await expect(readTwinHoldings(actions, "twin-1")).rejects.toThrow();
		}
	});
});

describe("generating an avatar option", () => {
	it("asks for one from the owner's photo and gives back a PNG the image field takes, with an address to show it from", async () => {
		// three bytes, as base64
		const { actions, ran } = transport({
			WorkGenerateTwinAvatar: { image: "AQID" },
		});
		const option = await generateTwinAvatar(actions);
		expect(ran()).toEqual(["WorkGenerateTwinAvatar();"]);
		if (!option) throw new Error("expected an option");
		expect(option.file.name).toBe("avatar.png");
		expect(option.file.type).toBe("image/png");
		// jsdom's File has no arrayBuffer()
		const bytes = await new Promise<ArrayBuffer>((resolve) => {
			const reader = new FileReader();
			reader.onload = () => resolve(reader.result as ArrayBuffer);
			reader.readAsArrayBuffer(option.file);
		});
		expect([...new Uint8Array(bytes)]).toEqual([1, 2, 3]);
		expect(getCatalogImageValidationError(option.file)).toBeNull();
		expect(option.url).toBe("data:image/png;base64,AQID");
	});

	it("sends a description as an argument, so nothing in it runs as pixel", async () => {
		const { actions, ran } = transport({
			WorkGenerateTwinAvatar: { image: "AQID" },
		});
		await generateTwinAvatar(actions, 'Red hair"]); DeleteWorkspace(');
		expect(ran()).toEqual([
			'WorkGenerateTwinAvatar(description=["Red hair\\"]); DeleteWorkspace("]);',
		]);
	});

	it("names the look to draw, with a description or without", async () => {
		const { actions, ran } = transport({
			WorkGenerateTwinAvatar: { image: "AQID" },
		});
		await generateTwinAvatar(actions, undefined, 7);
		await generateTwinAvatar(actions, "Red hair", 8);
		expect(ran()).toEqual([
			"WorkGenerateTwinAvatar(variant=[7]);",
			'WorkGenerateTwinAvatar(description=["Red hair"], variant=[8]);',
		]);
	});

	it("answers with nothing when the server needs a description", async () => {
		const { actions } = transport({
			WorkGenerateTwinAvatar: { needsDescription: true },
		});
		expect(await generateTwinAvatar(actions)).toBeNull();
	});

	it("refuses an answer that is neither a picture nor a request for a description", async () => {
		const { actions } = transport({ WorkGenerateTwinAvatar: {} });
		await expect(generateTwinAvatar(actions)).rejects.toThrow(
			"did not return a picture",
		);
	});
});

describe("the index of what a twin's files hold", () => {
	const INDEX = 'WorkIndexTwinFiles(project=["twin-1"]);';
	/** A transport that answers each pass of the index in turn; the last answer repeats. */
	function passes(...answers: unknown[]) {
		let pass = 0;
		return transport({
			get WorkIndexTwinFiles() {
				const answer = answers[Math.min(pass, answers.length - 1)];
				pass += 1;
				return answer;
			},
		});
	}

	it("asks again while files wait and the last pass got somewhere", async () => {
		const { actions, ran } = passes(
			{ described: 12, remaining: 5 },
			{ described: 5, remaining: 0 },
		);
		await indexTwinFiles(actions, "twin-1");
		expect(ran()).toEqual([INDEX, INDEX]);
	});

	it("stops when a pass describes nothing, as with no text model, and after ten passes", async () => {
		const stuck = passes({
			described: 0,
			remaining: 3,
			note: "Descriptions need Collaboration's text model",
		});
		await indexTwinFiles(stuck.actions, "twin-1");
		expect(stuck.ran()).toEqual([INDEX]);

		const endless = passes({ described: 12, remaining: 100 });
		await indexTwinFiles(endless.actions, "twin-1");
		expect(endless.ran()).toHaveLength(10);
	});

	it("never fails its caller: a refusal, or an answer it cannot read, only ends it", async () => {
		const refused = passes(new Error("Collaboration is not enabled"));
		await expect(
			indexTwinFiles(refused.actions, "twin-1"),
		).resolves.toBeUndefined();
		expect(refused.ran()).toEqual([INDEX]);

		// an older server answers true to a reactor it does not have
		const unread = passes(true);
		await expect(
			indexTwinFiles(unread.actions, "twin-1"),
		).resolves.toBeUndefined();
		expect(unread.ran()).toEqual([INDEX]);
	});

	it("takes its turn after a copy that is on its way into the twin", async () => {
		const { actions, ran } = transport({
			Copy: { targetFilePath: "public/emails/Budget review.md" },
			BrowseAppAssets: [],
			WorkIndexTwinFiles: { described: 1, remaining: 0 },
		});
		const copy = copyToTwin(actions, "twin-1", {
			...EMAIL,
			itemKey: "budget-review",
		});
		const index = indexTwinFiles(actions, "twin-1");
		await Promise.all([copy, index]);
		expect(ran().map((statement) => statement.split("(")[0])).toEqual([
			"Copy",
			"BrowseAppAssets",
			"SaveAppAssets",
			"WorkNoteTwinCopy",
			"WorkIndexTwinFiles",
		]);
	});
});

describe("what was said in a meeting", () => {
	// jsdom's File has no text()
	const textOf = (file: File): Promise<string> =>
		new Promise((resolve) => {
			const reader = new FileReader();
			reader.onload = () => resolve(String(reader.result));
			reader.readAsText(file);
		});

	const read = (offset?: number) =>
		`MicrosoftCalendarGetMeetingTranscript(id=["event-1"]${offset === undefined ? "" : `, offset=[${offset}]`});`;

	it("reads a transcript a page at a time until there is no more", async () => {
		const { actions, ran } = transport({
			[read()]: {
				subject: "Weekly sync",
				transcript: "Ann: Hello.",
				hasMore: true,
				nextOffset: 40,
			},
			[read(40)]: { transcript: "Bo: Hi.", hasMore: false },
		});
		expect(await readMeetingTranscript(actions, "event-1")).toEqual({
			subject: "Weekly sync",
			text: "Ann: Hello.\nBo: Hi.",
			isCutShort: false,
		});
		expect(ran()).toEqual([read(), read(40)]);
	});

	it("answers why a meeting has none, and says when a long one was not read to its end", async () => {
		expect(
			await readMeetingTranscript(
				transport({
					[read()]: {
						subject: "Weekly sync",
						message: "Not transcribed.",
					},
				}).actions,
				"event-1",
			),
		).toEqual({ message: "Not transcribed." });

		// every page promises another: reading stops, and says so
		const endless = transport({
			MicrosoftCalendarGetMeetingTranscript: {
				transcript: "Ann: Still talking.",
				hasMore: true,
				nextOffset: 1,
			},
		});
		const long = await readMeetingTranscript(endless.actions, "event-1");
		expect(long).toMatchObject({ isCutShort: true });
		expect(endless.ran()).toHaveLength(12);
	});

	it("writes a transcript as a file named for its meeting", async () => {
		const file = meetingTranscriptFile({
			subject: "Q4: plan / review",
			text: "Ann: Hello.",
			isCutShort: true,
		});
		// nothing a file system minds
		expect(file.name).toBe("Q4-plan-review-transcript.md");
		expect(await textOf(file)).toBe(
			"# Q4: plan / review: transcript\n\nAnn: Hello.\n\nThe meeting went on past this point; the rest of its transcript was not read.\n",
		);
		expect(
			meetingTranscriptFile({ subject: " ", text: "", isCutShort: false })
				.name,
		).toBe("Meeting-transcript.md");
	});
});
