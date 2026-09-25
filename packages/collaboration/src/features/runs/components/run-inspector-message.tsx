import { Muted, P } from "@semoss/ui/next";
import { MessageMarkdown } from "@/features/messages/components/message-markdown";
import type { ConversationMessage } from "@/features/messages/types/message";

/** Durable child history stays read-only; actionable approvals live in the room queue. */
export function RunInspectorMessage({
	message,
}: {
	message: ConversationMessage;
}) {
	return (
		<article
			className="space-y-2 border-t pt-3"
			aria-label={
				message.role === "user" ? "Run input" : "Agent response"
			}
		>
			<Muted className="text-xs">
				{message.role === "user" ? "Input" : "Agent"}
			</Muted>
			{message.parts.map((part, index) => {
				const key = part.renderKey ?? `${message.id}:${index}`;
				if (part.type === "text")
					return (
						<MessageMarkdown
							key={key}
							text={part.text}
							isStreaming={false}
						/>
					);
				if (part.type === "thinking")
					return (
						<details key={key}>
							<summary className="cursor-pointer text-sm">
								Reasoning summary
							</summary>
							<P className="whitespace-pre-wrap text-sm">
								{part.text}
							</P>
						</details>
					);
				if (part.type === "tool")
					return (
						<details
							key={part.tool.id}
							className="rounded-md border p-2"
						>
							<summary className="cursor-pointer text-sm">
								{part.tool.title} ·{" "}
								{part.tool.status
									.toLowerCase()
									.replaceAll("_", " ")}
							</summary>
							<pre className="max-h-80 overflow-auto whitespace-pre-wrap break-words p-2 text-xs">
								{JSON.stringify(part.tool.arguments, null, 2)}
								{part.tool.error || part.tool.output
									? `\n\n${part.tool.error ?? part.tool.output}`
									: ""}
							</pre>
						</details>
					);
				if (part.type === "media")
					return (
						<P key={key} className="text-sm">
							Attachment: {part.fileName}
						</P>
					);
				return null;
			})}
		</article>
	);
}
