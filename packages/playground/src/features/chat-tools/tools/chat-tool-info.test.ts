import { describe, expect, test } from "vitest";
import { listToolParameters, parseRoomToolbox } from "./chat-tool-info";

describe("parseRoomToolbox", () => {
	test("reads each offered tool with how it runs, leaving out switched off ones", () => {
		const tools = parseRoomToolbox({
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
		expect(parseRoomToolbox(null)).toEqual([]);
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
