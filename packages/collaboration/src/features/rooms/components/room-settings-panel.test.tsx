import {
	act,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import { createRef } from "react";
import { createWorkbenchStore, WorkbenchProvider } from "@semoss/workbench";
import { ToolWorkbenchFocusContext } from "../../tools/tool-workbench-focus.context";
import {
	ROOM_SETTINGS_PANEL_COMPONENTS,
	ROOM_SETTINGS_PANEL_TYPE,
	RoomSettingsPanel,
} from "./room-settings-panel";
import {
	RoomSettingsPanelContext,
	type RoomSettingsPanelContextValue,
} from "./room-settings-panel.context";

vi.mock("../api/use-room-model", () => ({
	useRoomModel: () => ({ engine: null, isLoading: false, error: null }),
}));
vi.mock("@semoss/shared", async (original) => ({
	...(await original<typeof import("@semoss/shared")>()),
	EngineSelect: ({
		value,
		disabled,
		onChange,
	}: {
		value: string;
		disabled: boolean;
		onChange: (engine: { engine_id: string }) => void;
	}) => (
		<button
			type="button"
			disabled={disabled}
			onClick={() => onChange({ engine_id: "model-2" })}
		>
			Model {value}
		</button>
	),
}));

function setup(overrides: Partial<RoomSettingsPanelContextValue> = {}) {
	const value: RoomSettingsPanelContextValue = {
		agentName: "Researcher",
		modelId: "model-1",
		settings: { instructions: "Original", modelId: "model-1", mcp: [] },
		inheritedMcp: [],
		onSave: vi.fn(async () => undefined),
		...overrides,
	};
	const store = createWorkbenchStore({
		components: ROOM_SETTINGS_PANEL_COMPONENTS,
	});
	const id = store
		.getState()
		.layout.actions.selectPanel(ROOM_SETTINGS_PANEL_TYPE, {});
	const menuRef = createRef<HTMLButtonElement>();
	const focusWorkbench = vi.fn(() => menuRef.current?.focus());
	const content = (nextValue = value) => (
		<RoomSettingsPanelContext.Provider value={nextValue}>
			<WorkbenchProvider store={store}>
				<button type="button" ref={menuRef}>
					File
				</button>
				<ToolWorkbenchFocusContext.Provider value={focusWorkbench}>
					<RoomSettingsPanel id={id} />
				</ToolWorkbenchFocusContext.Provider>
			</WorkbenchProvider>
		</RoomSettingsPanelContext.Provider>
	);
	return { value, store, id, content, focusWorkbench };
}

it("returns focus to the workbench when Cancel closes settings", async () => {
	const test = setup();
	render(test.content());
	const cancel = screen.getByRole("button", { name: "Cancel" });
	cancel.focus();
	expect(cancel).toHaveFocus();
	fireEvent.click(cancel);
	expect(test.store.getState().layout.panels[test.id]).toBeUndefined();
	await waitFor(() =>
		expect(screen.getByRole("button", { name: "File" })).toHaveFocus(),
	);
	expect(test.focusWorkbench).toHaveBeenCalledOnce();
});

it("opens one nonmodal settings panel and saves only room-owned resources", async () => {
	const locked = {
		id: "inherited",
		name: "Agent knowledge",
		type: "VECTOR" as const,
	};
	const local = {
		id: "local",
		name: "Room toolbox",
		type: "PROJECT" as const,
	};
	const test = setup({
		inheritedMcp: [locked],
		settings: {
			modelId: "model-1",
			instructions: "Original",
			mcp: [locked, local],
		},
	});
	expect(
		test.store
			.getState()
			.layout.actions.selectPanel(ROOM_SETTINGS_PANEL_TYPE, {}),
	).toBe(test.id);
	expect(ROOM_SETTINGS_PANEL_COMPONENTS[ROOM_SETTINGS_PANEL_TYPE].mount).toBe(
		"keepAlive",
	);
	render(test.content());
	expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
	expect(
		screen.getByRole("region", { name: "Room settings" }),
	).toBeInTheDocument();
	expect(
		screen.queryByRole("button", { name: "Remove Agent knowledge" }),
	).not.toBeInTheDocument();
	fireEvent.click(screen.getByRole("button", { name: "Model model-1" }));
	fireEvent.change(screen.getByRole("spinbutton", { name: "Temperature" }), {
		target: { value: "0.35" },
	});
	fireEvent.click(screen.getByRole("button", { name: "Save settings" }));
	await waitFor(() =>
		expect(test.value.onSave).toHaveBeenCalledWith({
			modelId: "model-2",
			temperature: 0.35,
			instructions: "Original",
			mcp: [local],
		}),
	);
	await waitFor(() =>
		expect(
			screen.getByRole("button", { name: "Save settings" }),
		).not.toBeDisabled(),
	);
	expect(test.store.getState().layout.panels[test.id]).toBeDefined();
	expect(screen.getByRole("spinbutton", { name: "Temperature" })).toHaveValue(
		0.35,
	);
});

it("keeps draft values and errors after a failed save and blocks closing during the write", async () => {
	let rejectSave: (error: Error) => void = () => undefined;
	const pending = new Promise<void>((_resolve, reject) => {
		rejectSave = reject;
	});
	const onSave = vi
		.fn()
		.mockReturnValueOnce(pending)
		.mockResolvedValue(undefined);
	const test = setup({ onSave });
	render(test.content());
	fireEvent.change(screen.getByRole("textbox", { name: "Instructions" }), {
		target: { value: "My draft" },
	});
	fireEvent.click(screen.getByRole("button", { name: "Save settings" }));
	await waitFor(() => expect(onSave).toHaveBeenCalledOnce());
	expect(screen.getByRole("button", { name: /Saving…/ })).toBeDisabled();
	expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
	act(() => test.store.getState().layout.actions.closePanel(test.id));
	expect(test.store.getState().layout.panels[test.id]).toBeDefined();
	await act(async () => rejectSave(new Error("Save unavailable")));
	expect(await screen.findByRole("alert")).toHaveTextContent(
		"Save unavailable",
	);
	expect(screen.getByRole("textbox", { name: "Instructions" })).toHaveValue(
		"My draft",
	);
	fireEvent.click(screen.getByRole("button", { name: "Save settings" }));
	await waitFor(() => expect(onSave).toHaveBeenCalledTimes(2));
	await waitFor(() =>
		expect(screen.queryByRole("alert")).not.toBeInTheDocument(),
	);
	fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
	expect(test.store.getState().layout.panels[test.id]).toBeUndefined();
});

it("preserves edits while updating untouched values and locks an active run", () => {
	const test = setup();
	const view = render(test.content());
	fireEvent.change(screen.getByRole("textbox", { name: "Instructions" }), {
		target: { value: "My draft" },
	});
	view.rerender(
		test.content({
			...test.value,
			isReadOnly: true,
			settings: {
				...test.value.settings,
				instructions: "Background",
				temperature: 0.6,
			},
		}),
	);
	expect(screen.getByRole("textbox", { name: "Instructions" })).toHaveValue(
		"My draft",
	);
	expect(screen.getByRole("spinbutton", { name: "Temperature" })).toHaveValue(
		0.6,
	);
	expect(
		screen.getByRole("textbox", { name: "Instructions" }),
	).toBeDisabled();
	expect(
		screen.getByRole("button", { name: "Save settings" }),
	).toBeDisabled();
	expect(screen.getByRole("button", { name: "Cancel" })).not.toBeDisabled();
	expect(test.value.onSave).not.toHaveBeenCalled();
});

it("keeps validation errors associated with the embedded field", async () => {
	const test = setup();
	render(test.content());
	const temperature = screen.getByRole("spinbutton", { name: "Temperature" });
	fireEvent.change(temperature, { target: { value: "2" } });
	fireEvent.click(screen.getByRole("button", { name: "Save settings" }));
	await waitFor(() =>
		expect(temperature).toHaveAttribute("aria-invalid", "true"),
	);
	expect(temperature).toHaveAccessibleDescription(
		/Enter a temperature from 0 to 1/,
	);
	expect(test.value.onSave).not.toHaveBeenCalled();
});
