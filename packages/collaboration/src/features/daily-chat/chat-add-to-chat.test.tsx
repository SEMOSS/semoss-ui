import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { type ComponentProps, createRef } from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogTitle,
	TooltipProvider,
} from "@semoss/ui/next";
import type { ThreadSession } from "@/features/thread-assistant/thread-session";
import { workSnapshot } from "@/features/work-thread/work-thread.test-fixtures";
import { WorkThreadContext } from "@/features/work-thread/work-thread-context";
import { ChatAddToChat } from "./chat-add-to-chat";
import type { ChatSettingsDrawer } from "./chat-settings-drawer";

vi.mock("@/features/agents/api/use-agent-directory", () => ({
	useAgentDirectory: () => ({
		agents: [{ id: "research", name: "Research assistant" }],
		error: null,
		hasMore: false,
		isLoading: false,
		isRefreshing: false,
		next: vi.fn(),
		reset: vi.fn(),
	}),
}));

vi.mock("./chat-settings-drawer", () => ({
	ChatSettingsDrawer: ({
		open,
		onOpenChange,
		returnFocusRef,
	}: ComponentProps<typeof ChatSettingsDrawer>) => (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				onCloseAutoFocus={(event) => {
					event.preventDefault();
					returnFocusRef?.current?.focus();
				}}
			>
				<DialogTitle>Chat settings</DialogTitle>
				<DialogDescription>Adjust this conversation.</DialogDescription>
				<button type="button" onClick={() => onOpenChange(false)}>
					Close settings
				</button>
			</DialogContent>
		</Dialog>
	),
}));

function setup(saveSettings = vi.fn().mockResolvedValue(undefined)) {
	const snapshot = workSnapshot();
	snapshot.settings.instructions = "Keep my instructions";
	const session = {
		saveSettings,
		getSnapshot: () => snapshot,
	} as unknown as ThreadSession;
	const triggerRef = createRef<HTMLButtonElement>();
	const onAttachFiles = vi.fn();
	const controls = (disabled = false) => (
		<TooltipProvider>
			<WorkThreadContext.Provider
				value={{
					session,
					snapshot,
					title: "New conversation",
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
				<ChatAddToChat
					triggerRef={triggerRef}
					triggerId="chat-actions"
					onAttachFiles={onAttachFiles}
					disabled={disabled}
				/>
			</WorkThreadContext.Provider>
		</TooltipProvider>
	);
	return {
		...render(controls()),
		controls,
		snapshot,
		saveSettings,
		onAttachFiles,
		triggerRef,
	};
}

async function openActions() {
	const trigger = screen.getByRole("button", { name: "Add to chat" });
	await userEvent.click(trigger);
	return trigger;
}

async function selectResearchAgent() {
	await userEvent.click(
		screen.getByRole("menuitem", { name: "Select agent: Assistant" }),
	);
	await userEvent.click(
		screen.getByRole("option", { name: "Research assistant" }),
	);
}

it("shows only the three chat actions and connects Attach files to the upload picker", async () => {
	const { onAttachFiles, triggerRef } = setup();
	const trigger = screen.getByRole("button", { name: "Add to chat" });
	act(() => trigger.focus());
	await userEvent.keyboard("{ArrowDown}");
	expect(triggerRef.current).toBe(trigger);
	const menu = screen.getByRole("menu", { name: "Add to chat" });
	expect(
		within(menu)
			.getAllByRole("menuitem")
			.map((button) => button.textContent),
	).toEqual(["Attach files", "Select agent", "Settings"]);
	expect(
		within(menu).getByRole("menuitem", {
			name: "Select agent: Assistant",
		}),
	).toBeVisible();
	expect(
		screen.getByRole("menuitem", { name: "Attach files" }),
	).toHaveFocus();
	await userEvent.keyboard("{ArrowDown}");
	expect(
		screen.getByRole("menuitem", { name: "Select agent: Assistant" }),
	).toHaveFocus();
	await userEvent.keyboard("{ArrowDown}");
	expect(screen.getByRole("menuitem", { name: "Settings" })).toHaveFocus();
	await userEvent.keyboard("{Home}{Enter}");
	expect(onAttachFiles).toHaveBeenCalledOnce();
	expect(screen.queryByRole("menu", { name: "Add to chat" })).toBeNull();
	await waitFor(() => expect(trigger).toHaveFocus());
});

it("selects and clears an agent with the current settings and retains keyboard focus", async () => {
	const { snapshot, saveSettings, rerender, controls } = setup();
	await openActions();
	const agentTrigger = screen.getByRole("menuitem", {
		name: "Select agent: Assistant",
	});
	act(() => agentTrigger.focus());
	await userEvent.keyboard("{Enter}");
	expect(
		screen.getByRole("combobox", { name: "Search agents" }),
	).toHaveFocus();
	await userEvent.keyboard("research");
	expect(screen.getByRole("combobox", { name: "Search agents" })).toHaveValue(
		"research",
	);
	expect(
		screen.getByRole("combobox", { name: "Search agents" }),
	).toHaveFocus();
	await userEvent.keyboard("{ArrowDown}{Enter}");
	await waitFor(() =>
		expect(saveSettings).toHaveBeenCalledWith("New conversation", {
			...snapshot.settings,
			agentId: "research",
		}),
	);
	await waitFor(() => expect(agentTrigger).toHaveFocus());
	snapshot.settings = { ...snapshot.settings, agentId: "research" };
	rerender(controls());
	await userEvent.click(agentTrigger);
	await userEvent.click(screen.getByRole("option", { name: "Assistant" }));
	await waitFor(() =>
		expect(saveSettings).toHaveBeenLastCalledWith("New conversation", {
			...snapshot.settings,
			agentId: "",
		}),
	);
	await userEvent.keyboard("{Escape}");
	await waitFor(() =>
		expect(
			screen.getByRole("button", { name: "Add to chat" }),
		).toHaveFocus(),
	);
});

it("keeps a failed selection available for retry after closing and reopening actions", async () => {
	const saveSettings = vi
		.fn()
		.mockRejectedValueOnce(new Error("Agent is unavailable"))
		.mockResolvedValueOnce(undefined);
	setup(saveSettings);
	await openActions();
	await selectResearchAgent();
	expect(await screen.findByRole("alert")).toHaveTextContent(
		"Agent is unavailable",
	);
	await userEvent.keyboard("{Escape}");
	await openActions();
	expect(screen.getByRole("alert")).toHaveTextContent("Agent is unavailable");
	await userEvent.click(
		screen.getByRole("menuitem", { name: "Retry agent" }),
	);
	await waitFor(() => expect(saveSettings).toHaveBeenCalledTimes(2));
	expect(saveSettings.mock.calls[1]?.[1]).toMatchObject({
		agentId: "research",
		instructions: "Keep my instructions",
	});
	await waitFor(() => expect(screen.queryByRole("alert")).toBeNull());
});

it("prevents another selection or settings save while the selected agent is saving", async () => {
	let finish: (() => void) | undefined;
	setup(
		vi.fn(
			() =>
				new Promise<void>((resolve) => {
					finish = resolve;
				}),
		),
	);
	await openActions();
	await selectResearchAgent();
	expect(
		screen.getByRole("menuitem", { name: "Select agent: Assistant" }),
	).toHaveAttribute("aria-disabled", "true");
	expect(screen.getByRole("menuitem", { name: "Settings" })).toHaveAttribute(
		"aria-disabled",
		"true",
	);
	expect(
		screen.getByRole("status", { name: "Changing agent" }),
	).toBeVisible();
	await act(async () => finish?.());
	await waitFor(() =>
		expect(
			screen.getByRole("menuitem", { name: "Select agent: Assistant" }),
		).not.toHaveAttribute("aria-disabled", "true"),
	);
});

it("opens settings after dismissing actions and returns focus to the plus trigger", async () => {
	setup();
	const trigger = await openActions();
	await userEvent.click(screen.getByRole("menuitem", { name: "Settings" }));
	expect(screen.queryByRole("menu", { name: "Add to chat" })).toBeNull();
	expect(screen.getByRole("dialog", { name: "Chat settings" })).toBeVisible();
	await userEvent.keyboard("{Escape}");
	await waitFor(() => expect(trigger).toHaveFocus());
});

it("closes actions when submission disables the composer and prevents reopening", async () => {
	const { rerender, controls } = setup();
	await openActions();
	rerender(controls(true));
	expect(screen.queryByRole("menu", { name: "Add to chat" })).toBeNull();
	expect(screen.getByRole("button", { name: "Add to chat" })).toBeDisabled();
	rerender(controls());
	expect(screen.queryByRole("menu", { name: "Add to chat" })).toBeNull();
});
