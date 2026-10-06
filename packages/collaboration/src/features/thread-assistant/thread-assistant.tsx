import { useInsight } from "@semoss/sdk/react";
import { Spinner } from "@semoss/ui/next";
import type { ThreadAssistantProps } from "./thread-assistant.types";
import { ThreadAssistantSession } from "./thread-assistant-session";

/** Work's assistant uses the same durable agent harness as Playground agent mode. */
export function ThreadAssistant(props: ThreadAssistantProps) {
	const { actions, insightId, isReady } = useInsight();
	if (!isReady)
		return (
			<output className="flex items-center gap-2 p-6">
				<Spinner aria-hidden="true" />
				Connecting Assistant…
			</output>
		);
	return (
		<ThreadAssistantSession
			key={`${insightId}:${props.threadId}`}
			scope={insightId}
			ownerActions={actions}
			{...props}
		/>
	);
}
