import {
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
	within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import type { PersonaSections } from "./api/persona";
import { parsePersonaPoints, serializePersonaPoints } from "./persona-points";
import { PersonaSectionReader } from "./persona-section-reader";

const sections: PersonaSections = {
	short: "A technical lead.",
	voice: "Direct and kind.",
	decide: "",
	review: "",
	stands: "",
	people: "",
	limits: "",
	examples: "",
};

afterEach(cleanup);

it("preserves prose, original markers and continuation lines when reading stored sections", () => {
	const original =
		"A matter-of-fact intro.\n- First point\n  continues here.\n\n  * Second point\n• Third point\n— Last point";
	const points = parsePersonaPoints(original.replaceAll("\n", "\r\n"));
	expect(points.map(({ text }) => text)).toEqual([
		"A matter-of-fact intro.",
		"First point\n  continues here.\n",
		"Second point",
		"Third point",
		"Last point",
	]);
	expect(serializePersonaPoints(points)).toBe(original);
	expect(parsePersonaPoints("Line one.\nLine two — still prose.")).toEqual([
		{ text: "Line one.\nLine two — still prose.", prefix: "", offset: 0 },
	]);
	expect(parsePersonaPoints(" \n ")).toEqual([]);
	const spaced = " \n\n  - First\n- Second";
	const list = parsePersonaPoints(spaced);
	expect(list.map(({ text }) => text)).toEqual(["First", "Second"]);
	expect(serializePersonaPoints(list)).toBe(spaced);
});

it("opens divided rows, focuses added and remaining points, and saves only the edited section", async () => {
	const user = userEvent.setup();
	const initial = {
		...sections,
		voice: "- Direct, matter-of-fact.\n- Give context.\nKeep quotes.",
	};
	const onSave = vi.fn(async (change: Partial<PersonaSections>) => ({
		...initial,
		...change,
	}));
	const { rerender } = render(
		<PersonaSectionReader sections={initial} onSave={onSave} />,
	);
	const list = screen.getByRole("list", { name: "Voice points" });
	expect(
		within(list)
			.getAllByRole("listitem")
			.map((item) => item.textContent),
	).toEqual(["Direct, matter-of-fact.", "Give context.\nKeep quotes."]);

	const add = screen.getByRole("button", { name: "Add point" });
	add.focus();
	await user.keyboard("{Enter}");
	const third = screen.getByRole("textbox", { name: "Voice point 3" });
	expect(third).toHaveFocus();
	await user.type(third, "Use examples.");
	const first = screen.getByRole("textbox", { name: "Voice point 1" });
	await user.clear(first);
	await user.type(first, "Direct and warm.");
	await user.click(screen.getByRole("button", { name: "Remove point 2" }));
	const second = screen.getByRole("textbox", { name: "Voice point 2" });
	expect(second).toHaveFocus();
	expect(second).toHaveValue("Use examples.");
	await user.click(screen.getByRole("button", { name: "Add point" }));
	const next = screen.getByRole("textbox", { name: "Voice point 3" });
	expect(next).toHaveFocus();
	await user.type(next, "Include sources.");
	expect(onSave).not.toHaveBeenCalled();
	await user.click(screen.getByRole("button", { name: "Save" }));
	const voice = "- Direct and warm.\n- Use examples.\n- Include sources.";
	expect(onSave).toHaveBeenCalledExactlyOnceWith({ voice });
	rerender(
		<PersonaSectionReader
			sections={{ ...initial, voice }}
			onSave={onSave}
		/>,
	);
	expect(screen.getByRole("button", { name: "Add point" })).toHaveFocus();
	expect(screen.getAllByRole("listitem")).toHaveLength(3);
	expect(screen.getByText("Include sources.")).toBeVisible();
});

it("counts all rows and their stored separators toward the section limit", async () => {
	const user = userEvent.setup();
	const initial = { ...sections, short: "x".repeat(199) };
	const onSave = vi.fn(async (change: Partial<PersonaSections>) => ({
		...initial,
		...change,
	}));
	render(<PersonaSectionReader sections={initial} onSave={onSave} />);
	await user.click(screen.getByRole("button", { name: "In short" }));
	await user.click(screen.getByRole("button", { name: "Add point" }));
	fireEvent.change(
		screen.getByRole("textbox", { name: "In short point 2" }),
		{
			target: { value: "y".repeat(199) },
		},
	);
	await user.click(screen.getByRole("button", { name: "Save" }));
	const first = screen.getByRole("textbox", { name: "In short point 1" });
	expect(await screen.findByRole("alert")).toHaveTextContent(
		"400 characters or fewer",
	);
	expect(first).toHaveAccessibleDescription(
		expect.stringContaining("400 characters or fewer"),
	);
	expect(first).toHaveFocus();
	expect(onSave).not.toHaveBeenCalled();
});

it("reopens a plain paragraph and a newly added point in distinct fields", async () => {
	const user = userEvent.setup();
	const original = "Short replies.\nKeep the follow-up practical.";
	const initial = { ...sections, voice: original };
	const onSave = vi.fn(async (change: Partial<PersonaSections>) => ({
		...initial,
		...change,
	}));
	const { rerender } = render(
		<PersonaSectionReader sections={initial} onSave={onSave} />,
	);
	await user.click(screen.getByRole("button", { name: "Add point" }));
	await user.type(
		screen.getByRole("textbox", { name: "Voice point 2" }),
		"Use humor.",
	);
	await user.click(screen.getByRole("button", { name: "Save" }));
	const voice = `${original}\n- Use humor.`;
	expect(onSave).toHaveBeenCalledExactlyOnceWith({ voice });
	rerender(
		<PersonaSectionReader
			sections={{ ...initial, voice }}
			onSave={onSave}
		/>,
	);
	expect(screen.getAllByRole("listitem")).toHaveLength(2);
	await user.click(screen.getByRole("button", { name: "Edit" }));
	expect(screen.getByRole("textbox", { name: "Voice point 1" })).toHaveValue(
		original,
	);
	expect(screen.getByRole("textbox", { name: "Voice point 2" })).toHaveValue(
		"Use humor.",
	);
});

it("can clear a section while other sections keep their text", async () => {
	const user = userEvent.setup();
	const onSave = vi.fn(async (change: Partial<PersonaSections>) => ({
		...sections,
		...change,
	}));
	render(<PersonaSectionReader sections={sections} onSave={onSave} />);
	await user.click(screen.getByRole("button", { name: "Edit" }));
	await user.click(screen.getByRole("button", { name: "Remove point 1" }));
	const blank = screen.getByRole("textbox", { name: "Voice" });
	expect(blank).toHaveFocus();
	expect(blank).toHaveValue("");
	await user.click(screen.getByRole("button", { name: "Save" }));
	expect(onSave).toHaveBeenCalledExactlyOnceWith({ voice: "" });
});

it("preserves a draft during a refresh and sends only its edited section", async () => {
	const user = userEvent.setup();
	const onSave = vi.fn(async (change: Partial<PersonaSections>) => ({
		...sections,
		...change,
	}));
	const { rerender } = render(
		<PersonaSectionReader sections={sections} onSave={onSave} />,
	);
	const edit = screen.getByRole("button", { name: "Edit" });
	edit.focus();
	await user.keyboard("{Enter}");
	const voice = screen.getByRole("textbox", { name: "Voice" });
	expect(voice).toHaveFocus();
	expect(screen.getByRole("button", { name: "In short" })).toBeDisabled();
	await user.clear(voice);
	await user.type(voice, "Simple, grounded language.");
	const updated = { ...sections, short: "A technical lead and designer." };
	rerender(<PersonaSectionReader sections={updated} onSave={onSave} />);
	expect(voice).toHaveValue("Simple, grounded language.");
	await user.click(screen.getByRole("button", { name: "Save" }));
	expect(onSave).toHaveBeenCalledExactlyOnceWith({
		voice: "Simple, grounded language.",
	});
	await waitFor(() =>
		expect(screen.getByRole("button", { name: "Edit" })).toHaveFocus(),
	);
});

it("associates the section limit with its field and cancels back to the saved reading", async () => {
	const user = userEvent.setup();
	const onSave = vi.fn(async (change: Partial<PersonaSections>) => ({
		...sections,
		...change,
	}));
	render(<PersonaSectionReader sections={sections} onSave={onSave} />);
	await user.click(screen.getByRole("button", { name: "In short" }));
	await user.click(screen.getByRole("button", { name: "Edit" }));
	const summary = screen.getByRole("textbox", { name: "In short" });
	fireEvent.change(summary, { target: { value: "x".repeat(401) } });
	await user.click(screen.getByRole("button", { name: "Save" }));
	expect(await screen.findByRole("alert")).toHaveTextContent(
		"Keep this to 400 characters or fewer.",
	);
	expect(summary).toHaveAccessibleDescription(
		expect.stringContaining("400 characters or fewer"),
	);
	expect(summary).toHaveValue("x".repeat(401));
	await user.click(screen.getByRole("button", { name: "Cancel" }));
	expect(screen.queryByRole("textbox")).toBeNull();
	expect(screen.getByText("A technical lead.")).toBeVisible();
	expect(screen.getByRole("button", { name: "Edit" })).toHaveFocus();
	expect(onSave).not.toHaveBeenCalled();
});
