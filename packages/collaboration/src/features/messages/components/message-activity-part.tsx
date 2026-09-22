import { Spinner } from "@semoss/ui/next";
import type { ConversationMessage } from "../types/message";
import { messageActivityLabel } from "../utils/message-activity";

/** Stable, compact status region for one live assistant message. */
export function MessageActivityPart({
	message,
}: {
	message: ConversationMessage;
}) {
	const label = messageActivityLabel(message);
	if (!label) return null;

	return (
		<output className="flex min-h-7 items-center gap-2 text-muted-foreground text-xs">
			<Spinner
				aria-hidden="true"
				className="size-3.5 shrink-0 motion-reduce:animate-none"
			/>
			<span>{label}</span>
		</output>
	);
}
