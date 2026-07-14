import { useState } from "react";
import { MessageFeedbackToolbar } from "@semoss/chat/components";
import { DemoSection } from "../demo-section";
import { DocPage } from "../doc-page";
import { type PropDoc, PropsTable } from "../props-table";

const PROPS: PropDoc[] = [
	{
		name: "rating",
		type: "boolean | undefined",
		description:
			"true = thumbs up, false = thumbs down, undefined = no rating yet.",
	},
	{
		name: "onRate",
		type: "(rating: boolean) => void",
		required: true,
		description:
			"Clicking the already-active rating clears it (toggle-off).",
	},
	{
		name: "textContent",
		type: "string",
		required: true,
		description: "The message's plain text, used by the Copy action.",
	},
	{
		name: "onDownload",
		type: `(format: "word" | "pdf") => Promise<void>`,
		description:
			"Optional — omit to hide the Download action entirely, as MessageBubble does when a host isn't wired up to ChatSession.downloadMessage yet.",
	},
];

export const MessageFeedbackToolbarDoc = () => {
	const [rating, setRating] = useState<boolean | undefined>(undefined);

	return (
		<DocPage
			title="MessageFeedbackToolbar"
			description="Thumbs up/down, copy, and an optional Word/PDF download picker — used internally by MessageBubble, but reusable on its own for a custom message layout."
		>
			<DemoSection
				preview={
					<MessageFeedbackToolbar
						rating={rating}
						onRate={(next) =>
							setRating((prev) =>
								prev === next ? undefined : next,
							)
						}
						textContent="Claim #482 is currently in review. Estimated completion: 3 business days."
						onDownload={() =>
							new Promise((resolve) => setTimeout(resolve, 800))
						}
					/>
				}
				code={`import { MessageFeedbackToolbar } from "@semoss/chat/components";

<MessageFeedbackToolbar
  rating={rating}
  onRate={(next) => setRating((prev) => (prev === next ? undefined : next))}
  textContent={message.parts.map((p) => p.type === "text" ? p.text : "").join("")}
  onDownload={(format) => downloadMessage(message.id, format)}
/>`}
			/>
			<PropsTable props={PROPS} />
		</DocPage>
	);
};
