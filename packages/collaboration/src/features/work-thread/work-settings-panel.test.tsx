import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
import type { ThreadSession } from "@/features/thread-assistant/thread-session";
import type { ThreadAgentSelect } from "./thread-agent-select";
import { WorkSettingsPanel } from "./work-settings-panel";
import { workSnapshot } from "./work-thread.test-fixtures";
import { WorkThreadContext } from "./work-thread-context";

vi.mock("@/features/agents/api/use-agent-detail", () => ({
	useAgentDetail: (id: string) => ({
		agent: id
			? {
					name: id,
					mcp: [],
					skills: [{ id: "writing", name: "Writing skill" }],
				}
			: null,
		isLoading: false,
		error: null,
	}),
}));
vi.mock("@/features/rooms/api/use-room-model", () => ({
	useRoomModel: () => ({ engine: null, error: null }),
}));
vi.mock("./thread-agent-select", () => ({
	ThreadAgentSelect: ({
		value,
		disabled,
		onChange,
	}: ComponentProps<typeof ThreadAgentSelect>) => (
		<select
			aria-label="Agent"
			value={value}
			disabled={disabled}
			onChange={(event) => onChange(event.target.value)}
		>
			<option value="">Assistant</option>
			<option value="draft">Draft agent</option>
			<option value="external">External agent</option>
		</select>
	),
}));
vi.mock("@/features/agents/components/capability-picker", () => ({
	CapabilityPicker: () => null,
}));
vi.mock("@semoss/shared", async (original) => ({
	...(await original<typeof import("@semoss/shared")>()),
	EngineSelect: () => <button type="button">Model</button>,
}));
it("keeps unsaved settings on failure and across hidden panel changes, then retries and resets", async () => {
	const snapshot = workSnapshot();
	const saveSettings = vi
		.fn()
		.mockRejectedValueOnce(new Error("Save unavailable"))
		.mockImplementationOnce(async (_title, values) => {
			snapshot.settings = values;
		});
	const session = {
		saveSettings,
		getSnapshot: () => snapshot,
	} as unknown as ThreadSession;
	const panel = (hidden: boolean) => (
		<WorkThreadContext.Provider
			value={{
				session,
				snapshot,
				title: "Thread",
				contextPanel: {
					context: {
						threadId: "thread",
						contextRevision: "1",
						contextText: "{}",
					},
					submitted: null,
					children: null,
				},
			}}
		>
			<div hidden={hidden}>
				<WorkSettingsPanel />
			</div>
		</WorkThreadContext.Provider>
	);
	const { rerender } = render(panel(false));
	const input = screen.getByRole("textbox", {
		name: "Additional conversation instructions",
	});
	fireEvent.change(input, { target: { value: "Use short replies" } });
	fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
	expect(await screen.findByRole("alert")).toHaveTextContent(
		"Save unavailable",
	);
	expect(input).toHaveValue("Use short replies");
	rerender(panel(true));
	rerender(panel(false));
	expect(input).toHaveValue("Use short replies");
	fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
	await waitFor(() => expect(saveSettings).toHaveBeenCalledTimes(2));
	await waitFor(() => expect(screen.queryByRole("alert")).toBeNull());
	fireEvent.change(input, { target: { value: "Discard this edit" } });
	fireEvent.click(screen.getByRole("button", { name: "Reset" }));
	expect(input).toHaveValue("Use short replies");
});

it("shows Chat and Advanced only for source-free conversations", async () => {
	const snapshot = workSnapshot();
	const session = { getSnapshot: () => snapshot } as unknown as ThreadSession;
	const panel = (conversationKind: "chat" | "source-thread") => (
		<WorkThreadContext.Provider
			value={{
				session,
				snapshot,
				title: "Conversation",
				conversationKind,
				contextPanel: {
					context: {
						threadId: "session:new",
						contextRevision: "1",
						contextText: "{}",
					},
					submitted: null,
					children: null,
				},
			}}
		>
			<WorkSettingsPanel />
		</WorkThreadContext.Provider>
	);
	const { rerender } = render(panel("chat"));
	expect(screen.getAllByRole("tab").map((tab) => tab.textContent)).toEqual([
		"Chat",
		"Advanced",
	]);
	await userEvent.click(screen.getByRole("tab", { name: "Advanced" }));
	expect(screen.getByRole("heading", { name: "Advanced" })).toBeVisible();
	rerender(panel("source-thread"));
	expect(screen.getByRole("tab", { name: "Thread" })).toBeVisible();
});

it("synchronizes a committed toolbar agent while preserving other unsaved fields", async () => {
	const snapshot = workSnapshot();
	const saveSettings = vi.fn().mockImplementation(async (_title, values) => {
		snapshot.settings = values;
	});
	const session = {
		saveSettings,
		getSnapshot: () => snapshot,
	} as unknown as ThreadSession;
	const panel = () => (
		<WorkThreadContext.Provider
			value={{
				session,
				snapshot,
				title: "Conversation",
				conversationKind: "chat",
				contextPanel: {
					context: {
						threadId: "session:new",
						contextRevision: "1",
						contextText: "{}",
					},
					submitted: null,
					children: null,
				},
			}}
		>
			<WorkSettingsPanel />
		</WorkThreadContext.Provider>
	);
	const { rerender } = render(panel());
	await userEvent.selectOptions(
		screen.getByRole("combobox", { name: "Agent" }),
		"draft",
	);
	const instructions = screen.getByRole("textbox", {
		name: "Additional conversation instructions",
	});
	fireEvent.change(instructions, { target: { value: "Keep my draft" } });
	fireEvent.change(screen.getByRole("spinbutton", { name: "Temperature" }), {
		target: { value: "0.4" },
	});
	snapshot.settings = { ...snapshot.settings, agentId: "external" };
	rerender(panel());
	await waitFor(() =>
		expect(screen.getByRole("combobox", { name: "Agent" })).toHaveValue(
			"external",
		),
	);
	expect(instructions).toHaveValue("Keep my draft");
	expect(screen.getByRole("spinbutton", { name: "Temperature" })).toHaveValue(
		0.4,
	);
	expect(screen.getByRole("region", { name: "Skills" })).toHaveTextContent(
		"Writing skill",
	);
	expect(
		screen.queryByRole("button", { name: "Remove Writing skill" }),
	).toBeNull();
	await userEvent.click(screen.getByRole("button", { name: "Save changes" }));
	await waitFor(() =>
		expect(saveSettings).toHaveBeenCalledWith(
			"Conversation",
			expect.objectContaining({
				agentId: "external",
				instructions: "Keep my draft",
				temperature: 0.4,
			}),
		),
	);

	await userEvent.selectOptions(
		screen.getByRole("combobox", { name: "Agent" }),
		"draft",
	);
	snapshot.settings = { ...snapshot.settings, temperature: 0.7 };
	rerender(panel());
	expect(screen.getByRole("combobox", { name: "Agent" })).toHaveValue(
		"draft",
	);
});
