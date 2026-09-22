import { ArrowDown, ShieldCheck } from "lucide-react";
import type { RefObject } from "react";
import { useEffect, useState } from "react";
import { Button, Spinner } from "@semoss/ui/next";
import { EmptyView } from "@/components/common/empty-view";
import type { Agent } from "@/features/agents/types/agent";
import { MessageTimelineEntry } from "@/features/messages/components/message-timeline-entry";
import type { ConversationMessage } from "@/features/messages/types/message";

/** Scrollable Playground-style transcript with loading and empty states. */
export function RoomThread({
	agent,
	thread,
	isLoadingHistory,
	bottomRef,
}: {
	agent: Agent;
	thread: ConversationMessage[];
	isLoadingHistory: boolean;
	bottomRef: RefObject<HTMLDivElement | null>;
}) {
	const [scrolledUp, setScrolledUp] = useState(false);
	const latestMessage = thread.at(-1);

	useEffect(() => {
		if (!scrolledUp && latestMessage) {
			bottomRef.current?.scrollIntoView({ block: "end" });
		}
	}, [bottomRef, latestMessage, scrolledUp]);

	return (
		<div className="relative min-h-0 flex-1 overflow-hidden">
			<div
				className="size-full overflow-y-auto px-5 py-4 lg:px-7"
				onScroll={(event) => {
					const target = event.currentTarget;
					setScrolledUp(
						target.scrollHeight -
							target.clientHeight -
							target.scrollTop >
							250,
					);
				}}
			>
				<div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
					{thread.length === 0 && isLoadingHistory && (
						<output className="flex items-center justify-center gap-2 px-5 py-12 text-muted-foreground text-sm">
							<Spinner
								aria-hidden="true"
								className="size-4 motion-reduce:animate-none"
							/>
							Loading this conversation…
						</output>
					)}
					{thread.length === 0 && !isLoadingHistory && (
						<EmptyView
							title={`A fresh start with ${agent.name}`}
							action={
								<span className="flex items-center gap-2 text-muted-foreground text-xs">
									<ShieldCheck
										aria-hidden="true"
										className="size-4"
									/>
									No previous conversation included
								</span>
							}
						>
							What would you like to work on?
						</EmptyView>
					)}
					{thread.map((message) => (
						<MessageTimelineEntry
							key={message.id}
							message={message}
							agent={agent}
						/>
					))}
					<div ref={bottomRef} />
				</div>
			</div>
			{scrolledUp && (
				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={() =>
						bottomRef.current?.scrollIntoView({
							behavior: "smooth",
							block: "end",
						})
					}
					className="-translate-x-1/2 absolute bottom-2 left-1/2 shadow-sm"
				>
					<ArrowDown aria-hidden="true" />
					Latest activity
				</Button>
			)}
		</div>
	);
}
