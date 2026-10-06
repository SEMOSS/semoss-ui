import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Settings2 } from "lucide-react";
import type { ComponentProps } from "react";
import type { ThreadSession } from "@/features/thread-assistant/thread-session";
import type { ThreadAgentSelect } from "@/features/work-thread/thread-agent-select";
import { workSnapshot } from "@/features/work-thread/work-thread.test-fixtures";
import { WorkThreadContext } from "@/features/work-thread/work-thread-context";
import { DailyChatControls } from "./daily-chat-controls";

const openChatSettings = vi.fn();
const openAdvanced = vi.fn();
vi.mock("@/features/work-thread/use-work-panel-actions", () => ({
	useWorkPanelActions: () => [
		{
			id: "settings",
			icon: Settings2,
			label: "Open Settings",
			onSelect: openChatSettings,
		},
		{
			id: "compact",
			icon: Settings2,
			label: "Conversation usage",
			onSelect: openAdvanced,
		},
	],
}));
vi.mock("@/features/work-thread/thread-agent-select", () => ({
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
			<option value="research">Research assistant</option>
		</select>
	),
}));

beforeEach(() => vi.clearAllMocks());

function setup(saveSettings = vi.fn().mockResolvedValue(undefined)) {
	const snapshot = workSnapshot();
	snapshot.settings.instructions = "Keep my instructions";
	const setSettingsSection = vi.fn();
	const session = {
		saveSettings,
		getSnapshot: () => snapshot,
	} as unknown as ThreadSession;
	const controls = () => (
		<WorkThreadContext.Provider
			value={{
				session,
				snapshot,
				title: "New conversation",
				conversationKind: "chat",
				setSettingsSection,
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
			<DailyChatControls />
		</WorkThreadContext.Provider>
	);
	return {
		...render(controls()),
		controls,
		snapshot,
		session,
		saveSettings,
		setSettingsSection,
	};
}

it("saves agent selection with current settings and supports clearing", async () => {
	const { snapshot, saveSettings, rerender, controls } = setup();
	await userEvent.selectOptions(
		screen.getByRole("combobox", { name: "Agent" }),
		"research",
	);
	await waitFor(() =>
		expect(saveSettings).toHaveBeenCalledWith("New conversation", {
			...snapshot.settings,
			agentId: "research",
		}),
	);
	snapshot.settings = { ...snapshot.settings, agentId: "research" };
	rerender(controls());
	await userEvent.selectOptions(
		screen.getByRole("combobox", { name: "Agent" }),
		"",
	);
	await waitFor(() =>
		expect(saveSettings).toHaveBeenLastCalledWith("New conversation", {
			...snapshot.settings,
			agentId: "",
		}),
	);
});

it("preserves the selected agent on failure and retries the failed selection", async () => {
	const saveSettings = vi
		.fn()
		.mockRejectedValueOnce(new Error("This agent is unavailable"))
		.mockResolvedValueOnce(undefined);
	setup(saveSettings);
	await userEvent.selectOptions(
		screen.getByRole("combobox", { name: "Agent" }),
		"research",
	);
	expect(await screen.findByRole("alert")).toHaveTextContent(
		"This agent is unavailable",
	);
	expect(screen.getByRole("combobox", { name: "Agent" })).toHaveValue("");
	await userEvent.click(screen.getByRole("button", { name: "Retry agent" }));
	await waitFor(() => expect(saveSettings).toHaveBeenCalledTimes(2));
	expect(saveSettings.mock.calls[1]?.[1]).toMatchObject({
		agentId: "research",
		instructions: "Keep my instructions",
	});
	await waitFor(() => expect(screen.queryByRole("alert")).toBeNull());
});

it("disables selection during a pending save without hiding Settings", async () => {
	let finish: (() => void) | undefined;
	const saveSettings = vi.fn(
		() =>
			new Promise<void>((resolve) => {
				finish = resolve;
			}),
	);
	setup(saveSettings);
	await userEvent.selectOptions(
		screen.getByRole("combobox", { name: "Agent" }),
		"research",
	);
	expect(screen.getByRole("combobox", { name: "Agent" })).toBeDisabled();
	expect(
		screen.getByRole("status", { name: "Changing agent" }),
	).toBeVisible();
	expect(screen.getByRole("button", { name: "Settings" })).toBeEnabled();
	await act(async () => finish?.());
	await waitFor(() =>
		expect(screen.getByRole("combobox", { name: "Agent" })).toBeEnabled(),
	);
});

it("opens the requested settings section and supports keyboard dismissal", async () => {
	const { setSettingsSection } = setup();
	const trigger = screen.getByRole("button", { name: "Settings" });
	trigger.focus();
	await userEvent.keyboard("{Enter}");
	expect(
		screen.getByRole("menuitem", { name: "Chat settings" }),
	).toHaveFocus();
	await userEvent.keyboard("{Escape}");
	await waitFor(() => expect(trigger).toHaveFocus());
	await userEvent.click(trigger);
	await userEvent.click(screen.getByRole("menuitem", { name: "Advanced" }));
	expect(setSettingsSection).toHaveBeenLastCalledWith("advanced");
	expect(openAdvanced).toHaveBeenCalledOnce();
	await userEvent.click(trigger);
	await userEvent.click(
		screen.getByRole("menuitem", { name: "Chat settings" }),
	);
	expect(setSettingsSection).toHaveBeenLastCalledWith("chat");
	expect(openChatSettings).toHaveBeenCalledOnce();
});
