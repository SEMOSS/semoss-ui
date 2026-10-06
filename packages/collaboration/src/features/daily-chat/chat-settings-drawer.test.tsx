import {
	act,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
	type ComponentProps,
	useRef,
	useState,
	useSyncExternalStore,
} from "react";
import type { EngineSelect } from "@semoss/shared";
import { Button } from "@semoss/ui/next";
import type { ThreadSession } from "@/features/thread-assistant/thread-session";
import {
	useWorkComposerSession,
	WorkComposerStateProvider,
} from "@/features/work-thread/work-composer-state.context";
import { workSnapshot } from "@/features/work-thread/work-thread.test-fixtures";
import { WorkThreadContext } from "@/features/work-thread/work-thread-context";
import { ChatSettingsDrawer } from "./chat-settings-drawer";

vi.mock("@semoss/sdk/react", async (original) => ({
	...(await original<typeof import("@semoss/sdk/react")>()),
	useInsight: () => ({ insightId: "settings-test" }),
}));
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
vi.mock("@/features/agents/components/capability-picker", () => ({
	CapabilityPicker: () => null,
}));
vi.mock("@semoss/shared", async (original) => ({
	...(await original<typeof import("@semoss/shared")>()),
	EngineSelect: ({
		id,
		name,
		disabled,
		value,
	}: ComponentProps<typeof EngineSelect>) => (
		<button id={id} type="button" disabled={disabled} data-model-id={value}>
			{name}
		</button>
	),
}));

interface SettingsHarnessProps {
	snapshot: ReturnType<typeof workSnapshot>;
	session: ThreadSession;
}

function SettingsHarness({ snapshot, session }: SettingsHarnessProps) {
	const [isOpen, setIsOpen] = useState(false);
	const trigger = useRef<HTMLButtonElement>(null);
	const composer = useWorkComposerSession(session.threadId);
	const { revision } = useSyncExternalStore(
		composer.subscribe,
		composer.getSnapshot,
	);
	return (
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
						contextText: "Private context details",
					},
					submitted: null,
					children: null,
				},
			}}
		>
			<Button ref={trigger} onClick={() => setIsOpen(true)}>
				Open settings
			</Button>
			<Button onClick={() => void composer.submit(async () => undefined)}>
				Send message
			</Button>
			<ChatSettingsDrawer
				key={revision}
				open={isOpen}
				onOpenChange={setIsOpen}
				returnFocusRef={trigger}
			/>
		</WorkThreadContext.Provider>
	);
}

function setup() {
	const snapshot = workSnapshot();
	const saveSettings = vi.fn<ThreadSession["saveSettings"]>(
		async (_title, values) => {
			snapshot.settings = values;
		},
	);
	const session = {
		threadId: "session:new",
		saveSettings,
		getSnapshot: () => snapshot,
	} as unknown as ThreadSession;
	let mount = 0;
	const view = () => (
		<WorkComposerStateProvider>
			<SettingsHarness
				key={mount}
				snapshot={snapshot}
				session={session}
			/>
		</WorkComposerStateProvider>
	);
	const { rerender } = render(view());
	return {
		snapshot,
		saveSettings,
		user: userEvent.setup(),
		rerender: () => rerender(view()),
		remount: () => {
			mount += 1;
			rerender(view());
		},
	};
}

it("shows common settings first and keeps optional capabilities in Advanced", async () => {
	const { user } = setup();
	await user.click(screen.getByRole("button", { name: "Open settings" }));
	expect(
		screen.getByRole("dialog", { name: "Chat settings" }),
	).toHaveAccessibleDescription(
		"Choose how the assistant responds in this chat.",
	);
	expect(screen.getByLabelText("Model")).toBeVisible();
	expect(screen.getByRole("textbox", { name: "Instructions" })).toBeVisible();
	expect(screen.queryByRole("combobox", { name: "Agent" })).toBeNull();
	expect(
		screen.queryByRole("spinbutton", { name: "Temperature" }),
	).toBeNull();
	expect(screen.queryByRole("tab")).toBeNull();
	expect(screen.queryByText("Private context details")).toBeNull();
	const advanced = screen.getByRole("button", { name: "Advanced" });
	expect(advanced).toHaveAttribute("aria-expanded", "false");
	await user.click(advanced);
	expect(
		screen.getByRole("spinbutton", { name: "Temperature" }),
	).toBeVisible();
	expect(screen.getByRole("region", { name: "Knowledge" })).toBeVisible();
	expect(screen.getByRole("region", { name: "Tools" })).toBeVisible();
	expect(screen.getByRole("region", { name: "Skills" })).toBeVisible();
});

it("preserves unsaved fields across closing and an external agent selection", async () => {
	const { user, snapshot, saveSettings, rerender } = setup();
	await user.click(screen.getByRole("button", { name: "Open settings" }));
	const instructions = screen.getByRole("textbox", { name: "Instructions" });
	await user.type(instructions, "Use short replies");
	await user.click(screen.getByRole("button", { name: "Close settings" }));
	await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
	expect(screen.getByRole("button", { name: "Open settings" })).toHaveFocus();
	expect(saveSettings).not.toHaveBeenCalled();
	snapshot.settings = {
		...snapshot.settings,
		agentId: "external",
		modelId: "external-model",
	};
	rerender();
	await user.click(screen.getByRole("button", { name: "Open settings" }));
	expect(screen.getByRole("textbox", { name: "Instructions" })).toHaveValue(
		"Use short replies",
	);
	expect(screen.getByLabelText("Model")).toHaveAttribute(
		"data-model-id",
		"external-model",
	);
	await user.click(screen.getByRole("button", { name: "Save" }));
	await waitFor(() =>
		expect(saveSettings).toHaveBeenCalledWith(
			"Conversation",
			expect.objectContaining({
				agentId: "external",
				modelId: "external-model",
				instructions: "Use short replies",
			}),
		),
	);
	expect(screen.getByRole("dialog", { name: "Chat settings" })).toBeVisible();
});

it("retains unsaved settings through a route remount and message reset until Reset is chosen", async () => {
	const { user, snapshot, remount } = setup();
	await user.click(screen.getByRole("button", { name: "Open settings" }));
	await user.type(
		screen.getByRole("textbox", { name: "Instructions" }),
		"Keep my unfinished settings",
	);
	await user.click(screen.getByRole("button", { name: "Close settings" }));
	remount();
	await user.click(screen.getByRole("button", { name: "Open settings" }));
	expect(screen.getByRole("textbox", { name: "Instructions" })).toHaveValue(
		"Keep my unfinished settings",
	);
	expect(screen.getByText("Unsaved changes")).toBeVisible();
	await user.click(screen.getByRole("button", { name: "Close settings" }));
	await user.click(screen.getByRole("button", { name: "Send message" }));
	await user.click(screen.getByRole("button", { name: "Open settings" }));
	expect(screen.getByRole("textbox", { name: "Instructions" })).toHaveValue(
		"Keep my unfinished settings",
	);
	await user.click(screen.getByRole("button", { name: "Reset" }));
	expect(screen.getByRole("textbox", { name: "Instructions" })).toHaveValue(
		"",
	);
	snapshot.settings = {
		...snapshot.settings,
		instructions: "Updated saved instructions",
	};
	remount();
	await user.click(screen.getByRole("button", { name: "Open settings" }));
	expect(screen.getByRole("textbox", { name: "Instructions" })).toHaveValue(
		"Updated saved instructions",
	);
	expect(screen.getByText("Saved")).toBeVisible();
});

it("retains invalid raw temperature through remounts and clears the draft after saving", async () => {
	const { user, snapshot, saveSettings, remount } = setup();
	await user.click(screen.getByRole("button", { name: "Open settings" }));
	await user.click(screen.getByRole("button", { name: "Advanced" }));
	fireEvent.change(screen.getByRole("spinbutton", { name: "Temperature" }), {
		target: { value: "2" },
	});
	await user.click(screen.getByRole("button", { name: "Close settings" }));
	remount();
	await user.click(screen.getByRole("button", { name: "Open settings" }));
	await user.click(screen.getByRole("button", { name: "Save" }));
	const temperature = await screen.findByRole("spinbutton", {
		name: "Temperature",
	});
	expect(temperature).toHaveValue(2);
	expect(temperature).toHaveAttribute("aria-invalid", "true");
	expect(saveSettings).not.toHaveBeenCalled();
	fireEvent.change(temperature, { target: { value: "0.4" } });
	await user.click(screen.getByRole("button", { name: "Save" }));
	await waitFor(() => expect(saveSettings).toHaveBeenCalledOnce());
	expect(saveSettings).toHaveBeenCalledWith(
		"Conversation",
		expect.objectContaining({ temperature: 0.4 }),
	);
	await waitFor(() => expect(screen.getByText("Saved")).toBeVisible());
	snapshot.settings = { ...snapshot.settings, temperature: 0.7 };
	remount();
	await user.click(screen.getByRole("button", { name: "Open settings" }));
	await user.click(screen.getByRole("button", { name: "Advanced" }));
	expect(screen.getByRole("spinbutton", { name: "Temperature" })).toHaveValue(
		0.7,
	);
	expect(screen.getByText("Saved")).toBeVisible();
});

it("keeps a failed save visible and preserves the draft for retry", async () => {
	const { user, saveSettings } = setup();
	saveSettings.mockRejectedValueOnce(
		new Error("Settings could not be saved"),
	);
	await user.click(screen.getByRole("button", { name: "Open settings" }));
	await user.type(
		screen.getByRole("textbox", { name: "Instructions" }),
		"Keep this draft",
	);
	await user.click(screen.getByRole("button", { name: "Save" }));
	expect(await screen.findByRole("alert")).toHaveTextContent(
		"Settings could not be saved",
	);
	expect(screen.getByRole("textbox", { name: "Instructions" })).toHaveValue(
		"Keep this draft",
	);
	await user.click(screen.getByRole("button", { name: "Save" }));
	await waitFor(() => expect(saveSettings).toHaveBeenCalledTimes(2));
	await waitFor(() => expect(screen.queryByRole("alert")).toBeNull());
	expect(screen.getByText("Saved")).toBeVisible();
});

it("prevents dismissal and duplicate submission while settings are saving", async () => {
	const { user, saveSettings, snapshot } = setup();
	let finishSave: (() => void) | undefined;
	saveSettings.mockImplementationOnce(
		(_title, values) =>
			new Promise<void>((resolve) => {
				finishSave = () => {
					snapshot.settings = values;
					resolve();
				};
			}),
	);
	await user.click(screen.getByRole("button", { name: "Open settings" }));
	await user.click(screen.getByRole("button", { name: "Save" }));
	await waitFor(() => expect(saveSettings).toHaveBeenCalledOnce());
	expect(
		screen.getByRole("button", { name: "Close settings" }),
	).toBeDisabled();
	expect(screen.getByRole("button", { name: /Saving…/ })).toBeDisabled();
	await user.keyboard("{Escape}");
	fireEvent.pointerDown(document.body);
	expect(screen.getByRole("dialog", { name: "Chat settings" })).toBeVisible();
	await act(async () => {
		if (!finishSave) throw new Error("Expected a pending save");
		finishSave();
	});
	await user.keyboard("{Escape}");
	await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
	expect(screen.getByRole("button", { name: "Open settings" })).toHaveFocus();
});

it("reveals an invalid advanced field before allowing a save", async () => {
	const { user, saveSettings } = setup();
	await user.click(screen.getByRole("button", { name: "Open settings" }));
	await user.click(screen.getByRole("button", { name: "Advanced" }));
	fireEvent.change(screen.getByRole("spinbutton", { name: "Temperature" }), {
		target: { value: "2" },
	});
	await user.click(screen.getByRole("button", { name: "Advanced" }));
	await user.click(screen.getByRole("button", { name: "Save" }));
	const input = await screen.findByRole("spinbutton", {
		name: "Temperature",
	});
	expect(input).toBeVisible();
	expect(input).toHaveAttribute("aria-invalid", "true");
	expect(input).toHaveAccessibleDescription(
		expect.stringContaining("Enter a temperature from 0 to 1."),
	);
	await waitFor(() => expect(input).toHaveFocus());
	expect(saveSettings).not.toHaveBeenCalled();
});
