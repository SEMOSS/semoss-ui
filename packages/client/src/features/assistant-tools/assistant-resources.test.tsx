import {
	act,
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
	within,
} from "@testing-library/react";
import type { ComponentProps } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { MCPSelector, SkillSelector } from "@semoss/shared";
import { createWorkbenchStore } from "@semoss/workbench";
import { AssistantSettings } from "@/components/assistant/assistant-settings";
import { AssistantStoreProvider } from "@/contexts/assistant.context";
import { createAssistantStore } from "@/stores/assistant/assistant.store";

const read = vi.hoisted(() => vi.fn());
vi.mock("@semoss/sdk/react", async (original) => ({
	...(await original<typeof import("@semoss/sdk/react")>()),
	usePixel: read,
}));
beforeEach(() => {
	vi.stubGlobal(
		"ResizeObserver",
		class {
			observe() {}
			unobserve() {}
			disconnect() {}
		},
	);
	read.mockReset().mockReturnValue({
		status: "SUCCESS",
		data: { mcp: [], skills: [] },
		refresh: vi.fn(),
	});
});

vi.mock("@semoss/shared", async (original) => ({
	...(await original<typeof import("@semoss/shared")>()),
	EngineSelect: () => null,
	ProjectSelect: () => null,
	MCPSelector: ({
		onChange,
		disabled,
	}: ComponentProps<typeof MCPSelector>) => (
		<button
			type="button"
			disabled={disabled}
			onClick={() =>
				onChange([{ id: "tools", name: "My tools", type: "PROJECT" }])
			}
		>
			Choose toolbox
		</button>
	),
	SkillSelector: ({
		onChange,
		disabled,
	}: ComponentProps<typeof SkillSelector>) => (
		<button
			type="button"
			disabled={disabled}
			onClick={() => onChange([{ id: "skill", name: "My skill" }])}
		>
			Choose skill
		</button>
	),
}));
afterEach(() => {
	cleanup();
	vi.unstubAllGlobals();
});

describe("assistant resource settings", () => {
	it("lists removable custom resources before read-only agent resources and follows agent changes", async () => {
		const store = createAssistantStore({
			workbenchId: "test",
			workbench: createWorkbenchStore({ components: {} }),
		});
		const save = vi.fn().mockResolvedValue(undefined);
		const saveSkills = vi.fn().mockResolvedValue(undefined);
		const customSkills = [{ skill_id: "skill", name: "Room skill" }];
		store.setState({
			insightId: "insight",
			roomId: "room",
			defaultAgent: { workspace_id: "default", name: "Default agent" },
			customMcp: [
				{ id: "custom", name: "Room toolbox", type: "PROJECT" },
			],
			customSkills,
			saveCustomMcp: save,
			saveCustomSkills: saveSkills,
		});
		read.mockImplementation((query: string) => ({
			status: "SUCCESS",
			data: query.includes('["default"]')
				? {
						mcp: [
							{
								id: "toolbox",
								name: "canonical",
								display_name: "Agent toolbox",
							},
						],
						skills: [{ id: "skill", name: "Agent skill" }],
					}
				: {
						skills: [
							{ id: "custom-skill", name: "Custom agent skill" },
						],
					},
			refresh: vi.fn(),
		}));
		render(
			<AssistantStoreProvider store={store}>
				<AssistantSettings />
			</AssistantStoreProvider>,
		);
		expect(screen.queryByText("Agent toolbox")).not.toBeInTheDocument();
		expect(screen.getByText("Room toolbox")).toBeInTheDocument();
		const toolVisibility = screen.getByRole("button", {
			name: "Hide agent tools",
		});
		expect(toolVisibility).toHaveAttribute("aria-pressed", "true");
		fireEvent.click(toolVisibility);
		const toolRows = within(
			screen.getByRole("list", { name: "Tools" }),
		).getAllByRole("listitem");
		expect(toolRows[0]).toHaveTextContent("Room toolbox");
		expect(toolRows[0]).not.toHaveTextContent("Custom");
		expect(toolRows[1]).toHaveTextContent("Agent toolbox");
		expect(toolRows[1]).not.toHaveTextContent("Provided by");
		const skillRows = within(
			screen.getByRole("list", { name: "Skills" }),
		).getAllByRole("listitem");
		expect(skillRows[0]).toHaveTextContent("Room skill");
		expect(skillRows[0]).not.toHaveTextContent("Custom");
		expect(skillRows[1]).toHaveTextContent("Agent skill");
		const toolSource = within(toolRows[1]).getByRole("button", {
			name: "Agent toolbox: provided by Default agent",
		});
		fireEvent.focus(toolSource);
		expect(await screen.findByRole("tooltip")).toHaveTextContent(
			"Provided by Default agent",
		);
		fireEvent.blur(toolSource);
		await waitFor(() =>
			expect(screen.queryByRole("tooltip")).not.toBeInTheDocument(),
		);
		const skillSource = within(skillRows[1]).getByRole("button", {
			name: "Agent skill: provided by Default agent",
		});
		fireEvent.focus(skillSource);
		expect(await screen.findByRole("tooltip")).toHaveTextContent(
			"Provided by Default agent",
		);
		fireEvent.blur(skillSource);
		await waitFor(() =>
			expect(screen.queryByRole("tooltip")).not.toBeInTheDocument(),
		);
		expect(
			screen.queryByRole("button", { name: "Remove Agent toolbox" }),
		).not.toBeInTheDocument();
		expect(
			screen.queryByRole("button", { name: "Remove Agent skill" }),
		).not.toBeInTheDocument();
		expect(read).toHaveBeenLastCalledWith(
			'GetWorkspace(workspaceId=["default"]);',
			{ data: null },
			"insight",
		);
		fireEvent.click(
			screen.getByRole("button", { name: "Remove Room toolbox" }),
		);
		await waitFor(() => expect(save).toHaveBeenCalledWith([]));
		fireEvent.click(
			screen.getByRole("button", { name: "Remove Room skill" }),
		);
		await waitFor(() => expect(saveSkills).toHaveBeenCalledWith([]));
		expect(store.getState().customSkills).toEqual(customSkills);
		act(() =>
			store.getState().setAgent({
				workspace_id: "custom-agent",
				name: "Custom agent",
			}),
		);
		expect(screen.queryByText("Agent toolbox")).not.toBeInTheDocument();
		expect(screen.queryByText("Agent skill")).not.toBeInTheDocument();
		expect(screen.getByText("Custom agent skill")).toBeInTheDocument();
		expect(
			screen.getByRole("button", {
				name: "Custom agent skill: provided by Custom agent",
			}),
		).toBeInTheDocument();
		act(() => store.getState().setAgent(null));
		expect(screen.getByText("Agent toolbox")).toBeInTheDocument();
		expect(
			screen.queryByText("Custom agent skill"),
		).not.toBeInTheDocument();
		store.getState().destroy();
	});
	it("shows loading and retryable agent errors without blocking room additions", () => {
		const store = createAssistantStore({
			workbenchId: "test",
			workbench: createWorkbenchStore({ components: {} }),
		});
		store.setState({ insightId: "insight", roomId: "room" });
		const refresh = vi.fn();
		read.mockReturnValue({ status: "LOADING", data: null, refresh });
		const view = render(
			<AssistantStoreProvider store={store}>
				<AssistantSettings />
			</AssistantStoreProvider>,
		);
		expect(screen.getByRole("status")).toHaveTextContent(
			"Loading agent tools and skills",
		);
		expect(
			screen.getByRole("button", { name: "Add skills" }),
		).toBeEnabled();
		read.mockReturnValue({
			status: "ERROR",
			data: null,
			error: new Error("Agent unavailable"),
			refresh,
		});
		view.rerender(
			<AssistantStoreProvider store={store}>
				<AssistantSettings />
			</AssistantStoreProvider>,
		);
		expect(screen.getByRole("alert")).toHaveTextContent(
			"Agent unavailable",
		);
		fireEvent.click(
			screen.getByRole("button", { name: "Retry agent resources" }),
		);
		expect(refresh).toHaveBeenCalledOnce();
		read.mockReturnValue({ status: "SUCCESS", data: {}, refresh });
		view.rerender(
			<AssistantStoreProvider store={store}>
				<AssistantSettings />
			</AssistantStoreProvider>,
		);
		expect(screen.queryByRole("alert")).not.toBeInTheDocument();
		expect(
			screen.queryByRole("list", { name: "Skills" }),
		).not.toBeInTheDocument();
		store.getState().destroy();
	});
	it("retains failed picker drafts, supports retry, and maps native skill references", async () => {
		const store = createAssistantStore({
			workbenchId: "test",
			workbench: createWorkbenchStore({ components: {} }),
		});
		const save = vi
			.fn()
			.mockRejectedValueOnce(new Error("Try again"))
			.mockResolvedValue(undefined);
		store.setState({ roomId: "room", saveCustomSkills: save });
		render(
			<AssistantStoreProvider store={store}>
				<AssistantSettings />
			</AssistantStoreProvider>,
		);
		fireEvent.click(screen.getByRole("button", { name: "Add skills" }));
		fireEvent.click(screen.getByRole("button", { name: "Choose skill" }));
		fireEvent.click(screen.getByRole("button", { name: "Save" }));
		await screen.findByText("Try again");
		expect(screen.getByRole("dialog")).toBeInTheDocument();
		fireEvent.click(screen.getByRole("button", { name: "Save" }));
		await waitFor(() =>
			expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
		);
		expect(save).toHaveBeenLastCalledWith([
			{ skill_id: "skill", name: "My skill" },
		]);
		expect(save).toHaveBeenCalledTimes(2);
		store.getState().destroy();
	});
	it("keeps tool and skill drafts and save errors separate in their pickers", async () => {
		const store = createAssistantStore({
			workbenchId: "test",
			workbench: createWorkbenchStore({ components: {} }),
		});
		const tool = { id: "saved-tool", name: "Saved tools", type: "PROJECT" };
		const skill = {
			skill_id: "saved-skill",
			name: "PDF",
			pinned_version: "v1",
		};
		const saveTools = vi
			.fn()
			.mockRejectedValueOnce(new Error("Tools unavailable"))
			.mockResolvedValue(undefined);
		const saveSkills = vi.fn().mockResolvedValue(undefined);
		store.setState({
			roomId: "room",
			customMcp: [tool],
			customSkills: [skill],
			saveCustomMcp: saveTools,
			saveCustomSkills: saveSkills,
		});
		render(
			<AssistantStoreProvider store={store}>
				<AssistantSettings />
			</AssistantStoreProvider>,
		);
		fireEvent.click(screen.getByRole("button", { name: "Add tools" }));
		fireEvent.click(screen.getByRole("button", { name: "Choose toolbox" }));
		fireEvent.click(screen.getByRole("button", { name: "Save" }));
		await screen.findByText("Tools unavailable");
		fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
		await waitFor(() =>
			expect(
				screen.getByRole("button", { name: "Add tools" }),
			).toHaveFocus(),
		);
		fireEvent.click(screen.getByRole("button", { name: "Add skills" }));
		expect(screen.queryByText("Tools unavailable")).not.toBeInTheDocument();
		fireEvent.click(screen.getByRole("button", { name: "Save" }));
		await waitFor(() =>
			expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
		);
		expect(saveSkills).toHaveBeenCalledWith([skill]);
		fireEvent.click(screen.getByRole("button", { name: "Add tools" }));
		fireEvent.click(screen.getByRole("button", { name: "Save" }));
		await waitFor(() =>
			expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
		);
		expect(saveTools).toHaveBeenLastCalledWith([tool]);
		store.getState().destroy();
	});
	it("removes additions immediately, keeps base tools separate, and disables edits during paused approvals", async () => {
		const store = createAssistantStore({
			workbenchId: "test",
			workbench: createWorkbenchStore({ components: {} }),
		});
		const save = vi.fn().mockResolvedValue(undefined);
		store.setState({
			roomId: "room",
			mcp: [{ id: "base", name: "Base tools", type: "PROJECT" }],
			customMcp: [
				{ id: "base", name: "Base tools", type: "PROJECT" },
				{ id: "tools", name: "My tools", type: "PROJECT" },
			],
			saveCustomMcp: save,
		});
		render(
			<AssistantStoreProvider store={store}>
				<AssistantSettings />
			</AssistantStoreProvider>,
		);
		expect(
			screen.queryByRole("button", { name: "Remove Base tools" }),
		).not.toBeInTheDocument();
		fireEvent.click(
			screen.getByRole("button", { name: "Remove My tools" }),
		);
		await waitFor(() => expect(save).toHaveBeenCalledWith([]));
		fireEvent.click(screen.getByRole("button", { name: "Add tools" }));
		fireEvent.click(screen.getByRole("button", { name: "Save" }));
		await waitFor(() =>
			expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
		);
		expect(save).toHaveBeenLastCalledWith([
			{ id: "tools", name: "My tools", type: "PROJECT" },
		]);
		act(() => store.setState({ activeRunId: "paused" }));
		expect(
			screen.getByRole("button", { name: "Add tools" }),
		).toBeDisabled();
		expect(
			screen.getByRole("button", { name: "Remove My tools" }),
		).toBeDisabled();
		expect(
			screen.getByRole("button", { name: "Add skills" }),
		).toBeDisabled();
		store.getState().destroy();
	});
	it.each(["tools", "skills"] as const)(
		"discards cancelled %s drafts, reads current selections on reopen, and closes on conversation switches",
		async (kind) => {
			const store = createAssistantStore({
				workbenchId: "test",
				workbench: createWorkbenchStore({ components: {} }),
			});
			const save = vi.fn().mockResolvedValue(undefined);
			store.setState({
				roomId: "room",
				saveCustomMcp: save,
				saveCustomSkills: save,
			});
			render(
				<AssistantStoreProvider store={store}>
					<AssistantSettings />
				</AssistantStoreProvider>,
			);
			fireEvent.click(
				screen.getByRole("button", { name: `Add ${kind}` }),
			);
			fireEvent.click(
				screen.getByRole("button", {
					name: kind === "tools" ? "Choose toolbox" : "Choose skill",
				}),
			);
			fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
			expect(save).not.toHaveBeenCalled();
			const latest = {
				id: "latest",
				name: "Latest tools",
				type: "PROJECT",
			};
			const latestSkill = {
				skill_id: "latest",
				name: "Latest skill",
				pinned_version: "v1",
			};
			act(() =>
				store.setState(
					kind === "tools"
						? { customMcp: [latest] }
						: { customSkills: [latestSkill] },
				),
			);
			fireEvent.click(
				screen.getByRole("button", { name: `Add ${kind}` }),
			);
			fireEvent.click(screen.getByRole("button", { name: "Save" }));
			await waitFor(() =>
				expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
			);
			expect(save).toHaveBeenCalledWith([
				kind === "tools" ? latest : latestSkill,
			]);
			fireEvent.click(
				screen.getByRole("button", { name: `Add ${kind}` }),
			);
			fireEvent.click(
				screen.getByRole("button", {
					name: kind === "tools" ? "Choose toolbox" : "Choose skill",
				}),
			);
			act(() => store.setState({ roomId: "other" }));
			expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
			store.getState().destroy();
		},
	);
});
