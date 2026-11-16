import {
	CONNECTOR_PROVIDERS,
	CONNECTOR_SERVICES,
	type ConnectorProviderId,
	type ConnectorService,
	findConnectorTool,
	getConnectorToolTitle,
} from "@/features/connectors/connector.catalog";
import type { ConnectorsStore } from "@/features/connectors/connectors.store";
import type { ToolboxTool } from "./chat-tool-info";

/**
 * Why a connector's tools cannot run: the session is not signed in to its
 * account, the server offers no sign in for that account, or the server's sign
 * in does not allow the app. Only the first is fixed by signing in.
 */
export type ConnectorAccessIssue = "signIn" | "notOffered" | "notCovered";

/** The order access issues are explained in. */
const ACCESS_ISSUES: readonly ConnectorAccessIssue[] = [
	"signIn",
	"notOffered",
	"notCovered",
];

/** What the grouping needs to know about the room's connector access. */
export type ConnectorAccess = Pick<
	ConnectorsStore,
	"isProviderOffered" | "isServiceCovered" | "connectedProviders"
>;

/** One service's tools in the room's toolbox. */
interface ConnectorToolGroup {
	/** The service, such as Outlook. */
	service: ConnectorService;
	/** The service's name, as the user reads it. */
	label: string;
	/** Why its tools cannot run right now, if anything stops them. */
	issue: ConnectorAccessIssue | null;
	/** Its tools, titled by what each does. */
	tools: ToolboxTool[];
}

/** One account's problem, naming every app in the toolbox it stops. */
interface ConnectorAccessNotice {
	providerId: ConnectorProviderId;
	issue: ConnectorAccessIssue;
	/** The names of the services it stops, in display order. */
	serviceNames: string[];
}

/** A room toolbox's tools, by connector service. */
interface GroupedConnectorTools {
	/** The services with tools in the toolbox, by name. */
	groups: ConnectorToolGroup[];
	/** The toolbox's tools that are not a connector's. */
	otherTools: ToolboxTool[];
	/** One per account and problem, by provider then issue. */
	notices: ConnectorAccessNotice[];
}

/**
 * Why a service's tools cannot run right now, if anything stops them.
 * Nothing is said about the sign in until the logins have been read.
 *
 * @param access - The room's connector access.
 * @param service - The service.
 * @return The issue, or null when its tools can run.
 */
const getConnectorAccessIssue = (
	access: ConnectorAccess,
	service: ConnectorService,
): ConnectorAccessIssue | null => {
	if (!access.isProviderOffered(service.provider)) {
		return "notOffered";
	}
	if (!access.isServiceCovered(service.id)) {
		return "notCovered";
	}
	const connected = access.connectedProviders;
	return connected !== null && !connected.includes(service.provider)
		? "signIn"
		: null;
};

/**
 * Sort a room toolbox's tools under their connector service. A tool belongs
 * to a service when the reactor it runs is one the catalog lists for it,
 * whatever the tool is called, so a tool the user wrote that runs some other
 * reactor lands in `otherTools`.
 *
 * @param tools - The toolbox's tools.
 * @param access - The room's connector access.
 * @param getServiceLabel - A service's name, as the user reads it.
 * @return The services with tools, the other tools, and the access notices.
 */
export const groupConnectorTools = (
	tools: ToolboxTool[],
	access: ConnectorAccess,
	getServiceLabel: (service: ConnectorService) => string,
): GroupedConnectorTools => {
	const groups = CONNECTOR_SERVICES.map((service) => ({
		service: service,
		label: getServiceLabel(service),
		issue: getConnectorAccessIssue(access, service),
		tools: tools
			.filter(
				(tool) =>
					findConnectorTool(tool.reactor)?.service.id === service.id,
			)
			.map((tool) => ({
				...tool,
				title: getConnectorToolTitle(tool.reactor, tool.title),
			})),
	}))
		.filter((group) => group.tools.length > 0)
		.sort((first, second) => first.label.localeCompare(second.label));

	const notices = CONNECTOR_PROVIDERS.flatMap((provider) =>
		ACCESS_ISSUES.flatMap((issue) => {
			const serviceNames = groups
				.filter(
					(group) =>
						group.service.provider === provider.id &&
						group.issue === issue,
				)
				.map((group) => group.label);
			return serviceNames.length > 0
				? [
						{
							providerId: provider.id,
							issue: issue,
							serviceNames: serviceNames,
						},
					]
				: [];
		}),
	);

	return {
		groups: groups,
		otherTools: tools.filter((tool) => !findConnectorTool(tool.reactor)),
		notices: notices,
	};
};
