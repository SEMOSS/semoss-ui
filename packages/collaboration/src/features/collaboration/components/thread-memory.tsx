import { useState } from "react";
import { Link } from "react-router";
import { useInsight } from "@semoss/sdk/react";
import { P, Small } from "@semoss/ui/next";
import { readThreadRecall, type ThreadRecall } from "../live/live-state";
import type { Thread } from "../state/collaboration.types";
import { useCollaborationSession } from "../state/collaboration-session.context";
import { memoriesAbout } from "../state/memory";
import { MemoryList } from "./memory-list";
import { Section } from "./section";

/** The thread's own memories (its key facts) and what the assistant gets from memory here. */
export function ThreadMemory({ thread }: { thread: Thread }) {
	const { state } = useCollaborationSession();
	const about = { type: "thread" as const, id: thread.id };
	// An unsaved session cannot hold memories of its own.
	const canHold = !thread.id.startsWith("session:");
	return (
		<Section title="Key facts">
			{canHold && (
				<MemoryList
					memories={memoriesAbout(state.memories, about)}
					emptyText="Facts about this thread that the assistant should keep. They are memories, so they last beyond this chat."
					addLabel="New fact"
					about={about}
					isSample={thread.isSample}
				/>
			)}
			{!thread.isSample && <ThreadRecallDetails threadId={thread.id} />}
		</Section>
	);
}

// read when opened: the server picks what applies, by the same rules as the context
function ThreadRecallDetails({ threadId }: { threadId: string }) {
	const { actions } = useInsight();
	const [recall, setRecall] = useState<ThreadRecall | null>(null);
	const [error, setError] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const load = () => {
		setIsLoading(true);
		setError("");
		readThreadRecall(actions, threadId)
			.then(setRecall)
			.catch((cause: unknown) =>
				setError(
					cause instanceof Error
						? cause.message
						: "Memory is unavailable.",
				),
			)
			.finally(() => setIsLoading(false));
	};
	return (
		<details
			className="space-y-3"
			onToggle={(event) => {
				if (event.currentTarget.open) load();
			}}
		>
			<summary className="min-h-9 cursor-pointer font-medium focus-visible:outline-2 focus-visible:outline-ring">
				What the assistant remembers here
				<Small className="block font-normal text-muted-foreground">
					Read each time it answers in this thread
				</Small>
			</summary>
			{isLoading && (
				<Small className="text-muted-foreground">Loading...</Small>
			)}
			{error && <P className="text-destructive text-sm">{error}</P>}
			{recall && !recall.enabled && (
				<P className="text-muted-foreground text-sm">
					Memory is off.{" "}
					<Link
						to="/brain/memory"
						className="underline underline-offset-4"
					>
						Turn it on
					</Link>
				</P>
			)}
			{recall?.enabled && (
				<div className="space-y-2">
					{recall.items.length === 0 && (
						<P className="text-muted-foreground text-sm">
							Nothing applies to this thread yet.
						</P>
					)}
					<ul className="space-y-2">
						{recall.items.map((memory) => (
							<li key={memory.id} className="text-sm leading-6">
								{memory.text}
								<Small className="block font-normal text-muted-foreground text-xs">
									{memory.confirmed
										? "Confirmed"
										: "Learned, not confirmed"}
								</Small>
							</li>
						))}
					</ul>
					{recall.hidden > 0 && (
						<Small className="font-normal text-muted-foreground text-xs">
							{recall.hidden} more did not fit; the assistant can
							search for them.
						</Small>
					)}
					<Link
						to="/brain/memory"
						className="inline-block text-sm underline underline-offset-4"
					>
						Manage memory
					</Link>
				</div>
			)}
		</details>
	);
}
