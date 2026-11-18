import {
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
	within,
} from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { AppTestRecording } from "./app-test.types";
import { AppTestFiles } from "./app-test-files";

class ResizeObserverMock {
	observe() {}
	unobserve() {}
	disconnect() {}
}

const fileQuery = vi.hoisted(() => ({
	status: "SUCCESS",
	data: null as unknown,
	error: undefined as { message: string } | undefined,
	refresh: vi.fn(),
}));
const readPixel = vi.hoisted(() => vi.fn((_pixel: string) => fileQuery));
vi.mock("@semoss/sdk/react", () => ({ useSessionPixel: readPixel }));

const fileActions = {
	appId: "app",
	isBusy: false,
	selectedId: "example-test",
	onRefresh: vi.fn(),
	onRun: vi.fn(),
	onRunAll: vi.fn(),
	onSave: vi.fn().mockResolvedValue(undefined),
	onDelete: vi.fn().mockResolvedValue(undefined),
};

const recording: AppTestRecording = {
	id: "example-test",
	version: 1,
	name: "Checkout to orders",
	description: "Create an order, open Orders, and verify its total.",
	startPath: "checkout.html",
	updatedAt: "2026-11-18T12:00:00Z",
	steps: [
		{
			type: "CLICK",
			selector: '[data-testid="orders"]',
			pagePath: "checkout.html",
		},
		{
			type: "ASSERT_TEXT",
			selector: '[data-testid="total"]',
			text: "25",
			exact: true,
			pagePath: "orders.html",
		},
	],
};
beforeEach(() => {
	vi.stubGlobal("ResizeObserver", ResizeObserverMock);
	fileQuery.status = "SUCCESS";
	fileQuery.data = { target: "app", recording };
	fileQuery.error = undefined;
	readPixel.mockClear();
});
afterEach(() => {
	cleanup();
	vi.unstubAllGlobals();
});

it("lists each saved file with its description and opens complete read-only JSON", async () => {
	const select = vi.fn();
	render(
		<AppTestFiles
			{...fileActions}
			recordings={[recording]}
			isLoading={false}
			onSelect={select}
		/>,
	);
	expect(screen.getByText(recording.description)).toBeTruthy();
	expect(screen.getByText("example-test.json")).toBeTruthy();
	const opener = screen.getByRole("button", {
		name: "Open Checkout to orders",
	});
	opener.focus();
	fireEvent.click(opener);
	const dialog = await screen.findByRole("dialog", { name: recording.name });
	expect(dialog.textContent).toContain(recording.description);
	const content = screen.getByRole("textbox", { name: "Test file JSON" });
	expect(JSON.parse((content as HTMLTextAreaElement).value)).toEqual(
		recording,
	);
	expect(select).toHaveBeenCalledWith(recording.id);
	fireEvent.click(screen.getByRole("button", { name: "Close file" }));
	await waitFor(() => expect(document.activeElement).toBe(opener));
});

it("shows loading and empty file states", () => {
	const view = render(
		<AppTestFiles
			{...fileActions}
			recordings={[]}
			isLoading={true}
			onSelect={vi.fn()}
		/>,
	);
	expect(screen.getByText("Loading test files…")).toBeTruthy();
	view.rerender(
		<AppTestFiles
			{...fileActions}
			recordings={[]}
			isLoading={false}
			onSelect={vi.fn()}
		/>,
	);
	expect(screen.getByText(/No saved test files/)).toBeTruthy();
});

it("does not show stale JSON after a file disappears on refresh", async () => {
	const view = render(
		<AppTestFiles
			{...fileActions}
			recordings={[recording]}
			isLoading={false}
			onSelect={vi.fn()}
		/>,
	);
	fireEvent.click(
		screen.getByRole("button", { name: "Open Checkout to orders" }),
	);
	await screen.findByRole("dialog");
	view.rerender(
		<AppTestFiles
			{...fileActions}
			recordings={[]}
			isLoading={false}
			onSelect={vi.fn()}
		/>,
	);
	await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
});

it("edits fields, requires a description, and retains edits across refresh and a rejected write", async () => {
	const save = vi
		.fn()
		.mockRejectedValueOnce(new Error("Storage unavailable"))
		.mockResolvedValue(undefined);
	const props = {
		...fileActions,
		recordings: [recording],
		isLoading: false,
		onSelect: vi.fn(),
		onSave: save,
	};
	const view = render(<AppTestFiles {...props} />);
	fireEvent.click(
		screen.getByRole("button", { name: "Edit Checkout to orders" }),
	);
	const description = await screen.findByRole("textbox", {
		name: "Description (required)",
	});
	expect(
		screen.queryByRole("textbox", { name: "Test file JSON" }),
	).toBeNull();
	for (const name of ["ID", "Version", "Last edit", "updatedAt"])
		expect(screen.queryByRole("textbox", { name })).toBeNull();
	fireEvent.change(description, { target: { value: "" } });
	fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
	await screen.findByText("A test description is required");
	expect(save).not.toHaveBeenCalled();
	const errorId = description
		.getAttribute("aria-describedby")
		?.split(" ")
		.find((id) => id.endsWith("-error"));
	expect(errorId && document.getElementById(errorId)?.textContent).toBe(
		"A test description is required",
	);
	fireEvent.change(description, {
		target: { value: "Verify the edited order total." },
	});
	view.rerender(<AppTestFiles {...props} recordings={[]} isLoading={true} />);
	expect(
		(
			screen.getByRole("textbox", {
				name: "Description (required)",
			}) as HTMLTextAreaElement
		).value,
	).toBe("Verify the edited order total.");
	view.rerender(<AppTestFiles {...props} />);
	fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
	await screen.findByText("Storage unavailable");
	expect((description as HTMLTextAreaElement).value).toBe(
		"Verify the edited order total.",
	);
	fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
	await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
	expect(save).toHaveBeenLastCalledWith(
		expect.objectContaining({
			id: recording.id,
			version: recording.version,
			updatedAt: recording.updatedAt,
			description: "Verify the edited order total.",
		}),
	);
});

it("confirms deletion, retains a failure, and resets focus after the file is removed", async () => {
	const remove = vi.fn().mockRejectedValueOnce(new Error("Cannot delete"));
	const props = {
		...fileActions,
		recordings: [recording],
		isLoading: false,
		onSelect: vi.fn(),
		onDelete: remove,
	};
	const view = render(<AppTestFiles {...props} />);
	fireEvent.click(
		screen.getByRole("button", { name: "Delete Checkout to orders" }),
	);
	await screen.findByRole("dialog", { name: "Delete test file" });
	expect(remove).not.toHaveBeenCalled();
	fireEvent.click(screen.getByRole("button", { name: "Delete file" }));
	await screen.findByText("Cannot delete");
	remove.mockImplementationOnce(async () => {
		view.rerender(<AppTestFiles {...props} recordings={[]} />);
	});
	fireEvent.click(screen.getByRole("button", { name: "Delete file" }));
	await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
	await waitFor(() =>
		expect(document.activeElement).toBe(
			screen.getByRole("button", { name: "Refresh tests" }),
		),
	);
	expect(remove).toHaveBeenLastCalledWith(recording.id);
});

it("validates the start page and each action's required fields", async () => {
	const save = vi.fn();
	render(
		<AppTestFiles
			{...fileActions}
			recordings={[recording]}
			isLoading={false}
			onSelect={vi.fn()}
			onSave={save}
		/>,
	);
	fireEvent.click(
		screen.getByRole("button", { name: "Edit Checkout to orders" }),
	);
	fireEvent.change(
		await screen.findByRole("textbox", { name: "Start page" }),
		{ target: { value: "https://another-app.example/" } },
	);
	fireEvent.change(
		within(screen.getByRole("group", { name: "Step 1" })).getByRole(
			"textbox",
			{ name: "Target selector (required)" },
		),
		{ target: { value: "" } },
	);
	fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
	await screen.findByText("A target selector is required");
	expect(
		screen.getByText(/Use a relative page inside this app/),
	).toBeTruthy();
	expect(save).not.toHaveBeenCalled();
});

it("blocks duplicate writes and dismissal while a save is pending", async () => {
	let finish: (() => void) | undefined;
	const save = vi.fn(
		() =>
			new Promise<void>((resolve) => {
				finish = resolve;
			}),
	);
	render(
		<AppTestFiles
			{...fileActions}
			recordings={[recording]}
			isLoading={false}
			onSelect={vi.fn()}
			onSave={save}
		/>,
	);
	fireEvent.click(
		screen.getByRole("button", { name: "Edit Checkout to orders" }),
	);
	const dialog = await screen.findByRole("dialog");
	fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
	await waitFor(() => expect(save).toHaveBeenCalledTimes(1));
	expect(
		(screen.getByRole("button", { name: "Cancel" }) as HTMLButtonElement)
			.disabled,
	).toBe(true);
	fireEvent.keyDown(dialog, { key: "Escape" });
	expect(screen.getByRole("dialog")).toBeTruthy();
	finish?.();
	await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
});

it("fetches one definition only after opening it and does not read on delete", async () => {
	const summary = {
		id: recording.id,
		name: recording.name,
		description: recording.description,
	};
	render(
		<AppTestFiles
			{...fileActions}
			recordings={[summary]}
			isLoading={false}
			onSelect={vi.fn()}
		/>,
	);
	expect(readPixel).not.toHaveBeenCalled();
	fireEvent.click(
		screen.getByRole("button", { name: "Open Checkout to orders" }),
	);
	await screen.findByRole("textbox", { name: "Test file JSON" });
	expect(
		readPixel.mock.calls.every(
			(call) =>
				call[0] ===
				'META | GetAppTestRecording(project=["app"], recordingId=["example-test"]);',
		),
	).toBe(true);
	fireEvent.click(screen.getByRole("button", { name: "Close file" }));
	await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
	readPixel.mockClear();
	fireEvent.click(
		screen.getByRole("button", { name: "Delete Checkout to orders" }),
	);
	await screen.findByRole("dialog", { name: "Delete test file" });
	expect(readPixel.mock.calls.every((call) => call[0] === "")).toBe(true);
});

it("shows loading and recoverable read errors without exposing an empty editor", async () => {
	fileQuery.status = "LOADING";
	const props = {
		...fileActions,
		recordings: [recording],
		isLoading: false,
		onSelect: vi.fn(),
	};
	const view = render(<AppTestFiles {...props} />);
	fireEvent.click(
		screen.getByRole("button", { name: "Edit Checkout to orders" }),
	);
	await screen.findByText("Loading test file…");
	expect(
		screen.queryByRole("textbox", { name: "Test file JSON" }),
	).toBeNull();
	expect(screen.queryByRole("button", { name: "Save changes" })).toBeNull();
	fileQuery.status = "ERROR";
	fileQuery.error = { message: "Read failed" };
	view.rerender(<AppTestFiles {...props} />);
	await screen.findByText("Read failed");
	fireEvent.click(screen.getByRole("button", { name: "Retry reading file" }));
	expect(fileQuery.refresh).toHaveBeenCalled();
	fileQuery.status = "SUCCESS";
	fileQuery.error = undefined;
	view.rerender(<AppTestFiles {...props} />);
	const nameField = await screen.findByRole("textbox", {
		name: "Test name (required)",
	});
	expect((nameField as HTMLInputElement).value).toBe(recording.name);
});

it("updates outcome checks and reorders, adds and removes steps", async () => {
	const save = vi.fn().mockResolvedValue(undefined);
	render(
		<AppTestFiles
			{...fileActions}
			recordings={[recording]}
			isLoading={false}
			onSelect={vi.fn()}
			onSave={save}
		/>,
	);
	fireEvent.click(
		screen.getByRole("button", { name: "Edit Checkout to orders" }),
	);
	await screen.findByRole("textbox", { name: "Test name (required)" });
	fireEvent.change(
		screen.getByRole("textbox", { name: "Expected text (required)" }),
		{ target: { value: "50" } },
	);
	fireEvent.click(screen.getByRole("button", { name: "Move step 2 up" }));
	expect(
		(
			within(screen.getByRole("group", { name: "Step 1" })).getByRole(
				"textbox",
				{ name: "Expected text (required)" },
			) as HTMLTextAreaElement
		).value,
	).toBe("50");
	fireEvent.click(screen.getByRole("button", { name: "Add step" }));
	const third = screen.getByRole("group", { name: "Step 3" });
	fireEvent.change(
		within(third).getByRole("textbox", {
			name: "Target selector (required)",
		}),
		{ target: { value: '[data-testid="finish"]' } },
	);
	fireEvent.click(screen.getByRole("button", { name: "Remove step 2" }));
	expect(document.activeElement).toBe(
		screen.getByRole("button", { name: "Add step" }),
	);
	fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
	await waitFor(() => expect(save).toHaveBeenCalled());
	expect(save.mock.calls[0][0].steps).toEqual([
		{ ...recording.steps[1], text: "50", framePath: [] },
		{ type: "CLICK", selector: '[data-testid="finish"]', framePath: [] },
	]);
});

it("keeps nested iframe targets and route waits with their step when reordering", async () => {
	const save = vi.fn().mockResolvedValue(undefined);
	render(
		<AppTestFiles
			{...fileActions}
			recordings={[recording]}
			isLoading={false}
			onSelect={vi.fn()}
			onSave={save}
		/>,
	);
	fireEvent.click(
		screen.getByRole("button", { name: "Edit Checkout to orders" }),
	);
	const first = await screen.findByRole("group", { name: "Step 1" });
	fireEvent.click(
		within(first).getByRole("button", { name: "Add iframe target" }),
	);
	fireEvent.change(
		within(first).getByRole("textbox", {
			name: "Frame 1 selector (required)",
		}),
		{ target: { value: "#outer-frame" } },
	);
	fireEvent.change(
		within(first).getByRole("textbox", { name: "Expected page" }),
		{ target: { value: "" } },
	);
	fireEvent.click(screen.getByRole("button", { name: "Move step 1 down" }));
	const moved = screen.getByRole("group", { name: "Step 2" });
	expect(
		(
			within(moved).getByRole("textbox", {
				name: "Frame 1 selector (required)",
			}) as HTMLInputElement
		).value,
	).toBe("#outer-frame");
	fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
	await waitFor(() => expect(save).toHaveBeenCalled());
	expect(save.mock.calls[0][0].steps[1]).toEqual({
		...recording.steps[0],
		pagePath: "",
		framePath: ["#outer-frame"],
	});
});

it("runs one file without reading its definition and offers explicit Run all beside refresh", () => {
	const one = vi.fn(),
		all = vi.fn();
	render(
		<AppTestFiles
			{...fileActions}
			recordings={[recording]}
			isLoading={false}
			onSelect={vi.fn()}
			onRun={one}
			onRunAll={all}
		/>,
	);
	fireEvent.click(
		screen.getByRole("button", { name: "Run test Checkout to orders" }),
	);
	expect(one).toHaveBeenCalledWith(recording.id);
	expect(readPixel).not.toHaveBeenCalled();
	fireEvent.click(screen.getByRole("button", { name: "Run all" }));
	expect(all).toHaveBeenCalledTimes(1);
	expect(
		screen.getByRole("button", { name: "Refresh tests" }).parentElement,
	).toBe(screen.getByRole("button", { name: "Run all" }).parentElement);
	expect(screen.getByText("assets / app-tests / tests")).toBeTruthy();
});
