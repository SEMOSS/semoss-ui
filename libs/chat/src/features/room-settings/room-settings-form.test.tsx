import { fireEvent, render, screen, within } from "@testing-library/react";
import { type ReactNode, useState } from "react";
import { expect, test, vi } from "vitest";
import { testChatOptions } from "../../test/chat-options";
import type { RoomStore } from "../room/store/room.store";
import type { AgentChoice } from "../tools/mcp/agent-choice";
import { RoomSettingsForm } from "./room-settings-form";
import { RoomToolsConnectorsSection } from "./tools/room-tools-connectors-section";
import { useRoomToolbox } from "./tools/use-room-toolbox";

vi.mock("@semoss/i18n", () => ({
	useTranslation: () => ({
		t: (key: string, args?: Record<string, unknown>) =>
			args ? [key, ...Object.values(args)].join(" ") : key,
		i18n: { language: "en" },
	}),
}));
vi.mock("../chat/config/chat-config.context", async (original) => ({
	...(await original<typeof import("../chat/config/chat-config.context")>()),
	useChatConfig: () => ({
		options: testChatOptions({ isModelSelectable: false }),
		callbacks: { onOpenSettings: vi.fn() },
	}),
}));
vi.mock("@semoss/shared", async (original) => ({
	...(await original<typeof import("@semoss/shared")>()),
	EngineSelect: () => null,
}));
vi.mock("../tools/mcp/mcp-overlay", () => ({
	MCPOverlay: ({
		open,
		defaultTab,
		values,
		agent,
		onClose,
	}: {
		open: boolean;
		defaultTab: string;
		values: RoomStore["options"]["mcp"];
		agent: AgentChoice;
		onClose: (next?: {
			mcp: RoomStore["options"]["mcp"];
			workspace?: null;
			isDefaultAgent?: boolean;
		}) => void;
	}) =>
		open ? (
			<div
				role="dialog"
				aria-label={defaultTab}
				data-default-agent={String(
					agent.kind === "savedOrDefault" && agent.isDefaultAgent,
				)}
			>
				<button type="button" onClick={() => onClose()}>
					Cancel
				</button>
				<button
					type="button"
					onClick={() =>
						onClose({
							mcp: values,
							workspace: null,
							isDefaultAgent: true,
						})
					}
				>
					Save Default Agent
				</button>
			</div>
		) : null,
}));

vi.mock("../connectors/accounts/use-connector-logins", () => ({
	useConnectorLogins: vi.fn(),
}));
const signIn = vi.fn();
vi.mock("../connectors/accounts/use-connect-provider", () => ({
	useConnectProvider: () => signIn,
}));
vi.mock("./tools/use-room-toolbox", () => ({
	useRoomToolbox: vi.fn(),
}));

/** Knowledge, an added toolbox, and the room's own. */
const options: RoomStore["options"] = {
	instructions: "Keep this instruction",
	predefinedPrompts: [],
	mcp: [
		{ id: "knowledge", name: "Handbook", type: "VECTOR" },
		{ id: "tool", name: "Calculator", type: "FUNCTION" },
		// the agent brings this one too, so it is listed as the agent's
		{ id: "agent", name: "Room copy", type: "VECTOR" },
		{ id: "room", name: "Room files", type: "ROOM", fromRoom: true },
	],
};

/** The agent's toolbox and knowledge. */
const agentTools: RoomStore["agentTools"] = [
	{ id: "agent-tool", name: "Agent search", type: "FUNCTION" },
	{ id: "agent", name: "Inherited search", type: "VECTOR" },
];
/** The form over local state, as a room keeps its options, reporting each change. */
function Settings({
	disabled = false,
	isAgentMode = false,
	initialOptions = options,
	initialAgentTools = agentTools,
	connectorsSection,
	onOptionsChange,
}: {
	disabled?: boolean;
	isAgentMode?: boolean;
	initialOptions?: RoomStore["options"];
	initialAgentTools?: RoomStore["agentTools"];
	connectorsSection?: ReactNode;
	onOptionsChange?: (next: Partial<RoomStore["options"]>) => void;
}) {
	const [value, setValue] = useState(initialOptions);
	return (
		<RoomSettingsForm
			session={{
				model: null,
				onModelChange: vi.fn(),
				options: value,
				agentTools: initialAgentTools,
				onOptionsChange: (next) => {
					onOptionsChange?.(next);
					setValue((previous) => ({ ...previous, ...next }));
				},
				isAgentMode,
				agent: { kind: "fixed" },
			}}
			disabled={disabled}
			connectorsSection={connectorsSection}
		/>
	);
}

test("lists separate selected resources and removes only the chosen local selection", () => {
	render(<Settings />);
	const knowledge = screen.getByRole("region", {
		name: /^room:form\.knowledgeLabel\s*2$/,
	});
	const toolboxes = screen.getByRole("region", {
		name: "sections.toolboxes.title",
	});
	const agent = screen.getByRole("region", {
		name: "sections.agent.title",
	});
	expect(within(knowledge).getByText("Handbook")).toBeVisible();
	// the agent's knowledge comes first, and hides the room's of the same id
	expect(
		within(knowledge)
			.getAllByRole("listitem")
			.map((item) => item.textContent),
	).toEqual([
		expect.stringContaining("Inherited search"),
		expect.stringContaining("Handbook"),
	]);
	expect(within(knowledge).queryByText("Room copy")).toBeNull();
	expect(
		within(knowledge).getByText("common:badges.fromAgent"),
	).toBeVisible();
	expect(within(toolboxes).getByText("Calculator")).toBeVisible();
	expect(within(toolboxes).queryByText("Agent search")).toBeNull();
	expect(within(agent).getByText("Agent search")).toBeVisible();
	expect(
		screen.queryByRole("button", {
			name: /removeSelection Agent search/,
		}),
	).toBeNull();
	// the room's own toolbox is listed under Connectors instead
	expect(screen.queryByText("Room files")).toBeNull();
	expect(
		screen.queryByRole("button", {
			name: /removeSelection Inherited search/,
		}),
	).toBeNull();
	fireEvent.click(
		screen.getByRole("button", {
			name: "room:settings.removeSelection Handbook",
		}),
	);
	expect(screen.queryByText("Handbook")).toBeNull();
	expect(screen.getByText("Inherited search")).toBeVisible();
	fireEvent.click(
		screen.getByRole("button", {
			name: "room:settings.removeSelection Calculator",
		}),
	);
	expect(screen.queryByText("Calculator")).toBeNull();
	// the last added toolbox gone, the section goes too
	expect(
		screen.queryByRole("region", {
			name: "sections.toolboxes.title",
		}),
	).toBeNull();
	expect(screen.getByLabelText("room:form.instructionsLabel")).toHaveValue(
		"Keep this instruction",
	);
	expect(
		screen.getByLabelText("room:form.instructionsLabel"),
	).toHaveAttribute("rows", "3");
});

test("routes Add to the right overlay without changing selections on Cancel", () => {
	render(<Settings />);
	for (const [label, tab] of [
		["room:menuKnowledge.addKnowledge", "KNOWLEDGE"],
		["room:menuToolbox.addToolbox", "TOOLBOX"],
	]) {
		fireEvent.click(screen.getByRole("button", { name: label }));
		expect(screen.getByRole("dialog", { name: tab })).toBeVisible();
		fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
	}
	expect(screen.getByText("Handbook")).toBeVisible();
	expect(screen.getByText("Calculator")).toBeVisible();
});

test("running chats keep selections visible and disable all edits", () => {
	render(<Settings disabled />);
	expect(screen.getByText("Handbook")).toBeVisible();
	expect(
		screen.getByRole("button", {
			name: "room:settings.removeSelection Handbook",
		}),
	).toBeDisabled();
	expect(
		screen.getByRole("button", {
			name: "room:settings.removeSelection Calculator",
		}),
	).toBeDisabled();
	expect(
		screen.getByRole("button", { name: "room:menuKnowledge.addKnowledge" }),
	).toBeDisabled();
	expect(
		screen.getByRole("button", { name: "room:menuToolbox.addToolbox" }),
	).toBeDisabled();
	expect(screen.getByLabelText("room:form.instructionsLabel")).toBeDisabled();
	for (const select of screen.getAllByRole("combobox"))
		expect(select).toBeDisabled();
	// the tools can still be browsed and explained while a response runs
	for (const name of [
		"sections.default.title",
		"sections.toolboxes.title",
		"sections.agent.title",
		"tools.titles.folder_list",
		/^Calculator/,
		/^Agent search/,
		"sections.about room:settings.toolsTitle",
	])
		expect(screen.getByRole("button", { name: name })).toBeEnabled();
});

test("agent mode notes its own tools in place of the default tools", () => {
	const { rerender } = render(<Settings />);
	const defaults = () =>
		screen.getByRole("region", { name: "sections.default.title" });
	expect(within(defaults()).getAllByRole("combobox")).toHaveLength(8);
	expect(
		within(defaults()).queryByText("sections.default.agentNote"),
	).toBeNull();
	rerender(<Settings isAgentMode />);
	expect(within(defaults()).queryAllByRole("combobox")).toHaveLength(0);
	expect(
		within(defaults()).getByText("sections.default.agentNote"),
	).toBeVisible();
});

test("every default tool is a row with its mode in the mode column, and the section collapses", () => {
	render(
		<Settings
			initialOptions={{
				...options,
				defaultTools: { folder_read: "disabled" },
			}}
		/>,
	);
	const defaults = screen.getByRole("region", {
		name: "sections.default.title",
	});
	// the select is named by its tool (and, in browsers, the mode it shows)
	expect(
		within(defaults).getByRole("combobox", {
			name: /^tools\.titles\.folder_read/,
		}),
	).toHaveTextContent("defaultTools.modes.disabled");
	fireEvent.click(
		within(defaults).getByRole("button", {
			name: "tools.titles.folder_read",
		}),
	);
	expect(within(defaults).getByText("folder_read")).toBeVisible();

	const toggle = within(defaults).getByRole("button", {
		name: "sections.default.title",
	});
	expect(toggle).toHaveAttribute("aria-expanded", "true");
	fireEvent.click(toggle);
	expect(toggle).toHaveAttribute("aria-expanded", "false");
	expect(within(defaults).queryAllByRole("combobox")).toHaveLength(0);
});

test("leaves out the Agent and Toolboxes sections when they hold nothing", () => {
	render(
		<Settings
			initialOptions={{
				...options,
				mcp: [{ id: "knowledge", name: "Handbook", type: "VECTOR" }],
			}}
			initialAgentTools={[]}
		/>,
	);
	expect(
		screen.getByRole("region", { name: "sections.default.title" }),
	).toBeVisible();
	expect(
		screen.queryByRole("region", { name: "sections.agent.title" }),
	).toBeNull();
	expect(
		screen.queryByRole("region", {
			name: "sections.toolboxes.title",
		}),
	).toBeNull();
	expect(
		screen.getByRole("button", { name: "room:menuToolbox.addToolbox" }),
	).toBeEnabled();
});

test("the Connectors section's Refresh and Sign In never submit the form", () => {
	const load = vi.fn();
	vi.mocked(useRoomToolbox).mockReturnValue({
		status: "ready",
		tools: [
			{
				name: "MicrosoftOutlookListMail",
				reactor: "MicrosoftOutlookListMail",
				title: "List Mail",
				description: "",
				execution: "auto",
				parameters: [],
			},
		],
		load,
	});
	const room = {
		connectors: {
			// a fixed store: its snapshot is itself
			getSnapshot() {
				return this;
			},
			subscribe: () => () => {},
			services: ["outlook"],
			isSavingConnectors: false,
			connectedProviders: [],
			isProviderOffered: () => true,
			isServiceCovered: () => true,
		},
	} as unknown as RoomStore;
	const onOptionsChange = vi.fn();
	const onSubmit = vi.fn((event: SubmitEvent) => event.preventDefault());
	const { container } = render(
		<Settings
			connectorsSection={<RoomToolsConnectorsSection room={room} />}
			onOptionsChange={onOptionsChange}
		/>,
	);
	container.querySelector("form")?.addEventListener("submit", onSubmit);

	fireEvent.click(
		screen.getByRole("button", { name: "common:buttons.refresh" }),
	);
	fireEvent.click(
		screen.getByRole("button", { name: "chatConnectors:signIn.action" }),
	);

	expect(load).toHaveBeenCalledTimes(1);
	expect(signIn).toHaveBeenCalledWith("MICROSOFT");
	expect(onSubmit).not.toHaveBeenCalled();
	expect(onOptionsChange).not.toHaveBeenCalled();
});

test("a new chat's Settings reports Default Agent and names it once picked", () => {
	const onDefaultAgentChange = vi.fn();
	const onOptionsChange = vi.fn();
	const session = {
		model: null,
		onModelChange: vi.fn(),
		options,
		agentTools: [],
		onOptionsChange,
		isAgentMode: false,
		agent: { kind: "savedOrDefault", isDefaultAgent: false } as const,
		onDefaultAgentChange,
	};
	const { rerender } = render(<RoomSettingsForm session={session} />);
	const agent = screen.getByRole("button", { name: "room:form.agentLabel" });
	expect(agent).toHaveTextContent("room:menuWorkspace.selectAgent");
	fireEvent.click(agent);
	expect(screen.getByRole("dialog", { name: "AGENT" })).toHaveAttribute(
		"data-default-agent",
		"false",
	);
	fireEvent.click(screen.getByRole("button", { name: "Save Default Agent" }));
	expect(onOptionsChange).toHaveBeenCalledWith({
		mcp: options.mcp,
		workspace: undefined,
	});
	expect(onDefaultAgentChange).toHaveBeenCalledExactlyOnceWith(true);
	rerender(
		<RoomSettingsForm
			session={{
				...session,
				isAgentMode: true,
				agent: { kind: "savedOrDefault", isDefaultAgent: true },
			}}
		/>,
	);
	expect(
		screen.getByRole("button", { name: "room:form.agentLabel" }),
	).toHaveTextContent("room:modes.defaultAgent");
});
