import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { App, Engine } from "@semoss/shared";
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

const agent: Agent = {
	id: "draft-1",
	name: "Research agent",
	role: "",
	type: "Individual",
	icon: "compass",
	tone: "green",
	workspace: "Conversation",
	instructions: "Research carefully",
	skills: [],
	skillIds: [],
	databases: [],
	dataProducts: [],
	members: [],
	depth: 0,
	concurrency: 2,
	spawn: false,
	triggers: [],
};

describe("AgentSettings submission", () => {
	beforeEach(() => {
		catalogState.error = null;
		catalogState.isLoading = false;
		catalogState.hasMore = false;
		catalogState.next.mockClear();
		catalogState.reset.mockClear();
	});
	beforeAll(() => {
		vi.stubGlobal("matchMedia", (media: string) => ({
			media,
			matches: false,
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
		}));
	});

	afterAll(() => vi.unstubAllGlobals());

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
				agent={{ ...agent, role: existingDescription }}
				agents={[]}
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
			expect.objectContaining({ role: existingDescription }),
		);
		expect(
			screen.getByRole("textbox", { name: "Name (required)" }),
		).toBeDisabled();
		expect(screen.getByRole("button", { name: /Saving…/ })).toBeDisabled();
		expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
		expect(screen.getByRole("button", { name: "Team" })).toBeEnabled();
		await user.click(screen.getByRole("button", { name: "Team" }));
		expect(
			screen.getByRole("spinbutton", { name: "Maximum spawn level" }),
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
					skillIds: ["skill-2"],
					skills: ["Analysis"],
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
				expect.objectContaining({ skillIds: ["run", "bootstrap"] }),
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

	it.each(["Individual", "Team"] as const)(
		"allows optional team settings for an agent previously marked %s",
		async (type) => {
			const user = userEvent.setup();
			const onSave = vi.fn().mockResolvedValue(undefined);
			render(
				<AgentSettings
					agent={{ ...agent, type, concurrency: 10 }}
					agents={[]}
					skillOptions={[]}
					onSave={onSave}
					onClose={vi.fn()}
				/>,
			);
			await user.click(screen.getByRole("button", { name: "Team" }));
			const depth = screen.getByRole("spinbutton", {
				name: "Maximum spawn level",
			});
			await user.clear(depth);
			await user.type(depth, "4");
			const nesting = screen.getByRole("switch", {
				name: /Allow helpers to spawn subagents/,
			});
			expect(nesting).toBeChecked();
			await user.click(nesting);
			expect(depth).toHaveValue(1);
			await user.click(
				screen.getByRole("button", { name: "Save agent" }),
			);
			await waitFor(() =>
				expect(onSave).toHaveBeenCalledWith(
					expect.objectContaining({
						type: "Individual",
						members: [],
						depth: 1,
						spawn: false,
						concurrency: 10,
					}),
				),
			);
		},
	);
});
