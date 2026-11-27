import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { expect, test, vi } from "vitest";
import { testChatOptions } from "../../../../test/chat-options";
import {
	ChatConfigContext,
	type ResolvedChatConfig,
} from "../../../chat/config/chat-config.context";
import { RoomStore } from "../../../room/store/room.store";
import { ROOM_PANEL_TYPES } from "../../../room/store/room-workbench-layout";
import { DEFAULT_WORKBENCH_PANELS } from "../../../workbench/panels/default-workbench-panels";
import type { DraftWorkbenchPanels } from "../../../workbench/rail/use-workbench-panels";
import { FileDropProvider } from "../../attachments/file-drop.context";
import {
	type Composer,
	ComposerContext,
	ComposerWorkbenchContext,
} from "../composer.context";
import { DefaultSlashCommands } from "./default-slash-commands";
import { SlashCommand } from "./slash-command";
import {
	SlashCommandRegistryProvider,
	useSlashCommands,
} from "./slash-command-registry.context";

/** Lists the ids the slash menu reads, in its order. */
const CommandIds = () => (
	<output aria-label="commands">
		{useSlashCommands()
			.commands.map((command) => command.id)
			.join(",")}
	</output>
);

/** A composer for a room or a draft, with no-op actions. */
const createComposer = (
	room: RoomStore,
	overrides: Partial<Composer> = {},
): Composer => ({
	room,
	isDraft: false,
	isBusy: false,
	options: room.options,
	agentTools: [],
	isAgentMode: false,
	agent: { kind: "fixed" },
	closeMenu: vi.fn(),
	openPicker: vi.fn(),
	switchToAgent: vi.fn(),
	switchToChat: null,
	compact: vi.fn(),
	prompts: [],
	runPrompt: vi.fn(),
	prepareRoom: vi.fn(async () => room),
	...overrides,
});

/** The activity log's blueprint alone, so a room offers its panel. */
const ACTIVITY_LOG_PANEL = {
	[ROOM_PANEL_TYPES.ACTIVITY_LOG]:
		DEFAULT_WORKBENCH_PANELS[ROOM_PANEL_TYPES.ACTIVITY_LOG],
};

/** The ids the composer's "/" menu lists, with the given commands in its slot. */
const renderCommands = ({
	commands = <DefaultSlashCommands />,
	composer,
	draftPanels,
	config = {},
}: {
	commands?: ReactNode;
	composer?: Partial<Composer>;
	draftPanels?: DraftWorkbenchPanels;
	config?: Partial<ResolvedChatConfig>;
} = {}): string[] => {
	const room = new RoomStore({
		chatOptions: testChatOptions(),
		roomId: "slash-commands",
		workbenchPanels: ACTIVITY_LOG_PANEL,
	});
	render(
		<ChatConfigContext.Provider
			value={
				{ options: testChatOptions(), ...config } as ResolvedChatConfig
			}
		>
			<FileDropProvider>
				<ComposerContext.Provider
					value={createComposer(room, composer)}
				>
					<ComposerWorkbenchContext.Provider
						value={{ room: room, draftPanels: draftPanels }}
					>
						<SlashCommandRegistryProvider commands={commands}>
							<CommandIds />
						</SlashCommandRegistryProvider>
					</ComposerWorkbenchContext.Provider>
				</ComposerContext.Provider>
			</FileDropProvider>
		</ChatConfigContext.Provider>,
	);
	const text = screen.getByLabelText("commands").textContent ?? "";
	return text ? text.split(",") : [];
};

test("an open room's slash menu lists today's commands in today's order", () => {
	expect(renderCommands()).toEqual([
		"attach",
		"knowledge",
		"toolbox",
		"compact",
		"files",
		"settings",
		"activity",
	]);
});

test("a draft's slash menu leaves out panels that wait for its room while it prepares", () => {
	const connectors = new RoomStore({
		chatOptions: testChatOptions(),
		roomId: "new-room",
		workbenchPanels: ACTIVITY_LOG_PANEL,
	}).connectors;
	const draftPanels = {
		onOpenPanel: vi.fn(),
		isBusy: true,
		connectors,
		prepareRoom: vi.fn(async () => null),
	};
	const busyIds = renderCommands({
		draftPanels,
		composer: { isDraft: true, compact: null },
	});
	expect(busyIds).toContain("settings");
	expect(busyIds).not.toContain("files");
	expect(busyIds).not.toContain("activity");
	// outside a room there are no room actions
	expect(busyIds).not.toContain("favorite");
});

test("a draft switches mode from the menu only where the host lets users choose", () => {
	const choice = { options: testChatOptions({ agentMode: "choice" }) };
	const draft = { isDraft: true, compact: null, switchToChat: vi.fn() };
	expect(renderCommands({ composer: draft })).not.toContain("agent-harness");
	document.body.innerHTML = "";
	expect(renderCommands({ composer: draft, config: choice })).toContain(
		"agent-harness",
	);
	document.body.innerHTML = "";
	expect(
		renderCommands({
			composer: { ...draft, isAgentMode: true },
			config: choice,
		}),
	).toContain("chat-mode");
});

test("a host's slot lists its own commands beside the chat's, in the order placed", () => {
	const ids = renderCommands({
		commands: (
			<>
				<SlashCommand
					name="host-first"
					group="chat"
					label="First"
					icon={null}
					onSelect={vi.fn()}
				/>
				<DefaultSlashCommands />
				<SlashCommand
					name="host-last"
					group="chat"
					label="Last"
					icon={null}
					onSelect={vi.fn()}
				/>
			</>
		),
	});
	expect(ids.slice(0, 2)).toEqual(["host-first", "attach"]);
	expect(ids).toContain("host-last");
	expect(ids.indexOf("host-last")).toBeGreaterThan(ids.indexOf("compact"));
});
