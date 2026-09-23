import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { App, Engine } from "@semoss/shared";
import { projectListSchema } from "@/features/agents/api/agent-schemas";
import { agentFromProjectRow } from "@/features/agents/utils/agent-from-workspace";
import type { Agent } from "@/types/agent";
import { AgentSettings } from "./agent-settings-view";

const catalogState = vi.hoisted(() => ({
	error: null as Error | null,
	isLoading: false,
	hasMore: false,
	next: vi.fn(),
	reset: vi.fn(),
}));

vi.mock("@semoss/i18n", async (importOriginal) => ({
	...(await importOriginal<typeof import("@semoss/i18n")>()),
	useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock("@semoss/sdk/react", async (importOriginal) => ({
	...(await importOriginal<typeof import("@semoss/sdk/react")>()),
	usePixel: () => ({ data: undefined }),
	useIteratorPixel: (
		query: (limit: number, offset: number) => string,
		_count: unknown,
		transform: (rows: (Engine | App)[]) => unknown[],
	) => {
		const statement = query(25, 0);
		const rows: (Engine | App)[] = statement.includes("MyProjects")
			? [{ project_id: "project-1", project_name: "Research toolbox" }]
			: statement.includes('["VECTOR"]')
				? [
						{
							engine_id: "vector-1",
							engine_name: "Research knowledge",
							engine_type: "VECTOR",
						},
					]
				: statement.includes("MyEngines")
					? [
							{
								engine_id: "function-1",
								engine_name: "Search tools",
								engine_type: "FUNCTION",
							},
						]
					: [];
		return {
			data: catalogState.isLoading ? [] : transform(rows),
			...catalogState,
		};
	},
}));

const createObjectURL = vi.fn((file: File) => `blob:preview-${file.name}`);
const revokeObjectURL = vi.fn();

const agent: Agent = {
	id: "draft-1",
	name: "Research agent",
	description: "",
	icon: "compass",
	tone: "green",
	instructions: "Research carefully",
	skills: [],
	mcp: [],
	members: [],
};

describe("AgentSettings submission", () => {
	beforeEach(() => {
		createObjectURL.mockClear();
		revokeObjectURL.mockClear();
		catalogState.error = null;
		catalogState.isLoading = false;
		catalogState.hasMore = false;
		catalogState.next.mockClear();
		catalogState.reset.mockClear();
	});
	beforeAll(() => {
		vi.stubGlobal(
			"URL",
			class extends URL {
				static createObjectURL = createObjectURL;
				static revokeObjectURL = revokeObjectURL;
			},
		);
		vi.stubGlobal("matchMedia", (media: string) => ({
			media,
			matches: false,
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
		}));
	});

	afterAll(() => vi.unstubAllGlobals());

	it("previews a new agent's photo and passes the file only on save", async () => {
		const user = userEvent.setup();
		const onSave = vi.fn().mockResolvedValue(undefined);
		render(
			<AgentSettings
				agent={agent}
				agents={[]}
				skillOptions={[]}
				onSave={onSave}
				onClose={vi.fn()}
			/>,
		);
		expect(
			screen.getByRole("button", { name: "Choose photo" }),
		).toBeEnabled();
		const file = new File(["image"], "identity.png", { type: "image/png" });
		await user.upload(
			screen.getByLabelText("Choose agent identity image"),
			file,
		);
		expect(screen.getByRole("status")).toHaveTextContent(
			"Selected: identity.png",
		);
		expect(
			screen
				.getAllByAltText("")
				.some(
					(image) =>
						image.getAttribute("src") ===
						"blob:preview-identity.png",
				),
		).toBe(true);
		expect(screen.getByText("Unsaved changes")).toBeInTheDocument();
		expect(onSave).not.toHaveBeenCalled();
		await user.click(screen.getByRole("button", { name: "Save agent" }));
		await waitFor(() =>
			expect(onSave).toHaveBeenCalledWith(
				expect.objectContaining({ id: "draft-1" }),
				file,
			),
		);
		expect(onSave.mock.calls[0][0]).not.toHaveProperty("image");
	});

	it("includes photo-only changes in discard protection", async () => {
		const user = userEvent.setup();
		const onClose = vi.fn();
		const onSave = vi.fn();
		render(
			<AgentSettings
				agent={agent}
				agents={[]}
				skillOptions={[]}
				onSave={onSave}
				onClose={onClose}
			/>,
		);
		await user.upload(
			screen.getByLabelText("Choose agent identity image"),
			new File(["image"], "identity.png", { type: "image/png" }),
		);
		await user.click(screen.getByRole("button", { name: "Cancel" }));
		expect(screen.getByRole("alert")).toHaveTextContent(
			"Discard your unsaved changes?",
		);
		expect(onClose).not.toHaveBeenCalled();
		await user.click(screen.getByRole("button", { name: "Discard" }));
		expect(onClose).toHaveBeenCalledOnce();
		expect(onSave).not.toHaveBeenCalled();
	});

	it("cleans preview URLs on replacement, removal, and unmount", async () => {
		const user = userEvent.setup();
		const { unmount } = render(
			<AgentSettings
				agent={agent}
				agents={[]}
				skillOptions={[]}
				onSave={vi.fn()}
				onClose={vi.fn()}
			/>,
		);
		const input = screen.getByLabelText("Choose agent identity image");
		await user.upload(
			input,
			new File(["first"], "one.png", { type: "image/png" }),
		);
		await user.upload(
			input,
			new File(["second"], "two.png", { type: "image/png" }),
		);
		expect(revokeObjectURL).toHaveBeenCalledWith("blob:preview-one.png");
		await user.click(screen.getByRole("button", { name: "Remove photo" }));
		expect(revokeObjectURL).toHaveBeenCalledWith("blob:preview-two.png");
		expect(
			screen.getByRole("button", { name: "Choose photo" }),
		).toHaveFocus();
		expect(screen.queryByText("Unsaved changes")).not.toBeInTheDocument();
		await user.upload(
			input,
			new File(["third"], "three.png", { type: "image/png" }),
		);
		unmount();
		expect(revokeObjectURL).toHaveBeenCalledWith("blob:preview-three.png");
	});

	it.each([
		[
			new File(["svg"], "identity.svg", { type: "image/svg+xml" }),
			"PNG, JPEG, or GIF",
		],
		[new File([], "empty.png", { type: "image/png" }), "not empty"],
		[
			new File([new Uint8Array(10 * 1024 * 1024 + 1)], "large.png", {
				type: "image/png",
			}),
			"10 MiB",
		],
	] as const)(
		"rejects invalid image selections: %s",
		async (file, message) => {
			const user = userEvent.setup({ applyAccept: false });
			const onSave = vi.fn();
			render(
				<AgentSettings
					agent={agent}
					agents={[]}
					skillOptions={[]}
					onSave={onSave}
					onClose={vi.fn()}
				/>,
			);
			await user.upload(
				screen.getByLabelText("Choose agent identity image"),
				file,
			);
			expect(await screen.findByRole("alert")).toHaveTextContent(message);
			expect(
				screen.getByRole("button", { name: "Choose photo" }),
			).toHaveAccessibleDescription(expect.stringContaining(message));
			await user.click(
				screen.getByRole("button", { name: "Save agent" }),
			);
			expect(onSave).not.toHaveBeenCalled();
			expect(createObjectURL).not.toHaveBeenCalled();
		},
	);

	it("retains the selected file after a save fails and retries it", async () => {
		const user = userEvent.setup();
		const onSave = vi
			.fn()
			.mockRejectedValueOnce(new Error("Photo upload failed"))
			.mockResolvedValueOnce(undefined);
		render(
			<AgentSettings
				agent={agent}
				agents={[]}
				skillOptions={[]}
				onSave={onSave}
				onClose={vi.fn()}
			/>,
		);
		const file = new File(["image"], "identity.png", { type: "image/png" });
		await user.upload(
			screen.getByLabelText("Choose agent identity image"),
			file,
		);
		await user.click(screen.getByRole("button", { name: "Save agent" }));
		expect(await screen.findByRole("alert")).toHaveTextContent(
			"Photo upload failed",
		);
		expect(screen.getByRole("status")).toHaveTextContent("identity.png");
		await user.click(screen.getByRole("button", { name: "Save agent" }));
		await waitFor(() => expect(onSave).toHaveBeenCalledTimes(2));
		expect(onSave).toHaveBeenLastCalledWith(
			expect.objectContaining({ id: agent.id }),
			file,
		);
	});

	it("stages an existing photo's removal until save", async () => {
		const user = userEvent.setup();
		const onSave = vi.fn().mockResolvedValue(undefined);
		render(
			<AgentSettings
				agent={{ ...agent, avatar: "/current-photo.png" }}
				agents={[]}
				skillOptions={[]}
				onSave={onSave}
				onClose={vi.fn()}
			/>,
		);
		await user.click(screen.getByRole("button", { name: "Remove photo" }));
		expect(onSave).not.toHaveBeenCalled();
		expect(screen.getByRole("status")).toHaveTextContent(
			"removed when you save",
		);
		await user.click(screen.getByRole("button", { name: "Save agent" }));
		await waitFor(() =>
			expect(onSave).toHaveBeenCalledWith(
				expect.objectContaining({ id: agent.id }),
				null,
			),
		);
	});

	it("keeps the draft after a failed save and disables mutations while saving", async () => {
		const user = userEvent.setup();
		let rejectSave: (cause: Error) => void = () => undefined;
		const pending = new Promise<void>((_resolve, reject) => {
			rejectSave = reject;
		});
		const onSave = vi
			.fn()
			.mockReturnValueOnce(pending)
			.mockResolvedValueOnce(undefined);
		const onClose = vi.fn();
		const existingDescription = `  ${"Existing description. ".repeat(6)} `;
		render(
			<AgentSettings
				agent={{ ...agent, description: existingDescription }}
				agents={[{ ...agent, id: "helper-1", name: "Research helper" }]}
				skillOptions={[]}
				onSave={onSave}
				onClose={onClose}
			/>,
		);
		await user.clear(
			screen.getByRole("textbox", { name: "Name (required)" }),
		);
		await user.type(
			screen.getByRole("textbox", { name: "Name (required)" }),
			"Updated agent",
		);
		await user.click(screen.getByRole("button", { name: "Save agent" }));
		await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
		expect(onSave).toHaveBeenCalledWith(
			expect.objectContaining({ description: existingDescription }),
		);
		expect(
			screen.getByRole("textbox", { name: "Name (required)" }),
		).toBeDisabled();
		expect(screen.getByRole("button", { name: /Saving…/ })).toBeDisabled();
		expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
		expect(screen.getByRole("button", { name: "Subagents" })).toBeEnabled();
		await user.click(screen.getByRole("button", { name: "Subagents" }));
		expect(
			screen.getByRole("checkbox", { name: "Research helper" }),
		).toBeDisabled();
		await user.click(screen.getByRole("button", { name: "Capabilities" }));
		expect(
			screen.getByRole("button", { name: "Add knowledge" }),
		).toBeDisabled();
		expect(
			screen.getByRole("button", { name: "Add toolboxes" }),
		).toBeDisabled();
		expect(
			screen.getByRole("button", { name: "Add skills" }),
		).toBeDisabled();
		await user.click(screen.getByRole("button", { name: "Profile" }));
		await act(async () => rejectSave(new Error("Settings failed")));
		expect(await screen.findByRole("alert")).toHaveTextContent(
			"Settings failed",
		);
		expect(
			screen.getByRole("textbox", { name: "Name (required)" }),
		).toHaveValue("Updated agent");
		expect(onClose).not.toHaveBeenCalled();
		await user.click(screen.getByRole("button", { name: "Save agent" }));
		await waitFor(() => expect(onSave).toHaveBeenCalledTimes(2));
		await waitFor(() =>
			expect(screen.queryByRole("alert")).not.toBeInTheDocument(),
		);
	});

	it("keeps distinct skill ids when display names match", async () => {
		const user = userEvent.setup();
		const onSave = vi.fn().mockResolvedValue(undefined);
		render(
			<AgentSettings
				agent={agent}
				agents={[]}
				skillOptions={[
					{ name: "Analysis", value: "skill-1", detail: "skill-1" },
					{ name: "Analysis", value: "skill-2", detail: "skill-2" },
				]}
				onSave={onSave}
				onClose={vi.fn()}
			/>,
		);
		await user.click(screen.getByRole("button", { name: "Capabilities" }));
		await user.click(screen.getByRole("button", { name: "Add skills" }));
		await user.click(
			screen.getByRole("checkbox", { name: "Analysis skill-2" }),
		);
		await user.click(screen.getByRole("button", { name: "Done" }));
		await user.click(screen.getByRole("button", { name: "Save agent" }));
		await waitFor(() =>
			expect(onSave).toHaveBeenCalledWith(
				expect.objectContaining({
					skills: [{ id: "skill-2", name: "Analysis" }],
				}),
			),
		);
	});

	it("loads, selects, and removes knowledge and toolboxes independently", async () => {
		const user = userEvent.setup();
		const onSave = vi.fn().mockResolvedValue(undefined);
		render(
			<AgentSettings
				agent={{
					...agent,
					mcp: [
						{
							type: "VECTOR",
							id: "old-vector",
							name: "Previously attached knowledge",
						},
						{
							type: "PROJECT",
							id: "project-1",
							name: "Research toolbox",
						},
					],
				}}
				agents={[]}
				skillOptions={[]}
				onSave={onSave}
				onClose={vi.fn()}
			/>,
		);
		await user.click(screen.getByRole("button", { name: "Capabilities" }));
		expect(
			screen.getByRole("heading", { name: "Knowledge" }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("heading", { name: "Toolboxes" }),
		).toBeInTheDocument();
		expect(
			screen.queryByRole("heading", { name: "Databases" }),
		).not.toBeInTheDocument();
		expect(screen.getByText("Research toolbox")).toBeInTheDocument();
		expect(
			screen.queryByRole("textbox", { name: "Search knowledge" }),
		).not.toBeInTheDocument();
		await user.click(
			screen.getByRole("button", {
				name: "Remove Previously attached knowledge",
			}),
		);
		expect(
			screen.getByRole("button", { name: "Add knowledge" }),
		).toHaveFocus();
		await user.click(screen.getByRole("button", { name: "Add knowledge" }));
		expect(
			screen.getByRole("textbox", { name: "Search knowledge" }),
		).toHaveFocus();
		const knowledge = screen.getByRole("checkbox", {
			name: "Research knowledge",
		});
		knowledge.focus();
		await user.keyboard(" ");
		expect(knowledge).toBeChecked();
		await user.keyboard("{Escape}");
		expect(
			screen.getByRole("button", { name: "Add knowledge" }),
		).toHaveFocus();
		await user.click(screen.getByRole("button", { name: "Add toolboxes" }));
		expect(
			screen.getByRole("checkbox", { name: "Research toolbox" }),
		).toBeChecked();
		await user.click(
			screen.getByRole("checkbox", { name: "Search tools" }),
		);
		await user.click(screen.getByRole("button", { name: "Done" }));
		await user.click(
			screen.getByRole("button", { name: "Remove Research toolbox" }),
		);
		await user.click(screen.getByRole("button", { name: "Profile" }));
		await user.click(screen.getByRole("button", { name: "Capabilities" }));
		expect(screen.getByText("Research knowledge")).toBeInTheDocument();
		expect(screen.getByText("Search tools")).toBeInTheDocument();
		expect(screen.queryByText("Research toolbox")).not.toBeInTheDocument();
		await user.click(screen.getByRole("button", { name: "Save agent" }));
		await waitFor(() =>
			expect(onSave).toHaveBeenCalledWith(
				expect.objectContaining({
					mcp: [
						{
							type: "VECTOR",
							id: "vector-1",
							name: "Research knowledge",
						},
						{
							type: "FUNCTION",
							id: "function-1",
							name: "Search tools",
						},
					],
				}),
			),
		);
	});

	it("filters a large skill list without losing selections and clears an empty search", async () => {
		const user = userEvent.setup();
		const onSave = vi.fn().mockResolvedValue(undefined);
		render(
			<AgentSettings
				agent={agent}
				agents={[]}
				skillOptions={[
					{ name: "agent-run", value: "run", detail: "" },
					{ name: "app-bootstrap", value: "bootstrap", detail: "" },
				]}
				onSave={onSave}
				onClose={vi.fn()}
			/>,
		);
		await user.click(screen.getByRole("button", { name: "Capabilities" }));
		await user.click(screen.getByRole("button", { name: "Add skills" }));
		await user.click(screen.getByRole("checkbox", { name: "agent-run" }));
		const search = screen.getByRole("textbox", { name: "Search skills" });
		await user.type(search, "bootstrap");
		expect(
			screen.queryByRole("checkbox", { name: "agent-run" }),
		).not.toBeInTheDocument();
		await user.click(
			screen.getByRole("checkbox", { name: "app-bootstrap" }),
		);
		await user.clear(search);
		await user.type(search, "no matching skills");
		expect(
			screen.getByText("No matches for “no matching skills”."),
		).toBeInTheDocument();
		await user.click(screen.getByRole("button", { name: "Clear search" }));
		expect(search).toHaveFocus();
		expect(
			screen.getByRole("checkbox", { name: "agent-run" }),
		).toBeChecked();
		expect(
			screen.getByRole("checkbox", { name: "app-bootstrap" }),
		).toBeChecked();
		await user.click(screen.getByRole("button", { name: "Done" }));
		await user.click(screen.getByRole("button", { name: "Save agent" }));
		await waitFor(() =>
			expect(onSave).toHaveBeenCalledWith(
				expect.objectContaining({
					skills: [
						{ id: "run", name: "agent-run" },
						{ id: "bootstrap", name: "app-bootstrap" },
					],
				}),
			),
		);
	});

	it("keeps existing attachments when the catalog fails and offers a retry", async () => {
		const user = userEvent.setup();
		catalogState.error = new Error("Catalog unavailable");
		render(
			<AgentSettings
				agent={{
					...agent,
					mcp: [
						{
							id: "old-vector",
							name: "Existing knowledge",
							type: "VECTOR",
						},
					],
				}}
				agents={[]}
				skillOptions={[]}
				onSave={vi.fn()}
				onClose={vi.fn()}
			/>,
		);
		await user.click(screen.getByRole("button", { name: "Capabilities" }));
		await user.click(screen.getByRole("button", { name: "Add knowledge" }));
		expect(screen.getByRole("alert")).toHaveTextContent(
			"Could not load the catalog",
		);
		await user.click(screen.getByRole("button", { name: "Try again" }));
		expect(catalogState.reset).toHaveBeenCalledTimes(1);
		await user.keyboard("{Escape}");
		expect(screen.getByText("Existing knowledge")).toBeInTheDocument();
	});

	it("shows catalog loading and allows dismissal without changing the draft", async () => {
		const user = userEvent.setup();
		catalogState.isLoading = true;
		render(
			<AgentSettings
				agent={agent}
				agents={[]}
				skillOptions={[]}
				onSave={vi.fn()}
				onClose={vi.fn()}
			/>,
		);
		await user.click(screen.getByRole("button", { name: "Capabilities" }));
		await user.click(screen.getByRole("button", { name: "Add knowledge" }));
		expect(screen.getByText("Loading…")).toBeInTheDocument();
		expect(
			screen.queryByText("No knowledge sources are available."),
		).not.toBeInTheDocument();
		await user.keyboard("{Escape}");
		expect(
			screen.getByRole("button", { name: "Add knowledge" }),
		).toHaveFocus();
		expect(screen.queryByText("Unsaved changes")).not.toBeInTheDocument();
	});

	it("rejects names the creation reactor cannot accept before calling save", async () => {
		const user = userEvent.setup();
		const onSave = vi.fn();
		render(
			<AgentSettings
				agent={{ ...agent, name: "123 Invalid" }}
				agents={[]}
				skillOptions={[]}
				onSave={onSave}
				onClose={vi.fn()}
			/>,
		);
		await user.click(screen.getByRole("button", { name: "Save agent" }));
		await waitFor(() =>
			expect(
				screen
					.getAllByRole("alert")
					.some((alert) =>
						alert.textContent?.includes(
							"Start the name with a letter",
						),
					),
			).toBe(true),
		);
		expect(onSave).not.toHaveBeenCalled();
	});

	it("shows subagent display names and saves the selected agent ID", async () => {
		const user = userEvent.setup();
		const onSave = vi.fn().mockResolvedValue(undefined);
		const agents = projectListSchema
			.parse([
				{
					project_id: "research-helper",
					project_name: "platform",
					project_display_name: " Research helper ",
				},
				{
					project_id: "writing-helper",
					project_name: "platform",
					project_display_name: "Writing helper",
				},
				{
					project_id: "unnamed-helper",
					project_name: "platform",
					project_display_name: " ",
				},
			])
			.map(agentFromProjectRow);
		render(
			<AgentSettings
				agent={agent}
				agents={agents}
				skillOptions={[]}
				onSave={onSave}
				onClose={vi.fn()}
			/>,
		);
		await user.click(screen.getByRole("button", { name: "Subagents" }));
		expect(screen.queryByText("platform")).not.toBeInTheDocument();
		expect(
			screen.getByRole("checkbox", { name: "Writing helper" }),
		).not.toBeChecked();
		expect(
			screen.getByRole("checkbox", { name: "unnamed-helper" }),
		).not.toBeChecked();
		await user.click(
			screen.getByRole("checkbox", { name: "Research helper" }),
		);
		expect(
			screen.getByRole("button", { name: "Subagents 1" }),
		).toHaveAttribute("aria-current", "page");
		await user.click(screen.getByRole("button", { name: "Save agent" }));
		await waitFor(() =>
			expect(onSave).toHaveBeenCalledWith(
				expect.objectContaining({ members: ["research-helper"] }),
			),
		);
	});

	it("shows only supported settings and keeps subagents optional", async () => {
		const user = userEvent.setup();
		const onSave = vi.fn().mockResolvedValue(undefined);
		render(
			<AgentSettings
				agent={agent}
				agents={[]}
				skillOptions={[]}
				onSave={onSave}
				onClose={vi.fn()}
			/>,
		);

		expect(
			screen.queryByRole("button", { name: "Starts work when" }),
		).not.toBeInTheDocument();
		await user.click(screen.getByRole("button", { name: "Subagents" }));
		expect(screen.queryByText("Delegation limits")).not.toBeInTheDocument();
		expect(screen.queryByRole("spinbutton")).not.toBeInTheDocument();
		expect(screen.queryByRole("switch")).not.toBeInTheDocument();

		await user.click(screen.getByRole("button", { name: "Save agent" }));
		await waitFor(() =>
			expect(onSave).toHaveBeenCalledWith(
				expect.objectContaining({ members: [] }),
			),
		);
		const saved = onSave.mock.calls[0][0];
		expect(saved).not.toHaveProperty("type");
		expect(saved).not.toHaveProperty("depth");
		expect(saved).not.toHaveProperty("spawn");
		expect(saved).not.toHaveProperty("concurrency");
		expect(saved).not.toHaveProperty("triggers");
	});
});
