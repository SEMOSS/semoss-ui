import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { expect, test, vi } from "vitest";
import {
	type ChatConfig,
	ChatConfigContext,
} from "../../../chat/config/chat-config.context";
import { DEFAULT_CHAT_THEME } from "../../../chat/config/chat-theme";
import { RoomStore } from "../../../room/store/room.store";
import type { NewRoomWorkbenchPanels } from "../../../workbench/rail/use-workbench-panels";
import { FileDropProvider } from "../../attachments/file-drop.context";
import {
	type Composer,
	ComposerContext,
	ComposerWorkbenchContext,
} from "../composer.context";
import { DefaultSlashCommands } from "./default-slash-commands";
import { SlashCommand } from "./slash-command";
import { useSlashCommands } from "./slash-command.context";
import { SlashCommandRegistryProvider } from "./slash-command-registry";

vi.mock("@semoss/i18n", () => ({
	useTranslation: () => ({ t: (key: string) => key }),
	getI18n: () => ({ t: (key: string) => key }),
}));

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
	room: room,
	isNewChat: false,
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

/** The ids the composer's "/" menu lists, with the given commands in its slot. */
const renderCommands = ({
	commands = <DefaultSlashCommands />,
	composer,
	newRoomPanels,
	config = {},
}: {
	commands?: ReactNode;
	composer?: Partial<Composer>;
	newRoomPanels?: NewRoomWorkbenchPanels;
	config?: Partial<ChatConfig>;
} = {}): string[] => {
	const room = new RoomStore({
		theme: DEFAULT_CHAT_THEME,
		roomId: "slash-commands",
		panelComponents: {},
	});
	render(
		<ChatConfigContext.Provider
			value={{ theme: DEFAULT_CHAT_THEME, ...config } as ChatConfig}
		>
			<FileDropProvider>
				<ComposerContext.Provider
					value={createComposer(room, composer)}
				>
					<ComposerWorkbenchContext.Provider
						value={{ room: room, newRoomPanels: newRoomPanels }}
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
		theme: DEFAULT_CHAT_THEME,
		roomId: "new-room",
		panelComponents: {},
	}).connectors;
	const newRoomPanels = {
		onOpenPanel: vi.fn(),
		isBusy: true,
		connectors,
		prepareRoom: vi.fn(async () => null),
	};
	const busyIds = renderCommands({
		newRoomPanels,
		composer: { isNewChat: true, compact: null },
	});
	expect(busyIds).toContain("settings");
	expect(busyIds).not.toContain("files");
	expect(busyIds).not.toContain("activity");
	// outside a room there are no room actions
	expect(busyIds).not.toContain("favorite");
});

test("a draft switches mode from the menu only where the theme lets users choose", () => {
	const agentTheme = {
		...DEFAULT_CHAT_THEME,
		featureFlags: {
			...DEFAULT_CHAT_THEME.featureFlags,
			enableAgentHarness: true,
		},
	};
	const draft = { isNewChat: true, compact: null, switchToChat: vi.fn() };
	expect(renderCommands({ composer: draft })).not.toContain("agent-harness");
	document.body.innerHTML = "";
	expect(
		renderCommands({ composer: draft, config: { theme: agentTheme } }),
	).toContain("agent-harness");
	document.body.innerHTML = "";
	expect(
		renderCommands({
			composer: { ...draft, isAgentMode: true },
			config: { theme: agentTheme },
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
