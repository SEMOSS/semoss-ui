import {
	act,
	cleanup,
	fireEvent,
	render,
	screen,
	within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { createInitialCollaborationState } from "@/features/collaboration/state/collaboration.fixtures";
import { CollaborationSessionProvider } from "@/features/collaboration/state/collaboration-session.context";
import { TwinProfileForm } from "./twin-profile-form";

// one actions object, as the provider gives
const insight = vi.hoisted(() => ({ actions: { run: vi.fn() } }));
const upload = vi.hoisted(() => vi.fn());

vi.mock("@semoss/sdk/react", () => ({ useInsight: () => insight }));
vi.mock("@semoss/sdk", async (importOriginal) => ({
	...(await importOriginal<typeof import("@semoss/sdk")>()),
	uploadProjectImage: upload,
}));

/** What the server answers each reactor with; an Error is a refusal. */
let answers: Record<string, unknown>;
const ran = (): string[] =>
	insight.actions.run.mock.calls.map(([statement]) =>
		String(statement).slice(0, String(statement).indexOf("(")),
	);

beforeEach(() => {
	vi.useFakeTimers({
		toFake: ["setTimeout", "clearTimeout"],
		shouldAdvanceTime: true,
	});
	answers = {
		GetWorkspace: {
			workspace_id: "twin-1",
			name: "Robin Twin",
			system_prompt: "",
			mcp: [],
			skills: [],
			prompts: [],
		},
	};
	insight.actions.run.mockReset();
	insight.actions.run.mockImplementation(async (statement: string) => {
		const answer =
			await answers[statement.slice(0, statement.indexOf("("))];
		if (answer instanceof Error) throw answer;
		return {
			pixelReturn: [
				{ output: answer ?? true, operationType: ["OPERATION"] },
			],
		};
	});
	upload.mockReset();
	upload.mockResolvedValue({});
	// jsdom has no object URLs; the preview only needs an address
	URL.createObjectURL = vi.fn(() => "blob:preview");
	URL.revokeObjectURL = vi.fn();
});
afterEach(async () => {
	await act(async () => cleanup());
	vi.useRealTimers();
});

/** Allow the profile debounce and the resulting React updates to finish. */
async function autosave(milliseconds = 750): Promise<void> {
	await act(async () => {
		await vi.advanceTimersByTimeAsync(milliseconds);
	});
}

/** Hold a network write open while the owner continues editing. */
function deferredWrite() {
	let finish = (): void => undefined;
	const promise = new Promise<void>((resolve) => {
		finish = resolve;
	});
	return { promise, resolve: finish };
}

/** The form, in a session whose server can make avatar options when `canGenerate` is set. */
function renderForm(
	canGenerate = false,
	isNoteUnread = false,
	persona?: { isUsed: boolean },
) {
	const onSaved = vi.fn();
	const session = createInitialCollaborationState();
	const form = (
		<TwinProfileForm
			twin={{
				id: "twin-1",
				profile: {
					name: "Robin Twin",
					instructions: "Answer briefly.",
					greeting: "Hello",
					about: "I run renewals.",
					skills: ["skill-1", "skill-gone"],
					toolboxes: [
						{ id: "db-1", name: "Sales", type: "DATABASE" },
					],
					usePersona: persona?.isUsed !== false,
				},
			}}
			skills={[
				{
					id: "skill-1",
					name: "Client summary",
					description: "One section per client",
				},
			]}
			imageUrl="/twin.png"
			isNoteUnread={isNoteUnread}
			hasPersona={persona !== undefined}
			onSaved={onSaved}
		/>
	);
	render(
		<MemoryRouter>
			{canGenerate ? (
				<CollaborationSessionProvider
					initialState={{
						...session,
						settings: {
							...session.settings,
							avatarGeneration: true,
						},
					}}
				>
					{form}
				</CollaborationSessionProvider>
			) : (
				form
			)}
		</MemoryRouter>,
	);
	const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
	const edit = async (title: string): Promise<void> => {
		await user.click(screen.getByRole("button", { name: title }));
	};
	return { onSaved, user, edit };
}

const nameField = () => screen.getByLabelText("Name (required)");

it("reads a short preview for a folded note and retains all of its original text", async () => {
	const { edit } = renderForm();
	const note = `My work\n\n${"🗓".repeat(140)}`;
	await edit("About you");
	fireEvent.change(screen.getByRole("textbox", { name: "About you" }), {
		target: { value: note },
	});
	await edit("About you");
	expect(
		screen.getByRole("button", { name: "About you" }),
	).toHaveAccessibleDescription(`My work ${"🗓".repeat(112)}…`);
	await edit("About you");
	expect(screen.getByRole("textbox", { name: "About you" })).toHaveValue(
		note,
	);
});

it("summarizes the draft and keeps the fields folded until their section is opened", async () => {
	const { user, edit } = renderForm();
	const identity = screen.getByRole("button", { name: "Name and portrait" });
	expect(identity).toHaveAttribute("aria-expanded", "false");
	expect(identity).toHaveAccessibleDescription("Robin Twin");
	expect(screen.queryByRole("textbox")).toBeNull();
	expect(
		screen.getByRole("button", { name: "Skills and toolboxes" }),
	).toHaveAccessibleDescription("2 skills · 1 toolbox");

	await edit("Name and portrait");
	await user.clear(nameField());
	await user.type(nameField(), "Renewals Twin");
	await edit("Name and portrait");
	expect(identity).toHaveAccessibleDescription("Renewals Twin");
	expect(screen.queryByRole("button", { name: "Save changes" })).toBeNull();
	expect(insight.actions.run).not.toHaveBeenCalled();
});

it("debounces rapid edits, then saves the latest draft behind an in-flight write", async () => {
	const { edit } = renderForm();
	await edit("Instructions and greeting");
	const greeting = screen.getByLabelText("Greeting");
	const writes = () =>
		insight.actions.run.mock.calls
			.map(([statement]) => String(statement))
			.filter((statement) => statement.startsWith("EditWorkspace("));
	vi.useRealTimers();
	vi.useFakeTimers();
	const first = deferredWrite();
	answers.EditWorkspace = first.promise;
	await autosave(1000);
	expect(writes()).toEqual([]);
	fireEvent.change(greeting, { target: { value: "First" } });
	await autosave(500);
	fireEvent.change(greeting, { target: { value: "First greeting" } });
	await autosave(749);
	expect(writes()).toEqual([]);
	await autosave(1);
	expect(writes()).toHaveLength(1);
	expect(writes()[0]).toContain("First greeting");
	expect(
		screen.getByRole("status", { name: "Save status" }),
	).toHaveTextContent("Saving…");
	expect(greeting).toBeEnabled();

	fireEvent.change(greeting, { target: { value: "Latest greeting" } });
	await autosave(1000);
	expect(writes()).toHaveLength(1);
	delete answers.EditWorkspace;
	await act(async () => first.resolve());
	await autosave(1000);
	expect(writes()).toHaveLength(2);
	expect(writes()[1]).toContain("Latest greeting");
	expect(greeting).toHaveValue("Latest greeting");
	expect(
		screen.getByRole("status", { name: "Save status" }),
	).toHaveTextContent("Saved");
});

it("preserves the space under the cursor when typing pauses between words", async () => {
	const { user, edit } = renderForm();
	await edit("Instructions and greeting");
	const greeting = screen.getByLabelText("Greeting");
	await user.type(greeting, " there ");
	await autosave();
	expect(greeting).toHaveValue("Hello there ");
	expect(greeting).toHaveFocus();
	expect(insight.actions.run.mock.calls.at(-1)?.[0]).toContain(
		'greeting="Hello there"',
	);
	await user.keyboard("everyone");
	await autosave();
	expect(insight.actions.run.mock.calls.at(-1)?.[0]).toContain(
		'greeting="Hello there everyone"',
	);
});

it("creates a skill and automatically saves its selection alongside the greeting", async () => {
	answers.CreateSkill = { project_id: "skill-new", name: "Brief replies" };
	const { user, edit } = renderForm();
	await edit("Instructions and greeting");
	await edit("Skills and toolboxes");
	await user.type(screen.getByLabelText("Greeting"), " there");
	const trigger = screen.getByRole("button", { name: "Create skill" });
	await user.click(trigger);
	const dialog = within(screen.getByRole("dialog", { name: "Create skill" }));
	await user.type(
		dialog.getByLabelText("Skill name (required)"),
		"Brief replies",
	);
	await user.type(
		dialog.getByLabelText("Description (required)"),
		"For questions",
	);
	await user.type(
		dialog.getByLabelText("Skill instructions (required)"),
		"Answer in **three** bullets.",
	);
	await user.click(dialog.getByRole("button", { name: "Create skill" }));
	expect(
		await screen.findByRole("button", { name: "View Brief replies" }),
	).toBeVisible();
	expect(ran()).toContain("CreateSkill");
	expect(screen.getByLabelText("Greeting")).toHaveValue("Hello there");
	await vi.waitFor(() => expect(trigger).toHaveFocus());
	await autosave();
	expect(insight.actions.run.mock.calls.at(-1)?.[0]).toContain(
		'skills=["skill-1","skill-gone","skill-new"]',
	);
});

it("validates a skill, retains failed input, and blocks dismissal while creating", async () => {
	const { user, onSaved, edit } = renderForm();
	await edit("Skills and toolboxes");
	await user.click(screen.getByRole("button", { name: "Create skill" }));
	const dialog = within(screen.getByRole("dialog", { name: "Create skill" }));
	await user.click(dialog.getByRole("button", { name: "Create skill" }));
	expect(await dialog.findByText("Name is required")).toBeVisible();
	expect(insight.actions.run).not.toHaveBeenCalled();
	await user.type(
		dialog.getByLabelText("Skill name (required)"),
		"Brief replies",
	);
	await user.type(
		dialog.getByLabelText("Description (required)"),
		"For questions",
	);
	await user.type(
		dialog.getByLabelText("Skill instructions (required)"),
		"Use three bullets.",
	);
	answers.CreateSkill = new Error("Skill creation is unavailable");
	await user.click(dialog.getByRole("button", { name: "Create skill" }));
	expect(await dialog.findByRole("alert")).toHaveTextContent(
		"Skill creation is unavailable",
	);
	expect(dialog.getByLabelText("Skill instructions (required)")).toHaveValue(
		"Use three bullets.",
	);
	let finish = (_value: unknown): void => undefined;
	answers.CreateSkill = new Promise((resolve) => {
		finish = resolve;
	});
	await user.click(dialog.getByRole("button", { name: "Create skill" }));
	expect(dialog.getByRole("button", { name: "Creating…" })).toBeDisabled();
	expect(dialog.getByRole("button", { name: "Cancel" })).toBeDisabled();
	await user.keyboard("{Escape}");
	expect(screen.getByRole("dialog", { name: "Create skill" })).toBeVisible();
	finish({ project_id: "skill-new", name: "Brief replies" });
	expect(
		await screen.findByRole("button", { name: "View Brief replies" }),
	).toBeVisible();
	expect(ran()).toEqual(["CreateSkill", "CreateSkill"]);
	expect(onSaved).not.toHaveBeenCalled();
});

it("reads full skill content on demand, retries failures, and returns focus to View", async () => {
	const { user, edit } = renderForm();
	await edit("Skills and toolboxes");
	const trigger = screen.getByRole("button", { name: "View Client summary" });
	expect(insight.actions.run).not.toHaveBeenCalled();
	answers.ReadSkillFile = new Error("The skill is temporarily unavailable");
	await user.click(trigger);
	const dialog = within(
		screen.getByRole("dialog", { name: "Client summary" }),
	);
	expect(await dialog.findByRole("alert")).toHaveTextContent(
		"The skill is temporarily unavailable",
	);
	answers.ReadSkillFile =
		"---\nname: client-summary\n---\n\nUse one section per client.\nKeep all details.";
	await user.click(dialog.getByRole("button", { name: "Try again" }));
	expect(await dialog.findByText(/Keep all details/)).toHaveTextContent(
		"name: client-summary",
	);
	expect(insight.actions.run.mock.calls.at(-1)?.[0]).toBe(
		'ReadSkillFile(project=["skill-1"], filePath=["SKILL.md"]);',
	);
	await user.keyboard("{Escape}");
	await vi.waitFor(() => expect(trigger).toHaveFocus());
	expect(screen.queryByRole("dialog")).toBeNull();
});

it("opens on what is saved, with a skill the owner lost named as such, and saves without creating", async () => {
	const { onSaved, user, edit } = renderForm();
	await edit("Name and portrait");
	await edit("Instructions and greeting");
	await edit("Skills and toolboxes");
	expect(nameField()).toHaveValue("Robin Twin");
	expect(screen.getByLabelText("Instructions")).toHaveValue(
		"Answer briefly.",
	);
	expect(screen.getByLabelText("Greeting")).toHaveValue("Hello");
	expect(screen.getByText("Client summary")).toBeVisible();
	expect(screen.getByText("A skill you can no longer use")).toBeVisible();
	expect(screen.getByText("Sales")).toBeVisible();

	await user.click(
		screen.getByRole("button", {
			name: "Remove A skill you can no longer use",
		}),
	);
	await autosave();
	await vi.waitFor(() => expect(onSaved).toHaveBeenCalledOnce());
	expect(ran()).toEqual(["GetWorkspace", "EditWorkspace"]);
	// The mock server now has no toolboxes. Removing a skill must preserve that concurrent change.
	expect(insight.actions.run.mock.calls[1]?.[0]).toContain(
		'mcp=[], skills=["skill-1"]',
	);
	expect(upload).not.toHaveBeenCalled();
});

it.each([
	["", "Name is required"],
	[
		"Robin's twin",
		"Start with a letter, then use only letters, numbers, spaces, hyphens and underscores.",
	],
])("refuses the name %j before anything is sent", async (name, problem) => {
	const { onSaved, user, edit } = renderForm();
	await edit("Name and portrait");
	await user.clear(nameField());
	if (name) await user.type(nameField(), name);
	await edit("Instructions and greeting");
	await user.click(screen.getByLabelText("Greeting"));
	await autosave();
	expect(screen.getByRole("alert")).toHaveTextContent(problem);
	expect(nameField()).toBeInvalid();
	expect(screen.getByLabelText("Greeting")).toHaveFocus();
	expect(insight.actions.run).not.toHaveBeenCalled();
	expect(onSaved).not.toHaveBeenCalled();
	await user.clear(nameField());
	await user.type(nameField(), "Renewals");
	await autosave();
	expect(onSaved).toHaveBeenCalledOnce();
	expect(nameField()).toBeValid();
});

it("uploads a newly chosen image once and clears the file picker", async () => {
	const { onSaved, user, edit } = renderForm();
	await edit("Name and portrait");
	const image = new File(["x"], "robin.png", { type: "image/png" });
	const input = screen.getByLabelText<HTMLInputElement>("Image");
	await user.upload(input, image);
	await autosave();
	await vi.waitFor(() => expect(onSaved).toHaveBeenCalledOnce());
	expect(upload).toHaveBeenCalledExactlyOnceWith("twin-1", image);
	expect(ran()).toEqual([]);
	expect(input.files).toHaveLength(0);
	await user.type(nameField(), " Updated");
	await autosave();
	expect(onSaved).toHaveBeenCalledTimes(2);
	expect(upload).toHaveBeenCalledOnce();
});

it("keeps a replacement portrait selected while the previous file is uploading", async () => {
	const { user, edit } = renderForm();
	await edit("Name and portrait");
	const input = screen.getByLabelText<HTMLInputElement>("Image");
	const options = { type: "image/png", lastModified: 1234 };
	const first = new File(["1"], "robin.png", options);
	const next = new File(["2"], "robin.png", options);
	const uploading = deferredWrite();
	upload.mockReturnValueOnce(uploading.promise);
	await user.upload(input, first);
	await autosave();
	expect(upload.mock.calls[0]?.[1]).toBe(first);
	expect(input).toBeEnabled();
	await user.upload(input, next);
	await autosave();
	expect(upload).toHaveBeenCalledTimes(1);
	expect(input.files?.[0]).toBe(next);
	await act(async () => uploading.resolve());
	await vi.waitFor(() => expect(upload).toHaveBeenCalledTimes(2));
	expect(upload.mock.calls[1]?.[1]).toBe(next);
	expect(input.files).toHaveLength(0);
});

it("refuses an image the server would not take, and saves nothing", async () => {
	const { edit } = renderForm();
	await edit("Name and portrait");
	// a file dragged onto the field gets past the picker's own filter
	const user = userEvent.setup({
		applyAccept: false,
		advanceTimers: vi.advanceTimersByTime,
	});
	await user.upload(
		screen.getByLabelText("Image"),
		new File(["x"], "robin.txt", { type: "text/plain" }),
	);
	await autosave();
	expect(screen.getByRole("alert")).toHaveTextContent(
		"Choose a PNG, JPEG, or GIF image.",
	);
	expect(insight.actions.run).not.toHaveBeenCalled();
});

it("shows a save that failed, with what was entered still there, and saves on the next try", async () => {
	answers.EditWorkspace = new Error("The agent is locked");
	const { onSaved, user, edit } = renderForm();
	await edit("Instructions and greeting");
	await user.type(screen.getByLabelText("Greeting"), " there");
	await autosave();
	expect(await screen.findByRole("alert")).toHaveTextContent(
		"The agent is locked",
	);
	expect(screen.getByLabelText("Greeting")).toHaveValue("Hello there");
	expect(onSaved).not.toHaveBeenCalled();

	delete answers.EditWorkspace;
	await user.click(screen.getByRole("button", { name: /retry/i }));
	await vi.waitFor(() => expect(onSaved).toHaveBeenCalledOnce());
	expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});

it("offers no generated options where the server cannot make them", async () => {
	const { edit } = renderForm();
	await edit("Name and portrait");
	expect(
		screen.queryByRole("button", { name: "Generate options" }),
	).toBeNull();
	expect(screen.getByLabelText("Image")).toHaveAccessibleDescription(
		"PNG, JPEG or GIF, up to 10 MiB.",
	);
});

it("uploads a generated option the owner picked, as it does a chosen file", async () => {
	// three bytes, as base64
	answers.WorkGenerateTwinAvatar = { image: "AQID" };
	const { onSaved, user, edit } = renderForm(true);
	await edit("Name and portrait");
	await user.click(screen.getByRole("button", { name: "Generate options" }));
	await user.click(await screen.findByRole("radio", { name: "Option 2" }));
	expect(screen.getByRole("radio", { name: "Option 2" })).toBeChecked();

	await autosave();
	await vi.waitFor(() => expect(onSaved).toHaveBeenCalledOnce());
	expect(upload).toHaveBeenCalledOnce();
	const [twinId, file] = upload.mock.calls[0];
	expect(twinId).toBe("twin-1");
	expect(file).toBeInstanceOf(File);
	expect(file.type).toBe("image/png");
	// saved: nothing is waiting to upload, so no option shows as picked
	expect(screen.getByRole("radio", { name: "Option 2" })).not.toBeChecked();
});

it("holds one image at a time: a picked option takes a chosen file's place, and a chosen file a picked option's", async () => {
	answers.WorkGenerateTwinAvatar = { image: "AQID" };
	const { user, edit } = renderForm(true);
	await edit("Name and portrait");
	const input = screen.getByLabelText<HTMLInputElement>("Image");
	await user.upload(
		input,
		new File(["x"], "robin.png", { type: "image/png" }),
	);
	expect(input.files).toHaveLength(1);

	await user.click(screen.getByRole("button", { name: "Generate options" }));
	await user.click(await screen.findByRole("radio", { name: "Option 1" }));
	// the file picker no longer names a file the form does not hold
	expect(input.files).toHaveLength(0);

	const chosen = new File(["y"], "robin-2.png", { type: "image/png" });
	await user.upload(input, chosen);
	expect(input.files?.[0]).toBe(chosen);
	expect(screen.getByRole("radio", { name: "Option 1" })).not.toBeChecked();

	await autosave();
	await vi.waitFor(() =>
		expect(upload).toHaveBeenCalledExactlyOnceWith("twin-1", chosen),
	);
});

/** Every write of the owner's note the server was asked for, in full. */
const noteWrites = (): string[] =>
	insight.actions.run.mock.calls
		.map(([statement]) => String(statement))
		.filter((statement) => statement.includes("About me.md"));

it("saves the owner's note only when it changed, and takes the file away when it is emptied", async () => {
	const { user, onSaved, edit } = renderForm();
	await edit("About you");
	await edit("Instructions and greeting");
	const about = screen.getByRole("textbox", { name: "About you" });
	expect(about).toHaveValue("I run renewals.");
	expect(about).toHaveAccessibleDescription(/A note your twin reads/);
	// something else changed: the note is left as the twin holds it
	await user.type(screen.getByLabelText("Greeting"), " there");
	await autosave();
	await vi.waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1));
	expect(noteWrites()).toEqual([]);

	await user.type(about, " Ask Dana about billing.");
	await autosave();
	await vi.waitFor(() => expect(onSaved).toHaveBeenCalledTimes(2));
	expect(noteWrites()).toEqual([
		'SaveAppAssets(project=["twin-1"], filePath=["/public/About me.md"], content=["I run renewals. Ask Dana about billing."]);',
	]);

	await user.clear(about);
	await autosave();
	await vi.waitFor(() => expect(onSaved).toHaveBeenCalledTimes(3));
	expect(noteWrites().at(-1)).toBe(
		'DeleteAppAssets(project=["twin-1"], filePath=["/public/About me.md"]);',
	);
});

it("retains the note when its write fails and retries on request", async () => {
	answers.SaveAppAssets = new Error("The disk is full.");
	const { user, onSaved, edit } = renderForm();
	await edit("About you");
	await user.type(
		screen.getByRole("textbox", { name: "About you" }),
		" More.",
	);
	await autosave();
	expect(await screen.findByRole("alert")).toHaveTextContent(
		"The disk is full.",
	);
	expect(screen.getByRole("textbox", { name: "About you" })).toHaveValue(
		"I run renewals. More.",
	);
	expect(onSaved).not.toHaveBeenCalled();
	answers.SaveAppAssets = undefined;
	await user.click(screen.getByRole("button", { name: /retry/i }));
	await vi.waitFor(() => expect(onSaved).toHaveBeenCalledOnce());
	expect(noteWrites()).toHaveLength(2);
});

it("retries a failed portrait without rewriting the note that was already saved", async () => {
	const { edit, user } = renderForm();
	await edit("About you");
	await edit("Name and portrait");
	upload.mockRejectedValueOnce(new Error("Storage unavailable"));
	const portrait = new File(["x"], "robin.png", { type: "image/png" });
	await user.type(
		screen.getByRole("textbox", { name: "About you" }),
		" More.",
	);
	await user.upload(screen.getByLabelText("Image"), portrait);
	await autosave();
	expect(screen.getByRole("alert")).toHaveTextContent("Storage unavailable");
	expect(noteWrites()).toHaveLength(1);
	await user.click(screen.getByRole("button", { name: /retry/i }));
	await vi.waitFor(() => expect(upload).toHaveBeenCalledTimes(2));
	expect(screen.queryByRole("alert")).toBeNull();
	expect(noteWrites()).toHaveLength(1);
	expect(upload.mock.calls[1]?.[1]).toBe(portrait);
});

it("refuses a note longer than a twin can take, before anything is sent", async () => {
	const { edit } = renderForm();
	await edit("About you");
	fireEvent.change(screen.getByRole("textbox", { name: "About you" }), {
		target: { value: "x".repeat(8001) },
	});
	await autosave();
	expect(screen.getByRole("alert")).toHaveTextContent(
		"Keep the note to 8,000 characters or fewer.",
	);
	expect(insight.actions.run).not.toHaveBeenCalled();
});

it("locks a note that could not be read, and leaves the one the twin holds as it is", async () => {
	const { user, onSaved, edit } = renderForm(false, true);
	await edit("About you");
	await edit("Instructions and greeting");
	const about = screen.getByRole("textbox", { name: "About you" });
	expect(about).toBeDisabled();
	expect(about).toHaveAccessibleDescription(/could not be read just now/);
	await user.type(screen.getByLabelText("Greeting"), " there");
	await autosave();
	await vi.waitFor(() => expect(onSaved).toHaveBeenCalledOnce());
	expect(noteWrites()).toEqual([]);
});

it("switches the owner's persona for the twin with the rest of the form, and only when it changed", async () => {
	const switches = (): string[] =>
		insight.actions.run.mock.calls
			.map(([statement]) => String(statement))
			.filter((statement) => statement.startsWith("WorkSetTwinPersona"));
	const { user, onSaved } = renderForm(false, false, { isUsed: true });
	const persona = screen.getByRole("switch", { name: "Use my persona" });
	expect(persona).toBeChecked();
	expect(screen.queryByText(/You have no persona yet/)).toBeNull();

	await autosave();
	expect(insight.actions.run).not.toHaveBeenCalled();
	await user.click(persona);
	expect(persona).not.toBeChecked();
	expect(switches()).toEqual([]);

	await autosave();
	await vi.waitFor(() => expect(onSaved).toHaveBeenCalledOnce());
	expect(switches()).toEqual([
		'WorkSetTwinPersona(project=["twin-1"], enabled=[false]);',
	]);
	expect(ran()).toEqual(["WorkSetTwinPersona"]);
});

it("opens with the switch off for a twin its owner switched their persona off for", () => {
	renderForm(false, false, { isUsed: false });
	expect(
		screen.getByRole("switch", { name: "Use my persona" }),
	).not.toBeChecked();
});

it("shows no switch to someone with no persona, says where to write one, and leaves the twin's as it is", async () => {
	const { user, onSaved, edit } = renderForm();
	expect(screen.queryByRole("switch", { name: "Use my persona" })).toBeNull();
	expect(
		screen.getByRole("link", { name: "Create your persona" }),
	).toBeVisible();
	await edit("Instructions and greeting");
	await user.type(screen.getByLabelText("Greeting"), " there");
	await autosave();
	await vi.waitFor(() => expect(onSaved).toHaveBeenCalledOnce());
	expect(ran()).not.toContain("WorkSetTwinPersona");
});

it("keeps the form open when the persona switch fails", async () => {
	answers.WorkSetTwinPersona = new Error("It is not yours.");
	const { user, onSaved } = renderForm(false, false, { isUsed: true });
	await user.click(screen.getByRole("switch", { name: "Use my persona" }));
	await autosave();
	expect(await screen.findByRole("alert")).toHaveTextContent(
		"It is not yours.",
	);
	expect(onSaved).not.toHaveBeenCalled();
});
