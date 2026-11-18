import { describe, expect, test } from "vitest";
import type { ToolboxTool } from "./chat-tool-info";
import {
	type ConnectorAccess,
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

describe("a service's access issue", () => {
	const outlookIssue = (overrides: Partial<ConnectorAccess>) =>
		groupConnectorTools(
			[tool("MicrosoftOutlookListMail")],
			access(overrides),
			label,
		).groups[0].issue;

	test("says what stops a service's tools, the server's limits first", () => {
		expect(
			outlookIssue({
				isProviderOffered: () => false,
				connectedProviders: [],
			}),
		).toBe("notOffered");
		expect(outlookIssue({ isServiceCovered: () => false })).toBe(
			"notCovered",
		);
		expect(outlookIssue({ connectedProviders: [] })).toBe("signIn");
		expect(outlookIssue({})).toBeNull();
	});

	test("says nothing about signing in until the logins are read", () => {
		expect(outlookIssue({ connectedProviders: null })).toBeNull();
	});
});
