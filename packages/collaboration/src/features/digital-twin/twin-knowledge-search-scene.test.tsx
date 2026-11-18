import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { TwinKnowledgeSearchScene } from "./twin-knowledge-search-scene";

beforeEach(() => {
	vi.useFakeTimers();
});
afterEach(() => {
	cleanup();
	vi.useRealTimers();
});

/** How many of the circling places are lit. */
const lit = (): number => document.querySelectorAll("[data-active]").length;
const pass = (milliseconds: number): void =>
	act(() => {
		vi.advanceTimersByTime(milliseconds);
	});

it("waits at rest, saying where suggestions will be listed, with no search to describe", () => {
	render(<TwinKnowledgeSearchScene isSearching={false} />);
	expect(
		screen.getByText(
			/The emails, Teams chats and files that fit are listed here/,
		),
	).toBeVisible();
	pass(60_000);
	expect(screen.queryByText(/Working out|Searching your|Picking/)).toBeNull();
	expect(lit()).toBe(0);
});

it("says what the search is doing as it goes, lights the place it names, and holds on its last line", () => {
	render(<TwinKnowledgeSearchScene isSearching />);
	expect(screen.getByText("Working out what to look for…")).toBeVisible();
	expect(lit()).toBe(0);
	// three lines of the same length in a row: each still gets its own wait
	for (const line of [
		"Searching your Outlook…",
		"Searching your Teams chats…",
		"Searching your OneDrive…",
	]) {
		pass(2500);
		expect(screen.getByText(line)).toBeVisible();
		expect(lit()).toBe(1);
	}
	pass(2500);
	expect(screen.getByText("Reading what turned up…")).toBeVisible();
	expect(lit()).toBe(0);
	pass(4000);
	expect(
		screen.getByText("Picking what fits your Digital Twin…"),
	).toBeVisible();
	// however long the server takes from here
	pass(120_000);
	expect(
		screen.getByText("Picking what fits your Digital Twin…"),
	).toBeVisible();
	expect(screen.getByText("This can take up to a minute.")).toBeVisible();
});

it("starts every search from its first line", () => {
	const { rerender } = render(<TwinKnowledgeSearchScene isSearching />);
	// a line at a time: the next line's wait starts once the line is drawn
	pass(2500);
	pass(2500);
	expect(screen.getByText("Searching your Teams chats…")).toBeVisible();
	rerender(<TwinKnowledgeSearchScene isSearching={false} />);
	rerender(<TwinKnowledgeSearchScene isSearching />);
	expect(screen.getByText("Working out what to look for…")).toBeVisible();
	pass(2500);
	expect(screen.getByText("Searching your Outlook…")).toBeVisible();
});
