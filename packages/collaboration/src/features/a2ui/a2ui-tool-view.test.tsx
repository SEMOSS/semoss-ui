import type { ActionPayload } from "@a2ui/web_core/v1_0";
import {
	act,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import type { ToolViewProps } from "@semoss/shared";
import { a2uiRequest } from "./a2ui.fixtures";
import { A2uiToolView } from "./a2ui-tool-view";

const mock = vi.hoisted(() => ({
	action: undefined as ((action: ActionPayload) => void) | undefined,
	dispose: vi.fn(),
	failure: false,
}));
vi.mock("./a2ui-catalog", () => ({
	createA2uiProcessor: (
		_input: string,
		action: (event: ActionPayload) => void,
	) => {
		if (mock.failure) throw new Error("Invalid catalog");
		mock.action = action;
		return {
			title: "Choose the next task",
			processor: {
				dispose: mock.dispose,
				getSurfaces: () => new Map([["main", {}]]),
			},
		};
	},
}));
vi.mock("@a2ui/react", () => ({
	A2uiSurface: () => <div>Interactive task form</div>,
}));

const event: ActionPayload = {
	name: "prepare",
	surfaceId: "main",
	sourceComponentId: "continue",
	timestamp: "2026-11-16T12:00:00Z",
	context: { notes: "Review tomorrow" },
};
const props = (): ToolViewProps => ({
	call: {
		id: "ui-1",
		functionName: "ShowUI",
		arguments: a2uiRequest,
		status: "pending",
	},
	mode: "approval",
	params: {},
	host: {},
	onApprove: vi.fn(),
	onRespond: vi.fn().mockResolvedValue(undefined),
	onDecline: vi.fn().mockResolvedValue(undefined),
});

beforeEach(() => {
	vi.clearAllMocks();
	mock.failure = false;
	mock.action = undefined;
});

it("returns one structured response and never approves execution", async () => {
	const view = props();
	render(<A2uiToolView {...view} />);
	await act(async () => {
		mock.action?.(event);
		mock.action?.(event);
	});
	expect(view.onRespond).toHaveBeenCalledTimes(1);
	expect(view.onRespond).toHaveBeenCalledWith(
		expect.objectContaining({
			userAction: "a2ui-action",
			result: { version: "1.0", action: event },
		}),
	);
	expect(view.onApprove).not.toHaveBeenCalled();
	expect(
		screen.getByText("Response sent. This interface is closed."),
	).toBeVisible();
});

it("keeps the form after a failed decision and permits retry", async () => {
	const view = props();
	vi.mocked(view.onRespond).mockRejectedValueOnce(
		new Error("Connection lost"),
	);
	render(<A2uiToolView {...view} />);
	await act(async () => {
		mock.action?.(event);
	});
	expect(screen.getByRole("alert")).toHaveTextContent("Connection lost");
	expect(screen.getByText("Interactive task form")).toBeVisible();
	await act(async () => {
		mock.action?.(event);
	});
	expect(view.onRespond).toHaveBeenCalledTimes(2);
});

it("returns a validation error to the agent instead of asking the owner", async () => {
	mock.failure = true;
	const view = props();
	const { rerender } = render(<A2uiToolView {...view} />);
	expect(
		await screen.findByText("The agent was told why and can try again."),
	).toBeVisible();
	// the host hands over new callbacks on every render
	rerender(<A2uiToolView {...view} onRespond={vi.fn()} />);
	expect(view.onRespond).toHaveBeenCalledTimes(1);
	expect(view.onRespond).toHaveBeenCalledWith(
		expect.objectContaining({
			userAction: "a2ui-invalid",
			result: { error: "Invalid catalog" },
		}),
	);
	expect(view.onDecline).not.toHaveBeenCalled();
	expect(screen.getByRole("alert")).toHaveTextContent(
		"could not be displayed. Invalid catalog",
	);
});

it("leaves Dismiss when the agent cannot be told", async () => {
	mock.failure = true;
	const view = props();
	vi.mocked(view.onRespond).mockRejectedValueOnce(
		new Error("Connection lost"),
	);
	render(<A2uiToolView {...view} />);
	expect(await screen.findByText(/Connection lost/)).toBeVisible();
	fireEvent.click(screen.getByRole("button", { name: "Dismiss" }));
	await waitFor(() => expect(view.onDecline).toHaveBeenCalledTimes(1));
	expect(view.onRespond).toHaveBeenCalledTimes(1);
});

it("does not report an invalid interface from saved history", () => {
	mock.failure = true;
	const view = props();
	render(
		<A2uiToolView
			{...view}
			mode="result"
			call={{ ...view.call, status: "declined" }}
		/>,
	);
	expect(screen.getByText("Dismissed.")).toBeVisible();
	expect(view.onRespond).not.toHaveBeenCalled();
});

it("does not send actions from saved history or a disposed surface", async () => {
	const view = props();
	const { unmount } = render(
		<A2uiToolView
			{...view}
			mode="result"
			call={{ ...view.call, status: "succeeded" }}
		/>,
	);
	await act(async () => {
		mock.action?.(event);
	});
	expect(view.onRespond).not.toHaveBeenCalled();
	unmount();
	expect(mock.dispose).toHaveBeenCalledTimes(1);
	mock.action?.(event);
	expect(view.onRespond).not.toHaveBeenCalled();
});
