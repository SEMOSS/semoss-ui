import type { ConversationTool } from "@/features/messages/types/message";
import { getToolComponent, TOOL_COMPONENTS } from "./tool-components";
import { getDeclaredToolView, resolveToolUiUrl } from "./tool-metadata";

function tool(
	ui?: unknown,
	overrides: Partial<ConversationTool> = {},
): ConversationTool {
	return {
		id: "tool",
		parentMessageId: "message",
		name: "MicrosoftOutlookSaveDraft",
		title: "Save email draft",
		arguments: {},
		status: "COMPLETED",
		metadata: { SMSS_MCP_UI: ui },
		...overrides,
	};
}
it.each(Object.values(TOOL_COMPONENTS))(
	"selects %s solely by resource URI",
	(componentName) => {
		const call = tool(
			{ resourceURI: `component://${componentName}?param1=a%26b&empty=` },
			{ name: "UnrelatedTool", arguments: { param1: "execution data" } },
		);
		expect(getToolComponent(call)).toBe(componentName);
		expect(getDeclaredToolView(call)).toEqual({
			componentName,
			params: { param1: "a&b", empty: "" },
		});
		expect(call.arguments).toEqual({ param1: "execution data" });
		expect(resolveToolUiUrl(call)).toBeUndefined();
	},
);
it.each([
	undefined,
	null,
	[],
	{},
	{ component: "email-draft" },
	{ resourceURI: "" },
	{ resourceURI: 123 },
	{ resourceURI: "component://unknown" },
	{ resourceURI: "component://mail/compose" },
	{ resourceURI: "component://email-compose/" },
	{ resourceURI: "https://example.test/send-ui", component: "email-send" },
	{ resourceURI: "system://forms/search", component: "email-send" },
])("uses the generic view for unsupported declarations %j", (ui) => {
	expect(getToolComponent(tool(ui))).toBeUndefined();
});
it.each(["SaveDraft", "ComposeEmail", "SendEmail", "Remember", "Forget"])(
	"does not infer a view from historical name %s",
	(name) => {
		expect(getToolComponent(tool(undefined, { name }))).toBeUndefined();
		expect(
			getToolComponent(
				tool(undefined, {
					metadata: {
						SMSS_ORIGINAL_TOOL_NAME: `mcp__outlook__${name}`,
						SMSS_FUNCTION_NAME: name,
					},
				}),
			),
		).toBeUndefined();
	},
);
it("ignores legacy component and tool-kind selectors even when they conflict", () => {
	expect(
		getToolComponent(
			tool({
				component: "email-send",
				resourceURI: "component://email-compose",
			}),
		),
	).toBe("email-compose");
	expect(
		getToolComponent(
			tool(undefined, {
				metadata: { SMSS_TOOL_KIND: "semoss_delegate_to_person" },
			}),
		),
	).toBeUndefined();
});
it.each(["component://", "component://mail/compose", " COMPONENT://unknown "])(
	"never resolves component resource %s as a portal",
	(resourceURI) => {
		const call = tool(undefined, {
			metadata: {
				SMSS_ENGINE_ID: "project",
				SMSS_MCP_UI: { resourceURI },
			},
		});
		expect(resolveToolUiUrl(call)).toBeUndefined();
		expect(resolveToolUiUrl(call, true)).toBeUndefined();
	},
);
it("retains HTTP, system, portal, and Blocks resources", () => {
	expect(
		resolveToolUiUrl(tool({ resourceURI: "https://example.test/send-ui" })),
	).toBe("https://example.test/send-ui");
	expect(
		resolveToolUiUrl(tool({ resourceURI: "system://forms/search" })),
	).toBe("../../forms/dist/search");
	const call = tool(undefined, {
		metadata: {
			SMSS_ENGINE_ID: "project",
			SMSS_MCP_UI: { resourceURI: "page" },
		},
	});
	expect(resolveToolUiUrl(call)).toContain(
		"/public_home/project/portals/page",
	);
	expect(resolveToolUiUrl(call, true)).toContain("/#/s/project/page");
});
