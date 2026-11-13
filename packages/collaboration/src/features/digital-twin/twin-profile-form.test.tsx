import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
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
		const answer = answers[statement.slice(0, statement.indexOf("("))];
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

function renderForm() {
	const onSaved = vi.fn();
	render(
		<TwinProfileForm
			twin={{
				id: "twin-1",
				profile: {
					name: "Robin Twin",
					instructions: "Answer briefly.",
					greeting: "Hello",
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
			onSaved={onSaved}
		/>,
	);
	return { onSaved, user: userEvent.setup() };
}

const nameField = () => screen.getByLabelText("Name (required)");

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
