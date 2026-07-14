import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
	PromptLibraryDialog,
	type PromptLibraryItem,
} from "./prompt-library-dialog";

const PROMPTS: PromptLibraryItem[] = [
	{
		id: "1",
		title: "Summarize claim",
		context: "Summarize the claim status for the given claim id.",
		tags: ["claims"],
	},
	{
		id: "2",
		title: "Draft benefits letter",
		context: "Draft a benefits eligibility letter.",
		tags: ["benefits", "letters"],
	},
	{ id: "3", title: "Untagged prompt", context: "No tags on this one." },
];

describe("PromptLibraryDialog", () => {
	it("renders nothing when closed", () => {
		render(
			<PromptLibraryDialog
				open={false}
				onOpenChange={vi.fn()}
				prompts={PROMPTS}
				onSelectPrompt={vi.fn()}
			/>,
		);
		expect(screen.queryByText("Summarize claim")).not.toBeInTheDocument();
	});

	it("lists all prompts grouped by tag when open, with untagged prompts under General", () => {
		render(
			<PromptLibraryDialog
				open
				onOpenChange={vi.fn()}
				prompts={PROMPTS}
				onSelectPrompt={vi.fn()}
			/>,
		);
		expect(screen.getByText("Summarize claim")).toBeInTheDocument();
		// A multi-tag prompt (benefits + letters) intentionally renders once
		// per tag group it belongs to, matching playground's own grouping.
		expect(screen.getAllByText("Draft benefits letter").length).toBe(2);
		expect(screen.getByText("Untagged prompt")).toBeInTheDocument();
		expect(screen.getByText("General")).toBeInTheDocument();
	});

	it("filters by search text across title/context/tags", async () => {
		const user = userEvent.setup();
		render(
			<PromptLibraryDialog
				open
				onOpenChange={vi.fn()}
				prompts={PROMPTS}
				onSelectPrompt={vi.fn()}
			/>,
		);
		await user.type(
			screen.getByPlaceholderText("Search prompts..."),
			"benefits",
		);
		expect(
			screen.getAllByText("Draft benefits letter").length,
		).toBeGreaterThan(0);
		expect(screen.queryByText("Summarize claim")).not.toBeInTheDocument();
	});

	it("filters by an active tag chip", async () => {
		const user = userEvent.setup();
		render(
			<PromptLibraryDialog
				open
				onOpenChange={vi.fn()}
				prompts={PROMPTS}
				onSelectPrompt={vi.fn()}
			/>,
		);
		await user.click(screen.getByRole("button", { name: "claims" }));
		expect(screen.getByText("Summarize claim")).toBeInTheDocument();
		expect(
			screen.queryByText("Draft benefits letter"),
		).not.toBeInTheDocument();
	});

	it("shows an empty state when nothing matches", async () => {
		const user = userEvent.setup();
		render(
			<PromptLibraryDialog
				open
				onOpenChange={vi.fn()}
				prompts={PROMPTS}
				onSelectPrompt={vi.fn()}
			/>,
		);
		await user.type(
			screen.getByPlaceholderText("Search prompts..."),
			"nothing matches this",
		);
		expect(screen.getByText("No prompts found.")).toBeInTheDocument();
	});

	it("selecting a prompt calls onSelectPrompt and closes the dialog", async () => {
		const user = userEvent.setup();
		const onSelectPrompt = vi.fn();
		const onOpenChange = vi.fn();
		render(
			<PromptLibraryDialog
				open
				onOpenChange={onOpenChange}
				prompts={PROMPTS}
				onSelectPrompt={onSelectPrompt}
			/>,
		);
		await user.click(screen.getByText("Summarize claim"));
		expect(onSelectPrompt).toHaveBeenCalledWith(PROMPTS[0]);
		expect(onOpenChange).toHaveBeenCalledWith(false);
	});

	it("disables prompt selection while isLoading", () => {
		render(
			<PromptLibraryDialog
				open
				isLoading
				onOpenChange={vi.fn()}
				prompts={PROMPTS}
				onSelectPrompt={vi.fn()}
			/>,
		);
		expect(
			screen.getByText("Summarize claim").closest("button"),
		).toBeDisabled();
	});
});
