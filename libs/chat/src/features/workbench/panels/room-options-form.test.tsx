import { fireEvent, render, screen, within } from "@testing-library/react";
import { type ReactNode, useState } from "react";
import { expect, test, vi } from "vitest";
import { RoomToolsConnectorsSection } from "../../../connectors/components/room-tools-connectors-section";
import { asObservableFake } from "../../../testing/observable-fake";
import { useRoomToolbox } from "../../chat-tools-ui/use-room-toolbox";
import type { RoomUiStore } from "../room-ui.store";
import { RoomOptionsForm } from "./room-options-form";

vi.mock("@semoss/i18n", () => ({
	useTranslation: () => ({
		t: (key: string, args?: Record<string, unknown>) =>
			args ? [key, ...Object.values(args)].join(" ") : key,
		i18n: { language: "en" },
	}),
}));
vi.mock("../../../host/chat.context", () => ({
	useChat: () => ({ config: { featureFlags: {}, allowedUrlPrefixes: [] } }),
}));
vi.mock("@semoss/shared", async (original) => ({
	...(await original<typeof import("@semoss/shared")>()),
	EngineSelect: () => null,
}));
vi.mock("../../../components/mcp/mcp-overlay", () => ({
	MCPOverlay: ({
		open,
		defaultTab,
		values,
		isDefaultAgent,
		onClose,
	}: {
		open: boolean;
		defaultTab: string;
		values: RoomUiStore["options"]["mcp"];
		isDefaultAgent?: boolean;
		onClose: (next?: {
			mcp: RoomUiStore["options"]["mcp"];
			workspace?: null;
			isDefaultAgent?: boolean;
		}) => void;
	}) =>
		open ? (
			<div
				role="dialog"
				aria-label={defaultTab}
				data-default-agent={String(isDefaultAgent)}
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

vi.mock("../../settings/use-open-settings", () => ({
	useOpenSettings: () => vi.fn(),
}));
vi.mock("../../../connectors/use-connector-logins", () => ({
	useConnectorLogins: vi.fn(),
}));
const signIn = vi.fn();
vi.mock("../../../connectors/use-connect-provider", () => ({
	useConnectProvider: () => signIn,
}));
vi.mock("../../chat-tools-ui/use-room-toolbox", () => ({
	useRoomToolbox: vi.fn(),
}));

const options: RoomUiStore["options"] = {
	instructions: "Keep this instruction",
	predefinedPrompts: [],
	mcp: [
		{ id: "knowledge", name: "Handbook", type: "VECTOR" },
		{ id: "tool", name: "Calculator", type: "FUNCTION" },
		{
			id: "agent-tool",
			name: "Agent search",
			type: "FUNCTION",
			fromWorkspace: true,
		},
		{
			id: "agent",
			name: "Inherited search",
			type: "VECTOR",
			fromWorkspace: true,
		},
		{ id: "room", name: "Room files", type: "ROOM", fromRoom: true },
	],
};
function Settings({
	disabled = false,
	isAgentMode = false,
	initialOptions = options,
	integrationSections,
	onOptionsChange,
}: {
	disabled?: boolean;
	isAgentMode?: boolean;
	initialOptions?: RoomUiStore["options"];
	integrationSections?: ReactNode;
	onOptionsChange?: (next: Partial<RoomUiStore["options"]>) => void;
}) {
	const [value, setValue] = useState(initialOptions);
	return (
		<RoomOptionsForm
			model={null}
			onModelChange={vi.fn()}
			options={value}
			onOptionsChange={(next) => {
				onOptionsChange?.(next);
				setValue((previous) => ({ ...previous, ...next }));
			}}
			disabled={disabled}
			isAgentMode={isAgentMode}
			integrationSections={integrationSections}
		/>
	);
}

test("lists separate selected resources and removes only the chosen local selection", () => {
	render(<Settings />);
	const knowledge = screen.getByRole("region", {
		name: "room:form.knowledgeLabel 2",
	});
	const toolboxes = screen.getByRole("region", {
		name: "sections.toolboxes.title",
	});
	const agent = screen.getByRole("region", {
		name: "sections.agent.title",
	});
	expect(within(knowledge).getByText("Handbook")).toBeVisible();
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
		load: load,
	});
	const connectors = asObservableFake({
		services: ["outlook"],
		isSavingConnectors: false,
		connectedProviders: [],
		isProviderOffered: () => true,
		isServiceCovered: () => true,
	});
	// a room running the connectors integration
	const room = asObservableFake({
		getIntegration: () => ({ id: "connectors", store: connectors }),
	}) as unknown as RoomUiStore;
	const onOptionsChange = vi.fn();
	const onSubmit = vi.fn((event: SubmitEvent) => event.preventDefault());
	const { container } = render(
		<Settings
			integrationSections={<RoomToolsConnectorsSection room={room} />}
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
	const props = {
		model: null,
		onModelChange: vi.fn(),
		options,
		onOptionsChange,
		agentEditable: true,
		onDefaultAgentChange,
	};
	const { rerender } = render(<RoomOptionsForm {...props} />);
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
	rerender(<RoomOptionsForm {...props} isAgentMode />);
	expect(
		screen.getByRole("button", { name: "room:form.agentLabel" }),
	).toHaveTextContent("room:modes.defaultAgent");
});
