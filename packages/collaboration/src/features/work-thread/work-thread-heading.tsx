import type { ReactNode } from "react";
import { H1 } from "@semoss/ui/next";
import { channelMeta } from "@/features/collaboration/channel-meta";
import type { Thread } from "@/features/collaboration/state/collaboration.types";

interface WorkThreadHeadingProps {
	/** Current source identity and subject. */
	thread: Thread;
	/** Existing thread actions retain their owner and focus target. */
	children: ReactNode;
}

/** Keeps the thread subject and actions together in a compact header. */
export function WorkThreadHeading({
	thread,
	children,
}: WorkThreadHeadingProps) {
	const { icon: Icon } = channelMeta(thread.channel);
	return (
		<div className="flex min-w-0 flex-1 items-center gap-2">
			<span
				aria-hidden="true"
				className="flex size-6 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary"
			>
				<Icon className="size-4" />
			</span>
			<H1
				className="min-w-0 flex-1 truncate font-medium text-sm"
				title={thread.subject}
			>
				{thread.subject}
			</H1>
			{children}
		</div>
	);
}
