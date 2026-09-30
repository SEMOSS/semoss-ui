import { describe, expect, test } from "vitest";
import {
	buildUserConnectorToolsPixel,
	CONNECTOR_PROVIDERS,
	CONNECTOR_SERVICES,
	CONNECTORS_GENERATOR,
	findConnectorTool,
	getConnectorServices,
	isConnectorTool,
	mergeUserConnectorTools,
	readConnectorTools,
	sanitizeConnectorServices,
	USER_CONNECTORS_PATH,
} from "./connector.catalog";

/** A tool as a generator writes it into an MCP definition file. */
const tool = (reactor: string, generator: string, execution = "auto") => ({
	name: reactor,
	_meta: {
		SMSS_FUNCTION_NAME: reactor,
		SMSS_MCP_EXECUTION: execution,
		SMSS_MCP_GENERATOR: generator,
	},
});

/** Pull the reactor and metadata lists back out of a built pixel. */
const readPixel = (pixel: string) => {
	const reactors = JSON.parse(
		pixel.match(/reactor=(\[.*?\]), mcpMetadata=/)?.[1] ?? "[]",
	) as string[];
	const metadata = JSON.parse(
		pixel.match(/mcpMetadata=(\[.*\]), generator=/)?.[1] ?? "[]",
	) as Record<string, unknown>[];
	return { reactors: reactors, metadata: metadata };
};

describe("catalog", () => {
	test("every service belongs to a provider that lists it", () => {
		for (const service of CONNECTOR_SERVICES) {
			const provider = CONNECTOR_PROVIDERS.find(
				(candidate) => candidate.id === service.provider,
			);
			expect(provider?.services).toContain(service.id);
		}
	});

	test("reactors are unique across services", () => {
		const reactors = CONNECTOR_SERVICES.flatMap((service) =>
			service.tools.map((tool) => tool.reactor),
		);
		expect(new Set(reactors).size).toBe(reactors.length);
	});

	test("sending, deleting, and sharing always ask first", () => {
		for (const reactor of [
			"MicrosoftOutlookSendMail",
			"MicrosoftOutlookDeleteMail",
			"MicrosoftOneDriveShareFile",
			"MicrosoftCalendarCreateEvent",
			"MicrosoftTeamsSendChatMessage",
			"GoogleGmailSendEmail",
			"GoogleDriveDelete",
		]) {
			expect(findConnectorTool(reactor)?.tool.execution).toBe("ask");
		}
	});

	test("leaves out reactors that touch arbitrary server paths", () => {
		expect(findConnectorTool("GoogleDriveDownload")).toBeUndefined();
		expect(findConnectorTool("GoogleDriveUpload")).toBeUndefined();
	});

	test("sanitize keeps known ids in catalog order", () => {
		expect(
			sanitizeConnectorServices(["gmail", "unknown", "outlook", "gmail"]),
		).toEqual(["outlook", "gmail"]);
	});
});

describe("the user's connector tools", () => {
	test("are the tools stamped as the connectors', and switch on their services", () => {
		const tools = readConnectorTools({
			tools: [
				tool("MicrosoftOutlookListMail", CONNECTORS_GENERATOR),
				tool("MicrosoftOutlookSendMail", CONNECTORS_GENERATOR, "ask"),
				tool("GoogleGmailList", CONNECTORS_GENERATOR, "disabled"),
				tool("MyCustomReactor", "MakeRoomPixelMCP"),
			],
		});

		expect(tools.map((entry) => entry.name)).toEqual([
			"MicrosoftOutlookListMail",
			"MicrosoftOutlookSendMail",
			"GoogleGmailList",
		]);
		expect(getConnectorServices(tools)).toEqual(["outlook"]);
		expect(readConnectorTools(undefined)).toEqual([]);
		expect(readConnectorTools({ tools: "nope" })).toEqual([]);
	});

	test("are written into the user's file, stamped as the connectors'", () => {
		const pixel = buildUserConnectorToolsPixel(["gmail"]);
		expect(
			pixel.startsWith(
				`MakeUserPixelMCP(filePath=${JSON.stringify([USER_CONNECTORS_PATH])}`,
			),
		).toBe(true);
		expect(
			pixel.endsWith(
				`generator=${JSON.stringify([CONNECTORS_GENERATOR])});`,
			),
		).toBe(true);

		const { reactors, metadata } = readPixel(pixel);
		const gmail = CONNECTOR_SERVICES.find(
			(service) => service.id === "gmail",
		);
		expect(reactors).toEqual(gmail?.tools.map((entry) => entry.reactor));
		expect(metadata[reactors.indexOf("GoogleGmailSendEmail")]).toEqual({
			SMSS_MCP_EXECUTION: "ask",
			SMSS_MCP_UI: { displayLocation: "inline" },
		});
	});

	test("switching everything off names no reactors, which empties them out", () => {
		expect(buildUserConnectorToolsPixel([])).toBe(
			`MakeUserPixelMCP(filePath=${JSON.stringify([USER_CONNECTORS_PATH])}, generator=${JSON.stringify([CONNECTORS_GENERATOR])});`,
		);
	});
});

describe("a room's copy of the user's connector tools", () => {
	const user = [tool("MicrosoftOutlookListMail", CONNECTORS_GENERATOR)];
	const custom = tool("MyCustomReactor", "MakeRoomPixelMCP");
	const playwright = tool("PlaywrightNavigate", "MakeRoomPlaywrightMCP");

	test("replaces the room's connector tools and keeps every other tool", () => {
		const merged = mergeUserConnectorTools(
			{
				tools: [
					// written before the connectors were kept for the user
					tool("GoogleGmailSendEmail", "MakeRoomPixelMCP", "ask"),
					custom,
					playwright,
				],
				_meta: { last_modified_date: "2026-01-01" },
			},
			user,
		);

		expect(merged?.tools).toEqual([...user, custom, playwright]);
		expect(merged?._meta).toEqual({
			last_modified_date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
		});
		expect(isConnectorTool(custom)).toBe(false);
		expect(isConnectorTool(playwright)).toBe(false);
	});

	test("is only written when the room does not hold the user's tools", () => {
		expect(
			mergeUserConnectorTools({ tools: [...user, custom] }, user),
		).toBeNull();
		expect(mergeUserConnectorTools(null, [])).toBeNull();
		expect(mergeUserConnectorTools(null, user)?.tools).toEqual(user);
	});
});
