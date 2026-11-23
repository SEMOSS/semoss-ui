import { render, screen, within } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import type { SlashCommandEntry } from "./slash-command-entry";
import { filterSlashCommands, SlashCommandMenu } from "./slash-command-menu";
import { SlashCommandsContext } from "./slash-command-registry.context";

vi.mock("@semoss/i18n", () => ({
	useTranslation: () => ({ t: (key: string) => key }),
}));

/** A command with only what the menu reads. */
const command = (
	id: string,
	group: SlashCommandEntry["group"],
	label: string,
	extra: Partial<SlashCommandEntry> = {},
): SlashCommandEntry => ({
	id: id,
	group: group,
	label: label,
	icon: null,
	onExecute: vi.fn(),
	...extra,
});

const COMMANDS: SlashCommandEntry[] = [
	command("attach", "chat", "Attach files", {
		keywords: ["file", "document"],
	}),
	command("compact", "chat", "Compact", { isLockedWhileBusy: true }),
	command("files", "workbench", "Files"),
	command("settings", "workbench", "Settings", {
		keywords: ["room-options"],
	}),
	command("outlook-mail", "workbench", "Outlook"),
	...["a", "b", "c", "d", "e", "f"].map((id) =>
		command(`prompt-${id}`, "prompts", `Prompt ${id}`),
	),
];

afterEach(() => {
	vi.restoreAllMocks();
});

/** The commands' ids, in order. */
const ids = (commands: SlashCommandEntry[]) => commands.map((cmd) => cmd.id);

test("lists every group in order before anything is typed, with only the first prompts", () => {
	expect(ids(filterSlashCommands(COMMANDS, ""))).toEqual([
		"attach",
		"compact",
		"files",
		"settings",
		"outlook-mail",
		"prompt-a",
		"prompt-b",
		"prompt-c",
		"prompt-d",
		"prompt-e",
	]);
});

test("matches labels and keywords as well as ids", () => {
	expect(ids(filterSlashCommands(COMMANDS, "outl"))).toEqual([
		"outlook-mail",
	]);
	expect(ids(filterSlashCommands(COMMANDS, "document"))).toEqual(["attach"]);
	expect(ids(filterSlashCommands(COMMANDS, "room-opt"))).toEqual([
		"settings",
	]);
	expect(ids(filterSlashCommands(COMMANDS, "prompt f"))).toEqual([
		"prompt-f",
	]);
	expect(filterSlashCommands(COMMANDS, "zzz")).toEqual([]);
});

test("within a group, a command that starts with the query comes before one that only contains it", () => {
	expect(ids(filterSlashCommands(COMMANDS, "set"))).toEqual(["settings"]);
	const settingsFirst = filterSlashCommands(
		[
			command("contains", "workbench", "Your settings"),
			command("prefix", "workbench", "Settings"),
		],
		"set",
	);
	expect(ids(settingsFirst)).toEqual(["prefix", "contains"]);
});

test("the menu lists matches under their group headings, and locks busy commands", () => {
	// jsdom lays nothing out, so it has no scrolling
	Element.prototype.scrollIntoView ??= () => {};
	vi.spyOn(Element.prototype, "scrollIntoView").mockImplementation(() => {});
	render(
		<SlashCommandsContext.Provider
			value={{
				commands: COMMANDS.filter((command) => command.id !== "files"),
			}}
		>
			<SlashCommandMenu
				query=""
				selectedIndex={0}
				onItemCountChange={vi.fn()}
				onSelectedIndexChange={vi.fn()}
				onCommandSelect={vi.fn()}
				isBusy
			/>
		</SlashCommandsContext.Provider>,
	);
	const workspace = screen.getByRole("group", {
		name: "slash.groups.workbench",
	});
	expect(within(workspace).getByText("Settings")).toBeVisible();
	expect(within(workspace).queryByText("Files")).toBeNull();
	expect(screen.getByRole("option", { name: /Compact/ })).toHaveAttribute(
		"aria-disabled",
		"true",
	);
	expect(
		screen.getByRole("option", { name: /Attach files/ }),
	).toHaveAttribute("aria-disabled", "false");
});
