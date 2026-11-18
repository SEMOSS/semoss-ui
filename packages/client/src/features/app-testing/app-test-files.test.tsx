import {
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import type { AppTestRecording } from "./app-test.types";
import { AppTestFiles } from "./app-test-files";

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
afterEach(cleanup);

it("lists each saved file with its description and opens complete read-only JSON", async () => {
	const select = vi.fn();
	render(
		<AppTestFiles
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
	fireEvent.click(screen.getByRole("button", { name: "Close" }));
	await waitFor(() => expect(document.activeElement).toBe(opener));
});

it("shows loading and empty file states", () => {
	const view = render(
		<AppTestFiles recordings={[]} isLoading={true} onSelect={vi.fn()} />,
	);
	expect(screen.getByText("Loading test files…")).toBeTruthy();
	view.rerender(
		<AppTestFiles recordings={[]} isLoading={false} onSelect={vi.fn()} />,
	);
	expect(screen.getByText(/No saved test files/)).toBeTruthy();
});

it("does not show stale JSON after a file disappears on refresh", async () => {
	const view = render(
		<AppTestFiles
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
		<AppTestFiles recordings={[]} isLoading={false} onSelect={vi.fn()} />,
	);
	await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
});
