import type { UserPixelMcpTool } from "@semoss/sdk";
import { isRecord } from "@semoss/utility/object";

/** An account system the connectors sign in to. */
export type ConnectorProviderId = "MICROSOFT" | "GOOGLE";

/** One app the assistant can use through a provider. */
export type ConnectorServiceId =
	| "outlook"
	| "outlook-calendar"
	| "onedrive"
	| "teams"
	| "gmail"
	| "google-calendar"
	| "google-drive"
	| "google-docs";

/** How a connector tool runs: on its own, or once the user approves it. */
export type ConnectorToolExecution = "auto" | "ask";

/** One reactor a service exposes as a tool. */
export interface ConnectorTool {
	/** The reactor the tool runs. It is also the tool's name in the room. */
	reactor: string;
	/** Whether the call waits for the user. */
	execution: ConnectorToolExecution;
	/**
	 * Whether the reactor names its own view, as every mail and calendar reactor
	 * does, so the toolbox keeps where and how the reactor shows its calls.
	 */
	declaresView?: boolean;
}

/** An app within a provider, and the tools it brings. */
export interface ConnectorService {
	id: ConnectorServiceId;
	provider: ConnectorProviderId;
	/**
	 * Key `connectorAccess` in `/api/config` reports the service under, within
	 * its provider.
	 */
	accessKey: string;
	tools: readonly ConnectorTool[];
}

/** How the UI and the backend refer to a provider. */
export interface ConnectorProvider {
	id: ConnectorProviderId;
	/** Key `/api/auth/logins` reports the provider's session login under. */
	loginKey: string;
	/** Keys `availableProviders` in `/api/config` may list the provider under. */
	configKeys: readonly string[];
	/** Segment of `/api/auth/login/{segment}` that starts its sign in. */
	loginPath: string;
	/** Provider key for `LoginProviderIcon`. */
	logo: string;
	/** The provider's services, in display order. */
	services: readonly ConnectorServiceId[];
}

/**
 * Read tools run on their own. Anything that sends, invites, shares, uploads,
 * moves, or deletes asks first, so the assistant can prepare it but never do it
 * behind the user's back.
 */
const auto = (reactor: string): ConnectorTool => ({
	reactor: reactor,
	execution: "auto",
});
const ask = (reactor: string): ConnectorTool => ({
	reactor: reactor,
	execution: "ask",
});

/** An operation every mailbox or calendar offers, and whether it asks first. */
type ConnectorOperation = readonly [
	operation: string,
	execution: ConnectorToolExecution,
];

/**
 * The mail operations every mailbox offers. Each mailbox's reactor for one is
 * named after the mailbox, such as `MicrosoftOutlookListMail` and
 * `GoogleGmailListMail`, takes the same keys, and answers the same way.
 */
const MAIL_OPERATIONS: readonly ConnectorOperation[] = [
	["ListMail", "auto"],
	["GetMail", "auto"],
	["ListMailFolders", "auto"],
	["DownloadAttachment", "auto"],
	["SaveDraft", "auto"],
	["MarkMailRead", "auto"],
	["SendMail", "ask"],
	["SendDraft", "ask"],
	["ReplyMail", "ask"],
	["ForwardMail", "ask"],
	["MoveMail", "ask"],
	["DeleteMail", "ask"],
];

/** The calendar operations every calendar offers, named the same way. */
const CALENDAR_OPERATIONS: readonly ConnectorOperation[] = [
	["ListCalendars", "auto"],
	["ListEvents", "auto"],
	["GetEvent", "auto"],
	["GetSchedule", "auto"],
	["ListPermissions", "auto"],
	["CreateEvent", "ask"],
	["UpdateEvent", "ask"],
	["RespondToEvent", "ask"],
	["DeleteEvent", "ask"],
];

/**
 * One app's reactor for each operation.
 *
 * @param prefix - What the app's reactor names start with, such as `GoogleGmail`.
 * @param operations - The operations the app offers.
 * @return The app's tools.
 */
const operationTools = (
	prefix: string,
	operations: readonly ConnectorOperation[],
): ConnectorTool[] =>
	operations.map(([operation, execution]) => ({
		reactor: `${prefix}${operation}`,
		execution: execution,
		declaresView: true,
	}));

/**
 * Every service the playground can switch on. Outlook and Gmail offer the same
 * mail tools, and the two calendars the same calendar tools. Reactors that
 * write to or read from arbitrary server paths (`GoogleDriveDownload`,
 * `GoogleDriveUpload`) are left out: a room tool should only touch the room,
 * and the Microsoft equivalents already confine files to the room's folder.
 */
export const CONNECTOR_SERVICES: readonly ConnectorService[] = [
	{
		id: "outlook",
		provider: "MICROSOFT",
		accessKey: "outlook",
		tools: operationTools("MicrosoftOutlook", MAIL_OPERATIONS),
	},
	{
		id: "outlook-calendar",
		provider: "MICROSOFT",
		accessKey: "calendar",
		tools: operationTools("MicrosoftCalendar", CALENDAR_OPERATIONS),
	},
	{
		id: "onedrive",
		provider: "MICROSOFT",
		accessKey: "onedrive",
		tools: [
			auto("MicrosoftOneDriveListDrives"),
			auto("MicrosoftOneDriveListFiles"),
			auto("MicrosoftOneDriveListSharedFiles"),
			auto("MicrosoftOneDriveSearchFiles"),
			auto("MicrosoftOneDriveGetFile"),
			auto("MicrosoftOneDriveDownloadFile"),
			ask("MicrosoftOneDriveCreateFolder"),
			ask("MicrosoftOneDriveUploadFile"),
			ask("MicrosoftOneDriveShareFile"),
			ask("MicrosoftOneDriveDeleteFile"),
		],
	},
	{
		id: "teams",
		provider: "MICROSOFT",
		accessKey: "teams",
		tools: [
			auto("MicrosoftTeamsListTeams"),
			auto("MicrosoftTeamsListChannels"),
			auto("MicrosoftTeamsListFiles"),
			auto("MicrosoftTeamsDownloadFile"),
			auto("MicrosoftTeamsListChats"),
			auto("MicrosoftTeamsGetChat"),
			auto("MicrosoftTeamsListChatMessages"),
			auto("MicrosoftTeamsGetChatMessage"),
			auto("MicrosoftTeamsListChannelMessages"),
			auto("MicrosoftTeamsGetChannelMessage"),
			auto("MicrosoftTeamsDownloadMessageAttachment"),
			ask("MicrosoftTeamsUploadFile"),
			ask("MicrosoftTeamsCreateChat"),
			ask("MicrosoftTeamsSendChatMessage"),
			ask("MicrosoftTeamsSendChannelMessage"),
			ask("MicrosoftTeamsDeleteChatMessage"),
			ask("MicrosoftTeamsDeleteChannelMessage"),
		],
	},
	{
		id: "gmail",
		provider: "GOOGLE",
		accessKey: "gmail",
		tools: [
			...operationTools("GoogleGmail", MAIL_OPERATIONS),
			auto("GoogleGmailProfileById"),
		],
	},
	{
		id: "google-calendar",
		provider: "GOOGLE",
		accessKey: "calendar",
		tools: operationTools("GoogleCalendar", CALENDAR_OPERATIONS),
	},
	{
		id: "google-drive",
		provider: "GOOGLE",
		accessKey: "drive",
		tools: [
			auto("GoogleDriveList"),
			auto("GoogleDriveRead"),
			ask("GoogleDriveDelete"),
		],
	},
	{
		id: "google-docs",
		provider: "GOOGLE",
		accessKey: "docs",
		tools: [
			auto("GoogleDocsList"),
			auto("GoogleDocsRead"),
			ask("GoogleDocsCreate"),
			ask("GoogleDocsUpdate"),
			ask("GoogleDocsDelete"),
		],
	},
];

/** The two providers, in display order. */
export const CONNECTOR_PROVIDERS: readonly ConnectorProvider[] = [
	{
		id: "MICROSOFT",
		loginKey: "MICROSOFT",
		configKeys: ["ms", "microsoft"],
		loginPath: "microsoft",
		logo: "microsoft",
		services: ["outlook", "outlook-calendar", "onedrive", "teams"],
	},
	{
		id: "GOOGLE",
		loginKey: "GOOGLE",
		configKeys: ["google"],
		loginPath: "google",
		logo: "google",
		services: ["gmail", "google-calendar", "google-drive", "google-docs"],
	},
];

const SERVICES_BY_ID = new Map(
	CONNECTOR_SERVICES.map((service) => [service.id, service]),
);

const TOOLS_BY_REACTOR = new Map(
	CONNECTOR_SERVICES.flatMap((service) =>
		service.tools.map((tool) => [tool.reactor, { service, tool }] as const),
	),
);

/**
 * Where the user's connector tools live, in their own asset folder. Every chat
 * of theirs holds a copy in its own tool file.
 */
export const USER_CONNECTORS_PATH = "/mcp/playground_connector_mcp.json";

/**
 * The `SMSS_MCP_GENERATOR` the connector tools carry, in the user's file and in
 * each chat's copy, which tells them apart from every other tool there.
 */
export const CONNECTORS_GENERATOR = "PlaygroundConnectors";

/**
 * A service by id.
 *
 * @param id - The service.
 * @return Its catalog entry, or undefined for an unknown id.
 */
export const getConnectorService = (id: string): ConnectorService | undefined =>
	SERVICES_BY_ID.get(id as ConnectorServiceId);

/**
 * Whether this deployment offers signing in with a provider, going by the
 * OAuth providers `/api/config` lists.
 *
 * @param availableProviders - The deployment's providers, from the SDK's
 * system config.
 * @param provider - The provider to look for.
 * @return True when the provider can be signed in to.
 */
export const isProviderOffered = (
	availableProviders:
		| readonly { provider: string; isOauth: boolean }[]
		| undefined,
	provider: ConnectorProvider,
): boolean =>
	(availableProviders ?? []).some(
		(entry) =>
			entry.isOauth &&
			provider.configKeys.includes(entry.provider.toLowerCase()),
	);

/**
 * A provider by id.
 *
 * @param id - The provider.
 * @return Its catalog entry.
 */
export const getConnectorProvider = (
	id: ConnectorProviderId,
): ConnectorProvider => {
	const provider = CONNECTOR_PROVIDERS.find(
		(candidate) => candidate.id === id,
	);
	if (!provider) {
		throw new Error(`Unknown connector provider ${id}`);
	}
	return provider;
};

/**
 * The service and policy behind a connector tool.
 *
 * @param reactor - The reactor a tool runs.
 * @return The catalog entry, or undefined when the reactor is not a connector.
 */
export const findConnectorTool = (
	reactor: string | undefined,
): { service: ConnectorService; tool: ConnectorTool } | undefined =>
	reactor ? TOOLS_BY_REACTOR.get(reactor) : undefined;

/** A reactor's words: `MicrosoftOutlookListMail` is Microsoft Outlook List Mail. */
const splitReactorWords = (reactor: string): string[] =>
	reactor.split(/(?<=[a-z0-9])(?=[A-Z])/);

/**
 * What each connector tool does, without the provider and app its service
 * already names: `MicrosoftOutlookListMail` is List Mail. Every reactor of a
 * service starts with the same words, and those are the ones dropped.
 */
const ACTIONS_BY_REACTOR = new Map(
	CONNECTOR_SERVICES.flatMap((service) => {
		const words = service.tools.map((tool) =>
			splitReactorWords(tool.reactor),
		);
		if (words.length === 0) {
			return [];
		}
		// always leave at least one word of the shortest reactor
		const limit = Math.min(...words.map((reactor) => reactor.length)) - 1;
		let shared = 0;
		while (
			shared < limit &&
			words.every((reactor) => reactor[shared] === words[0][shared])
		) {
			shared++;
		}
		return service.tools.map(
			(tool, index) =>
				[tool.reactor, words[index].slice(shared).join(" ")] as const,
		);
	}),
);

/**
 * A connector tool's title under its service's name: what it does, when its
 * title is the one generated from its reactor. A title someone wrote stays.
 *
 * @param reactor - The reactor the tool runs.
 * @param title - The tool's title.
 * @return The title to show.
 */
export const getConnectorToolTitle = (
	reactor: string,
	title: string,
): string => {
	const action = ACTIONS_BY_REACTOR.get(reactor);
	return action && title.replace(/\s+/g, "") === reactor ? action : title;
};

/**
 * Keep only known service ids, in catalog order and without repeats.
 *
 * @param ids - Candidate ids, possibly from storage.
 * @return The known ids.
 */
export const sanitizeConnectorServices = (
	ids: readonly unknown[],
): ConnectorServiceId[] => {
	const wanted = new Set(ids);
	return CONNECTOR_SERVICES.filter((service) => wanted.has(service.id)).map(
		(service) => service.id,
	);
};

/** One tool in an MCP definition file. */
export type McpTool = Record<string, unknown>;

const getToolMeta = (tool: McpTool): Record<string, unknown> | null =>
	isRecord(tool._meta) ? tool._meta : null;

/**
 * The tools an MCP definition file holds.
 *
 * @param mcpJson - The parsed file, or anything else when there is none.
 * @return Its tools; none for a missing or malformed file.
 */
export const readMcpTools = (mcpJson: unknown): McpTool[] =>
	isRecord(mcpJson) && Array.isArray(mcpJson.tools)
		? mcpJson.tools.filter(isRecord)
		: [];

/**
 * The connector tools in an MCP definition file: those stamped with
 * {@link CONNECTORS_GENERATOR}.
 *
 * @param mcpJson - The parsed file.
 * @return The connector tools, in the file's order.
 */
export const readConnectorTools = (mcpJson: unknown): McpTool[] =>
	readMcpTools(mcpJson).filter(
		(tool) =>
			getToolMeta(tool)?.SMSS_MCP_GENERATOR === CONNECTORS_GENERATOR,
	);

/**
 * Whether a room's tool is one of the connectors': stamped with
 * {@link CONNECTORS_GENERATOR}, or, in a room written before the connectors
 * were kept for the user, a tool a connector service runs.
 *
 * @param tool - A tool from a room's file.
 * @return True for a connector tool.
 */
export const isConnectorTool = (tool: McpTool): boolean => {
	const meta = getToolMeta(tool);
	if (!meta) {
		return false;
	}
	return (
		meta.SMSS_MCP_GENERATOR === CONNECTORS_GENERATOR ||
		(typeof meta.SMSS_FUNCTION_NAME === "string" &&
			findConnectorTool(meta.SMSS_FUNCTION_NAME) !== undefined)
	);
};

/**
 * Which services some tools switch on: those with a tool present and not
 * `disabled`.
 *
 * @param tools - Tools from an MCP definition file.
 * @return The services, in catalog order.
 */
export const getConnectorServices = (
	tools: readonly McpTool[],
): ConnectorServiceId[] => {
	const enabled = new Set<ConnectorServiceId>();
	for (const tool of tools) {
		const meta = getToolMeta(tool);
		const reactor = meta?.SMSS_FUNCTION_NAME;
		if (
			!meta ||
			typeof reactor !== "string" ||
			meta.SMSS_MCP_EXECUTION === "disabled"
		) {
			continue;
		}
		const connector = findConnectorTool(reactor);
		if (connector) {
			enabled.add(connector.service.id);
		}
	}
	return sanitizeConnectorServices([...enabled]);
};

/**
 * A room's tool file with its connector tools replaced by the user's, and every
 * other tool kept as it is.
 *
 * @param roomMcpJson - The room's parsed `mcp/pixel_mcp.json`, or null when it
 * has none.
 * @param userTools - The user's connector tools.
 * @return The file to write, or null when the room already holds exactly the
 * user's connector tools.
 */
export const mergeUserConnectorTools = (
	roomMcpJson: unknown,
	userTools: readonly McpTool[],
): Record<string, unknown> | null => {
	const roomTools = readMcpTools(roomMcpJson);
	const current = roomTools.filter(isConnectorTool);
	if (JSON.stringify(current) === JSON.stringify(userTools)) {
		return null;
	}
	const file = isRecord(roomMcpJson) ? roomMcpJson : {};
	return {
		...file,
		tools: [
			...userTools,
			...roomTools.filter((tool) => !isConnectorTool(tool)),
		],
		_meta: {
			...(isRecord(file._meta) ? file._meta : {}),
			last_modified_date: new Date().toISOString().slice(0, 10),
		},
	};
};

/**
 * The tools the user's connector file holds for the services switched on:
 * every tool of each service, with how it runs. Nothing switched on gives no
 * tools, which empties the connectors out of the file.
 *
 * Tools that ask first are shown inline in the conversation, where their
 * approval card sits next to the message that proposed them.
 *
 * @param services - The services to switch on.
 * @return The tools to write with `MakeUserPixelMCP`.
 */
export const buildUserConnectorTools = (
	services: readonly ConnectorServiceId[],
): UserPixelMcpTool[] =>
	CONNECTOR_SERVICES.filter((service) =>
		services.includes(service.id),
	).flatMap((service) =>
		service.tools.map((tool) => ({
			reactor: tool.reactor,
			// a reactor that names its own view keeps where it shows it; the rest show
			// a call that asks inline, where its Allow is
			metadata: tool.declaresView
				? { SMSS_MCP_EXECUTION: tool.execution }
				: {
						SMSS_MCP_EXECUTION: tool.execution,
						SMSS_MCP_UI: {
							displayLocation:
								tool.execution === "ask" ? "inline" : "sidebar",
						},
					},
		})),
	);
