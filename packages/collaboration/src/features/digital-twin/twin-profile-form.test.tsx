import {
	cleanup,
	fireEvent,
	render,
	screen,
	within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
afterEach(cleanup);

/** The form, in a session whose server can make avatar options when `canGenerate` is set. */
function renderForm(canGenerate = false, isNoteUnread = false) {
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
			onSaved={onSaved}
		/>
	);
	render(
		canGenerate ? (
			<CollaborationSessionProvider
				initialState={{
					...session,
					settings: { ...session.settings, avatarGeneration: true },
				}}
			>
				{form}
			</CollaborationSessionProvider>
		) : (
			form
		),
	);
	return { onSaved, user: userEvent.setup() };
}

const nameField = () => screen.getByLabelText("Name (required)");

it("creates and selects a skill without saving the twin or losing its draft", async () => {
	answers.CreateSkill = { project_id: "skill-new", name: "Brief replies" };
	const { user, onSaved } = renderForm();
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
	expect(ran()).toEqual(["CreateSkill"]);
	expect(onSaved).not.toHaveBeenCalled();
	expect(screen.getByLabelText("Greeting")).toHaveValue("Hello there");
	await vi.waitFor(() => expect(trigger).toHaveFocus());
	await user.click(screen.getByRole("button", { name: "Save" }));
	await vi.waitFor(() => expect(onSaved).toHaveBeenCalledOnce());
	expect(insight.actions.run.mock.calls.at(-1)?.[0]).toContain(
		'skills=["skill-1","skill-gone","skill-new"]',
	);
});

it("validates a skill, retains failed input, and blocks dismissal while creating", async () => {
	const { user, onSaved } = renderForm();
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
	const { user } = renderForm();
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
	const { onSaved, user } = renderForm();
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
	await user.click(screen.getByRole("button", { name: "Save" }));
	await vi.waitFor(() => expect(onSaved).toHaveBeenCalledOnce());
	expect(ran()).toEqual(["GetWorkspace", "EditWorkspace"]);
	expect(insight.actions.run.mock.calls[1]?.[0]).toContain(
		'mcp=[{"id":"db-1","name":"Sales","type":"DATABASE"}], skills=["skill-1"]',
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
	const { onSaved, user } = renderForm();
	await user.clear(nameField());
	if (name) await user.type(nameField(), name);
	await user.click(screen.getByRole("button", { name: "Save" }));
	expect(await screen.findByText(problem)).toBeVisible();
	expect(nameField()).toBeInvalid();
	expect(insight.actions.run).not.toHaveBeenCalled();
	expect(onSaved).not.toHaveBeenCalled();
});

it("uploads a newly chosen image after the profile, then holds no file", async () => {
	const { onSaved, user } = renderForm();
	const image = new File(["x"], "robin.png", { type: "image/png" });
	const input = screen.getByLabelText<HTMLInputElement>("Image");
	await user.upload(input, image);
	await user.click(screen.getByRole("button", { name: "Save" }));
	await vi.waitFor(() => expect(onSaved).toHaveBeenCalledOnce());
	expect(upload).toHaveBeenCalledExactlyOnceWith("twin-1", image);
	expect(upload.mock.invocationCallOrder[0]).toBeGreaterThan(
		insight.actions.run.mock.invocationCallOrder[1] ?? 0,
	);
	// saved: a second Save must not upload the same file again
	expect(input.files).toHaveLength(0);
	await user.click(screen.getByRole("button", { name: "Save" }));
	await vi.waitFor(() => expect(onSaved).toHaveBeenCalledTimes(2));
	expect(upload).toHaveBeenCalledOnce();
});

it("refuses an image the server would not take, and saves nothing", async () => {
	renderForm();
	// a file dragged onto the field gets past the picker's own filter
	const user = userEvent.setup({ applyAccept: false });
	await user.upload(
		screen.getByLabelText("Image"),
		new File(["x"], "robin.txt", { type: "text/plain" }),
	);
	await user.click(screen.getByRole("button", { name: "Save" }));
	expect(
		await screen.findByText("Choose a PNG, JPEG, or GIF image."),
	).toBeVisible();
	expect(insight.actions.run).not.toHaveBeenCalled();
});

it("shows a save that failed, with what was entered still there, and saves on the next try", async () => {
	answers.EditWorkspace = new Error("The agent is locked");
	const { onSaved, user } = renderForm();
	await user.type(screen.getByLabelText("Greeting"), " there");
	await user.click(screen.getByRole("button", { name: "Save" }));
	expect(await screen.findByRole("alert")).toHaveTextContent(
		"The agent is locked",
	);
	expect(screen.getByLabelText("Greeting")).toHaveValue("Hello there");
	expect(onSaved).not.toHaveBeenCalled();

	delete answers.EditWorkspace;
	await user.click(screen.getByRole("button", { name: "Save" }));
	await vi.waitFor(() => expect(onSaved).toHaveBeenCalledOnce());
	expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});

it("offers no generated options where the server cannot make them", () => {
	renderForm();
	expect(
		screen.queryByRole("button", { name: "Generate options" }),
	).toBeNull();
	expect(screen.getByText(/It is uploaded when you save/)).toBeVisible();
});

it("uploads a generated option the owner picked, as it does a chosen file", async () => {
	// three bytes, as base64
	answers.WorkGenerateTwinAvatar = { image: "AQID" };
	const { onSaved, user } = renderForm(true);
	await user.click(screen.getByRole("button", { name: "Generate options" }));
	await user.click(await screen.findByRole("radio", { name: "Option 2" }));
	expect(screen.getByRole("radio", { name: "Option 2" })).toBeChecked();

	await user.click(screen.getByRole("button", { name: "Save" }));
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
	const { user } = renderForm(true);
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

	await user.click(screen.getByRole("button", { name: "Save" }));
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
	const { user, onSaved } = renderForm();
	const about = screen.getByLabelText("About you");
	expect(about).toHaveValue("I run renewals.");
	expect(about).toHaveAccessibleDescription(/A note your twin reads/);
	// something else changed: the note is left as the twin holds it
	await user.type(screen.getByLabelText("Greeting"), " there");
	await user.click(screen.getByRole("button", { name: "Save" }));
	await vi.waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1));
	expect(noteWrites()).toEqual([]);

	await user.type(about, " Ask Dana about billing.");
	await user.click(screen.getByRole("button", { name: "Save" }));
	await vi.waitFor(() => expect(onSaved).toHaveBeenCalledTimes(2));
	// saved now, so saving again writes nothing more
	await user.click(screen.getByRole("button", { name: "Save" }));
	await vi.waitFor(() => expect(onSaved).toHaveBeenCalledTimes(3));
	expect(noteWrites()).toEqual([
		'SaveAppAssets(project=["twin-1"], filePath=["/public/About me.md"], content=["I run renewals. Ask Dana about billing."]);',
	]);

	await user.clear(about);
	await user.click(screen.getByRole("button", { name: "Save" }));
	await vi.waitFor(() => expect(onSaved).toHaveBeenCalledTimes(4));
	expect(noteWrites().at(-1)).toBe(
		'DeleteAppAssets(project=["twin-1"], filePath=["/public/About me.md"]);',
	);
});

it("keeps the note and says the rest was saved when only the note could not be", async () => {
	answers.SaveAppAssets = new Error("The disk is full.");
	const { user, onSaved } = renderForm();
	await user.type(screen.getByLabelText("About you"), " More.");
	await user.click(screen.getByRole("button", { name: "Save" }));
	expect(await screen.findByRole("alert")).toHaveTextContent(
		"Your changes were saved, but your note could not be: The disk is full.",
	);
	expect(screen.getByLabelText("About you")).toHaveValue(
		"I run renewals. More.",
	);
	expect(onSaved).not.toHaveBeenCalled();
	// the next save tries the note again
	answers.SaveAppAssets = undefined;
	await user.click(screen.getByRole("button", { name: "Save" }));
	await vi.waitFor(() => expect(onSaved).toHaveBeenCalledOnce());
	expect(noteWrites()).toHaveLength(2);
});

it("refuses a note longer than a twin can take, before anything is sent", async () => {
	const { user } = renderForm();
	fireEvent.change(screen.getByLabelText("About you"), {
		target: { value: "x".repeat(8001) },
	});
	await user.click(screen.getByRole("button", { name: "Save" }));
	expect(
		await screen.findByText("Keep the note to 8,000 characters or fewer."),
	).toBeVisible();
	expect(insight.actions.run).not.toHaveBeenCalled();
});

it("locks a note that could not be read, and leaves the one the twin holds as it is", async () => {
	const { user, onSaved } = renderForm(false, true);
	const about = screen.getByLabelText("About you");
	expect(about).toBeDisabled();
	expect(about).toHaveAccessibleDescription(/could not be read just now/);
	await user.type(screen.getByLabelText("Greeting"), " there");
	await user.click(screen.getByRole("button", { name: "Save" }));
	await vi.waitFor(() => expect(onSaved).toHaveBeenCalledOnce());
	expect(noteWrites()).toEqual([]);
});
