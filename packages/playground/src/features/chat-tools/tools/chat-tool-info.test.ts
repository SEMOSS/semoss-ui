import { describe, expect, test } from "vitest";
import { listToolParameters, parseMcpTools } from "./chat-tool-info";

describe("parseMcpTools", () => {
	test("reads a room's tool file with how each tool runs, leaving out switched off ones", () => {
		const tools = parseMcpTools({
			tools: [
				{
					name: "MicrosoftOutlookListMail",
					title: "Microsoft Outlook List Mail",
					description: "Read the mail.",
					inputSchema: {
						type: "object",
						properties: {
							limit: { description: "Most to return." },
						},
						required: [],
					},
					_meta: {
						SMSS_FUNCTION_NAME: "MicrosoftOutlookListMail",
						SMSS_MCP_EXECUTION: "auto",
					},
				},
				{
					name: "MicrosoftOutlookSendMail",
					_meta: {
						SMSS_FUNCTION_NAME: "MicrosoftOutlookSendMail",
						SMSS_MCP_EXECUTION: "ask",
					},
				},
				{
					name: "MicrosoftOutlookListMailFolders",
					_meta: { SMSS_MCP_EXECUTION: "disabled" },
				},
				{ title: "no name" },
			],
		});

		expect(tools.map((tool) => [tool.name, tool.execution])).toEqual([
			["MicrosoftOutlookListMail", "auto"],
			["MicrosoftOutlookSendMail", "ask"],
		]);
		expect(tools[0].parameters).toEqual([
			{
				name: "limit",
				description: "Most to return.",
				isRequired: false,
			},
		]);
		expect(tools[1].title).toBe("MicrosoftOutlookSendMail");
		expect(parseMcpTools(null)).toEqual([]);
	});

	test("reads a toolbox's tools as GetMCPTools returns them", () => {
		const tools = parseMcpTools({
			tools: [
				{
					name: "search_web",
					title: "Search the Web",
					description: "Searches the web.",
					inputSchema: {
						properties: { query: { description: "What to find." } },
						required: ["query"],
					},
					_meta: { SMSS_MCP_EXECUTION: "ask" },
				},
				{ name: "fetch_page" },
			],
		});

		expect(
			tools.map((tool) => [tool.title, tool.execution, tool.reactor]),
		).toEqual([
			["Search the Web", "ask", "search_web"],
			["fetch_page", "auto", "fetch_page"],
		]);
		expect(tools[0].parameters).toEqual([
			{ name: "query", description: "What to find.", isRequired: true },
		]);
		expect(parseMcpTools({ tools: "none" })).toEqual([]);
	});
});

describe("listToolParameters", () => {
	test("lists required arguments first", () => {
		expect(
			listToolParameters({
				type: "object",
				properties: { offset: {}, path: { description: "Where." } },
				required: ["path"],
			}).map((parameter) => [parameter.name, parameter.isRequired]),
		).toEqual([
			["path", true],
			["offset", false],
		]);
		expect(listToolParameters(undefined)).toEqual([]);
	});
});
