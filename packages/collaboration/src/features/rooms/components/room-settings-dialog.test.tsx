import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ComponentProps } from "react";
import { createRef } from "react";
import { RoomSettingsDialog } from "./room-settings-dialog";

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
const props: ComponentProps<typeof RoomSettingsDialog> = {
	open: true,
	agentName: "Researcher",
	settings: { instructions: "Original", mcp: [], modelId: "model-1" },
	modelId: "model-1",
	inheritedMcp: [],
	returnFocusRef: createRef<HTMLButtonElement>(),
	onOpenChange: vi.fn(),
	onSave: vi.fn(),
};
beforeEach(() => vi.clearAllMocks());
it("saves model, temperature and unchanged instructions together", async () => {
	const onSave = vi.fn().mockResolvedValue(undefined);
	render(<RoomSettingsDialog {...props} onSave={onSave} />);
	fireEvent.click(screen.getByRole("button", { name: "Model model-1" }));
	fireEvent.change(screen.getByRole("spinbutton", { name: "Temperature" }), {
		target: { value: "0.35" },
	});
	fireEvent.click(screen.getByRole("button", { name: "Save settings" }));
	await waitFor(() =>
		expect(onSave).toHaveBeenCalledWith({
			instructions: "Original",
			mcp: [],
			modelId: "model-2",
			temperature: 0.35,
		}),
	);
	await waitFor(() => expect(props.onOpenChange).toHaveBeenCalledWith(false));
});
it("resets temperature to the backend default", async () => {
	const onSave = vi.fn().mockResolvedValue(undefined);
	render(
		<RoomSettingsDialog
			{...props}
			settings={{ ...props.settings, temperature: 0.7 }}
			onSave={onSave}
		/>,
	);
	fireEvent.click(screen.getByRole("button", { name: "Reset temperature" }));
	fireEvent.click(screen.getByRole("button", { name: "Save settings" }));
	await waitFor(() =>
		expect(onSave).toHaveBeenCalledWith(
			expect.objectContaining({ temperature: null }),
		),
	);
});
it("retains dirty fields through refresh and failed persistence", async () => {
	const onSave = vi.fn().mockRejectedValue(new Error("Save unavailable"));
	const view = render(<RoomSettingsDialog {...props} onSave={onSave} />);
	fireEvent.change(screen.getByRole("textbox", { name: "Instructions" }), {
		target: { value: "My draft" },
	});
	view.rerender(
		<RoomSettingsDialog
			{...props}
			onSave={onSave}
			settings={{ ...props.settings, instructions: "Background update" }}
		/>,
	);
	expect(screen.getByRole("textbox", { name: "Instructions" })).toHaveValue(
		"My draft",
	);
	fireEvent.click(screen.getByRole("button", { name: "Save settings" }));
	expect(await screen.findByRole("alert")).toHaveTextContent(
		"Save unavailable",
	);
	expect(screen.getByRole("textbox", { name: "Instructions" })).toHaveValue(
		"My draft",
	);
	expect(props.onOpenChange).not.toHaveBeenCalled();
});
it("locks an already-open form when execution starts", async () => {
	const onSave = vi.fn();
	const view = render(<RoomSettingsDialog {...props} onSave={onSave} />);
	view.rerender(<RoomSettingsDialog {...props} onSave={onSave} isReadOnly />);
	expect(
		screen.getByRole("textbox", { name: "Instructions" }),
	).toBeDisabled();
	expect(
		screen.getByRole("spinbutton", { name: "Temperature" }),
	).toBeDisabled();
	expect(
		screen.getByRole("button", { name: "Save settings" }),
	).toBeDisabled();
	expect(onSave).not.toHaveBeenCalled();
	fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
	expect(props.onOpenChange).toHaveBeenCalledWith(false);
});
it("associates invalid temperature feedback with its input", async () => {
	render(<RoomSettingsDialog {...props} />);
	const input = screen.getByRole("spinbutton", { name: "Temperature" });
	fireEvent.change(input, { target: { value: "2" } });
	fireEvent.click(screen.getByRole("button", { name: "Save settings" }));
	await waitFor(() => expect(input).toHaveAttribute("aria-invalid", "true"));
	expect(input).toHaveAccessibleDescription(
		/Enter a temperature from 0 to 1/,
	);
});
