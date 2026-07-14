import { useState } from "react";
import { MessageBubble } from "@semoss/chat/components";
import { DemoSection } from "../demo-section";
import { DocPage } from "../doc-page";
import {
	FEEDBACK_DEMO_MESSAGE,
	SAMPLE_MESSAGES,
	TOOL_CALL_MESSAGE,
} from "../fixtures";
import { type PropDoc, PropsTable } from "../props-table";

const PROPS: PropDoc[] = [
	{
		name: "message",
		type: "ChatMessage",
		required: true,
		description:
			"Rendered part-by-part — text (through @semoss/ui/next's Markdown), tool_call (via ToolCallView), thinking.",
	},
	{
		name: "className",
		type: "string",
		description: "Merged onto the root element via cn().",
	},
	{
		name: "onRate",
		type: "(rating: boolean) => void",
		description:
			"Shows the feedback toolbar's thumbs when provided — only for a completed, non-error assistant message. Clicking the active rating again clears it.",
	},
	{
		name: "onDownload",
		type: `(format: "word" | "pdf") => Promise<void>`,
		description:
			"Adds a Download action to the feedback toolbar, opening a Word/PDF format picker.",
	},
];

export const MessageBubbleDoc = () => {
	const [feedbackMessage, setFeedbackMessage] = useState(
		FEEDBACK_DEMO_MESSAGE,
	);

	return (
		<DocPage
			title="MessageBubble"
			description="Renders one ChatMessage. User messages get a bubble (bg-accent); assistant messages render flush against the page, matching playground's real look. Text renders through @semoss/ui/next's Markdown — code blocks, tables, Mermaid diagrams, and HTML previews all come along for free."
		>
			<DemoSection
				title="User, assistant, and error"
				preview={
					<div className="flex flex-col gap-2">
						<MessageBubble message={SAMPLE_MESSAGES[0]} />
						<MessageBubble message={SAMPLE_MESSAGES[1]} />
						<MessageBubble message={SAMPLE_MESSAGES[2]} />
					</div>
				}
				code={`import { MessageBubble } from "@semoss/chat/components";

<MessageBubble message={userMessage} />
<MessageBubble message={assistantMessage} />
<MessageBubble message={errorMessage} />`}
			/>
			<DemoSection
				title="Inline tool call"
				description="A tool_call part with no matching tool_result yet, on a 'streaming' message, renders inline via ToolCallView."
				preview={<MessageBubble message={TOOL_CALL_MESSAGE} />}
				code={`<MessageBubble message={toolCallMessage} />`}
			/>
			<DemoSection
				title="Feedback toolbar (onRate / onDownload)"
				description="Thumbs up/down, copy, and an optional Download action — shown only for a completed, non-error assistant message."
				preview={
					<MessageBubble
						message={feedbackMessage}
						onRate={(rating) =>
							setFeedbackMessage((prev) => ({
								...prev,
								feedback:
									prev.feedback?.rating === rating
										? undefined
										: { rating },
							}))
						}
						onDownload={() =>
							new Promise((resolve) => setTimeout(resolve, 800))
						}
					/>
				}
				code={`<MessageBubble
  message={message}
  onRate={(rating) => recordFeedback(message.id, rating)}
  onDownload={(format) => downloadMessage(message.id, format)}
/>`}
			/>
			<PropsTable props={PROPS} />
		</DocPage>
	);
};
