import { describe, expect, test } from "vitest";
import { CONNECTOR_SERVICES } from "@/features/connectors/connector.catalog";
import type { ToolboxTool } from "./chat-tool-info";
import {
	type ConnectorAccess,
	getConnectorAccessIssue,
	groupConnectorTools,
} from "./group-connector-tools";

const tool = (reactor: string, title = reactor): ToolboxTool => ({
	name: reactor,
	reactor: reactor,
	title: title,
	description: "",
	execution: "auto",
	parameters: [],
});

const access = (overrides: Partial<ConnectorAccess> = {}): ConnectorAccess => ({
	isProviderOffered: () => true,
	isServiceCovered: () => true,
	connectedProviders: ["MICROSOFT", "GOOGLE"],
	...overrides,
});

const label = (service: { id: string }): string => `name:${service.id}`;

describe("groupConnectorTools", () => {
	test("puts each tool under the service its reactor belongs to, by name, and the rest in other tools", () => {
		const { groups, otherTools, notices } = groupConnectorTools(
			[
				tool("MicrosoftOutlookListMail"),
				tool("GoogleGmailSendMail"),
				tool("lookup", "Look Up"),
			],
			access(),
			label,
		);

		expect(groups.map((group) => group.service.id)).toEqual([
			"gmail",
			"outlook",
		]);
		// a connector tool is titled by what it does, without its app's name
		expect(groups[1].tools.map((each) => each.title)).toEqual([
			"List Mail",
		]);
		expect(otherTools.map((each) => each.title)).toEqual(["Look Up"]);
		expect(notices).toEqual([]);
	});

	test("gives one notice per account and problem, naming every service it stops", () => {
		const { groups, notices } = groupConnectorTools(
			[
				tool("MicrosoftOutlookListMail"),
				tool("MicrosoftCalendarListEvents"),
				tool("GoogleGmailListMail"),
			],
			access({ connectedProviders: ["GOOGLE"] }),
			label,
		);

		expect(groups.map((group) => [group.service.id, group.issue])).toEqual([
			["gmail", null],
			["outlook", "signIn"],
			["outlook-calendar", "signIn"],
		]);
		expect(notices).toEqual([
			{
				providerId: "MICROSOFT",
				issue: "signIn",
				serviceNames: ["name:outlook", "name:outlook-calendar"],
			},
		]);
	});
});

describe("getConnectorAccessIssue", () => {
	const [outlook] = CONNECTOR_SERVICES;

	test("says what stops a service's tools, the server's limits first", () => {
		expect(
			getConnectorAccessIssue(
				access({
					isProviderOffered: () => false,
					connectedProviders: [],
				}),
				outlook,
			),
		).toBe("notOffered");
		expect(
			getConnectorAccessIssue(
				access({ isServiceCovered: () => false }),
				outlook,
			),
		).toBe("notCovered");
		expect(
			getConnectorAccessIssue(
				access({ connectedProviders: [] }),
				outlook,
			),
		).toBe("signIn");
		expect(getConnectorAccessIssue(access(), outlook)).toBeNull();
	});

	test("says nothing about signing in until the logins are read", () => {
		expect(
			getConnectorAccessIssue(
				access({ connectedProviders: null }),
				outlook,
			),
		).toBeNull();
	});
});
