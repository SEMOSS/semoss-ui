import {
	type ClientToolDefinition,
	type ClientToolPolicy,
	type ClientToolProvider,
	MCP_EXECUTION_ASK,
	MCP_EXECUTION_AUTO,
	type RoomToolCall,
} from "@semoss/sdk";
import { getErrorMessage } from "@semoss/utility/error";
import { invokeCommand, isTauriRuntime } from "../../platform/tauri";

/** The desktop tools' names, which the Rust commands answer to. */
export const DESKTOP_TOOL_NAMES = {
	NOTIFY: "desktop_notify",
	REVEAL_PATH: "desktop_open_path",
} as const;

type DesktopToolName =
	(typeof DESKTOP_TOOL_NAMES)[keyof typeof DESKTOP_TOOL_NAMES];

/** Each tool's definition for the model, and how it runs. */
const DESKTOP_TOOLS: Record<
	DesktopToolName,
	{
		definition: ClientToolDefinition;
		policy: ClientToolPolicy;
		/** The Rust command and its arguments from the call's. */
		toCommand: (args: Record<string, unknown>) => {
			command: string;
			args: Record<string, unknown>;
		};
	}
> = {
	[DESKTOP_TOOL_NAMES.NOTIFY]: {
		definition: {
			name: DESKTOP_TOOL_NAMES.NOTIFY,
			title: "Show a notification",
			description:
				"Show a notification on the user's computer, such as when a long task is done.",
			inputSchema: {
				type: "object",
				properties: {
					title: { type: "string", description: "The heading." },
					body: { type: "string", description: "The message." },
				},
				required: ["title"],
			},
		},
		// it only shows the user something
		policy: "auto",
		toCommand: (args) => ({
			command: "desktop_notify",
			args: {
				title: String(args.title ?? ""),
				body: String(args.body ?? ""),
			},
		}),
	},
	[DESKTOP_TOOL_NAMES.REVEAL_PATH]: {
		definition: {
			name: DESKTOP_TOOL_NAMES.REVEAL_PATH,
			title: "Show in folder",
			description:
				"Show a file or folder on the user's computer in their file manager. It never opens or runs the file.",
			inputSchema: {
				type: "object",
				properties: {
					path: {
						type: "string",
						description: "The absolute path of the file or folder.",
					},
				},
				required: ["path"],
			},
		},
		// it reads the user's disk, so the user allows each call
		policy: "ask",
		toCommand: (args) => ({
			command: "desktop_reveal_path",
			args: { path: String(args.path ?? "") },
		}),
	},
};

/**
 * Whether a name is one of the desktop tools.
 *
 * @param name - The tool's name.
 * @returns True for a desktop tool.
 */
export const isDesktopToolName = (name: string): name is DesktopToolName =>
	name in DESKTOP_TOOLS;

/**
 * The desktop app's own client tools, run on the user's computer through
 * the app's Rust commands with no backend change: sent with every chat turn
 * and tool result beside the room's files tools, answered by `execute`
 * instead of RunMCPTool, and held for the user's approval where the tool's
 * policy says so. Outside the desktop shell it offers none.
 *
 * @returns The provider.
 */
export const createDesktopToolProvider = (): ClientToolProvider => ({
	id: "desktop",
	getTools: () =>
		isTauriRuntime()
			? Object.values(DESKTOP_TOOLS).map((tool) => tool.definition)
			: [],
	canHandle: (call) => isDesktopToolName(call.name),
	policy: (toolName) =>
		isDesktopToolName(toolName) ? DESKTOP_TOOLS[toolName].policy : "auto",
	decorateToolCall: (call: RoomToolCall): RoomToolCall => {
		if (!isDesktopToolName(call.name)) {
			return call;
		}
		const tool = DESKTOP_TOOLS[call.name];
		const isAsk = tool.policy === "ask";
		return {
			...call,
			title: tool.definition.title,
			_meta: {
				SMSS_ENGINE_NAME: "",
				SMSS_ENGINE_ID: "",
				SMSS_ENGINE_TYPE: "",
				SMSS_PROJECT_NAME: "",
				SMSS_PROJECT_ID: "",
				...call._meta,
				SMSS_MCP_EXECUTION: isAsk
					? MCP_EXECUTION_ASK
					: MCP_EXECUTION_AUTO,
				SMSS_CLIENT_TOOL: true,
				SMSS_MCP_UI: isAsk
					? { displayLocation: "inline", autoOpen: true }
					: { displayLocation: "sidebar" },
			},
		};
	},
	execute: async (call) => {
		if (!isDesktopToolName(call.name)) {
			return {
				output: `Unknown desktop tool: ${call.name}`,
				isError: true,
			};
		}
		const { command, args } = DESKTOP_TOOLS[call.name].toCommand(
			call.arguments ?? {},
		);
		try {
			const output = await invokeCommand<string>(command, args);
			return { output: output };
		} catch (error) {
			return { output: getErrorMessage(error, "Failed."), isError: true };
		}
	},
});
