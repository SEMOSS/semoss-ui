import { render, screen } from "@testing-library/react";
import type { ConversationTool } from "@/features/messages/types/message";
import { EmailDraftCard, isEmailDraftTool } from "./email-draft-card";

function draftTool(
	overrides: Partial<ConversationTool> = {},
): ConversationTool {
	return {
		id: "tool",
		parentMessageId: "message",
		name: "MicrosoftOutlookSaveDraft",
		title: "Save email draft",
		arguments: {
			to: "a@example.com, b@example.com",
			cc: ["c@example.com"],
			subject: "Quarterly update",
			message: "Hi team,\n\nHere is the update.",
			html: "false",
		},
		status: "COMPLETED",
		output: JSON.stringify({
			savedDraftId: "draft-1",
			webLink: "https://outlook.office.com/mail/deeplink/draft-1",
		}),
		...overrides,
	};
}

describe("isEmailDraftTool", () => {
	it("matches the reactor name, the original MCP name, and a prefixed MCP name", () => {
		expect(isEmailDraftTool(draftTool({ name: "SaveDraft" }))).toBe(true);
		expect(
			isEmailDraftTool(
				draftTool({
					name: "tool-1",
					metadata: {
						SMSS_ORIGINAL_TOOL_NAME: "mcp__outlook__SaveDraft",
					},
				}),
			),
		).toBe(true);
		expect(
			isEmailDraftTool(
				draftTool({
					name: "tool-1",
					metadata: { SMSS_FUNCTION_NAME: "SaveDraft" },
				}),
			),
		).toBe(true);
		expect(isEmailDraftTool(draftTool())).toBe(true);
	});

	it("ignores unrelated tools", () => {
		expect(
			isEmailDraftTool(draftTool({ name: "MicrosoftOutlookSendMail" })),
		).toBe(false);
		expect(isEmailDraftTool(draftTool({ name: "SaveDraftReply" }))).toBe(
			false,
		);
	});
});

describe("EmailDraftCard", () => {
	it("renders recipients, subject, body, and the Outlook link from the tool output", () => {
		render(<EmailDraftCard tool={draftTool()} />);
		expect(screen.getByText("Email draft")).toBeVisible();
		expect(screen.getByText("Saved to Outlook drafts")).toBeVisible();
		expect(screen.getByText("a@example.com, b@example.com")).toBeVisible();
		expect(screen.getByText("c@example.com")).toBeVisible();
		expect(screen.getByText("Quarterly update")).toBeVisible();
		expect(screen.getByText("Hi team,", { exact: false })).toBeVisible();
		const link = screen.getByRole("link", { name: /open in outlook/i });
		expect(link).toHaveAttribute(
			"href",
			"https://outlook.office.com/mail/deeplink/draft-1",
		);
		expect(link).toHaveAttribute("target", "_blank");
	});

	it("shows a failed state with the error instead of the Outlook link", () => {
		render(
			<EmailDraftCard
				tool={draftTool({
					status: "FAILED",
					error: "Outlook rejected the request.",
					output: undefined,
				})}
			/>,
		);
		expect(
			screen.getByText(
				"Could not save draft: Outlook rejected the request.",
			),
		).toBeVisible();
		expect(
			screen.queryByRole("link", { name: /open in outlook/i }),
		).not.toBeInTheDocument();
	});
});
