import { fireEvent, render, screen } from "@testing-library/react";
import type { ConversationTool } from "@/features/messages/types/message";
import { EmailDraftCard } from "./email-draft-card";

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

describe("EmailDraftCard", () => {
	it("renders recipients, subject, body, and the Outlook link from the tool output", () => {
		render(<EmailDraftCard tool={draftTool()} />);
		expect(screen.getByText("Your Outlook account")).toBeVisible();
		expect(screen.getByText("Saved to Outlook drafts")).toBeVisible();
		fireEvent.click(screen.getByText("Recipients"));
		expect(screen.getByText("b@example.com")).toBeVisible();
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

	it("labels a sent email by its approval and send state", () => {
		const sent = draftTool({ name: "SendMail", output: undefined });
		const { rerender } = render(
			<EmailDraftCard
				tool={{ ...sent, status: "INPUT_REQUIRED" }}
				mode="send"
			/>,
		);
		expect(
			screen.getByText("Waiting for your approval to send"),
		).toBeVisible();
		rerender(<EmailDraftCard tool={sent} mode="send" />);
		expect(screen.getByText("Sent")).toBeVisible();
		rerender(
			<EmailDraftCard
				tool={{ ...sent, status: "REJECTED" }}
				mode="send"
			/>,
		);
		expect(screen.getByText("Not sent")).toBeVisible();
	});
});

it("preserves formatted HTML in an isolated draft preview", () => {
	render(
		<EmailDraftCard
			tool={draftTool({
				arguments: {
					subject: "Rich draft",
					message: "<p><strong>Formatted</strong></p>",
					html: true,
				},
			})}
		/>,
	);
	const frame = screen.getByTitle("Rich draft");
	expect(frame.getAttribute("srcdoc")).toContain(
		"<strong>Formatted</strong>",
	);
	expect(frame.getAttribute("sandbox")).not.toContain("allow-scripts");
});
