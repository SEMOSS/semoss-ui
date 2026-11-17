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
type ConnectorToolExecution = "auto" | "ask";

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
	/** The service. */
	id: ConnectorServiceId;
	/** The account it signs in with. */
	provider: ConnectorProviderId;
	/**
	 * Key `connectorAccess` in `/api/config` reports the service under, within
	 * its provider.
	 */
	accessKey: string;
	/** The reactors it exposes as tools, with how each runs. */
	tools: readonly ConnectorTool[];
}

/** How the UI and the backend refer to a provider. */
export interface ConnectorProvider {
	/** The provider. */
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
 * One operation a service offers, and whether it asks first. Read tools run on
 * their own; anything that sends, invites, shares, uploads, moves, or deletes
 * asks first, so the assistant can prepare it but never do it behind the
 * user's back.
 */
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
 * @param declaresView - Whether the reactors name their own view, as every
 * mail and calendar reactor does.
 * @returns The app's tools.
 */
const operationTools = (
	prefix: string,
	operations: readonly ConnectorOperation[],
	declaresView = false,
): ConnectorTool[] =>
	operations.map(([operation, execution]) => ({
		reactor: `${prefix}${operation}`,
		execution: execution,
		...(declaresView ? { declaresView: true } : {}),
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
		tools: operationTools("MicrosoftOutlook", MAIL_OPERATIONS, true),
	},
	{
		id: "outlook-calendar",
		provider: "MICROSOFT",
		accessKey: "calendar",
		tools: operationTools("MicrosoftCalendar", CALENDAR_OPERATIONS, true),
	},
	{
		id: "onedrive",
		provider: "MICROSOFT",
		accessKey: "onedrive",
		tools: operationTools("MicrosoftOneDrive", [
			["ListDrives", "auto"],
			["ListFiles", "auto"],
			["ListSharedFiles", "auto"],
			["SearchFiles", "auto"],
			["GetFile", "auto"],
			["DownloadFile", "auto"],
			["CreateFolder", "ask"],
			["UploadFile", "ask"],
			["ShareFile", "ask"],
			["DeleteFile", "ask"],
		]),
	},
	{
		id: "teams",
		provider: "MICROSOFT",
		accessKey: "teams",
		tools: operationTools("MicrosoftTeams", [
			["ListTeams", "auto"],
			["ListChannels", "auto"],
			["ListFiles", "auto"],
			["DownloadFile", "auto"],
			["ListChats", "auto"],
			["GetChat", "auto"],
			["ListChatMessages", "auto"],
			["SearchMessages", "auto"],
			["GetChatMessage", "auto"],
			["ListChannelMessages", "auto"],
			["GetChannelMessage", "auto"],
			["DownloadMessageAttachment", "auto"],
			["UploadFile", "ask"],
			["CreateChat", "ask"],
			["SendChatMessage", "ask"],
			["SendChannelMessage", "ask"],
			["DeleteChatMessage", "ask"],
			["DeleteChannelMessage", "ask"],
		]),
	},
	{
		id: "gmail",
		provider: "GOOGLE",
		accessKey: "gmail",
		tools: [
			...operationTools("GoogleGmail", MAIL_OPERATIONS, true),
			...operationTools("GoogleGmail", [["ProfileById", "auto"]]),
		],
	},
	{
		id: "google-calendar",
		provider: "GOOGLE",
		accessKey: "calendar",
		tools: operationTools("GoogleCalendar", CALENDAR_OPERATIONS, true),
	},
	{
		id: "google-drive",
		provider: "GOOGLE",
		accessKey: "drive",
		tools: operationTools("GoogleDrive", [
			["List", "auto"],
			["Read", "auto"],
			["Delete", "ask"],
		]),
	},
	{
		id: "google-docs",
		provider: "GOOGLE",
		accessKey: "docs",
		tools: operationTools("GoogleDocs", [
			["List", "auto"],
			["Read", "auto"],
			["Create", "ask"],
			["Update", "ask"],
			["Delete", "ask"],
		]),
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

/** Each service by its id. */
const SERVICES_BY_ID = new Map(
	CONNECTOR_SERVICES.map((service) => [service.id, service]),
);

/** Each connector tool, with its service, by the reactor it runs. */
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
 * @returns Its catalog entry, or undefined for an unknown id.
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
 * @returns True when the provider can be signed in to.
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
 * @returns Its catalog entry.
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
 * @returns The catalog entry, or undefined when the reactor is not a connector.
 */
export const findConnectorTool = (
	reactor: string | undefined,
): { service: ConnectorService; tool: ConnectorTool } | undefined =>
	reactor ? TOOLS_BY_REACTOR.get(reactor) : undefined;

/**
 * What each connector tool does, without the provider and app its service
 * already names: `MicrosoftOutlookListMail` is List Mail. Every reactor of a
 * service starts with the same words, and those are the ones dropped.
 */
const ACTIONS_BY_REACTOR = new Map(
	CONNECTOR_SERVICES.flatMap((service) => {
		// each reactor's words: `MicrosoftOutlookListMail` is Microsoft Outlook List Mail
		const words = service.tools.map((tool) =>
			tool.reactor.split(/(?<=[a-z0-9])(?=[A-Z])/),
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
 * @returns The title to show.
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
 * @returns The known ids.
 */
export const sanitizeConnectorServices = (
	ids: readonly unknown[],
): ConnectorServiceId[] => {
	const wanted = new Set(ids);
	return CONNECTOR_SERVICES.filter((service) => wanted.has(service.id)).map(
		(service) => service.id,
	);
};
