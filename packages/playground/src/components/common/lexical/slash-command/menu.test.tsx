import { render, screen, within } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { SlashCommandProvider } from "./context";
import { filterSlashCommands, SlashCommandMenu } from "./menu";
import type { SlashCommand } from "./types";

vi.mock("@semoss/i18n", () => ({
	useTranslation: () => ({ t: (key: string) => key }),
}));

/** A command with only what the menu reads. */
const command = (
	id: string,
	group: SlashCommand["group"],
	label: string,
	extra: Partial<SlashCommand> = {},
): SlashCommand => ({
	id: id,
	group: group,
	label: label,
	icon: null,
	onExecute: vi.fn(),
	...extra,
});

const COMMANDS: SlashCommand[] = [
	command("attach", "chat", "Attach files", {
		keywords: ["file", "document"],
	}),
	command("compact", "chat", "Compact", { isLockedWhileBusy: true }),
	command("files", "workspace", "Files"),
	command("settings", "workspace", "Settings", {
		keywords: ["room-options"],
	}),
	command("outlook-mail", "workspace", "Outlook"),
	...["a", "b", "c", "d", "e", "f"].map((id) =>
		command(`prompt-${id}`, "prompts", `Prompt ${id}`),
	),
];

afterEach(() => {
	vi.restoreAllMocks();
});

const ids = (commands: SlashCommand[]) => commands.map((cmd) => cmd.id);

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
			command("contains", "workspace", "Your settings"),
			command("prefix", "workspace", "Settings"),
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
		<SlashCommandProvider commands={COMMANDS} excludeCommandIds={["files"]}>
			<SlashCommandMenu
				query=""
				selectedIndex={0}
				setItemCount={vi.fn()}
				setSelectedIndex={vi.fn()}
				onCommandSelect={vi.fn()}
				isBusy
			/>
		</SlashCommandProvider>,
	);
	const workspace = screen.getByRole("group", {
		name: "slash.groups.workspace",
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
