import type { ConversationTool } from "@/features/messages/types/message";
import { getToolComponent } from "./tool-components";

function tool(overrides: Partial<ConversationTool> = {}): ConversationTool {
	return {
		id: "tool",
		parentMessageId: "message",
		name: "MicrosoftOutlookSaveDraft",
		title: "Save email draft",
		arguments: {},
		status: "COMPLETED",
		...overrides,
	};
}

it("reads the component the tool declares", () => {
	expect(
		getToolComponent(
			tool({
				name: "SendMail",
				metadata: { SMSS_MCP_UI: { component: "email-send" } },
			}),
		),
	).toBe("email-send");
	expect(
		getToolComponent(
			tool({
				name: "CreateEvent",
				metadata: { SMSS_MCP_UI: { component: "calendar-event" } },
			}),
		),
	).toBe("calendar-event");
	// a name this page does not know gets the generic view
	expect(
		getToolComponent(
			tool({ metadata: { SMSS_MCP_UI: { component: "sql-query" } } }),
		),
	).toBeUndefined();
});

it("still treats SaveDraft as a draft in history saved without a component", () => {
	expect(getToolComponent(tool({ name: "SaveDraft" }))).toBe("email-draft");
	expect(
		getToolComponent(
			tool({
				name: "tool-1",
				metadata: {
					SMSS_ORIGINAL_TOOL_NAME: "mcp__outlook__SaveDraft",
				},
			}),
		),
	).toBe("email-draft");
	expect(
		getToolComponent(
			tool({
				name: "tool-1",
				metadata: { SMSS_FUNCTION_NAME: "SaveDraft" },
			}),
		),
	).toBe("email-draft");
	expect(getToolComponent(tool())).toBe("email-draft");
});

it("ignores unrelated tools", () => {
	expect(getToolComponent(tool({ name: "MicrosoftOutlookSendMail" }))).toBe(
		undefined,
	);
	expect(getToolComponent(tool({ name: "SaveDraftReply" }))).toBeUndefined();
});

it("lets a tool's own MCP UI win over its component", () => {
	expect(
		getToolComponent(
			tool({
				name: "SendEmail",
				metadata: {
					SMSS_MCP_UI: {
						component: "email-send",
						resourceURI: "https://example.com/send-ui",
					},
				},
			}),
		),
	).toBeUndefined();
	expect(getToolComponent(tool({ name: "SendEmail" }))).toBe("email-send");
});
