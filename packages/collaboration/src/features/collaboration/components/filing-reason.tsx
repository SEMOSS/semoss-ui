import { cn } from "@semoss/ui/next";
import { filingReason } from "../filing-reason";
import type { ThreadTopicLink } from "../state/collaboration.types";
import { useCollaborationSession } from "../state/collaboration-session.context";

/** Why Brain filed a thread under a topic, as plain text the owner can read without opening anything. */
export function FilingReason({
	link,
	label,
	compact = false,
	className,
}: {
	/** The thread's topic link, or a review candidate shaped like one. */
	link: Pick<ThreadTopicLink, "source" | "signals">;
	/** Names the topic when several reasons are shown together. */
	label?: string;
	/** One line: the first reason and the confidence. */
	compact?: boolean;
	className?: string;
}) {
	const { state } = useCollaborationSession();
	const { reasons, confidence } = filingReason(
		link,
		(personId) =>
			state.people.find((person) => person.id === personId)?.name,
	);
	if (!reasons.length) return null;
	const confidenceText =
		confidence === null ? "" : `Confidence ${Math.round(confidence)}%`;
	const heading = label && (
		<span className="font-medium text-foreground">{label}: </span>
	);
	return (
		<div
			className={cn(
				"min-w-0 break-words text-muted-foreground text-xs leading-5",
				className,
			)}
		>
			{compact ? (
				<p>
					{heading}
					{reasons[0]}
					{confidenceText && ` ${confidenceText}.`}
				</p>
			) : (
				<>
					{heading && <p>{heading}</p>}
					<ul className="list-disc space-y-0.5 pl-4">
						{reasons.map((reason) => (
							<li key={reason}>{reason}</li>
						))}
					</ul>
					{confidenceText && (
						<p className="mt-0.5">{confidenceText}.</p>
					)}
				</>
			)}
		</div>
	);
}
