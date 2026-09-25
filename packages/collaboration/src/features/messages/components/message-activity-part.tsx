import { cn, Muted, Spinner } from "@semoss/ui/next";
import type { ConversationMessage } from "../types/message";
import {
	hasInlineActivity,
	messageActivityLabel,
} from "../utils/message-activity";

/** Stable, compact status region for one live assistant message. */
export function MessageActivityPart({
	message,
}: {
	message: ConversationMessage;
}) {
	const label = messageActivityLabel(message);
	const isContextual = hasInlineActivity(message);
	const announcement =
		label ??
		(message.live?.phase === "completed"
			? "Response complete"
			: message.live?.phase === "cancelled"
				? "Response stopped"
				: message.live?.phase === "awaiting_approval"
					? "Your input is needed"
					: "");

	return (
		<output
			aria-atomic="true"
			className={cn(
				"flex min-h-7 items-center gap-2 text-muted-foreground text-sm",
				(!label || isContextual) && "sr-only",
			)}
		>
			{label && !isContextual && (
				<Spinner
					aria-hidden="true"
					className="size-3.5 shrink-0 motion-reduce:animate-none"
				/>
			)}
			<Muted
				key={announcement}
				className="fade-in animate-in text-sm duration-150 ease-out motion-reduce:animate-none"
			>
				{announcement}
			</Muted>
		</output>
	);
}
