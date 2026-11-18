import {
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { AppTestRecording } from "./app-test.types";
import { AppTestFiles } from "./app-test-files";

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
	fileQuery.status = "SUCCESS";
	fileQuery.data = { target: "app", recording };
	fileQuery.error = undefined;
	readPixel.mockClear();
});
afterEach(cleanup);

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

it("edits JSON, requires a description, and retains edits across refresh and a rejected write", async () => {
	const save = vi
		.fn()
		.mockRejectedValueOnce(new Error("Storage unavailable"))
		.mockResolvedValue(undefined);
	const view = render(
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
	const editor = await screen.findByRole("textbox", {
		name: "Test file JSON",
	});
	const changed = { ...recording, description: "" };
	fireEvent.change(editor, { target: { value: JSON.stringify(changed) } });
	fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
	await screen.findByText(/A test description is required/);
	expect(save).not.toHaveBeenCalled();
	changed.description = "Verify the edited order total.";
	fireEvent.change(editor, { target: { value: JSON.stringify(changed) } });
	view.rerender(
		<AppTestFiles
			{...fileActions}
			recordings={[]}
			isLoading={true}
			onSelect={vi.fn()}
			onSave={save}
		/>,
	);
	expect(
		(
			screen.getByRole("textbox", {
				name: "Test file JSON",
			}) as HTMLTextAreaElement
		).value,
	).toBe(JSON.stringify(changed));
	view.rerender(
		<AppTestFiles
			{...fileActions}
			recordings={[recording]}
			isLoading={false}
			onSelect={vi.fn()}
			onSave={save}
		/>,
	);
	fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
	await screen.findByText("Storage unavailable");
	expect((editor as HTMLTextAreaElement).value).toBe(JSON.stringify(changed));
	fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
	await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
	expect(save).toHaveBeenLastCalledWith(changed);
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
			screen.getByRole("button", { name: "Refresh recordings" }),
		),
	);
	expect(remove).toHaveBeenLastCalledWith(recording.id);
});

it("rejects malformed JSON and a changed file id without writing", async () => {
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
	const editor = await screen.findByRole("textbox", {
		name: "Test file JSON",
	});
	fireEvent.change(editor, { target: { value: "{" } });
	fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
	await screen.findByText("Enter valid JSON before saving.");
	fireEvent.change(editor, {
		target: {
			value: JSON.stringify({ ...recording, id: "a-different-file" }),
		},
	});
	fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
	await screen.findByText(/id:/);
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
	const editor = await screen.findByRole("textbox", {
		name: "Test file JSON",
	});
	expect(JSON.parse((editor as HTMLTextAreaElement).value)).toEqual(
		recording,
	);
});
